import { useEffect, useRef, useState } from 'react';
import {
  Modal,
  Descriptions,
  InputNumber,
  Select,
  Typography,
  message,
  Space,
  Alert,
  Divider,
  Progress,
  Button,
} from 'antd';
import { StopOutlined } from '@ant-design/icons';
import api from '../../../../services/API/api.js';
import { printZpl } from '../../../../utils/qzPrint.js';
import LabelTemplatePreview from './Labeltemplatepreview.jsx';

const { Text } = Typography;

const pad = (value, width) => String(value ?? '').padStart(width, '0');

// Production runs bigger batches than the customer QR flow, so the cap
// stays at what ProductionSerialRuleManager used before this refactor.
const MAX_BATCH_QUANTITY = 5000;

/**
 * Mirrors CustomerQrManager's GenerateQrBatchModal 1:1, adapted to the
 * production_serial_rules domain. Assumed backend contract (add/adjust
 * on the API side to match):
 *
 *   GET  /production-serial-rules/:id/generation-preview
 *        -> { data: {
 *              product_name, part_code, erp_no,
 *              prefix,            // rule's STATIC/PRODUCT_FIELD/DATE segments
 *                                 // already resolved against the real
 *                                 // product + current date bucket
 *              serial_width,      // width of the rule's SERIAL segment
 *              current_bucket,    // e.g. "26-W36", for display only
 *              available_from, available_to, available_count,
 *              printer_id, template_id, // last-used, for preselect
 *            } }
 *
 *   POST /production-qr/:id/generate-batch   (existing endpoint — response
 *        now also needs to include `zpl`, same as customer-serial-rules)
 *        body: { quantity, printer_id, template_id }
 *        -> { data: { qrCodes: [{ id, ... }], zpl } }
 *
 *   POST /production-qr/mark-printed
 *        body: { ids }
 */
export default function GenerateProductionQrBatchModal({ open, rule, onClose, onGenerated }) {
  const [preview, setPreview] = useState(null);
  const [printers, setPrinters] = useState([]);
  const [printerId, setPrinterId] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [templateId, setTemplateId] = useState(null);
  const [quantity, setQuantity] = useState(1);

  const [loadingPreview, setLoadingPreview] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [printProgress, setPrintProgress] = useState(null); // { sent, total }
  const cancelRequestedRef = useRef(false);

  useEffect(() => {
    if (!open || !rule) return;

    setPreview(null);
    setPrinterId(null);
    setTemplateId(null);
    setQuantity(1);
    setPrintProgress(null);
    cancelRequestedRef.current = false;
    setLoadingPreview(true);

    Promise.all([
      api.get(`/production-qr/${rule.id}/generation-preview`),
      api.get('/printers', { params: { active: true } }),
      api.get('/label-templates', { params: { type: 'PRODUCT_QR', active: true } }),
    ])
      .then(([previewRes, printersRes, templatesRes]) => {
        const previewData = previewRes.data.data;
        const printerData = printersRes.data.data ?? printersRes.data;
        const templateData = templatesRes.data.data ?? templatesRes.data;

        setPreview(previewData);
        setPrinters(printerData);
        setTemplates(templateData);

        const defaultQuantity = Math.min(Number(previewData.available_count || 0), 3);
        setQuantity(defaultQuantity || 1);

        // Preselect whatever printer/template this bucket last used.
        if (previewData.printer_id) setPrinterId(previewData.printer_id);
        if (previewData.template_id) setTemplateId(previewData.template_id);
      })
      .catch((err) => {
        message.error(err?.response?.data?.message || 'Failed to load generation preview');
      })
      .finally(() => setLoadingPreview(false));
  }, [open, rule]);

  const buildQr = (serialNo) => {
    if (!preview) return '';
    return `${preview.prefix}${pad(serialNo, preview.serial_width)}`;
  };

  const selectedPrinter = printers.find((printer) => printer.id === printerId);
  const selectedTemplate = templates.find((t) => t.id === templateId);

  const endSerial = preview && quantity ? Number(preview.available_from) + Number(quantity) - 1 : null;

  // Real field values (not editor-style dummy data) for the live preview
  // and for the printed labels themselves — product_serial uses the
  // actual first serial that will be generated. `product_serial` must
  // match the `field` used by the QR element on PRODUCT_QR templates.
  const previewSampleData = preview
    ? {
        product_serial: buildQr(preview.available_from),
        product_name: preview.product_name,
        part_code: preview.part_code,
        erp_no: preview.erp_no,
      }
    : null;

  const handleGenerateAndPrint = async () => {
    if (!preview || !rule) return;

    if (!printerId) {
      message.error('Please select a printer');
      return;
    }

    if (!selectedPrinter) {
      message.error('Selected printer was not found');
      return;
    }

    if (!templateId) {
      message.error('Please select a label template');
      return;
    }

    if (!selectedTemplate) {
      message.error('Selected template was not found');
      return;
    }

    if (
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > preview.available_count
    ) {
      message.error(`Quantity must be between 1 and ${preview.available_count}`);
      return;
    }

    if (quantity > MAX_BATCH_QUANTITY) {
      message.error(`Maximum ${MAX_BATCH_QUANTITY} Product QR codes can be generated at once.`);
      return;
    }

    setGenerating(true);
    cancelRequestedRef.current = false;

    try {
      const { data } = await api.post(`/production-qr/${rule.id}/generate-batch`, {
        quantity,
        printer_id: printerId,
        template_id: templateId,
      });

      const result = data.data;
      const { qrCodes, zpl } = result;

      if (!qrCodes?.length) {
        throw new Error('No QR labels were generated');
      }

      if (!zpl) {
        throw new Error('No ZPL was generated for the selected template');
      }

      // ----------------------------------------------------------
      // Print the complete template-generated ZPL batch
      // ----------------------------------------------------------

      try {
        setPrintProgress({ sent: 0, total: qrCodes.length });

        await printZpl(zpl, selectedPrinter.printer_name);

        setPrintProgress({ sent: qrCodes.length, total: qrCodes.length });
      } catch (printError) {
        console.error('Production QR print failed:', printError);

        message.warning(
          `${qrCodes.length} Product QR codes were generated, but printing failed. You can reprint them from Pending QR Codes.`
        );

        onGenerated?.();
        onClose();
        return;
      }

      // ----------------------------------------------------------
      // Only mark QR records printed after QZ accepts the job
      // ----------------------------------------------------------

      const printedIds = qrCodes.map((qr) => qr.id);

      if (printedIds.length) {
        await api.post('/production-qr/qr-codes/mark-printed', { ids: printedIds });
      }

      message.success(`Generated and printed ${qrCodes.length} Product QR labels`);

      onGenerated?.();
      onClose();
    } catch (err) {
      console.error('Production QR generation failed:', err);

      message.error(
        err?.response?.data?.message || err?.message || 'Product QR generation failed'
      );
    } finally {
      setGenerating(false);
      setPrintProgress(null);
    }
  };

  const stopPrinting = () => {
    cancelRequestedRef.current = true;
  };

  return (
    <Modal
      title="Generate Product QR Labels"
      open={open}
      onCancel={generating ? undefined : onClose}
      closable={!generating}
      maskClosable={!generating}
      onOk={handleGenerateAndPrint}
      okText="Generate & Print"
      confirmLoading={generating}
      okButtonProps={{
        disabled:
          loadingPreview ||
          !preview ||
          !preview.available_count ||
          !printerId ||
          !templateId ||
          quantity < 1 ||
          quantity > MAX_BATCH_QUANTITY,
      }}
      footer={
        printProgress
          ? [
              <Button key="stop" danger icon={<StopOutlined />} onClick={stopPrinting}>
                Stop Printing
              </Button>,
            ]
          : undefined
      }
      destroyOnHidden
      width={680}
    >
      {printProgress && (
        <div style={{ marginBottom: 20 }}>
          <Text strong>
            Printing {printProgress.sent} / {printProgress.total}
          </Text>
          <Progress percent={Math.round((printProgress.sent / printProgress.total) * 100)} status="active" />
          <Text type="secondary">
            Stop takes effect within a few dozen labels, not instantly — whatever's already been sent to the
            printer will still print.
          </Text>
        </div>
      )}

      {loadingPreview && <Text type="secondary">Loading generation information...</Text>}

      {preview && (
        <>
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="Product">{preview.product_name}</Descriptions.Item>
            <Descriptions.Item label="Part Code">
              <Text code>{preview.part_code || '—'}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="ERP">{preview.erp_no || '—'}</Descriptions.Item>
            <Descriptions.Item label="Current Bucket">{preview.current_bucket}</Descriptions.Item>
          </Descriptions>

          {preview.available_count < 1 ? (
            <Alert
              style={{ marginTop: 16 }}
              type="warning"
              message="This week's serial range is exhausted for this rule."
            />
          ) : (
            <>
              <Divider />

              <Descriptions column={1} size="small">
                <Descriptions.Item label="Available Serials">
                  <Text code>{pad(preview.available_from, preview.serial_width)}</Text>
                  <Text type="secondary">{' → '}</Text>
                  <Text code>{pad(preview.available_to, preview.serial_width)}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Available Quantity">
                  {preview.available_count.toLocaleString()}
                </Descriptions.Item>
              </Descriptions>

              <div style={{ marginTop: 20 }}>
                <Text strong>Quantity</Text>
                <InputNumber
                  style={{ width: '100%', marginTop: 6 }}
                  min={1}
                  max={Math.min(preview.available_count, MAX_BATCH_QUANTITY)}
                  value={quantity}
                  onChange={(value) => setQuantity(value || 1)}
                />
                {quantity > MAX_BATCH_QUANTITY && (
                  <div style={{ color: '#ff4d4f', marginTop: 5, fontSize: 13 }}>
                    Maximum {MAX_BATCH_QUANTITY} serial numbers can be generated at once.
                  </div>
                )}
              </div>

              <div style={{ marginTop: 20 }}>
                <Text strong>Printer</Text>
                <Select
                  showSearch
                  optionFilterProp="label"
                  style={{ width: '100%', marginTop: 6 }}
                  placeholder="Select Product QR Printer"
                  value={printerId}
                  onChange={setPrinterId}
                  options={printers.map((printer) => ({
                    value: printer.id,
                    label: `${printer.name} — ${printer.printer_name}`,
                  }))}
                />
              </div>

              <div style={{ marginTop: 20 }}>
                <Text strong>Label Template</Text>
                <Select
                  showSearch
                  optionFilterProp="label"
                  style={{ width: '100%', marginTop: 6 }}
                  placeholder="Select Product QR label template"
                  value={templateId}
                  onChange={setTemplateId}
                  options={templates.map((t) => ({
                    value: t.id,
                    label: `${t.name} — ${t.width}×${t.height} @ ${t.dpi}dpi`,
                  }))}
                  notFoundContent={
                    templates.length === 0
                      ? 'No active PRODUCT_QR templates — create one in Label Templates.'
                      : undefined
                  }
                />
              </div>

              {selectedTemplate && previewSampleData && (
                <div style={{ marginTop: 20 }}>
                  <LabelTemplatePreview template={selectedTemplate} sampleData={previewSampleData} maxWidth={600} />
                </div>
              )}

              {quantity > 0 && endSerial <= preview.available_to && (
                <Alert
                  style={{ marginTop: 20 }}
                  type="info"
                  message="Labels to be generated"
                  description={
                    <Space direction="vertical">
                      <Text code>{buildQr(preview.available_from)}</Text>
                      <Text type="secondary">to</Text>
                      <Text code>{buildQr(endSerial)}</Text>
                      <Text type="secondary">{quantity.toLocaleString()} labels</Text>
                    </Space>
                  }
                />
              )}
            </>
          )}
        </>
      )}
    </Modal>
  );
}
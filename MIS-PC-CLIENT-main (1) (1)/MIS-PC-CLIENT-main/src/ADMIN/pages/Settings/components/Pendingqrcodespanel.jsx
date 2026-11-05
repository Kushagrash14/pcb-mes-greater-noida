import { useEffect, useState } from 'react';
import {
  Drawer,
  Table,
  Button,
  Select,
  Modal,
  message,
  Typography,
  Tag,
  Progress,
  Space,
} from 'antd';
import { PrinterOutlined } from '@ant-design/icons';
import api from '../../../../services/API/api';
import { printZpl } from '../../../../utils/qzPrint';
import LabelTemplatePreview from './Labeltemplatepreview';

const { Text } = Typography;

export default function PendingQrCodesPanel({ open, onClose }) {
  const [pending, setPending] = useState([]);
  const [printers, setPrinters] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reprintingBucketId, setReprintingBucketId] = useState(null);
  const [printerModalBucket, setPrinterModalBucket] = useState(null);
  const [selectedPrinterId, setSelectedPrinterId] = useState(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [printProgress, setPrintProgress] = useState(null);

  const fetchPending = () => {
    setLoading(true);

    Promise.all([
      api.get('/customer-serial-rules/qr-codes/pending'),
      api.get('/printers', { params: { active: true } }),
      api.get('/label-templates', {
        params: {
          type: 'CUSTOMER_QR',
          active: true,
        },
      }),
    ])
      .then(([pendingRes, printersRes, templatesRes]) => {
        setPending(pendingRes.data.data);
        setPrinters(
          printersRes.data.data ?? printersRes.data
        );
        setTemplates(
          templatesRes.data.data ?? templatesRes.data
        );
      })
      .catch((err) => {
        console.error('Failed to load pending QR codes:', err);
        message.error('Failed to load pending QR codes');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    if (open) {
      fetchPending();
    }
  }, [open]);

  const openPrinterPicker = (record) => {
    setPrinterModalBucket(record);
    setSelectedPrinterId(
      record.printer_id ?? null
    );
    setSelectedTemplateId(
      record.template_id ?? null
    );
    setPrintProgress(null);
  };

  const selectedTemplate = templates.find(
    (t) => t.id === selectedTemplateId
  );

  // ------------------------------------------------------------
  // Preview data
  // ------------------------------------------------------------

  const previewSampleData = printerModalBucket
    ? {
        customer_serial:
          `${printerModalBucket.part_code}` +
          `${String(printerModalBucket.year).padStart(2, '0')}` +
          `${String(printerModalBucket.week).padStart(2, '0')}` +
          'XXXXX',

        product_name:
          printerModalBucket.product_name,

        part_code:
          printerModalBucket.part_code,

        erp_no:
          printerModalBucket.product_erp_no,
      }
    : null;

  // ------------------------------------------------------------
  // Reprint
  // ------------------------------------------------------------

  const runReprint = async () => {
    if (!printerModalBucket) return;

    if (!selectedPrinterId) {
      message.error('Select a printer');
      return;
    }

    if (!selectedTemplateId) {
      message.error('Select a label template');
      return;
    }

    const bucketId =
      printerModalBucket.bucket_id;

    const printer = printers.find(
      (p) => p.id === selectedPrinterId
    );

    if (!printer?.printer_name) {
      message.error(
        `Printer "${printer?.name || selectedPrinterId}" is missing a printer_name.`
      );
      return;
    }

    setReprintingBucketId(bucketId);

    try {
      // --------------------------------------------------------
      // 1. Ask backend for pending QR codes + template ZPL
      // --------------------------------------------------------

      const { data } = await api.post(
        '/customer-serial-rules/qr-codes/reprint',
        {
          bucket_id: bucketId,
          printer_id: selectedPrinterId,
          template_id: selectedTemplateId,
        }
      );

      const result = data?.data;

      const qrCodes = result?.qrCodes || [];
      const zpl = result?.zpl;

      if (!qrCodes.length) {
        throw new Error(
          'No pending QR codes were returned for reprint'
        );
      }

      if (!zpl) {
        throw new Error(
          'No ZPL was generated for the selected template'
        );
      }

      // --------------------------------------------------------
      // 2. Print complete template-generated ZPL
      // --------------------------------------------------------

      setPrintProgress({
        sent: 0,
        total: qrCodes.length,
      });

      try {
        await printZpl(
          zpl,
          printer.printer_name
        );
      } catch (printError) {
        console.error(
          'Customer QR reprint failed:',
          printError
        );

        message.warning(
          `${qrCodes.length} QR codes are still pending because printing failed.`
        );

        return;
      }

      // --------------------------------------------------------
      // 3. QZ accepted the complete print job
      // --------------------------------------------------------

      setPrintProgress({
        sent: qrCodes.length,
        total: qrCodes.length,
      });

      // --------------------------------------------------------
      // 4. Mark those exact QR records as printed
      // --------------------------------------------------------

      const printedIds = qrCodes.map(
        (qr) => qr.id
      );

      if (printedIds.length) {
        await api.post(
          '/customer-serial-rules/qr-codes/mark-printed',
          {
            ids: printedIds,
          }
        );
      }

      message.success(
        `Reprinted ${qrCodes.length} QR codes`
      );

      setPrinterModalBucket(null);

      fetchPending();

    } catch (err) {
      console.error(
        'Reprint failed:',
        err
      );

      const backendMessage =
        err?.response?.data?.message;

      const clientMessage =
        !err?.response
          ? err?.message
          : null;

      message.error(
        backendMessage ||
        clientMessage ||
        'Reprint failed — codes are still saved as pending.'
      );

    } finally {
      setReprintingBucketId(null);
      setPrintProgress(null);
    }
  };

  // ------------------------------------------------------------
  // Table
  // ------------------------------------------------------------

  const columns = [
    {
      title: 'Customer',
      dataIndex: 'customer_name',
    },

    {
      title: 'Part Code',
      dataIndex: 'part_code',
    },

    {
      title: 'Bucket',
      render: (_, r) =>
        `${String(r.year).padStart(2, '0')}-W${String(
          r.week
        ).padStart(2, '0')}`,
    },

    {
      title: 'Pending Qty',
      dataIndex: 'pending_count',
      render: (val) => (
        <Tag color="orange">
          {val}
        </Tag>
      ),
    },

    {
      title: 'Last Printer',
      dataIndex: 'printer_name',
      render: (v) => v || '—',
    },

    {
      title: 'Last Template',
      dataIndex: 'template_name',
      render: (v) => v || '—',
    },

    {
      title: 'Actions',

      render: (_, r) => (
        <Button
          icon={<PrinterOutlined />}
          loading={
            reprintingBucketId === r.bucket_id
          }
          onClick={() =>
            openPrinterPicker(r)
          }
        >
          Reprint
        </Button>
      ),
    },
  ];

  const reprinting =
    reprintingBucketId ===
    printerModalBucket?.bucket_id;

  return (
    <>
      {/* --------------------------------------------------------
          Pending QR Drawer
      --------------------------------------------------------- */}

      <Drawer
        title="Pending QR Codes"
        open={open}
        onClose={onClose}
        size="large"
      >
        <Text type="secondary">
          QR codes that were generated and reserved but
          never confirmed as printed — usually because a
          print job failed or was interrupted. Reprinting
          doesn't create new serials.
        </Text>

        <Table
          style={{ marginTop: 16 }}
          rowKey="bucket_id"
          loading={loading}
          columns={columns}
          dataSource={pending}
          pagination={{ pageSize: 10 }}
        />
      </Drawer>

      {/* --------------------------------------------------------
          Reprint Modal
      --------------------------------------------------------- */}

      <Modal
        title="Reprint Pending QR Codes"
        open={!!printerModalBucket}
        onCancel={
          reprinting
            ? undefined
            : () => setPrinterModalBucket(null)
        }
        closable={!reprinting}
        maskClosable={!reprinting}
        onOk={runReprint}
        okText="Reprint"
        confirmLoading={reprinting}
        width={600}
        footer={
          printProgress
            ? []
            : undefined
        }
      >
        {printProgress ? (
          <div>
            <Text strong>
              Printing {printProgress.sent} /{' '}
              {printProgress.total}
            </Text>

            <Progress
              percent={Math.round(
                (printProgress.sent /
                  printProgress.total) *
                  100
              )}
              status="active"
            />

            <Text type="secondary">
              Print job has been submitted to the
              selected printer.
            </Text>
          </div>
        ) : (
          <Space
            direction="vertical"
            style={{ width: '100%' }}
          >
            {/* Printer */}

            <div>
              <Text strong>
                Printer
              </Text>

              <Select
                style={{
                  width: '100%',
                  marginTop: 6,
                }}
                placeholder="Select Printer"
                value={selectedPrinterId}
                onChange={
                  setSelectedPrinterId
                }
                options={printers.map((p) => ({
                  value: p.id,
                  label:
                    `${p.name} — ${p.printer_name}`,
                }))}
              />
            </div>

            {/* Template */}

            <div
              style={{ marginTop: 12 }}
            >
              <Text strong>
                Label Template
              </Text>

              <Select
                style={{
                  width: '100%',
                  marginTop: 6,
                }}
                placeholder="Select label template"
                value={selectedTemplateId}
                onChange={
                  setSelectedTemplateId
                }
                options={templates.map((t) => ({
                  value: t.id,
                  label:
                    `${t.name} — ${t.width}×${t.height} @ ${t.dpi}dpi`,
                }))}
              />
            </div>

            {/* Template Preview */}

            {selectedTemplate &&
              previewSampleData && (
                <div
                  style={{
                    marginTop: 12,
                  }}
                >
                  <LabelTemplatePreview
                    template={
                      selectedTemplate
                    }
                    sampleData={
                      previewSampleData
                    }
                    maxWidth={500}
                  />
                </div>
              )}
          </Space>
        )}
      </Modal>
    </>
  );
}
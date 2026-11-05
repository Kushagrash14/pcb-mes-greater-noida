import { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Select,
  Table,
  Button,
  Space,
  Typography,
  Tag,
  Divider,
  Alert,
  Progress,
  message,
  Spin,
} from "antd";
import {
  Printer,
  CheckCircle2,
  CircleAlert,
  TestTube2,
} from "lucide-react";
import api from "../../../../services/API/api";
import { printZpl } from "../../../../utils/qzPrint";
import LabelTemplatePreview from "../../Settings/components/Labeltemplatepreview";

const { Text, Title } = Typography;

const ITEMS_ENDPOINT = (orderId) =>`/production-orders/${orderId}`;

const PRINTERS_ENDPOINT = "/printers";
const TEMPLATES_ENDPOINT = "/label-templates";

export default function ProductQrPrintModal({
  open,
  order,
  onClose,
}) {
  const [loading, setLoading] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [testing, setTesting] = useState(false);

  const [orderDetails, setOrderDetails] = useState(null);
  const [printers, setPrinters] = useState([]);
  const [templates, setTemplates] = useState([]);

  const [selectedPrinterId, setSelectedPrinterId] = useState(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);

  const [selectedItemIds, setSelectedItemIds] = useState([]);

  const [testPrintPassed, setTestPrintPassed] = useState(false);
  const [printProgress, setPrintProgress] = useState(null);

  // ------------------------------------------------------------
  // Load order + printers + Product QR templates
  // ------------------------------------------------------------

  useEffect(() => {
    if (!open || !order?.id) return;

    setLoading(true);
    setOrderDetails(null);
    setSelectedItemIds([]);
    setSelectedPrinterId(null);
    setSelectedTemplateId(null);
    setTestPrintPassed(false);
    setPrintProgress(null);

    Promise.all([
      api.get(ITEMS_ENDPOINT(order.id)),
      api.get(PRINTERS_ENDPOINT, {
        params: { active: true },
      }),
      api.get(TEMPLATES_ENDPOINT, {
        params: {
          type: "PRODUCT_QR",
          active: true,
        },
      }),
    ])
      .then(([orderRes, printerRes, templateRes]) => {
        const detail = orderRes?.data?.data || orderRes?.data || null;
        const printerData = printerRes?.data?.data || printerRes?.data ||[];
        const templateData = templateRes?.data?.data || templateRes?.data || [];

        console.log("PRODUCT QR ORDER DETAIL:", detail);
        console.log("PRODUCT QR ITEMS:", detail?.items);
        console.log(
          "PRODUCT QR PRODUCTION ITEMS:",
          detail?.production_order_items
        );
        setOrderDetails(detail);
        setPrinters(printerData);
        setTemplates(templateData.filter((template) => template.template_type === "PRODUCT_QR"));

        if (order?.printer_id) {
          setSelectedPrinterId(order.printer_id);
        }

        if (order?.template_id) {
          setSelectedTemplateId(order.template_id);
        }
      })
      .catch((err) => {
        console.error("Failed to load Product QR print data:",err);
        message.error(err?.response?.data?.message || "Failed to load Product QR print data");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [open, order?.id]);

  // ------------------------------------------------------------
  // Production items
  // ------------------------------------------------------------

  const items = useMemo(() => {
    if (!orderDetails) return [];

    return (
      orderDetails.items || orderDetails.production_order_items ||[]
    );
  }, [orderDetails]);

  const activeItems = useMemo(() =>
      items.filter((item) => item.status === "ACTIVE"),
    [items]
  );


  // ------------------------------------------------------------
  // Selected printer / template
  // ------------------------------------------------------------

  const selectedPrinter = useMemo(() =>
      printers.find(
        (printer) =>
          printer.id === selectedPrinterId
      ),
    [printers, selectedPrinterId]
  );

 const selectedTemplate = useMemo(() => templates.find((template) =>
          template.id === selectedTemplateId
      ),
    [templates, selectedTemplateId]
  );

  // ------------------------------------------------------------
  // Changing printer/template invalidates physical test
  // ------------------------------------------------------------

  const handlePrinterChange = (value) => {
    setSelectedPrinterId(value);
    setTestPrintPassed(false);
    setPrintProgress(null);
  };

  const handleTemplateChange = (value) => {
    setSelectedTemplateId(value);
    setTestPrintPassed(false);
    setPrintProgress(null);
  };

  // ------------------------------------------------------------
  // Preview sample
  // ------------------------------------------------------------

  const previewSampleData = useMemo(() => {
    if (!orderDetails && !order) return null;

    const productName =
      orderDetails?.product_name ||
      order?.product_name ||
      "";

    const partCode =
      orderDetails?.product_part_code ||
      orderDetails?.part_code ||
      order?.product_part_code ||
      "";

    const erpNo =
      orderDetails?.product_erp_no ||
      orderDetails?.erp_no ||
      order?.product_erp_no ||
      "";

    const orderNo =
      orderDetails?.order_no ||
      order?.order_no ||
      "";

    return {
      serial_no: activeItems[0]?.serial_no || "TEST-PRODUCT-001",
      product_name: productName,
      part_code: partCode,
      erp_no: erpNo,
      order_no: orderNo,
      sequence_no:activeItems[0]?.sequence_no || 1,
      customer_qr_code: activeItems[0]?.customer_qr_code || "",
      production_order_id: order?.id,
      production_order_item_id: activeItems[0]?.id,
    };
  }, [order, orderDetails, activeItems]);

  // ------------------------------------------------------------
  // TEST PRINT
  //
  // This does NOT create a product print job.
  // It only asks backend to build ZPL from sample data.
  // ------------------------------------------------------------

  const handleTestPrint = async () => {
    if (!selectedPrinterId) {
      message.error("Select a printer first");
      return;
    }

    if (!selectedTemplateId) {
      message.error("Select a Product QR template first");
      return;
    }

    if (!selectedPrinter?.printer_name) {
      message.error(
        "Selected printer is missing printer_name"
      );
      return;
    }

    setTesting(true);
    setTestPrintPassed(false);

    try {
      const testData = {
        serial_no: "TEST-PRODUCT-001",
        product_name: orderDetails?.product_name || order?.product_name || "TEST PRODUCT",
        part_code: orderDetails?.product_part_code || orderDetails?.part_code || order?.product_part_code || "TEST-PART",
        erp_no: orderDetails?.product_erp_no || orderDetails?.erp_no || order?.product_erp_no ||"TEST-ERP",
        order_no: orderDetails?.order_no || order?.order_no || "TEST-ORDER",
        sequence_no: 0,
        customer_qr_code: "TEST-CUSTOMER-QR",
        production_order_id: order?.id || null,
        production_order_item_id: null,
      };


     const { data } = await api.post("/label-templates/test-print",
        {
          printer_id: selectedPrinterId,
          template: selectedTemplate,
          test_data: testData,
        }
      );

      const zpl = data?.data?.zpl || data?.zpl;

      if (!zpl) {
        throw new Error("No ZPL returned from test print");
      }

      await printZpl(zpl, selectedPrinter.printer_name);
      setTestPrintPassed(true);

      message.success("Test print submitted successfully");
    } catch (err) {
      console.error("Product QR test print failed:",err);

      message.error(
        err?.response?.data?.message ||
          err?.message ||
          "Test print failed"
      );
    } finally {
      setTesting(false);
    }
  };

  // ------------------------------------------------------------
  // FINAL PRODUCTION PRINT
  // ------------------------------------------------------------

  const handleFinalPrint = async () => {
    if (!selectedPrinterId) {
      message.error("Select a printer");
      return;
    }

    if (!selectedTemplateId) {
      message.error("Select a Product QR template");
      return;
    }

    if (!testPrintPassed) {
      message.warning("Run the printer test successfully before final printing");
      return;
    }

    if (!selectedItemIds.length) {
      message.error("Select at least one production item");
      return;
    }

    if (selectedItemIds.length > 500) {
      message.error("Maximum 500 items can be printed in one job");
      return;
    }

    if (!selectedPrinter?.printer_name) {
      message.error("Selected printer is missing printer_name");
      return;
    }

    setPrinting(true);

    try {
      const { data } = await api.post("/product-print-jobs",{
          production_order_id: order.id,
          printer_id: selectedPrinterId,
          template_id: selectedTemplateId,
          item_ids: selectedItemIds,
        }
      );

      const result = data?.data;

      const zpl = result?.zpl;
      const job = result?.job;
      const printItems = result?.items || [];

      if (!zpl) {
        throw new Error("No ZPL returned for production print");
      }

      if (!job) {
        throw new Error("No print job returned");
      }

      if (!printItems.length) {
        throw new Error("No production items returned");
      }

      setPrintProgress({
        sent: 0,
        total: printItems.length,
      });

      // --------------------------------------------------------
      // Submit complete production ZPL to QZ
      // --------------------------------------------------------

      await printZpl(zpl, selectedPrinter.printer_name);

      setPrintProgress({
        sent: printItems.length,
        total: printItems.length,
      });

      message.success(`Print job #${job.id} submitted — ${printItems.length} labels`);

      onClose();
    } catch (err) {
      console.error(
        "Product QR print failed:",
        err
      );

      message.error(
        err?.response?.data?.message ||
          err?.message ||
          "Product QR print failed"
      );
    } finally {
      setPrinting(false);
      setPrintProgress(null);
    }
  };

  // ------------------------------------------------------------
  // Table
  // ------------------------------------------------------------

  const columns = [
    {
      title: "Serial No",
      dataIndex: "serial_no",
      key: "serial_no",
      render: (value) => (
        <Text strong>{value}</Text>
      ),
    },
    {
      title: "Sequence",
      dataIndex: "sequence_no",
      key: "sequence_no",
    },
    {
      title: "Customer QR",
      dataIndex: "customer_qr_code",
      key: "customer_qr_code",
      render: (value) =>
        value || "—",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (value) => (
        <Tag
          color={
            value === "ACTIVE"
              ? "green"
              : "red"
          }
        >
          {value}
        </Tag>
      ),
    },
  ];

  // ------------------------------------------------------------
  // Selection rules
  // ------------------------------------------------------------

  const rowSelection = {
    selectedRowKeys: selectedItemIds,

    onChange: (keys) => {
      setSelectedItemIds(keys);
      setTestPrintPassed(testPrintPassed);
    },

    getCheckboxProps: (record) => ({
      disabled: record.status !== "ACTIVE",
    }),
  };

  const selectAll = () => {
    setSelectedItemIds(
      activeItems.map((item) => item.id)
    );
  };

  const clearSelection = () => {
    setSelectedItemIds([]);
  };

  const finalPrintDisabled =
    !selectedPrinterId ||
    !selectedTemplateId ||
    !testPrintPassed ||
    !selectedItemIds.length ||
    printing ||
    testing;

  return (
    <Modal
      title={
        <Space>
          <Printer size={18} />
          <span>Print Product QR</span>
        </Space>
      }
      open={open}
      onCancel={
        printing || testing? undefined: onClose
      }
      closable={
        !printing && !testing
      }
      maskClosable={false}
      width={1000}
      footer={null}
    >
      {loading ? (
        <div
          style={{
            textAlign: "center",
            padding: 60,
          }}
        >
          <Spin size="large" />
        </div>
      ) : (
        <>
          {/* -------------------------------------------------- */}
          {/* Production Order */}
          {/* -------------------------------------------------- */}

          <div
            style={{
              padding: "12px 14px",
              background: "#F8FAFC",
              border: "1px solid #E2E8F0",
              borderRadius: 8,
              marginBottom: 18,
            }}
          >
            <Text type="secondary">
              Production Order
            </Text>

            <Title
              level={5}
              style={{ margin: "4px 0" }}
            >
              {orderDetails?.order_no ||
                order?.order_no ||
                "—"}
            </Title>

            <Space
              size={18}
              wrap
            >
              <Text>
                Product:{" "}
                <Text strong>
                  {orderDetails?.product_name ||
                    order?.product_name ||
                    "—"}
                </Text>
              </Text>

              <Text>
                Part Code:{" "}
                <Text strong>
                  {orderDetails?.product_part_code ||
                    orderDetails?.part_code ||
                    order?.product_part_code ||
                    "—"}
                </Text>
              </Text>

              <Text>
                ERP:{" "}
                <Text strong>
                  {orderDetails?.product_erp_no ||
                    orderDetails?.erp_no ||
                    order?.product_erp_no ||
                    "—"}
                </Text>
              </Text>
            </Space>
          </div>

          {/* -------------------------------------------------- */}
          {/* Items */}
          {/* -------------------------------------------------- */}

          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <Text strong>
                Production Items
              </Text>

              <Space size={6}>
                <Button
                  size="small"
                  onClick={selectAll}
                  disabled={!activeItems.length}
                >
                  Select All
                </Button>

                <Button
                  size="small"
                  onClick={clearSelection}
                  disabled={!selectedItemIds.length}
                >
                  Clear
                </Button>

                <Tag color="blue">
                  Selected:{" "}
                  {selectedItemIds.length}
                </Tag>
              </Space>
            </div>

            <Table
              rowKey="id"
              size="small"
              columns={columns}
              dataSource={items}
              rowSelection={rowSelection}
              pagination={{
                pageSize: 8,
                showSizeChanger: true,
              }}
              scroll={{ y: 280 }}
            />
          </div>

          <Divider />

          {/* -------------------------------------------------- */}
          {/* Printer + Template */}
          {/* -------------------------------------------------- */}

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "1fr 1fr",
              gap: 14,
            }}
          >
            <div>
              <Text strong>
                Printer
              </Text>

              <Select
                style={{
                  width: "100%",
                  marginTop: 6,
                }}
                placeholder="Select printer"
                value={selectedPrinterId}
                onChange={handlePrinterChange}
                disabled={printing || testing}
                options={printers.map(
                  (printer) => ({
                    value: printer.id,
                    label:
                      `${printer.name} — ${printer.printer_name}`,
                  })
                )}
              />
            </div>

            <div>
              <Text strong>
                Product QR Template
              </Text>

              <Select
                style={{
                  width: "100%",
                  marginTop: 6,
                }}
                placeholder="Select Product QR template"
                value={selectedTemplateId}
                onChange={handleTemplateChange}
                disabled={printing || testing}
                options={templates.map(
                  (template) => ({
                    value: template.id,
                    label:
                      `${template.name} — ${template.width}×${template.height} @ ${template.dpi}dpi`,
                  })
                )}
              />
            </div>
          </div>

          {/* -------------------------------------------------- */}
          {/* Digital Preview */}
          {/* -------------------------------------------------- */}

          {selectedTemplate && (
            <div style={{ marginTop: 16 }}>
              <Text strong>
                Layout Preview
              </Text>

              <div
                style={{
                  marginTop: 8,
                  padding: 12,
                  border: "1px solid #E2E8F0",
                  borderRadius: 8,
                  background: "#FAFAFA",
                }}
              >
                <LabelTemplatePreview
                  template={selectedTemplate}
                  sampleData={
                    previewSampleData
                  }
                  maxWidth={700}
                />
              </div>
            </div>
          )}

          {/* -------------------------------------------------- */}
          {/* Physical Test Print */}
          {/* -------------------------------------------------- */}

          <div
            style={{
              marginTop: 18,
              padding: 16,
              border: testPrintPassed
                ? "1px solid #BBF7D0"
                : "1px solid #FDE68A",
              background: testPrintPassed
                ? "#F0FDF4"
                : "#FFFBEB",
              borderRadius: 8,
            }}
          >
            <Space
              align="start"
              style={{
                width: "100%",
                justifyContent:
                  "space-between",
              }}
            >
              <div>
                <Space>
                  <TestTube2
                    size={18}
                  />

                  <Text strong>
                    Printer & Layout Test
                  </Text>

                  {testPrintPassed && (
                    <Tag
                      icon={
                        <CheckCircle2
                          size={12}
                        />
                      }
                      color="success"
                    >
                      Test Passed
                    </Tag>
                  )}
                </Space>

                <div
                  style={{
                    marginTop: 6,
                  }}
                >
                  <Text type="secondary">
                    Print a physical test label
                    before sending production
                    serials.
                  </Text>
                </div>

                <div
                  style={{
                    marginTop: 8,
                    fontSize: 12,
                  }}
                >
                  Test Serial:{" "}
                  <Text code>
                    TEST-PRODUCT-001
                  </Text>
                </div>
              </div>

              <Button
                icon={
                  <Printer size={15} />
                }
                loading={testing}
                disabled={
                  !selectedPrinterId ||
                  !selectedTemplateId ||
                  printing
                }
                onClick={
                  handleTestPrint
                }
              >
                Test Print
              </Button>
            </Space>

            {!testPrintPassed && (
              <Alert
                style={{
                  marginTop: 12,
                }}
                type="warning"
                showIcon
                icon={
                  <CircleAlert
                    size={16}
                  />
                }
                message="Production printing is locked until the physical test print succeeds."
              />
            )}
          </div>

          {/* -------------------------------------------------- */}
          {/* Progress */}
          {/* -------------------------------------------------- */}

          {printProgress && (
            <div
              style={{
                marginTop: 16,
              }}
            >
              <Text strong>
                Submitting production print...
              </Text>

              <Progress
                percent={Math.round(
                  (printProgress.sent /
                    printProgress.total) *
                    100
                )}
                status="active"
              />
            </div>
          )}

          {/* -------------------------------------------------- */}
          {/* Footer */}
          {/* -------------------------------------------------- */}

          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "center",
              marginTop: 20,
              paddingTop: 16,
              borderTop:
                "1px solid #F1F5F9",
            }}
          >
            <Text type="secondary">
              {selectedItemIds.length}{" "}
              production label
              {selectedItemIds.length !== 1
                ? "s"
                : ""}{" "}
              selected
            </Text>

            <Space>
              <Button
                onClick={onClose}
                disabled={
                  printing || testing
                }
              >
                Cancel
              </Button>

              <Button
                type="primary"
                icon={
                  <Printer size={15} />
                }
                loading={printing}
                disabled={
                  finalPrintDisabled
                }
                onClick={
                  handleFinalPrint
                }
              >
                Print{" "}
                {selectedItemIds.length ||
                  ""}{" "}
                Production QR
              </Button>
            </Space>
          </div>
        </>
      )}
    </Modal>
  );
}
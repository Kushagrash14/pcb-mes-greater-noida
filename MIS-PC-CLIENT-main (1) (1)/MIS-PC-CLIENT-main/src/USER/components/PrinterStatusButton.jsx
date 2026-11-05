import { useState } from "react";
import { Alert, Button, List, Modal, Space, Typography, notification } from "antd";
import {
  PrinterOutlined,
  CheckCircleFilled,
  ReloadOutlined,
  WarningFilled,
  LoadingOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

const STATUS_STYLE = {
  ready:     { color: "#166534", border: "#16a34a", bg: "#f2faf4", icon: <CheckCircleFilled style={{ color: "#16a34a" }} />, label: "Printer ready" },
  not_ready: { color: "#991b1b", border: "#dc2626", bg: "#fef2f2", icon: <WarningFilled style={{ color: "#dc2626" }} />,     label: "Printer not ready" },
  unknown:   { color: "#92400e", border: "#d97706", bg: "#fffbeb", icon: <WarningFilled style={{ color: "#d97706" }} />,     label: "Printer selected, not verified" },
  checking:  { color: "#475569", border: "#94a3b8", bg: "#f8fafc", icon: <LoadingOutlined />,                                label: "Checking printer…" },
};

const HINT = {
  ready: "",
  not_ready: "The printer reports a problem (offline, paper out or paused). Fix it, then run Test print.",
  unknown: "This printer doesn't report its status. Click Test print and confirm a label comes out.",
  checking: "",
};

export default function PrinterStatusButton({
  printerName,
  printers,
  qzState,
  onSelect,
  onRefresh,
  printerStatus,
  statusText,
  printerVerified,
  onVerified,
  onTestPrint,
}) {
  const [open, setOpen] = useState(false);
  const [testing, setTesting] = useState(false);

  // Driver says there is a problem -> not_ready (even if verified earlier).
  // Driver says OK, or operator confirmed a test label -> ready.
  const effective =
    printerStatus === "checking" ? "checking"
    : printerStatus === "not_ready" ? "not_ready"
    : printerStatus === "ready" || printerVerified ? "ready"
    : "unknown";

  const st = STATUS_STYLE[effective];

  const openPicker = async () => {
    await onRefresh();
    setOpen(true);
  };

  const runTest = async () => {
    setTesting(true);
    try {
      await onTestPrint();
      Modal.confirm({
        title: "Did a test label come out?",
        okText: "Yes, printer works",
        cancelText: "No",
        onOk: () => onVerified(),
        onCancel: () =>
          notification.warning({
            title: "Check the printer",
            description: "Check power, USB cable, labels and ribbon, then run Test print again.",
            placement: "topRight",
          }),
      });
    } catch (e) {
      notification.error({
        title: "Test print failed",
        description: e?.message || "Could not send the test label to the printer.",
        placement: "topRight",
      });
    } finally {
      setTesting(false);
    }
  };

  if (qzState === "down") {
    return (
      <Space orientation="vertical" size={4} style={{ width: "100%" }}>
        <Button danger block icon={<ReloadOutlined />} onClick={onRefresh}>
          QZ Tray not running, retry
        </Button>
        <Text type="secondary" style={{ fontSize: 12 }}>
          This product supports printing here. Start QZ Tray on this PC (icon near the clock).
        </Text>
      </Space>
    );
  }

  return (
    <>
      {printerName ? (
      <Space orientation="vertical" size={4} style={{ width: "100%" }}>
        <Space.Compact block>
            <Button
            icon={st.icon}
            onClick={openPicker}
            style={{
                flex: 1,
                minWidth: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                borderColor: st.border,
                color: st.color,
                background: st.bg,
            }}
            >
            {st.label}: {printerName}
            {statusText && effective === "not_ready" ? ` (${statusText})` : ""}
            </Button>

            <Button icon={<PrinterOutlined />} loading={testing} onClick={runTest}>
            Connect printer
            </Button>
        </Space.Compact>

        {HINT[effective] && (
            <Text type="secondary" style={{ fontSize: 12 }}>
            {HINT[effective]}
            </Text>
        )}
        </Space>
      ) : (
        <Space orientation="vertical" size={4} style={{ width: "100%" }}>
          <Button
            type="primary"
            block
            icon={<PrinterOutlined />}
            loading={qzState === "checking"}
            onClick={openPicker}
          >
            Connect the printer
          </Button>
          <Text type="secondary" style={{ fontSize: 12 }}>
            This product supports printing here. Choose the printer connected to this PC.
          </Text>
        </Space>
      )}

      <Modal title="Select printer for this PC" open={open} onCancel={() => setOpen(false)} footer={null}>
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 12 }}
          title="Can't see your printer?"
          description={
            <ol style={{ margin: 0, paddingLeft: 18 }}>
              <li>Switch the printer on and connect the USB or network cable.</li>
              <li>Check it appears in Windows → Printers &amp; scanners.</li>
              <li>Check QZ Tray is running (icon near the clock).</li>
              <li>Click "Refresh list", then choose the printer.</li>
            </ol>
          }
        />
        <Button icon={<ReloadOutlined />} onClick={onRefresh} style={{ marginBottom: 12 }}>
          Refresh list
        </Button>

        <List
          bordered
          locale={{ emptyText: "No printers found on this PC" }}
          dataSource={printers}
          renderItem={(name) => (
            <List.Item
              style={{ cursor: "pointer", background: name === printerName ? "#f2faf4" : undefined }}
              onClick={() => {
                onSelect(name);
                setOpen(false);
              }}
            >
              {name}
            </List.Item>
          )}
        />
      </Modal>
    </>
  );
}
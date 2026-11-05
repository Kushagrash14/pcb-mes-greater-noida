import React from "react";
import { Button, Space, Tag, Typography } from "antd";
import { CheckCircleFilled } from "@ant-design/icons";

const { Text } = Typography;

// scan_mode === "CUSTOMER_BINDING": the operator scans the PCB QR, then the
// Customer QR — no server call in between. Once both are captured, the pair
// is sent to the server together for validation (see useScanSubmission ->
// handleWipCodeScanned). This panel is purely a progress readout; the WIP
// Bar Code input above it stays the single scan entry point for both steps.
export default function CustomerBindingPanel({ pendingPcbQr, onCancel }) {
  const step = pendingPcbQr ? 2 : 1;

  return (
    <div
      style={{
        padding: 12,
        border: "1px solid #e3e8ef",
        borderRadius: 8,
        background: "#fafbfc",
      }}
    >
      <Space direction="vertical" size={8} style={{ width: "100%" }}>
        <Space size={8}>
          <StepDot done={Boolean(pendingPcbQr)} active={step === 1} label="1" />
          <Text style={{ fontSize: 12, fontWeight: pendingPcbQr ? 400 : 700, color: pendingPcbQr ? "#64748b" : "#1b2430" }}>
            Scan PCB QR
          </Text>
          {pendingPcbQr && (
            <Tag color="blue" style={{ marginInlineStart: 4 }}>
              {pendingPcbQr}
            </Tag>
          )}
        </Space>

        <Space size={8}>
          <StepDot done={false} active={step === 2} label="2" />
          <Text style={{ fontSize: 12, fontWeight: step === 2 ? 700 : 400, color: step === 2 ? "#1b2430" : "#94a3b8" }}>
            Scan Customer QR
          </Text>
        </Space>

        {pendingPcbQr && (
          <Button size="small" onClick={onCancel} style={{ alignSelf: "flex-start" }}>
            Cancel &amp; rescan PCB
          </Button>
        )}
      </Space>
    </div>
  );
}

function StepDot({ done, active, label }) {
  const bg = done ? "#16a34a" : active ? "#3a6d95" : "#e3e8ef";
  const color = done || active ? "#ffffff" : "#94a3b8";
  return (
    <span
      style={{
        width: 18,
        height: 18,
        borderRadius: "50%",
        background: bg,
        color,
        fontSize: 10,
        fontWeight: 700,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {done ? <CheckCircleFilled style={{ fontSize: 11 }} /> : label}
    </span>
  );
}

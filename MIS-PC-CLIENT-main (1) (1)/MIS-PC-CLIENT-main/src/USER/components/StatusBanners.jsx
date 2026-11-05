import React from "react";
import { Alert, Space, Tag, Typography } from "antd";

const { Text } = Typography;

export function MissingStageBanner({ missingStages, onClose }) {
  if (!missingStages.length) return null;

  return (
    <Alert
      type="error"
      showIcon
      closable
      onClose={onClose}
      message={
        <span style={{ fontSize: 12.5 }}>
          <strong>Missing stage(s):</strong>{" "}
          {missingStages.map((s) => s.label).join(", ")} must be scanned before this stage. They're
          marked red on the left rail.
        </span>
      }
      style={{
        flexShrink: 0,
        borderRadius: 0,
        padding: "6px 20px",
        border: "none",
        borderBottom: "1px solid #f5c6c0",
      }}
    />
  );
}

export function StatusBar({ status, errorMessage, successMessage }) {
  return (
    <div
      style={{
        height: 52,
        flexShrink: 0,
        background: "#ffffff",
        borderBottom: "1px solid #e3e8ef",
        display: "flex",
        alignItems: "center",
        padding: "0 20px",
      }}
    >
      <Space size={14} align="center">
        <Text type="secondary" style={{ fontSize: 12 }}>
          STATUS :
        </Text>
        {errorMessage && <Tag color="orange">{errorMessage || status}</Tag>}
        {successMessage && <Tag color="green">{successMessage}</Tag>}
      </Space>
    </div>
  );
}

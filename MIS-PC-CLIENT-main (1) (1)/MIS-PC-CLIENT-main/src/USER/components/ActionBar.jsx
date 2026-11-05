
import React from "react";
import { Space, Tag, Typography, Tooltip } from "antd";
import {
  PlusOutlined,
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
  MenuOutlined,
} from "@ant-design/icons";

const { Title } = Typography;

// Reusable action button
function ActionButton({
  icon,
  label,
  color,
  onClick,
  disabled = false,
  filled = false,
}) {
  const baseStyle = filled
    ? {
        background: color,
        border: `1.5px solid ${color}`,
        color: "#ffffff",
        boxShadow: `0 4px 12px ${color}40`,
      }
    : {
        background: `${color}14`,
        border: `1.5px solid ${color}45`,
        color,
        boxShadow: "none",
      };

  return (
    <button
      type="button"
      className="pg-action-btn"
      onClick={onClick}
      disabled={disabled}
      style={{
        ...baseStyle,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 7,
        height: 36,
        padding: label ? "0 16px" : "0 12px",
        minWidth: label ? "auto" : 40,
        borderRadius: 10,
        fontSize: 13,
        fontWeight: 700,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        transition: "all 0.2s ease",
      }}
    >
      <span style={{ display: "flex", alignItems: "center", fontSize: 15 }}>
        {icon}
      </span>

      {label && <span>{label}</span>}
    </button>
  );
}

const ORDER_STATUS_STYLE = {
  COMPLETED: {
    color: "green",
    backgroundColor: "#d1fae5",
  },
  RUNNING: {
    color: "blue",
    backgroundColor: "#dbeafe",
  },
};

const ORDER_STATUS_DEFAULT = {
  color: "orange",
  backgroundColor: "#fef3c7",
};

export default function ActionBar({
  selected,
  selectedOrder,
  mode,
  onNew,
  onEdit,
  onSave,
  onCancel,
  onOpenQualityActions,
}) {
  const isEditable = mode === "new" || mode === "edit";

  const statusStyle =
    ORDER_STATUS_STYLE[selectedOrder?.production_order_status] ||
    ORDER_STATUS_DEFAULT;

  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        height: 56,
        flexShrink: 0,
        background: "#ffffff",
        borderBottom: "1px solid #e3e8ef",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px",
      }}
    >
      {/* Left: Production Order Information */}
      <Space size={8}>
        <Title level={5} style={{ margin: 0, color: "#1b2430" }}>
          Production Order:{" "}
          {selectedOrder?.production_order_no ? (
            <span style={{ color: "green" }}>
              {selectedOrder.production_order_no}
            </span>
          ) : (
            <span style={{ color: "orange" }}>Not Selected</span>
          )}
        </Title>

        {selectedOrder?.production_order_status && (
          <Tag
            style={{
              margin: 0,
              color: statusStyle.color,
              backgroundColor: statusStyle.backgroundColor,
              borderRadius: 6,
              fontWeight: 600,
              padding: "2px 10px",
            }}
          >
            {selectedOrder.production_order_status}
          </Tag>
        )}
      </Space>

      {/* Right: Dashboard Actions */}
      <Space size={10}>
        <ActionButton
          icon={<PlusOutlined />}
          label="New"
          color="#2563eb"
          onClick={onNew}
          disabled={isEditable}
        />

        <ActionButton
          icon={<EditOutlined />}
          label="Edit"
          color="#c9820a"
          onClick={onEdit}
          disabled={isEditable}
        />

        <ActionButton
          icon={<SaveOutlined />}
          label="Save"
          color="#16a34a"
          filled
          onClick={onSave}
          disabled={!isEditable}
        />

        <ActionButton
          icon={<CloseOutlined />}
          label="Cancel"
          color="#dc2626"
          filled
          onClick={onCancel}
          disabled={!isEditable}
        />

        <Tooltip title="Quality Actions" placement="bottom">
          <ActionButton
            icon={<MenuOutlined />}
            color="#475569"
            onClick={onOpenQualityActions}
          />
        </Tooltip>
      </Space>
    </div>
  );
}

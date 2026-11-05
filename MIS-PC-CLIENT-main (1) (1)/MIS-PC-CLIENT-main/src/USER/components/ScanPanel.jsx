import { useState } from "react";
import {
  Card, Select, Input, Typography,
  Button, Modal, Form, Alert, Space, message
} from "antd";
import { LockOutlined, InboxOutlined, QrcodeOutlined, ScanOutlined } from "@ant-design/icons";
import api from "../../services/API/api";

import { SCAN_MODES } from "../constants/scanModes";
import GroupCreatePanel from "./GroupCreatePanel";
import CustomerBindingPanel from "./CustomerBindingPanel";
import PrinterStatusButton from "./PrinterStatusButton";
import ReprintLabelButton from "./ReprintLabelButton";

const { Text } = Typography;

function FieldLabel({ text }) {
  return (
    <Text style={{ display: "block", fontSize: 11.5, color: "#64748b", marginBottom: 4, letterSpacing: 0.2 }}>
      {text}
    </Text>
  );
}

export default function ScanPanel({
  form,
  isEditable,
  mode,
  products,
  orders,
  selectedOrderId,
  onSelectOrder,
  productsLoading,
  selected,
  onSelectProduct,
  onWipCodeChange,
  onWipCodeScanned,
  wipCodeRef,
  stageFlow,
  // GROUP_CREATE
  pendingGroupScans,
  savingGroup,
  onSaveGroup,
  onRemovePendingScan,
  groupSize,
  onGroupSizeChange,
  // CUSTOMER_BINDING
  pendingPcbQr,
  onCancelCustomerBinding,

  printSupported,
  printerName,
  printers,
  printerQzState,
  onSelectPrinter,
  onRefreshPrinters,
  printerStatus,   // new
  statusText,
  printerVerified,
  onVerified,
  onTestPrint,
  printStageId,
  onCheckPrinter,

  isPackagingStage,
}) {
  const scanMode = stageFlow?.scan_mode;
  const [wipFocused, setWipFocused] = useState(false);
  const wipReady = !!form.productId && mode === "view" && !form.wipBarCode;

  const [partialModalOpen, setPartialModalOpen] = useState(false);
  const [partialBoxes, setPartialBoxes] = useState([]);
  const [partialLoading, setPartialLoading] = useState(false);
  const [partialSubmitting, setPartialSubmitting] = useState(false);
  const [selectedBoxId, setSelectedBoxId] = useState(undefined);
  const [workerUsername, setWorkerUsername] = useState("");
  const [workerPassword, setWorkerPassword] = useState("");
  const [closureReason, setClosureReason] = useState("");

  const loadPartialBoxes = async () => {
    if (!form.productId || !printStageId) return;

    setPartialLoading(true);
    try {
      const res = await api.get("/scan-history/open-partial-boxes", {
        params: {
          product_id: form.productId,
          stage_id: printStageId,
        },
      });

      const rows = res?.data?.data ?? [];
      setPartialBoxes(rows);

      if (!rows.some((box) => Number(box.box_id) === Number(selectedBoxId))) {
        setSelectedBoxId(undefined);
      }
    } catch (error) {
      message.error(
        error?.response?.data?.message || "Failed to load open boxes"
      );
    } finally {
      setPartialLoading(false);
    }
  };

  const openPartialBoxModal = async () => {
    setPartialModalOpen(true);
    await loadPartialBoxes();
  };

  const submitPartialClosure = async () => {
    if (!selectedBoxId || !workerUsername.trim() ||
        !workerPassword || !closureReason.trim()) {
      message.warning("Select a box and enter worker credentials and reason");
      return;
    }

    setPartialSubmitting(true);
    try {
      const res = await api.post("/scan-history/close-partial-box", {
        box_id: selectedBoxId,
        username: workerUsername.trim(),
        password: workerPassword,
        reason: closureReason.trim(),
      });

      const closedBox = res?.data?.data;

      message.success(
        `Box ${closedBox?.box_code} closed. Print job queued.`
      );

      setPartialBoxes((previous) =>
        previous.filter((box) => Number(box.box_id) !== Number(selectedBoxId))
      );
      setSelectedBoxId(undefined);
      setWorkerPassword("");
      setClosureReason("");
      setPartialModalOpen(false);
    } catch (error) {
      message.error(
        error?.response?.data?.message || "Failed to close partial box"
      );
    } finally {
      setPartialSubmitting(false);
    }
  };




  return (
    <Card
      styles={{ body: { padding: 18, height: "100%", display: "flex", flexDirection: "column", gap: 16 } }}
      style={{ border: "1px solid #e3e8ef", borderRadius: 10, height: "100%" }}
    >

      <div>
        <FieldLabel text="Select product" />
        <Select
          style={{ width: "100%" }}
          placeholder="Search product..."
          value={form.productId}
          disabled={!isEditable}
          loading={productsLoading}
          showSearch
          allowClear
          optionFilterProp="label"
          filterOption={(input, option) => option.label.toLowerCase().includes(input.toLowerCase())}
          options={products.map((p) => ({
            value: p.id,
            label: `${p.erp_no || "—"} — ${p.name}`,
          }))}
          onChange={onSelectProduct}
        />
      </div>

      
      <div>
        <FieldLabel text="Select running production order" />
        <Select
          style={{ width: "100%" }}
          placeholder={
            !form.productId
              ? "Select a product first"
              : "Select production order..."
          }
          value={selectedOrderId ?? undefined}
          disabled={!form.productId}
          showSearch
          optionFilterProp="label"
          options={orders
            .filter(
              (order) =>
                Number(order.product_id) === Number(form.productId)
            )
            .map((order) => ({
              value: Number(order.production_order_id),
              label:
                `${order.production_order_no} — ` +
                `Target: ${order.target_qty}, ` +
                `Remaining: ${order.remaining_qty}`,
            }))}
          onChange={(orderId) => onSelectOrder(orderId, orders)}
        />
      </div>


      <div>
      <FieldLabel text="WIP Bar Code"  />

      {/* keyframes for the "armed, waiting for scan" pulse */}
      <style>{`
        @keyframes wip-scan-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(58, 109, 149, 0.35); }
          50% { box-shadow: 0 0 0 6px rgba(58, 109, 149, 0); }
        }
      `}</style>

      <Input
        disabled={!form.productId || mode !== "view"}
        ref={wipCodeRef}
        placeholder={!form.productId ? " Select a product first" : " Scan QR "}
        value={form.wipBarCode}
        onChange={onWipCodeChange}
        onPressEnter={onWipCodeScanned}
        onFocus={() => setWipFocused(true)}
        onBlur={() => setWipFocused(false)}
        prefix={<QrcodeOutlined style={{ color: "#3a6d95", fontSize: 18 }} />}
        suffix={<ScanOutlined style={{ color: "#3a6d95" }} />}
        size="large"
        style={{
          fontFamily: "'Consolas', 'SFMono-Regular', 'Courier New', monospace",
          fontSize: 17,
          fontWeight: 600,
          letterSpacing: 1.5,
          textAlign: "center",
          color: "#1d3557",
          background: form.wipBarCode ? "#eef6fb" : "#fafcff",
          border: `1.5px ${wipFocused ? "solid" : "dashed"} #3a6d95`,
          borderRadius: 8,
          boxShadow: wipFocused ? "0 0 0 3px rgba(58, 109, 149, 0.18)" : "none",
          animation: wipReady && !wipFocused ? "wip-scan-pulse 1.8s ease-out infinite" : "none",
          transition: "border-style .15s, box-shadow .15s, background .15s",
        }}
      />
    </div>

    {printSupported && (
      <>
        <PrinterStatusButton
          printerName={printerName}
          printers={printers}
          qzState={printerQzState}
          onSelect={onSelectPrinter}
          onRefresh={onRefreshPrinters}
          printerStatus={printerStatus}
          statusText={statusText}
          printerVerified={printerVerified}
          onVerified={onVerified}
          onTestPrint={onTestPrint}
        />
      </>

        
      )}

      

      <div>
        <Text
          strong
          style={{
            display: "block",
            fontSize: 11,
            color: "#16a34a",
            letterSpacing: 0.3,
            textTransform: "uppercase",
            marginBottom: 6,
          }}
        >
          Selected Product
        </Text>
        <div
          style={{
            border: "1px solid #cfe3d5",
            background: "#f2faf4",
            borderRadius: 8,
            padding: "10px 12px",
            minHeight: 20,
          }}
        >
          {selected ? (
            <Text style={{ fontSize: 13, fontWeight: 700, color: "#1b2430" }}>
              {selected.erp_no || "—"} — {selected.name || "—"}
            </Text>
          ) : (
            <Text type="secondary" style={{ fontSize: 12.5 }}>
              No product selected yet
            </Text>
          )}
        </div>
      </div>

      {scanMode === SCAN_MODES.GROUP_CREATE && (
        <GroupCreatePanel
          pendingGroupScans={pendingGroupScans}
          savingGroup={savingGroup}
          onSaveGroup={onSaveGroup}
          onRemovePendingScan={onRemovePendingScan}
          groupSize={groupSize}
          onGroupSizeChange={onGroupSizeChange}
        />
      )}

      {scanMode === SCAN_MODES.CUSTOMER_BINDING && (
        <CustomerBindingPanel pendingPcbQr={pendingPcbQr} onCancel={onCancelCustomerBinding} />
      )}
    </Card>
  );
}

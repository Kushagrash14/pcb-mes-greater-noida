import { useState } from "react";
import {
  Card,
  Typography,
  Button,
  Space,
  Modal,
  Select,
  Input,
  Form,
  Alert,
  message,
} from "antd";
import {  } from "@ant-design/icons";
import api from "../../services/API/api"; 
import { DoubleRightOutlined, InboxOutlined, LockOutlined} from "@ant-design/icons"
import formatScanTime from "../../helpers/formatScanTime.js"; 
import ReprintLabelButton from "./ReprintLabelButton";
const { Text } = Typography;

export default function RecentScansPanel({
  recentScans,
  productId,
  stageId,
  printerName,
  onCheckPrinter,
  isPackagingStage,
  onPackLooseBox,
}) { 

  const [partialModalOpen, setPartialModalOpen] = useState(false);
const [partialBoxes, setPartialBoxes] = useState([]);
const [partialLoading, setPartialLoading] = useState(false);
const [partialSubmitting, setPartialSubmitting] = useState(false);
const [selectedBoxId, setSelectedBoxId] = useState(undefined);
const [workerUsername, setWorkerUsername] = useState("");
const [workerPassword, setWorkerPassword] = useState("");
const [closureReason, setClosureReason] = useState("");

const loadPartialBoxes = async () => {
  if (!productId || !stageId) {
    message.warning("Select a product and stage first.");
    return;
  }

  setPartialLoading(true);

  try {
    const res = await api.get("/scan-history/open-partial-boxes", {
      params: {
        product_id: productId,
        stage_id: stageId,
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
  if (
    !selectedBoxId ||
    !workerUsername.trim() ||
    !workerPassword ||
    !closureReason.trim()
  ) {
    message.warning("Select a box and enter worker credentials and reason.");
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
      previous.filter(
        (box) => Number(box.box_id) !== Number(selectedBoxId)
      )
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
      styles={{ body: { padding: 18, height: "100%", display: "flex", flexDirection: "column", minHeight: 0 } }}
      style={{ border: "1px solid #e3e8ef", borderRadius: 10, height: "100%" }}
    >
      <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            marginBottom: 12,
            flexShrink: 0,
          }}
        >
          <Text strong style={{ fontSize: 12, color: "#3a6d95" }}>
            RECENT SCANS (LATEST 10)
          </Text>

          <Space size={8}>
            <ReprintLabelButton
              productId={productId}
              stageId={stageId}
              printerName={printerName}
              onCheckPrinter={onCheckPrinter}
            />

           {isPackagingStage && (
              <Button
                icon={<InboxOutlined />}
                onClick={openPartialBoxModal}
                disabled={!productId}
              >
                Pack Loose Box
              </Button>
            )}
          </Space>
        </div>

        <Modal
          title="Pack Loose Box"
          open={partialModalOpen}
          onCancel={() => setPartialModalOpen(false)}
          onOk={submitPartialClosure}
          okText="Close Box & Queue Label"
          confirmLoading={partialSubmitting}
          destroyOnHidden
        >
          <Space direction="vertical" style={{ width: "100%" }} size="middle">
            <Alert
              type="warning"
              showIcon
              message="This will permanently close the selected box."
              description="The box will be marked PACKED and a label print job will be queued."
            />

            <Button
              block
              loading={partialLoading}
              onClick={loadPartialBoxes}
            >
              Refresh Open Boxes
            </Button>

            <Form layout="vertical">
              <Form.Item label="Select partially filled box" required>
                <Select
                  style={{ width: "100%" }}
                  placeholder="Choose a box"
                  loading={partialLoading}
                  value={selectedBoxId}
                  onChange={setSelectedBoxId}
                  options={partialBoxes.map((box) => ({
                    value: box.box_id,
                    label: `${box.box_code} — ${box.actual_quantity}/${box.box_size} PCBs`,
                  }))}
                />
              </Form.Item>

              <Form.Item label="Worker username" required>
                <Input
                  prefix={<LockOutlined />}
                  value={workerUsername}
                  onChange={(e) => setWorkerUsername(e.target.value)}
                  autoComplete="username"
                />
              </Form.Item>

              <Form.Item label="Worker password" required>
                <Input.Password
                  value={workerPassword}
                  onChange={(e) => setWorkerPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </Form.Item>

              <Form.Item label="Reason for partial closure" required>
                <Input.TextArea
                  rows={3}
                  maxLength={500}
                  value={closureReason}
                  onChange={(e) => setClosureReason(e.target.value)}
                  placeholder="Enter why this box is being closed early"
                />
              </Form.Item>
            </Form>

            {partialBoxes.length === 0 && !partialLoading && (
              <Alert
                type="info"
                showIcon
                message="No partially filled boxes are available."
              />
            )}
          </Space>
        </Modal>

      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
        {recentScans?.length === 0 && (
          <Text type="secondary" style={{ fontSize: 12 }}>
            No scans recorded yet.
          </Text>
        )}

        {recentScans?.map((s) => (
          <div
            key={s.id}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              border: "1px solid #e3e8ef",
              borderRadius: 8,
              padding: "8px 12px",
              background: "#fafbfc",
              animation: "recentScanIn 0.2s ease-out",
            }}
          >
            <div style={{ display: "flex", flexDirection: "row", gap: 10, minWidth: 0 }}>
              <Text style={{ fontSize: 12.5, fontWeight: 600, color: "#1b2430" }}>
                {s?.scanned_value ?? ""}
              </Text>
              {s?.customer_qr && (
                <Text style={{ fontSize: 11, color: "#032aa9" }}>
                 <DoubleRightOutlined />  {s.customer_qr}
                </Text>
              )}
            </div>
            <Text type="secondary" style={{ fontSize: 11, flexShrink: 0, marginLeft: 8 }}>
              {s?.scanned_at ? formatScanTime(s.scanned_at) : ""}
            </Text>
          </div>
        ))}


      </div>
    </Card>
  );
}
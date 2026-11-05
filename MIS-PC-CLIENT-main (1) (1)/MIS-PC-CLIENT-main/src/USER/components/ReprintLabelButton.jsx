import { useState } from "react";
import { Button, List, Modal, Tag, Typography, notification } from "antd";
import { RedoOutlined } from "@ant-design/icons";
import api from "../../services/API/api";
import useBoxLabelPrinter from "../hooks/useBoxLabelPrinter";

const { Text } = Typography;

const STATUS_COLOR = { PRINTED: "green", FAILED: "red", PENDING: "orange" };

export default function ReprintLabelButton({ productId, stageId, printerName, onCheckPrinter }) {
  const { printBoxLabel } = useBoxLabelPrinter();
  const [open, setOpen] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/print/box-print-jobs/recent", {
        params: { product_id: productId, stage_id: stageId },
      });
      setJobs(res?.data?.data || []);
    } catch (e) {
      notification.error({
        title: "Could not load labels",
        description: e?.response?.data?.message || "Please try again.",
        placement: "topRight",
      });
    } finally {
      setLoading(false);
    }
  };

  const openModal = () => {
    setOpen(true);
    load();
  };

  const reprint = async (job) => {
    setBusyId(job.print_job_id);
    try {
      if (onCheckPrinter) {
        const ready = await onCheckPrinter(true);
        if (!ready) {
          notification.error({
            title: "Printer not ready",
            description: "Fix the printer (offline or paper out), then try again.",
            placement: "topRight",
          });
          return;
        }
      }
      await printBoxLabel(job, printerName, { isReprint: true });
      load();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <Button icon={<RedoOutlined />} onClick={openModal} disabled={!printerName || !productId} block>
        Reprint label
      </Button>

      <Modal title="Reprint Master Label" open={open} onCancel={() => setOpen(false)} footer={null}>
        <List
          loading={loading}
          bordered
          locale={{ emptyText: "No labels yet for this product" }}
          dataSource={jobs}
          renderItem={(job) => (
            <List.Item
              actions={[
                <Button
                  key="r"
                  size="small"
                  type="primary"
                  loading={busyId === job.print_job_id}
                  onClick={() => reprint(job)}
                >
                  Reprint
                </Button>,
              ]}
            >
              <List.Item.Meta
                title={
                  <>
                    {job.box_code} <Tag color={STATUS_COLOR[job.status]}>{job.status}</Tag>
                  </>
                }
                description={
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {job.barcode_data} · {job.actual_quantity} pcs ·{" "}
                    {job.packed_at ? new Date(job.packed_at).toLocaleString() : "—"}
                  </Text>
                }
              />
            </List.Item>
          )}
        />
      </Modal>
    </>
  );
}
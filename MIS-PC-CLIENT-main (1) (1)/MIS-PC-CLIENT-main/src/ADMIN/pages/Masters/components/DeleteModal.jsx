import { Modal } from "antd";
import { AlertTriangle } from "lucide-react";

const DeleteModal = ({ open, onCancel, onConfirm, itemName, loading }) => {
  return (
    <Modal open={open} onCancel={onCancel} footer={null} centered width={380}>
      <div style={{ textAlign: "center", padding: "8px 4px" }}>
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: "50%",
            background: "#FEF2F2",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
          }}
        >
          <AlertTriangle size={24} color="#DC2626" />
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", marginBottom: 6 }}>Delete Record</div>
        <div style={{ fontSize: 13, color: "#64748B", marginBottom: 24 }}>
          Are you sure you want to delete <strong style={{ color: "#0F172A" }}>{itemName}</strong>? This action cannot be undone.
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button
            onClick={onCancel}
            style={{ padding: "9px 20px", borderRadius: 10, border: "1px solid #E2E8F0", background: "#fff", color: "#334155", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{ padding: "9px 20px", borderRadius: 10, border: "none", background: "#DC2626", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
          >
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteModal;
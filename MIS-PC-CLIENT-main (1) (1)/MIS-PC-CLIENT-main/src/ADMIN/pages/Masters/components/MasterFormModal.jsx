import { Modal } from "antd";

const MasterFormModal = ({ open, title, onCancel, onSubmit, confirmLoading, children, width = 520 }) => {
  return (
    <Modal open={open} onCancel={onCancel} footer={null} centered width={width}>
      <div style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", marginBottom: 18 }}>{title}</div>
      {children}
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 24, paddingTop: 16, borderTop: "1px solid #F1F5F9" }}>
        <button
          onClick={onCancel}
          style={{ padding: "9px 18px", borderRadius: 10, border: "1px solid #E2E8F0", background: "#fff", color: "#334155", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
        >
          Cancel
        </button>
        <button
          onClick={onSubmit}
          disabled={confirmLoading}
          style={{ padding: "9px 18px", borderRadius: 10, border: "none", background: "#111827", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
        >
          {confirmLoading ? "Saving..." : "Save"}
        </button>
      </div>
    </Modal>
  );
};

export default MasterFormModal;
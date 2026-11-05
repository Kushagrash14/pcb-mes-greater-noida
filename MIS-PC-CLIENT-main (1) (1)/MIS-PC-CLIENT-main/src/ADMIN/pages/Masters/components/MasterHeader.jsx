import { Plus } from "lucide-react";

const MasterHeader = ({ title, description, buttonLabel, onAddClick }) => {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, paddingBottom: 20 }}>
      <style>{`
        .master-add-btn { transition: background .15s ease; }
        .master-add-btn:hover { background: #1F2937 !important; }
      `}</style>
      <div>
        <div style={{ fontSize: 19, fontWeight: 700, color: "#0F172A" }}>{title}</div>
        <div style={{ fontSize: 13, color: "#64748B", marginTop: 2 }}>{description}</div>
      </div>
      {buttonLabel && (
        <button
          className="master-add-btn"
          onClick={onAddClick}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "#111827",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            padding: "10px 16px",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <Plus size={16} />
          {buttonLabel}
        </button>
      )}
    </div>
  );
};

export default MasterHeader;
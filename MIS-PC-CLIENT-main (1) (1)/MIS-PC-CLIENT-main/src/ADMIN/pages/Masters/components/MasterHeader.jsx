import { Plus } from "lucide-react";

const ACCENT = "#0891B2";

const MasterHeader = ({ title, description, buttonLabel, onAddClick }) => {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 10,
        paddingBottom: 10,
      }}
    >
      <style>{`
        .master-add-btn {
          display: inline-flex; align-items: center; gap: 6px;
          height: 32px; padding: 0 12px;
          border: none; border-radius: 8px;
          background: ${ACCENT}; color: #fff;
          font: inherit; font-size: 12.5px; font-weight: 600; line-height: 1;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(8,145,178,0.25);
          transition: background .15s ease, box-shadow .15s ease, transform .15s ease;
        }
        .master-add-btn:hover {
          background: #0E7490;
          box-shadow: 0 3px 10px rgba(8,145,178,0.32);
        }
        .master-add-btn:active { transform: translateY(1px); }
      `}</style>

      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
        {/* small accent bar */}
        <div
          style={{
            width: 3,
            height: 28,
            borderRadius: 2,
            background: `linear-gradient(180deg, ${ACCENT}, #6366F1)`,
            flexShrink: 0,
          }}
        />
        <div style={{ minWidth: 0, lineHeight: 1.3 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A" }}>{title}</div>
          {description && (
            <div style={{ fontSize: 12, color: "#64748B", marginTop: 1 }}>{description}</div>
          )}
        </div>
      </div>

      {buttonLabel && (
        <button className="master-add-btn" onClick={onAddClick}>
          <Plus size={14} strokeWidth={2.4} />
          {buttonLabel}
        </button>
      )}
    </div>
  );
};

export default MasterHeader;
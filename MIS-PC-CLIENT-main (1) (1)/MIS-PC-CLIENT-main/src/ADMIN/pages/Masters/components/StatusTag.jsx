const statusStyles = {
  Active: { bg: "#ECFDF5", text: "#16A34A", dot: "#22C55E" },
  Inactive: { bg: "#FEF2F2", text: "#DC2626", dot: "#EF4444" },
  Draft: { bg: "#FFFBEB", text: "#D97706", dot: "#F59E0B" },
};

const StatusTag = ({ status }) => {
  const style = statusStyles[status] || statusStyles.Draft;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "3px 10px",
        borderRadius: 20,
        background: style.bg,
        color: style.text,
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: style.dot }} />
      {status}
    </span>
  );
};

export default StatusTag;
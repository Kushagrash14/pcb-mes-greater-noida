export const hexToRgba = (hex, alpha = 1) => {
  const sanitized = hex.replace("#", "");
  const bigint = parseInt(sanitized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const getStatusColor = (status) => {
  const map = {
    Running: "#16A34A",
    Active: "#16A34A",
    Completed: "#16A34A",
    Idle: "#F59E0B",
    Waiting: "#F59E0B",
    Pending: "#F59E0B",
    "In Progress": "#2563EB",
    Maintenance: "#64748B",
    Fault: "#DC2626",
    Rejected: "#DC2626",
    Critical: "#DC2626",
  };
  return map[status] || "#64748B";
};

export const getProgressColor = (percent) => {
  if (percent >= 90) return "#16A34A";
  if (percent >= 70) return "#2563EB";
  if (percent >= 50) return "#F59E0B";
  return "#DC2626";
};

export const getTrendColor = (isPositive) => (isPositive ? "#16A34A" : "#DC2626");

export const formatDate = (date = new Date()) =>
  date.toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });

export const formatTime = (date = new Date()) =>
  date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });

export const formatNumber = (num) => {
  if (num === null || num === undefined) return "-";
  return Number(num).toLocaleString("en-IN");
};

export const formatPercentage = (num, decimals = 1) => `${Number(num).toFixed(decimals)}%`;
import { PlayCircle, PauseCircle, Cpu, Users, PackageSearch, AlertTriangle } from "lucide-react";

import { summaryData as defaultData } from "../../dashboardData";
import { hexToRgba } from "../../utils/dashboardHelpers";

const SummaryCards = ({ data = defaultData }) => {
  const items = [
    { key: "running", label: "Running Lines", value: `${data.runningLines}/${data.totalLines}`, icon: PlayCircle, color: "#16A34A" },
    { key: "idle", label: "Idle Lines", value: data.idleLines, icon: PauseCircle, color: "#F59E0B" },
    { key: "utilization", label: "Machine Utilization", value: `${data.machineUtilization}%`, icon: Cpu, color: "#2563EB" },
    { key: "operators", label: "Operators Working", value: data.operatorsWorking, icon: Users, color: "#7C3AED" },
    { key: "pending", label: "Pending PCB", value: data.pendingPCB, icon: PackageSearch, color: "#F59E0B" },
    { key: "alerts", label: "Critical Alerts", value: data.criticalAlerts, icon: AlertTriangle, color: "#DC2626" },
  ];

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #E2E8F0",
        borderRadius: 16,
        boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
        height: "100%",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
        alignContent: "center",
      }}
    >
      {items.map((item, index) => {
        const Icon = item.icon;
        return (
          <div
            key={item.key}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "16px 20px",
              borderRight: index !== items.length - 1 ? "1px solid #F1F5F9" : "none",
              borderBottom: index < items.length - (items.length % 3 || 3) ? "none" : "none",
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: hexToRgba(item.color, 0.12),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Icon size={17} color={item.color} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: "#0F172A", lineHeight: 1.2 }}>
                {item.value}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "#64748B",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {item.label}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SummaryCards;
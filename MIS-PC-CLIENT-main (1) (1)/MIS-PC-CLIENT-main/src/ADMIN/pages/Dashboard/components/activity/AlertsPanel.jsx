import { AlertOctagon, Clock, ScanLine, XCircle, AlertTriangle } from "lucide-react";

import { alertsData as defaultData } from "../../dashboardData";
import { hexToRgba } from "../../utils/dashboardHelpers";

const severityConfig = {
  critical: { color: "#DC2626", label: "Critical" },
  warning: { color: "#F59E0B", label: "Warning" },
  info: { color: "#2563EB", label: "Info" },
};

const typeIcons = {
  "Machine Fault": AlertOctagon,
  "Delayed PCB": Clock,
  "Pending Scan": ScanLine,
  "Rejected PCB": XCircle,
  "System Warning": AlertTriangle,
};

const AlertsPanel = ({ data = defaultData }) => {
  return (
    <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 16, padding: 22, boxShadow: "0 1px 2px rgba(15,23,42,0.04)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: "#0F172A" }}>Alerts Panel</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#DC2626", background: "#FEF2F2", padding: "3px 10px", borderRadius: 20 }}>
          {data.length} Active
        </span>
      </div>
      <div style={{ fontSize: 12.5, color: "#64748B", marginBottom: 16 }}>Requires attention from shift supervisor</div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {data.map((alert) => {
          const Icon = typeIcons[alert.type] || AlertTriangle;
          const config = severityConfig[alert.severity] || severityConfig.info;
          return (
            <div
              key={alert.id}
              style={{
                display: "flex",
                gap: 12,
                padding: "12px 14px",
                borderRadius: 12,
                border: `1px solid ${hexToRgba(config.color, 0.25)}`,
                background: hexToRgba(config.color, 0.05),
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 9,
                  background: hexToRgba(config.color, 0.15),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Icon size={16} color={config.color} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>{alert.type}</span>
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: config.color, textTransform: "uppercase", letterSpacing: 0.3, flexShrink: 0 }}>
                    {config.label}
                  </span>
                </div>
                <div style={{ fontSize: 12.5, color: "#475569", marginTop: 3, lineHeight: 1.4 }}>{alert.message}</div>
                <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 5 }}>{alert.time}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AlertsPanel;
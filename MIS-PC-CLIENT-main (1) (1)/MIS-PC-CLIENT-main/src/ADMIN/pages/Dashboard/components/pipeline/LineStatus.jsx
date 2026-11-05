import { PlayCircle, PauseCircle, Wrench, AlertOctagon, User } from "lucide-react";

import { lineStatusData as defaultData } from "../../dashboardData";
import { getStatusColor, hexToRgba, formatNumber } from "../../utils/dashboardHelpers";

const statusIcons = { Running: PlayCircle, Idle: PauseCircle, Maintenance: Wrench, Fault: AlertOctagon };

const LineStatus = ({ data = defaultData }) => {
  return (
    <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 16, padding: 22, boxShadow: "0 1px 2px rgba(15,23,42,0.04)" }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", marginBottom: 2 }}>Line Status</div>
      <div style={{ fontSize: 12.5, color: "#64748B", marginBottom: 18 }}>
        Live status of every production line on the floor
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
        {data.map((line) => {
          const StatusIcon = statusIcons[line.status] || PlayCircle;
          const color = getStatusColor(line.status);
          return (
            <div key={line.id} style={{ border: "1px solid #E2E8F0", borderRadius: 12, padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>{line.lineName}</div>
                  <div style={{ fontSize: 10.5, color: "#94A3B8", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.3 }}>
                    {line.type}
                  </div>
                </div>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 9,
                    background: hexToRgba(color, 0.12),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <StatusIcon size={16} color={color} />
                </div>
              </div>

              <span
                style={{
                  display: "inline-block",
                  fontSize: 10.5,
                  fontWeight: 700,
                  padding: "3px 9px",
                  borderRadius: 20,
                  background: hexToRgba(color, 0.12),
                  color,
                  textTransform: "uppercase",
                  letterSpacing: 0.3,
                  marginBottom: 12,
                }}
              >
                {line.status}
              </span>

              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#64748B", marginBottom: 6 }}>
                <User size={13} />
                <span>{line.operator}</span>
              </div>
              <div style={{ fontSize: 12, color: "#64748B" }}>
                Today's Output: <strong style={{ color: "#0F172A" }}>{formatNumber(line.todayOutput)} PCB</strong>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LineStatus;
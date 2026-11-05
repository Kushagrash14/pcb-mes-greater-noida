import { ArrowRight } from "lucide-react";

import { productionFlowData as defaultData } from "../../dashboardData";
import { getProgressColor, getStatusColor, hexToRgba, formatNumber } from "../../utils/dashboardHelpers";

const ProductionFlow = ({ data = defaultData }) => {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #E2E8F0",
        borderRadius: 16,
        padding: 22,
        boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
      }}
    >
      <style>{`
        @keyframes pf-pulse {
          0% { box-shadow: 0 0 0 0 rgba(22,163,74,0.45); }
          70% { box-shadow: 0 0 0 6px rgba(22,163,74,0); }
          100% { box-shadow: 0 0 0 0 rgba(22,163,74,0); }
        }
        .pf-live-dot { animation: pf-pulse 1.8s infinite; }
        @keyframes pf-flow {
          0% { left: -6px; opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { left: calc(100% - 6px); opacity: 0; }
        }
        .pf-connector-dot { animation: pf-flow 2.2s linear infinite; }
      `}</style>

      <div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", marginBottom: 2 }}>
        Live Production Flow
      </div>
      <div style={{ fontSize: 12.5, color: "#64748B", marginBottom: 20 }}>
        Real-time PCB movement across manufacturing stages
      </div>

      <div style={{ display: "flex", alignItems: "stretch" }}>
        {data.map((stage, index) => {
          const statusColor = getStatusColor(stage.status);
          return (
            <div
              key={stage.id}
              style={{ display: "flex", alignItems: "center", flex: index === data.length - 1 ? "0 0 auto" : 1 }}
            >
              <div
                style={{
                  minWidth: 152,
                  border: "1px solid #E2E8F0",
                  borderRadius: 12,
                  padding: "14px 16px",
                  background: "#F8FAFC",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
                  <span
                    className="pf-live-dot"
                    style={{ width: 7, height: 7, borderRadius: "50%", background: "#16A34A" }}
                  />
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: "#0F172A" }}>{stage.stage}</span>
                </div>

                <div style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", marginBottom: 8 }}>
                  {formatNumber(stage.count)}
                </div>

                <span
                  style={{
                    display: "inline-block",
                    fontSize: 10.5,
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: 20,
                    background: hexToRgba(statusColor, 0.12),
                    color: statusColor,
                    textTransform: "uppercase",
                    letterSpacing: 0.3,
                    marginBottom: 10,
                  }}
                >
                  {stage.status}
                </span>

                <div style={{ height: 5, background: "#E2E8F0", borderRadius: 10, overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${stage.progress}%`,
                      background: getProgressColor(stage.progress),
                      borderRadius: 10,
                    }}
                  />
                </div>
                <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 5, fontWeight: 500 }}>
                  {stage.progress}% throughput
                </div>
              </div>

              {index !== data.length - 1 && (
                <div
                  style={{
                    position: "relative",
                    flex: 1,
                    height: 2,
                    margin: "0 8px",
                    background: "#E2E8F0",
                    minWidth: 30,
                  }}
                >
                  <span
                    className="pf-connector-dot"
                    style={{
                      position: "absolute",
                      top: -3,
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "#2563EB",
                    }}
                  />
                  <ArrowRight size={14} color="#94A3B8" style={{ position: "absolute", right: -2, top: -6 }} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProductionFlow;
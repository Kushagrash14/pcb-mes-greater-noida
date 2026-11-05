import { PlayCircle, Clock, CheckCircle2, XCircle } from "lucide-react";
import { Progress } from "antd";

import { pipelineStages as defaultData } from "../../dashboardData";
import { getProgressColor, formatNumber } from "../../utils/dashboardHelpers";

const ProductionPipeline = ({ data = defaultData }) => {
  return (
    <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 16, padding: 22, boxShadow: "0 1px 2px rgba(15,23,42,0.04)" }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", marginBottom: 2 }}>Production Pipeline</div>
      <div style={{ fontSize: 12.5, color: "#64748B", marginBottom: 18 }}>
        Stage-wise breakdown of PCB status across the line
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
        {data.map((stage) => {
          const total = stage.running + stage.waiting + stage.completed + stage.rejected;
          return (
            <div key={stage.id} style={{ border: "1px solid #E2E8F0", borderRadius: 12, padding: 16, background: "#F8FAFC" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontSize: 13.5, fontWeight: 700, color: "#0F172A" }}>{stage.name}</span>
                <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600 }}>{formatNumber(total)} total</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <PlayCircle size={14} color="#2563EB" />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>{formatNumber(stage.running)}</div>
                    <div style={{ fontSize: 10.5, color: "#94A3B8" }}>Running</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <Clock size={14} color="#F59E0B" />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>{formatNumber(stage.waiting)}</div>
                    <div style={{ fontSize: 10.5, color: "#94A3B8" }}>Waiting</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <CheckCircle2 size={14} color="#16A34A" />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>{formatNumber(stage.completed)}</div>
                    <div style={{ fontSize: 10.5, color: "#94A3B8" }}>Completed</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <XCircle size={14} color="#DC2626" />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>{formatNumber(stage.rejected)}</div>
                    <div style={{ fontSize: 10.5, color: "#94A3B8" }}>Rejected</div>
                  </div>
                </div>
              </div>

              <Progress
                percent={stage.progress}
                showInfo={false}
                strokeColor={getProgressColor(stage.progress)}
                trailColor="#E2E8F0"
                size="small"
              />
              <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 5, fontWeight: 500 }}>
                {stage.progress}% stage completion
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProductionPipeline;
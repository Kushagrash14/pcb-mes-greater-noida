import { Progress } from "antd";
import { Factory } from "lucide-react";

import { factoryOverviewData as defaultData } from "../../dashboardData";
import { getProgressColor, formatNumber } from "../../utils/dashboardHelpers";

const FactoryOverview = ({ data = defaultData }) => {
  const completionPercent = Math.round((data.currentProduction / data.targetProduction) * 100);

  const stats = [
    { label: "Machine Utilization", value: data.machineUtilization },
    { label: "Overall Efficiency", value: data.overallEfficiency },
    { label: "Target Completion", value: completionPercent },
  ];

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #E2E8F0",
        borderRadius: 16,
        padding: 22,
        boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
        <Factory size={17} color="#0F172A" />
        <span style={{ fontSize: 15, fontWeight: 700, color: "#0F172A" }}>Factory Overview</span>
      </div>
      <div style={{ fontSize: 12.5, color: "#64748B", marginBottom: 18 }}>{data.shiftLabel}</div>

      <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
        <Progress
          type="dashboard"
          percent={data.factoryHealth}
          strokeColor={getProgressColor(data.factoryHealth)}
          size={148}
          strokeWidth={8}
          format={(percent) => (
            <div>
              <div style={{ fontSize: 26, fontWeight: 700, color: "#0F172A" }}>{percent}%</div>
              <div
                style={{
                  fontSize: 11,
                  color: "#94A3B8",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: 0.3,
                }}
              >
                Factory Health
              </div>
            </div>
          )}
        />
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "10px 14px",
          background: "#F8FAFC",
          borderRadius: 10,
          marginBottom: 16,
          border: "1px solid #F1F5F9",
        }}
      >
        <div>
          <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600 }}>Current Production</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A" }}>
            {formatNumber(data.currentProduction)} PCB
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600 }}>Target</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A" }}>
            {formatNumber(data.targetProduction)} PCB
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {stats.map((stat) => (
          <div key={stat.label}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ fontSize: 12.5, color: "#64748B", fontWeight: 500 }}>{stat.label}</span>
              <span style={{ fontSize: 12.5, color: "#0F172A", fontWeight: 700 }}>{stat.value}%</span>
            </div>
            <Progress
              percent={stat.value}
              showInfo={false}
              strokeColor={getProgressColor(stat.value)}
              railColor="#F1F5F9"
              size="small"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default FactoryOverview;
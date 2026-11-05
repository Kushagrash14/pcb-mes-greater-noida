import { Boxes, CheckCircle2, Activity, XCircle, Gauge, Target, ArrowUpRight, ArrowDownRight } from "lucide-react";

import { kpiData as defaultData } from "../../dashboardData";
import { hexToRgba, getTrendColor, formatNumber } from "../../utils/dashboardHelpers";

const iconMap = { Boxes, CheckCircle2, Activity, XCircle, Gauge, Target };

const DashboardCards = ({ data = defaultData }) => {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
        gap: 16,
      }}
    >
      <style>{`
        .kpi-card { transition: transform .18s ease, box-shadow .18s ease; }
        .kpi-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(15,23,42,0.08); }
      `}</style>

      {data.map((item) => {
        const Icon = iconMap[item.icon] || Activity;
        const trendColor = item.trendValue != null ? getTrendColor(item.isPositive) : null;
        const TrendIcon = item.trendDirection === "down" ? ArrowDownRight : ArrowUpRight;

        return (
          <div
            key={item.id}
            className="kpi-card"
            style={{
              background: "#fff",
              border: "1px solid #E2E8F0",
              borderRadius: 16,
              padding: "18px 20px",
              boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <span style={{ fontSize: 13, color: "#64748B", fontWeight: 500 }}>{item.title}</span>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: hexToRgba(item.accent, 0.12),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Icon size={18} color={item.accent} strokeWidth={2} />
              </div>
            </div>

            <div style={{ marginTop: 14, display: "flex", alignItems: "baseline", gap: 6 }}>
              <span style={{ fontSize: 26, fontWeight: 700, color: "#0F172A" }}>
                {formatNumber(item.value)}
              </span>
              <span style={{ fontSize: 12, color: "#94A3B8", fontWeight: 500 }}>{item.unit}</span>
            </div>

            {item.trendValue != null && (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  marginTop: 10,
                  padding: "3px 8px",
                  borderRadius: 20,
                  background: hexToRgba(trendColor, 0.1),
                  color: trendColor,
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                <TrendIcon size={13} />
                {item.trendValue}%
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default DashboardCards;
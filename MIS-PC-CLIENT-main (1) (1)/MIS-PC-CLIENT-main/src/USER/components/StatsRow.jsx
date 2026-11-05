import React from "react";
import { Row, Col, Typography } from "antd";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

const { Text } = Typography;

// Pastel KPI card — solid tinted background + colored border + bold colored
// value, matching the app's badge/pill visual language (no glass/blur).
// Pass `chartPercent` (0-100) to render a small donut ring — used on
// ACHIEVED / REMAINS % so those two read as progress at a glance.
function StatCard({ title, value, color, chartPercent }) {
  const hasChart = typeof chartPercent === "number" && !Number.isNaN(chartPercent);
  const clamped = hasChart ? Math.min(100, Math.max(0, chartPercent)) : 0;
  const chartData = hasChart
    ? [
        { name: "filled", value: clamped },
        { name: "remaining", value: 100 - clamped },
      ]
    : null;

  return (
    <Col span={6}>
      <div
        style={{
          height: "100%",
          borderRadius: 14,
          padding: "12px 14px",
          background: `${color}12`,
          border: `1.5px solid ${color}40`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 22,
              height: 22,
              borderRadius: 7,
              background: `${color}22`,
              marginBottom: 8,
            }}
          >
            <div style={{ width: 8, height: 8, borderRadius: 3, background: color }} />
          </div>
          <Text
            style={{
              display: "block",
              color,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 0.3,
              opacity: 0.85,
              marginBottom: 2,
            }}
          >
            {title}
          </Text>
          <Text style={{ fontSize: 22, fontWeight: 800, color }}>{value}</Text>
        </div>

        {hasChart && (
          <div style={{ width: 50, height: 50, flexShrink: 0, position: "relative" }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  innerRadius={14}
                  outerRadius={24}
                  startAngle={90}
                  endAngle={-270}
                  stroke="none"
                  isAnimationActive
                >
                  <Cell fill={color} />
                  <Cell fill={`${color}25`} />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 9.5,
                fontWeight: 700,
                color,
              }}
            >
              {clamped}%
            </div>
          </div>
        )}
      </div>
    </Col>
  );
}

export default function StatsRow({ stageStats }) {
  return (
    <Row gutter={14} style={{ flexShrink: 0, height: 100 }}>
      <StatCard title="PLAN" value={stageStats.targetQty} color="#3a6d95" />
      <StatCard title="PRODUCTION" value={stageStats.achievedQty} color="#c9820a" />
      <StatCard
        title="ACHIEVED"
        value={stageStats.achievedQty}
        color="#0f9a90"
        chartPercent={stageStats.achievementPercent}
      />
      <StatCard
        title="REMAINS "
        value={`${stageStats.remainsQty}`}
        color="#d1483c"
        chartPercent={
          stageStats.targetQty
            ? ((stageStats.achievedQty / stageStats.targetQty) * 100).toFixed(2)
            : 0
        }      
      />
    </Row>
  );
}

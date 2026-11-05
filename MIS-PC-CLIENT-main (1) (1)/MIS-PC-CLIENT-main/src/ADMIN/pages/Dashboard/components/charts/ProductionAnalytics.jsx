import { useState } from "react";
import { Segmented } from "antd";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

import { dailyProductionData, efficiencyTrendData, stageDistributionData } from "../../dashboardData";

const views = ["Daily Production", "Efficiency", "Stage Distribution"];

const ProductionAnalytics = ({
  daily = dailyProductionData,
  efficiency = efficiencyTrendData,
  stageDistribution = stageDistributionData,
}) => {
  const [view, setView] = useState(views[0]);

  return (
    <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 16, padding: 22, boxShadow: "0 1px 2px rgba(15,23,42,0.04)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A" }}>Production Analytics</div>
          <div style={{ fontSize: 12.5, color: "#64748B", marginTop: 2 }}>Trends across the last 7 days</div>
        </div>
        <Segmented options={views} value={view} onChange={setView} />
      </div>

      <div style={{ width: "100%", height: 280 }}>
        <ResponsiveContainer>
          {view === "Daily Production" ? (
            <BarChart data={daily} barGap={6}>
              <CartesianGrid vertical={false} stroke="#F1F5F9" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#94A3B8" }} axisLine={{ stroke: "#E2E8F0" }} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <RTooltip contentStyle={{ borderRadius: 10, border: "1px solid #E2E8F0", fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="produced" name="Produced" fill="#2563EB" radius={[6, 6, 0, 0]} />
              <Bar dataKey="target" name="Target" fill="#E2E8F0" radius={[6, 6, 0, 0]} />
            </BarChart>
          ) : view === "Efficiency" ? (
            <LineChart data={efficiency}>
              <CartesianGrid vertical={false} stroke="#F1F5F9" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#94A3B8" }} axisLine={{ stroke: "#E2E8F0" }} tickLine={false} />
              <YAxis domain={[85, 100]} tick={{ fontSize: 12, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <RTooltip contentStyle={{ borderRadius: 10, border: "1px solid #E2E8F0", fontSize: 12 }} />
              <Line type="monotone" dataKey="efficiency" name="Efficiency %" stroke="#16A34A" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          ) : (
            <PieChart>
              <Pie data={stageDistribution} dataKey="value" nameKey="name" innerRadius={70} outerRadius={100} paddingAngle={3}>
                {stageDistribution.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <RTooltip contentStyle={{ borderRadius: 10, border: "1px solid #E2E8F0", fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ProductionAnalytics;
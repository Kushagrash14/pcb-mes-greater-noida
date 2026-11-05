import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

import { hourlyProductionData as defaultData } from "../../dashboardData";

const HourlyProductionChart = ({ data = defaultData }) => {
  return (
    <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 16, padding: 22, boxShadow: "0 1px 2px rgba(15,23,42,0.04)" }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", marginBottom: 2 }}>Hourly Production</div>
      <div style={{ fontSize: 12.5, color: "#64748B", marginBottom: 18 }}>Today's actual output vs hourly target</div>

      <div style={{ width: "100%", height: 260 }}>
        <ResponsiveContainer>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="actualFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563EB" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#F1F5F9" />
            <XAxis dataKey="hour" tick={{ fontSize: 12, fill: "#94A3B8" }} axisLine={{ stroke: "#E2E8F0" }} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #E2E8F0", fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Area type="monotone" dataKey="target" name="Target" stroke="#94A3B8" strokeDasharray="4 4" fill="none" />
            <Area type="monotone" dataKey="actual" name="Actual" stroke="#2563EB" strokeWidth={2.5} fill="url(#actualFill)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default HourlyProductionChart;
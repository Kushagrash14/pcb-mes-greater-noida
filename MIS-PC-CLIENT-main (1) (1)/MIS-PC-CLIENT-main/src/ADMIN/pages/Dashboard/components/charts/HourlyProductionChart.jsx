
import { useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Select, Spin, Alert, Empty } from "antd";
import dashboardService from "../../services/dashboardService";

const PERIOD_OPTIONS = [
  { value: 0, label: "12 AM – 6 AM" },
  { value: 1, label: "6 AM – 12 PM" },
  { value: 2, label: "12 PM – 6 PM" },
  { value: 3, label: "6 PM – 12 AM" },
];

const COLORS = [
  "#2563EB",
  "#16A34A",
  "#EA580C",
  "#9333EA",
  "#0891B2",
  "#DB2777",
  "#64748B",
  "#CA8A04",
];

const getLocalDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getCurrentPeriod = () => Math.floor(new Date().getHours() / 6);

const HourlyProductionChart = ({ factoryId = null }) => {
  const [period, setPeriod] = useState(getCurrentPeriod);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const fetchData = async (showLoading = false) => {
      try {
        if (showLoading) setLoading(true);

        setError("");

        const result = await dashboardService.getHourlyProduction(
          getLocalDate(),
          period,
          factoryId
        );

        if (active) setData(result);
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message ||
              "Unable to load hourly production."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchData(true);

    const interval = setInterval(() => fetchData(false), 30000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [period, factoryId]);

  const { chartData, lines } = useMemo(() => {
    const sourceLines = data?.lines || [];

    const rows = Array.from({ length: 6 }, (_, index) => {
      const hour = (data?.startHour ?? period * 6) + index;

      const row = {
        hour,
        label: sourceLines[0]?.hourlyData?.[index]?.label ??
          `${hour % 12 || 12} ${hour < 12 ? "AM" : "PM"}`,
      };

      sourceLines.forEach((line) => {
        row[`line_${line.lineId}`] =
          Number(line.hourlyData?.[index]?.quantity || 0);
      });

      return row;
    });

    return {
      chartData: rows,
      lines: sourceLines,
    };
  }, [data, period]);

  return (
    <section
      style={{
        background: "#fff",
        border: "1px solid #E2E8F0",
        borderRadius: 16,
        padding: 22,
        boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#0F172A" }}>
            Hourly Production
          </div>
          <div style={{ fontSize: 12, color: "#64748B", marginTop: 4 }}>
            Production output by line · {getLocalDate()}
          </div>
        </div>

        <Select
          value={period}
          options={PERIOD_OPTIONS}
          onChange={setPeriod}
          style={{ width: 170 }}
        />
      </div>

      {error && (
        <Alert
          type="error"
          showIcon
          message={error}
          style={{ marginBottom: 16 }}
        />
      )}

      {loading ? (
        <div style={{ height: 300, display: "grid", placeItems: "center" }}>
          <Spin />
        </div>
      ) : lines.length === 0 ? (
        <Empty description="No active production lines found" />
      ) : (
        <>
          <div style={{ display: "flex", gap: 24, marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 12, color: "#64748B" }}>
                Total production
              </div>
              <div style={{ fontSize: 25, fontWeight: 700, color: "#0F172A" }}>
                {data?.totalProduced ?? 0}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#64748B" }}>
                Active lines
              </div>
              <div style={{ fontSize: 25, fontWeight: 700, color: "#0F172A" }}>
                {lines.length}
              </div>
            </div>
          </div>

          <div style={{ width: "100%", height: 320 }}>
            <ResponsiveContainer>
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
                barGap={3}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#E2E8F0"
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12, fill: "#64748B" }}
                  axisLine={{ stroke: "#E2E8F0" }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 12, fill: "#64748B" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 10,
                    border: "1px solid #E2E8F0",
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />

                {lines.map((line, index) => (
                  <Bar
                    key={line.lineId}
                    dataKey={`line_${line.lineId}`}
                    name={line.lineName}
                    fill={COLORS[index % COLORS.length]}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={32}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </section>
  );
};

export default HourlyProductionChart;

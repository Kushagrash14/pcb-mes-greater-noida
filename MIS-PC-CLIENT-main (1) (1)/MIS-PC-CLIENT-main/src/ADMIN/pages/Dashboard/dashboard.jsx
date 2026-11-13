import { RefreshCw, Boxes, Target, TrendingUp, Clock3 } from "lucide-react";
import { Skeleton, Alert } from "antd";

import useDashboard from "./hooks/useDashboard";
import HourlyProductionChart from "./components/charts/HourlyProductionChart";

const formatNumber = (value) =>
  Number(value || 0).toLocaleString("en-IN");

const Dashboard = () => {
  const { data, loading, refreshing, error, refresh } = useDashboard();

  const cards = [
    {
      title: "Today's Production",
      value: data?.producedQty,
      unit: "Units",
      icon: Boxes,
      color: "#2563EB",
    },
    {
      title: "Today's Target",
      value: data?.targetQty,
      unit: "Units",
      icon: Target,
      color: "#7C3AED",
    },
    {
      title: "Target Achievement",
      value: data?.achievementPercentage,
      unit: "%",
      icon: TrendingUp,
      color: "#16A34A",
    },
    {
      title: "Remaining Production",
      value: data?.remainingQty,
      unit: "Units",
      icon: Clock3,
      color: "#D97706",
    },
  ];

  if (loading && !data) {
    return (
      <div style={{ padding: 24 }}>
        <Skeleton active paragraph={{ rows: 4 }} />
      </div>
    );
  }

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 24 }}>
      <style>{`
        .dashboard-kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 18px;
        }

        .dashboard-kpi {
          background: #fff;
          border: 1px solid #E2E8F0;
          border-radius: 14px;
          padding: 22px;
          min-width: 0;
        }

        .dashboard-refresh {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px 16px;
          border: 1px solid #E2E8F0;
          border-radius: 9px;
          background: #fff;
          color: #334155;
          cursor: pointer;
          font-weight: 600;
        }

        .dashboard-refresh:disabled {
          opacity: .6;
          cursor: not-allowed;
        }

        @media (max-width: 1100px) {
          .dashboard-kpi-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 600px) {
          .dashboard-kpi-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 16,
        flexWrap: "wrap",
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#0F172A" }}>
            Production Command Center
          </h2>

          <div style={{ marginTop: 6, color: "#64748B", fontSize: 13 }}>
            Live factory production overview · {data?.date || ""}
          </div>
        </div>

        <button
          className="dashboard-refresh"
          onClick={refresh}
          disabled={refreshing}
        >
          <RefreshCw size={16} />
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error && (
        <Alert
          type="error"
          showIcon
          message="Dashboard data unavailable"
          description={error}
        />
      )}

      <div className="dashboard-kpi-grid">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div className="dashboard-kpi" key={card.title}>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}>
                <span style={{ color: "#64748B", fontSize: 13, fontWeight: 500 }}>
                  {card.title}
                </span>

                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: `${card.color}15`,
                  display: "grid",
                  placeItems: "center",
                }}>
                  <Icon size={19} color={card.color} />
                </div>
              </div>

              <div style={{
                marginTop: 18,
                fontSize: 30,
                fontWeight: 750,
                color: "#0F172A",
              }}>
                {card.value === undefined || card.value === null
                  ? "0"
                  : formatNumber(card.value)}
                <span style={{
                  marginLeft: 7,
                  fontSize: 12,
                  color: "#94A3B8",
                  fontWeight: 500,
                }}>
                  {card.unit}
                </span>
              </div>
            </div>
          );
        })}
      </div>


      <HourlyProductionChart />
    </div>
  );
};

export default Dashboard;
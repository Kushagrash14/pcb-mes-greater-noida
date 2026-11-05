import { Skeleton } from "antd";

import DashboardHeader from "./components/DashboardHeader";
import DashboardCards from "./components/cards/DashboardCards";
import SummaryCards from "./components/cards/SummaryCards";
import FactoryOverview from "./components/pipeline/FactoryOverview";
import ProductionFlow from "./components/pipeline/ProductionFlow";
import ProductionPipeline from "./components/pipeline/ProductionPipeline";
import LineStatus from "./components/pipeline/LineStatus";
import RecentActivity from "./components/activity/RecentActivity";
import AlertsPanel from "./components/activity/AlertsPanel";
import ProductionAnalytics from "./components/charts/ProductionAnalytics";
import HourlyProductionChart from "./components/charts/HourlyProductionChart";

import useDashboard from "./hooks/useDashboard";

const Dashboard = () => {
  const { data, loading, refresh } = useDashboard();

  if (loading || !data) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <Skeleton active paragraph={{ rows: 1 }} />
        <Skeleton active paragraph={{ rows: 4 }} />
        <Skeleton active paragraph={{ rows: 6 }} />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <style>{`
        .db-grid-factory { display: grid; grid-template-columns: 340px 1fr; gap: 20px; }
        .db-grid-charts { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .db-grid-feed { display: grid; grid-template-columns: 1.6fr 1fr; gap: 20px; }
        @media (max-width: 1200px) {
          .db-grid-factory, .db-grid-charts, .db-grid-feed { grid-template-columns: 1fr; }
        }
      `}</style>

      <DashboardHeader shiftInfo={data.shift} alertsCount={data.alerts.length} onRefresh={refresh} />

      <DashboardCards data={data.kpis} />

      <ProductionFlow data={data.flow} />

      <div className="db-grid-factory">
        <FactoryOverview data={data.factory} />
        <SummaryCards data={data.summary} />
      </div>

      <ProductionPipeline data={data.pipeline} />

      <LineStatus data={data.lines} />

      <div className="db-grid-charts">
        <ProductionAnalytics daily={data.daily} efficiency={data.efficiency} stageDistribution={data.stageDist} />
        <HourlyProductionChart data={data.hourly} />
      </div>

      <div className="db-grid-feed">
        <RecentActivity data={data.activity} />
        <AlertsPanel data={data.alerts} />
      </div>
    </div>
  );
};

export default Dashboard;
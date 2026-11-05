import {
  shiftInfo,
  kpiData,
  summaryData,
  factoryOverviewData,
  productionFlowData,
  pipelineStages,
  lineStatusData,
  recentActivityData,
  alertsData,
  hourlyProductionData,
  dailyProductionData,
  efficiencyTrendData,
  stageDistributionData,
} from "../dashboardData";

const simulateDelay = (data, ms = 500) =>
  new Promise((resolve) => setTimeout(() => resolve(data), ms));

// Each method below is a 1:1 stand-in for a future backend endpoint.
// Swap the simulateDelay(...) body for a real fetch/axios call when the API is ready —
// the return shape should stay the same so components never need to change.
export const dashboardService = {
  getShiftInfo: () => simulateDelay(shiftInfo),
  getKpiData: () => simulateDelay(kpiData),
  getSummaryData: () => simulateDelay(summaryData),
  getFactoryOverview: () => simulateDelay(factoryOverviewData),
  getProductionFlow: () => simulateDelay(productionFlowData),
  getPipelineStages: () => simulateDelay(pipelineStages),
  getLineStatus: () => simulateDelay(lineStatusData),
  getRecentActivity: () => simulateDelay(recentActivityData),
  getAlerts: () => simulateDelay(alertsData),
  getHourlyProduction: () => simulateDelay(hourlyProductionData),
  getDailyProduction: () => simulateDelay(dailyProductionData),
  getEfficiencyTrend: () => simulateDelay(efficiencyTrendData),
  getStageDistribution: () => simulateDelay(stageDistributionData),

  getAllDashboardData: async () => {
    const [shift, kpis, summary, factory, flow, pipeline, lines, activity, alerts, hourly, daily, efficiency, stageDist] =
      await Promise.all([
        simulateDelay(shiftInfo),
        simulateDelay(kpiData),
        simulateDelay(summaryData),
        simulateDelay(factoryOverviewData),
        simulateDelay(productionFlowData),
        simulateDelay(pipelineStages),
        simulateDelay(lineStatusData),
        simulateDelay(recentActivityData),
        simulateDelay(alertsData),
        simulateDelay(hourlyProductionData),
        simulateDelay(dailyProductionData),
        simulateDelay(efficiencyTrendData),
        simulateDelay(stageDistributionData),
      ]);

    return { shift, kpis, summary, factory, flow, pipeline, lines, activity, alerts, hourly, daily, efficiency, stageDist };
  },
};

export default dashboardService;
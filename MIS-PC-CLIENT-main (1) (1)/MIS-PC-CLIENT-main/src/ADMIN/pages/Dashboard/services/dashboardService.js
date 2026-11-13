import api from "../../../../services/API/api";

const dashboardService = {
  getOverview: async (date, factoryId = null) => {
    const params = { date };

    if (factoryId) {
      params.factoryId = factoryId;
    }

    const response = await api.get("/dashboard/overview", {
      params,
    });

    return response.data.data;
  },

  getHourlyProduction: async (date, period, factoryId = null) => {
    const params = { date, period };

    if (factoryId) params.factoryId = factoryId;

    const response = await api.get("/dashboard/hourly-production", {
      params,
    });

    return response.data.data;
  },

};

export default dashboardService;
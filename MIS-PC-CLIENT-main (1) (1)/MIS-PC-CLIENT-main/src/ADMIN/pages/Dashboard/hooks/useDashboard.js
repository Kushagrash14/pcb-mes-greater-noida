import { useState, useEffect, useCallback } from "react";
import dashboardService from "../services/dashboardService";

const getLocalDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const useDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      setError("");

      const result = await dashboardService.getOverview(getLocalDate());

      setData(result);
    } catch (err) {
      console.error("Dashboard API error:", err);

      setError(
        err.response?.data?.message ||
        "Unable to load dashboard data."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    const interval = setInterval(() => {
      fetchData(true);
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchData]);

  return {
    data,
    loading,
    refreshing,
    error,
    refresh: () => fetchData(true),
  };
};

export default useDashboard;
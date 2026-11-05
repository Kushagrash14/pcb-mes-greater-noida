
import { useCallback, useEffect, useState } from "react";
import { notification } from "antd";
import api from "../../services/API/api";

export default function useRecentScans({
  user,
  productId,
  productionOrderId,
}) {
  const [recentScans, setRecentScans] = useState([]);

  const factoryId = user?.factory?.id;
  const lineId = user?.line?.id;
  const stageId = user?.stage?.id;

  const fetchLatestScans = useCallback(async () => {
    if (
      !factoryId ||
      !lineId ||
      !stageId ||
      !productId ||
      !productionOrderId
    ) {
      setRecentScans([]);
      return;
    }

    try {
      const res = await api.get(
        `/scan-history/latest-scans/${factoryId}/${productId}/${lineId}/${stageId}/${productionOrderId}`
      );

      const rows = res?.data?.data ?? [];
      setRecentScans(Array.isArray(rows) ? rows : []);
    } catch (err) {
      setRecentScans([]);

      notification.error({
        message: "Failed to load latest scans",
        description:
          err?.response?.data?.message ||
          "Could not fetch the latest scans for this production order.",
        placement: "topRight",
      });
    }
  }, [
    factoryId,
    lineId,
    stageId,
    productId,
    productionOrderId,
  ]);

  useEffect(() => {
    fetchLatestScans();
  }, [fetchLatestScans]);

  return {
    recentScans,
    setRecentScans,
    fetchLatestScans,
  };
}


import { useEffect, useState } from "react";
import { notification } from "antd";
import api from "../../services/API/api";

export default function useStageFlow({ productId, user }) {
  const [stageFlowRows, setStageFlowRows] = useState([]);
  const [stageFlow, setStageFlow] = useState(null);

  const lineId = user?.line?.id;
  const stageId = user?.stage?.id;

  const STAGES = stageFlowRows.map((row) => row.stage_name);
  const assignedStageIndex = stageFlow
    ? stageFlow.sequence_no - 1
    : -1;

  useEffect(() => {
    if (!productId || !lineId) {
      setStageFlowRows([]);
      setStageFlow(null);
      return;
    }

    const fetchStageFlow = async () => {
      try {
        const res = await api.get(
          `/product-stage-flow/${productId}/${lineId}`
        );

        const payload = res?.data || [];
        const rows = Array.isArray(payload)
          ? payload
          : payload
            ? [payload]
            : [];

        const sorted = [...rows].sort(
          (a, b) => a.sequence_no - b.sequence_no
        );

        setStageFlowRows(sorted);

        const matched =
          sorted.find(
            (row) => Number(row.stage_id) === Number(stageId)
          ) || null;

        setStageFlow(matched);
      } catch (err) {
        setStageFlowRows([]);
        setStageFlow(null);

        notification.error({
          message: "Stage flow load failed",
          description:
            "Could not load the scan stage sequence for this product and production line.",
          placement: "topRight",
        });
      }
    };

    fetchStageFlow();
  }, [productId, lineId, stageId]);

  return {
    stageFlowRows,
    stageFlow,
    STAGES,
    assignedStageIndex,
  };
}

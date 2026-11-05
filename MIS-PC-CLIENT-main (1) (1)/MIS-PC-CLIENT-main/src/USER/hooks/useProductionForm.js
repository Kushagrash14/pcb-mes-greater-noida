import { useEffect, useState } from "react";
import { notification } from "antd";
import { EMPTY_FORM, EMPTY_STAGE_STATS } from "../constants/form";

// Form fields, product selection, and the New/Edit/Save/Cancel mode
// machinery. Deliberately knows nothing about scanning, stage flow, or the
// server round-trips for a scan — see useScanSubmission for that.
export default function useProductionForm({ user }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [mode, setMode] = useState("view"); // "view" | "new" | "edit"
  const [status, setStatus] = useState("SUCCESS");
  const [selected, setSelected] = useState(null);
  const [stageStats, setStageStats] = useState(EMPTY_STAGE_STATS);

  const isEditable = mode === "new" || mode === "edit";

  // Mirrors the original behavior: deselecting the product (New/Cancel,
  // or clearing the Select) always drops back to zeroed KPI stats.
  useEffect(() => {
    if (!form.productId) {
      setStageStats(EMPTY_STAGE_STATS);
    }
  }, [form.productId]);

  const updateField = (key) => (e) => {
    const value = e?.target ? e.target.value : e;
    setForm((f) => ({ ...f, [key]: value }));
  };

  const generateUniqueIdPlanNo = () => {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const currentTimeInMs = Date.now().toString().slice(-6);
    const productId = form.productId || "UNKNOWN";
    const productFirst3 = form.productName ? form.productName.slice(0, 3).toUpperCase() : "UNK";
    return `${productFirst3}-${today}-${productId}-${currentTimeInMs}`;
  };

  
const handleErpSelect = (productId, products) => {
  const selectedProduct = products.find(
    (p) => Number(p.id) === Number(productId)
  );

  setSelected(selectedProduct || null);

  // Clear any previously selected production order.
  setForm((f) => ({
    ...f,
    productId: productId ?? null,
    productionOrderId: null,
    erpNo: selectedProduct?.erp_no || "",
    productName: selectedProduct?.name || "",
    station: user?.stage?.name || "",
    itemPlanned: selectedProduct?.erp_no || "",
    planNo: "",
    planQty: 0,
    doneQty: 0,
    date: new Date().toISOString().slice(0, 10),
    machineName: user?.line?.name || "",
    wipBarCode: "",
  }));

  // Product selection alone must not display PO statistics.
  setStageStats(EMPTY_STAGE_STATS);
};

const handleOrderSelect = (orderId, orders) => {
  
  const order = orders.find(
    (item) => Number(item.production_order_id) === Number(orderId)
  );

  if (!order || Number(order.product_id) !== Number(form.productId)) {
    notification.error({
      message: "Invalid production order",
      description: "Select a running order belonging to the selected product.",
      placement: "topRight",
    });
    return;
  }

  setForm((f) => ({
    ...f,
    productionOrderId: Number(order.production_order_id),
    planNo: order.production_order_no || "",
    itemPlanned: order.erp_no || f.erpNo || "",
    planQty: Number(order.target_qty || 0),
    doneQty: Number(order.achieved_qty || 0),
    date: order.planned_date
      ? String(order.planned_date).slice(0, 10)
      : f.date,
    machineName: order.line_name || user?.line?.name || "",
  }));

  const targetQty = Number(order.target_qty || 0);
  const achievedQty = Number(order.achieved_qty || 0);
  const remainingQty = Math.max(targetQty - achievedQty, 0);

  setStageStats({
    targetQty,
    achievedQty,
    remainingQty,
    achievementPercent:
      targetQty > 0
        ? Number(((achievedQty / targetQty) * 100).toFixed(1))
        : 0,
    production_order_status: order.production_order_status || "RUNNING",
    remainsQty: remainingQty,
  });
};


  const handleNew = () => {
    setForm(EMPTY_FORM);
    setSelected(null);
    setStageStats(EMPTY_STAGE_STATS);
    setMode("new");
    setStatus("DRAFT");
  };

  const handleEdit = () => {
    setMode("edit");
    setStatus("PENDING");
  };

 const handleSave = () => {
    if (!form.productId) {
      notification.error({
        message: "Cannot save",
        description: "Select a product first.",
        placement: "topRight",
      });
      return;
    }

    if (!form.productionOrderId) {
      notification.error({
        message: "Cannot save",
        description: "Select a running production order first.",
        placement: "topRight",
      });
      return;
    }

    setMode("view");
    setStatus("SAVED/ACCEPTED");
  };

  const handleCancel = () => {
    setMode("view");
    setForm(EMPTY_FORM);
    setSelected(null);
  };

  return {
    form,
    setForm,
    mode,
    status,
    selected,
    isEditable,
    stageStats,
    setStageStats,
    updateField,
    handleErpSelect,
    handleOrderSelect,
    handleNew,
    handleEdit,
    handleSave,
    handleCancel,
  };
}

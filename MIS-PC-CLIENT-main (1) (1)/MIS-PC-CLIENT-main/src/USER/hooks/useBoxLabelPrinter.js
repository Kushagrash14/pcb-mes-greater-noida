import { notification } from "antd";
import api from "../../services/API/api.js";
import { printRawZpl } from "../../utils/qzTray";

export default function useBoxLabelPrinter() {
 const printBoxLabel = async (packaging, printerName, { isReprint = false } = {}) => {
  if (!printerName) {
    notification.error({
      title: "Print skipped",
      description: "No printer connected on this PC.",
      placement: "topRight",
    });
    return false;
  }

  try {
    const { data: response } = await api.get(`/print/box-print-jobs/${packaging.print_job_id}/zpl`);
    const zpl = response?.data?.zpl;
    if (!zpl) throw new Error("Server did not return Master Label ZPL.");

    await printRawZpl(printerName, zpl);

    await api.patch(`/print/box-print-jobs/${packaging.print_job_id}`, {
      status: "PRINTED",
      reprint: isReprint,
    });

    notification.success({
      title: isReprint ? "Label reprinted" : "Box label printed",
      description: `Box ${packaging.box_code} — ${packaging.barcode_data}`,
      placement: "topRight",
    });
    return true;
  } catch (err) {
    console.error("❌ MASTER LABEL PRINT FAILED:", err);

    if (!isReprint) {
      try {
        await api.patch(`/print/box-print-jobs/${packaging.print_job_id}`, {
          status: "FAILED",
          error_message: err?.message || "Print failed",
        });
      } catch (statusErr) {
        console.error("❌ Failed to update print job status:", statusErr);
      }
    }

    notification.error({
      title: "Print failed",
      description: err?.message || "Could not send label to printer.",
      placement: "topRight",
    });
    return false;
  }
};



  return { printBoxLabel };
}
// Every scan-rejection errorType the backend can return, mapped to how the
// glass popup + left-rail highlight should present it.
//
// popupType: "DUPLICATE" (orange) | "ERROR" (red) | "MISSING" (red, left-rail blink)
//
// Add a new errorType here first — everything else (handleStageScanned,
// the popup) reads from this table instead of hardcoding switch cases.
export const ERROR_POPUP_CONFIG = {
  // ---- existing MES stage-scan errors ----
  DUPLICATE_STAGE: { popupType: "DUPLICATE", title: "Already Scanned" },
  ALREADY_COMPLETED: { popupType: "DUPLICATE", title: "Already Scanned" },
  BACKWARD_SCAN: { popupType: "ERROR", title: "Scan Rejected" },
  MISSING_STAGES: { popupType: "MISSING", title: "Missing Stage(s)" },
  EXTERNAL_DEPENDENCY_FAILED: { popupType: "ERROR", title: "External Machine Validation Failed" },

  // ---- CUSTOMER_BINDING (two-scan: PCB QR then Customer QR) ----
  PCB_QR_REQUIRED: { popupType: "ERROR", title: "PCB QR Required" },
  CUSTOMER_QR_REQUIRED: { popupType: "ERROR", title: "Customer QR Required" },
  INVALID_CUSTOMER_QR: { popupType: "ERROR", title: "Invalid Customer QR" },
  PCB_NOT_FOUND: { popupType: "ERROR", title: "PCB Not Found" },
  PCB_PRODUCT_MISMATCH: { popupType: "ERROR", title: "Product Mismatch" },
  PCB_NOT_ACTIVE: { popupType: "ERROR", title: "PCB Not Active" },
  CUSTOMER_QR_IS_PCB: { popupType: "ERROR", title: "Invalid Customer QR" },
  PCB_ALREADY_BOUND: { popupType: "DUPLICATE", title: "Already Bound" },

  // ---- fallback ----
  DEFAULT: { popupType: "ERROR", title: "Scan Failed" },
};

// errorTypes above whose root cause is the PCB (first) scan, not the
// customer (second) scan — CustomerBindingPanel uses this to decide
// whether a failed second scan should restart the whole 2-step flow
// or just ask the operator to rescan the customer QR.
export const CUSTOMER_BINDING_PCB_ERRORS = new Set([
  "PCB_QR_REQUIRED",
  "PCB_NOT_FOUND",
  "PCB_PRODUCT_MISMATCH",
  "PCB_NOT_ACTIVE",
  "PCB_ALREADY_BOUND",
]);

export function getErrorPopupConfig(errorType) {
  return ERROR_POPUP_CONFIG[errorType] || ERROR_POPUP_CONFIG.DEFAULT;
}

// Mirrors the `scan_mode` enum on `product_stage_flow`:
// enum('SINGLE','GROUP_CREATE','GROUP_SCAN','CUSTOMER_BINDING')
export const SCAN_MODES = {
  SINGLE: "SINGLE",
  GROUP_CREATE: "GROUP_CREATE",
  GROUP_SCAN: "GROUP_SCAN",
  CUSTOMER_BINDING: "CUSTOMER_BINDING",
};

export const STAGE_STATUS = {
  PENDING: "pending",
  DONE: "done",
  ERROR: "error",
};

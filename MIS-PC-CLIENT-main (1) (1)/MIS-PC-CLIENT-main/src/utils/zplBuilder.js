// src/utils/zplBuilder.js

// Maps your packaging_config.barcode_format values to the correct ZPL
// barcode command. Widths/heights are reasonable label defaults — adjust
// per your actual label stock size (this assumes a small box label,
// roughly 2"x1" at 203dpi).
const BARCODE_ZPL = {
  CODE128: (data) => `^BY2,3,60\n^FO50,120^BCN,60,Y,N,N\n^FD${data}^FS`,
  QR: (data) => `^FO50,110^BQN,2,6\n^FDQA,${data}^FS`,
  EAN13: (data) => `^BY2,3,60\n^FO50,120^BEN,60,Y,N\n^FD${data}^FS`,
  DATAMATRIX: (data) => `^FO50,110^BXN,6,200\n^FD${data}^FS`,
};

/**
 * Builds a ZPL label string for a packed box.
 * @param {{ barcodeData: string, barcodeFormat: string, productName?: string, boxSize?: number, date?: string }} opts
 */
/**
 * Builds a ZPL label string for a packed box optimized for 300 DPI printers.
 * @param {{ barcodeData: string }} opts
 */
// src/utils/zplBuilder.js

/**
 * Builds a ZPL label string for a packed box optimized for a Zebra 300 DPI printer.
 * @param {{ barcodeData: string }} opts
 */
// src/utils/zplBuilder.js

/**
 * Builds a clean, single-line ZPL label string optimized for 300 DPI Zebra hardware.
 * @param {{ barcodeData: string }} opts
 */
export function buildBoxLabelZpl({
  barcodeData,
  productName,
  partCode,
  sapCode,
  quantity,
  packedAt,
}) {
  const date = packedAt
    ? new Date(packedAt).toLocaleDateString("en-GB")
    : "";

  return (
    "^XA" +
    "^PW1200" +
    "^LL600" +
    "^CI28" +

    // ==================================================
    // OUTER BORDER
    // Margin: Left/Right 80 | Top/Bottom 60
    // ==================================================
    "^FO80,60^GB1040,480,3^FS" +

    // ==================================================
    // COMPANY NAME
    // ==================================================
    "^FO80,85" +
    "^A0N,42,42" +
    "^FB1040,1,0,C,0" +
    "^FDPG TECHNOPLAST PRIVATE LIMITED^FS" +

    // HEADER SEPARATOR
    "^FO80,135^GB1040,3,3^FS" +

    // ==================================================
    // DATE — TOP RIGHT
    // ==================================================
    "^FO890,155" +
    "^A0N,32,32" +
    `^FD${date}^FS` +

    // DATE / PRODUCT SEPARATOR
    "^FO80,205^GB1040,3,3^FS" +

    // ==================================================
    // PRODUCT
    // ==================================================
    "^FO130,225" +
    "^A0N,38,38" +
    "^FDProduct^FS" +

    "^FO340,220" +
    "^A0N,42,42" +
    `^FD${productName || ""}^FS` +

    // ==================================================
    // LEFT QR — SAP CODE
    // ==================================================
    "^FO120,340" +
    "^BQN,2,7" +
    `^FDQA,${sapCode || ""}^FS` +

    // ==================================================
    // PART CODE
    // ==================================================
    "^FO350,330" +
    "^A0N,34,34" +
    "^FDPart Code^FS" +

    "^FO560,320" +
    "^A0N,38,38" +
    `^FD${partCode || ""}^FS` +

    // ==================================================
    // SAP CODE
    // ==================================================
    "^FO350,395" +
    "^A0N,34,34" +
    "^FDSAP Code^FS" +

    "^FO560,395" +
    "^A0N,38,38" +
    `^FD${sapCode || ""}^FS` +

    // ==================================================
    // TOTAL QTY
    // ==================================================
    "^FO350,455" +
    "^A0N,34,34" +
    "^FDTotal Qty^FS" +

    "^FO560,450" +
    "^A0N,50,50" +
    `^FD${quantity ?? ""}^FS` +

    // ==================================================
    // RIGHT QR — BOX CODE
    // ==================================================
    "^FO860,280" +
    "^BQN,2,11" +
    `^FDQA,${barcodeData || ""}^FS` +

    "^XZ"
  );
}
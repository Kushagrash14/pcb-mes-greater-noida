// src/utils/qzTray.js
import qz from "qz-tray";
import api from "../services/API/api";

let connected = false;
let configuredOnce = false;

function configureSecurity() {
  if (configuredOnce) return;
  configuredOnce = true;

  qz.security.setCertificatePromise((resolve, reject) => {
    api
      .get("/print/cert", { responseType: "text" })
      .then((res) => resolve(res.data))
      .catch(reject);
  });

  qz.security.setSignatureAlgorithm("SHA512");

  qz.security.setSignaturePromise((toSign) => (resolve, reject) => {
    api
      .post(
        "/print/sign",
        { request: toSign },
        { responseType: "text" }
      )
      .then((res) => resolve(res.data))
      .catch(reject);
  });
}

let connectPromise = null;

export function ensureQzConnected() {
  configureSecurity();

  // someone is already connecting: wait for that same attempt
  if (connectPromise) return connectPromise;

  // already fully connected
  if (qz.websocket.isActive()) return Promise.resolve();

  connectPromise = qz.websocket
    .connect()
    .then(() => {
      connected = true;
    })
    .finally(() => {
      connectPromise = null;
    });

  return connectPromise;
}

export async function printRawZpl(printerName, zpl) {
  await ensureQzConnected();

  let finalPrinterName = printerName;

  try {
    // 1. Ask QZ Tray to find the system's exact matching printer name
    // This removes character mismatches like hyphens, spaces, or casing
    finalPrinterName = await qz.printers.find(printerName);
    console.log("🎯 Exact printer matched by system:", finalPrinterName);
  } catch (findError) {
    console.warn(`Could not find exact match for '${printerName}', falling back to default string.`);
  }

  // 2. Initialize the configuration with the verified name mapping
  const config = qz.configs.create(finalPrinterName, {
    forceRaw: true
  });

  const data = [
    {
      type: "raw",
      format: "command", 
      data: zpl,
    },
  ];

  // 3. Dispatch payload to the device queue
  await qz.print(config, data);
  console.log("🚀 Payload cleanly deposited into hardware print queue.");
}

export async function getPrinterStatus(printerName) {
  await ensureQzConnected();

  return new Promise((resolve) => {
    let done = false;
    const finish = (result) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      qz.printers.stopListening().catch(() => {});
      resolve(result);
    };
    const timer = setTimeout(
      () => finish({ ok: false, known: false, text: "No status reported by driver" }),
      3000
    );

    qz.printers.setPrinterCallbacks((evt) => {
      console.log("QZ printer event:", evt);               // keep while testing
      if (evt.eventType && evt.eventType !== "PRINTER") return;
      if (evt.printerName !== printerName) return;
      const text = String(evt.statusText || "").toUpperCase();
      finish({ ok: text === "OK" || text === "READY", known: true, text: evt.statusText });
    });

    qz.printers
      .startListening(printerName)
      .then(() => qz.printers.getStatus())
      .catch((err) => {
        console.warn("Printer status check failed:", err);
        finish({ ok: false, known: false, text: "Status check failed" });
      });
  });
}

export async function printTestLabel(printerName) {
  const zpl = `^XA^PW600^LL300^FO40,40^A0N,40,40^FDPRINTER TEST^FS^FO40,100^A0N,28,28^FD${new Date().toLocaleString()}^FS^XZ`;
  await printRawZpl(printerName, zpl);
}


export async function listQzPrinters() {
  await ensureQzConnected();
  return qz.printers.find();
}
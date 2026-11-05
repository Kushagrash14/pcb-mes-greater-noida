import { useCallback, useEffect, useState, useRef } from "react";
import api from "../../services/API/api";
import { listQzPrinters, getPrinterStatus, printTestLabel  } from "../../utils/qzTray";

const STORAGE_KEY = "qz_selected_printer";
const VIRTUAL = /pdf|xps|onenote|fax|virtual|document writer/i;


export default function usePrinterSelection({ productId, stageId }) {
  const [supportsPrint, setSupportsPrint] = useState(false);
  const [configLoading, setConfigLoading] = useState(false);
  const [printerName, setPrinterName] = useState(() => localStorage.getItem(STORAGE_KEY));
  const [printers, setPrinters] = useState([]);
  const [qzState, setQzState] = useState("idle"); // idle | checking | ready | down

  const [verified, setVerified] = useState(false);
    useEffect(() => setVerified(false), [printerName]); 
    const testPrint = useCallback(() => printTestLabel(printerName), [printerName]);



  const [printerStatus, setPrinterStatus] = useState("unknown"); // unknown | checking | ready | not_ready
    const [statusText, setStatusText] = useState("");
    const lastCheckRef = useRef({ name: null, at: 0, ready: false });

    const checkStatus = useCallback(
    async (force = false) => {
        if (!printerName) return false;

        // reuse a result from the last 10s so scanning doesn't wait 3s every time
        const last = lastCheckRef.current;
        if (!force && last.name === printerName && Date.now() - last.at < 10000) {
        return last.ready;
        }

        setPrinterStatus("checking");
        try {
        const s = await getPrinterStatus(printerName);
        setStatusText(s.text || "");

        if (s.known && s.ok) setPrinterStatus("ready");
        else if (s.known) setPrinterStatus("not_ready");   // offline, paper out, etc.
        else setPrinterStatus("unknown");                  // driver gave no status

        // block only when the printer reported a real problem
        const ready = !s.known || s.ok;
        lastCheckRef.current = { name: printerName, at: Date.now(), ready };
        return ready;
        } catch {
        setPrinterStatus("unknown");
        return true; // QZ itself is handled by qzState
        }
    },
    [printerName]
    );

    // check right after a printer is chosen (or restored from localStorage)
    useEffect(() => {
    if (supportsPrint && printerName) checkStatus(true);
    else setPrinterStatus("unknown");
    }, [supportsPrint, printerName, checkStatus]);

  // Does this stage print for this product?
  useEffect(() => {
    if (!productId || !stageId) {
      setSupportsPrint(false);
      return;
    }
    let cancelled = false;
    setConfigLoading(true);
    api
      .get("/print/stage-print-config", { params: { product_id: productId, stage_id: stageId } })
      .then((res) => !cancelled && setSupportsPrint(!!res?.data?.data?.supports_print))
      .catch(() => !cancelled && setSupportsPrint(false))
      .finally(() => !cancelled && setConfigLoading(false));
    return () => {
      cancelled = true;
    };
  }, [productId, stageId]);

 

  // Ask QZ Tray which printers THIS PC has
  const refreshPrinters = useCallback(async () => {
    setQzState("checking");
    try {
      const result = await listQzPrinters();
       const list = (Array.isArray(result) ? result : result ? [result] : []).filter((name) => !VIRTUAL.test(name));
      setPrinters(list);
      setPrinterName((current) => {
        if (current && !list.includes(current)) {
          localStorage.removeItem(STORAGE_KEY); // saved printer no longer exists on this PC
          return null;
        }
        return current;
      });
      setQzState("ready");
    } catch (err) {
      console.error("QZ Tray not reachable:", err);
      setQzState("down");
    }
  }, []);

  useEffect(() => {
    if (supportsPrint) refreshPrinters();
  }, [supportsPrint, refreshPrinters]);

  const selectPrinter = (name) => {
    localStorage.setItem(STORAGE_KEY, name);
    setPrinterName(name);
  };

    return {
        supportsPrint,
        configLoading,
        printerName,
        printers,
        qzState,
        refreshPrinters,
        selectPrinter,
        printerStatus,
        statusText,
        checkStatus,
        verified,
        setVerified,
        testPrint,
    };
}
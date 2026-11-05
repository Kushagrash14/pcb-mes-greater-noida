import { useEffect, useRef, useState } from "react";
import { notification } from "antd";
import api from "../../services/API/api"; // adjust path if your folder depth differs
import { SCAN_MODES } from "../constants/scanModes";
import { CUSTOMER_BINDING_PCB_ERRORS, ERROR_POPUP_CONFIG, getErrorPopupConfig } from "../constants/errorPopupConfig";
import useBoxLabelPrinter from "./useBoxLabelPrinter";
import { playAlarm, unlockAudio } from "../../utils/alertSound";


// Everything to do with actually recording a scan: the left-rail
// stage-status array, the flash/confirm animation, the non-blocking error
// popup, the "missing stage(s)" banner, GROUP_CREATE staging, and the new
// two-step CUSTOMER_BINDING flow. Takes the product/form state (owned by
// useProductionForm) and the stage-flow data (owned by useStageFlow) as
// plain inputs — this hook only ever reads them, it never needs to reach
// back into those other hooks, so there's no circular wiring in MIInput.jsx.
export default function useScanSubmission({
  user,
  form,
  setForm,
  mode,
  stageFlow,
  stageFlowRows,
  assignedStageIndex,
  setStageStats,
  fetchLatestScans,
  printSupported,
  printerName,
  checkPrinterReady,
}) {
  const { printBoxLabel } = useBoxLabelPrinter();

  const [stageStatus, setStageStatus] = useState([]);
  const [flashIndices, setFlashIndices] = useState(new Set());
  const [lastConfirmed, setLastConfirmed] = useState(-1);

  const [groupId, setGroupId] = useState(null);
  const [serialNo, setSerialNo] = useState(null);

  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [missingStages, setMissingStages] = useState([]); // [{ index, label }]
  const [errorPopup, setErrorPopup] = useState(null);

  const [pendingGroupScans, setPendingGroupScans] = useState([]);
  const [savingGroup, setSavingGroup] = useState(false);

  // CUSTOMER_BINDING: first scan (PCB QR) is held here until the second
  // scan (Customer QR) arrives; then both are sent to the server together.
  const [pendingPcbQr, setPendingPcbQr] = useState(null);

  const wipCodeRef = useRef(null);
  const errorPopupTimeoutRef = useRef(null);
  const groupResetTimeoutRef = useRef(null);
  const missingResetTimeoutRef = useRef(null);

  const [groupSize, setGroupSize] = useState(null);
  const pendingRef = useRef([]);      // always-current copy, so fast scans never see stale state
  const savingRef = useRef(false);    // blocks scans while a group is being saved


  useEffect(() => {
    if (!errorPopup) return;
    playAlarm(
      errorPopup.type === "DUPLICATE"
        ? { beeps: 2, freq: 900 }
        : { beeps: 3, freq: 1000 }
    );
  }, [errorPopup]);

  useEffect(() => {
    pendingRef.current = pendingGroupScans;
  }, [pendingGroupScans]);

  useEffect(() => {
    wipCodeRef.current?.focus();
  }, []);

  useEffect(() => {
    return () => {
      if (errorPopupTimeoutRef.current) clearTimeout(errorPopupTimeoutRef.current);
      if (groupResetTimeoutRef.current) clearTimeout(groupResetTimeoutRef.current);
      if (missingResetTimeoutRef.current) clearTimeout(missingResetTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => {
        setErrorMessage(null);
        setSuccessMessage(null);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage, successMessage]);

  useEffect(() => {
    const unlock = () => unlockAudio();
    window.addEventListener("keydown", unlock, { once: true });
    window.addEventListener("click", unlock, { once: true });
    return () => {
      window.removeEventListener("keydown", unlock);
      window.removeEventListener("click", unlock);
    };
  }, []);

  // Reset all in-progress scan state whenever the product changes (either
  // cleared, or a new stage flow finished loading for it) — mirrors the
  // original single combined effect, split so this hook doesn't need to
  // depend on useStageFlow's internals beyond its plain output values.
  const productId = form.productId;
  useEffect(() => {
    if (!productId) {
      setPendingGroupScans([]);
      setPendingPcbQr(null);
      setStageStatus([]);
      setLastConfirmed(-1);
      setGroupId(null);
      setSerialNo(null);
      return;
    }
    setStageStatus(Array(stageFlowRows.length).fill("pending"));
    setPendingGroupScans([]);
    setPendingPcbQr(null);
    setLastConfirmed(-1);
    setGroupId(null);
    setSerialNo(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, stageFlowRows]);

const showErrorPopup = (popup) => {
  if (errorPopupTimeoutRef.current) clearTimeout(errorPopupTimeoutRef.current);
  setErrorPopup(popup);
  errorPopupTimeoutRef.current = setTimeout(() => {
    setErrorPopup(null);
    errorPopupTimeoutRef.current = null;
  }, 8000);
};

  const clearMissingHighlight = () => {
    if (missingResetTimeoutRef.current) {
      clearTimeout(missingResetTimeoutRef.current);
      missingResetTimeoutRef.current = null;
    }
    setMissingStages((prevMissing) => {
      if (prevMissing.length) {
        const indexesToReset = new Set(prevMissing.map((m) => m.index));
        setStageStatus((prevStatus) =>
          prevStatus.map((s, i) => (indexesToReset.has(i) && s === "error" ? "pending" : s))
        );
      }
      return [];
    });
  };

  // ------------------------------------------------------------------
  // Flash / confirm animation
  // ------------------------------------------------------------------
  const flashTile = (index, times) => {
    return new Promise((resolve) => {
      let toggles = 0;
      const totalToggles = times * 2;
      const timer = setInterval(() => {
        setFlashIndices((prev) => {
          const next = new Set(prev);
          if (next.has(index)) next.delete(index);
          else next.add(index);
          return next;
        });
        toggles += 1;
        if (toggles >= totalToggles) {
          clearInterval(timer);
          setFlashIndices((prev) => {
            const next = new Set(prev);
            next.delete(index);
            return next;
          });
          resolve();
        }
      }, 220);
    });
  };

  const playConfirmAnimation = async (newIndex) => {
    const priorRange = Array.from({ length: newIndex }, (_, k) => k);
    if (priorRange.length) {
      await Promise.all(priorRange.map((idx) => flashTile(idx, 1)));
    }
    await flashTile(newIndex, 2);
  };

  // ------------------------------------------------------------------
  // Stats
  // ------------------------------------------------------------------
  const applyStageStatsFromResponse = (responseData) => {
    if (!responseData) return;
    const targetQty = responseData.target_qty ?? responseData.stage_target_qty ?? null;
    const achievedQty = responseData.stage_achieved_qty ?? null;
    const remainingQty = responseData.stage_remaining_qty ?? null;
    const achievementPercent = responseData.stage_achievement_percent ?? null;

    setStageStats((s) => ({
      ...s,
      targetQty: targetQty ?? s.targetQty,
      achievedQty: achievedQty ?? s.achievedQty,
      remainingQty: remainingQty ?? s.remainingQty,
      remainsQty: remainingQty ?? s.remainsQty,
      achievementPercent: achievementPercent ?? s.achievementPercent,
    }));

    setForm((f) => ({
      ...f,
      planQty: targetQty ?? f.planQty,
      doneQty: achievedQty ?? f.doneQty,
    }));
  };

  // ------------------------------------------------------------------
  // Central success/failure handler shared by every scan mode (SINGLE,
  // GROUP_CREATE's "Save Group", GROUP_SCAN, and CUSTOMER_BINDING).
  // ------------------------------------------------------------------
  const handleStageScanned = (index, data) => {
    if (!data.success) {
      const { popupType, title } = getErrorPopupConfig(data.errorType);

      switch (data.errorType) {
        case "DUPLICATE_STAGE":
          setStageStatus((prev) => {
            const next = [...prev];
            if (index >= 0 && index < next.length) next[index] = "done";
            return next;
          });
          setErrorMessage(data.message);
          showErrorPopup({ type: popupType, title, message: data.message });
          break;

        case "ALREADY_COMPLETED":
          setErrorMessage(data.message);
          showErrorPopup({ type: popupType, title, message: data.message });
          break;

        case "BACKWARD_SCAN":
          setErrorMessage(data.message);
          showErrorPopup({ type: popupType, title, message: data.message });
          break;

        case "MISSING_STAGES": {
          const missingList = (data.missing || []).map((stage) => ({
            index: stage.sequence_no - 1,
            label: stage.stage_name,
          }));

          setStageStatus((prev) => {
            const next = [...prev];
            missingList.forEach((stage) => {
              if (stage.index >= 0 && stage.index < next.length) next[stage.index] = "error";
            });
            return next;
          });

          setMissingStages(missingList);
          setErrorMessage(data.message);
          showErrorPopup({ type: popupType, title, message: data.message });

          if (missingResetTimeoutRef.current) clearTimeout(missingResetTimeoutRef.current);
          missingResetTimeoutRef.current = setTimeout(clearMissingHighlight, 10000);
          break;
        }

        case "EXTERNAL_DEPENDENCY_FAILED": {
          playAlarm({ beeps: 4, freq: 1000 });
          const dependency = data.stage;
          if (dependency?.sequence_no != null) {
            const dependencyIndex = Number(dependency.sequence_no) - 1;
            setStageStatus((prev) => {
              const next = [...prev];
              if (dependencyIndex >= 0 && dependencyIndex < next.length) next[dependencyIndex] = "error";
              return next;
            });
            setMissingStages([{ index: dependencyIndex, label: dependency.stage_name }]);
          }

          setErrorMessage(data.message);
          showErrorPopup({
            type: popupType,
            title: `${dependency?.machine_type || "External Machine"} Validation Failed`,
            message: data.message,
          });

          if (missingResetTimeoutRef.current) clearTimeout(missingResetTimeoutRef.current);
          missingResetTimeoutRef.current = setTimeout(clearMissingHighlight, 10000);
          break;
        }

        // ---- CUSTOMER_BINDING validation errors ----
        // (PCB_QR_REQUIRED, CUSTOMER_QR_REQUIRED, INVALID_CUSTOMER_QR,
        //  PCB_NOT_FOUND, PCB_PRODUCT_MISMATCH, PCB_NOT_ACTIVE,
        //  CUSTOMER_QR_IS_PCB, PCB_ALREADY_BOUND) fall through here, along
        // with any genuinely unknown errorType. Whether a CUSTOMER_BINDING
        // failure restarts the 2-step flow or just asks for a rescan of the
        // customer QR is decided by the caller (handleWipCodeScanned),
        // since only it knows which scan (pcbQr vs customerQr) is being
        // retried — this handler only needs to surface the message/popup.
        default: {
          const isKnownErrorType = Object.prototype.hasOwnProperty.call(ERROR_POPUP_CONFIG, data.errorType);
          if (!isKnownErrorType) {
            console.warn("submitScan response missing or unknown errorType:", data);
          }
          setErrorMessage(data.message || "Scan failed.");
          showErrorPopup({ type: popupType, title, message: data.message || "Scan failed. Please try again." });
        }
      }

      return;
    }

    // ==========================================================r

    // SCAN SUCCESS
    // ==========================================================
    applyStageStatsFromResponse(data.data);

    // 2. in handleStageScanned success branch (replace the console.log + print call)
    const packaging = data.data?.packaging;
    if (packaging?.print_job_created) {
      printBoxLabel(packaging, printerName);
    }


    setStageStatus((prev) => {
      const next = [...prev];
      if (index >= 0 && index < next.length) next[index] = "done";
      return next;
    });

    setLastConfirmed(index);

    if (!groupId) {
      setGroupId(data.group_id ?? data?.data?.group_id ?? `GRP-${Date.now().toString().slice(-6)}`);
      setSerialNo(form.wipBarCode || "—");
    }

    playConfirmAnimation(index);
  };

  // ------------------------------------------------------------------
  // Server calls
  // ------------------------------------------------------------------
  const submitScanToServer = async (code) => {
    try {
      const res = await api.post("/scan-history/create", {
        scanned_value: code,
        product_id: form.productId,
        production_order_id: form.productionOrderId,
      });

      const response = res?.data;
      const scanData = response?.data;

      setErrorMessage(null);
      setSuccessMessage(`${code} has been successfully recorded.`);
      setTimeout(() => setSuccessMessage(null), 10000);

      setStageStats((prev) => ({
        ...prev,
        targetQty: scanData?.stage_target_qty ?? prev.targetQty,
        achievedQty: scanData?.stage_achieved_qty ?? prev.achievedQty,
        remainingQty: scanData?.stage_remaining_qty ?? prev.remainingQty,
        remainsQty: scanData?.stage_remaining_qty ?? prev.remainsQty,
        achievementPercent: scanData?.stage_achievement_percent ?? prev.achievementPercent,
      }));

      fetchLatestScans();
      return response;
    } catch (err) {
      return (
        err?.response?.data || {
          success: false,
          errorType: "NETWORK_ERROR",
          message: "Scan submission failed",
        }
      );
    }
  };

  // Sends the PCB QR + Customer QR pair to the server together, once both
  // scans have been captured. Backend validates via validateCustomerBinding
  // and is expected to return the standard { success, errorType, message,
  // data } shape used everywhere else — `success` is read defensively as
  // `data.success ?? data.ok` in case the controller passes the validator's
  // raw `ok` field straight through.
  const submitCustomerBindingToServer = async (pcbQr, customerQr) => {
    try {
      const res = await api.post("/scan-history/create", {
        scanned_value: pcbQr,
        customer_qr: customerQr,
        product_id: form.productId,
        production_order_id: form.productionOrderId,
      });

      const response = res?.data || {};
      const normalized = { ...response, success: response.success ?? response.ok };

      if (normalized.success) {
        setErrorMessage(null);
        setSuccessMessage(`${pcbQr} bound to customer QR ${customerQr}.`);
        setTimeout(() => setSuccessMessage(null), 10000);
        fetchLatestScans();
      }

      return normalized;
    } catch (err) {
      console.error("Error submitting customer binding:", err);
      const errData = err?.response?.data || {};
      return {
        ...errData,
        success: errData.success ?? errData.ok ?? false,
        errorType: errData.errorType || "NETWORK_ERROR",
        message: errData.message || "Customer binding submission failed",
      };
    }
  };

  // ------------------------------------------------------------------
  // WIP Bar Code field — dispatches by scan_mode
  // ------------------------------------------------------------------
  const handleWipCodeScanned = async () => {
    const code = form.wipBarCode.trim()?.toUpperCase();

    if (!code) return;

    clearMissingHighlight();

    if (mode !== "view") {
      const msg = "Cannot scan while in New/Edit mode. Save your changes first.";
      setErrorMessage(msg);
      setForm((f) => ({ ...f, wipBarCode: "" }));   // ← add this
      showErrorPopup({ type: "ERROR", title: "Save the Layout first.", message: msg });
      setTimeout(() => wipCodeRef.current?.focus(), 0);
      return;
    }

    if (!form.productId) {
      const msg = "Select an ERP number before scanning.";
      setErrorMessage(msg);
      setForm((f) => ({ ...f, wipBarCode: "" }));   // ← add this
      showErrorPopup({ type: "ERROR", title: "Select ERP/SAP No First", message: msg });
      setTimeout(() => wipCodeRef.current?.focus(), 0);
      return;
    }

    if (!form.productionOrderId) {
      const msg = "Select a running production order for your line before scanning.";

      setErrorMessage(msg);
      setForm((f) => ({ ...f, wipBarCode: "" }));

      showErrorPopup({
        type: "ERROR",
        title: "Select Production Order",
        message: msg,
      });

      setTimeout(() => wipCodeRef.current?.focus(), 50);
      return;
    }

    if (!stageFlow) {
      const msg = "Wrong Station or Maybe Stations Are Not Configured for this Product";
      setErrorMessage(msg);
      setForm((f) => ({ ...f, wipBarCode: "" }));   // ← add this
      showErrorPopup({ type: "ERROR", title: "Wrong Serial Scanned", message: msg });
      setTimeout(() => wipCodeRef.current?.focus(), 0);
      return;
    }

    // 3. in handleWipCodeScanned, right after the `!stageFlow` check
    if (printSupported && !printerName) {
      const msg = "Connect the printer before scanning. This product prints a label at this station.";
      setErrorMessage(msg);
      setForm((f) => ({ ...f, wipBarCode: "" }));
      showErrorPopup({ type: "ERROR", title: "Printer not connected", message: msg });
      setTimeout(() => wipCodeRef.current?.focus(), 0);
      return;
    }

    if (printSupported) {
      let ready = true;
      try {
        ready = checkPrinterReady ? await checkPrinterReady() : true;
      } catch (e) {
        console.warn("Printer status check failed:", e);
      }
      if (!ready) {
        const msg = "Printer is not ready (offline or paper out). Fix the printer before scanning.";
        setErrorMessage(msg);
        setForm((f) => ({ ...f, wipBarCode: "" }));
        showErrorPopup({ type: "ERROR", title: "Printer not ready", message: msg });
        setTimeout(() => wipCodeRef.current?.focus(), 0);
        return;
      }
    }

    // ---- GROUP_CREATE: stage scans locally, no server call yet ----
   if (stageFlow.scan_mode === SCAN_MODES.GROUP_CREATE) {
      setForm((f) => ({ ...f, wipBarCode: "" }));
      setTimeout(() => wipCodeRef.current?.focus(), 50);

      if (savingRef.current) return; // group is being saved, ignore stray scans

      if (!groupSize) {
        const msg = "Enter the group quantity before scanning.";
        setErrorMessage(msg);
        showErrorPopup({ type: "ERROR", title: "Group quantity missing", message: msg });
        return;
      }

      const current = pendingRef.current;

      if (current.some((s) => s.code === code)) {
        const dupeMsg = `"${code}" is already in the pending list.`;
        setErrorMessage(dupeMsg);
        showErrorPopup({ type: "DUPLICATE", title: "Already Scanned", message: dupeMsg });
        return;
      }

      const next = [...current, { code, tempId: `${code}-${Date.now()}` }];
      pendingRef.current = next;
      setPendingGroupScans(next);

      if (next.length >= groupSize) {
        setErrorMessage(null);
        await saveGroupWith(next); // auto-save when the group is full
      } else {
        setErrorMessage(`Scan added (${next.length}/${groupSize}).`);
      }
      return;
    }

    // ---- CUSTOMER_BINDING: two scans, then one combined server call ----
    if (stageFlow.scan_mode === SCAN_MODES.CUSTOMER_BINDING) {
      // Step 1: capture the PCB QR, wait for the customer QR next.
      if (!pendingPcbQr) {
        setPendingPcbQr(code);
        setForm((f) => ({ ...f, wipBarCode: "" }));
        setErrorMessage("PCB QR captured. Now scan the Customer QR.");
        setTimeout(() => wipCodeRef.current?.focus(), 50);
        return;
      }

      // Step 2: customer QR captured — send both to the server together.
      const pcbQr = pendingPcbQr;
      const customerQr = code;
      const result = await submitCustomerBindingToServer(pcbQr, customerQr);

      setForm((f) => ({ ...f, wipBarCode: "" }));

      if (result.success) {
        setPendingPcbQr(null);
      } else if (CUSTOMER_BINDING_PCB_ERRORS.has(result.errorType)) {
        // The problem was with the PCB scan (not found / already bound /
        // wrong product / inactive) — restart the 2-step flow.
        setPendingPcbQr(null);
      }
      // else: problem was with the customer QR only (INVALID_CUSTOMER_QR,
      // CUSTOMER_QR_IS_PCB) — keep pendingPcbQr so the operator can just
      // rescan the customer QR without redoing the PCB scan.

      setTimeout(() => wipCodeRef.current?.focus(), 50);
      handleStageScanned(assignedStageIndex, result);
      return;
    }

    // ---- SINGLE / GROUP_SCAN: save directly ----
    const result = await submitScanToServer(code);
    const resultIndex = result?.data?.sequence_no ? result.data.sequence_no - 1 : assignedStageIndex;
    setForm((f) => ({ ...f, wipBarCode: "" }));   // ← add this

    if (result.success) {
      setForm((f) => ({ ...f, wipBarCode: "" }));
    }
    setTimeout(() => wipCodeRef.current?.focus(), 50);

    handleStageScanned(resultIndex, result);
  };


  const handleCancelCustomerBinding = () => {
    setPendingPcbQr(null);
    setForm((f) => ({ ...f, wipBarCode: "" }));
    setTimeout(() => wipCodeRef.current?.focus(), 0);
  };

  const handleRemovePendingScan = (tempId) => {
    setPendingGroupScans((prev) => prev.filter((s) => s.tempId !== tempId));
  };

 const saveGroupWith = async (scans) => {
  if (!scans.length || savingRef.current) return;
  savingRef.current = true;
  setSavingGroup(true);
  try {
    const res = await api.post("/scan-history/create-group", {
      scanned_values: scans.map((s) => s.code),
      product_id: form.productId,
    });

    if (!res?.data?.success) {
      // goes through popup + alarm; scans stay pending so the operator can retry
      handleStageScanned(assignedStageIndex, {
        ...res?.data,
        success: false,
        message: res?.data?.message || "Failed to save group",
      });
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(`Group of ${scans.length} saved successfully.`);
    pendingRef.current = [];          // clear immediately, don't wait for the effect
    setPendingGroupScans([]);
    notification.success({
      title: "Group saved",
      description: res?.data?.message || "Group saved successfully.",
      placement: "topRight",
    });

    handleStageScanned(assignedStageIndex, res.data);
    fetchLatestScans();

    if (groupResetTimeoutRef.current) clearTimeout(groupResetTimeoutRef.current);
    groupResetTimeoutRef.current = setTimeout(() => {
      setStageStatus((prev) => {
        const next = [...prev];
        next[assignedStageIndex] = "pending";
        return next;
      });
      setLastConfirmed(-1);
      setGroupId(null);
      setSerialNo(null);
      groupResetTimeoutRef.current = null;
    }, 3000);
  } catch (err) {
    const data = err?.response?.data;
    handleStageScanned(assignedStageIndex, {
      ...data,
      success: false,
      errorType: data?.errorType || "NETWORK_ERROR",
      message: data?.message || "Failed to save group",
    });
  } finally {
    savingRef.current = false;
    setSavingGroup(false);
    setTimeout(() => wipCodeRef.current?.focus(), 50);
  }
};

const handleSaveGroup = () => {
  if (!pendingRef.current.length) {
    notification.warning({ title: "Nothing to save", description: "There are no pending scans to group.", placement: "topRight" });
    return;
  }
  return saveGroupWith(pendingRef.current);
};

  return {
    // stage rail
    stageStatus,
    flashIndices,
    lastConfirmed,

    // messages / popups
    errorMessage,
    successMessage,
    missingStages,
    setMissingStages,
    errorPopup,

    // group create
    pendingGroupScans,
    savingGroup,
    handleSaveGroup,
    handleRemovePendingScan,
    groupSize,
    setGroupSize,

    // customer binding
    pendingPcbQr,
    handleCancelCustomerBinding,

    // scan entry point
    wipCodeRef,
    handleWipCodeScanned,
  };
}

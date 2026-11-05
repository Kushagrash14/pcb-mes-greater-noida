import { useEffect } from "react";

const KEEP_FOCUS_SELECTORS =
  "input, textarea, .ant-select-selector, .ant-select-dropdown, .ant-select-item, .ant-picker, .ant-picker-dropdown";

// Keeps the scanner's cursor pinned to the WIP bar code field so a
// handheld/USB scanner always types into the right place, even after the
// operator clicks a button elsewhere on the page.
export default function useKeepWipFocus(wipCodeRef) {
  useEffect(() => {
    const handleDocumentClick = (e) => {
      const wipInputEl = wipCodeRef.current?.input;
      if (!wipInputEl) return;

      const target = e.target;
      if (wipInputEl.contains(target)) return; // already the field itself
      if (target.closest(KEEP_FOCUS_SELECTORS)) return; // let other real inputs keep focus

      // Buttons (New/Edit/Save Group/Alert close/Tag close, etc.) still fire
      // their own React onClick first — this native document listener runs
      // after it in the bubble phase — so we just reclaim focus afterward.
      window.setTimeout(() => wipInputEl.focus(), 0);
    };

    document.addEventListener("click", handleDocumentClick);
    return () => document.removeEventListener("click", handleDocumentClick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

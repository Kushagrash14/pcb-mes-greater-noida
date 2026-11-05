import React from "react";

// All keyframes/animations the old monolithic MIInput used, unchanged.
export default function GlobalStyles() {
  return (
    <style>{`
      @keyframes missingStagePulse {
        0%, 100% { background-color: #d1483c; border-color: #d1483c; }
        50% { background-color: #ff8a75; border-color: #ff8a75; }
      }
      .missing-stage-blink { animation: missingStagePulse 0.9s ease-in-out infinite; }

      @keyframes glassPopupIn {
        0% { opacity: 0; transform: translateY(-8px) scale(0.96); }
        100% { opacity: 1; transform: translateY(0) scale(1); }
      }
      @keyframes glassPopupOut {
        0% { opacity: 1; }
        100% { opacity: 0; }
      }

      @keyframes recentScanIn {
        0% { opacity: 0; transform: translateY(-4px); }
        100% { opacity: 1; transform: translateY(0); }
      }

      .pg-action-btn { transition: transform 0.12s ease, box-shadow 0.12s ease, filter 0.12s ease; }
      .pg-action-btn:not(:disabled):hover { transform: translateY(-1px); filter: brightness(1.03); }
      .pg-action-btn:not(:disabled):active { transform: translateY(0); }
    `}</style>
  );
}

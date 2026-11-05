import React from "react";
import { Typography } from "antd";
import { CloseCircleFilled } from "@ant-design/icons";

const { Text } = Typography;

// Non-blocking glass popup for scan-related errors (duplicate / missing
// stage / backward scan / customer-binding validation / any other scan
// rejection). Purely decorative — no focusable elements, pointer-events:
// none — so the WIP bar code field never loses focus while this is on
// screen.
export default function ErrorPopup({ popup }) {
  if (!popup) return null;

  const isDanger = popup.type === "MISSING" || popup.type === "ERROR";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2000,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: 90,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          minWidth: 340,
          maxWidth: 420,
          background: isDanger ? "#fdeceb" : "#fdf3e2",
          border: `1.5px solid ${isDanger ? "#f3b4ac" : "#f0cd8a"}`,
          borderRadius: 16,
          boxShadow: "0 12px 32px rgba(15,23,42,0.15)",
          padding: "16px 20px",
          animation: "glassPopupIn 0.25s ease-out",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <span
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: isDanger ? "#d1483c" : "#c9820a",
              color: "#fff",
            }}
          >
            <CloseCircleFilled style={{ fontSize: 15 }} />
          </span>
          <div>
            <Text
              strong
              style={{
                fontSize: 13.5,
                color: isDanger ? "#b8352a" : "#a8690a",
                display: "block",
                marginBottom: 2,
              }}
            >
              {popup.title}
            </Text>
            <Text style={{ fontSize: 12, color: "#475569", lineHeight: 1.5 }}>
              {popup.message}
            </Text>
          </div>
        </div>
      </div>
    </div>
  );
}

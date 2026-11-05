import React from "react";
import { Tag, Divider } from "antd";

// Mirrors the header line in the approved layout. Everything else that used
// to live in the field grid (Date, Plan No, Quality, Machine Name, Station,
// Plan/Done Qty) surfaces in the Navbar instead.
export default function HeaderSummaryBar({ stationName, selected }) {
  return (
    <div
      style={{
        flexShrink: 0,
        background: "#ffffff",
        borderBottom: "1px solid #e3e8ef",
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 20px",
      }}
    >
      <Tag style={{ borderRadius: 6, fontWeight: 600, padding: "2px 10px" }}>
        STATION : {stationName || "—"}
      </Tag>
      {selected && <Divider type="vertical" style={{ height: 20, borderColor: "#e3e8ef" }} />}
      {selected && (
        <Tag style={{ borderRadius: 6, fontWeight: 600, padding: "2px 10px" }}>
          PLANNED ITEM : {selected.erp_no || "—"}
        </Tag>
      )}
      {selected && <Divider type="vertical" style={{ height: 20, borderColor: "#e3e8ef" }} />}
      {selected && (
        <Tag style={{ borderRadius: 6, fontWeight: 600, padding: "2px 10px" }}>
          ITEM NAME : {selected.name || "—"}
        </Tag>
      )}
    </div>
  );
}

import React from "react";
import { Space, Typography } from "antd";
import { CheckCircleFilled, CloseCircleFilled } from "@ant-design/icons";

const { Text } = Typography;

function StageTile({ label, index, st, isFlashing, isMyStage, isMissingBlinking }) {
  let bg = "#ffffff";
  let border = "#e3e8ef";
  let color = "#1b2430";
  let iconColor = "#3a6d95";

  // Persistent "this is your stage" marker — applies whenever the tile
  // isn't already done/error, so the operator can always find their
  // station regardless of scan progress.
  if (isMyStage && st !== "done" && st !== "error") {
    bg = "#eaf2f8";
    border = "#3a6d95";
  }

  if (st === "error") {
    bg = "#d1483c";
    border = "#d1483c";
    color = "#ffffff";
  } else if (st === "done") {
    border = "#3a6d95";
  }

  if (isFlashing) {
    bg = "#3a6d95";
    border = "#3a6d95";
    color = "#ffffff";
    iconColor = "#ffffff";
  }

  return (
    <div
      className={isMissingBlinking ? "missing-stage-blink" : undefined}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 8px",
        borderRadius: 6,
        border: `1px solid ${border}`,
        background: bg,
        color,
        fontSize: 10.5,
        fontWeight: 600,
        lineHeight: 1.2,
        userSelect: "none",
      }}
    >
      <span
        style={{
          flexShrink: 0,
          width: 16,
          height: 16,
          borderRadius: "50%",
          background: isFlashing ? "rgba(255,255,255,0.25)" : "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 9,
        }}
      >
        {st === "done" ? (
          <CheckCircleFilled style={{ fontSize: 12, color: isFlashing ? "#ffffff" : iconColor }} />
        ) : st === "error" ? (
          <CloseCircleFilled style={{ fontSize: 12 }} />
        ) : (
          index + 1
        )}
      </span>
      <span style={{ flex: 1 }}>{label}</span>
      {isMyStage && st !== "done" && st !== "error" && (
        <span style={{ fontSize: 8, fontWeight: 700, color: "#3a6d95", letterSpacing: 0.3 }}>YOU</span>
      )}
    </div>
  );
}

export default function StageRail({ stages, stageStatus, flashIndices, assignedStageIndex, missingStages }) {
  return (
    <div
      style={{
        width: 150,
        flexShrink: 0,
        background: "#ffffff",
        border: "1px solid #e3e8ef",
        borderRadius: 10,
        padding: 8,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Text
        strong
        style={{
          display: "block",
          fontSize: 10.5,
          color: "#3a6d95",
          letterSpacing: 0.4,
          textTransform: "uppercase",
          marginBottom: 6,
          padding: "0 2px",
        }}
      >
        All Stations
      </Text>
      <Space direction="vertical" size={6} style={{ width: "100%", flex: 1 }}>
        {stages.length === 0 && (
          <Text type="secondary" style={{ fontSize: 11, padding: "6px 4px" }}>
            Select an ERP number to load stages.
          </Text>
        )}

        {stages.map((label, index) => (
          <StageTile
            key={label}
            label={label}
            index={index}
            st={stageStatus[index]}
            isFlashing={flashIndices.has(index)}
            isMyStage={index === assignedStageIndex}
            isMissingBlinking={missingStages.some((m) => m.index === index)}
          />
        ))}
      </Space>
    </div>
  );
}

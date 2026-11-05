import React from "react";
import { Button, InputNumber, Space, Tag, Typography } from "antd";

const { Text } = Typography;

export default function GroupCreatePanel({
  pendingGroupScans,
  savingGroup,
  onSaveGroup,
  onRemovePendingScan,
  groupSize,
  onGroupSizeChange,
}) {
  const count = pendingGroupScans.length;
  const locked = count > 0 || savingGroup; // don't change the size mid-group

  return (
    <div style={{ padding: 12, border: "1px solid #e3e8ef", borderRadius: 8, background: "#fafbfc" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <Text style={{ fontSize: 12, color: "#64748b" }}>Group quantity</Text>
        <InputNumber
          size="small"
          min={1}
          max={1000}
          precision={0}
          value={groupSize}
          disabled={locked}
          placeholder="e.g. 10"
          onChange={(v) => onGroupSizeChange(v || null)}
          style={{ width: 90 }}
        />
        {!groupSize && <Text type="danger" style={{ fontSize: 12 }}>Required before scanning</Text>}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: count ? 10 : 0 }}>
        <Tag color={groupSize && count === groupSize ? "green" : "orange"}>
          {count}{groupSize ? ` / ${groupSize}` : ""} scanned
          {groupSize ? ", saves automatically when full" : ""}
        </Tag>
        <Button type="primary" size="small" disabled={!count} loading={savingGroup} onClick={() => onSaveGroup()}>
          Save Group now
        </Button>
      </div>

      {count > 0 && (
        <Space size={[6, 6]} wrap>
          {pendingGroupScans.map((s) => (
            <Tag
              key={s.tempId}
              closable={!savingGroup}
              onClose={(e) => {
                e.preventDefault();
                onRemovePendingScan(s.tempId);
              }}
            >
              {s.code}
            </Tag>
          ))}
        </Space>
      )}
    </div>
  );
}
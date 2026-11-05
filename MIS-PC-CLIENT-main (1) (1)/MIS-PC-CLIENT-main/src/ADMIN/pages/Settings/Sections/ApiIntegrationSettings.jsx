import { useState, useEffect } from "react";
import { Tag, Modal, message } from "antd";
import { EyeOutlined } from "@ant-design/icons";

import MasterHeader from "../../Masters/components/MasterHeader"; 
import MasterToolbar from "../../Masters/components/MasterToolbar";
import MasterTable from "../../Masters/components/MasterTable";

import api from "../../../../services/API/api";

const RESULT_COLOR = {
  PASS: "green",
  OK: "green",
  FAIL: "red",
  NG: "red",
  ERROR: "red",
};

const formatDateTime = (dateInput) =>
  new Date(dateInput).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const parsePayload = (payload) => {
  if (payload === null || payload === undefined) return null;
  if (typeof payload === "object") return payload;
  try {
    return JSON.parse(payload);
  } catch {
    return payload;
  }
};

const normalizeResult = (item) => ({
  id: item.id,
  sourceId: item.source_id,
  sourceName: item.source_name || "-",
  code: item.code || "-",
  identifier: item.identifier,
  result: item.result,
  payload: parsePayload(item.payload),
  receivedAt: formatDateTime(item.received_at),
});

const ApiIntegrationSettings = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [payloadTarget, setPayloadTarget] = useState(null);

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    try {
      setLoading(true);
      const res = await api.get("/external-results/all");
      const list = res.data?.data || res.data || [];
      setResults(list.map(normalizeResult));
    } catch (err) {
      message.error(err?.response?.data?.message || "Failed to load external results");
    } finally {
      setLoading(false);
    }
  };

  const filteredData = results.filter((item) => {
    const query = search.toLowerCase();
    return (
      item.identifier.toLowerCase().includes(query) ||
      item.sourceName.toLowerCase().includes(query) ||
      item.code.toLowerCase().includes(query) ||
      (item.result || "").toLowerCase().includes(query)
    );
  });

  const columns = [
    { title: "Source", dataIndex: "sourceName", key: "sourceName" },
    { title: "Code", dataIndex: "code", key: "code" },
    { title: "Identifier", dataIndex: "identifier", key: "identifier" },
    {
      title: "Result",
      dataIndex: "result",
      key: "result",
      render: (v) => <Tag color={RESULT_COLOR[v?.toUpperCase()] || "default"}>{v}</Tag>,
    },
    {
      title: "Payload",
      dataIndex: "payload",
      key: "payload",
      render: (payload) =>
        payload ? (
          <EyeOutlined
            style={{ cursor: "pointer", color: "#2563EB", fontSize: 16 }}
            onClick={() => setPayloadTarget(payload)}
          />
        ) : (
          <span style={{ color: "#CBD5E1" }}>-</span>
        ),
    },
    { title: "Received At", dataIndex: "receivedAt", key: "receivedAt" },
  ];

  return (
    <div style={{ background: "#fff", border: "1px solid #F1F5F9", borderRadius: 16, overflow: "hidden" }}>
      <div style={{ padding: "20px 20px 0" }}>
        <MasterHeader
          title="External Results"
          description="Results received from external machines / sources"
          showButton={false}
        />
      </div>

      <MasterToolbar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by source, code, identifier or result..."
      />

      <MasterTable columns={columns} data={filteredData} loading={loading} showActions={false} />

      <Modal
        open={!!payloadTarget}
        title="Payload"
        onCancel={() => setPayloadTarget(null)}
        footer={null}
      >
        <pre
          style={{
            background: "#F8FAFC",
            border: "1px solid #F1F5F9",
            borderRadius: 8,
            padding: 12,
            fontSize: 12,
            maxHeight: 400,
            overflow: "auto",
          }}
        >
          {JSON.stringify(payloadTarget, null, 2)}
        </pre>
      </Modal>
    </div>
  );
};

export default ApiIntegrationSettings;
import { useState, useEffect, useMemo } from "react";
import { Form, Select, InputNumber, Switch, Input, Row, Col, Tag, Alert, message, Modal, Descriptions, Spin, Empty } from "antd";
import { Search, Package, ArrowLeft, ChevronRight, Plus, Pencil, Trash2, Layers } from "lucide-react";
import SortableFlowList from "../../../components/SortableDnd/SortableFlowList";
import MasterTable from "../Masters/components/MasterTable";
import DeleteModal from "../Masters/components/DeleteModal";
import MasterFormModal from "../Masters/components/MasterFormModal";

import api from "../../../services/API/api";

const { TextArea } = Input;

const SCAN_MODE_OPTIONS = [
  { value: "SINGLE", label: "Single" },
  { value: "GROUP_CREATE", label: "Group Create" },
  { value: "GROUP_SCAN", label: "Group Scan" },
  { value: "CUSTOMER_BINDING", label: "Customer Binding" },
];

const SCAN_MODE_COLOR = {
  SINGLE: "default",
  GROUP_CREATE: "purple",
  GROUP_SCAN: "geekblue",
  CUSTOMER_BINDING: "green",
};

const EXTERNAL_SOURCE_TYPE_OPTIONS = [
  { value: "LOCAL_FILE", label: "Local File System" },
  { value: "API", label: "External API (Coming Soon)" },
];

// Machine type is decided by the stage (set in Stage configuration) — this list
// is only used to render the read-only value. Keep in sync with ManageStages.
const EXTERNAL_MACHINE_TYPE_OPTIONS = [
  { value: "ICT", label: "ICT" },
  { value: "FCT", label: "FCT" },
  { value: "HIPT", label: "HIPT" },
  { value: "AOI", label: "AOI" },
];

const FILE_EXTENSION_OPTIONS = [
  { value: ".csv", label: ".csv" },
  { value: ".xlsx", label: ".xlsx" },
  { value: ".xls", label: ".xls" },
  { value: ".pdf", label: ".pdf" },
  { value: ".txt", label: ".txt" },
  { value: ".json", label: ".json" },
];

const SOURCE_TYPE_LABEL = {
  LOCAL_FILE: "Local File System",
  API: "External API",
};

const SCAN_MODE_FILTER_OPTIONS = [{ value: "All", label: "All Scan Modes" }, ...SCAN_MODE_OPTIONS];

const EXTERNAL_FILTER_OPTIONS = [
  { value: "All", label: "External: All" },
  { value: "YES", label: "External only" },
  { value: "NO", label: "Non-external only" },
];

const formatCreatedDate = (dateInput) =>
  new Date(dateInput || Date.now()).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

// external_api_config may already come back parsed as an object (mysql2
// parses JSON columns automatically) or, depending on driver config, as a
// raw string — handle both without throwing.
const parseApiConfig = (raw) => {
  if (!raw) return null;
  if (typeof raw === "object") return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

// Server sends/expects { product_id, stage_id, sequence_no, scan_mode,
// is_external_dependency, external_source, external_source_type,
// external_machine_type, external_folder_path,
// external_poll_interval_minutes, external_api_config }.
// machine_code belongs to the STAGE (created in Stage configuration) and is
// returned read-only on every flow row — the client never sends it.
// productOptions / stageOptions (fetched live) resolve id -> name for display.
const normalizeFlow = (item, productOptions = [], stageOptions = []) => {
  const apiConfig = parseApiConfig(item.external_api_config);
  return {
    id: item._id || item.id,
    productId: item.product_id,
    productName:
      item.productName || item.product_name || productOptions.find((p) => p.value === item.product_id)?.label || "-",
    stageId: item.stage_id,
    stageName: item.stageName || item.stage_name || stageOptions.find((s) => s.value === item.stage_id)?.label || "-",
    lineId: item.line_id ?? null,
    lineName: item.line_name || "-",
    sequenceNo: item.sequence_no,
    scanMode: item.scan_mode || "SINGLE",
    isExternalDependency: !!item.is_external_dependency,
    externalSource: item.external_source || "",
    externalSourceType: item.external_source_type || null,
    externalMachineType: item.external_machine_type || null,
    externalFolderPath: item.external_folder_path || "",
    externalPollIntervalMinutes: item.external_poll_interval_minutes ?? null,
    externalFileExtensions: item.external_file_extensions
      ? String(item.external_file_extensions).split(",").map((s) => s.trim()).filter(Boolean)
      : [],
    apiEndpoint: apiConfig?.endpoint || "",
    apiPayloadSample: apiConfig?.payloadSample || "",
    apiResultField: apiConfig?.resultField || "",
    machineCode: item.machine_code || item.machineCode || null,
    createdDate: formatCreatedDate(item.created_at || item.createdAt || item.createdDate),
  };
};

const PrimaryButton = ({ onClick, children }) => (
  <button
    onClick={onClick}
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      height: 36,
      padding: "0 14px",
      borderRadius: 9,
      border: "none",
      background: "#2563EB",
      color: "#fff",
      fontSize: 13,
      fontWeight: 600,
      cursor: "pointer",
    }}
  >
    <Plus size={15} />
    {children}
  </button>
);

const IconButton = ({ icon: Icon, tone, title, onClick }) => {
  const tones = {
    edit: { bg: "#EFF6FF", color: "#2563EB", border: "#DBEAFE" },
    delete: { bg: "#FEF2F2", color: "#DC2626", border: "#FEE2E2" },
  };
  const s = tones[tone];

  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        width: 28,
        height: 28,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 7,
        border: `1px solid ${s.border}`,
        background: s.bg,
        color: s.color,
        cursor: "pointer",
      }}
    >
      <Icon size={14} />
    </button>
  );
};

const ProductStage = () => {
  const [flows, setFlows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [lineOptions, setLineOptions] = useState([]);
  const [selectedLineId, setSelectedLineId] = useState(null);

  const [productOptions, setProductOptions] = useState([]);
  // { value, label, machineCode, machineType } — machineCode/Type come from the stage
  const [stageOptions, setStageOptions] = useState([]);
  const [optionsLoading, setOptionsLoading] = useState(true);

  // Step control: null => Step 1 (products), otherwise Step 2 (that product's flow)
  const [selectedProductId, setSelectedProductId] = useState(null);

  // Step 1 filter
  const [productSearch, setProductSearch] = useState("");

  // Step 2 filters
  const [search, setSearch] = useState("");
  const [lineFilter, setLineFilter] = useState("All");
  const [scanFilter, setScanFilter] = useState("All");
  const [externalFilter, setExternalFilter] = useState("All");

  const [formOpen, setFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const isExternalDependency = Form.useWatch("isExternalDependency", form);
  const externalSourceType = Form.useWatch("externalSourceType", form);
  const selectedStageId = Form.useWatch("stageId", form);

  const selectedStage = useMemo(
    () => stageOptions.find((s) => s.value === selectedStageId) || null,
    [stageOptions, selectedStageId]
  );

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Read-only "view details" popup, opened by clicking the External
  // Dependency cell in the table — separate from the edit form modal.
  const [machineDetailsTarget, setMachineDetailsTarget] = useState(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const filteredStageOptions = stageOptions.filter(
    (stage) => Number(stage.lineId) === Number(selectedLineId)
  );

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setOptionsLoading(true);

      const [productsRes, stagesRes, flowsRes, linesRes] = await Promise.all([
        api.get("/products/admin"),
        api.get("/stages/all"),
        api.get("/product-stage-flow/all"),
        api.get("/production-lines/all"),
      ]);

      const lineList = (linesRes.data?.data || linesRes.data || []).map((line) => ({
        value: line.id || line._id,
        label: line.name,
      }));

      setLineOptions(lineList);

      const productList = (productsRes.data?.data || productsRes.data || []).map((p) => ({
        value: p._id || p.id,
        label: p.name,
        erpNo: p.erp_no,
      }));

      const stageList = (stagesRes.data?.data || stagesRes.data || []).map((s) => ({
        value: s._id || s.id,
        label: s.name,
        lineId: s.line_id,
        lineName: s.line_name || "-",
        machineCode: s.machine_code || null,
        machineType: s.machine_type || null,
      }));

      setProductOptions(productList);
      setStageOptions(stageList);

      const flowList = flowsRes.data?.data || flowsRes.data || [];
      setFlows(flowList.map((item) => normalizeFlow(item, productList, stageList)));
    } catch (err) {
      message.error(err?.response?.data?.message || "Failed to load product stage flow");
    } finally {
      setLoading(false);
      setOptionsLoading(false);
    }
  };

  // ----------------------------------------------------------------
  // Step 1: product cards (every product, with its flow stats)
  // ----------------------------------------------------------------
  const productCards = useMemo(() => {
    const map = new Map();

    productOptions.forEach((p) => {
      map.set(String(p.value), {
        key: String(p.value),
        productId: p.value,
        name: p.label,
        erpNo: p.erpNo,
        flows: [],
      });
    });

    flows.forEach((f) => {
      const key = String(f.productId);

      if (!map.has(key)) {
        map.set(key, {
          key,
          productId: f.productId,
          name: f.productName,
          erpNo: null,
          flows: [],
        });
      }

      map.get(key).flows.push(f);
    });

    return Array.from(map.values()).map((c) => {
      const lines = Array.from(new Set(c.flows.map((f) => f.lineName).filter((n) => n && n !== "-")));

      return {
        ...c,
        lines,
        externalCount: c.flows.filter((f) => f.isExternalDependency).length,
      };
    });
  }, [productOptions, flows]);

  const visibleProductCards = useMemo(() => {
    const q = productSearch.trim().toLowerCase();

    return productCards
      .filter(
        (c) =>
          !q ||
          (c.name || "").toLowerCase().includes(q) ||
          String(c.erpNo || "").toLowerCase().includes(q) ||
          c.lines.some((l) => l.toLowerCase().includes(q))
      )
      .sort((a, b) => {
        if (a.flows.length !== b.flows.length) return b.flows.length - a.flows.length;
        return (a.name || "").localeCompare(b.name || "");
      });
  }, [productCards, productSearch]);

  const selectedProduct = useMemo(
    () => productCards.find((c) => c.key === selectedProductId) || null,
    [productCards, selectedProductId]
  );

  // ----------------------------------------------------------------
  // Step 2: this product's flow, split per production line
  // ----------------------------------------------------------------
  const productLineOptions = useMemo(() => {
    if (!selectedProduct) return [{ value: "All", label: "All Lines" }];

    const seen = new Map();
    selectedProduct.flows.forEach((f) => {
      if (f.lineId != null) seen.set(f.lineId, f.lineName);
    });

    return [
      { value: "All", label: "All Lines" },
      ...Array.from(seen.entries()).map(([value, label]) => ({ value, label })),
    ];
  }, [selectedProduct]);

  // stage-level filters (search / scan mode / external)
  const stageFiltersActive = !!search.trim() || scanFilter !== "All" || externalFilter !== "All";
  const filtersActive = stageFiltersActive || lineFilter !== "All";

  const lineGroups = useMemo(() => {
    if (!selectedProduct) return [];

    const q = search.trim().toLowerCase();
    const map = new Map();

    selectedProduct.flows.forEach((f) => {
      if (lineFilter !== "All" && Number(f.lineId) !== Number(lineFilter)) return;

      const key = String(f.lineId);

      if (!map.has(key)) {
        map.set(key, {
          id: `${f.productId}-${f.lineId}`,
          productId: f.productId,
          lineId: f.lineId,
          lineName: f.lineName,
          allStages: [], // full ordered list, used for drag & drop reorder
        });
      }

      map.get(key).allStages.push(f);
    });

    return Array.from(map.values())
      .map((g) => {
        const allStages = [...g.allStages].sort((a, b) => a.sequenceNo - b.sequenceNo);

        const matches = allStages.filter((f) => {
          if (scanFilter !== "All" && f.scanMode !== scanFilter) return false;
          if (externalFilter === "YES" && !f.isExternalDependency) return false;
          if (externalFilter === "NO" && f.isExternalDependency) return false;
          if (
            q &&
            !(
              f.stageName.toLowerCase().includes(q) ||
              String(f.sequenceNo).includes(q) ||
              (f.machineCode || "").toLowerCase().includes(q)
            )
          )
            return false;
          return true;
        });

        return { ...g, allStages, matches };
      })
      .filter((g) => !stageFiltersActive || g.matches.length > 0)
      .sort((a, b) => String(a.lineName).localeCompare(String(b.lineName)));
  }, [selectedProduct, lineFilter, search, scanFilter, externalFilter, stageFiltersActive]);

  const resetFilters = () => {
    setSearch("");
    setLineFilter("All");
    setScanFilter("All");
    setExternalFilter("All");
  };

  const openProduct = (card) => {
    resetFilters();
    setSelectedProductId(card.key);
  };

  const backToProducts = () => {
    resetFilters();
    setSelectedProductId(null);
  };

  // ----------------------------------------------------------------
  // Add / Edit
  // ----------------------------------------------------------------
  const openAddModal = (prefill = {}) => {
    setEditingRecord(null);
    form.resetFields();
    setSelectedLineId(prefill.lineId ?? null);
    form.setFieldsValue({
      productId: prefill.productId,
      lineId: prefill.lineId,
      scanMode: "SINGLE",
      isExternalDependency: false,
      externalSource: undefined,
      externalSourceType: undefined,
      externalMachineType: undefined,
      externalFolderPath: undefined,
      externalPollIntervalMinutes: undefined,
      externalFileExtensions: undefined,
      apiEndpoint: undefined,
      apiPayloadSample: undefined,
      apiResultField: undefined,
    });
    setFormOpen(true);
  };

  // From Step 2: pre-fill the product, and the line when it's unambiguous
  const openAddForProduct = (lineId) => {
    let line = lineId;

    if (line == null) {
      if (lineFilter !== "All") line = lineFilter;
      else if (productLineOptions.length === 2) line = productLineOptions[1].value;
    }

    openAddModal({ productId: selectedProduct?.productId, lineId: line });
  };

  const openEditModal = (record) => {
    setEditingRecord(record);
    setSelectedLineId(record.lineId);
    form.setFieldsValue({
      productId: record.productId,
      stageId: record.stageId,
      lineId: record.lineId,
      sequenceNo: record.sequenceNo,
      scanMode: record.scanMode,
      isExternalDependency: record.isExternalDependency,
      externalSource: record.externalSource,
      externalSourceType: record.externalSourceType,
      externalMachineType: record.externalMachineType,
      externalFolderPath: record.externalFolderPath,
      externalPollIntervalMinutes: record.externalPollIntervalMinutes,
      externalFileExtensions: record.externalFileExtensions,
      apiEndpoint: record.apiEndpoint,
      apiPayloadSample: record.apiPayloadSample,
      apiResultField: record.apiResultField,
    });
    setFormOpen(true);
  };

  // Picking a stage that has a machine code (set up in Stage configuration)
  // turns External Dependency on and takes the machine type from the stage.
  // A stage without a machine code can't be an external dependency.
  const handleStageChange = (stageId) => {
    const stage = stageOptions.find((s) => s.value === stageId);
    if (stage?.machineCode) {
      form.setFieldsValue({
        isExternalDependency: true,
        externalMachineType: stage.machineType || undefined,
      });
    } else {
      form.setFieldsValue({
        isExternalDependency: false,
        externalMachineType: undefined,
      });
    }
  };

  const handleSubmit = async () => {
    let values;
    try {
      values = await form.validateFields();
    } catch {
      return; // validation failed, stay in modal
    }

    const isExternal = !!values.isExternalDependency;
    const isLocalFile = isExternal && values.externalSourceType === "LOCAL_FILE";
    const isApi = isExternal && values.externalSourceType === "API";

    const payload = {
      product_id: values.productId,
      stage_id: values.stageId,
      line_id: stageOptions.find((stage) => Number(stage.value) === Number(values.stageId))?.lineId,
      scan_mode: values.scanMode,
      is_external_dependency: isExternal,
      external_source: isExternal ? values.externalSource : null,
      external_source_type: isExternal ? values.externalSourceType : null,
      external_machine_type: isExternal ? values.externalMachineType : null,
      external_folder_path: isLocalFile ? values.externalFolderPath : null,
      external_poll_interval_minutes: isLocalFile ? values.externalPollIntervalMinutes : null,
      external_file_extensions:
        isLocalFile && Array.isArray(values.externalFileExtensions) && values.externalFileExtensions.length
          ? values.externalFileExtensions.join(",")
          : null,
      external_api_config: isApi
        ? JSON.stringify({
            endpoint: values.apiEndpoint || null,
            payloadSample: values.apiPayloadSample || null,
            resultField: values.apiResultField || null,
          })
        : null,
      // machine_code is intentionally NOT sent — it belongs to the stage.
    };

    try {
      setSaving(true);
      const res = editingRecord
        ? await api.put(`/product-stage-flow/update/${editingRecord.id}`, payload)
        : await api.post("/product-stage-flow/create", payload);

      const saved = normalizeFlow(res.data?.data || res.data, productOptions, stageOptions);

      setFlows((prev) =>
        editingRecord
          ? prev.map((item) => (item.id === editingRecord.id ? saved : item))
          : [...prev, saved]
      );
      message.success(editingRecord ? "Product stage updated" : "Product stage added");
      setFormOpen(false);
    } catch (err) {
      message.error(err?.response?.data?.message || "Failed to save product stage");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await api.delete(`/product-stage-flow/delete/${deleteTarget.id}`);
      await loadInitialData(); // sequence numbers shifted server-side — refetch to stay in sync
      message.success("Product stage removed");
      setDeleteTarget(null);
    } catch (err) {
      message.error(err?.response?.data?.message || "Failed to delete product stage");
    } finally {
      setDeleting(false);
    }
  };

  const handleReorder = async (productId, lineId, orderedIds) => {
    setFlows((prev) => {
      const map = new Map(orderedIds.map((id, idx) => [id, idx + 1]));

      return prev.map((flow) =>
        Number(flow.productId) === Number(productId) &&
        Number(flow.lineId) === Number(lineId) &&
        map.has(flow.id)
          ? { ...flow, sequenceNo: map.get(flow.id) }
          : flow
      );
    });

    try {
      await api.patch("/product-stage-flow/reorder", {
        productId,
        lineId,
        orderedIds,
      });
    } catch (err) {
      message.error(err?.response?.data?.message || "Failed to reorder — reverting");
      await loadInitialData();
    }
  };

  // ----------------------------------------------------------------
  // Read-only table, used when stage filters are active. Drag & drop
  // reorder is only safe on the full, unfiltered list, so while
  // filtering we show a plain table with edit / delete instead.
  // ----------------------------------------------------------------
  const filteredColumns = [
    {
      title: "Sequence No",
      dataIndex: "sequenceNo",
      key: "sequenceNo",
      sorter: (a, b) => a.sequenceNo - b.sequenceNo,
    },
    { title: "Stage", dataIndex: "stageName", key: "stageName" },
    {
      title: "Scan Mode",
      dataIndex: "scanMode",
      key: "scanMode",
      render: (v) => <Tag color={SCAN_MODE_COLOR[v] || "default"}>{v}</Tag>,
    },
    {
      title: "External Dependency",
      dataIndex: "isExternalDependency",
      key: "isExternalDependency",
      render: (v, record) =>
        v ? (
          <Tag
            color="volcano"
            style={{ cursor: "pointer" }}
            onClick={(e) => {
              e.stopPropagation();
              setMachineDetailsTarget(record);
            }}
          >
            {record.externalSource || "Yes"}
            {record.externalMachineType ? ` [${record.externalMachineType}]` : ""}
            {record.externalSourceType
              ? ` (${SOURCE_TYPE_LABEL[record.externalSourceType] || record.externalSourceType})`
              : ""}
          </Tag>
        ) : (
          <Tag color="default">No</Tag>
        ),
    },
    {
      title: "Machine Code",
      dataIndex: "machineCode",
      key: "machineCode",
      render: (v) => (v ? <Tag color="blue">{v}</Tag> : <span style={{ color: "#94A3B8" }}>—</span>),
    },
    { title: "Created Date", dataIndex: "createdDate", key: "createdDate" },
    {
      title: "Actions",
      key: "actions",
      width: 100,
      render: (_, r) => (
        <div style={{ display: "flex", gap: 6 }}>
          <IconButton icon={Pencil} tone="edit" title="Edit" onClick={() => openEditModal(r)} />
          <IconButton icon={Trash2} tone="delete" title="Delete" onClick={() => setDeleteTarget(r)} />
        </div>
      ),
    },
  ];

  // ----------------------------------------------------------------
  // Step 1 UI
  // ----------------------------------------------------------------
  const renderProductStep = () => (
    <>
      <div style={{ padding: "20px 20px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#0F172A" }}>Product Stage Flow</div>
            <div style={{ fontSize: 13, color: "#64748B", marginTop: 2 }}>
              Select a product to define which stages it uses and in what sequence
            </div>
          </div>

          <PrimaryButton onClick={() => openAddModal()}>Add Product Stage</PrimaryButton>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "14px 20px",
          marginTop: 16,
          borderTop: "1px solid #F1F5F9",
          borderBottom: "1px solid #F1F5F9",
          background: "#FBFCFD",
        }}
      >
        <Input
          placeholder="Search product, ERP no. or line..."
          prefix={<Search size={15} color="#94A3B8" />}
          value={productSearch}
          onChange={(e) => setProductSearch(e.target.value)}
          style={{ maxWidth: 300, borderRadius: 10, fontSize: 13 }}
          allowClear
        />
        <span style={{ fontSize: 12, color: "#64748B" }}>
          {visibleProductCards.length} product{visibleProductCards.length === 1 ? "" : "s"}
        </span>
      </div>

      <Spin spinning={loading}>
        <div style={{ padding: 20, minHeight: 200 }}>
          {visibleProductCards.length === 0 && !loading ? (
            <Empty description="No products found" />
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: 16,
              }}
            >
              {visibleProductCards.map((card) => (
                <div
                  key={card.key}
                  className="ps-product-card"
                  onClick={() => openProduct(card)}
                  style={{
                    border: "1px solid #E2E8F0",
                    borderRadius: 12,
                    padding: 16,
                    background: "#fff",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    gap: 14,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: "#EFF6FF",
                        color: "#2563EB",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Package size={20} />
                    </div>

                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: 14,
                          color: "#0F172A",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={card.name}
                      >
                        {card.name}
                      </div>
                      <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>
                        {card.erpNo ? `ERP ${card.erpNo}` : "No ERP no."}
                      </div>
                    </div>

                    <ChevronRight size={18} color="#94A3B8" />
                  </div>

                  <div style={{ display: "flex", gap: 24 }}>
                    <div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: "#0F172A", lineHeight: 1.1 }}>
                        {card.flows.length}
                      </div>
                      <div style={{ fontSize: 11.5, color: "#64748B", marginTop: 2 }}>Stages</div>
                    </div>

                    <div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: "#0F172A", lineHeight: 1.1 }}>
                        {card.lines.length}
                      </div>
                      <div style={{ fontSize: 11.5, color: "#64748B", marginTop: 2 }}>
                        Line{card.lines.length === 1 ? "" : "s"}
                      </div>
                    </div>

                    {card.externalCount > 0 && (
                      <div>
                        <div style={{ fontSize: 20, fontWeight: 700, color: "#EA580C", lineHeight: 1.1 }}>
                          {card.externalCount}
                        </div>
                        <div style={{ fontSize: 11.5, color: "#64748B", marginTop: 2 }}>External</div>
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", minHeight: 22 }}>
                    {card.flows.length === 0 ? (
                      <span style={{ fontSize: 12, color: "#94A3B8" }}>No stages configured yet</span>
                    ) : (
                      <>
                        {card.lines.slice(0, 3).map((l) => (
                          <span
                            key={l}
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              padding: "2px 9px",
                              borderRadius: 20,
                              background: "#F1F5F9",
                              color: "#475569",
                            }}
                          >
                            {l}
                          </span>
                        ))}
                        {card.lines.length > 3 && (
                          <span style={{ fontSize: 11, color: "#64748B", padding: "2px 4px" }}>
                            +{card.lines.length - 3} more
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Spin>
    </>
  );

  // ----------------------------------------------------------------
  // Step 2 UI
  // ----------------------------------------------------------------
  const renderFlowStep = () => (
    <>
      <div style={{ padding: "20px 20px 0" }}>
        <button
          onClick={backToProducts}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            border: "none",
            background: "transparent",
            color: "#2563EB",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            padding: 0,
            marginBottom: 12,
          }}
        >
          <ArrowLeft size={15} />
          All products
        </button>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 11,
                background: "#EFF6FF",
                color: "#2563EB",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Package size={22} />
            </div>

            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#0F172A" }}>
                {selectedProduct?.name || "Product"}
              </div>
              <div style={{ fontSize: 13, color: "#64748B", marginTop: 2 }}>
                {selectedProduct?.erpNo ? `ERP ${selectedProduct.erpNo} · ` : ""}
                {selectedProduct?.flows.length ?? 0} stage{(selectedProduct?.flows.length ?? 0) === 1 ? "" : "s"}
                {" across "}
                {selectedProduct?.lines.length ?? 0} line{(selectedProduct?.lines.length ?? 0) === 1 ? "" : "s"}
              </div>
            </div>
          </div>

          <PrimaryButton onClick={() => openAddForProduct()}>Add Stage</PrimaryButton>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "14px 20px",
          marginTop: 16,
          borderTop: "1px solid #F1F5F9",
          borderBottom: "1px solid #F1F5F9",
          background: "#FBFCFD",
          flexWrap: "wrap",
        }}
      >
        <Input
          placeholder="Search stage, sequence or machine code..."
          prefix={<Search size={15} color="#94A3B8" />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 300, borderRadius: 10, fontSize: 13 }}
          allowClear
        />

        <Select value={lineFilter} onChange={setLineFilter} style={{ width: 170 }} options={productLineOptions} />

        <Select value={scanFilter} onChange={setScanFilter} style={{ width: 170 }} options={SCAN_MODE_FILTER_OPTIONS} />

        <Select
          value={externalFilter}
          onChange={setExternalFilter}
          style={{ width: 170 }}
          options={EXTERNAL_FILTER_OPTIONS}
        />

        {filtersActive && (
          <button
            onClick={resetFilters}
            style={{
              border: "none",
              background: "transparent",
              color: "#2563EB",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Clear filters
          </button>
        )}
      </div>

      {stageFiltersActive && (
        <div style={{ padding: "10px 20px 0" }}>
          <Alert
            type="info"
            showIcon
            message="Reordering is paused while search or stage filters are on. Clear them to drag stages."
          />
        </div>
      )}

      <Spin spinning={loading}>
        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 20, minHeight: 160 }}>
          {lineGroups.length === 0 && !loading ? (
            <Empty
              description={
                selectedProduct?.flows.length
                  ? "No stages match the current filters"
                  : "No stages configured for this product yet"
              }
            />
          ) : (
            lineGroups.map((group) => (
              <div
                key={group.id}
                style={{ border: "1px solid #E2E8F0", borderRadius: 12, overflow: "hidden", background: "#fff" }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    padding: "12px 16px",
                    background: "#F8FAFC",
                    borderBottom: "1px solid #E2E8F0",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Layers size={16} color="#64748B" />
                    <span style={{ fontWeight: 700, fontSize: 14, color: "#0F172A" }}>{group.lineName}</span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: "#2563EB",
                        background: "#EFF6FF",
                        borderRadius: 20,
                        padding: "2px 10px",
                      }}
                    >
                      {stageFiltersActive
                        ? `${group.matches.length} of ${group.allStages.length} stages`
                        : `${group.allStages.length} stage${group.allStages.length === 1 ? "" : "s"}`}
                    </span>
                  </div>

                  <button
                    onClick={() => openAddForProduct(group.lineId)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      height: 28,
                      padding: "0 10px",
                      borderRadius: 7,
                      border: "1px solid #DBEAFE",
                      background: "#EFF6FF",
                      color: "#2563EB",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    <Plus size={13} />
                    Add stage
                  </button>
                </div>

                <div style={{ padding: stageFiltersActive ? 0 : "8px 12px" }}>
                  {stageFiltersActive ? (
                    <MasterTable columns={filteredColumns} data={group.matches} loading={false} rowKey="id" />
                  ) : (
                    <SortableFlowList
                      productId={group.productId}
                      lineId={group.lineId}
                      items={group.allStages}
                      onEdit={openEditModal}
                      onDelete={setDeleteTarget}
                      onReorder={handleReorder}
                    />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </Spin>
    </>
  );

  return (
    <div style={{ background: "#fff", border: "1px solid #F1F5F9", borderRadius: 5, overflow: "hidden" }}>
      <style>{`
        .ps-product-card {
          transition: border-color .15s ease, box-shadow .15s ease, transform .15s ease;
        }
        .ps-product-card:hover {
          border-color: #BFDBFE !important;
          box-shadow: 0 6px 18px rgba(37, 99, 235, 0.08);
          transform: translateY(-1px);
        }
      `}</style>

      {selectedProductId === null || !selectedProduct ? renderProductStep() : renderFlowStep()}

      <MasterFormModal
        open={formOpen}
        title={editingRecord ? "Edit Product Stage" : "Add Product Stage"}
        onCancel={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        confirmLoading={saving}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="productId"
                label="Product"
                rules={[{ required: true, message: "Please select a product" }]}
                style={{ marginBottom: 16 }}
              >
                <Select
                  placeholder="Select product"
                  options={productOptions}
                  loading={optionsLoading}
                  showSearch
                  optionFilterProp="label"
                />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                name="lineId"
                label="Production Line"
                rules={[{ required: true, message: "Please select a production line" }]}
                style={{ marginBottom: 16 }}
              >
                <Select
                  placeholder="Select production line"
                  options={lineOptions}
                  loading={optionsLoading}
                  showSearch
                  optionFilterProp="label"
                  onChange={(value) => {
                    setSelectedLineId(value);
                    form.setFieldValue("stageId", undefined);
                  }}
                />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                name="stageId"
                label="Stage"
                rules={[{ required: true, message: "Please select a stage" }]}
                style={{ marginBottom: 16 }}
                extra={
                  selectedStage ? (
                    selectedStage.machineCode ? (
                      <span>
                        Machine Code:{" "}
                        <Tag color="blue" style={{ marginInlineEnd: 4 }}>
                          {selectedStage.machineCode}
                        </Tag>
                        shared by every product that uses this stage
                      </span>
                    ) : (
                      "This stage is not an external machine. Enable it in Stage configuration to use External Dependency."
                    )
                  ) : null
                }
              >
                <Select
                  placeholder={selectedLineId ? "Select stage" : "Select production line first"}
                  options={filteredStageOptions}
                  loading={optionsLoading}
                  disabled={!selectedLineId}
                  showSearch
                  optionFilterProp="label"
                  onChange={handleStageChange}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="scanMode"
                label="Scan Mode"
                rules={[{ required: true, message: "Please select scan mode" }]}
                initialValue="SINGLE"
                style={{ marginBottom: 16 }}
              >
                <Select options={SCAN_MODE_OPTIONS} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="isExternalDependency"
                label="External Dependency"
                valuePropName="checked"
                initialValue={false}
                style={{ marginBottom: isExternalDependency ? 16 : 0 }}
              >
                {/* Only stages that were set up as an external machine can be external dependencies */}
                <Switch
                  checkedChildren="Yes"
                  unCheckedChildren="No"
                  disabled={!selectedStage?.machineCode}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              {isExternalDependency && (
                <Form.Item
                  name="externalSource"
                  label="External Machine Name"
                  rules={[{ required: true, message: "Please enter the external machine name" }]}
                  style={{ marginBottom: 16 }}
                >
                  <Input placeholder="e.g. Vendor QC System" />
                </Form.Item>
              )}
            </Col>
          </Row>

          {isExternalDependency && (
            <>
              <Row gutter={16}>
                <Col span={12}>
                  {/* Read-only: comes from the stage's machine code */}
                  <Form.Item
                    name="externalMachineType"
                    label="External Machine Type"
                    rules={[{ required: true, message: "Machine type comes from the stage" }]}
                    style={{ marginBottom: 16 }}
                  >
                    <Select
                      placeholder="Set by the selected stage"
                      options={EXTERNAL_MACHINE_TYPE_OPTIONS}
                      disabled
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="externalSourceType"
                    label="External Source Type"
                    rules={[{ required: true, message: "Please select a source type" }]}
                    style={{ marginBottom: 16 }}
                  >
                    <Select placeholder="How should the result be fetched?" options={EXTERNAL_SOURCE_TYPE_OPTIONS} />
                  </Form.Item>
                </Col>
              </Row>

              {externalSourceType === "LOCAL_FILE" && (
                <>
                  <Row gutter={16}>
                    <Col span={16}>
                      <Form.Item
                        name="externalFolderPath"
                        label="Folder Path to Read"
                        rules={[{ required: true, message: "Please enter the folder path" }]}
                        style={{ marginBottom: 16 }}
                      >
                        <Input placeholder="e.g. \\\\SERVER\\shared\\aoi-results or /mnt/data/aoi-results" />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item
                        name="externalPollIntervalMinutes"
                        label="Read Interval"
                        rules={[{ required: true, message: "Please enter an interval" }]}
                        style={{ marginBottom: 16 }}
                      >
                        <InputNumber min={1} style={{ width: "100%" }} placeholder="e.g. 5" addonAfter="min" />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={24}>
                      <Form.Item
                        name="externalFileExtensions"
                        label="File Extensions to Read"
                        rules={[{ required: true, message: "Please select at least one file extension" }]}
                        style={{ marginBottom: 0 }}
                      >
                        <Select
                          mode="tags"
                          placeholder="Select or type extensions, e.g. .csv"
                          options={FILE_EXTENSION_OPTIONS}
                          tokenSeparators={[","]}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </>
              )}

              {externalSourceType === "API" && (
                <>
                  <Alert
                    type="info"
                    showIcon
                    message="API integration is coming in a future release."
                    description="You can fill in the intended configuration below now — it will be saved, but nothing will call this API yet."
                    style={{ marginBottom: 16 }}
                  />
                  <Row gutter={16}>
                    <Col span={24}>
                      <Form.Item name="apiEndpoint" label="API Endpoint" style={{ marginBottom: 16 }}>
                        <Input placeholder="e.g. https://vendor-system.local/api/results" />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={16}>
                      <Form.Item
                        name="apiPayloadSample"
                        label="Expected Response Payload (sample)"
                        style={{ marginBottom: 0 }}
                      >
                        <TextArea rows={3} placeholder='e.g. { "status": "PASS", "itemCode": "TH26FG..." }' />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item name="apiResultField" label="Result Field to Read" style={{ marginBottom: 0 }}>
                        <Input placeholder="e.g. status" />
                      </Form.Item>
                    </Col>
                  </Row>
                </>
              )}
            </>
          )}
        </Form>
      </MasterFormModal>

      <DeleteModal
        open={!!deleteTarget}
        itemName={deleteTarget ? `${deleteTarget.productName} → ${deleteTarget.stageName}` : ""}
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />

      <Modal
        open={!!machineDetailsTarget}
        title="External Machine Details"
        onCancel={() => setMachineDetailsTarget(null)}
        footer={null}
        width={640}
        destroyOnClose
      >
        {machineDetailsTarget && (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="Product" span={2}>
              {machineDetailsTarget.productName} → {machineDetailsTarget.stageName}
            </Descriptions.Item>
            <Descriptions.Item label="Machine Name">
              {machineDetailsTarget.externalSource || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Machine Type">
              {machineDetailsTarget.externalMachineType || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Machine Code" span={2}>
              {machineDetailsTarget.machineCode ? (
                <Tag color="blue">{machineDetailsTarget.machineCode}</Tag>
              ) : (
                <span style={{ color: "#94A3B8" }}>
                  Not assigned — set this stage up as an external machine in Stage configuration
                </span>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Source Type" span={2}>
              {SOURCE_TYPE_LABEL[machineDetailsTarget.externalSourceType] || "-"}
            </Descriptions.Item>

            {machineDetailsTarget.externalSourceType === "LOCAL_FILE" && (
              <>
                <Descriptions.Item label="Folder Path" span={2}>
                  {machineDetailsTarget.externalFolderPath || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Read Interval">
                  {machineDetailsTarget.externalPollIntervalMinutes
                    ? `${machineDetailsTarget.externalPollIntervalMinutes} min`
                    : "-"}
                </Descriptions.Item>
                <Descriptions.Item label="File Extensions">
                  {machineDetailsTarget.externalFileExtensions?.length
                    ? machineDetailsTarget.externalFileExtensions.join(", ")
                    : "-"}
                </Descriptions.Item>
              </>
            )}

            {machineDetailsTarget.externalSourceType === "API" && (
              <>
                <Descriptions.Item label="API Endpoint" span={2}>
                  {machineDetailsTarget.apiEndpoint || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Result Field" span={2}>
                  {machineDetailsTarget.apiResultField || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Sample Payload" span={2}>
                  <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                    {machineDetailsTarget.apiPayloadSample || "-"}
                  </pre>
                </Descriptions.Item>
              </>
            )}
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default ProductStage;
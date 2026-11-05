import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Form,
  Select,
  InputNumber,
  Input,
  Switch,
  message,
  Tag,
  Popconfirm,
  Button,
  Space,
  Card,
  Typography,
  Modal,
  Table,
} from "antd";
import { EditOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import api from "../../../services/API/api";
import MasterHeader from "../../pages/Masters/components/MasterHeader";
import MasterToolbar from "../../pages/Masters/components/MasterToolbar";
import MasterTable from "../../pages/Masters/components/MasterTable";
import MasterFormModal from "../../pages/Masters/components/MasterFormModal";
import LabelTemplatePreview from "../Settings/components/Labeltemplatepreview";

const { Text } = Typography;

const BARCODE_FORMATS = ["CODE128", "QR", "EAN13", "DATAMATRIX"];

// This component only ever deals with BOX_LABEL templates — the type is
// hardcoded here and on the server; we don't expose a template-type picker.
const LABEL_TEMPLATE_TYPE = "BOX_LABEL";

// ------------------------------------------------------------------
// Barcode VALUE rule — separate from barcode_format (which is the
// symbology/encoding, e.g. CODE128 vs QR). This defines the actual
// string the server generates per item: an ordered list of segments
// concatenated together.
// ------------------------------------------------------------------
const SEGMENT_TYPES = [
  { value: "STATIC", label: "Fixed Text / Prefix" },
  { value: "DATE", label: "Date Component" },
  { value: "SERIAL", label: "Serial Number" },
];

const DATE_PART_OPTIONS = [
  { value: "YYYY", label: "Year — 4 digit (2026)" },
  { value: "YY", label: "Year — 2 digit (26)" },
  { value: "MM", label: "Month (08)" },
  { value: "DD", label: "Day (18)" },
  { value: "WW", label: "Week of year (33)" },
];

const EMPTY_SEGMENT = (type) => {
  if (type === "STATIC") return { type, value: "" };
  if (type === "DATE") return { type, parts: ["YY", "MM"] };
  if (type === "SERIAL") return { type, start: 1, end: 500, width: 5 };
  return { type };
};

function getISOWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

const formatDatePart = (part, date) => {
  switch (part) {
    case "YYYY":
      return String(date.getFullYear());
    case "YY":
      return String(date.getFullYear()).slice(-2);
    case "MM":
      return String(date.getMonth() + 1).padStart(2, "0");
    case "DD":
      return String(date.getDate()).padStart(2, "0");
    case "WW":
      return String(getISOWeek(date)).padStart(2, "0");
    default:
      return "";
  }
};

// Renders one example code — uses today's date and the segment's
// configured `start` value for the serial portion.
const buildPreview = (segments) => {
  const now = new Date();
  return segments
    .map((seg) => {
      if (seg.type === "STATIC") return seg.value || "";
      if (seg.type === "DATE") return (seg.parts || []).map((p) => formatDatePart(p, now)).join("");
      if (seg.type === "SERIAL") {
        const start = seg.start ?? 1;
        const width = seg.width ?? 5;
        return String(start).padStart(width, "0");
      }
      return "";
    })
    .join("");
};

const validateSegments = (segments) => {
  if (!segments.length) return "Add at least one segment";
  const serials = segments.filter((s) => s.type === "SERIAL");
  if (serials.length === 0) return "A Serial Number segment is required";
  if (serials.length > 1) return "Only one Serial Number segment is allowed";

  for (const seg of segments) {
    if (seg.type === "STATIC" && !seg.value?.trim()) return "Fixed text segment cannot be empty";
    if (seg.type === "DATE" && (!seg.parts || seg.parts.length === 0))
      return "Select at least one date part";
    if (seg.type === "SERIAL") {
      if (seg.start == null || seg.end == null) return "Serial start and end are required";
      if (seg.start > seg.end) return "Serial start cannot be greater than end";
      if (!seg.width || seg.width < 1) return "Serial width is required";
      if (String(seg.end).length > seg.width)
        return `Serial width (${seg.width}) is too small for end value ${seg.end}`;
    }
  }
  return null;
};

// ------------------------------------------------------------------
// Segment row editor — one row per segment, type-specific fields.
// ------------------------------------------------------------------
function SegmentRow({ segment, index, onChange, onRemove }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
        padding: "10px 12px",
        border: "1px solid #E5E7EB",
        borderRadius: 8,
        marginBottom: 8,
        background: "#FAFAFA",
      }}
    >
      <div style={{ width: 24, paddingTop: 6, color: "#94A3B8", fontSize: 12, fontWeight: 700 }}>
        {index + 1}
      </div>

      <div style={{ width: 170 }}>
        <Select
          size="small"
          value={segment.type}
          options={SEGMENT_TYPES}
          onChange={(type) => onChange(index, EMPTY_SEGMENT(type))}
          style={{ width: "100%" }}
        />
      </div>

      <div style={{ flex: 1 }}>
        {segment.type === "STATIC" && (
          <Input
            size="small"
            placeholder="e.g. PCB-"
            value={segment.value}
            onChange={(e) => onChange(index, { ...segment, value: e.target.value })}
          />
        )}

        {segment.type === "DATE" && (
          <Select
            size="small"
            mode="multiple"
            placeholder="Select date parts, in order"
            value={segment.parts}
            options={DATE_PART_OPTIONS}
            onChange={(parts) => onChange(index, { ...segment, parts })}
            style={{ width: "100%" }}
          />
        )}

        {segment.type === "SERIAL" && (
          <Space size={8}>
            <InputNumber
              size="small"
              min={0}
              value={segment.start}
              placeholder="Start"
              onChange={(v) => onChange(index, { ...segment, start: v })}
              style={{ width: 90 }}
            />
            <span style={{ color: "#94A3B8", fontSize: 12 }}>to</span>
            <InputNumber
              size="small"
              min={0}
              value={segment.end}
              placeholder="End"
              onChange={(v) => onChange(index, { ...segment, end: v })}
              style={{ width: 90 }}
            />
            <span style={{ color: "#94A3B8", fontSize: 12 }}>width</span>
            <InputNumber
              size="small"
              min={1}
              max={12}
              value={segment.width}
              placeholder="Width"
              onChange={(v) => onChange(index, { ...segment, width: v })}
              style={{ width: 70 }}
            />
          </Space>
        )}
      </div>

      <Button
        size="small"
        danger
        type="text"
        icon={<DeleteOutlined />}
        onClick={() => onRemove(index)}
      />
    </div>
  );
}

export default function PackagingRuleManager() {
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [search, setSearch] = useState("");
  const selectedProductId = Form.useWatch("product_id", form);


  const selectedStageId = Form.useWatch("stage_id", form);
  const selectedBoxSize = Form.useWatch("box_size", form);
  const selectedTemplateId = Form.useWatch("label_template_id", form);


  const [workerModalOpen, setWorkerModalOpen] = useState(false);
  const [selectedWorkerRule, setSelectedWorkerRule] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [workersLoading, setWorkersLoading] = useState(false);
  const [workerCreating, setWorkerCreating] = useState(false);
  const [workerUsername, setWorkerUsername] = useState("");
  const [workerPassword, setWorkerPassword] = useState("");



  // Barcode value-rule segments, kept as local state and merged into the
  // payload on submit — easier to manage per-row conditional fields here
  // than nesting it inside antd's Form.List.
  const [segments, setSegments] = useState([]);
  const [segmentError, setSegmentError] = useState(null);

  // ---- data ----
  const { data: rules = [], isLoading } = useQuery({
    queryKey: ["packaging-config"],
    queryFn: async () => (await api.get("/packaging-config")).data,
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: async () => (await api.get("/products/admin")).data.data,
  });

  const { data: printers = [] } = useQuery({
    queryKey: ["printers"],
    queryFn: async () => (await api.get("/printers")).data,
  });

  const { data: allStages = [], isLoading: stagesLoading } = useQuery({
    queryKey: ["product-stage-flow", selectedProductId],
    queryFn: async () => {
      const response = await api.get("/product-stage-flow/all");
      const data = response.data;

      const flows = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
          ? data.data
          : [];

      return flows.filter(
        (stage) => Number(stage.product_id) === Number(selectedProductId)
      );
    },
    enabled: !!selectedProductId,
  });

  console.log("PACKAGING RULE MANAGER DEBUG STAGES", allStages)

  // Label templates for the box label — this component only ever deals with
  // BOX_LABEL, so the type is hardcoded in the request, not a user-facing field.
  const { data: labelTemplates = [] } = useQuery({
    queryKey: ["label-templates", LABEL_TEMPLATE_TYPE],
    queryFn: async () =>
      (await api.get(`/label-templates/type/${LABEL_TEMPLATE_TYPE}`)).data,
  });

  // // Only offer the PACKAGING stage in this dropdown — packaging rules attach
  // // to the packaging step of the flow, not every step.
  // const stages = useMemo(() => allStages.filter((s) => (s.stage_name || s.name || "").toUpperCase().includes("PACKAGING")),
  //   [allStages]
  // );

  const productMap = useMemo(
    () => Object.fromEntries(products?.map((p) => [p.id, p.name])),
    [products]
  );

  const printerMap = useMemo(
    () => Object.fromEntries(printers?.map((p) => [p.id, p.printer_name || p.name])),
    [printers]
  );

  const stageMap = useMemo(
    () => Object.fromEntries(allStages.map((s) => [s.stage_id, s.stage_name || s.name])),
    [allStages]
  );

  const templateMap = useMemo(
    () => Object.fromEntries(labelTemplates.map((t) => [t.id, t.name])),
    [labelTemplates]
  );

  // ---- mutations ----
  const saveMutation = useMutation({
    mutationFn: async (values) => {
      if (editingRecord) {
        return api.put(`/packaging-config/${editingRecord.id}`, values);
      }
      return api.post("/packaging-config", values);
    },
    onSuccess: () => {
      message.success(editingRecord ? "Rule updated" : "Rule created");
      queryClient.invalidateQueries({ queryKey: ["packaging-config"] });
      closeModal();
    },
    onError: (err) => {
      message.error(err?.response?.data?.message || "Save failed");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => api.delete(`/packaging-config/${id}`),
    onSuccess: () => {
      message.success("Rule deleted");
      queryClient.invalidateQueries({ queryKey: ["packaging-config"] });
    },
    onError: (err) => {
      message.error(err?.response?.data?.message || "Delete failed");
    },

  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }) => api.patch(`/packaging-config/${id}`, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packaging-config"] });
    },
    onError: () => message.error("Failed to toggle status"),
  });


  // ---- segment helpers ----
  const addSegment = (type) => setSegments((prev) => [...prev, EMPTY_SEGMENT(type)]);

  const updateSegment = (index, next) => setSegments((prev) => prev.map((s, i) => (i === index ? next : s)));

  const removeSegment = (index) => setSegments((prev) => prev.filter((_, i) => i !== index));

  useEffect(() => {
    setSegmentError(segments.length ? validateSegments(segments) : null);
  }, [segments]);

  const preview = useMemo(() => (segments.length ? buildPreview(segments) : ""), [segments]);

  const selectedTemplate = useMemo(
    () => labelTemplates.find((t) => t.id === selectedTemplateId) || null,
    [labelTemplates, selectedTemplateId]
  );

  // Keys here must match the `field` your BOX_LABEL template's text/QR
  // elements were built with in the Label Template Editor — adjust as needed.
  const previewSampleData = useMemo(
    () => ({
      barcode: preview || "PREVIEW",
      product_name: productMap[selectedProductId] || "Product Name",
      box_size: selectedBoxSize ?? "-",
      stage_name: stageMap[selectedStageId] || "-",
      date: new Date().toLocaleDateString(),
    }),
    [preview, productMap, selectedProductId, selectedBoxSize, stageMap, selectedStageId]
  );

  // ---- modal helpers ----
  const openCreateModal = () => {
    setEditingRecord(null);
    form.resetFields();
    form.setFieldsValue({is_active: true, allow_partial_close: false});
    setSegments([
      EMPTY_SEGMENT("STATIC"),
      EMPTY_SEGMENT("DATE"),
      EMPTY_SEGMENT("SERIAL"),
    ]);
    setModalOpen(true);
  };

  const openEditModal = (record) => {
    setEditingRecord(record);
    form.setFieldsValue({
      product_id: record.product_id,
      stage_id: record.stage_id,
      box_size: record.box_size,
      printer_id: record.printer_id,
      barcode_format: record.barcode_format,
      label_template_id: record.label_template_id ?? undefined,
      is_active: !!record.is_active,
      allow_partial_close: !!record.allow_partial_close,
    });
    // barcode_rule comes back from the server as the segments array —
    // fall back to a sensible default if this record predates the rule builder.
    setSegments(
      Array.isArray(record.barcode_rule) && record.barcode_rule.length
        ? record.barcode_rule
        : [EMPTY_SEGMENT("STATIC"), EMPTY_SEGMENT("DATE"), EMPTY_SEGMENT("SERIAL")]
    );
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingRecord(null);
    setSegments([]);
    setSegmentError(null);
    form.resetFields();
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();

    const error = validateSegments(segments);
    if (error) {
      setSegmentError(error);
      message.error(error);
      return;
    }

    saveMutation.mutate({ ...values, barcode_rule: segments });
  };

  const openWorkerModal = async (record) => {
  setSelectedWorkerRule(record);
  setWorkerModalOpen(true);
  setWorkers([]);
  setWorkersLoading(true);

  try {
    const response = await api.get(
      `/packaging-config/${record.id}/workers`
    );
    setWorkers(response.data.data || []);
  } catch (err) {
    message.error(
      err?.response?.data?.message || "Failed to load workers"
    );
  } finally {
    setWorkersLoading(false);
  }
};

const createWorker = async () => {
  const username = workerUsername.trim();

  if (!username || !workerPassword) {
    message.warning("Enter a username and password");
    return;
  }

  if (workerPassword.length < 8 || workerPassword.length > 72) {
    message.warning("Password must be between 8 and 72 characters");
    return;
  }

  setWorkerCreating(true);

  try {
    await api.post(
      `/packaging-config/${selectedWorkerRule.id}/workers`,
      {
        username,
        password: workerPassword,
      }
    );

    message.success("Worker created successfully");
    setWorkerUsername("");
    setWorkerPassword("");

    const response = await api.get(
      `/packaging-config/${selectedWorkerRule.id}/workers`
    );
    setWorkers(response.data.data || []);
  } catch (err) {
    message.error(
      err?.response?.data?.message || "Failed to create worker"
    );
  } finally {
    setWorkerCreating(false);
  }
};

const toggleWorkerStatus = async (worker) => {
  try {
    await api.patch(
      `/packaging-config/${selectedWorkerRule.id}/workers/${worker.id}`,
      { is_active: !Boolean(Number(worker.is_active)) }
    );

    message.success("Worker status updated");

    const response = await api.get(
      `/packaging-config/${selectedWorkerRule.id}/workers`
    );
    setWorkers(response.data.data || []);
  } catch (err) {
    message.error(
      err?.response?.data?.message || "Failed to update worker"
    );
  }
};

  // ---- table ----
  const filteredRules = useMemo(() => {
    if (!search) return rules;
    const q = search.toLowerCase();
    return rules.filter((r) =>
      [productMap[r.product_id], stageMap[r.stage_id], printerMap[r.printer_id], r.barcode_format]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(q))
    );
  }, [rules, search, productMap, stageMap, printerMap]);

  const columns = [
    {
      title: "Product",
      dataIndex: "product_id",
      render: (id) => productMap[id] || "-",
    },
    {
      title: "Stage",
      dataIndex: "stage_id",
      render: (id) => stageMap[id] || id,
    },
    {
      title: "Box Size",
      dataIndex: "box_size",
    },
    {
      title: "Partial Closure",
      dataIndex: "allow_partial_close",
      render: (value) => (
        <Tag color={value ? "green" : "default"}>
          {value ? "Allowed" : "Disabled"}
        </Tag>
      ),
    },
    {
      title: "Printer",
      dataIndex: "printer_id",
      render: (id) => printerMap[id] || "-",
    },
    {
      title: "Barcode Format",
      dataIndex: "barcode_format",
      render: (v) => <Tag color="blue">{v}</Tag>,
    },
    {
      title: "Barcode Rule",
      width:180,
      dataIndex: "barcode_rule",
      render: (segs) => (
        <Text code style={{ fontSize: 12 }}>
          {Array.isArray(segs) && segs.length ? buildPreview(segs) : "—"}
        </Text>
      ),
    },
    {
      title: "Label Template",
      dataIndex: "label_template_name",
      render: (name) => name || "-",
    },
    {
      title: "Active",
      dataIndex: "is_active",
      render: (val, record) => (
        <Switch
          checked={!!val}
          onChange={(checked) => toggleActiveMutation.mutate({ id: record.id, is_active: checked })}
        />
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEditModal(record)} />
          <Button
            size="small"
            onClick={() => openWorkerModal(record)}
            disabled={!Number(record.allow_partial_close)}
          >
            Manage Workers
          </Button>
          <Popconfirm title="Delete this packaging rule?" onConfirm={() => {
            deleteMutation.mutate(record.id)}}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 20, background: "#F9FAFB", minHeight: "100vh" }}>

      <MasterHeader title="Packaging Rules" subtitle="Configure box size, printer & barcode format per product stage" />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <MasterToolbar onSearch={setSearch} searchPlaceholder="Search product, stage, printer..." />
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
          Add Packaging Rule
        </Button>
      </div>
      <MasterTable
        columns={columns}
        data={filteredRules}
        loading={isLoading}
        onView={openEditModal}
        onEdit={openEditModal}
        onDelete={deleteMutation.mutate}
        rowKey="id"
      />

      
      <Modal
        title={`Manage Workers${selectedWorkerRule ? ` — Rule ${selectedWorkerRule.id}` : ""}`}
        open={workerModalOpen}
        onCancel={() => {
          setWorkerModalOpen(false);
          setSelectedWorkerRule(null);
          setWorkerUsername("");
          setWorkerPassword("");
        }}
        footer={null}
        width={700}
        destroyOnClose
      >
        {selectedWorkerRule && (
          <>
            {!Number(selectedWorkerRule.allow_partial_close) && (
              <div style={{ marginBottom: 16 }}>
                <Tag color="warning">
                  Enable partial closure in the packaging rule first.
                </Tag>
              </div>
            )}

            <Card size="small" title="Create Worker" style={{ marginBottom: 20 }}>
              <Space direction="vertical" style={{ width: "100%" }} size={12}>
                <Input
                  placeholder="Worker username"
                  maxLength={100}
                  value={workerUsername}
                  onChange={(e) => setWorkerUsername(e.target.value)}
                  autoComplete="off"
                />

                <Input.Password
                  placeholder="Worker password (8–72 characters)"
                  maxLength={72}
                  value={workerPassword}
                  onChange={(e) => setWorkerPassword(e.target.value)}
                  autoComplete="new-password"
                />

                <Button
                  type="primary"
                  onClick={createWorker}
                  loading={workerCreating}
                  disabled={
                    !Number(selectedWorkerRule.allow_partial_close)
                  }
                >
                  Create Worker
                </Button>
              </Space>
            </Card>

            <Typography.Title level={5}>Registered Workers</Typography.Title>

            <Table
              rowKey="id"
              size="small"
              loading={workersLoading}
              dataSource={workers}
              pagination={{ pageSize: 5 }}
              columns={[
                {
                  title: "Username",
                  dataIndex: "username",
                  key: "username",
                },
                {
                  title: "Status",
                  dataIndex: "is_active",
                  key: "status",
                  render: (value) =>
                    Number(value) === 1 ? (
                      <Tag color="green">Active</Tag>
                    ) : (
                      <Tag color="red">Inactive</Tag>
                    ),
                },
                {
                  title: "Action",
                  key: "action",
                  render: (_, worker) => (
                    <Popconfirm
                      title={`${
                        Number(worker.is_active) === 1
                          ? "Deactivate"
                          : "Activate"
                      } this worker?`}
                      onConfirm={() => toggleWorkerStatus(worker)}
                    >
                      <Button
                        size="small"
                        danger={Number(worker.is_active) === 1}
                        disabled={!Number(selectedWorkerRule.allow_partial_close)}
                      >
                        {Number(worker.is_active) === 1
                          ? "Deactivate"
                          : "Activate"}
                      </Button>
                    </Popconfirm>
                  ),
                },
              ]}
            />
          </>
        )}
      </Modal>

      <MasterFormModal
        open={modalOpen}
        title={editingRecord ? "Edit Packaging Rule" : "Create Packaging Rule"}
        onCancel={closeModal}
        onSubmit={handleSubmit}
        confirmLoading={saveMutation.isPending}
        width={620}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="product_id"
            label="Product"
            rules={[{ required: true, message: "Product is required" }]}
          >
            <Select
              placeholder="Select product"
              showSearch
              optionFilterProp="children"
              onChange={() => form.setFieldValue("stage_id", undefined)}
              options={products.map((p) => ({ label: p.name, value: p.id }))}
            />
          </Form.Item>

          <Form.Item
            name="stage_id"
            label="Packaging Stage"
            rules={[{ required: true, message: "Please select packaging stage" }]}
          >
            <Select
              placeholder="Select packaging stage"
              loading={stagesLoading}
              notFoundContent={stagesLoading ? "Loading stages..." : "No stages configured for this product"}
            >
              {allStages.map((stage) => (
                <Select.Option key={stage.stage_id} value={stage.stage_id}>
                  {stage.stage_name || stage.name || `Stage ${stage.stage_id}`}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="box_size"
            label="Box Size"
            rules={[{ required: true, message: "Box size is required" }]}
          >
            <InputNumber min={1} style={{ width: "100%" }} placeholder="e.g. 24" />
          </Form.Item>

          <Form.Item
            name="allow_partial_close"
            label="Allow Partial Box Closure"
            valuePropName="checked"
            initialValue={false}
          >
            <Switch checkedChildren="Allowed" unCheckedChildren="Disabled" />
          </Form.Item>

          <Form.Item
            name="printer_id"
            label="Printer"
            rules={[{ required: true, message: "Printer is required" }]}
          >
            <Select
              placeholder="Select printer"
              showSearch
              optionFilterProp="children"
              options={printers.filter((p) => p.is_active).map((p) => ({ label: p.printer_name || p.name, value: p.id }))}
            />
          </Form.Item>

          <Form.Item
            name="barcode_format"
            label="Barcode Symbology"
            rules={[{ required: true, message: "Barcode format is required" }]}
          >
            <Select placeholder="Select format" options={BARCODE_FORMATS.map((f) => ({ label: f, value: f }))} />
          </Form.Item>

          <Form.Item
            name="label_template_id"
            label="Box Label Template"
            rules={[{ required: true, message: "Label template is required" }]}
          >
            <Select
              placeholder="Select label template"
              showSearch
              optionFilterProp="children"
              notFoundContent="No BOX_LABEL templates found"
              options={labelTemplates.map((t) => ({
                label: `${t.name} (${t.width}×${t.height})`,
                value: t.id,
              }))}
            />
          </Form.Item>

          {selectedTemplate && (
            <div style={{ marginBottom: 16 }}>
              <LabelTemplatePreview
                template={selectedTemplate}
                sampleData={previewSampleData}
                maxWidth={400}
              />
            </div>
          )}

          {/* ---- Barcode VALUE rule builder ---- */}
          <Form.Item label="Barcode Value Rule" required style={{ marginBottom: 8 }}>
            {segments.map((seg, i) => (
              <SegmentRow
                key={i}
                segment={seg}
                index={i}
                onChange={updateSegment}
                onRemove={removeSegment}
              />
            ))}

            <Space size={8} style={{ marginBottom: 10 }}>
              <Button size="small" icon={<PlusOutlined />} onClick={() => addSegment("STATIC")}>
                Add Prefix
              </Button>
              <Button size="small" icon={<PlusOutlined />} onClick={() => addSegment("DATE")}>
                Add Date
              </Button>
              <Button size="small" icon={<PlusOutlined />} onClick={() => addSegment("SERIAL")}>
                Add Serial
              </Button>
            </Space>

            {segmentError && (
              <div style={{ color: "#DC2626", fontSize: 12, marginBottom: 8 }}>{segmentError}</div>
            )}

            <Card size="small" style={{ background: "#EFF6FF", border: "1px solid #DBEAFE" }}>
              <Text style={{ fontSize: 11, color: "#64748B", display: "block", marginBottom: 2 }}>
                PREVIEW (first code, generated today)
              </Text>
              <Text strong style={{ fontSize: 16, color: "#1D4ED8", letterSpacing: 1 }}>
                {preview || "—"}
              </Text>
            </Card>
          </Form.Item>

          

          <Form.Item name="is_active" label="Active" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </MasterFormModal>
    </div>
  );
}
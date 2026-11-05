import { useState, useEffect } from "react";
import { Form, Select, Switch, Row, Col, Tag, message } from "antd";

import MasterHeader from "../Masters/components/MasterHeader";
import MasterToolbar from "../Masters/components/MasterToolbar";
import MasterTable from "../Masters/components/MasterTable";
import DeleteModal from "../Masters/components/DeleteModal";
import MasterFormModal from "../Masters/components/MasterFormModal";

import api from "../../../services/API/api";

const formatCreatedDate = (dateInput) =>
  new Date(dateInput || Date.now()).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

// Builds a readable label for each product_stage_flow row, e.g. "Outdoor PCB -> PCB Grouping (Seq 1)".
// Falls back gracefully if the flow API already returns denormalized productName/stageName.
const buildFlowOptions = (flows, products, stages) => {
  const productMap = new Map(products.map((p) => [p.value, p.label]));
  const stageMap = new Map(stages.map((s) => [s.value, s.label]));

  return flows.map((flow) => {
    const productName = flow.productName || productMap.get(flow.product_id) || "Unknown Product";
    const stageName = flow.stageName || stageMap.get(flow.stage_id) || "Unknown Stage";
    return {
      value: flow._id || flow.id,
      label: `${productName} \u2192 ${stageName} (Seq ${flow.sequence_no})`,
    };
  });
};

// Server sends/expects { product_stage_flow_id, product_field_id, is_required }.
// Field dropdown (product_field_id) is sourced from GET /api/production-fields/all,
// using each field's field_name as the label.
const normalizeScanField = (item, flowOptions = [], fieldOptions = []) => ({
  id: item._id || item.id,
  flowId: item.product_stage_flow_id,
  flowLabel:
    item.flowLabel ||
    flowOptions.find((f) => f.value === item.product_stage_flow_id)?.label ||
    "-",
  fieldId: item.product_field_id,
  fieldName:
    item.fieldName || fieldOptions.find((f) => f.value === item.product_field_id)?.label || "-",
  isRequired: item.is_required === undefined || item.is_required === null ? true : !!item.is_required,
  createdDate: formatCreatedDate(item.created_at || item.createdAt || item.createdDate),
});

const ScanStage = () => {
  const [scanFields, setScanFields] = useState([]);
  const [loading, setLoading] = useState(true);

  const [flowOptions, setFlowOptions] = useState([]);
  const [fieldOptions, setFieldOptions] = useState([]);
  const [optionsLoading, setOptionsLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setOptionsLoading(true);

      const [productsRes, stagesRes, flowsRes, productFieldsRes, scanFieldsRes] = await Promise.all([
        api.get("/products/all"),
        api.get("/stages/all"),
        api.get("/product-stage-flow/all"),
        api.get("/product-fields/all"),
        api.get("/stage-scan-fields/all"), // TODO: confirm actual mount path for this router
      ]);

      const productList = (productsRes.data?.data || productsRes.data || []).map((p) => ({
        value: p._id || p.id,
        label: p.name,
      }));
      const stageList = (stagesRes.data?.data || stagesRes.data || []).map((s) => ({
        value: s._id || s.id,
        label: s.name,
      }));
      const rawFlows = flowsRes.data?.data || flowsRes.data || [];
      const resolvedFlowOptions = buildFlowOptions(rawFlows, productList, stageList);
      setFlowOptions(resolvedFlowOptions);

      const resolvedFieldOptions = (productFieldsRes.data?.data || productFieldsRes.data || []).map(
        (f) => ({
          value: f._id || f.id,
          label: f.field_name,
        })
      );
      setFieldOptions(resolvedFieldOptions);

      const scanFieldList = scanFieldsRes.data?.data || scanFieldsRes.data || [];
      setScanFields(
        scanFieldList.map((item) => normalizeScanField(item, resolvedFlowOptions, resolvedFieldOptions))
      );
    } catch (err) {
      message.error(err?.response?.data?.message || "Failed to load stage scan fields");
    } finally {
      setLoading(false);
      setOptionsLoading(false);
    }
  };

  const filteredData = scanFields.filter((item) => {
    const query = search.toLowerCase();
    return (
      item.flowLabel.toLowerCase().includes(query) || item.fieldName.toLowerCase().includes(query)
    );
  });

  const openAddModal = () => {
    setEditingRecord(null);
    form.resetFields();
    form.setFieldsValue({ isRequired: true });
    setFormOpen(true);
  };

  const openEditModal = (record) => {
    setEditingRecord(record);
    form.setFieldsValue({
      flowId: record.flowId,
      fieldId: record.fieldId,
      isRequired: record.isRequired,
    });
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    let values;
    try {
      values = await form.validateFields();
    } catch {
      return; // validation failed, stay in modal
    }

    const payload = {
      product_stage_flow_id: values.flowId,
      product_field_id: values.fieldId,
      is_required: values.isRequired,
    };

    try {
      setSaving(true);
      const res = editingRecord
        ? await api.put(`/stage-scan-fields/update/${editingRecord.id}`, payload)
        : await api.post("/stage-scan-fields/create", payload);

      const saved = normalizeScanField(res.data?.data || res.data, flowOptions, fieldOptions);

      setScanFields((prev) =>
        editingRecord
          ? prev.map((item) => (item.id === editingRecord.id ? saved : item))
          : [...prev, saved]
      );
      message.success(editingRecord ? "Scan field updated" : "Scan field added");
      setFormOpen(false);
    } catch (err) {
      message.error(err?.response?.data?.message || "Failed to save scan field");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await api.delete(`/stage-scan-fields/delete/${deleteTarget.id}`);
      setScanFields((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      message.success("Scan field removed");
      setDeleteTarget(null);
    } catch (err) {
      message.error(err?.response?.data?.message || "Failed to delete scan field");
    } finally {
      setDeleting(false);
    }
  };

  // No manual Serial No column — MasterTable already renders its own S.No column.
  const columns = [
    { title: "Product / Stage", dataIndex: "flowLabel", key: "flowLabel" },
    { title: "Field", dataIndex: "fieldName", key: "fieldName" },
    {
      title: "Required",
      dataIndex: "isRequired",
      key: "isRequired",
      render: (v) => <Tag color={v ? "blue" : "default"}>{v ? "Required" : "Optional"}</Tag>,
    },
    { title: "Created Date", dataIndex: "createdDate", key: "createdDate" },
  ];

  return (
    <div style={{ background: "#fff", border: "1px solid #F1F5F9", borderRadius: 16, overflow: "hidden" }}>
      <div style={{ padding: "20px 20px 0" }}>
        <MasterHeader
          title="Stage Scan Fields"
          description="Define which fields must be scanned at each product stage"
          buttonLabel="Add Scan Field"
          onAddClick={openAddModal}
        />
      </div>

      <MasterToolbar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by product, stage or field..."
      />

      <MasterTable
        columns={columns}
        data={filteredData}
        loading={loading}
        onEdit={openEditModal}
        onDelete={setDeleteTarget}
      />

      <MasterFormModal
        open={formOpen}
        title={editingRecord ? "Edit Scan Field" : "Add Scan Field"}
        onCancel={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        confirmLoading={saving}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="flowId"
            label="Product Stage"
            rules={[{ required: true, message: "Please select a product stage" }]}
            style={{ marginBottom: 16 }}
          >
            <Select
              placeholder="Select product stage"
              options={flowOptions}
              loading={optionsLoading}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="fieldId"
                label="Field"
                rules={[{ required: true, message: "Please select a field" }]}
                style={{ marginBottom: 0 }}
              >
                <Select
                  placeholder="Select field"
                  options={fieldOptions}
                  loading={optionsLoading}
                  showSearch
                  optionFilterProp="label"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="isRequired"
                label="Required"
                valuePropName="checked"
                initialValue={true}
                style={{ marginBottom: 0 }}
              >
                <Switch checkedChildren="Yes" unCheckedChildren="No" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </MasterFormModal>

      <DeleteModal
        open={!!deleteTarget}
        itemName={deleteTarget ? `${deleteTarget.flowLabel} - ${deleteTarget.fieldName}` : ""}
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default ScanStage;
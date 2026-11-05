import { useState, useEffect } from "react";
import { Form, Input, Select, InputNumber, Switch, Row, Col, Tag, message } from "antd";

import MasterHeader from "./components/MasterHeader";
import MasterToolbar from "./components/MasterToolbar";
import MasterTable from "./components/MasterTable";
import StatusTag from "./components/StatusTag";
import DeleteModal from "./components/DeleteModal";
import MasterFormModal from "./components/MasterFormModal";

import api from "../../../services/API/api";

const FIELD_TYPE_OPTIONS = [
  { value: "TEXT", label: "Text" },
  { value: "NUMBER", label: "Number" },
  { value: "DATE", label: "Date" },
  { value: "BARCODE", label: "Barcode" },
  { value: "QR_CODE", label: "QR Code" },
  { value: "EMAIL", label: "Email" },
];

const formatCreatedDate = (dateInput) =>
  new Date(dateInput || Date.now()).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

// Server sends/expects { product_id, field_name, field_type, is_required, is_unique, is_scannable, display_order, is_active }.
const normalizeField = (item, productOptions = []) => ({
  id: item._id || item.id,
  productId: item.product_id,
  productName:
    item.productName || productOptions.find((p) => p.value === item.product_id)?.label || "-",
  fieldName: item.field_name,
  fieldType: item.field_type || "TEXT",
  isRequired: !!item.is_required,
  isUnique: !!item.is_unique,
  isScannable: !!item.is_scannable,
  displayOrder: item.display_order ?? 1,
  isActive: item.is_active === undefined || item.is_active === null ? true : !!item.is_active,
  createdDate: formatCreatedDate(item.created_at || item.createdAt || item.createdDate),
});

const ManageFields = () => {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);

  const [productOptions, setProductOptions] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

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
      setProductsLoading(true);

      const [productsRes, fieldsRes] = await Promise.all([
        api.get("/products/all"),
        api.get("/product-fields/all"),
      ]);

      const productList = (productsRes.data?.data || productsRes.data || []).map((p) => ({
        value: p._id || p.id,
        label: p.name,
      }));
      setProductOptions(productList);

      const fieldList = fieldsRes.data?.data || fieldsRes.data || [];
      setFields(fieldList.map((item) => normalizeField(item, productList)));
    } catch (err) {
      message.error(err?.response?.data?.message || "Failed to load fields");
    } finally {
      setLoading(false);
      setProductsLoading(false);
    }
  };

  const filteredData = fields.filter((item) => {
    const query = search.toLowerCase();
    const matchesSearch =
      item.productName.toLowerCase().includes(query) ||
      item.fieldName.toLowerCase().includes(query) ||
      item.fieldType.toLowerCase().includes(query);
    const matchesStatus =
      statusFilter === "All" || (statusFilter === "Active") === item.isActive;
    return matchesSearch && matchesStatus;
  });

  const openAddModal = () => {
    setEditingRecord(null);
    form.resetFields();
    form.setFieldsValue({
      fieldType: "TEXT",
      displayOrder: 1,
      isRequired: false,
      isUnique: false,
      isScannable: false,
      isActive: true,
    });
    setFormOpen(true);
  };

  const openEditModal = (record) => {
    setEditingRecord(record);
    form.setFieldsValue({
      productId: record.productId,
      fieldName: record.fieldName,
      fieldType: record.fieldType,
      displayOrder: record.displayOrder,
      isRequired: record.isRequired,
      isUnique: record.isUnique,
      isScannable: record.isScannable,
      isActive: record.isActive,
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
      product_id: values.productId,
      field_name: values.fieldName,
      field_type: values.fieldType,
      is_required: values.isRequired,
      is_unique: values.isUnique,
      is_scannable: values.isScannable,
      display_order: values.displayOrder,
      is_active: values.isActive,
    };

    try {
      setSaving(true);
      // Note: no /update or /delete segment here — this router uses bare /:id.
      const res = editingRecord
        ? await api.put(`/product-fields/${editingRecord.id}`, payload)
        : await api.post("/product-fields/create", payload);

      const saved = normalizeField(res.data?.data || res.data, productOptions);

      setFields((prev) =>
        editingRecord
          ? prev.map((item) => (item.id === editingRecord.id ? saved : item))
          : [...prev, saved]
      );
      message.success(editingRecord ? "Field updated" : "Field created");
      setFormOpen(false);
    } catch (err) {
      message.error(err?.response?.data?.message || "Failed to save field");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await api.delete(`/product-fields/${deleteTarget.id}`);
      setFields((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      message.success("Field deleted");
      setDeleteTarget(null);
    } catch (err) {
      message.error(err?.response?.data?.message || "Failed to delete field");
    } finally {
      setDeleting(false);
    }
  };

  const yesNoTag = (v) => <Tag color={v ? "blue" : "default"}>{v ? "Yes" : "No"}</Tag>;

  // No manual Serial No column — MasterTable already renders its own S.No column.
  const columns = [
    { title: "Product", dataIndex: "productName", key: "productName" },
    { title: "Field Name", dataIndex: "fieldName", key: "fieldName" },
    { title: "Field Type", dataIndex: "fieldType", key: "fieldType" },
    {
      title: "Order",
      dataIndex: "displayOrder",
      key: "displayOrder",
      sorter: (a, b) => a.displayOrder - b.displayOrder,
    },
    { title: "Required", dataIndex: "isRequired", key: "isRequired", render: yesNoTag },
    { title: "Unique", dataIndex: "isUnique", key: "isUnique", render: yesNoTag },
    { title: "Scannable", dataIndex: "isScannable", key: "isScannable", render: yesNoTag },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      render: (v) => <StatusTag status={v ? "Active" : "Inactive"} />,
    },
    { title: "Created Date", dataIndex: "createdDate", key: "createdDate" },
  ];

  return (
    <div style={{ background: "#fff", border: "1px solid #F1F5F9", borderRadius:5, overflow: "hidden" }}>
      <div style={{ padding: "20px 20px 0" }}>
        <MasterHeader
          title="Manage Fields"
          description="Define the scan/data fields captured for each product"
          buttonLabel="Add Field"
          onAddClick={openAddModal}
        />
      </div>

      <MasterToolbar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by product, field name or type..."
        statusValue={statusFilter}
        onStatusChange={setStatusFilter}
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
        title={editingRecord ? "Edit Field" : "Add Field"}
        onCancel={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        confirmLoading={saving}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="productId"
                label="Product"
                rules={[{ required: true, message: "Please select a product" }]}
                style={{ marginBottom: 16 }}
              >
                <Select
                  placeholder="Select product"
                  options={productOptions}
                  loading={productsLoading}
                  showSearch
                  optionFilterProp="label"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="fieldName"
                label="Field Name"
                rules={[{ required: true, message: "Please enter field name" }]}
                style={{ marginBottom: 16 }}
              >
                <Input placeholder="e.g. Serial Number" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="fieldType" label="Field Type" style={{ marginBottom: 16 }}>
                <Select placeholder="Select field type" options={FIELD_TYPE_OPTIONS} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="displayOrder" label="Display Order" style={{ marginBottom: 16 }}>
                <InputNumber min={1} style={{ width: "100%" }} placeholder="e.g. 1" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="isRequired" label="Required" valuePropName="checked" style={{ marginBottom: 0 }}>
                <Switch />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="isUnique" label="Unique" valuePropName="checked" style={{ marginBottom: 0 }}>
                <Switch />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="isScannable" label="Scannable" valuePropName="checked" style={{ marginBottom: 0 }}>
                <Switch />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="isActive" label="Active" valuePropName="checked" style={{ marginBottom: 0 }}>
                <Switch />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </MasterFormModal>

      <DeleteModal
        open={!!deleteTarget}
        itemName={deleteTarget?.fieldName}
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default ManageFields;
import { useState, useEffect } from "react";
import { Form, Select, Input, Modal, message } from "antd";
import { CalendarClock, Boxes, ListChecks } from "lucide-react";

import MasterHeader from "./components/MasterHeader";
import MasterToolbar from "./components/MasterToolbar";
import MasterTable from "./components/MasterTable";
import DeleteModal from "./components/DeleteModal";
import MasterFormModal from "./components/MasterFormModal";

import api from "../../../services/API/api";

const PRODUCT_FIELDS_URL = "/product-fields/all";

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const normalizeValue = (item) => ({
  id: item.id,
  itemId: item.item_id,
  productFieldId: item.product_field_id,
  value: item.value,
  createdAt: item.created_at,
});

// Safely pulls an array out of an unknown response shape.
// Tries the common wrapper keys, then falls back to scanning one level deep
// for the first array it finds. Logs the raw payload if nothing matches,
// so you can see the real shape in the console instead of a crash.
const extractList = (res, label) => {
  const data = res?.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.values)) return data.values;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.products)) return data.products;
  if (Array.isArray(data?.fields)) return data.fields;
  if (Array.isArray(data?.rows)) return data.rows;
  if (Array.isArray(data?.result)) return data.result;

  // last resort: scan one level deep for any array value
  if (data && typeof data === "object") {
    const firstArrayValue = Object.values(data).find((v) => Array.isArray(v));
    if (firstArrayValue) return firstArrayValue;
  }

  console.error(`[ManageItemField] Could not find an array in the "${label}" response. Raw payload:`, data);
  return [];
};

const ManageItemField = () => {
  const [values, setValues] = useState([]);
  const [items, setItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [productFields, setProductFields] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [viewRecord, setViewRecord] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

  const getProductName = (productId) => {
    const product = products.find((p) => p.id === productId);
    return product ? product.name : "";
  };

  const getItemLabel = (id) => {
    const item = items.find((i) => i.id === id);
    if (!item) return id ? `Item #${id}` : "-";
    const productName = getProductName(item.productId);
    return productName ? `Item #${item.id} — ${productName}` : `Item #${item.id}`;
  };

  const getFieldLabel = (id) => {
    const field = productFields.find((f) => f.id === id);
    return field ? field.name : id ? `Field #${id}` : "-";
  };

  const fetchAll = async () => {
    setLoading(true);

    const results = await Promise.allSettled([
      api.get("/item-field-values/all"),
      api.get("/items/all"),
      api.get("/products/all"),
      api.get(PRODUCT_FIELDS_URL),
    ]);

    const [valuesResult, itemsResult, productsResult, fieldsResult] = results;
    const failedLabels = [];

    if (valuesResult.status === "fulfilled") {
      const list = extractList(valuesResult.value, "item field values");
      setValues(list.map(normalizeValue));
    } else {
      failedLabels.push("item field values");
      console.error("Failed: GET /item-field-values/all", valuesResult.reason);
    }

    if (itemsResult.status === "fulfilled") {
      const list = extractList(itemsResult.value, "items");
      setItems(list.map((i) => ({ id: i.id, productId: i.product_id, status: i.status })));
    } else {
      failedLabels.push("items");
      console.error("Failed: GET /items/all", itemsResult.reason);
    }

    if (productsResult.status === "fulfilled") {
      const list = extractList(productsResult.value, "products");
      setProducts(list.map((p) => ({ id: p.id, name: p.name || p.product_name || p.title || `Product #${p.id}` })));
    } else {
      failedLabels.push("products");
      console.error("Failed: GET /products/all", productsResult.reason);
    }

    if (fieldsResult.status === "fulfilled") {
      const list = extractList(fieldsResult.value, "product fields");
      setProductFields(list.map((f) => ({ id: f.id, name: f.name || f.field_name || `Field #${f.id}` })));
    } else {
      failedLabels.push("product fields");
      console.error(`Failed: GET ${PRODUCT_FIELDS_URL}`, fieldsResult.reason);
    }

    if (failedLabels.length > 0) {
      message.error(`Failed to load: ${failedLabels.join(", ")}. Check console for details.`);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const filteredData = values.filter((v) => {
    const itemLabel = getItemLabel(v.itemId).toLowerCase();
    const fieldLabel = getFieldLabel(v.productFieldId).toLowerCase();
    const term = search.toLowerCase();
    return (
      itemLabel.includes(term) ||
      fieldLabel.includes(term) ||
      (v.value || "").toLowerCase().includes(term)
    );
  });

  const openAddModal = () => {
    setEditingRecord(null);
    form.resetFields();
    setFormOpen(true);
  };

  const openEditModal = (record) => {
    setEditingRecord(record);
    form.setFieldsValue(record);
    setFormOpen(true);
  };

  const openViewModal = async (record) => {
    try {
      setViewLoading(true);
      const res = await api.get(`/item-field-values/item/${record.itemId}`);
      const list = extractList(res, "item field values by item");
      const match = list.find((v) => v.id === record.id);
      setViewRecord(normalizeValue(match || record));
    } catch (err) {
      message.error(err?.response?.data?.message || "Failed to load record");
    } finally {
      setViewLoading(false);
    }
  };

  const handleSubmit = async () => {
    let formValues;
    try {
      formValues = await form.validateFields();
    } catch {
      return;
    }

    const payload = {
      item_id: formValues.itemId,
      product_field_id: formValues.productFieldId,
      value: formValues.value,
    };

    try {
      setSaving(true);

      if (editingRecord) {
        const res = await api.put(`/item-field-values/${editingRecord.id}`, payload);
        const updated = normalizeValue(res.data?.data || res.data);
        setValues((prev) => prev.map((v) => (v.id === editingRecord.id ? updated : v)));
        message.success("Field value updated");
      } else {
        const res = await api.post("/item-field-values/create", payload);
        const created = normalizeValue(res.data?.data || res.data);
        setValues((prev) => [...prev, created]);
        message.success("Field value created");
      }

      setFormOpen(false);
    } catch (err) {
      message.error(err?.response?.data?.message || "Failed to save field value");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await api.delete(`/item-field-values/${deleteTarget.id}`);
      setValues((prev) => prev.filter((v) => v.id !== deleteTarget.id));
      message.success("Field value deleted");
      setDeleteTarget(null);
    } catch (err) {
      message.error(err?.response?.data?.message || "Failed to delete field value");
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    { title: "Item", dataIndex: "itemId", key: "itemId", render: (v) => getItemLabel(v) },
    { title: "Field", dataIndex: "productFieldId", key: "productFieldId", render: (v) => getFieldLabel(v) },
    { title: "Value", dataIndex: "value", key: "value", ellipsis: true },
    { title: "Created At", dataIndex: "createdAt", key: "createdAt", render: (v) => formatDate(v) },
  ];

  const deleteLabel = deleteTarget
    ? `${getFieldLabel(deleteTarget.productFieldId)} = "${deleteTarget.value}"`
    : "";

  return (
    <div style={{ background: "#fff", border: "1px solid #F1F5F9", borderRadius: 5, overflow: "hidden" }}>
      <div style={{ padding: "20px 20px 0" }}>
        <MasterHeader
          title="Manage Item Field Values"
          description="Values captured for each item at its scanned fields"
          buttonLabel="Add Field Value"
          onAddClick={openAddModal}
        />
      </div>

      <MasterToolbar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by item, field or value..."
        statusValue="All"
        onStatusChange={() => {}}
        statusOptions={[{ value: "All", label: "All" }]}
      />

      <MasterTable
        columns={columns}
        data={filteredData}
        loading={loading}
        onView={openViewModal}
        onEdit={openEditModal}
        onDelete={setDeleteTarget}
      />

      <MasterFormModal
        open={formOpen}
        title={editingRecord ? "Edit Field Value" : "Add Field Value"}
        onCancel={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        confirmLoading={saving}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="itemId" label="Item" rules={[{ required: true, message: "Please select an item" }]}>
            <Select
              placeholder="Select item"
              options={items.map((i) => ({ value: i.id, label: getItemLabel(i.id) }))}
              showSearch
              optionFilterProp="label"
              notFoundContent={items.length === 0 ? "Items failed to load — check console" : "No data"}
            />
          </Form.Item>
          <Form.Item name="productFieldId" label="Field" rules={[{ required: true, message: "Please select a field" }]}>
            <Select
              placeholder="Select field"
              options={productFields.map((f) => ({ value: f.id, label: f.name }))}
              showSearch
              optionFilterProp="label"
              notFoundContent={productFields.length === 0 ? "Fields failed to load — check console" : "No data"}
            />
          </Form.Item>
          <Form.Item
            name="value"
            label="Value"
            rules={[{ required: true, message: "Please enter a value" }, { max: 255, message: "Max 255 characters" }]}
          >
            <Input placeholder="e.g. PGEL2407A0562" maxLength={255} />
          </Form.Item>
        </Form>
      </MasterFormModal>

      <DeleteModal
        open={!!deleteTarget}
        itemName={deleteLabel}
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />

      <Modal open={!!viewRecord || viewLoading} onCancel={() => setViewRecord(null)} footer={null} centered width={400} confirmLoading={viewLoading}>
        {viewRecord && (
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", marginBottom: 16 }}>Field Value Details</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, color: "#64748B", display: "flex", alignItems: "center", gap: 6 }}>
                  <Boxes size={14} /> Item
                </span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{getItemLabel(viewRecord.itemId)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, color: "#64748B", display: "flex", alignItems: "center", gap: 6 }}>
                  <ListChecks size={14} /> Field
                </span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{getFieldLabel(viewRecord.productFieldId)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, color: "#64748B" }}>Value</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{viewRecord.value}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, color: "#64748B", display: "flex", alignItems: "center", gap: 6 }}>
                  <CalendarClock size={14} /> Created At
                </span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{formatDate(viewRecord.createdAt)}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ManageItemField;
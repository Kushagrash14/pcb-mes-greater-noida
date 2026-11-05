import { useState, useEffect } from "react";
import { Form, Select, Modal, Tag, message } from "antd";
import { CalendarClock, Package, Workflow } from "lucide-react";

import MasterHeader from "./components/MasterHeader";
import MasterToolbar from "./components/MasterToolbar";
import MasterTable from "./components/MasterTable";
import DeleteModal from "./components/DeleteModal";
import MasterFormModal from "./components/MasterFormModal";

import api from "../../../services/API/api";

// items table: id, product_id, current_stage_id, status (enum), created_at
// Routes (app.use("/api/items", itemsRoutes)):
//   POST   /api/items/create
//   GET    /api/items/all
//   GET    /api/items/:id
//   PUT    /api/items/:id
//   DELETE /api/items/:id
// Lookups: GET /api/products/all , GET /api/stages/all

const statusConfig = {
  IN_PROGRESS: { color: "processing", label: "In Progress" },
  COMPLETED: { color: "success", label: "Completed" },
  HOLD: { color: "warning", label: "Hold" },
  REJECTED: { color: "error", label: "Rejected" },
};

const statusOptions = [
  { value: "All", label: "All Status" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "HOLD", label: "Hold" },
  { value: "REJECTED", label: "Rejected" },
];

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const normalizeItem = (item) => ({
  id: item.id,
  productId: item.product_id,
  currentStageId: item.current_stage_id,
  status: item.status || "IN_PROGRESS",
  createdAt: item.created_at,
});

const ManageItems = () => {
  const [items, setItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [formOpen, setFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [viewRecord, setViewRecord] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

  const getProductName = (id) => {
    const product = products.find((p) => p.id === id);
    return product ? product.name : id ? `Product #${id}` : "-";
  };

  const getStageName = (id) => {
    const stage = stages.find((s) => s.id === id);
    return stage ? stage.name : id ? `Stage #${id}` : "-";
  };

  // ---------------- direct API calls ----------------

  const fetchAll = async () => {
    try {
      setLoading(true);

      const [itemsRes, productsRes, stagesRes] = await Promise.all([
        api.get("/items/all"),
        api.get("/products/all"),
        api.get("/stages/all"),
      ]);

      const itemList = itemsRes.data?.items || itemsRes.data?.data || itemsRes.data || [];
      const productList = productsRes.data?.products || productsRes.data?.data || productsRes.data || [];
      const stageList = stagesRes.data?.stages || stagesRes.data?.data || stagesRes.data || [];

      setItems(itemList.map(normalizeItem));
      setProducts(
        productList.map((p) => ({ id: p.id, name: p.name || p.product_name || p.title || `Product #${p.id}` }))
      );
      setStages(stageList.map((s) => ({ id: s.id, name: s.name || s.stage_name || `Stage #${s.id}` })));
    } catch (err) {
      message.error(err?.response?.data?.message || "Failed to load items");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const filteredData = items.filter((item) => {
    const productName = getProductName(item.productId).toLowerCase();
    const stageName = getStageName(item.currentStageId).toLowerCase();
    const matchesSearch =
      productName.includes(search.toLowerCase()) || stageName.includes(search.toLowerCase());
    const matchesStatus = statusFilter === "All" || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const openAddModal = () => {
    setEditingRecord(null);
    form.resetFields();
    form.setFieldsValue({ status: "IN_PROGRESS" });
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
      const res = await api.get(`/items/${record.id}`);
      setViewRecord(normalizeItem(res.data?.data || res.data));
    } catch (err) {
      message.error(err?.response?.data?.message || "Failed to load item");
    } finally {
      setViewLoading(false);
    }
  };

  const handleSubmit = async () => {
    let values;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }

    const payload = {
      product_id: values.productId,
      current_stage_id: values.currentStageId ?? null,
      status: values.status,
    };

    try {
      setSaving(true);

      if (editingRecord) {
        const res = await api.put(`/items/${editingRecord.id}`, payload);
        const updated = normalizeItem(res.data?.data || res.data);
        setItems((prev) => prev.map((item) => (item.id === editingRecord.id ? updated : item)));
        message.success("Item updated");
      } else {
        const res = await api.post("/items/create", payload);
        const created = normalizeItem(res.data?.data || res.data);
        setItems((prev) => [...prev, created]);
        message.success("Item created");
      }

      setFormOpen(false);
    } catch (err) {
      message.error(err?.response?.data?.message || "Failed to save item");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await api.delete(`/items/${deleteTarget.id}`);
      setItems((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      message.success("Item deleted");
      setDeleteTarget(null);
    } catch (err) {
      message.error(err?.response?.data?.message || "Failed to delete item");
    } finally {
      setDeleting(false);
    }
  };

  // ---------------- table columns ----------------

  const columns = [
    {
      title: "Product",
      dataIndex: "productId",
      key: "productId",
      render: (v) => getProductName(v),
    },
    {
      title: "Current Stage",
      dataIndex: "currentStageId",
      key: "currentStageId",
      render: (v) => getStageName(v),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (v) => {
        const cfg = statusConfig[v] || { color: "default", label: v };
        return <Tag color={cfg.color} style={{ borderRadius: 20, fontWeight: 600 }}>{cfg.label}</Tag>;
      },
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (v) => formatDate(v),
    },
  ];

  const deleteLabel = deleteTarget
    ? `${getProductName(deleteTarget.productId)} - ${getStageName(deleteTarget.currentStageId)}`
    : "";

  return (
    <div style={{ background: "#fff", border: "1px solid #F1F5F9", borderRadius: 5, overflow: "hidden" }}>
      <div style={{ padding: "20px 20px 0" }}>
        <MasterHeader
          title="Manage Items"
          description="Track PCB items and their current production stage"
          buttonLabel="Add Item"
          onAddClick={openAddModal}
        />
      </div>

      <MasterToolbar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by product or stage..."
        statusValue={statusFilter}
        onStatusChange={setStatusFilter}
        statusOptions={statusOptions}
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
        title={editingRecord ? "Edit Item" : "Add Item"}
        onCancel={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        confirmLoading={saving}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="productId"
            label="Product"
            rules={[{ required: true, message: "Please select a product" }]}
          >
            <Select
              placeholder="Select product"
              options={products.map((p) => ({ value: p.id, label: p.name }))}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>
          <Form.Item name="currentStageId" label="Current Stage">
            <Select
              placeholder="Select stage"
              allowClear
              options={stages.map((s) => ({ value: s.id, label: s.name }))}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>
          <Form.Item name="status" label="Status" rules={[{ required: true, message: "Select status" }]}>
            <Select placeholder="Select status" options={statusOptions.filter((o) => o.value !== "All")} />
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

      <Modal
        open={!!viewRecord || viewLoading}
        onCancel={() => setViewRecord(null)}
        footer={null}
        centered
        width={400}
        confirmLoading={viewLoading}
      >
        {viewRecord && (
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", marginBottom: 16 }}>
              Item Details
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, color: "#64748B", display: "flex", alignItems: "center", gap: 6 }}>
                  <Package size={14} /> Product
                </span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>
                  {getProductName(viewRecord.productId)}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, color: "#64748B", display: "flex", alignItems: "center", gap: 6 }}>
                  <Workflow size={14} /> Current Stage
                </span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>
                  {getStageName(viewRecord.currentStageId)}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, color: "#64748B" }}>Status</span>
                <Tag color={(statusConfig[viewRecord.status] || {}).color || "default"}>
                  {(statusConfig[viewRecord.status] || {}).label || viewRecord.status}
                </Tag>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, color: "#64748B", display: "flex", alignItems: "center", gap: 6 }}>
                  <CalendarClock size={14} /> Created At
                </span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>
                  {formatDate(viewRecord.createdAt)}
                </span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ManageItems;
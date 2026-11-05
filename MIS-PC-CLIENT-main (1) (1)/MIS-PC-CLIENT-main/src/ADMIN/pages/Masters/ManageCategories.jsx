import { useState, useEffect } from "react";
import { Form, Input, Select, message } from "antd";

import MasterHeader from "./components/MasterHeader";
import MasterToolbar from "./components/MasterToolbar";
import MasterTable from "./components/MasterTable";
import StatusTag from "./components/StatusTag";
import DeleteModal from "./components/DeleteModal";
import MasterFormModal from "./components/MasterFormModal";

import api from "../../../services/API/api";

const { TextArea } = Input;

// Server sends/expects { name, description } — confirmed against the actual DB schema
// (the "discription" spelling in the route notes was just a typo, not the real column name).
const formatCreatedDate = (dateInput) =>
  new Date(dateInput || Date.now()).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const normalizeCategory = (item) => ({
  id: item._id || item.id,
  categoryName: item.name,
  categoryDescription: item.description,
  status: item.status || (item.is_active === 0 ? "Inactive" : "Active"),
  createdDate: formatCreatedDate(item.created_at || item.createdAt || item.createdDate),
});

const ManageCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [formOpen, setFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await api.get("/categories/all");
      // Confirmed shape: { categories: [...] }. Fallbacks kept in case create/update ever differ.
      const list = res.data?.categories || res.data?.data || res.data || [];
      setCategories(list.map(normalizeCategory));
    } catch (err) {
      message.error(err?.response?.data?.message || "Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  const filteredData = categories.filter((item) => {
    const matchesSearch =
      item?.categoryName?.toLowerCase().includes(search.toLowerCase()) ||
      (item.categoryDescription || "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "All" || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const openAddModal = () => {
    setEditingRecord(null);
    form.resetFields();
    form.setFieldsValue({ status: "Active" });
    setFormOpen(true);
  };

  const openEditModal = (record) => {
    setEditingRecord(record);
    form.setFieldsValue(record);
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
      name: values.categoryName,
      description: values.categoryDescription,
      status: values.status,
    };

    try {
      setSaving(true);
      const res = editingRecord
        ? await api.put(`/categories/update/${editingRecord.id}`, payload)
        : await api.post("/categories/create", payload);

      const saved = normalizeCategory(res.data?.category || res.data?.data || res.data);

      setCategories((prev) =>
        editingRecord
          ? prev.map((item) => (item.id === editingRecord.id ? saved : item))
          : [...prev, saved]
      );
      message.success(editingRecord ? "Category updated" : "Category created");
      setFormOpen(false);
    } catch (err) {
      message.error(err?.response?.data?.message || "Failed to save category");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await api.delete(`/categories/delete/${deleteTarget.id}`);
      setCategories((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      message.success("Category deleted");
      setDeleteTarget(null);
    } catch (err) {
      message.error(err?.response?.data?.message || "Failed to delete category");
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    { title: "Category Name", dataIndex: "categoryName", key: "categoryName" },
    { title: "Category Description", dataIndex: "categoryDescription", key: "categoryDescription", ellipsis: true },
    { title: "Status", dataIndex: "status", key: "status", render: (v) => <StatusTag status={v} /> },
    { title: "Created Date", dataIndex: "createdDate", key: "createdDate" },
  ];

  return (
    <div style={{ background: "#fff", border: "1px solid #F1F5F9", borderRadius: 5, overflow: "hidden" }}>
      <div style={{ padding: "20px 20px 0" }}>
        <MasterHeader
          title="Manage Categories"
          description="Manage production categories used across masters"
          buttonLabel="Add Category"
          onAddClick={openAddModal}
        />
      </div>

      <MasterToolbar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by category name or description..."
        statusValue={statusFilter}
        onStatusChange={setStatusFilter}
      />

      <MasterTable columns={columns} data={filteredData} loading={loading} onEdit={openEditModal} onDelete={setDeleteTarget} />

      <MasterFormModal
        open={formOpen}
        title={editingRecord ? "Edit Category" : "Add Category"}
        onCancel={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        confirmLoading={saving}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="categoryName"
            label="Category Name"
            rules={[{ required: true, message: "Please enter category name" }]}
          >
            <Input placeholder="e.g. PCB Assembly" />
          </Form.Item>
          <Form.Item name="categoryDescription" label="Category Description">
            <TextArea rows={3} placeholder="Short description of the category" />
          </Form.Item>
          <Form.Item name="status" label="Status" rules={[{ required: true, message: "Select status" }]}>
            <Select
              placeholder="Select status"
              options={[
                { value: "Active", label: "Active" },
                { value: "Inactive", label: "Inactive" },
              ]}
            />
          </Form.Item>
        </Form>
      </MasterFormModal>

      <DeleteModal
        open={!!deleteTarget}
        itemName={deleteTarget?.categoryName}
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default ManageCategories;
import { useState } from "react";
import { Form, Input, Select } from "antd";

import MasterHeader from "./components/MasterHeader";
import MasterToolbar from "./components/MasterToolbar";
import MasterTable from "./components/MasterTable";
import StatusTag from "./components/StatusTag";
import DeleteModal from "./components/DeleteModal";
import MasterFormModal from "./components/MasterFormModal";
import { modelsData as initialModels } from "./data/masterData";

const { TextArea } = Input;

const ManageModels = () => {
  const [models, setModels] = useState(initialModels);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [formOpen, setFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const filteredData = models.filter((item) => {
    const matchesSearch =
      item.modelName.toLowerCase().includes(search.toLowerCase()) ||
      item.modelCode.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "All" || item.status === statusFilter;
    return matchesSearch && matchesStatus;
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

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      setTimeout(() => {
        if (editingRecord) {
          setModels((prev) => prev.map((item) => (item.id === editingRecord.id ? { ...item, ...values } : item)));
        } else {
          setModels((prev) => [...prev, { id: Date.now(), ...values }]);
        }
        setSaving(false);
        setFormOpen(false);
      }, 400);
    } catch {
      // validation failed
    }
  };

  const handleDelete = () => {
    setDeleting(true);
    setTimeout(() => {
      setModels((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      setDeleting(false);
      setDeleteTarget(null);
    }, 400);
  };

  const columns = [
    { title: "Model Name", dataIndex: "modelName", key: "modelName" },
    { title: "Model Code", dataIndex: "modelCode", key: "modelCode" },
    { title: "Description", dataIndex: "description", key: "description", ellipsis: true },
    { title: "Status", dataIndex: "status", key: "status", render: (v) => <StatusTag status={v} /> },
  ];

  return (
    <div style={{ background: "#fff", border: "1px solid #F1F5F9", borderRadius:5, overflow: "hidden" }}>
      <div style={{ padding: "20px 20px 0" }}>
        <MasterHeader
          title="Manage Models"
          description="Manage PCB models used across production"
          buttonLabel="Add Model"
          onAddClick={openAddModal}
        />
      </div>

      <MasterToolbar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by model name or code..."
        statusValue={statusFilter}
        onStatusChange={setStatusFilter}
      />

      <MasterTable columns={columns} data={filteredData} onEdit={openEditModal} onDelete={setDeleteTarget} />

      <MasterFormModal
        open={formOpen}
        title={editingRecord ? "Edit Model" : "Add Model"}
        onCancel={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        confirmLoading={saving}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="modelName" label="Model Name" rules={[{ required: true, message: "Please enter model name" }]}>
            <Input placeholder="e.g. AC Indoor Unit - 1.5T" />
          </Form.Item>
          <Form.Item name="modelCode" label="Model Code" rules={[{ required: true, message: "Please enter model code" }]}>
            <Input placeholder="e.g. IDU-15T" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <TextArea rows={3} placeholder="Short description of the model" />
          </Form.Item>
          <Form.Item name="status" label="Status" rules={[{ required: true, message: "Select status" }]}>
            <Select
              placeholder="Select status"
              options={[
                { value: "Active", label: "Active" },
                { value: "Inactive", label: "Inactive" },
                { value: "Draft", label: "Draft" },
              ]}
            />
          </Form.Item>
        </Form>
      </MasterFormModal>

      <DeleteModal
        open={!!deleteTarget}
        itemName={deleteTarget?.modelName}
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default ManageModels;
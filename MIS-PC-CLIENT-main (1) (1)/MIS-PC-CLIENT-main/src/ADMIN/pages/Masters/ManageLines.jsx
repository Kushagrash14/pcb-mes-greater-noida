import { useState } from "react";
import { Form, Input, Select, InputNumber } from "antd";

import MasterHeader from "./components/MasterHeader";
import MasterToolbar from "./components/MasterToolbar";
import MasterTable from "./components/MasterTable";
import StatusTag from "./components/StatusTag";
import DeleteModal from "./components/DeleteModal";
import MasterFormModal from "./components/MasterFormModal";
import { linesData as initialLines, plantOptions } from "./data/masterData";

const ManageLines = () => {
  const [lines, setLines] = useState(initialLines);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [formOpen, setFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const filteredData = lines.filter((item) => {
    const matchesSearch =
      item.lineName.toLowerCase().includes(search.toLowerCase()) ||
      item.lineCode.toLowerCase().includes(search.toLowerCase());
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
          setLines((prev) => prev.map((item) => (item.id === editingRecord.id ? { ...item, ...values } : item)));
        } else {
          setLines((prev) => [...prev, { id: Date.now(), ...values }]);
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
      setLines((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      setDeleting(false);
      setDeleteTarget(null);
    }, 400);
  };

  const columns = [
    { title: "Line Name", dataIndex: "lineName", key: "lineName" },
    { title: "Line Code", dataIndex: "lineCode", key: "lineCode" },
    { title: "Plant", dataIndex: "plant", key: "plant" },
    { title: "Capacity", dataIndex: "capacity", key: "capacity", render: (v) => `${v} PCB/day` },
    { title: "Status", dataIndex: "status", key: "status", render: (v) => <StatusTag status={v} /> },
  ];

  return (
    <div style={{ background: "#fff", border: "1px solid #F1F5F9", borderRadius:5, overflow: "hidden" }}>
      <div style={{ padding: "20px 20px 0" }}>
        <MasterHeader
          title="Manage Lines"
          description="Manage all production lines across plants"
          buttonLabel="Add Line"
          onAddClick={openAddModal}
        />
      </div>

      <MasterToolbar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by line name or code..."
        statusValue={statusFilter}
        onStatusChange={setStatusFilter}
      />

      <MasterTable columns={columns} data={filteredData} onEdit={openEditModal} onDelete={setDeleteTarget} />

      <MasterFormModal
        open={formOpen}
        title={editingRecord ? "Edit Line" : "Add Line"}
        onCancel={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        confirmLoading={saving}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="lineName" label="Line Name" rules={[{ required: true, message: "Please enter line name" }]}>
            <Input placeholder="e.g. SMT Line 1" />
          </Form.Item>
          <Form.Item name="lineCode" label="Line Code" rules={[{ required: true, message: "Please enter line code" }]}>
            <Input placeholder="e.g. SMT-01" />
          </Form.Item>
          <div style={{ display: "flex", gap: 16 }}>
            <Form.Item name="plant" label="Plant" rules={[{ required: true, message: "Select plant" }]} style={{ flex: 1 }}>
              <Select placeholder="Select plant" options={plantOptions.map((p) => ({ value: p, label: p }))} />
            </Form.Item>
            <Form.Item name="capacity" label="Capacity (PCB/day)" rules={[{ required: true, message: "Enter capacity" }]} style={{ flex: 1 }}>
              <InputNumber min={1} style={{ width: "100%" }} placeholder="e.g. 500" />
            </Form.Item>
          </div>
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
        itemName={deleteTarget?.lineName}
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default ManageLines;
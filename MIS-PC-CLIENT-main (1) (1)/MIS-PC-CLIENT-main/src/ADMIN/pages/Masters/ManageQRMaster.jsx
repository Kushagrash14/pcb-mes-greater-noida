import { useState } from "react";
import { Form, Input, Select, InputNumber, Switch } from "antd";

import MasterHeader from "./components/MasterHeader";
import MasterToolbar from "./components/MasterToolbar";
import MasterTable from "./components/MasterTable";
import StatusTag from "./components/StatusTag";
import DeleteModal from "./components/DeleteModal";
import MasterFormModal from "./components/MasterFormModal";
import { qrMasterData as initialQR } from "./data/masterData";

const ManageQRMaster = () => {
  const [qrList, setQrList] = useState(initialQR);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [formOpen, setFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const filteredData = qrList.filter((item) => {
    const matchesSearch = item.qrPrefix.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "All" || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const openAddModal = () => {
    setEditingRecord(null);
    form.resetFields();
    form.setFieldsValue({ autoGenerate: true });
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
          setQrList((prev) => prev.map((item) => (item.id === editingRecord.id ? { ...item, ...values } : item)));
        } else {
          setQrList((prev) => [...prev, { id: Date.now(), ...values }]);
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
      setQrList((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      setDeleting(false);
      setDeleteTarget(null);
    }, 400);
  };

  const columns = [
    { title: "QR Prefix", dataIndex: "qrPrefix", key: "qrPrefix" },
    { title: "QR Length", dataIndex: "qrLength", key: "qrLength" },
    { title: "QR Format", dataIndex: "qrFormat", key: "qrFormat", ellipsis: true },
    {
      title: "Auto Generate",
      dataIndex: "autoGenerate",
      key: "autoGenerate",
      render: (v) => (
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            padding: "3px 10px",
            borderRadius: 20,
            background: v ? "#EFF6FF" : "#F1F5F9",
            color: v ? "#2563EB" : "#64748B",
          }}
        >
          {v ? "Auto" : "Manual"}
        </span>
      ),
    },
    { title: "Status", dataIndex: "status", key: "status", render: (v) => <StatusTag status={v} /> },
  ];

  return (
    <div style={{ background: "#fff", border: "1px solid #F1F5F9", borderRadius: 5, overflow: "hidden" }}>
      <div style={{ padding: "20px 20px 0" }}>
        <MasterHeader
          title="QR Master"
          description="Configure QR code generation rules"
          buttonLabel="Add QR Setting"
          onAddClick={openAddModal}
        />
      </div>

      <MasterToolbar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by QR prefix..."
        statusValue={statusFilter}
        onStatusChange={setStatusFilter}
      />

      <MasterTable columns={columns} data={filteredData} onEdit={openEditModal} onDelete={setDeleteTarget} />

      <MasterFormModal
        open={formOpen}
        title={editingRecord ? "Edit QR Setting" : "Add QR Setting"}
        onCancel={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        confirmLoading={saving}
      >
        <Form form={form} layout="vertical">
          <div style={{ display: "flex", gap: 16 }}>
            <Form.Item name="qrPrefix" label="QR Prefix" rules={[{ required: true, message: "Please enter QR prefix" }]} style={{ flex: 1 }}>
              <Input placeholder="e.g. PGEL" />
            </Form.Item>
            <Form.Item name="qrLength" label="QR Length" rules={[{ required: true, message: "Enter QR length" }]} style={{ flex: 1 }}>
              <InputNumber min={1} style={{ width: "100%" }} placeholder="e.g. 22" />
            </Form.Item>
          </div>
          <Form.Item name="qrFormat" label="QR Format" rules={[{ required: true, message: "Please enter QR format" }]}>
            <Input placeholder="e.g. SAP10+MM2+YY2+WW2+SER6" />
          </Form.Item>
          <Form.Item name="autoGenerate" label="Auto Generate" valuePropName="checked">
            <Switch />
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
        itemName={deleteTarget?.qrPrefix}
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default ManageQRMaster;
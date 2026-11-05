import { useState, useEffect } from "react";
import { Form, Input, Switch, Row, Col, Tag, message } from "antd";

import MasterHeader from "../../Masters/components/MasterHeader";
import MasterToolbar from "../../Masters/components/MasterToolbar";
import MasterTable from "../../Masters/components/MasterTable";
import DeleteModal from "../../Masters/components/DeleteModal";
import MasterFormModal from "../../Masters/components/MasterFormModal";

import api from "../../../../services/API/api";

const { TextArea } = Input;

const formatCreatedDate = (dateInput) =>
  new Date(dateInput || Date.now()).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const normalizeFactory = (item) => ({
  id: item.id,
  name: item.name,
  code: item.code,
  address: item.address || "-",
  description: item.description || "-",
  isActive: item.is_active === undefined || item.is_active === null ? true : !!item.is_active,
  createdDate: formatCreatedDate(item.created_at || item.createdAt),
});

const ManageFactory = () => {
  const [factories, setFactories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadFactories();
  }, []);

  const loadFactories = async () => {
    try {
      setLoading(true);
      const res = await api.get("/factories/all");
      const list = res.data?.data || res.data || [];
      setFactories(list.map(normalizeFactory));
    } catch (err) {
      message.error(err?.response?.data?.message || "Failed to load factories");
    } finally {
      setLoading(false);
    }
  };

  const filteredData = factories.filter((item) => {
    const query = search.toLowerCase();
    return (
      item.name.toLowerCase().includes(query) ||
      item.code.toLowerCase().includes(query) ||
      item.address.toLowerCase().includes(query)
    );
  });

  const openAddModal = () => {
    setEditingRecord(null);
    form.resetFields();
    form.setFieldsValue({ isActive: true });
    setFormOpen(true);
  };

  const openEditModal = (record) => {
    setEditingRecord(record);
    form.setFieldsValue({
      name: record.name,
      address: record.address === "-" ? undefined : record.address,
      description: record.description === "-" ? undefined : record.description,
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
      name: values.name,
      address: values.address,
      description: values.description,
      is_active: values.isActive,
    };

    try {
      setSaving(true);
      if (editingRecord) {
        await api.put(`/factories/update/${editingRecord.id}`, payload);
      } else {
        await api.post("/factories/create", payload);
      }

      // Create/update controllers only return id/message — refetch the list.
      await loadFactories();
      message.success(editingRecord ? "Factory updated" : "Factory added");
      setFormOpen(false);
    } catch (err) {
      message.error(err?.response?.data?.message || "Failed to save factory");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await api.delete(`/factories/delete/${deleteTarget.id}`);
      setFactories((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      message.success("Factory removed");
      setDeleteTarget(null);
    } catch (err) {
      // e.g. 409 when production lines still reference this factory
      message.error(err?.response?.data?.message || "Failed to delete factory");
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "Code", dataIndex: "code", key: "code" },
    { title: "Address", dataIndex: "address", key: "address" },
    { title: "Description", dataIndex: "description", key: "description" },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      render: (v) => <Tag color={v ? "green" : "default"}>{v ? "Active" : "Inactive"}</Tag>,
    },
    { title: "Created Date", dataIndex: "createdDate", key: "createdDate" },
  ];

  return (
    <div style={{ background: "#fff", border: "1px solid #F1F5F9", borderRadius: 16, overflow: "hidden" }}>
      <div style={{ padding: "20px 20px 0" }}>
        <MasterHeader
          title="Manage Factory"
          description="Manage factory locations"
          buttonLabel="Add Factory"
          onAddClick={openAddModal}
        />
      </div>

      <MasterToolbar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name, code or address..."
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
        title={editingRecord ? "Edit Factory" : "Add Factory"}
        onCancel={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        confirmLoading={saving}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Factory Name"
                rules={[{ required: true, message: "Please enter factory name" }]}
                style={{ marginBottom: 16 }}
              >
                <Input placeholder="e.g. Supa Plant" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="address" label="Address" style={{ marginBottom: 16 }}>
                <Input placeholder="Optional address" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="description" label="Description" style={{ marginBottom: 0 }}>
                <TextArea rows={3} placeholder="Optional description" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="isActive"
                label="Active"
                valuePropName="checked"
                initialValue={true}
                style={{ marginBottom: 16 }}
              >
                <Switch checkedChildren="Yes" unCheckedChildren="No" />
              </Form.Item>
            </Col>
          </Row>


        </Form>
      </MasterFormModal>

      <DeleteModal
        open={!!deleteTarget}
        itemName={deleteTarget ? `${deleteTarget.name} (${deleteTarget.code})` : ""}
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default ManageFactory;
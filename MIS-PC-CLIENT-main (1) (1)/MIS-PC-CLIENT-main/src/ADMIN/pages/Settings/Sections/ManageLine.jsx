import { useState, useEffect } from "react";
import { Form, Select, Input, Switch, Row, Col, Tag, message } from "antd";

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

const normalizeLine = (item, factoryOptions = []) => ({
  id: item.id,
  factoryId: item.factory_id,
  factoryName: item.factory_name || factoryOptions.find((f) => f.value === item.factory_id)?.label || "-",
  name: item.name,
  code: item.code,
  description: item.description || "-",
  isActive: item.is_active === undefined || item.is_active === null ? true : !!item.is_active,
  createdDate: formatCreatedDate(item.created_at || item.createdAt),
});

const ManageLines = () => {
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(true);

  const [factoryOptions, setFactoryOptions] = useState([]);
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

      const [factoriesRes, linesRes] = await Promise.all([
        api.get("/factories/all"),
        api.get("/production-lines/all"),
      ]);

      const factoryList = (factoriesRes.data?.data || factoriesRes.data || []).map((f) => ({
        value: f.id ?? f._id,
        label: f.name,
      }));
      setFactoryOptions(factoryList);

      const lineList = linesRes.data?.data || linesRes.data || [];
      setLines(lineList.map((item) => normalizeLine(item, factoryList)));
    } catch (err) {
      message.error(err?.response?.data?.message || "Failed to load production lines");
    } finally {
      setLoading(false);
      setOptionsLoading(false);
    }
  };

  const filteredData = lines.filter((item) => {
    const query = search.toLowerCase();
    return (
      item.name.toLowerCase().includes(query) ||
      item.code.toLowerCase().includes(query) ||
      item.factoryName.toLowerCase().includes(query)
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
      factoryId: record.factoryId,
      name: record.name,
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
      factory_id: values.factoryId,
      name: values.name,
      description: values.description,
      is_active: values.isActive,
    };

    try {
      setSaving(true);
      if (editingRecord) {
        await api.put(`/production-lines/update/${editingRecord.id}`, payload);
      } else {
        await api.post("/production-lines/create", payload);
      }

      // Create/update controllers only return id/message, not the joined row — refetch.
      await loadInitialData();
      message.success(editingRecord ? "Production line updated" : "Production line added");
      setFormOpen(false);
    } catch (err) {
      message.error(err?.response?.data?.message || "Failed to save production line");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await api.delete(`/production-lines/delete/${deleteTarget.id}`);
      setLines((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      message.success("Production line removed");
      setDeleteTarget(null);
    } catch (err) {
      message.error(err?.response?.data?.message || "Failed to delete production line");
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    { title: "Factory", dataIndex: "factoryName", key: "factoryName" },
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "Code", dataIndex: "code", key: "code" },
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
          title="Production Lines"
          description="Manage production lines under each factory"
          buttonLabel="Add Line"
          onAddClick={openAddModal}
        />
      </div>

      <MasterToolbar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name, code or factory..."
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
        title={editingRecord ? "Edit Production Line" : "Add Production Line"}
        onCancel={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        confirmLoading={saving}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="factoryId"
                label="Factory"
                rules={[{ required: true, message: "Please select a factory" }]}
                style={{ marginBottom: 16 }}
              >
                <Select
                  placeholder="Select factory"
                  options={factoryOptions}
                  loading={optionsLoading}
                  showSearch
                  optionFilterProp="label"
                />
              </Form.Item>
            </Col>
           
            <Col span={12}>
              <Form.Item
                name="name"
                label="Line Name"
                normalize={(value) => value?.toUpperCase()}
                rules={[
                  { required: true, message: "Please enter line name" },
                ]}
                style={{ marginBottom: 16 }}
              >
                <Input placeholder="e.g. ASSEMBLY LINE 1" />
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

export default ManageLines;
import { useState, useEffect, useMemo } from "react";
import { Form, Input, Select, Row, Col, Tag, Button, message } from "antd";
import { Plus } from "lucide-react";

import MasterHeader from "../Masters/components/MasterHeader";
import MasterToolbar from "../Masters/components/MasterToolbar";
import MasterTable from "../Masters/components/MasterTable";
import StatusTag from "../Masters/components/StatusTag";
import DeleteModal from "../Masters/components/DeleteModal";
import MasterFormModal from "../Masters/components/MasterFormModal";

import api from "../../../services/API/api";

const ROLE_OPTIONS = [
  { value: "SYSTEM_ADMIN", label: "System Admin" },
  { value: "ADMIN", label: "Admin" },
  { value: "OPERATOR", label: "Operator" },
];

const ROLE_COLORS = {
  SYSTEM_ADMIN: "purple",
  ADMIN: "blue",
  OPERATOR: "green",
};

const formatCreatedDate = (dateInput) =>
  new Date(dateInput || Date.now()).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

// Server sends/expects { username, password, name, email, role, factory_id, line_id, stage_id, is_active }.
// password is only sent on create — updates go through /change-password/:id separately.
const normalizeUser = (item, factoryOptions = [], lineOptions = [], stageOptions = []) => ({
  id: item._id || item.id,
  username: item.username,
  name: item.name,
  email: item.email,
  role: item.role || "OPERATOR",
  factoryId: item.factory_id ?? null,
  factoryName: item.factory_id
    ? item.factory_name || factoryOptions.find((f) => f.value === item.factory_id)?.label || "-"
    : "\u2014",
  lineId: item.line_id ?? null,
  lineName: item.line_name ?? "",
  productionLineName:
    item.production_line_name ||
    lineOptions.find((l) => l.value === item.line_id)?.label ||
    "—",
  stageId: item.stage_id ?? null,
  stageName: item.stage_id
    ? item.stageName || stageOptions.find((s) => s.value === item.stage_id)?.label || "-"
    : "\u2014",
  status: item.is_active === undefined || item.is_active === null || item.is_active ? "Active" : "Inactive",
  createdDate: formatCreatedDate(item.created_at || item.createdAt || item.createdDate),
});

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [factoryOptions, setFactoryOptions] = useState([]);
  const [allLines, setAllLines] = useState([]); // { value, label, factoryId }
  const [allStages, setAllStages] = useState([]); // { value, label, lineId } — adjust key if stages scope differently
  const [optionsLoading, setOptionsLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [formOpen, setFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const roleValue = Form.useWatch("role", form);
  const factoryValue = Form.useWatch("factoryId", form);
  const lineValue = Form.useWatch("lineId", form);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [passwordTarget, setPasswordTarget] = useState(null);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordForm] = Form.useForm();

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setOptionsLoading(true);

      const [factoriesRes, linesRes, stagesRes, usersRes] = await Promise.all([
        api.get("/factories/all"),
        api.get("/production-lines/all"),
        api.get("/stages/all"),
        api.get("/users/all"),
      ]);

      // console.log("Factories:", factoriesRes.data);
      // console.log("Lines:", linesRes.data);
      console.log("Stages:", stagesRes.data);

      const factoryList = (factoriesRes.data?.data || factoriesRes.data || []).map((f) => ({
        value: f.id ?? f._id,
        label: f.name,
      }));

      setFactoryOptions(factoryList);

      const lineList = (linesRes.data?.data || linesRes.data || []).map((l) => ({
        value: l.id ?? l._id,
        label: l.name,
        factoryId: l.factory_id,
      }));
      setAllLines(lineList);

      const stageList = (stagesRes.data || []).map((s) => ({
        value: s._id || s.id,
        label: s.name,
        lineId: s.line_id, // remove if stages aren't scoped to a line
      }));

      setAllStages(stageList);

      const userList = usersRes.data?.data || usersRes.data || [];
      setUsers(userList.map((u) => normalizeUser(u, factoryList, lineList, stageList)));
    } catch (err) {
      message.error(err?.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
      setOptionsLoading(false);
    }
  };

  const filteredData = users.filter((item) => {
    const query = search.toLowerCase();
    const matchesSearch =
      item.username.toLowerCase().includes(query) ||
      item.name.toLowerCase().includes(query) ||
      (item.email || "").toLowerCase().includes(query) ||
      item.role.toLowerCase().includes(query);
    const matchesStatus = statusFilter === "All" || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  console.log("Line value:", lineValue, "Stage value:", Form.useWatch("stageId", form));
  // Lines scoped to selected factory; stages scoped to selected line.
  const lineOptionsForForm = allLines.filter((l) => l.factoryId === factoryValue);
  const stageOptionsForForm = allStages.filter((s) => s.lineId === lineValue);

  const openAddModal = (preset = {}) => {
    setEditingRecord(null);
    form.resetFields();
    form.setFieldsValue({
      role: "OPERATOR",
      status: "Active",
      ...(preset.factoryId ? { factoryId: preset.factoryId } : {}),
      ...(preset.lineId ? { lineId: preset.lineId } : {}),
    });
    setFormOpen(true);
  };

  const openEditModal = (record) => {
    setEditingRecord(record);
    form.setFieldsValue({
      username: record.username,
      name: record.name,
      email: record.email,
      role: record.role,
      factoryId: record.factoryId || undefined,
      lineId: record.lineId || undefined,
      lineName: record.lineName || "",
      stageId: record.stageId || undefined,
      status: record.status,
    });
    setFormOpen(true);
  };

  const handleRoleChange = (value) => {
    if (value !== "OPERATOR") {
      form.setFieldsValue({ lineId: undefined, stageId: undefined });
    }
  };

  const handleFactoryChange = () => {
    form.setFieldsValue({ lineId: undefined, stageId: undefined });
  };

  const handleLineChange = () => {
    form.setFieldsValue({ stageId: undefined });
  };

  const handleSubmit = async () => {
    let values;
    try {
      values = await form.validateFields();
    } catch {
      return; // validation failed, stay in modal
    }

    const payload = {
      username: values.username,
      name: values.name,
      email: values.email,
      role: values.role,
      factory_id: values.factoryId || null,
      line_id: values.role === "OPERATOR" ? values.lineId || null : null,
      line_name: values.lineName?.trim() || null,
      stage_id: values.role === "OPERATOR" ? values.stageId || null : null,
      is_active: values.status === "Active",
    };
    if (!editingRecord) {
      payload.password = values.password;
    }

    try {
      setSaving(true);
      if (editingRecord) {
        await api.put(`/users/update/${editingRecord.id}`, payload);
      } else {
        await api.post("/users/create", payload);
      }

      // create/update controllers only return id/message — refetch for joined names
      await loadInitialData();
      message.success(editingRecord ? "User updated" : "User created");
      setFormOpen(false);
    } catch (err) {
      message.error(err?.response?.data?.message || "Failed to save user");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await api.delete(`/users/delete/${deleteTarget.id}`);
      // deleteUser is a soft-delete (is_active = 0), not a real delete — refetch instead of filtering out
      await loadInitialData();
      message.success("User deactivated");
      setDeleteTarget(null);
    } catch (err) {
      message.error(err?.response?.data?.message || "Failed to delete user");
    } finally {
      setDeleting(false);
    }
  };

  const openPasswordModal = (record) => {
    setPasswordTarget(record);
    passwordForm.resetFields();
    setPasswordOpen(true);
  };

  const handlePasswordSubmit = async () => {
    let values;
    try {
      values = await passwordForm.validateFields();
    } catch {
      return;
    }

    try {
      setPasswordSaving(true);
      await api.put(`/users/change-password/${passwordTarget.id}`, {
        password: values.newPassword,
      });
      message.success("Password updated");
      setPasswordOpen(false);
    } catch (err) {
      message.error(err?.response?.data?.message || "Failed to change password");
    } finally {
      setPasswordSaving(false);
    }
  };


 
  const lineGroups = useMemo(() => {
    const map = new Map();

    filteredData.forEach((user) => {
      // Group by department ID, not conveyor line name
      const key = user.lineId ?? `no-line-${user.factoryId ?? "none"}`;

      if (!map.has(key)) {
        map.set(key, {
          id: key,
          lineId: user.lineId,
          lineName: user.lineId
            ? user.productionLineName || "Unknown Department"
            : "No Line / Admin",
          factoryId: user.factoryId,
          factoryName: user.factoryName,
          users: [],
        });
      }

      map.get(key).users.push(user);
    });

    return Array.from(map.values());
  }, [filteredData]);


  const lineColumns = [
    { title: "Line", dataIndex: "lineName", key: "lineName" },
    { title: "Factory", dataIndex: "factoryName", key: "factoryName" },
    { title: "Users", key: "userCount", render: (_, r) => r.users.length },
    {
      title: "Active / Inactive",
      key: "statusSummary",
      render: (_, r) => {
        const active = r.users.filter((u) => u.status === "Active").length;
        return `${active} Active / ${r.users.length - active} Inactive`;
      },
    },
  ];

// Line dropped from here — redundant once grouped; Stage kept since it's more specific.
const userColumns = [
  { title: "Username", dataIndex: "username", key: "username" },
  { title: "Name", dataIndex: "name", key: "name" },
  { title: "Email", dataIndex: "email", key: "email", ellipsis: true },
  { title: "Role", dataIndex: "role", key: "role", render: (v) => <Tag color={ROLE_COLORS[v] || "default"}>{v}</Tag> },
  { title: "Line No.", dataIndex: "lineName", key: "lineName", render: (value) => value || "—",},
  { title: "Stage", dataIndex: "stageName", key: "stageName" },
  { title: "Status", dataIndex: "status", key: "status", render: (v) => <StatusTag status={v} /> },
  { title: "Created Date", dataIndex: "createdDate", key: "createdDate" },
  {
    title: "Password",
    key: "password",
    render: (_, record) => (
      <Button type="link" style={{ padding: 0 }} onClick={() => openPasswordModal(record)}>
        Change
      </Button>
    ),
  },
];


  return (
    <div style={{ background: "#fff", border: "1px solid #F1F5F9", borderRadius: 16, overflow: "hidden" }}>
      <div style={{ padding: "20px 20px 0" }}>
        <MasterHeader
          title="Manage Users"
          description="Manage system users and their access roles"
          buttonLabel="Add User"
          onAddClick={openAddModal}
        />
      </div>

      <MasterToolbar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by username, name, email or role..."
        statusValue={statusFilter}
        onStatusChange={setStatusFilter}
      />

      <MasterTable
        columns={lineColumns}
        data={lineGroups}
        loading={loading}
        rowKey="id"
        expandable={{
          expandedRowRender: (record) => (
            <div style={{ padding: "4px 0 8px" }}>
              {record.lineId && (
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
                  <Button
                    type="dashed"
                    icon={<Plus size={14} />}
                    onClick={() => openAddModal({ factoryId: record.factoryId, lineId: record.lineId })}
                  >
                    Add User
                  </Button>
                </div>
              )}
              <MasterTable
                columns={userColumns}
                data={record.users}
                rowKey="id"
                onEdit={openEditModal}
                onDelete={setDeleteTarget}
              />
            </div>
          ),
        }}
      />

      <MasterFormModal
        open={formOpen}
        title={editingRecord ? "Edit User" : "Add User"}
        onCancel={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        confirmLoading={saving}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="username"
                label="Username"
                rules={[{ required: true, message: "Please enter username" }]}
                style={{ marginBottom: 16 }}
              >
                <Input placeholder="e.g. jdoe" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Name"
                rules={[{ required: true, message: "Please enter name" }]}
                style={{ marginBottom: 16 }}
              >
                <Input placeholder="e.g. John Doe" />
              </Form.Item>
            </Col>
          </Row>

          {!editingRecord && (
            <Form.Item
              name="password"
              label="Password"
              rules={[
                { required: true, message: "Please enter a password" },
                { min: 4, message: "Password must be at least 4 characters" },
              ]}
              style={{ marginBottom: 16 }}
            >
              <Input.Password placeholder="Enter password" />
            </Form.Item>
          )}

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="email"
                label="Email"
                rules={[{ type: "email", message: "Enter a valid email" }]}
                style={{ marginBottom: 16 }}
              >
                <Input placeholder="e.g. jdoe@company.com" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="role"
                label="Role"
                rules={[{ required: true, message: "Select role" }]}
                style={{ marginBottom: 16 }}
              >
                <Select placeholder="Select role" options={ROLE_OPTIONS} onChange={handleRoleChange} />
              </Form.Item>
            </Col>
          </Row>

          
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="lineName"
              label="Assigned Line Name"
              rules={[
                {
                  max: 100,
                  message: "Line name cannot exceed 100 characters",
                },
              ]}
              style={{ marginBottom: 16 }}
            >
              <Input placeholder="e.g. Line 1, Line 2, MI Line" />
            </Form.Item>
          </Col>
        </Row>


          <Row gutter={16}>
            <Col span={roleValue === "OPERATOR" ? 8 : 24}>
              <Form.Item
                name="factoryId"
                label="Factory"
                rules={[{ required: true, message: "Select factory" }]}
                style={{ marginBottom: 0 }}
              >
                <Select
                  placeholder="Select factory"
                  options={factoryOptions}
                  loading={optionsLoading}
                  showSearch
                  optionFilterProp="label"
                  onChange={handleFactoryChange}
                />
              </Form.Item>
            </Col>

            {roleValue === "OPERATOR" && (
              <>
                <Col span={8}>
                  <Form.Item
                    name="lineId"
                    label="Line"
                    rules={[{ required: true, message: "Select line" }]}
                    style={{ marginBottom: 0 }}
                  >
                    <Select
                      placeholder={factoryValue ? "Select line" : "Select a factory first"}
                      options={lineOptionsForForm}
                      disabled={!factoryValue}
                      showSearch
                      optionFilterProp="label"
                      onChange={handleLineChange}
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="stageId"
                    label="Stage"
                    rules={[{ required: true, message: "Select stage" }]}
                    style={{ marginBottom: 0 }}
                  >
                    <Select
                      placeholder={lineValue ? "Select stage" : "Select a line first"}
                      options={stageOptionsForForm}
                      disabled={!lineValue}
                      showSearch
                      optionFilterProp="label"
                    />
                  </Form.Item>
                </Col>
              </>
            )}
          </Row>

          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col span={12}>
              <Form.Item
                name="status"
                label="Status"
                rules={[{ required: true, message: "Select status" }]}
                style={{ marginBottom: 0 }}
              >
                <Select
                  placeholder="Select status"
                  options={[
                    { value: "Active", label: "Active" },
                    { value: "Inactive", label: "Inactive" },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </MasterFormModal>

      <MasterFormModal
        open={passwordOpen}
        title={passwordTarget ? `Change Password - ${passwordTarget.username}` : "Change Password"}
        onCancel={() => setPasswordOpen(false)}
        onSubmit={handlePasswordSubmit}
        confirmLoading={passwordSaving}
      >
        <Form form={passwordForm} layout="vertical">
          <Form.Item
            name="newPassword"
            label="New Password"
            rules={[
              { required: true, message: "Please enter a new password" },
              { min: 6, message: "Password must be at least 6 characters" },
            ]}
          >
            <Input.Password placeholder="Enter new password" />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="Confirm Password"
            dependencies={["newPassword"]}
            rules={[
              { required: true, message: "Please confirm the password" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("newPassword") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("Passwords do not match"));
                },
              }),
            ]}
          >
            <Input.Password placeholder="Re-enter new password" />
          </Form.Item>
        </Form>
      </MasterFormModal>

      <DeleteModal
        open={!!deleteTarget}
        itemName={deleteTarget?.username}
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default Users;
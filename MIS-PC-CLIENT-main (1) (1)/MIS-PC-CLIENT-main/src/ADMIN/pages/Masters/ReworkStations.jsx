
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Input,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  message,
} from "antd";
import {
  PlusOutlined,
  ReloadOutlined,
  EditOutlined,
  SearchOutlined,
} from "@ant-design/icons";

import api from "../../../services/API/api";

const { Option } = Select;

const getArray = (response) => {
  const data = response?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

const ReworkStations = () => {
  const [form] = Form.useForm();

  const [stations, setStations] = useState([]);
  const [factories, setFactories] = useState([]);
  const [lines, setLines] = useState([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStation, setEditingStation] = useState(null);

  const [selectedFactory, setSelectedFactory] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [factoryFilter, setFactoryFilter] = useState(null);
  const [lineFilter, setLineFilter] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");

  // --------------------------------------------------
  // LOAD MASTER DATA
  // --------------------------------------------------

  const loadFactoriesAndLines = async () => {
    try {
      const [factoryRes, lineRes] = await Promise.all([
        api.get("/factories/all"),
        api.get("/production-lines/all"),
      ]);

      setFactories(getArray(factoryRes));
      setLines(getArray(lineRes));
    } catch (error) {
      console.error("Master data loading error:", error);
      message.error("Failed to load factories or production lines");
    }
  };

  // --------------------------------------------------
  // LOAD REWORK STATIONS
  // --------------------------------------------------

  const loadStations = async () => {
    try {
      setLoading(true);

      const response = await api.get("/quality/stations");

      const data = response?.data?.data;

      setStations(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Rework stations loading error:", error);
      message.error(
        error?.response?.data?.message || "Failed to load rework stations"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFactoriesAndLines();
    loadStations();
  }, []);

  // --------------------------------------------------
  // FILTER LINES BY FACTORY
  // --------------------------------------------------

  const availableLines = useMemo(() => {
    if (!selectedFactory) return [];

    return lines.filter(
      (line) => String(line.factory_id) === String(selectedFactory)
    );
  }, [lines, selectedFactory]);

  const filterLines = useMemo(() => {
    if (!factoryFilter) return lines;

    return lines.filter(
      (line) => String(line.factory_id) === String(factoryFilter)
    );
  }, [lines, factoryFilter]);

  // --------------------------------------------------
  // MODAL HANDLERS
  // --------------------------------------------------

  const openCreateModal = () => {
    setEditingStation(null);
    setSelectedFactory(null);

    form.resetFields();

    form.setFieldsValue({
      is_active: true,
    });

    setModalOpen(true);
  };

  const openEditModal = (record) => {
    setEditingStation(record);
    setSelectedFactory(record.factory_id);

    form.setFieldsValue({
      factory_id: record.factory_id,
      line_id: record.line_id,
      name: record.name,
      code: record.code,
      description: record.description,
      is_active: Boolean(Number(record.is_active)),
    });

    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingStation(null);
    setSelectedFactory(null);
    form.resetFields();
  };

  // --------------------------------------------------
  // CREATE / UPDATE STATION
  // --------------------------------------------------

  const handleSubmit = async (values) => {
    try {
      setSaving(true);

      const payload = {
        factory_id: values.factory_id,
        line_id: values.line_id,
        name: values.name?.trim(),
        code: values.code?.trim().toUpperCase(),
        description: values.description?.trim() || "",
        is_active: values.is_active ? 1 : 0,
      };

      if (editingStation) {
        await api.put(
          `/quality/stations/${editingStation.id}`,
          payload
        );

        message.success("Rework station updated successfully");
      } else {
        await api.post("/quality/stations", payload);

        message.success("Rework station created successfully");
      }

      closeModal();
      await loadStations();
    } catch (error) {
      console.error("Saving rework station error:", error);

      message.error(
        error?.response?.data?.message ||
          "Failed to save rework station"
      );
    } finally {
      setSaving(false);
    }
  };

  // --------------------------------------------------
  // ACTIVATE / DEACTIVATE
  // --------------------------------------------------

  const handleStatusChange = async (record) => {
    try {
      const nextStatus = Number(record.is_active) === 1 ? 0 : 1;

      await api.patch(
        `/quality/stations/${record.id}/status`,
        {
          is_active: nextStatus,
        }
      );

      message.success(
        nextStatus ? "Station activated" : "Station deactivated"
      );

      await loadStations();
    } catch (error) {
      console.error("Station status update error:", error);

      message.error(
        error?.response?.data?.message ||
          "Failed to update station status"
      );
    }
  };

  // --------------------------------------------------
  // TABLE FILTERING
  // --------------------------------------------------

  const filteredStations = useMemo(() => {
    return stations.filter((station) => {
      const search = searchText.toLowerCase();

      const matchesSearch =
        !search ||
        station.name?.toLowerCase().includes(search) ||
        station.code?.toLowerCase().includes(search) ||
        station.line_name?.toLowerCase().includes(search) ||
        station.factory_name?.toLowerCase().includes(search);

      const matchesFactory =
        !factoryFilter ||
        String(station.factory_id) === String(factoryFilter);

      const matchesLine =
        !lineFilter ||
        String(station.line_id) === String(lineFilter);

      const active = Number(station.is_active) === 1;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && active) ||
        (statusFilter === "inactive" && !active);

      return (
        matchesSearch &&
        matchesFactory &&
        matchesLine &&
        matchesStatus
      );
    });
  }, [
    stations,
    searchText,
    factoryFilter,
    lineFilter,
    statusFilter,
  ]);

  // --------------------------------------------------
  // TABLE COLUMNS
  // --------------------------------------------------

  const columns = [
    {
      title: "Station Name",
      dataIndex: "name",
      key: "name",
      render: (value) => <strong>{value}</strong>,
    },
    {
      title: "Code",
      dataIndex: "code",
      key: "code",
      render: (value) => <Tag color="blue">{value}</Tag>,
    },
    {
      title: "Factory",
      dataIndex: "factory_name",
      key: "factory_name",
    },
    {
      title: "Production Line",
      dataIndex: "line_name",
      key: "line_name",
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: (value) => value || "-",
    },
    {
      title: "Status",
      dataIndex: "is_active",
      key: "is_active",
      render: (value) =>
        Number(value) === 1 ? (
          <Tag color="success">Active</Tag>
        ) : (
          <Tag color="default">Inactive</Tag>
        ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => openEditModal(record)}
          >
            Edit
          </Button>

          <Popconfirm
            title={
              Number(record.is_active) === 1
                ? "Deactivate this station?"
                : "Activate this station?"
            }
            description="Are you sure you want to change this station's status?"
            onConfirm={() => handleStatusChange(record)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              size="small"
              type="link"
              danger={Number(record.is_active) === 1}
            >
              {Number(record.is_active) === 1
                ? "Deactivate"
                : "Activate"}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <div style={{ padding: 20 }}>
      <Card>
        <Row
          justify="space-between"
          align="middle"
          style={{ marginBottom: 20 }}
        >
          <Col>
            <h2 style={{ margin: 0 }}>Rework Stations</h2>
            <span style={{ color: "#888" }}>
              Manage rework stations across factories and production lines
            </span>
          </Col>

          <Col>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={loadStations}
                loading={loading}
              >
                Refresh
              </Button>

              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={openCreateModal}
              >
                Add Rework Station
              </Button>
            </Space>
          </Col>
        </Row>

        <Alert
          message="Station assignment"
          description="Each rework station belongs to a specific factory and production line. Existing assignments cannot be changed while editing."
          type="info"
          showIcon
          style={{ marginBottom: 20 }}
        />

        {/* FILTERS */}

        <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
          <Col xs={24} md={8}>
            <Input
              prefix={<SearchOutlined />}
              placeholder="Search name, code, factory or line"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>

          <Col xs={24} md={5}>
            <Select
              placeholder="Filter by factory"
              allowClear
              showSearch
              optionFilterProp="children"
              style={{ width: "100%" }}
              value={factoryFilter}
              onChange={(value) => {
                setFactoryFilter(value || null);
                setLineFilter(null);
              }}
            >
              {factories.map((factory) => (
                <Option key={factory.id} value={factory.id}>
                  {factory.name}
                </Option>
              ))}
            </Select>
          </Col>

          <Col xs={24} md={5}>
            <Select
              placeholder="Filter by line"
              allowClear
              showSearch
              optionFilterProp="children"
              style={{ width: "100%" }}
              value={lineFilter}
              onChange={(value) => setLineFilter(value || null)}
              disabled={!filterLines.length}
            >
              {filterLines.map((line) => (
                <Option key={line.id} value={line.id}>
                  {line.name}
                </Option>
              ))}
            </Select>
          </Col>

          <Col xs={24} md={4}>
            <Select
              style={{ width: "100%" }}
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { label: "All Status", value: "all" },
                { label: "Active", value: "active" },
                { label: "Inactive", value: "inactive" },
              ]}
            />
          </Col>
        </Row>

        {/* TABLE */}

        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredStations}
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} stations`,
          }}
          scroll={{ x: 1000 }}
          locale={{
            emptyText: "No rework stations found",
          }}
        />
      </Card>

      {/* CREATE / EDIT MODAL */}

      <Modal
        title={
          editingStation
            ? "Edit Rework Station"
            : "Create Rework Station"
        }
        open={modalOpen}
        onCancel={closeModal}
        onOk={() => form.submit()}
        confirmLoading={saving}
        okText={editingStation ? "Update" : "Create"}
        destroyOnHidden
        width={650}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            is_active: true,
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="factory_id"
                label="Factory"
                rules={[
                  { required: true, message: "Please select a factory" },
                ]}
              >
                <Select
                  placeholder="Select factory"
                  showSearch
                  optionFilterProp="children"
                  disabled={Boolean(editingStation)}
                  onChange={(value) => {
                    setSelectedFactory(value);
                    form.setFieldValue("line_id", undefined);
                  }}
                >
                  {factories.map((factory) => (
                    <Option key={factory.id} value={factory.id}>
                      {factory.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="line_id"
                label="Production Line"
                rules={[
                  {
                    required: true,
                    message: "Please select a production line",
                  },
                ]}
              >
                <Select
                  placeholder="Select production line"
                  showSearch
                  optionFilterProp="children"
                  disabled={Boolean(editingStation) || !selectedFactory}
                >
                  {availableLines.map((line) => (
                    <Option key={line.id} value={line.id}>
                      {line.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Station Name"
                rules={[
                  { required: true, message: "Enter station name" },
                  { max: 100, message: "Maximum 100 characters" },
                ]}
              >
                <Input placeholder="Example: Rework Station 01" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="code"
                label="Station Code"
                rules={[
                  { required: true, message: "Enter station code" },
                  { max: 50, message: "Maximum 50 characters" },
                ]}
              >
                <Input
                  placeholder="Example: RW-ST-01"
                  style={{ textTransform: "uppercase" }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="Description"
          >
            <Input.TextArea
              rows={3}
              placeholder="Enter station description"
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Form.Item
            name="is_active"
            label="Station Status"
            valuePropName="checked"
          >
            <Switch
              checkedChildren="Active"
              unCheckedChildren="Inactive"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ReworkStations;

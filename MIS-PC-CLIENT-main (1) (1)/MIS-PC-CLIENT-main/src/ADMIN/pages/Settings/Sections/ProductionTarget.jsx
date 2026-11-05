import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  Form,
  Select,
  DatePicker,
  InputNumber,
  Button,
  Table,
  Space,
  Popconfirm,
  message,
  Typography,
} from "antd";
import { PlusOutlined, DeleteOutlined, EditOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useAuth } from "../../../../Authentication/context/AuthContext";
import api from "../../../../services/API/api";

const { Title } = Typography;

export default function ProductionTarget() {
  const { user } = useAuth();
  const [form] = Form.useForm();

  const [factories, setFactories] = useState([]);
  const [lines, setLines] = useState([]);
  const [products, setProducts] = useState([]);

  const factoryId = Form.useWatch("factory_id", form);
  const lineId = Form.useWatch("line_id", form);
  const filterDate = Form.useWatch("target_date", form);

  const [targets, setTargets] = useState([]);
  const [loadingTargets, setLoadingTargets] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null); // null = creating new

  // ---- initial loads ----
  useEffect(() => {
    api.get("/factories/all").then((res) => setFactories(res?.data?.data || res?.data || []));
  }, []);


  // lines depend on factory (derived from already-fetched parent data, no extra call
  // if your /factories/all response already nests lines — adjust if you have a
  // dedicated /lines?factory_id= endpoint instead)
  useEffect(() => {
    if (!factoryId) {
      setLines([]);
      form.setFieldValue("line_id", undefined);
      return;
    }
    api
      .get(`/production-lines/by-factory/${factoryId}`)
      .then((res) => setLines(res?.data?.data || res?.data || []))
      .catch(() => setLines([]));
    form.setFieldValue("line_id", undefined);
  }, [factoryId, form]);

  useEffect(() => {
    api.get("/products/all").then((res) => setProducts(res?.data?.data || res?.data || []));
  }, []);

  // ---- fetch existing targets whenever factory/line/date filters change ----
  const fetchTargets = useCallback(async () => {
    if (!factoryId || !filterDate) {
      setTargets([]);
      return;
    }
    setLoadingTargets(true);
    try {
      const res = await api.get("/production-targets", {
        params: {
          factory_id: factoryId,
          line_id: lineId || undefined,
          date: filterDate.format("YYYY-MM-DD"),
        },
      });
      setTargets(res?.data?.data || res?.data || []);
    } catch (err) {
      message.error("Failed to load targets");
    } finally {
      setLoadingTargets(false);
    }
  }, [factoryId, lineId, filterDate]);

  useEffect(() => {
    fetchTargets();
  }, [fetchTargets]);

  // ---- create / update ----
  const handleSubmit = async (values) => {
    setSaving(true);
    try {
      const payload = {
        factory_id: values.factory_id,
        line_id: values.line_id,
        product_id: values.product_id,
        target_date: values.target_date.format("YYYY-MM-DD"),
        target_quantity: values.target_quantity,
        created_by: user?.id,
      };

      if (editingId) {
        await api.put(`/production-targets/${editingId}`, payload);
        message.success("Target updated");
      } else {
        // backend should upsert on (factory_id, line_id, product_id, target_date)
        // and return a clear error if one already exists, per your call
        await api.post("/production-targets", payload);
        message.success("Target set");
      }

      form.setFieldsValue({ product_id: undefined, target_quantity: undefined });
      setEditingId(null);
      fetchTargets();
    } catch (err) {
      message.error(err?.response?.data?.message || "Failed to save target");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (record) => {
    setEditingId(record.id);
    form.setFieldsValue({
      factory_id: record.factory_id,
      line_id: record.line_id,
      product_id: record.product_id,
      target_date: dayjs(record.target_date),
      target_quantity: record.target_quantity,
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    form.setFieldsValue({ product_id: undefined, target_quantity: undefined });
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/production-targets/${id}`);
      message.success("Target removed");
      fetchTargets();
    } catch (err) {
      message.error(err?.response?.data?.message || "Failed to delete target");
    }
  };

  const productLabel = (id) => {
    const p = products.find((p) => p.id === id);
    return p ? `${p.erp_no || "—"} — ${p.name}` : id;
  };

  const columns = [
    { title: "Date", dataIndex: "target_date", key: "target_date", width: 110 },
    {
      title: "Product",
      dataIndex: "product_id",
      key: "product_id",
      render: (id) => productLabel(id),
    },
    { title: "Target Qty", dataIndex: "target_quantity", key: "target_quantity", width: 110 },
    {
      title: "",
      key: "actions",
      width: 90,
      render: (_, record) => (
        <Space size={6}>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="Delete this target?"
            onConfirm={() => handleDelete(record.id)}
            okText="Delete"
            okButtonProps={{ danger: true }}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card style={{ border: "1px solid #e3e8ef", borderRadius: 10 }}>
      <Title level={5} style={{ marginBottom: 16 }}>
        Daily Production Targets
      </Title>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{ target_date: dayjs() }}
      >
        <Space size={12} align="start" wrap>
          <Form.Item
            name="factory_id"
            label="Factory"
            rules={[{ required: true, message: "Required" }]}
            style={{ width: 180 }}
          >
            <Select
              placeholder="Select factory"
              options={factories.map((f) => ({ value: f.id, label: f.name }))}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>

          <Form.Item name="line_id" label="Line" style={{ width: 180 }}>
            <Select
              placeholder="Select line"
              disabled={!factoryId}
              options={lines.map((l) => ({ value: l.id, label: l.name }))}
              showSearch
              optionFilterProp="label"
              allowClear
            />
          </Form.Item>

          <Form.Item
            name="product_id"
            label="Product"
            rules={[{ required: true, message: "Required" }]}
            style={{ width: 240 }}
          >
            <Select
              placeholder="Select product"
              options={products.map((p) => ({
                value: p.id,
                label: `${p.erp_no || "—"} — ${p.name}`,
              }))}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>

          <Form.Item
            name="target_date"
            label="Date"
            rules={[{ required: true, message: "Required" }]}
            style={{ width: 150 }}
          >
            <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" />
          </Form.Item>

          <Form.Item
            name="target_quantity"
            label="Target Qty"
            rules={[{ required: true, message: "Required" }]}
            style={{ width: 130 }}
          >
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item label=" ">
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                icon={editingId ? <EditOutlined /> : <PlusOutlined />}
                loading={saving}
              >
                {editingId ? "Update Target" : "Set Target"}
              </Button>
              {editingId && <Button onClick={handleCancelEdit}>Cancel</Button>}
            </Space>
          </Form.Item>
        </Space>
      </Form>

      <Table
        size="small"
        rowKey="id"
        columns={columns}
        dataSource={targets}
        loading={loadingTargets}
        pagination={false}
        locale={{
          emptyText: factoryId && filterDate ? "No targets set for this date" : "Select factory and date to view targets",
        }}
        style={{ marginTop: 12 }}
      />
    </Card>
  );
}
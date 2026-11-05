import React, { useEffect, useMemo, useState } from "react";
import {
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
  Tooltip,
  message,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  QrcodeOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import api from "../../../../services/API/api";
import GenerateProductionQrBatchModal from "../components/Generateproductionqrbatchmodal";
import PendingProductionQrCodesPanel from "../components/Pendingproductionqrcodespanel";

const SEGMENT_TYPES = [
  { value: "STATIC", label: "Fixed Text / Prefix" },
  { value: "PRODUCT_FIELD", label: "Product Field" },
  { value: "DATE", label: "Date Component" },
  { value: "SERIAL", label: "Serial Number" },
];

const PRODUCT_FIELDS = [
  { value: "name", label: "Product Name" },
  { value: "part_code", label: "Part Code" },
  { value: "erp_no", label: "ERP No" },
];

const DATE_PARTS = [
  { value: "YYYY", label: "Year — 4 digit" },
  { value: "YY", label: "Year — 2 digit" },
  { value: "MM", label: "Month" },
  { value: "DD", label: "Day" },
  { value: "WW", label: "Week of year" },
];

const SAMPLE_PRODUCT = {
  name: "IDU 12K",
  part_code: "PAC10220EL00698",
  erp_no: "7020000345",
};

const getISOWeek = (date = new Date()) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;

  d.setUTCDate(d.getUTCDate() + 4 - day);

  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));

  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
};

const getDateValue = (part) => {
  const now = new Date();

  switch (part) {
    case "YYYY":
      return String(now.getFullYear());
    case "YY":
      return String(now.getFullYear()).slice(-2);
    case "MM":
      return String(now.getMonth() + 1).padStart(2, "0");
    case "DD":
      return String(now.getDate()).padStart(2, "0");
    case "WW":
      return String(getISOWeek(now)).padStart(2, "0");
    default:
      return "";
  }
};

const createSegment = (type) => {
  switch (type) {
    case "STATIC":
      return { type: "STATIC", value: "" };

    case "PRODUCT_FIELD":
      return { type: "PRODUCT_FIELD", field: "part_code" };

    case "DATE":
      return { type: "DATE", parts: ["YY"] };

    case "SERIAL":
      return { type: "SERIAL", width: 5 };

    default:
      return null;
  }
};

const buildPreview = (rule, product = SAMPLE_PRODUCT) => {
  if (!Array.isArray(rule)) return "";

  return rule.map((segment) => {
    if (!segment) return "";

    if (segment.type === "STATIC") {
      return segment.value || "";
    }

    if (segment.type === "PRODUCT_FIELD") {
      return product?.[segment.field] || "";
    }

    if (segment.type === "DATE") {
      return (segment.parts || []).map(getDateValue).join("");
    }

    if (segment.type === "SERIAL") {
      return String(1).padStart(Number(segment.width) || 1, "0");
    }

    return "";
  }).join("");
};

const SegmentRow = ({ segment, index, onChange, onRemove }) => {
  const update = (changes) => {
    onChange(index, { ...segment, ...changes });
  };

  return (
    <Card size="small" style={{ marginBottom: 10, borderRadius: 8 }}>
      <Row gutter={12} align="middle">
        <Col flex="35px">
          <Tag>{index + 1}</Tag>
        </Col>

        <Col flex="220px">
          <Select
            value={segment.type}
            style={{ width: "100%" }}
            options={SEGMENT_TYPES}
            onChange={(type) => {
              const next = createSegment(type);
              if (next) onChange(index, next);
            }}
          />
        </Col>

        <Col flex="1">
          {segment.type === "STATIC" && (
            <Input
              placeholder="Enter fixed text / prefix"
              value={segment.value}
              onChange={(e) => update({ value: e.target.value })}
            />
          )}

          {segment.type === "PRODUCT_FIELD" && (
            <Select
              value={segment.field}
              style={{ width: "100%" }}
              options={PRODUCT_FIELDS}
              onChange={(field) => update({ field })}
              placeholder="Select product field"
            />
          )}

          {segment.type === "DATE" && (
            <Select
              mode="multiple"
              value={segment.parts}
              style={{ width: "100%" }}
              options={DATE_PARTS}
              onChange={(parts) => update({ parts })}
              placeholder="Select date components"
            />
          )}

          {segment.type === "SERIAL" && (
            <Space>
              <span>Width</span>

              <Input
                type="number"
                min={1}
                max={5}
                value={segment.width}
                style={{ width: 90 }}
                onChange={(e) => {
                  const value = Number(e.target.value) || 1;

                  update({
                    width: Math.max(1, Math.min(5, value)),
                  });
                }}
              />

              <Tag color="blue">1 → 99,999 / week</Tag>
            </Space>
          )}
        </Col>

        <Col>
          <Button
            danger
            type="text"
            icon={<DeleteOutlined />}
            onClick={() => onRemove(index)}
          />
        </Col>
      </Row>
    </Card>
  );
};

export default function ProductionSerialRuleManager() {
  const [rules, setRules] = useState([]);
  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Generate & Pending/Reprint now live in their own components, same
  // architecture as CustomerQrManager's GenerateQrBatchModal /
  // PendingQrCodesPanel.
  const [genRule, setGenRule] = useState(null);
  const [pendingOpen, setPendingOpen] = useState(false);

  const [form] = Form.useForm();

  const [rule, setRule] = useState([
    { type: "DATE", parts: ["YY", "WW"] },
    { type: "SERIAL", width: 5 },
  ]);

  const [isActive, setIsActive] = useState(true);

  const preview = useMemo(() => buildPreview(rule), [rule]);

  const loadData = async () => {
    try {
      setLoading(true);

      const [ruleRes, productRes] = await Promise.all([
        api.get("/production-serial-rules/all"),
        api.get("/products/all-active-product"),
      ]);

      setRules(ruleRes?.data || []);
      setProducts(productRes?.data?.data || []);
    } catch (error) {
      console.error(error);

      message.error(
        error?.response?.data?.message ||
          "Failed to load production serial rules"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    form.resetFields();

    setRule([
      { type: "DATE", parts: ["YY", "WW"] },
      { type: "SERIAL", width: 5 },
    ]);

    setIsActive(true);
    setModalOpen(true);
  };

  const openEdit = async (record) => {
    try {
      setLoading(true);

      const { data } = await api.get(
        `/production-serial-rules/${record.id}`
      );

      const item = data;

      let parsedRule = item.rule;

      if (typeof parsedRule === "string") {
        parsedRule = JSON.parse(parsedRule);
      }

      form.setFieldsValue({
        product_id: item.product_id,
      });

      setRule(parsedRule || []);
      setIsActive(!!item.is_active);
      setEditingId(item.id);
      setModalOpen(true);
    } catch (error) {
      console.error(error);

      message.error(
        error?.response?.data?.message || "Failed to load rule"
      );
    } finally {
      setLoading(false);
    }
  };

  const addSegment = (type) => {
    const segment = createSegment(type);
    if (!segment) return;

    setRule((prev) => [...prev, segment]);
  };

  const updateSegment = (index, value) => {
    setRule((prev) =>
      prev.map((segment, i) => (i === index ? value : segment))
    );
  };

  const removeSegment = (index) => {
    setRule((prev) => prev.filter((_, i) => i !== index));
  };

  const validateRule = () => {
    if (!rule.length) {
      message.error("Add at least one serial rule segment");
      return false;
    }

    const serials = rule.filter(
      (segment) => segment.type === "SERIAL"
    );

    if (serials.length !== 1) {
      message.error("Exactly one Serial Number segment is required");
      return false;
    }

    for (const segment of rule) {
      if (segment.type === "STATIC" && !String(segment.value || "").trim()) {
        message.error("Fixed Text cannot be empty");
        return false;
      }

      if (segment.type === "PRODUCT_FIELD" && !segment.field) {
        message.error("Select a Product Field");
        return false;
      }

      if (
        segment.type === "DATE" &&
        (!Array.isArray(segment.parts) || !segment.parts.length)
      ) {
        message.error("Select at least one Date Component");
        return false;
      }

      if (segment.type === "SERIAL") {
        const width = Number(segment.width);

        if (!Number.isInteger(width) || width < 1 || width > 5) {
          message.error("Serial width must be between 1 and 5");
          return false;
        }
      }
    }

    return true;
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      if (!validateRule()) return;

      const payload = {
        product_id: values.product_id,
        rule,
        is_active: isActive,
      };

      if (editingId) {
        await api.put(
          `/production-serial-rules/update/${editingId}`,
          payload
        );

        message.success("Production serial rule updated");
      } else {
        await api.post(
          "/production-serial-rules/create",
          payload
        );

        message.success("Production serial rule created");
      }

      setModalOpen(false);
      loadData();
    } catch (error) {
      if (error?.errorFields) return;

      console.error(error);

      message.error(
        error?.response?.data?.message ||
          "Failed to save production serial rule"
      );
    }
  };

  const handleDelete = async (record) => {
    try {
      await api.delete(`/production-serial-rules/delete/${record.id}`);

      message.success("Production serial rule deleted");
      loadData();
    } catch (error) {
      message.error(
        error?.response?.data?.message || "Failed to delete rule"
      );
    }
  };

 const handleToggleActive = async (record) => {
  try {
    await api.patch(`/production-serial-rules/${record.id}`, {
      is_active: !record.is_active,
    });

    message.success(
      `Production serial rule ${record.is_active ? "deactivated" : "activated"}`
    );

    loadData();
  } catch (error) {
    message.error(
      error?.response?.data?.message || "Toggle failed"
    );
  }
};

  const columns = [
    {
      title: "Product",
      dataIndex: "product_name",
      key: "product_name",
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 600 }}>
            {record.product_name}
          </div>

          <div style={{ fontSize: 12, color: "#888" }}>
            {record.part_code}
          </div>
        </div>
      ),
    },

    {
      title: "Rule Preview",
      key: "preview",
      render: (_, record) => {
        let recordRule = record.rule;

        if (typeof recordRule === "string") {
          try {
            recordRule = JSON.parse(recordRule);
          } catch {
            recordRule = [];
          }
        }

        const product = products.find(
          (item) => item.id === record.product_id
        );

        return (
          <code>
            {buildPreview(recordRule, product || SAMPLE_PRODUCT)}
          </code>
        );
      },
    },

    {
      title: "Current Bucket",
      key: "week",
      render: (_, record) =>
        record.current_year ? `${record.current_year}-W${record.current_week}` : "—",
    },

    {
      title: "Next Serial",
      dataIndex: "next_serial",
      key: "next_serial",
      render: (value, record) => {
        let width = 5;

        try {
          const recordRule =
            typeof record.rule === "string"
              ? JSON.parse(record.rule)
              : record.rule;

          const serialSegment = recordRule?.find(
            (segment) => segment.type === "SERIAL"
          );

          width = Number(serialSegment?.width) || 5;
        } catch {
          // Keep default width.
        }

        return (
          <Tag color="blue">
            {String(value || 1).padStart(width, "0")}
          </Tag>
        );
      },
    },

    {
      title: "Active",
      dataIndex: "is_active",
      key: "is_active",
      render: (val, record) => (
        <Switch checked={!!val} onChange={() => handleToggleActive(record)} />
      ),
    },

    {
      title: "Actions",
      key: "action",
      render: (_, record) => (
        <Space>
          <Tooltip title="Generate Product QR">
            <Button
              icon={<QrcodeOutlined />}
              onClick={() => setGenRule(record)}
              disabled={!record.is_active}
              style={{
                    background: "linear-gradient(90deg, #5b5ce2 0%, #0ea5e9 100%)",
                    border: "none",
                    fontWeight: 600,
                    borderRadius: 8,
                    color: "white",
                  }}
            >
              Generate
            </Button>
          </Tooltip>

          <Button icon={<EditOutlined />} onClick={() => openEdit(record)} />

          <Popconfirm
            title="Delete this production serial rule?"
            onConfirm={() => handleDelete(record)}
          >
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="Production Serial Rules"
      extra={
        <Space>
          <Button icon={<ReloadOutlined />} onClick={loadData}>
            Refresh
          </Button>

          <Button icon={<UnorderedListOutlined />} onClick={() => setPendingOpen(true)}>
            Pending QR Codes
          </Button>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openCreate}
            style={{
              background: "linear-gradient(90deg, #5b5ce2 0%, #0ea5e9 100%)",
              border: "none",
              fontWeight: 600,
              borderRadius: 8,
            }}
          >
            Add Serial Rule
          </Button>
        </Space>
      }
    >
      <Table
        rowKey="id"
        columns={columns}
        dataSource={rules}
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        open={modalOpen}
        title={
          editingId
            ? "Edit Production Serial Rule"
            : "Create Production Serial Rule"
        }
        width={850}
        onCancel={() => setModalOpen(false)}
        onOk={handleSave}
        okText="Save Rule"
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="product_id"
            label="Product"
            rules={[{ required: true, message: "Select a product" }]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Select product"
              options={products.map((product) => ({
                value: product.id,
                label: `${product.name}${product.part_code ? ` — ${product.part_code}` : ""}`,
              }))}
            />
          </Form.Item>

          <Card size="small" title="Serial Rule" style={{ marginBottom: 16 }}>
            {rule.map((segment, index) => (
              <SegmentRow
                key={index}
                segment={segment}
                index={index}
                onChange={updateSegment}
                onRemove={removeSegment}
              />
            ))}

            <Space wrap>
              <Button
                icon={<PlusOutlined />}
                onClick={() => addSegment("STATIC")}
              >
                Add Prefix
              </Button>

              <Button
                icon={<PlusOutlined />}
                onClick={() => addSegment("PRODUCT_FIELD")}
              >
                Add Product Field
              </Button>

              <Button
                icon={<PlusOutlined />}
                onClick={() => addSegment("DATE")}
              >
                Add Date
              </Button>

              <Button
                icon={<PlusOutlined />}
                onClick={() => addSegment("SERIAL")}
              >
                Add Serial
              </Button>
            </Space>
          </Card>

          <Card size="small" title="Live Preview">
            <div
              style={{
                padding: "14px 18px",
                background: "#fafafa",
                border: "1px dashed #d9d9d9",
                borderRadius: 6,
                fontFamily: "monospace",
                fontSize: 18,
                wordBreak: "break-all",
              }}
            >
              {preview || "No rule defined"}
            </div>

            <div style={{ marginTop: 8, fontSize: 12, color: "#888" }}>
              Preview uses sample product data and the current date/week.
            </div>
          </Card>

          <div
            style={{
              marginTop: 16,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Switch checked={isActive} onChange={setIsActive} />
            <span>Active</span>

            <Tag color="blue">Weekly sequence: 1 – 99,999</Tag>
          </div>
        </Form>
      </Modal>

      <GenerateProductionQrBatchModal
        open={!!genRule}
        rule={genRule}
        onClose={() => setGenRule(null)}
        onGenerated={loadData}
      />

      <PendingProductionQrCodesPanel open={pendingOpen} onClose={() => setPendingOpen(false)} />
    </Card>
  );
}
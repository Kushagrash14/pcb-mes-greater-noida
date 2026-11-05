import { useState, useEffect, useMemo } from "react";
import { Form, Input, Select, Row, Col, message, Switch, Space, Typography } from "antd";

import MasterHeader from "./components/MasterHeader";
import MasterToolbar from "./components/MasterToolbar";
import MasterTable from "./components/MasterTable";
import StatusTag from "./components/StatusTag";
import DeleteModal from "./components/DeleteModal";
import MasterFormModal from "./components/MasterFormModal";

import api from "../../../services/API/api";

const { TextArea } = Input;
const { Text } = Typography;

const formatCreatedDate = (dateInput) =>
  new Date(dateInput || Date.now()).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

// Server sends/expects { category_id, name, description, remarks, erp_no, part_code }.
// UI/form uses productName / productDescription for readability;
// categoryOptions (fetched live) is used to resolve categoryId -> categoryName for display.
//
// IMPORTANT: category_id from /products/all and value from /categories/all
// can come back as different types (number vs string) depending on the
// driver/serialization on each route, so the match below is done with
// String(...) on both sides rather than strict === — this was the actual
// cause of every row showing "-" for Category.
const normalizeProduct = (item, categoryOptions = []) => ({
  id: item._id || item.id,
  categoryId: item.category_id,
  categoryName:
    item.categoryName ||
    categoryOptions.find((c) => String(c.value) === String(item.category_id))?.label ||
    "Uncategorized",
  productName: item.name,
  productDescription: item.description,
  remarks: item.remarks,
  erpNo: item.erp_no,
  partCode: item.part_code,
  status: item.status || (item.is_active === 0 ? "Inactive" : "Active"),
  createdDate: formatCreatedDate(item.created_at || item.createdAt || item.createdDate),
});

// Number of "real" data columns after S.No — used to merge a category
// group row into a single spanning cell (same pattern as Production Orders).
const DATA_COLUMN_COUNT = 8;
const hideForGroup = () => ({ children: null, props: { colSpan: 0 } });

const ManageProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [categoryOptions, setCategoryOptions] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [formOpen, setFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  // SAP Code entry mode — defaults to manual (false) every time the modal
  // opens, per requirement. Only flips to true if the user explicitly
  // turns it on for this session in the modal.
  const [autoGenerateErp, setAutoGenerateErp] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setCategoriesLoading(true);

      const [categoriesRes, productsRes] = await Promise.all([
        api.get("/categories/all"),
        api.get("/products/admin"),
      ]);

      const categoryList = (categoriesRes?.data?.categories || categoriesRes.data || []).map((cat) => ({
        value: cat?.id,
        label: cat?.name,
      }));
      setCategoryOptions(categoryList);

      const productList = productsRes?.data?.data || productsRes?.data || [];
      setProducts(productList.map((item) => normalizeProduct(item, categoryList)));
    } catch (err) {
      console.log("err in product:", err);
      message.error(err?.response?.data?.message || "Failed to load products");
    } finally {
      setLoading(false);
      setCategoriesLoading(false);
    }
  };

  const filteredData = products.filter((item) => {
    const query = search.toLowerCase();
    const matchesSearch =
      item.categoryName.toLowerCase().includes(query) ||
      item.productName.toLowerCase().includes(query) ||
      (item.productDescription || "").toLowerCase().includes(query) ||
      (item.partCode || "").toLowerCase().includes(query);
    const matchesStatus = statusFilter === "All" || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // ----------------------------------------------------------------
  // Group flat products into category → products, same expand/collapse
  // pattern used on the Production Orders page.
  // ----------------------------------------------------------------
  const groupedData = useMemo(() => {
    const groups = new Map();

    filteredData.forEach((item) => {
      const key = item.categoryId ?? "uncategorized";

      if (!groups.has(key)) {
        groups.set(key, {
          id: `group-${key}`,
          isGroup: true,
          categoryId: item.categoryId,
          categoryName: item.categoryName,
          children: [],
        });
      }

      groups.get(key).children.push(item);
    });

    return Array.from(groups.values());
  }, [filteredData]);

  const openAddModal = () => {
    setEditingRecord(null);
    form.resetFields();
    form.setFieldsValue({ status: "Active" });
    setAutoGenerateErp(false); // default: manual entry
    setFormOpen(true);
  };

  const openEditModal = (record) => {
    setEditingRecord(record);
    form.setFieldsValue({
      categoryId: record.categoryId,
      productName: record.productName,
      productDescription: record.productDescription,
      erpNo: record.erpNo,
      partCode: record.partCode,
      remarks: record.remarks,
      status: record.status,
    });
    setAutoGenerateErp(false); // editing always starts in manual — shows existing erpNo, editable
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
      categoryId: values.categoryId,
      name: values.productName,
      description: values.productDescription,
      remarks: values.remarks,
      status: values.status,
      partCode: values.partCode,
      // When auto-generate is on, omit erpNo and let the backend assign one;
      // when off, send whatever the user typed.
      autoGenerateErp,
      erpNo: autoGenerateErp ? undefined : values.erpNo,
    };

    try {
      setSaving(true);
      const res = editingRecord
        ? await api.put(`/products/update/${editingRecord.id}`, payload)
        : await api.post("/products/create", payload);

      const saved = normalizeProduct(res.data?.data || res.data, categoryOptions);

      setProducts((prev) =>
        editingRecord
          ? prev.map((item) => (item.id === editingRecord.id ? saved : item))
          : [...prev, saved]
      );
      message.success(editingRecord ? "Product updated" : "Product created");
      setFormOpen(false);
    } catch (err) {
      message.error(err?.response?.data?.message || "Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await api.delete(`/products/delete/${deleteTarget.id}`);
      setProducts((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      message.success("Product deleted");
      setDeleteTarget(null);
    } catch (err) {
      message.error(err?.response?.data?.message || "Failed to delete product");
    } finally {
      setDeleting(false);
    }
  };

  // Note: no manual Serial No column here — MasterTable already renders its own S.No column.
  const columns = [
    {
      title: "Category",
      dataIndex: "categoryName",
      key: "categoryName",
      render: (v, r) => {
        if (r.isGroup) {
          return {
            children: (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontWeight: 700, color: "#0F172A", fontSize: 13.5 }}>{r.categoryName}</span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#2563EB",
                    background: "#EFF6FF",
                    borderRadius: 20,
                    padding: "2px 10px",
                  }}
                >
                  {r.children.length} product{r.children.length > 1 ? "s" : ""}
                </span>
              </div>
            ),
            props: { colSpan: DATA_COLUMN_COUNT },
          };
        }
        return v;
      },
    },
    {
      title: "Product Name",
      dataIndex: "productName",
      key: "productName",
      render: (v, r) => (r.isGroup ? hideForGroup() : v),
    },
    {
      title: "SAP Code",
      dataIndex: "erpNo",
      key: "erpNo",
      render: (v, r) => (r.isGroup ? hideForGroup() : v),
    },
    {
      title: "Part Code",
      dataIndex: "partCode",
      key: "partCode",
      render: (v, r) => (r.isGroup ? hideForGroup() : v),
    },
    {
      title: "Description",
      dataIndex: "productDescription",
      key: "productDescription",
      ellipsis: true,
      render: (v, r) => (r.isGroup ? hideForGroup() : v),
    },
    {
      title: "Remarks",
      dataIndex: "remarks",
      key: "remarks",
      ellipsis: true,
      render: (v, r) => (r.isGroup ? hideForGroup() : v),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (v, r) => (r.isGroup ? hideForGroup() : <StatusTag status={v} />),
    },
    {
      title: "Created Date",
      dataIndex: "createdDate",
      key: "createdDate",
      render: (v, r) => (r.isGroup ? hideForGroup() : v),
    },
  ];

  return (
    <div style={{ background: "#fff", border: "1px solid #F1F5F9", borderRadius:5, overflow: "hidden" }}>
      <style>{`
        .mp-group-row > td { background: #FAFBFD !important; cursor: pointer; }
        .mp-group-row:hover > td { background: #F4F6F8 !important; }
      `}</style>

      <div style={{ padding: "20px 20px 0" }}>
        <MasterHeader
          title="Manage Products"
          description="Manage products used across masters"
          buttonLabel="Add Product"
          onAddClick={openAddModal}
        />
      </div>

      <MasterToolbar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by category, product name, description or part code..."
        statusValue={statusFilter}
        onStatusChange={setStatusFilter}
      />

      <MasterTable
        columns={columns}
        data={groupedData}
        loading={loading}
        rowKey="id"
        rowClassName={(record) => (record.isGroup ? "mp-group-row" : "")}
        expandable={{
          defaultExpandAllRows: false,
          indentSize: 18,
        }}
        onEdit={openEditModal}
        onDelete={setDeleteTarget}
      />

      <MasterFormModal
        open={formOpen}
        title={editingRecord ? "Edit Product" : "Add Product"}
        onCancel={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        confirmLoading={saving}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="categoryId"
                label="Category"
                rules={[{ required: true, message: "Please select a category" }]}
                style={{ marginBottom: 16 }}
              >
                <Select
                  placeholder="Select category"
                  options={categoryOptions}
                  loading={categoriesLoading}
                  showSearch
                  optionFilterProp="label"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="productName"
                label="Product Name"
                rules={[{ required: true, message: "Please enter product name" }]}
                style={{ marginBottom: 16 }}
              >
                <Input placeholder="e.g. Outdoor PCB" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 6,
                }}
              >
                <Text style={{ fontSize: 14 }}>SAP Code</Text>
                <Space size={8}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {autoGenerateErp ? "Auto-generate" : "Enter manually"}
                  </Text>
                  <Switch
                    size="small"
                    checked={autoGenerateErp}
                    onChange={(checked) => {
                      setAutoGenerateErp(checked);
                      if (checked) {
                        // clear any manually-typed value and drop its validation,
                        // since the backend will assign one on save
                        form.setFieldsValue({ erpNo: undefined });
                      }
                    }}
                  />
                </Space>
              </div>
              <Form.Item
                name="erpNo"
                rules={
                  autoGenerateErp
                    ? []
                    : [{ required: true, message: "Please enter SAP Code, or switch to auto-generate" }]
                }
                style={{ marginBottom: 16 }}
              >
                <Input
                  placeholder={autoGenerateErp ? "Will be auto-generated on save" : "e.g. PC26080001"}
                  disabled={autoGenerateErp}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="partCode"
                label="Part Code"
                style={{ marginBottom: 16 }}
              >
                <Input placeholder="e.g. 7020000345" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="productDescription" label="Product Description" style={{ marginBottom: 16 }}>
            <TextArea rows={2} placeholder="Short description of the product" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="remarks" label="Remarks" style={{ marginBottom: 0 }}>
                <TextArea rows={2} placeholder="Optional remarks" />
              </Form.Item>
            </Col>
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

      <DeleteModal
        open={!!deleteTarget}
        itemName={deleteTarget?.productName}
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default ManageProducts;
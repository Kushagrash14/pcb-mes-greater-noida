import { useState, useEffect } from "react";
import { Form, Select, Input, Row, Col, Tag, message } from "antd";

import MasterHeader from "../../Masters/components/MasterHeader";
import MasterToolbar from "../../Masters/components/MasterToolbar";
import MasterTable from "../../Masters/components/MasterTable";
import DeleteModal from "../../Masters/components/DeleteModal";
import MasterFormModal from "../../Masters/components/MasterFormModal";

import api from "../../../../services/API/api";

const MAPPING_TYPE_OPTIONS = [
  { value: "IDENTIFIER", label: "Identifier" },
  { value: "RESULT", label: "Result" },
  { value: "ATTRIBUTE", label: "Attribute" },
  { value: "IGNORE", label: "Ignore" },
];

const MAPPING_TYPE_COLOR = {
  IDENTIFIER: "blue",
  RESULT: "green",
  ATTRIBUTE: "purple",
  IGNORE: "default",
};

const formatCreatedDate = (dateInput) =>
  new Date(dateInput || Date.now()).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

// Server (getAll) already joins source_code/source_name/product_name/product_field_name.
const normalizeMapping = (item) => ({
  id: item.id,
  sourceId: item.source_id,
  sourceName: item.source_name || item.source_code || "-",
  productId: item.product_id,
  productName: item.product_name || "-",
  externalField: item.external_field,
  mappingType: item.mapping_type,
  productFieldId: item.product_field_id || null,
  productFieldName: item.product_field_name || "-",
  attributeName: item.attribute_name || "-",
  createdDate: formatCreatedDate(item.created_at || item.createdAt),
});

const ApiSourceMapping = () => {
  const [mappings, setMappings] = useState([]);
  const [loading, setLoading] = useState(true);

  const [sourceOptions, setSourceOptions] = useState([]);
  const [productOptions, setProductOptions] = useState([]);
  const [allProductFields, setAllProductFields] = useState([]); // { value, label, productId }
  const [optionsLoading, setOptionsLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const mappingType = Form.useWatch("mappingType", form);
  const selectedProductId = Form.useWatch("productId", form);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setOptionsLoading(true);

      const [sourcesRes, productsRes, fieldsRes, mappingsRes] = await Promise.all([
        api.get("/external-sources/all"),
        api.get("/products/all"),
        api.get("/product-fields/all"),
        api.get("/external-source-mappings/all"),
      ]);

      setSourceOptions(
        (sourcesRes.data?.data || sourcesRes.data || []).map((s) => ({
          value: s.id ?? s._id,
          label: s.name,
        }))
      );
      setProductOptions(
        (productsRes.data?.data || productsRes.data || []).map((p) => ({
          value: p.id ?? p._id,
          label: p.name,
        }))
      );
      setAllProductFields(
        (fieldsRes.data?.data || fieldsRes.data || []).map((f) => ({
          value: f.id ?? f._id,
          label: f.field_name,
          productId: f.product_id,
        }))
      );

      const mappingList = mappingsRes.data?.data || mappingsRes.data || [];
      setMappings(mappingList.map(normalizeMapping));
    } catch (err) {
      message.error(err?.response?.data?.message || "Failed to load external source mappings");
    } finally {
      setLoading(false);
      setOptionsLoading(false);
    }
  };

  const filteredData = mappings.filter((item) => {
    const query = search.toLowerCase();
    return (
      item.sourceName.toLowerCase().includes(query) ||
      item.productName.toLowerCase().includes(query) ||
      item.externalField.toLowerCase().includes(query) ||
      item.mappingType.toLowerCase().includes(query)
    );
  });

  // Product fields scoped to whatever product is currently selected in the form.
  const productFieldOptions = allProductFields.filter((f) => f.productId === selectedProductId);

  const openAddModal = () => {
    setEditingRecord(null);
    form.resetFields();
    form.setFieldsValue({ mappingType: "IDENTIFIER" });
    setFormOpen(true);
  };

  const openEditModal = (record) => {
    setEditingRecord(record);
    form.setFieldsValue({
      sourceId: record.sourceId,
      productId: record.productId,
      externalField: record.externalField,
      mappingType: record.mappingType,
      productFieldId: record.productFieldId,
      attributeName: record.attributeName === "-" ? undefined : record.attributeName,
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
      source_id: values.sourceId,
      product_id: values.productId,
      external_field: values.externalField,
      mapping_type: values.mappingType,
      product_field_id: values.mappingType === "RESULT" ? values.productFieldId || null : null,
      attribute_name: values.mappingType === "ATTRIBUTE" ? values.attributeName || null : null,
    };

    try {
      setSaving(true);
      if (editingRecord) {
        await api.put(`/external-source-mappings/update/${editingRecord.id}`, payload);
      } else {
        await api.post("/external-source-mappings/create", payload);
      }

      // Create/update controllers don't return the joined row, so just refetch the list.
      await loadInitialData();
      message.success(editingRecord ? "Mapping updated" : "Mapping added");
      setFormOpen(false);
    } catch (err) {
      message.error(err?.response?.data?.message || "Failed to save mapping");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await api.delete(`/external-source-mappings/delete/${deleteTarget.id}`);
      setMappings((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      message.success("Mapping removed");
      setDeleteTarget(null);
    } catch (err) {
      message.error(err?.response?.data?.message || "Failed to delete mapping");
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    { title: "Source", dataIndex: "sourceName", key: "sourceName" },
    { title: "Product", dataIndex: "productName", key: "productName" },
    { title: "External Field", dataIndex: "externalField", key: "externalField" },
    {
      title: "Mapping Type",
      dataIndex: "mappingType",
      key: "mappingType",
      render: (v) => <Tag color={MAPPING_TYPE_COLOR[v] || "default"}>{v}</Tag>,
    },
    { title: "Product Field", dataIndex: "productFieldName", key: "productFieldName" },
    { title: "Attribute Name", dataIndex: "attributeName", key: "attributeName" },
    { title: "Created Date", dataIndex: "createdDate", key: "createdDate" },
  ];

  return (
    <div style={{ background: "#fff", border: "1px solid #F1F5F9", borderRadius: 16, overflow: "hidden" }}>
      <div style={{ padding: "20px 20px 0" }}>
        <MasterHeader
          title="External Source Mappings"
          description="Map external machine fields to product fields / attributes"
          buttonLabel="Add Mapping"
          onAddClick={openAddModal}
        />
      </div>

      <MasterToolbar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by source, product, field or mapping type..."
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
        title={editingRecord ? "Edit Mapping" : "Add Mapping"}
        onCancel={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        confirmLoading={saving}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="sourceId"
                label="External Source"
                rules={[{ required: true, message: "Please select a source" }]}
                style={{ marginBottom: 16 }}
              >
                <Select
                  placeholder="Select source"
                  options={sourceOptions}
                  loading={optionsLoading}
                  showSearch
                  optionFilterProp="label"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="productId"
                label="Product"
                rules={[{ required: true, message: "Please select a product" }]}
                style={{ marginBottom: 16 }}
              >
                <Select
                  placeholder="Select product"
                  options={productOptions}
                  loading={optionsLoading}
                  showSearch
                  optionFilterProp="label"
                  onChange={() => form.setFieldsValue({ productFieldId: undefined })}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="externalField"
                label="External Field"
                rules={[{ required: true, message: "Please enter the external field name" }]}
                style={{ marginBottom: 16 }}
              >
                <Input placeholder="e.g. barcode_result" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="mappingType"
                label="Mapping Type"
                rules={[{ required: true, message: "Please select mapping type" }]}
                initialValue="IDENTIFIER"
                style={{ marginBottom: 16 }}
              >
                <Select options={MAPPING_TYPE_OPTIONS} />
              </Form.Item>
            </Col>
          </Row>

          {mappingType === "RESULT" && (
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="productFieldId"
                  label="Product Field"
                  rules={[{ required: true, message: "Please select a product field" }]}
                  style={{ marginBottom: 0 }}
                >
                  <Select
                    placeholder={selectedProductId ? "Select product field" : "Select a product first"}
                    options={productFieldOptions}
                    disabled={!selectedProductId}
                    showSearch
                    optionFilterProp="label"
                  />
                </Form.Item>
              </Col>
            </Row>
          )}

          {mappingType === "ATTRIBUTE" && (
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="attributeName"
                  label="Attribute Name"
                  rules={[{ required: true, message: "Please enter the attribute name" }]}
                  style={{ marginBottom: 0 }}
                >
                  <Input placeholder="e.g. machine_serial" />
                </Form.Item>
              </Col>
            </Row>
          )}
        </Form>
      </MasterFormModal>

      <DeleteModal
        open={!!deleteTarget}
        itemName={deleteTarget ? `${deleteTarget.sourceName} → ${deleteTarget.externalField}` : ""}
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default ApiSourceMapping;
import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Form, Input, InputNumber, Select, Switch, message, Tag, Popconfirm, Button, Space } from "antd";
import { EditOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import api from "../../../../services/API/api";
import MasterHeader from "../../Masters/components/MasterHeader";
import MasterToolbar from "../../Masters/components/MasterToolbar";
import MasterTable from "../../Masters/components/MasterTable";
import MasterFormModal from "../../Masters/components/MasterFormModal";

// Assumption: printer_type is a fixed set. Swap for a free-text Input if your
// installs actually vary — this is guessed from common label-printer setups.
const PRINTER_TYPES = ["LABEL", "THERMAL", "LASER", "INKJET"];

export default function PrinterManager() {
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [search, setSearch] = useState("");

  const { data: printers = [], isLoading } = useQuery({
    queryKey: ["printers"],
    queryFn: async () => (await api.get("/printers")).data,
  });


  const saveMutation = useMutation({
    mutationFn: async (values) => {
      if (editingRecord) {
        return api.put(`/printers/${editingRecord.id}`, values);
      }
      return api.post("/printers", values);
    },
    onSuccess: () => {
      message.success(editingRecord ? "Printer updated" : "Printer created");
      queryClient.invalidateQueries({ queryKey: ["printers"] });
      closeModal();
    },
    onError: (err) => {
      message.error(err?.response?.data?.message || "Save failed");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => api.delete(`/printers/${id}`),
    onSuccess: () => {
      message.success("Printer deleted");
      queryClient.invalidateQueries({ queryKey: ["printers"] });
    },
    onError: (err) => {
      message.error(err?.response?.data?.message || "Delete failed");
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }) => api.patch(`/printers/${id}`, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["printers"] });
    },
    onError: () => message.error("Failed to toggle status"),
  });

  const openCreateModal = () => {
    setEditingRecord(null);
    form.resetFields();
    form.setFieldsValue({ is_active: true, port: 9100 });
    setModalOpen(true);
  };

  const openEditModal = (record) => {
    setEditingRecord(record);
    form.setFieldsValue({
      name: record.name,
      printer_type: record.printer_type,
      ip_address: record.ip_address,
      port: record.port,
      printer_name: record.printer_name,
      is_active: !!record.is_active,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingRecord(null);
    form.resetFields();
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    saveMutation.mutate(values);
  };

  const filteredPrinters = useMemo(() => {
    if (!search) return printers;
    const q = search.toLowerCase();
    return printers.filter((p) =>
      [p.name, p.printer_name, p.ip_address, p.printer_type]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(q))
    );
  }, [printers, search]);

  const columns = [
    { title: "Name", dataIndex: "name" },
    { title: "Printer Name", dataIndex: "printer_name" },
    {
      title: "Type",
      dataIndex: "printer_type",
      render: (v) => <Tag color="geekblue">{v}</Tag>,
    },
    { title: "IP Address", dataIndex: "ip_address" },
    { title: "Port", dataIndex: "port" },
    {
      title: "Active",
      dataIndex: "is_active",
      render: (val, record) => (
        <Switch
          checked={!!val}
          onChange={(checked) =>
            toggleActiveMutation.mutate({ id: record.id, is_active: checked })
          }
        />
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEditModal(record)} />
          <Popconfirm title="Delete this printer?" onConfirm={() => deleteMutation.mutate(record.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <MasterHeader title="Printers" subtitle="Manage network printers used across packaging & scan stages" />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <MasterToolbar
            onSearch={setSearch}
            searchPlaceholder="Search name, IP, type..."
          />
        </div>
        <Button 
        type="primary" 
        icon={<PlusOutlined />} 
        onClick={openCreateModal}
        style={{
          background: "linear-gradient(90deg, #5b5ce2 0%, #0ea5e9 100%)",
          border: "none",
          fontWeight: 600,
          borderRadius: 8,
          color: "white"
        }}
        >
          New Printer
        </Button>
      </div>
      <MasterTable columns={columns} data={filteredPrinters} loading={isLoading} onView={openEditModal} onEdit={openEditModal} onDelete={deleteMutation.mutate} rowKey="id" />

      <MasterFormModal
        open={modalOpen}
        title={editingRecord ? "Edit Printer" : "New Printer"}
        onCancel={closeModal}
        onSubmit={handleSubmit}
        confirmLoading={saveMutation.isPending}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: "Name is required" }]}
          >
            <Input placeholder="e.g. Line1-Label-Printer" />
          </Form.Item>

          <Form.Item
            name="printer_name"
            label="Printer Name (OS / driver name)"
            rules={[{ required: true, message: "Printer name is required" }]}
          >
            <Input placeholder="e.g. Zebra ZT230" />
          </Form.Item>

          <Form.Item
            name="printer_type"
            label="Type"
            rules={[{ required: true, message: "Printer type is required" }]}
          >
            <Select
              placeholder="Select type"
              options={PRINTER_TYPES.map((t) => ({ label: t, value: t }))}
            />
          </Form.Item>

          <Form.Item
            name="ip_address"
            label="IP Address"
            rules={[
              { required: true, message: "IP address is required" },
              {
                pattern: /^(\d{1,3}\.){3}\d{1,3}$/,
                message: "Enter a valid IPv4 address",
              },
            ]}
          >
            <Input placeholder="e.g. 192.168.1.50" />
          </Form.Item>

          <Form.Item
            name="port"
            label="Port"
            rules={[{ required: true, message: "Port is required" }]}
          >
            <InputNumber min={1} max={65535} style={{ width: "100%" }} placeholder="e.g. 9100" />
          </Form.Item>

          <Form.Item name="is_active" label="Active" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </MasterFormModal>
    </div>
  );
}
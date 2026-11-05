import { useEffect, useState, useCallback } from 'react';
import {
  Table, Button, Modal, Form, Input, InputNumber, Select,
  Switch, Space, Popconfirm, message, Typography, Card,
} from 'antd';
import { PlusOutlined, QrcodeOutlined, EditOutlined, DeleteOutlined, UnorderedListOutlined } from '@ant-design/icons';
import api from "../../../../services/API/api";
import GenerateQrBatchModal from '../components/Generateqrbatchmodal';
import PendingQrCodesPanel from '../components/Pendingqrcodespanel';

const { Text } = Typography;

// Mirrors the backend preview logic so the form updates instantly
// without a round trip while the user is typing.
const buildExample = (partCode, serialWidth) => {
  if (!partCode || !serialWidth) return '—';
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const week = String(
    Math.ceil((((now - new Date(now.getFullYear(), 0, 1)) / 86400000) + 1) / 7)
  ).padStart(2, '0');
  const serial = '1'.padStart(serialWidth, '0');
  return `${partCode}${yy}${week}${serial}`;
};

export default function CustomerQrManager() {
  const [rules,       setRules]       = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [modalOpen,   setModalOpen]   = useState(false);
  const [editingId,   setEditingId]   = useState(null);
  const [genRule,     setGenRule]     = useState(null); // rule row currently generating a batch for
  const [pendingOpen, setPendingOpen] = useState(false);
  const [form]                        = Form.useForm();
  const [products, setProducts] = useState([])

  const partCode = Form.useWatch('part_code', form);
  const serialWidth = Form.useWatch('serial_width', form);

  const fetchRules = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/customer-serial-rules');
      setRules(data.data);
    } catch {
      message.error('Failed to load customer QR rules');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRules(); }, [fetchRules]);

useEffect(() => {
  const fetchProducts = async () => {
    try {
      const res = await api.get("/products/all-active-product");

      setProducts(res?.data?.data || []);
    } catch (err) {
      console.log("error:", err);
    }
  };

  fetchProducts();
}, []);

  const openCreate = () => {
    setEditingId(null);
    form.resetFields();
    form.setFieldsValue({ serial_width: 5, is_active: true });
    setModalOpen(true);
  };

  const openEdit = (record) => {
    setEditingId(record.id);
    form.setFieldsValue(record);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingId) {
        await api.put(`/customer-serial-rules/${editingId}`, values);
        message.success('Rule updated');
      } else {
        await api.post('/customer-serial-rules', values);
        message.success('Rule created');
      }
      setModalOpen(false);
      fetchRules();
    } catch (err) {
      if (err?.errorFields) return; // form validation error, already shown inline
      message.error(err?.response?.data?.message || 'Save failed');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/customer-serial-rules/${id}`);
      message.success('Rule deleted');
      fetchRules();
    } catch {
      message.error('Delete failed');
    }
  };

  const handleToggleActive = async (id) => {
    try {
      await api.patch(`/customer-serial-rules/${id}/toggle-active`);
      fetchRules();
    } catch {
      message.error('Toggle failed');
    }
  };

  const columns = [
    { title: 'Customer', dataIndex: 'customer_name' },
    { title: 'Product', dataIndex: 'product_name' },
    { title: 'Part Code', dataIndex: 'part_code' },
    { title: 'Width', dataIndex: 'serial_width', width: 80 },
    {
      title: 'Current Bucket',
      render: (_, r) => (r.current_year ? `${r.current_year}-W${r.current_week}` : '—'),
    },
    { title: 'Next Serial', dataIndex: 'next_serial', width: 100 },
    {
      title: 'Active',
      dataIndex: 'is_active',
      render: (val, r) => <Switch checked={!!val} onChange={() => handleToggleActive(r.id)} />,
    },
    {
      title: 'Actions',
      render: (_, r) => (
        <Space>
          <Button 
          icon={<QrcodeOutlined />} 
          onClick={() => setGenRule(r)} 
          disabled={!r.is_active}
          style={{
                    background: "linear-gradient(90deg, #5b5ce2 0%, #0ea5e9 100%)",
                    border: "none",
                    fontWeight: 600,
                    borderRadius: 8,
                    color: "white"
                  }}
          >
            Generate
          </Button>
          <Button icon={<EditOutlined />} onClick={() => openEdit(r)} />
          <Popconfirm title="Delete this rule?" onConfirm={() => handleDelete(r.id)}>
            <Button icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="Customer QR Manager"
      extra={
        <Space>
          <Button icon={<UnorderedListOutlined />} onClick={() => setPendingOpen(true)}>Pending QR Codes</Button>
          <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={openCreate}
          style={{
            background: "linear-gradient(90deg, #5b5ce2 0%, #0ea5e9 100%)",
            border: "none",
            fontWeight: 600,
            borderRadius: 8,
            color: "white"
          }}
          >
            New Rule
          </Button>
        </Space>
      }
    >
      <Table rowKey="id" loading={loading} columns={columns} dataSource={rules} pagination={{ pageSize: 10 }} />

      <Modal
        title={editingId ? 'Edit Customer QR Rule' : 'New Customer QR Rule'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        okText="Save Rule"
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="customer_name" label="Customer Name" rules={[{ required: true }]}>
            <Input placeholder="e.g. Blue Star" />
          </Form.Item>

          <Form.Item name="product_id" label="Product" rules={[{ required: true }]}>
            <Select
              placeholder="Select Product"
              options={products.map((p) => ({ value: p.id, label: p.name }))}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>

          <Form.Item name="part_code" label="R&D Part Code" rules={[{ required: true }]}>
            <Input placeholder="e.g. 2040" />
          </Form.Item>

          <Form.Item
            name="serial_width"
            label="Serial Width"
            rules={[{ required: true }]}
            tooltip="Number of digits in the running serial number"
          >
            <InputNumber min={1} max={10} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="is_active" label="Active" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Card size="small" style={{ background: '#fafafa' }}>
            <Text type="secondary">Example</Text>
            <div style={{ fontFamily: 'monospace', fontSize: 16, marginTop: 4 }}>
              {buildExample(partCode, serialWidth)}
            </div>
          </Card>
        </Form>
      </Modal>

      <GenerateQrBatchModal
        open={!!genRule}
        rule={genRule}
        onClose={() => setGenRule(null)}
        onGenerated={fetchRules}
      />

      <PendingQrCodesPanel open={pendingOpen} onClose={() => setPendingOpen(false)} />
    </Card>
  );
}
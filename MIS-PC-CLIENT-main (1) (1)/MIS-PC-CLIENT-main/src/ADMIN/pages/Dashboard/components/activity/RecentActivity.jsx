import { Table, Tag, Avatar, Tooltip } from "antd";
import { QrCode } from "lucide-react";

import { recentActivityData as defaultData } from "../../dashboardData";

const statusTagColor = { Completed: "success", "In Progress": "processing", Pending: "warning", Rejected: "error" };

const getInitials = (name) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const RecentActivity = ({ data = defaultData }) => {
  const columns = [
    {
      title: "QR Code",
      dataIndex: "qrCode",
      key: "qrCode",
      render: (value) => (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <QrCode size={14} color="#64748B" />
          <span style={{ fontFamily: "monospace", fontSize: 12.5, color: "#0F172A", fontWeight: 600 }}>{value}</span>
        </div>
      ),
    },
    { title: "Model", dataIndex: "model", key: "model" },
    { title: "Current Stage", dataIndex: "stage", key: "stage" },
    { title: "Current Line", dataIndex: "line", key: "line" },
    {
      title: "Operator",
      dataIndex: "operator",
      key: "operator",
      render: (value) => (
        <Tooltip title={value}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Avatar size={24} style={{ background: "#2563EB", fontSize: 11, fontWeight: 600 }}>
              {getInitials(value)}
            </Avatar>
            <span style={{ fontSize: 12.5 }}>{value}</span>
          </div>
        </Tooltip>
      ),
    },
    {
      title: "Time",
      dataIndex: "time",
      key: "time",
      render: (v) => <span style={{ color: "#94A3B8", fontSize: 12 }}>{v}</span>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (value) => <Tag color={statusTagColor[value] || "default"}>{value}</Tag>,
    },
  ];

  return (
    <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 16, padding: 22, boxShadow: "0 1px 2px rgba(15,23,42,0.04)" }}>
      <style>{`
        .ra-table .ant-table-thead > tr > th {
          background: #F8FAFC !important; color: #64748B; font-size: 12px; font-weight: 600;
          text-transform: uppercase; letter-spacing: .3px; border-bottom: 1px solid #F1F5F9;
        }
        .ra-table .ant-table-tbody > tr > td { font-size: 13px; border-bottom: 1px solid #F8FAFC; }
        .ra-table .ant-table-tbody > tr:hover > td { background: #FAFBFC !important; }
      `}</style>
      <div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", marginBottom: 2 }}>Recent Activity</div>
      <div style={{ fontSize: 12.5, color: "#64748B", marginBottom: 16 }}>
        Live feed of PCB movement across the factory
      </div>

      <Table
        className="ra-table"
        columns={columns}
        dataSource={data}
        rowKey="id"
        pagination={{ pageSize: 6, showSizeChanger: false }}
      />
    </div>
  );
};

export default RecentActivity;
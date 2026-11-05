import { Table, Empty } from "antd";
import { Eye, Pencil, Trash2 } from "lucide-react";

const MasterTable = ({
  columns,
  data,
  loading,
  onView,
  onEdit,
  onDelete,
  rowKey = "id",
  expandable,
  rowClassName,
}) => {
  const hasActions = Boolean(onView || onEdit || onDelete);

  const tableColumns = [
    {
      title: "S.No",
      key: "sno",
      width: 64,
      render: (_, __, index) => index + 1,
    },
    ...columns,
    ...(hasActions
      ? [
          {
            title: "Actions",
            key: "actions",
            width: 120,
            render: (_, record) => (
              <div style={{ display: "flex", gap: 8 }}>
                {onView && (
                  <button className="master-action-btn" onClick={() => onView(record)} title="View">
                    <Eye size={15} />
                  </button>
                )}
                {onEdit && (
                  <button className="master-action-btn" onClick={() => onEdit(record)} title="Edit">
                    <Pencil size={15} />
                  </button>
                )}
                {onDelete && (
                  <button className="master-action-btn master-action-danger" onClick={() => onDelete(record)} title="Delete">
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <div>
      <style>{`
        .master-action-btn {
          width: 30px; height: 30px; border-radius: 8px; border: 1px solid #F1F5F9;
          background: #F8FAFC; display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: #64748B; transition: all .15s ease;
        }
        .master-action-btn:hover { background: #F1F5F9; color: #0F172A; }
        .master-action-danger:hover { background: #FEF2F2; color: #DC2626; border-color: #FEE2E2; }
        .simse-master-table .ant-table-thead > tr > th {
          background: #F8FAFC !important; color: #64748B; font-size: 12px; font-weight: 600;
          text-transform: uppercase; letter-spacing: .3px; border-bottom: 1px solid #F1F5F9;
        }
        .simse-master-table .ant-table-tbody > tr > td {
          font-size: 13px; color: #334155; border-bottom: 1px solid #F8FAFC;
        }
        .simse-master-table .ant-table-tbody > tr:hover > td { background: #FAFBFC !important; }
        .simse-master-table .ant-pagination { padding: 0 20px 16px; }
      `}</style>
      <Table
        className="simse-master-table"
        columns={tableColumns}
        dataSource={data}
        loading={loading}
        rowKey={rowKey}
        expandable={expandable}
        rowClassName={rowClassName}
        pagination={{ pageSize: 10, showSizeChanger: false }}
        locale={{ emptyText: <Empty description="No records found" style={{ padding: "40px 0" }} /> }}
      />
    </div>
  );
};

export default MasterTable;
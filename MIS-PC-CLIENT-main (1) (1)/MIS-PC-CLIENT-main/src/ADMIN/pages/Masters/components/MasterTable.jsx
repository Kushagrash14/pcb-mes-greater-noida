import { useState } from "react";
import { Table, Empty, Drawer } from "antd";
import { Eye, Pencil, Trash2, PanelRightOpen } from "lucide-react";

/* Compact master table.
   - No expand/collapse rows any more. If a page still passes
     `expandable.expandedRowRender`, that same content is shown in a
     side drawer, opened from a "Details" action button on the row.
   - Props are unchanged, plus an optional `detailTitle`. */

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
  detailTitle = "Details",
}) => {
  const [page, setPage] = useState({ current: 1, pageSize: 10 });
  const [detailRecord, setDetailRecord] = useState(null);

  const renderDetail = expandable?.expandedRowRender;
  const canShowDetail = (record) =>
    Boolean(renderDetail) &&
    (expandable.rowExpandable ? expandable.rowExpandable(record) : true);

  const hasActions = Boolean(onView || onEdit || onDelete || renderDetail);

  const actionCount =
    [onView, onEdit, onDelete, renderDetail].filter(Boolean).length;

  const tableColumns = [
    {
      title: "#",
      key: "sno",
      width: 48,
      render: (_, __, index) => (page.current - 1) * page.pageSize + index + 1,
    },
    ...columns,
    ...(hasActions
      ? [
          {
            title: "Actions",
            key: "actions",
            width: actionCount * 28 + 20,
            render: (_, record) => (
              <div style={{ display: "flex", gap: 2 }}>
                {canShowDetail(record) && (
                  <button
                    className="master-action-btn"
                    style={{ "--c": "#8B5CF6" }}
                    onClick={() => setDetailRecord(record)}
                    title="Details"
                  >
                    <PanelRightOpen size={14} />
                  </button>
                )}
                {onView && (
                  <button
                    className="master-action-btn"
                    style={{ "--c": "#0891B2" }}
                    onClick={() => onView(record)}
                    title="View"
                  >
                    <Eye size={14} />
                  </button>
                )}
                {onEdit && (
                  <button
                    className="master-action-btn"
                    style={{ "--c": "#F59E0B" }}
                    onClick={() => onEdit(record)}
                    title="Edit"
                  >
                    <Pencil size={14} />
                  </button>
                )}
                {onDelete && (
                  <button
                    className="master-action-btn"
                    style={{ "--c": "#EF4444" }}
                    onClick={() => onDelete(record)}
                    title="Delete"
                  >
                    <Trash2 size={14} />
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
        /* coloured icon buttons, no box until hover */
        .master-action-btn {
          width: 26px; height: 26px; padding: 0;
          border: none; border-radius: 7px; background: transparent;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: var(--c);
          transition: background .15s ease;
        }
        .master-action-btn:hover {
          background: color-mix(in srgb, var(--c) 12%, white);
        }

        /* compact table */
        .simse-master-table .ant-table-thead > tr > th {
          background: #F8FAFC !important; color: #64748B;
          padding: 7px 10px !important;
          font-size: 11px; font-weight: 600;
          text-transform: uppercase; letter-spacing: .4px;
          border-bottom: 1px solid #EEF2F6;
        }
        .simse-master-table .ant-table-tbody > tr > td {
          padding: 5px 10px !important;
          font-size: 12.5px; color: #334155;
          border-bottom: 1px solid #F4F6F9;
        }
        .simse-master-table .ant-table-tbody > tr:hover > td { background: #FAFBFC !important; }
        .simse-master-table .ant-table-tbody > tr:last-child > td { border-bottom: none; }
        .simse-master-table .ant-pagination { margin: 10px 12px !important; font-size: 12px; }
        .simse-master-table .ant-table-placeholder .ant-empty { margin: 14px 0; }
      `}</style>

      <Table
        className="simse-master-table"
        size="small"
        columns={tableColumns}
        dataSource={data}
        loading={loading}
        rowKey={rowKey}
        rowClassName={rowClassName}
        pagination={{
          size: "small",
          pageSize: page.pageSize,
          current: page.current,
          showSizeChanger: false,
          hideOnSinglePage: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
          onChange: (current, pageSize) => setPage({ current, pageSize }),
        }}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="No records found"
              style={{ padding: "10px 0" }}
            />
          ),
        }}
      />

      {/* Row details (replaces expand/collapse) */}
      <Drawer
        open={Boolean(detailRecord)}
        onClose={() => setDetailRecord(null)}
        title={detailTitle}
        width={420}
        destroyOnClose
        styles={{ body: { padding: 14 }, header: { padding: "12px 14px" } }}
      >
        {detailRecord && renderDetail ? renderDetail(detailRecord, 0, 0, true) : null}
      </Drawer>
    </div>
  );
};

export default MasterTable;
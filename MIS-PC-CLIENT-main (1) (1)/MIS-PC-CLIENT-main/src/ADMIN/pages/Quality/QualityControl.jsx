import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Drawer,
  Empty,
  Input,
  Modal,
  Pagination,
  Row,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
  Timeline,
  Typography,
  message,
} from "antd";

import {
  ShieldCheck,
  RefreshCw,
  Search,
  Clock3,
  Wrench,
  ClipboardCheck,
  XCircle,
  Eye,
  CheckCircle2,
  RotateCcw,
  Package,
  Factory,
} from "lucide-react";

import api from "../../../services/API/api";

const { Title, Text } = Typography;
const { TextArea } = Input;

const STATUS_CONFIG = {
  REWORK: {
    label: "Under Rework",
    color: "warning",
  },
  PENDING_QA: {
    label: "Waiting Approval",
    color: "processing",
  },
  REJECTED: {
    label: "Rejected",
    color: "error",
  },
};

const formatDate = (value) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const panelStyle = {
  borderRadius: 14,
  border: "1px solid #E8EDF5",
  boxShadow: "0 2px 8px rgba(15, 23, 42, 0.025)",
};

const QualityControl = () => {
  const [items, setItems] = useState([]);

  const [counts, setCounts] = useState({
    REWORK: 0,
    PENDING_QA: 0,
    REJECTED: 0,
  });

  const [statusFilter, setStatusFilter] = useState(null);
  const [search, setSearch] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  const [loading, setLoading] = useState(false);

  const [selectedItem, setSelectedItem] = useState(null);
  const [details, setDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [actionLoading, setActionLoading] = useState(false);
  const [remarks, setRemarks] = useState("");

  const [actionModal, setActionModal] = useState({
    open: false,
    type: null,
    item: null,
  });

  // --------------------------------------------------
  // FETCH QUALITY QUEUE
  // --------------------------------------------------

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);

      const params = {
        page,
        pageSize,
      };

      if (statusFilter) {
        params.status = statusFilter;
      }

      if (search.trim()) {
        params.search = search.trim();
      }

      const response = await api.get("/quality/items", {
        params,
      });

      const result = response.data?.data;

      setItems(result?.items || []);

      setCounts({
        REWORK: Number(result?.counts?.REWORK || 0),
        PENDING_QA: Number(result?.counts?.PENDING_QA || 0),
        REJECTED: Number(result?.counts?.REJECTED || 0),
      });

      setTotal(Number(result?.pagination?.total || 0));
    } catch (error) {
      message.error(
        error.response?.data?.message ||
          "Unable to load Quality Control records."
      );
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, statusFilter, search]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // --------------------------------------------------
  // KPI FILTER
  // --------------------------------------------------

  const handleStatusFilter = (status) => {
    setStatusFilter((current) =>
      current === status ? null : status
    );

    setPage(1);
  };

  // --------------------------------------------------
  // PRODUCT DETAILS
  // Requires GET /quality/items/:id backend endpoint.
  // --------------------------------------------------

  const openDetails = async (item) => {
    setSelectedItem(item);
    setDetails(null);
    setDetailsLoading(true);

    try {
        const response = await api.get("/serial-history/serial", {
        params: {
            serial: item.serial_no,
        },
        });

        console.log("PRODUCT TRACEABILITY RESPONSE:", response.data);

        if (!response.data?.success) {
        throw new Error("Traceability records not found.");
        }

        setDetails(response.data.data);
    } catch (error) {
        message.error(
        error.response?.data?.message ||
            error.message ||
            "Unable to load product traceability."
        );
    } finally {
        setDetailsLoading(false);
    }
    };

  const closeDetails = () => {
    setSelectedItem(null);
    setDetails(null);
  };

  // --------------------------------------------------
  // APPROVE / SEND BACK
  // --------------------------------------------------

  const openActionModal = (type, item) => {
    setRemarks("");

    setActionModal({
      open: true,
      type,
      item,
    });
  };

  const closeActionModal = () => {
    if (actionLoading) return;

    setActionModal({
      open: false,
      type: null,
      item: null,
    });

    setRemarks("");
  };

  const submitAction = async () => {
    const { type, item } = actionModal;

    if (!item || !type) return;

    if (type === "SEND_BACK" && !remarks.trim()) {
      message.warning("Please enter remarks before sending back.");
      return;
    }

    try {
      setActionLoading(true);

      const endpoint =
        type === "APPROVE"
          ? "/quality/qa/approve"
          : "/quality/qa/send-back";

      await api.post(endpoint, {
        serial_no: item.serial_no,
        remarks: remarks.trim() || undefined,
      });

      message.success(
        type === "APPROVE"
          ? "Product approved successfully."
          : "Product sent back for rework."
      );

      closeActionModal();
      closeDetails();

      await fetchItems();
    } catch (error) {
      message.error(
        error.response?.data?.message ||
          "Unable to process quality action."
      );
    } finally {
      setActionLoading(false);
    }
  };

  // --------------------------------------------------
  // TABLE COLUMNS
  // --------------------------------------------------

  const columns = [
    {
      title: "Serial Number",
      dataIndex: "serial_no",
      key: "serial_no",
      width: 170,
      render: (value) => (
        <Text strong style={{ color: "#1D4ED8" }}>
          {value}
        </Text>
      ),
    },
    {
      title: "Production Order",
      dataIndex: "order_no",
      key: "order_no",
      width: 145,
      render: (value) => value || "-",
    },
    {
      title: "Product",
      dataIndex: "product_name",
      key: "product_name",
      width: 160,
    },
    {
      title: "Factory / Line",
      key: "location",
      width: 180,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text>{record.factory_name || "-"}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.line_name || "-"}
          </Text>
        </Space>
      ),
    },
    {
      title: "Rework Station",
      dataIndex: "rework_station_name",
      key: "rework_station_name",
      width: 140,
      render: (value) => value || "-",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 145,
      render: (value) => (
        <Tag color={STATUS_CONFIG[value]?.color || "default"}>
          {STATUS_CONFIG[value]?.label || value}
        </Tag>
      ),
    },
    {
      title: "Last Updated",
      key: "updated",
      width: 160,
      render: (_, record) =>
        formatDate(
          record.rework_submitted_at ||
            record.rework_started_at ||
            record.rejected_at
        ),
    },
    {
      title: "Action",
      key: "action",
      fixed: "right",
      width: 130,
      render: (_, record) => (
        <Button
          type="link"
          icon={<Eye size={15} />}
          onClick={() => openDetails(record)}
        >
          Inspect
        </Button>
      ),
    },
  ];

  // --------------------------------------------------
  // KPI CARD
  // --------------------------------------------------

  const renderKpi = ({
    status,
    title,
    description,
    value,
    icon: Icon,
    color,
    background,
  }) => {
    const active = statusFilter === status;

    return (
      <Col xs={24} sm={12} lg={8}>
        <Card
          hoverable
          onClick={() => handleStatusFilter(status)}
          style={{
            ...panelStyle,
            cursor: "pointer",
            border: active
              ? `2px solid ${color}`
              : "1px solid #E8EDF5",
            background: active ? background : "#FFFFFF",
            transition: "all .2s ease",
          }}
          bodyStyle={{ padding: 20 }}
        >
          <Space
            align="start"
            style={{
              width: "100%",
              justifyContent: "space-between",
            }}
          >
            <div>
              <Text type="secondary" style={{ fontSize: 13 }}>
                {title}
              </Text>

              <Title
                level={2}
                style={{
                  margin: "8px 0 2px",
                  color,
                }}
              >
                {value}
              </Title>

              <Text type="secondary" style={{ fontSize: 12 }}>
                {description}
              </Text>
            </div>

            <div
              style={{
                padding: 12,
                borderRadius: 12,
                background,
                color,
              }}
            >
              <Icon size={23} />
            </div>
          </Space>

          <div
            style={{
              marginTop: 15,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontSize: 12,
                color: active ? color : "#64748B",
                fontWeight: 600,
              }}
            >
              {active ? "FILTER ACTIVE" : "CLICK TO FILTER"}
            </Text>

            {active && (
              <Text style={{ color, fontSize: 12 }}>
                <CheckCircle2 size={14} />
              </Text>
            )}
          </div>
        </Card>
      </Col>
    );
  };

  // --------------------------------------------------
  // DETAIL DRAWER CONTENT
  // --------------------------------------------------

  const renderDetails = () => {
  if (detailsLoading) {
    return (
      <div style={{ textAlign: "center", padding: 60 }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>Loading product traceability...</div>
      </div>
    );
  }

  if (!details) {
    return <Empty description="Unable to load product details." />;
  }

  // Actual response structure: response.data.data
  const production = details.production || {};
  const orderItems = details.production_orders || [];
  const productions = details.productions || [];
  const scans = details.scan_history || [];
  const stageFlow =
  details.failure_summary?.configured_stage_flow ||
  details.configured_stage_flow ||
  [];

const qualityHistory =
  details.failure_summary?.quality_history ||
  details.quality_history ||
  [];
  const machineTests = details.machine_tests || {};
  const failureSummary = details.failure_summary || {};
  const boxes = details.boxes || [];

  const orderItem =
    orderItems.find(
      (item) => item.serial_no === production.serial_no
    ) || orderItems[0] || {};

  const currentStatus = orderItem.item_status || production.status;

  const successfulScans = scans.filter(
    (scan) => scan.status === "SUCCESS"
  );

  const completedSequences = new Set(
    successfulScans
      .map((scan) => Number(scan.sequence_no))
      .filter(Number.isFinite)
  );

  const completedStages = completedSequences.size;
  const totalStages = stageFlow.length;

  const reworkStarts = qualityHistory.filter(
    (event) => event.action_type === "REWORK_STARTED"
  );

  const reworkSubmissions = qualityHistory.filter(
    (event) => event.action_type === "REWORK_SUBMITTED"
  );

  const qaApprovals = qualityHistory.filter(
    (event) => event.action_type === "QA_APPROVED"
  );

  const qaSendBacks = qualityHistory.filter(
    (event) => event.action_type === "QA_SENT_BACK"
  );

  const rejections = qualityHistory.filter(
    (event) => event.action_type === "REJECTED"
  );

  const statusColor = {
    ACTIVE: "success",
    REWORK: "warning",
    PENDING_QA: "processing",
    REJECTED: "error",
  };

  const eventColor = (action) => {
    if (action === "QA_APPROVED") return "green";
    if (action === "REJECTED") return "red";
    if (action === "QA_SENT_BACK") return "orange";
    if (action === "REWORK_STARTED") return "blue";
    return "gray";
  };

  const machineGroups = [
    {
      label: "ICT",
      records: machineTests.ict || [],
    },
    {
      label: "FCT",
      records: machineTests.fct || [],
    },
  ];

  const SectionTitle = ({ children }) => (
    <Title level={5} style={{ margin: "0 0 14px" }}>
      {children}
    </Title>
  );

  const InfoCard = ({ title, value, color }) => (
    <Card size="small" style={{ borderRadius: 10 }}>
      <Text type="secondary" style={{ fontSize: 12 }}>
        {title}
      </Text>
      <Title
        level={3}
        style={{ margin: "5px 0 0", color: color || "#172554" }}
      >
        {value}
      </Title>
    </Card>
  );

  return (
    <Space direction="vertical" size={18} style={{ width: "100%" }}>

      {/* PRODUCT IDENTITY */}

      <Card
        bordered={false}
        style={{
          background: "#F8FAFC",
          borderRadius: 12,
        }}
      >
        <Space direction="vertical" size={8} style={{ width: "100%" }}>
          <Text type="secondary">PRODUCT SERIAL NUMBER</Text>

          <Title level={3} style={{ margin: 0 }}>
            {production.serial_no || selectedItem?.serial_no || "-"}
          </Title>

          <Space wrap>
            <Tag color={statusColor[currentStatus] || "default"}>
              {currentStatus || "UNKNOWN"}
            </Tag>

            <Tag color="blue">
              {production.product_name || selectedItem?.product_name || "Product"}
            </Tag>
          </Space>
        </Space>
      </Card>

      {/* SUMMARY */}

      <Row gutter={[10, 10]}>
        <Col span={8}>
          <InfoCard
            title="Stations Completed"
            value={completedStages}
            color="#16A34A"
          />
        </Col>

        <Col span={8}>
          <InfoCard
            title="Total Stations"
            value={totalStages}
          />
        </Col>

        <Col span={8}>
          <InfoCard
            title="Rework Cycles"
            value={reworkStarts.length}
            color="#D97706"
          />
        </Col>
      </Row>

      {/* PRODUCTION ORDER */}

      <Card style={panelStyle}>
        <SectionTitle>Production Order Information</SectionTitle>

        <Descriptions column={1} size="small">
          <Descriptions.Item label="Production Order">
            {orderItem.order_no ||
              orderItem.production_order_no ||
              orderItem.production_order_id ||
              "-"}
          </Descriptions.Item>


          <Descriptions.Item label="Product">
            {production.product_name || "-"}
          </Descriptions.Item>

          <Descriptions.Item label="Product Code">
            {production.product_code || "-"}
          </Descriptions.Item>

          <Descriptions.Item label="ERP Product Number">
            {production.product_erp_no || "-"}
          </Descriptions.Item>

          <Descriptions.Item label="Factory">
            {production.factory_name || "-"}
          </Descriptions.Item>

          <Descriptions.Item label="Factory Code">
            {production.factory_code || "-"}
          </Descriptions.Item>

          <Descriptions.Item label="Production Line">
            {production.line_name || "-"}
          </Descriptions.Item>

          <Descriptions.Item label="Line Code">
            {production.line_code || "-"}
          </Descriptions.Item>

          <Descriptions.Item label="Order Item Status">
            <Tag color={statusColor[currentStatus] || "default"}>
              {currentStatus || "-"}
            </Tag>
          </Descriptions.Item>

          <Descriptions.Item label="Production Created">
            {formatDate(production.created_at)}
          </Descriptions.Item>

          <Descriptions.Item label="Production Completed">
            {formatDate(production.completed_at)}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* SERIAL INFORMATION */}

      <Card style={panelStyle}>
        <SectionTitle>Serial Number Information</SectionTitle>

        <Descriptions column={1} size="small">
          <Descriptions.Item label="Serial Number">
            <Text strong>{production.serial_no || "-"}</Text>
          </Descriptions.Item>

          <Descriptions.Item label="Customer QR">
            {details.customer_qr || production.customer_qr_code || "-"}
          </Descriptions.Item>

          <Descriptions.Item label="Current Stage">
            {production.current_stage_name || "-"}
          </Descriptions.Item>


          <Descriptions.Item label="Packed At">
            {formatDate(production.packed_at)}
          </Descriptions.Item>

        </Descriptions>
      </Card>

      {/* PRODUCTION JOURNEY */}

      <Card style={panelStyle}>
        <SectionTitle>
          Production Journey ({completedStages}/{totalStages})
        </SectionTitle>

        <div
          style={{
            height: 8,
            background: "#E2E8F0",
            borderRadius: 10,
            overflow: "hidden",
            marginBottom: 20,
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${
                totalStages
                  ? Math.min(100, (completedStages / totalStages) * 100)
                  : 0
              }%`,
              background: "#16A34A",
              borderRadius: 10,
            }}
          />
        </div>

        {totalStages ? (
          <Timeline
            items={stageFlow.map((stage) => {
              const sequence = Number(stage.sequence_no);

              const matchingScans = successfulScans.filter(
                (scan) => Number(scan.sequence_no) === sequence
              );

              const completed = matchingScans.length > 0;

              return {
                color: completed ? "green" : "gray",
                children: (
                  <div>
                    <Text strong>
                      {`Stage ${sequence}: ${
                        stage.stage_name || `Stage ${sequence}`
                      }`}
                    </Text>

                    <div style={{ marginTop: 4 }}>
                      <Tag color={completed ? "success" : "default"}>
                        {completed ? "COMPLETED" : "NOT COMPLETED"}
                      </Tag>
                    </div>

                    {stage.machine_code && (
                      <div>
                        <Text type="secondary">
                          Machine: {stage.machine_code}
                        </Text>
                      </div>
                    )}

                    {stage.external_machine_type && (
                      <div>
                        <Text type="secondary">
                          Machine Type: {stage.external_machine_type}
                        </Text>
                      </div>
                    )}

                    {matchingScans.map((scan) => (
                      <div
                        key={scan.id}
                        style={{
                          marginTop: 6,
                          padding: 8,
                          background: "#F8FAFC",
                          borderRadius: 6,
                        }}
                      >
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Scanned: {formatDate(scan.created_at || scan.scanned_at)}
                        </Text>

                        <br />

                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Operator:{" "}
                          {scan.operator_name ||
                            scan.username ||
                            scan.performed_by_name ||
                            "-"}
                        </Text>
                      </div>
                    ))}
                  </div>
                ),
              };
            })}
          />
        ) : (
          <Empty description="No configured production stages found." />
        )}
      </Card>

      {/* ACTUAL SCAN HISTORY */}

      <Card style={panelStyle}>
        <SectionTitle>Actual Scan History ({scans.length})</SectionTitle>

        <Table
          rowKey={(record) => record.id}
          size="small"
          pagination={{ pageSize: 5 }}
          dataSource={scans}
          scroll={{ x: 550 }}
          columns={[
            {
              title: "Sequence",
              dataIndex: "sequence_no",
              width: 85,
            },
            {
              title: "Scanned Value",
              dataIndex: "scanned_value",
              width: 160,
            },
            {
              title: "Status",
              dataIndex: "status",
              render: (value) => (
                <Tag color={value === "SUCCESS" ? "success" : "error"}>
                  {value}
                </Tag>
              ),
            },
            {
              title: "Scanned At",
              dataIndex: "created_at",
              render: (value, record) =>
                formatDate(value || record.scanned_at),
            },
          ]}
        />
      </Card>

      {/* QUALITY SUMMARY */}

      <Card style={panelStyle}>
        <SectionTitle>Quality Summary</SectionTitle>

        <Row gutter={[10, 10]}>
          <Col span={12}>
            <InfoCard title="Rework Started" value={reworkStarts.length} color="#D97706" />
          </Col>

          <Col span={12}>
            <InfoCard title="Rework Submitted" value={reworkSubmissions.length} color="#2563EB" />
          </Col>

          <Col span={12}>
            <InfoCard title="QA Approvals" value={qaApprovals.length} color="#16A34A" />
          </Col>

          <Col span={12}>
            <InfoCard title="Sent Back" value={qaSendBacks.length} color="#D97706" />
          </Col>

          <Col span={12}>
            <InfoCard title="Rejections" value={rejections.length} color="#DC2626" />
          </Col>
        </Row>
      </Card>

      {/* REWORK AND QA HISTORY */}

      <Card style={panelStyle}>
        <SectionTitle>Complete Quality Event History</SectionTitle>

        {qualityHistory.length ? (
          <Timeline
            items={qualityHistory.map((event) => ({
              color: eventColor(event.action_type),
              children: (
                <div>
                  <Text strong>
                    {String(event.action_type || "").replaceAll("_", " ")}
                  </Text>

                  <div style={{ marginTop: 4 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {formatDate(event.created_at)}
                    </Text>
                  </div>

                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Performed by:{" "}
                      {event.performed_by_name ||
                        event.performed_by_username ||
                        "-"}
                    </Text>
                  </div>

                  {event.rework_station_name && (
                    <div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Station: {event.rework_station_name}
                      </Text>
                    </div>
                  )}

                  {event.stage_name && (
                    <div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Stage: {event.stage_name}
                      </Text>
                    </div>
                  )}

                  {event.reason && (
                    <div style={{ marginTop: 4 }}>
                      <Text>
                        Remarks: {event.reason}
                      </Text>
                    </div>
                  )}
                </div>
              ),
            }))}
          />
        ) : (
          <Empty description="No quality events recorded." />
        )}
      </Card>

      {/* MACHINE TEST HISTORY */}

      <Card style={panelStyle}>
        <SectionTitle>Machine Test History</SectionTitle>

        <Row gutter={[10, 10]} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <InfoCard
              title="Total Attempts"
              value={machineTests.attempts ?? 0}
            />
          </Col>

          <Col span={8}>
            <InfoCard
              title="ICT Failures"
              value={failureSummary.ict_failures ?? 0}
              color="#DC2626"
            />
          </Col>

          <Col span={8}>
            <InfoCard
              title="FCT Failures"
              value={failureSummary.fct_failures ?? 0}
              color="#DC2626"
            />
          </Col>
        </Row>

        {machineGroups.map((group) => (
          <div key={group.label} style={{ marginBottom: 16 }}>
            <Text strong>{group.label}</Text>

            {group.records.length ? (
              <Table
                rowKey={(record, index) =>
                  record.id || `${group.label}-${index}`
                }
                size="small"
                pagination={false}
                dataSource={group.records}
                columns={[
                  {
                    title: "Result",
                    dataIndex: "status",
                    render: (value) => (
                      <Tag color={value === "PASS" ? "success" : "error"}>
                        {value || "-"}
                      </Tag>
                    ),
                  },
                  {
                    title: "Machine",
                    dataIndex: "machine_name",
                    render: (value) => value || "-",
                  },
                  {
                    title: "Date",
                    dataIndex: "created_at",
                    render: formatDate,
                  },
                ]}
              />
            ) : (
              <Text type="secondary" style={{ fontSize: 12 }}>
                No {group.label} test records.
              </Text>
            )}
          </div>
        ))}
      </Card>

      {/* PACKAGING */}

      <Card style={panelStyle}>
        <SectionTitle>Packaging / Box History</SectionTitle>

        {boxes.length ? (
          <Table
            rowKey={(record, index) => record.id || index}
            size="small"
            pagination={{ pageSize: 5 }}
            dataSource={boxes}
            columns={Object.keys(boxes[0]).map((key) => ({
              title: key.replaceAll("_", " ").toUpperCase(),
              dataIndex: key,
              render: (value) =>
                value && String(key).toLowerCase().includes("at")
                  ? formatDate(value)
                  : value ?? "-",
            }))}
          />
        ) : (
          <Empty description="No packaging records found." />
        )}
      </Card>

      {/* ADMIN ACTIONS */}

      {currentStatus === "PENDING_QA" && (
        <Card
          title="Admin Review"
          style={{
            ...panelStyle,
            borderColor: "#BFDBFE",
          }}
        >
          <Alert
            type="info"
            showIcon
            message="Product waiting for Admin approval"
            description="Review the production and quality history before making a decision."
            style={{ marginBottom: 16 }}
          />

          <Space wrap>
            <Button
              type="primary"
              icon={<CheckCircle2 size={16} />}
              onClick={() =>
                openActionModal("APPROVE", selectedItem)
              }
            >
              Approve
            </Button>

            <Button
              danger
              icon={<RotateCcw size={16} />}
              onClick={() =>
                openActionModal("SEND_BACK", selectedItem)
              }
            >
              Send Back
            </Button>
          </Space>
        </Card>
      )}

      {currentStatus === "REJECTED" && (
        <Alert
          type="error"
          showIcon
          message="Product Rejected"
          description="This product is read-only and cannot return to production."
        />
      )}

      {currentStatus === "REWORK" && (
        <Alert
          type="warning"
          showIcon
          message="Product Under Rework"
          description="Waiting for the operator to complete the rework and submit it for Admin approval."
        />
      )}
    </Space>
  );
};

  // --------------------------------------------------
  // MAIN UI
  // --------------------------------------------------

  return (
    <div
      style={{
        padding: 24,
        minHeight: "100%",
        background: "#F8FAFC",
      }}
    >
      {/* PAGE HEADER */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <Space size={12}>
          <div
            style={{
              background: "#EAF2FF",
              borderRadius: 12,
              padding: 12,
            }}
          >
            <ShieldCheck size={26} color="#2563EB" />
          </div>

          <div>
            <Title level={3} style={{ margin: 0 }}>
              Quality Control
            </Title>

            <Text type="secondary">
              Monitor rework, review submissions and manage rejected products.
            </Text>
          </div>
        </Space>

        <Button
          icon={<RefreshCw size={15} />}
          onClick={fetchItems}
          loading={loading}
        >
          Refresh
        </Button>
      </div>

      {/* KPI CARDS */}

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {renderKpi({
          status: "REWORK",
          title: "Under Rework",
          description: "Products being repaired by operators",
          value: counts.REWORK,
          icon: Wrench,
          color: "#D97706",
          background: "#FFFBEB",
        })}

        {renderKpi({
          status: "PENDING_QA",
          title: "Waiting for Approval",
          description: "Completed rework awaiting Admin review",
          value: counts.PENDING_QA,
          icon: ClipboardCheck,
          color: "#2563EB",
          background: "#EFF6FF",
        })}

        {renderKpi({
          status: "REJECTED",
          title: "Rejected Products",
          description: "Permanently rejected products",
          value: counts.REJECTED,
          icon: XCircle,
          color: "#DC2626",
          background: "#FEF2F2",
        })}
      </Row>

      {/* RECORDS TABLE */}

      <Card style={panelStyle}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
            marginBottom: 20,
          }}
        >
          <div>
            <Title level={5} style={{ margin: 0 }}>
              Quality Records
            </Title>

            <Text type="secondary" style={{ fontSize: 12 }}>
              {statusFilter
                ? STATUS_CONFIG[statusFilter]?.label
                : "All quality records"}
              {" · "}
              {total} records
            </Text>
          </div>

          {statusFilter && (
            <Button
              size="small"
              onClick={() => handleStatusFilter(statusFilter)}
            >
              Clear Status Filter
            </Button>
          )}
        </div>

        <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
          <Col xs={24} md={12} lg={9}>
            <Input
              allowClear
              prefix={<Search size={16} color="#94A3B8" />}
              placeholder="Search serial number, order or product..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              size="large"
            />
          </Col>

          <Col xs={24} md={12} lg={15}>
            <Space wrap>
              <Tag color="default">
                {statusFilter
                  ? STATUS_CONFIG[statusFilter]?.label
                  : "All Statuses"}
              </Tag>

              <Text type="secondary" style={{ fontSize: 12 }}>
                Select a KPI card to filter the records.
              </Text>
            </Space>
          </Col>
        </Row>

        <Table
          rowKey="id"
          columns={columns}
          dataSource={items}
          loading={loading}
          pagination={false}
          scroll={{ x: 1200 }}
          size="middle"
          locale={{
            emptyText: (
              <Empty description="No quality records found." />
            ),
          }}
        />

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginTop: 20,
          }}
        >
          <Pagination
            current={page}
            pageSize={pageSize}
            total={total}
            showSizeChanger
            showTotal={(value) => `${value} records`}
            pageSizeOptions={[10, 20, 50, 100]}
            onChange={(nextPage, nextSize) => {
              setPage(nextPage);
              setPageSize(nextSize);
            }}
          />
        </div>
      </Card>

      {/* PRODUCT DETAIL DRAWER */}

      <Drawer
        title={
          <Space>
            <Package size={18} />
            Product Quality Details
          </Space>
        }
        open={Boolean(selectedItem)}
        onClose={closeDetails}
        width={650}
        destroyOnClose
      >
        {renderDetails()}
      </Drawer>

      {/* APPROVAL / SEND BACK MODAL */}

      <Modal
        title={
          actionModal.type === "APPROVE"
            ? "Approve Rework"
            : "Send Product Back for Rework"
        }
        open={actionModal.open}
        onCancel={closeActionModal}
        onOk={submitAction}
        confirmLoading={actionLoading}
        okText={
          actionModal.type === "APPROVE"
            ? "Confirm Approval"
            : "Send Back"
        }
        okButtonProps={{
          danger: actionModal.type === "SEND_BACK",
        }}
        destroyOnClose
      >
        {actionModal.item && (
          <Space direction="vertical" style={{ width: "100%" }} size={12}>
            <Text>
              Serial Number:{" "}
              <Text strong>{actionModal.item.serial_no}</Text>
            </Text>

            {actionModal.type === "APPROVE" ? (
              <>
                <Alert
                  type="success"
                  showIcon
                  message="Approve this product?"
                  description="The product will return to ACTIVE status and resume its existing production sequence."
                />

                <Text type="secondary">
                  Remarks are optional.
                </Text>
              </>
            ) : (
              <Alert
                type="warning"
                showIcon
                message="Send this product back?"
                description="The product will return to REWORK status. The operator must repair it and submit it again."
              />
            )}

            <Text strong>
              {actionModal.type === "APPROVE"
                ? "Admin Remarks"
                : "Reason for Sending Back"}
            </Text>

            <TextArea
              rows={4}
              maxLength={500}
              showCount
              placeholder={
                actionModal.type === "APPROVE"
                  ? "Enter optional remarks..."
                  : "Explain what needs to be corrected..."
              }
              value={remarks}
              onChange={(event) => setRemarks(event.target.value)}
            />
          </Space>
        )}
      </Modal>
    </div>
  );
};

export default QualityControl;
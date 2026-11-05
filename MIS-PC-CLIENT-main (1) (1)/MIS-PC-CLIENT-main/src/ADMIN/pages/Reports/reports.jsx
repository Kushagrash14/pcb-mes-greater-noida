import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
  message,
  Modal,
  Spin,
  Progress,
  Timeline,
  Divider,
} from "antd";


import {
  ReloadOutlined,
  FilterOutlined,
  ClearOutlined,
  DownloadOutlined,
  EyeOutlined,
} from "@ant-design/icons";


import dayjs from "dayjs";
import api from "../../../services/API/api";

import * as XLSX from "xlsx";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

// Height of your app's top navbar. Set to 0 if the page header is not fixed.
const NAVBAR_HEIGHT = 60;
const PAGE_BG = "#f5f7fa";

const emptyFilters = {
  from: "",
  to: "",
  factoryId: "",
  lineId: "",
  productId: "",
  productionOrderId: "",
};

const Reports = () => {
  const [form] = Form.useForm();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");


  
  const [progressOpen, setProgressOpen] = useState(false);
  const [progressLoading, setProgressLoading] = useState(false);
  const [orderProgress, setOrderProgress] = useState(null);

  const openOrderProgress = async (order) => {
    setProgressOpen(true);
    setProgressLoading(true);
    setOrderProgress(null);

    try {
      const { data } = await api.get(
        `/reports/production-order/${order.production_order_id}/stage-progress`
      );

      if (!data.success) {
        throw new Error(data.message || "Failed to load stage progress");
      }

      setOrderProgress(data.data);
    } catch (err) {
      message.error(
        err.response?.data?.message ||
          err.message ||
          "Unable to load production order progress"
      );
    } finally {
      setProgressLoading(false);
    }
  };


  const [masterData, setMasterData] = useState({
    factories: [],
    lines: [],
    products: [],
    orders: [],
  });

  // Measure the sticky block so the table header can stick right below it
  const stickyRef = useRef(null);
  const [stickyHeight, setStickyHeight] = useState(0);

  const loadMasterData = async () => {
    try {
      const [factoriesRes, linesRes, productsRes, ordersRes] =
        await Promise.allSettled([
          api.get("/factories/all"),
          api.get("/production-lines/all"),
          api.get("/products/all"),
          api.get("/production-orders"),
        ]);

      const getRows = (result) => {
        if (result.status !== "fulfilled") return [];

        const data = result.value.data;

        if (Array.isArray(data)) return data;
        if (Array.isArray(data?.data)) return data.data;
        if (Array.isArray(data?.factories)) return data.factories;
        if (Array.isArray(data?.lines)) return data.lines;
        if (Array.isArray(data?.products)) return data.products;
        if (Array.isArray(data?.productionOrders)) {
          return data.productionOrders;
        }

        return [];
      };

      setMasterData({
        factories: getRows(factoriesRes),
        lines: getRows(linesRes),
        products: getRows(productsRes),
        orders: getRows(ordersRes),
      });
    } catch (err) {
      message.error("Failed to load report filter options");
    }
  };

  const fetchReport = async (filters = {}) => {
    try {
      setLoading(true);
      setError("");

      const params = Object.fromEntries(
        Object.entries(filters).filter(
          ([, value]) => value !== "" && value != null
        )
      );

      const { data } = await api.get("/reports/production-summary", {
        params,
      });

      if (!data.success) {
        throw new Error(data.message || "Failed to load report");
      }

      setReport(data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to fetch production summary"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMasterData();
    fetchReport({});
  }, []);

  const summary = report?.summary;

  useLayoutEffect(() => {
    const el = stickyRef.current;
    if (!el) return;

    const update = () => setStickyHeight(el.offsetHeight);
    update();

    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [summary]);

  const buildFilters = (values) => {
    const range = values.dateRange;

    return {
      ...emptyFilters,
      from: range?.[0]?.format("YYYY-MM-DD") || "",
      to: range?.[1]?.format("YYYY-MM-DD") || "",
      factoryId: values.factoryId ?? "",
      lineId: values.lineId ?? "",
      productId: values.productId ?? "",
      productionOrderId: values.productionOrderId ?? "",
    };
  };

  const toOptions = (rows, labelKeys) =>
    rows
      .map((row) => {
        const value =
          row.id ??
          row.factory_id ??
          row.line_id ??
          row.product_id ??
          row.production_order_id;

        const label = labelKeys
          .map((key) => row[key])
          .find((v) => v != null && v !== "");

        return value == null ? null : { value, label: String(label ?? value) };
      })
      .filter(Boolean);

  const factoryOptions = toOptions(masterData.factories, [
    "name",
    "factory_name",
  ]);
  const lineOptions = toOptions(masterData.lines, ["name", "line_name"]);
  const productOptions = toOptions(masterData.products, [
    "name",
    "product_name",
  ]);
  const orderOptions = toOptions(masterData.orders, ["order_no"]);

  const handleApply = async (values) => {
    await fetchReport(buildFilters(values));
  };

  const handleReset = () => {
    form.resetFields();
    fetchReport({});
  };

  const columns = [
    {
      title: "Order No.",
      dataIndex: "order_no",
      key: "order_no",
      fixed: "left",
      width: 160,
      render: (value, record) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          style={{ padding: 0, fontSize: 12 }}
          onClick={() => openOrderProgress(record)}
        >
          {value}
        </Button>
      ),
    },

    { title: "Factory", dataIndex: "factory_name", key: "factory_name" },
    { title: "Production Line", dataIndex: "line_name", key: "line_name" },
    { title: "Product", dataIndex: "product_name", key: "product_name" },
    { title: "Target", dataIndex: "target_qty", key: "target_qty", align: "right" },
    { title: "Achieved", dataIndex: "achieved_qty", key: "achieved_qty", align: "right" },
    { title: "Remaining", dataIndex: "remaining_qty", key: "remaining_qty", align: "right" },
    {
      title: "Completion",
      dataIndex: "completion_percentage",
      key: "completion_percentage",
      align: "right",
      render: (value) => `${Number(value || 0).toFixed(2)}%`,
    },
    {
      title: "Started At",
      dataIndex: "started_at",
      key: "started_at",
       render: (value) => (
          <span style={{ fontSize: 10, color: "#555" }}>
            {value ? dayjs(value).format("DD MMM YYYY, hh:mm A") : "-"}
          </span>
        ),
    },
    {
      title: "Status",
      dataIndex: "production_order_status",
      key: "production_order_status",
      render: (status) => {
        const colorMap = {
          COMPLETED: "success",
          RUNNING: "processing",
          PAUSED: "warning",
          CANCELLED: "error",
          PLANNED: "default",
        };

        return (
          <Tag size="smaller" color={colorMap[status] || "default"}  style={{ fontSize: 10, padding: "0 5px" }}>
            {status || "UNKNOWN"}
          </Tag>
        );
      },
    },
  ];

  const exportToExcel = () => {
    if (!report || !report.data?.length) {
      message.warning("No production data available to export.");
      return;
    }

    const s = report.summary;

    const summaryRows = [
      { Metric: "Production Orders", Value: s.orderCount },
      { Metric: "Target Quantity", Value: s.targetQty },
      { Metric: "Achieved Quantity", Value: s.achievedQty },
      { Metric: "Remaining Quantity", Value: s.remainingQty },
      { Metric: "Completion Percentage", Value: `${s.completionPercentage}%` },
    ];

    const productionRows = report.data.map((order) => ({
      "Production Order": order.order_no,
      Factory: order.factory_name ?? "",
      "Production Line": order.line_name ?? "",
      Product: order.product_name ?? "",
      "Product ERP No.": order.product_erp_no ?? "",
      "Target Quantity": Number(order.target_qty) || 0,
      "Achieved Quantity": Number(order.achieved_qty) || 0,
      "Remaining Quantity": Number(order.remaining_qty) || 0,
      "Completion Percentage": Number(order.completion_percentage) || 0,
      Status: order.production_order_status ?? "",
      "Planned Date": order.planned_date
        ? String(order.planned_date).slice(0, 10)
        : "",
      "Started At": order.started_at ?? "",
      "Completed At": order.completed_at ?? "",
    }));

    const workbook = XLSX.utils.book_new();

    const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
    summarySheet["!cols"] = [{ wch: 28 }, { wch: 22 }];

    const detailsSheet = XLSX.utils.json_to_sheet(productionRows);
    detailsSheet["!cols"] = [
      { wch: 22 }, { wch: 20 }, { wch: 22 }, { wch: 25 }, { wch: 20 },
      { wch: 16 }, { wch: 17 }, { wch: 17 }, { wch: 22 }, { wch: 16 },
      { wch: 15 }, { wch: 22 }, { wch: 22 },
    ];

    XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");
    XLSX.utils.book_append_sheet(workbook, detailsSheet, "Production Orders");

    XLSX.writeFile(
      workbook,
      `Production_Summary_${dayjs().format("YYYY-MM-DD")}.xlsx`
    );

    message.success("Production Summary exported successfully.");
  };

  const kpis = summary? [
        { title: "Orders", value: summary.orderCount },
        { title: "Target Qty", value: summary.targetQty },
        { title: "Achieved Qty", value: summary.achievedQty },
        { title: "Remaining Qty", value: summary.remainingQty },
        {
          title: "Completion",
          value: summary.completionPercentage,
          suffix: "%",
          precision: 2,
        },
      ]
    : [];

  const selectProps = {
    size: "small",
    allowClear: true,
    showSearch: true,
    optionFilterProp: "label",
    style: { width: "100%" },
  };

  return (
    <div style={{ padding: "12px 20px 20px" }}>
      {/* Page header (scrolls away) */}
      <Row justify="space-between" align="middle" gutter={[8, 8]} style={{ marginBottom: 10 }}>
        <Col>
          <Title level={4} style={{ margin: 0 }}>
            Production Summary
          </Title>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Production report received from the MES server
          </Text>
        </Col>

        <Col>
          <Space size={8}>
            <Button
              size="small"
              icon={<DownloadOutlined />}
              onClick={exportToExcel}
              disabled={!report?.data?.length}
            >
              Export Excel
            </Button>
            <Button
              size="small"
              icon={<ReloadOutlined />}
              loading={loading}
              onClick={() => fetchReport(buildFilters(form.getFieldsValue()))}
            >
              Refresh
            </Button>
          </Space>
        </Col>
      </Row>

      {error && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 10 }}
          message="Unable to load report"
          description={error}
        />
      )}

      {summary && (
        <>
          {/* Sticky: KPI cards + filters */}
          <div
            ref={stickyRef}
            style={{
              position: "sticky",
              top: NAVBAR_HEIGHT,
              zIndex: 100,
              background: PAGE_BG,
              padding: "6px 0 8px",
            }}
          >
            <Row gutter={[8, 8]}>
              {kpis.map((item) => (
                <Col key={item.title} xs={12} sm={8} md={{ flex: "1 1 0" }}>
                  <Card size="small" styles={{ body: { padding: "6px 12px" } }}>
                    <Statistic
                      title={item.title}
                      value={Number(item.value || 0)}
                      suffix={item.suffix}
                      precision={item.precision}
                      valueStyle={{ fontSize: 18, fontWeight: 600, lineHeight: 1.2 }}
                      style={{ lineHeight: 1.2 }}
                    />
                  </Card>
                </Col>
              ))}
            </Row>

            <Card
              size="small"
              style={{ marginTop: 8 }}
              styles={{ body: { padding: "8px 12px" } }}
            >
              <Form form={form} onFinish={handleApply}>
                <Row gutter={[8, 8]} align="middle">
                  <Col xs={24} sm={12} lg={6}>
                    <Form.Item name="dateRange" noStyle>
                      <RangePicker
                        size="small"
                        style={{ width: "100%" }}
                        format="DD-MM-YYYY"
                        allowClear
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={12} sm={6} lg={3}>
                    <Form.Item name="factoryId" noStyle>
                      <Select
                        {...selectProps}
                        placeholder="Factory"
                        options={factoryOptions}
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={12} sm={6} lg={3}>
                    <Form.Item name="lineId" noStyle>
                      <Select
                        {...selectProps}
                        placeholder="Line"
                        options={lineOptions}
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={12} sm={6} lg={4}>
                    <Form.Item name="productId" noStyle>
                      <Select
                        {...selectProps}
                        placeholder="Product"
                        options={productOptions}
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={12} sm={6} lg={4}>
                    <Form.Item name="productionOrderId" noStyle>
                      <Select
                        {...selectProps}
                        placeholder="Production order"
                        options={orderOptions}
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} lg={4}>
                    <Space size={8}>
                      <Button
                        size="small"
                        type="primary"
                        htmlType="submit"
                        icon={<FilterOutlined />}
                        loading={loading}
                      >
                        Apply
                      </Button>
                      <Button
                        size="small"
                        icon={<ClearOutlined />}
                        onClick={handleReset}
                        disabled={loading}
                      >
                        Reset
                      </Button>
                    </Space>
                  </Col>
                </Row>
              </Form>
            </Card>
          </div>

          {/* Table: header sticks directly below the KPI + filter block */}
          <Card
            size="small"
            title="Production Order Details"
            extra={<Text type="secondary">{report.count} orders</Text>}
            style={{ marginTop: 4 }}
            styles={{
              header: { minHeight: 36, padding: "0 12px" },
              body: { padding: 0 },
            }}
          >
            <Table
              size="small"
              rowKey="production_order_id"
              columns={columns}
              dataSource={report.data || []}
              loading={loading}
              scroll={{ x: 1100 }}
              sticky={{ offsetHeader: NAVBAR_HEIGHT + stickyHeight }}
              pagination={{
                size: "small",
                defaultPageSize: 20,
                showSizeChanger: true,
                pageSizeOptions: [10, 20, 50, 100],
                showTotal: (total) => `Total ${total} orders`,
                style: { margin: "8px 12px" },
              }}
            />
          </Card>
        </>
      )}

      
      <Modal
        title={
          orderProgress
            ? `Production Order — ${orderProgress.order.order_no}`
            : "Production Order Progress"
        }
        open={progressOpen}
        onCancel={() => setProgressOpen(false)}
        footer={null}
        width={850}
        destroyOnHidden
      >
        <Spin spinning={progressLoading}>
          {orderProgress && (
            <>
              <Row gutter={[12, 12]}>
                <Col xs={12} md={6}>
                  <Card size="small">
                    <Statistic
                      title="Target"
                      value={orderProgress.targetQty}
                    />
                  </Card>
                </Col>
                <Col xs={12} md={6}>
                  <Card size="small">
                    <Statistic
                      title="Final-stage achieved"
                      value={orderProgress.achievedQty}
                    />
                  </Card>
                </Col>
                <Col xs={12} md={6}>
                  <Card size="small">
                    <Statistic
                      title="Remaining"
                      value={orderProgress.remainingQty}
                    />
                  </Card>
                </Col>
                <Col xs={12} md={6}>
                  <Card size="small">
                    <Statistic
                      title="Completion"
                      value={orderProgress.completionPercentage}
                      suffix="%"
                      precision={2}
                    />
                  </Card>
                </Col>
              </Row>

              
            <Divider />

            <Typography.Title level={5}>
              Production Completion
            </Typography.Title>

            {(() => {
              const chartData = [
                {
                  name: "Completed",
                  value: Math.min(
                    orderProgress.achievedQty,
                    orderProgress.targetQty
                  ),
                },
                {
                  name: "Remaining",
                  value: Math.max(
                    orderProgress.targetQty - orderProgress.achievedQty,
                    0
                  ),
                },
              ];

              const COLORS = ["#16a34a", "#d1d5db"];

              return (
                <Row gutter={[16, 16]} align="middle">
                  <Col xs={24} sm={12}>
                    <div style={{ width: "100%", height: 220 }}>
                      <ResponsiveContainer>
                        <PieChart>
                          <Pie
                            data={chartData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={80}
                            paddingAngle={3}
                            label
                          >
                            {chartData.map((entry, index) => (
                              <Cell
                                key={entry.name}
                                fill={COLORS[index]}
                              />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </Col>

                  <Col xs={24} sm={12}>
                    <Statistic
                      title="Completion Percentage"
                      value={orderProgress.completionPercentage}
                      precision={2}
                      suffix="%"
                    />
                    <Typography.Text type="secondary">
                      Based on the final production stage.
                    </Typography.Text>
                  </Col>
                </Row>
              );
            })()}


              <Divider />

              <Typography.Title level={5}>
                Production Stage Flow
              </Typography.Title>

              <Timeline
                items={orderProgress.stages.map((stage, index) => ({
                  color:
                    index === orderProgress.stages.length - 1
                      ? "green"
                      : stage.scannedQty > 0
                        ? "blue"
                        : "gray",
                  children: (
                    <div style={{ paddingBottom: 8 }}>
                      <Typography.Text strong>
                        {stage.sequenceOrder}. {stage.stageName}
                      </Typography.Text>

                      {stage.machineCode && (
                        <Typography.Text type="secondary">
                          {" "}({stage.machineCode})
                        </Typography.Text>
                      )}

                      <div style={{ marginTop: 4 }}>
                        <Typography.Text>
                          Scanned: <strong>{stage.scannedQty}</strong> /{" "}
                          {orderProgress.targetQty}
                        </Typography.Text>
                      </div>

                      <Progress
                        percent={
                          orderProgress.targetQty
                            ? Math.min(
                                (stage.scannedQty / orderProgress.targetQty) * 100,
                                100
                              )
                            : 0
                        }
                        size="small"
                        status={
                          stage.scannedQty >= orderProgress.targetQty &&
                          orderProgress.targetQty > 0
                            ? "success"
                            : "active"
                        }
                        showInfo
                      />
                    </div>
                  ),
                }))}
              />
            </>
          )}
        </Spin>
      </Modal>

    </div>
  );
};

export default Reports;
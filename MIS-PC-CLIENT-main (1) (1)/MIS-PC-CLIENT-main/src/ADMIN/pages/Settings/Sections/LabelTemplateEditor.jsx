import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Col,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Popover,
  Tooltip,
  Typography,
  message,
  Divider,
} from "antd";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  PlusOutlined,
  QrcodeOutlined,
  DeleteOutlined,
  SaveOutlined,
  MinusOutlined,
  BorderOutlined,
  PrinterOutlined,
  ReloadOutlined,
  FontSizeOutlined,
  AppstoreOutlined,
} from "@ant-design/icons";

import { QRCodeCanvas } from "qrcode.react";

import api from "../../../../services/API/api";
import { printZpl } from "../../../../utils/qzPrint";

const { Text, Title } = Typography;

const TEMPLATE_TYPES = [
  { label: "PRODUCT QR", value: "PRODUCT_QR" },
  { label: "PCB QR", value: "PCB_QR" },
  { label: "MASTER LABEL", value: "BOX_LABEL" },
  { label: "CUSTOMER LABEL", value: "CUSTOMER_QR" },
];



const FIELD_OPTIONS = {
  PRODUCT_QR: [
    { label: "Serial No", value: "qr_data" },
    { label: "Product Name", value: "product_name" },
    { label: "Part Code", value: "part_code" },
    { label: "ERP No", value: "erp_no" },
  ],

  PCB_QR: [
    { label: "PCB QR", value: "pcb_qr" },
    { label: "Product Name", value: "product_name" },
    { label: "Part Code", value: "part_code" },
    { label: "ERP No", value: "erp_no" },
  ],

  BOX_LABEL: [
    { label: "Box QR", value: "box_qr" },
    { label: "Product Name", value: "product_name" },
    { label: "Part Code", value: "part_code" },
    { label: "ERP No", value: "erp_no" },
    { label: "Quantity", value: "quantity" },
    { label: "Packed At", value: "packed_at" },
  ],

  CUSTOMER_QR: [
    { label: "Customer Serial", value: "customer_serial" },
    { label: "Product Name", value: "product_name" },
    { label: "Part Code (Customer)", value: "part_code" },
    { label: "Part Code (Product)", value: "product_part_code" },
    { label: "ERP No", value: "erp_no" },
  ],
};



const DEFAULT_SAMPLE_DATA = {
  pcb_qr: "XXXXX00001",
  qr_data: "XXXXX00001",
  box_qr: "XXXXX00001",
  customer_serial: "XXXXX00064",
  product_name: "IDU 12K",
  part_code: "PARTXXXXX01",
  product_part_code: "PRODPARTXX01",
  erp_no: "678912345",
  quantity: "10",
  packed_at: "02/09/2026 09:30",
};

const TEXT_SOURCES = [
  { label: "Manual Text", value: "manual" },
  { label: "Dynamic Field", value: "field" },
  { label: "Date", value: "date" },
];

const DATE_FORMATS = [
  { label: "01/06/26", value: "DD/MM/YY" },
  { label: "01/06/2026", value: "DD/MM/YYYY" },
  { label: "01-Jun-26", value: "DD-MMM-YY" },
  { label: "01-Jun-2026", value: "DD-MMM-YYYY" },
  { label: "01 June 26", value: "DD MMMM YY" },
  { label: "01 June 2026", value: "DD MMMM YYYY" },
  { label: "01 Jun 26", value: "DD MMM YY" },
  { label: "01 Jun 2026", value: "DD MMM YYYY" },
  { label: "June 01, 2026", value: "MMMM DD, YYYY" },
  { label: "Jun 01, 2026", value: "MMM DD, YYYY" },
  { label: "2026-06-01", value: "YYYY-MM-DD" },
];

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export default function LabelTemplateEditor({templateId = null, onSaved}) {
    const [messageApi, contextHolder] = message.useMessage();

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);

    const [printers, setPrinters] = useState([]);
    const [printerId, setPrinterId] = useState(null);

    const [savedTemplates, setSavedTemplates] = useState([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState(null);
    const [loadingTemplates, setLoadingTemplates] = useState(false);

    // ---------------------------------------------------------
    // Layout state (new)
    // ---------------------------------------------------------
    const [leftCollapsed, setLeftCollapsed] = useState(false);

    const loadSavedTemplates = async () => {
        try {
            setLoadingTemplates(true);
            const res = await api.get("/label-templates?active=true");
            setSavedTemplates(res.data.data || []);
        } catch (error) {
            messageApi.error(error?.response?.data?.message ||"Failed to load saved templates");
        } finally {
            setLoadingTemplates(false);
        }
    };

    useEffect(() => {
        loadSavedTemplates();
    }, []);

    const normalizeElements = (elements) => {
    if (!Array.isArray(elements)) return [];

    return elements.map((element) => {
      if (!element || typeof element !== "object") {
        return element;
      }

      if (element.type === "text") {
        return {
          ...element,
          source: element.source || "manual",
          text: element.source === "manual"? String(element.text || "Edit Text") : element.text || "",
          dateFormat: element.dateFormat || "DD/MM/YY",
        };
      }

      if (element.type === "line") {
        return {
          ...element,
          direction: element.direction || "horizontal",
          x: Number(element.x || 0),
          y: Number(element.y || 0),
          width:
            element.direction === "horizontal"
              ? Number(element.width || 100)
              : element.width,
          height:
            element.direction === "vertical"
              ? Number(element.height || 100)
              : element.height,
          thickness: Number(element.thickness || 2),
        };
      }

      if (element.type === "box") {
        return {
          ...element,
          x: Number(element.x || 0),
          y: Number(element.y || 0),
          width: Number(element.width || 100),
          height: Number(element.height || 100),
          thickness: Number(element.thickness || 2),
        };
      }

      if (element.type === "qr") {
        return {
          ...element,
          field: element.field || fields[0]?.value,
          x: Number(element.x || 0),
          y: Number(element.y || 0),
          size: Number(element.size || 90),
          scale: Number(element.scale || 3),
        };
      }

      return element;
    });
  };

    const handleLoadTemplate = async () => {
        if (!selectedTemplateId) {
            messageApi.warning("Select a template first");
            return;
        }

        try {
            setLoading(true);

            const res = await api.get(`/label-templates/${selectedTemplateId}`);
            const saved = res.data.data;

            const elements =
            typeof saved.elements === "string"
                ? JSON.parse(saved.elements)
                : saved.elements || [];

            setTemplate({
            ...saved,
            elements: normalizeElements(elements),
            });

            setSelectedId(null);
            messageApi.success("Template loaded successfully");
        } catch (error) {
            messageApi.error(error?.response?.data?.message ||"Failed to load template");
        } finally {
            setLoading(false);
        }
    };

  const [template, setTemplate] = useState({
    name: "Template 1",
    template_type: "CUSTOMER_QR",
    dpi: 300,
    width: 1200,
    height: 150,
    pitch_x: 400,
    pitch_y: 150,
    elements: [],
  });

  const [selectedId, setSelectedId] = useState(null);
  const [sampleData, setSampleData] = useState(DEFAULT_SAMPLE_DATA);
  const fields = FIELD_OPTIONS[template.template_type] || [];

  const selectedElement = useMemo(() =>template.elements.find((element) => 
    element.id === selectedId),
    [template.elements, selectedId]
  );

  const CANVAS_MAX_WIDTH = 760;
  const scale = Math.min(CANVAS_MAX_WIDTH / template.width, 1);
  const canvasWidth = template.width * scale;
  const canvasHeight = template.height * scale;

  // ---------------------------------------------------------
  // Load existing template
  // ---------------------------------------------------------

  useEffect(() => {
    if (!templateId) return;

    const loadTemplate = async () => {
      try {
        setLoading(true);

        const res = await api.get(`/label-templates/${templateId}`);

        const saved = res.data.data;
        const elements =
        typeof saved.elements === "string"? JSON.parse(saved.elements) : saved.elements || [];
        setTemplate({
        ...saved,
        elements: normalizeElements(elements),
        });
      } catch (error) {
        messageApi.error(error?.response?.data?.message || "Failed to load template");
      } finally {
        setLoading(false);
      }
    };

    loadTemplate();
  }, [templateId]);

  // ---------------------------------------------------------
  // Load printers
  // ---------------------------------------------------------

  useEffect(() => {
    const loadPrinters = async () => {
      try {
        const res = await api.get("/printers");

        setPrinters(res.data || []);
      } catch (error) {
        messageApi.error("Failed to load printers");
      }
    };

    loadPrinters();
  }, []);

  const updateTemplate = (changes) => {
    setTemplate((prev) => ({
      ...prev,
      ...changes,
    }));
  };

  const updateElement = (id, changes) => {
    setTemplate((prev) => ({
      ...prev,
      elements: prev.elements.map((element) =>
        element.id === id? { ...element, ...changes } : element),
    }));
  };

  // ---------------------------------------------------------
  // Add Text
  // ---------------------------------------------------------

    const addText = () => {
        const element = {
            id: createId(),
            type: "text",
            source: "manual",
            field:
            fields.find((item) => item.value === "product_name"
            )?.value || fields[0]?.value,
            text: "Edit Text",
            dateFormat: "DD/MM/YY",
            x: 100,
            y: 20,
            fontSize: 22,
            bold: false,
            rotation: 0,
        };

        setTemplate((prev) => ({
            ...prev,
            elements: [...prev.elements, element],
        }));

        setSelectedId(element.id);
    };

    const formatDate = (format) => {
        const date = new Date();

        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();

        const shortYear = String(year).slice(-2);

        const monthsShort = [
            "Jan", "Feb", "Mar", "Apr",
            "May", "Jun", "Jul", "Aug",
            "Sep", "Oct", "Nov", "Dec",
        ];

        const monthsLong = [
            "January", "February", "March",
            "April", "May", "June",
            "July", "August", "September",
            "October", "November", "December",
        ];

        const replacements = {
            "DD": day,
            "MMMM": monthsLong[date.getMonth()],
            "MMM": monthsShort[date.getMonth()],
            "MM": month,
            "YYYY": String(year),
            "YY": shortYear,
        };

        return format.replace(/YYYY|MMMM|MMM|MM|DD|YY/g, (token) => replacements[token]);
    };

    const getTextValue = (element) => {
        if (element.source === "manual") {
            return element.text || "";
        }

        if (element.source === "date") {
            return formatDate(
            element.dateFormat || "DD/MM/YY"
            );
        }

        if (element.source === "field") {
            return getSampleValue(element.field);
        }

        return "";
    };

    const getQrValue = (element) => {
        return getSampleValue(element.field);
    }; 
    
    const addHorizontalLine = () => {
      const element = {
        id: createId(),
        type: "line",
        direction: "horizontal",
        x: 50,
        y: 100,
        width: 1100,
        thickness: 2,
      };

      setTemplate((prev) => ({
        ...prev,
        elements: [...prev.elements, element],
      }));

      setSelectedId(element.id);
  };

const addVerticalLine = () => {
  const element = {
    id: createId(),
    type: "line",
    direction: "vertical",
    x: 400,
    y: 20,
    height: 100,
    thickness: 2,
  };

  setTemplate((prev) => ({
    ...prev,
    elements: [...prev.elements, element],
  }));

  setSelectedId(element.id);
};

const addBox = () => {
  const element = {
    id: createId(),
    type: "box",
    x: 50,
    y: 20,
    width: 1100,
    height: 100,
    thickness: 2,
  };

  setTemplate((prev) => ({
    ...prev,
    elements: [...prev.elements, element],
  }));

  setSelectedId(element.id);
};

  // ---------------------------------------------------------
  // Add QR
  // ---------------------------------------------------------

  const addQr = () => {
    const field =
      fields.find((item) =>
          item.value === "customer_serial" ||
          item.value === "pcb_qr" || 
          item.value === "qr_data" ||
          item.value === "box_qr"
      )?.value || fields[0]?.value;

    const element = {
      id: createId(),
      type: "qr",
      field,
      x: 295,
      y: 15,
      size: 90,
      scale: 3,
      rotation: 0,
    };

    setTemplate((prev) => ({
      ...prev,
      elements: [...prev.elements, element],
    }));

    setSelectedId(element.id);
  };

  // ---------------------------------------------------------
  // Delete
  // ---------------------------------------------------------

  const deleteSelected = () => {
    if (!selectedId) return;

    setTemplate((prev) => ({
      ...prev,
      elements: prev.elements.filter(
        (element) => element.id !== selectedId
      ),
    }));

    setSelectedId(null);
  };

  // ---------------------------------------------------------
  // Drag
  // ---------------------------------------------------------

  const startDrag = (event, element) => {
    event.preventDefault();
    event.stopPropagation();

    setSelectedId(element.id);

    const startX = event.clientX;
    const startY = event.clientY;

    const originalX = element.x;
    const originalY = element.y;

    const handleMove = (moveEvent) => {
      const dx = (moveEvent.clientX - startX) / scale;
      const dy = (moveEvent.clientY - startY) / scale;

      updateElement(element.id, {
        x: Math.max(0, Math.round(originalX + dx)),
        y: Math.max(0, Math.round(originalY + dy)),
      });
    };

    const handleUp = () => {
      window.removeEventListener("pointermove",handleMove);
      window.removeEventListener("pointerup",handleUp);
    };

    window.addEventListener("pointermove",handleMove);
    window.addEventListener("pointerup",handleUp);
  };

  // ---------------------------------------------------------
  // Sample value
  // ---------------------------------------------------------

  const getSampleValue = (field) => sampleData[field] ?? "";

  // ---------------------------------------------------------
  // SAVE TEMPLATE
  // ---------------------------------------------------------

  const handleSave = async () => {
      const badIndex = template.elements.findIndex((el) => el.type === "text" && (el.source || "manual") === "manual" && !String(el.text || "").trim());

      if (badIndex !== -1) {
      messageApi.error(`Text element #${badIndex + 1} has no manual text — fill it in or switch its Text Source.`);
      setSelectedId(template.elements[badIndex].id); // jump user to the offending element
      return;
      }

      if (!template.name.trim()) {
          messageApi.error("Template name is required");
          return;
      }

      if (!template.name.trim()) {
        messageApi.error("Template name is required");
        return;
      }

      if (!template.elements.length) {
        messageApi.error("Add at least one element to the template");
        return;
      }

      try {
        setSaving(true);

        let res;

        if (template.id) {
          res = await api.put(`/label-templates/${template.id}`, template);
        } else {
          res = await api.post("/label-templates",template);
        }

        const savedTemplate = res.data.data;

        setTemplate({
          ...savedTemplate,
          elements: typeof savedTemplate.elements === "string"? JSON.parse(savedTemplate.elements) : savedTemplate.elements || [],
        });

        setSelectedTemplateId(savedTemplate.id);
        await loadSavedTemplates();
        messageApi.success("Template saved successfully");

        onSaved?.(savedTemplate);
      } catch (error) {
        messageApi.error(error?.response?.data?.message || "Failed to save template");
      } finally {
        setSaving(false);
      }
  };

  // ---------------------------------------------------------
  // TEST PRINT
  // ---------------------------------------------------------

  const handleTestPrint = async () => {
    if (!printerId) {
      messageApi.error("Select a printer for test print");
      return;
    }

    if (!template.elements.length) {
      messageApi.error("Add at least one element before test printing");
      return;
    }

    try {
      setTesting(true);

      const res = await api.post("/label-templates/test-print",
        {
          template,
          printer_id: printerId,
          test_data: sampleData,
        }
      );

      const zpl = res.data.data.zpl;
      const printer = printers.find((item) => item.id === printerId);

      if (!printer?.printer_name) {
        throw new Error("Selected printer queue not found");
      }

      await printZpl(zpl, printer.printer_name);

      messageApi.success("Test print sent successfully");
    } catch (error) {
      messageApi.error(
        error?.response?.data?.message || error?.message || "Test print failed"
      );
    } finally {
      setTesting(false);
    }
  };

  return (
    <>
      {contextHolder}

      <Card
        loading={loading}
        bodyStyle={{ padding: 10 }}
        style={{ borderRadius: 4, border: "none" }}
        >
        <Space
          orientation="vertical"
          style={{ width: "100%" }}
          size={8}
        >
          <div
            style={{
              background: "#fff",
              border: "1px solid #eef0f4",
              borderRadius: 12,
              padding: 16,
              marginBottom: 16,
              boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
            }}
          >
            {/* ================================================= */}
            {/* TEMPLATE / PRINTER ROW */}
            {/* ================================================= */}

            <Row
              gutter={12}
              align="middle"
              wrap
              style={{ marginBottom: 16, rowGap: 12 }}
            >
              <Col flex="auto" style={{ minWidth: 220 }}>
                <div
                  style={{
                    width: "100%",
                    padding: 1,
                    borderRadius: 7,
                    background: "linear-gradient(90deg, #5b5ce2 0%, #3b82f6 50%, #0ea5e9 100%)",
                  }}
                >
                  <Select
                    style={{ width: "100%" }}
                    styles={{
                      selector: {
                        border: "none",
                        borderRadius: 6,
                        boxShadow: "none",
                      },
                    }}
                    placeholder="Select saved template"
                    loading={loadingTemplates}
                    value={selectedTemplateId}
                    onChange={setSelectedTemplateId}
                    options={savedTemplates.map((item) => ({
                      label: `${item.name} — ${item.template_type} — ${item.dpi} DPI`,
                      value: item.id,
                    }))}
                    showSearch
                    optionFilterProp="label"
                  />
                </div>
              </Col>

              <Col>
                <Button
                  type="primary"
                  icon={<ReloadOutlined />}
                  onClick={handleLoadTemplate}
                  disabled={!selectedTemplateId}
                  loading={loading}
                  style={{
                    background: !selectedTemplateId
                      ? ""
                      : "linear-gradient(90deg, #5b5ce2 0%, #0ea5e9 100%)",
                    border: "none",
                    fontWeight: 600,
                    borderRadius: 8,
                  }}
                >
                  Load Template
                </Button>
              </Col>

              <Col>
                <Divider type="vertical" style={{ height: 32, margin: 0 }} />
              </Col>

              <Col style={{ minWidth: 220 }}>
                <Select
                  style={{ width: 220 }}
                  placeholder="Select printer"
                  value={printerId}
                  onChange={setPrinterId}
                  options={printers.map((printer) => ({
                    label: `${printer.name} — ${printer.printer_name}`,
                    value: printer.id,
                  }))}
                />
              </Col>

              <Col>
                <Button
                  icon={<PrinterOutlined />}
                  type="primary"
                  loading={testing}
                  disabled={!printerId}
                  onClick={handleTestPrint}
                >
                  Test Print
                </Button>
              </Col>
            </Row>

            <Divider style={{ margin: "0 0 16px" }} />

            {/* ================================================= */}
            {/* ELEMENT TOOLBAR ROW */}
            {/* ================================================= */}

            <Row justify="space-between" align="middle">
              <Space align="center" size={12}>
                <Button
                  shape="circle"
                  icon={leftCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                  onClick={() => setLeftCollapsed((prev) => !prev)}
                  title={leftCollapsed ? "Expand panel" : "Collapse panel"}
                />

                <Divider type="vertical" style={{ height: 24, margin: 0 }} />

                <Space
                  size={8}
                  style={{
                    background: "#f8fafc",
                    padding: "6px 10px",
                    borderRadius: 10,
                    border: "1px solid #eef0f4",
                  }}
                >
                  {/* Text */}
                  <Tooltip title="Add Text">
                    <Button
                      icon={<FontSizeOutlined />}
                      onClick={addText}
                      style={{
                        background: "linear-gradient(90deg, #5b5ce2 0%, #0ea5e9 100%)",
                        border: "none",
                        fontWeight: 600,
                        borderRadius: 8,
                        color: "white",
                      }}
                    />
                  </Tooltip>

                  {/* QR */}
                  <Tooltip title="Add QR">
                    <Button
                      icon={<QrcodeOutlined />}
                      onClick={addQr}
                      style={{
                        background: "linear-gradient(90deg, #5b5ce2 0%, #0ea5e9 100%)",
                        border: "none",
                        fontWeight: 600,
                        borderRadius: 8,
                        color: "white",
                      }}
                    />
                  </Tooltip>

                  {/* Elements */}
                  <Popover
                    trigger="click"
                    placement="bottom"
                    content={
                      <Space size={8}>
                        {/* Horizontal Line */}
                        <Tooltip title="Horizontal Line">
                          <Button
                            icon={<MinusOutlined />}
                            onClick={addHorizontalLine}
                            style={{
                              background: "linear-gradient(90deg, #5b5ce2 0%, #0ea5e9 100%)",
                              border: "none",
                              fontWeight: 600,
                              borderRadius: 8,
                              color: "white",
                            }}
                          />
                        </Tooltip>

                        {/* Vertical Line */}
                        <Tooltip title="Vertical Line">
                          <Button
                            icon={
                              <span style={{ display: "inline-block", fontSize: 20, lineHeight: 1 }}>
                                |
                              </span>
                            }
                            onClick={addVerticalLine}
                            style={{
                              background: "linear-gradient(90deg, #5b5ce2 0%, #0ea5e9 100%)",
                              border: "none",
                              fontWeight: 600,
                              borderRadius: 8,
                              color: "white",
                            }}
                          />
                        </Tooltip>

                        {/* Box */}
                        <Tooltip title="Box">
                          <Button
                            icon={<BorderOutlined />}
                            onClick={addBox}
                            style={{
                              background: "linear-gradient(90deg, #5b5ce2 0%, #0ea5e9 100%)",
                              border: "none",
                              fontWeight: 600,
                              borderRadius: 8,
                              color: "white",
                            }}
                          />
                        </Tooltip>
                      </Space>
                    }
                  >
                    <Tooltip title="Add Element">
                      <Button
                        icon={<AppstoreOutlined />}
                        style={{ borderRadius: 8 }}
                      />
                    </Tooltip>
                  </Popover>

                  <Divider type="vertical" style={{ height: 24, margin: 0 }} />

                  {/* Delete */}
                  <Tooltip title="Delete">
                    <Button
                      danger
                      icon={<DeleteOutlined />}
                      disabled={!selectedElement}
                      onClick={deleteSelected}
                      style={{ borderRadius: 8 }}
                    />
                  </Tooltip>
                </Space>
              </Space>

              <Space>
                <Button
                  type="primary"
                  onClick={handleSave}
                  loading={saving}
                  icon={<SaveOutlined />}
                  style={{
                    background: "linear-gradient(90deg, #5b5ce2 0%, #0ea5e9 100%)",
                    border: "none",
                    fontWeight: 600,
                    borderRadius: 8,
                  }}
                >
                  Save Template
                </Button>
              </Space>
            </Row>
          </div>
          <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
              {/* ================================================= */}
              {/* LEFT */}
              {/* ================================================= */}

              <div
                style={{
                  position: "relative",
                  width: leftCollapsed ? 0 : 200,
                  opacity: leftCollapsed ? 0 : 1,
                  height: 500,
                  flexShrink: 0,
                  transition: "width 0.3s ease, opacity 0.25s ease",
                  overflow: "hidden",
                  border: "1px solid #EEEEEE",
                  borderRadius: 8,
                }}
              >
                {/* Scrollable content */}
                <div
                  style={{
                    width: 200,
                    height: "100%",
                    overflowY: "auto",
                    overflowX: "hidden",
                    scrollbarWidth: "none",
                    paddingBottom: 25,
                    boxSizing: "border-box",
                  }}
                >
                  <div
                    style={{
                      padding: 1,
                      borderRadius: 10,
                    }}
                  >
                    <Card
                      size="small"
                      bordered={false}
                      style={{
                        borderRadius: 9,
                        background: "#fff",
                      }}
                      bodyStyle={{
                        padding: 16,
                      }}
                    >
                      <Space
                        direction="vertical"
                        style={{ width: "100%" }}
                        size={20}
                      >
                        {/* Template */}
                        <Space
                          direction="vertical"
                          style={{ width: "100%" }}
                          size={8}
                        >
                          <Text
                            strong
                            style={{
                              fontSize: 13,
                              color: "#1e293b",
                            }}
                          >
                            Template
                          </Text>

                          <Text style={{ color: "#64748b", fontSize: 12 }}>
                            Name
                          </Text>

                          <Input
                            style={{ width: "100%" }}
                            value={template.name}
                            onChange={(e) =>
                              updateTemplate({
                                name: e.target.value,
                              })
                            }
                          />

                          <Text style={{ color: "#64748b", fontSize: 12 }}>
                            Type
                          </Text>

                          <Select
                            style={{ width: "100%" }}
                            value={template.template_type}
                            options={TEMPLATE_TYPES}
                            onChange={(value) => {
                              updateTemplate({
                                template_type: value,
                                elements: [],
                              });

                              setSelectedId(null);
                            }}
                          />
                        </Space>

                        <Divider style={{ margin: 0 }} />

                        {/* Canvas */}
                        <Space
                          direction="vertical"
                          style={{ width: "100%" }}
                          size={8}
                        >
                          <Text
                            strong
                            style={{
                              fontSize: 13,
                              color: "#1e293b",
                            }}
                          >
                            Canvas
                          </Text>

                          <Text style={{ color: "#64748b", fontSize: 12 }}>
                            PRINTER DPI
                          </Text>

                          <InputNumber
                            style={{ width: "100%" }}
                            min={1}
                            value={template.dpi}
                            onChange={(value) =>
                              updateTemplate({
                                dpi: value || 300,
                              })
                            }
                          />

                          <Text style={{ color: "#64748b", fontSize: 12 }}>
                            Width (dots)
                          </Text>

                          <InputNumber
                            style={{ width: "100%" }}
                            min={1}
                            value={template.width}
                            onChange={(value) =>
                              updateTemplate({
                                width: value || 1,
                              })
                            }
                          />

                          <Text style={{ color: "#64748b", fontSize: 12 }}>
                            Height (dots)
                          </Text>

                          <InputNumber
                            style={{ width: "100%" }}
                            min={1}
                            value={template.height}
                            onChange={(value) =>
                              updateTemplate({
                                height: value || 1,
                              })
                            }
                          />
                        </Space>

                        <Divider style={{ margin: 0 }} />

                        {/* Pitch */}
                        <Space
                          direction="vertical"
                          style={{ width: "100%" }}
                          size={8}
                        >
                          <Text
                            strong
                            style={{
                              fontSize: 13,
                              color: "#1e293b",
                            }}
                          >
                            Pitch
                          </Text>

                          <Text style={{ color: "#64748b", fontSize: 12 }}>
                            Pitch X
                          </Text>

                          <InputNumber
                            style={{ width: "100%" }}
                            min={0}
                            value={template.pitch_x}
                            onChange={(value) =>
                              updateTemplate({
                                pitch_x: value,
                              })
                            }
                          />

                          <Text style={{ color: "#64748b", fontSize: 12 }}>
                            Pitch Y
                          </Text>

                          <InputNumber
                            style={{ width: "100%" }}
                            min={0}
                            value={template.pitch_y}
                            onChange={(value) =>
                              updateTemplate({
                                pitch_y: value,
                              })
                            }
                          />
                        </Space>
                      </Space>
                    </Card>
                  </div>
                </div>

                {/* Bottom fade - does NOT belong to scroll content */}
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: 0,
                    height: 24,
                    pointerEvents: "none",
                    zIndex: 10,
                    background:
                      "linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0.95))",
                  }}
                />
              </div>

              {/* ================================================= */}
              {/* CANVAS */}
              {/* ================================================= */}

              <div 
                style={{ 
                  flex: 1, 
                  minWidth: 0 ,
                  
                }}
              >
                <Text>
                  W: {template.width}, H: {template.height}
                </Text>

                <div
                  style={{
                    marginTop: 12,
                    overflow: "auto",
                    padding: 28,
                    background: "linear-gradient(180deg, #fafafa 0%, #f0f2f5 100%)",
                    border: "1px solid #e5e7eb",
                    borderRadius: 12,
                    boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)",
                  }}
                >
                  <div style={{ display: "inline-block" }}>

                    {/* corner + horizontal ruler */}
                    <div style={{ display: "flex" }}>
                      <div
                        style={{
                          width: 24,
                          height: 20,
                          flexShrink: 0,
                          background: "#f8fafc",
                          border: "1px solid #e2e8f0",
                          borderRight: "none",
                          borderBottom: "none",
                          borderRadius: "6px 0 0 0",
                        }}
                      />
                      <div
                        style={{
                          position: "relative",
                          width: canvasWidth,
                          height: 20,
                          background: "#f8fafc",
                          border: "1px solid #e2e8f0",
                          borderLeft: "none",
                          borderRadius: "0 6px 0 0",
                          // overflow: "hidden",
                        }}
                      >
                        {Array.from(
                          { length: Math.floor(template.width / 20) + 1 },
                          (_, i) => i * 20
                        ).map((t) => {
                          const isMajor = t % 100 === 0;
                          return (
                            <div
                              key={`h-${t}`}
                              style={{
                                position: "absolute",
                                left: t * scale,
                                top: isMajor ? 8 : 13,
                                width: 1,
                                height: isMajor ? 12 : 7,
                                background: isMajor ? "#64748b" : "#cbd5e1",
                              }}
                            >
                              {isMajor && (
                                <span
                                  style={{
                                    position: "absolute",
                                    top: -13,
                                    left: 2,
                                    fontSize: 9,
                                    color: "#64748b",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {t}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* vertical ruler + canvas */}
                    <div style={{ display: "flex" }}>
                      <div
                        style={{
                          position: "relative",
                          width: 24,
                          height: canvasHeight,
                          flexShrink: 0,
                          background: "#f8fafc",
                          border: "1px solid #e2e8f0",
                          borderTop: "none",
                          borderRadius: "0 0 0 6px",
                          // overflow: "hidden",
                        }}
                      >
                        {Array.from(
                          { length: Math.floor(template.height / 20) + 1 },
                          (_, i) => i * 20
                        ).map((t) => {
                          const isMajor = t % 100 === 0;
                          return (
                            <div
                              key={`v-${t}`}
                              style={{
                                position: "absolute",
                                top: t * scale,
                                left: isMajor ? 6 : 12,
                                width: isMajor ? 14 : 8,
                                height: 1,
                                background: isMajor ? "#64748b" : "#cbd5e1",
                              }}
                            >
                              {isMajor && (
                                <span
                                  style={{
                                    position: "absolute",
                                    left: -18,
                                    top: -5,
                                    fontSize: 9,
                                    color: "#64748b",
                                  }}
                                >
                                  {t}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      <div
                        style={{
                          position: "relative",
                          width: canvasWidth,
                          height: canvasHeight,
                          background: "#fff",
                          border: "1px solid #999",
                          borderRadius: "0 0 4px 4px",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                          backgroundImage:
                            "linear-gradient(#eee 1px, transparent 1px), linear-gradient(90deg, #eee 1px, transparent 1px)",
                          backgroundSize: `${10 * scale}px ${10 * scale}px`,
                        }}
                        onPointerDown={(event) => setSelectedId(event, element)}
                      >
                        {template.elements.map((element) => {
                          const selected = element.id === selectedId;
                          const value =
                            element.type === "qr" ? getQrValue(element) : getTextValue(element);

                          if (element.type === "text") {
                            return (
                              <div
                                key={element.id}
                                onPointerDown={(event) => startDrag(event, element)}
                                style={{
                                  position: "absolute",
                                  left: element.x * scale,
                                  top: element.y * scale,
                                  fontSize: element.fontSize * scale,
                                  lineHeight: `${element.fontSize * scale}px`,
                                  fontWeight: element.bold ? 700 : 400,
                                  whiteSpace: "nowrap",
                                  cursor: "move",
                                  border: selected ? "1px dashed #1677ff" : "1px solid transparent",
                                  padding: 0,
                                  margin: 0,
                                  userSelect: "none",
                                  transform: element.rotation ? `rotate(${element.rotation}deg)` : undefined,
                                  transformOrigin: "top left",
                                }}
                              >
                                {value}
                              </div>
                            );
                          }

                          if (element.type === "qr") {
                            return (
                              <div
                                key={element.id}
                                onPointerDown={(event) => startDrag(event, element)}
                                style={{
                                  position: "absolute",
                                  left: element.x * scale,
                                  top: element.y * scale,
                                  width: element.size * scale,
                                  height: element.size * scale,
                                  background: "#fff",
                                  border: selected ? "2px solid #1677ff" : "1px solid #222",
                                  cursor: "move",
                                  userSelect: "none",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <QRCodeCanvas
                                  value={String(value || "TEST")}
                                  size={element.size * scale}
                                  level="M"
                                  includeMargin={false}
                                />
                              </div>
                            );
                          }

                          if (element.type === "line") {
                            const isHorizontal = element.direction === "horizontal";

                            return (
                              <div
                                key={element.id}
                                onPointerDown={(event) => startDrag(event, element)}
                                style={{
                                  position: "absolute",
                                  left: element.x * scale,
                                  top: element.y * scale,
                                  width: isHorizontal ? element.width * scale : element.thickness * scale,
                                  height: isHorizontal ? element.thickness * scale : element.height * scale,
                                  background: "#000",
                                  border: selected ? "1px dashed #1677ff" : "none",
                                  cursor: "move",
                                  userSelect: "none",
                                  boxSizing: "border-box",
                                }}
                              />
                            );
                          }

                          if (element.type === "box") {
                            return (
                              <div
                                key={element.id}
                                onPointerDown={(event) => startDrag(event, element)}
                                style={{
                                  position: "absolute",
                                  left: element.x * scale,
                                  top: element.y * scale,
                                  width: element.width * scale,
                                  height: element.height * scale,
                                  border: selected
                                    ? `${Math.max(1, element.thickness * scale)}px solid #1677ff`
                                    : `${Math.max(1, element.thickness * scale)}px solid #000`,
                                  cursor: "move",
                                  userSelect: "none",
                                  boxSizing: "border-box",
                                }}
                              />
                            );
                          }

                          return null;
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ================================================= */}
              {/* RIGHT */}
              {/* ================================================= */}

              <div
                style={{
                  width: selectedElement ? 180 : 0,
                  opacity: selectedElement ? 1 : 0,
                  overflow: "hidden",
                  flexShrink: 0,
                  transition: "width 0.3s ease, opacity 0.25s ease",
                }}
              >
                <div style={{ width: 180, maxHeight: 640, overflowY: "auto", paddingRight: 4 }}>
                  {selectedElement && (
                    <div
                      style={{
                        padding: 1,
                        borderRadius: 10,
                        // background: "linear-gradient(135deg, #5b5ce2 0%, #3b82f6 50%, #0ea5e9 100%)",
                      }}
                    >
                      <Card
                        size="small"
                        bordered={false}
                        style={{ borderRadius: 9, background: "#fff" }}
                        bodyStyle={{ padding: 16 }}
                      >
                        <Space direction="vertical" style={{ width: "100%" }} size={20}>

                          {/* Header */}
                          <Space direction="vertical" style={{ width: "100%" }} size={2}>
                            <Text strong style={{ fontSize: 13, color: "#1e293b" }}>
                              Element Properties
                            </Text>
                            <Text style={{ color: "#64748b", fontSize: 12 }}>
                              {selectedElement.type === "line" && "Line Element"}
                              {selectedElement.type === "box" && "Box Element"}
                              {selectedElement.type === "qr" && "QR Element"}
                              {selectedElement.type === "text" && "Text Element"}
                            </Text>
                          </Space>

                          <Divider style={{ margin: 0 }} />

                          {/* Line */}
                          {selectedElement.type === "line" && (
                            <Space direction="vertical" style={{ width: "100%" }} size={8}>
                              <Text style={{ color: "#64748b", fontSize: 12 }}>Direction</Text>
                              <Select
                                style={{ width: "100%" }}
                                value={selectedElement.direction}
                                options={[
                                  { label: "Horizontal", value: "horizontal" },
                                  { label: "Vertical", value: "vertical" },
                                ]}
                                onChange={(value) =>
                                  updateElement(selectedElement.id, {
                                    direction: value,
                                  })
                                }
                              />

                              <Text style={{ color: "#64748b", fontSize: 12 }}>X</Text>
                              <InputNumber
                                style={{ width: "100%" }}
                                min={0}
                                value={selectedElement.x}
                                onChange={(value) =>
                                  updateElement(selectedElement.id, {
                                    x: value || 0,
                                  })
                                }
                              />

                              <Text style={{ color: "#64748b", fontSize: 12 }}>Y</Text>
                              <InputNumber
                                style={{ width: "100%" }}
                                min={0}
                                value={selectedElement.y}
                                onChange={(value) =>
                                  updateElement(selectedElement.id, {
                                    y: value || 0,
                                  })
                                }
                              />

                              {selectedElement.direction === "horizontal" ? (
                                <>
                                  <Text style={{ color: "#64748b", fontSize: 12 }}>Width</Text>
                                  <InputNumber
                                    style={{ width: "100%" }}
                                    min={1}
                                    value={selectedElement.width}
                                    onChange={(value) =>
                                      updateElement(selectedElement.id, {
                                        width: value || 1,
                                      })
                                    }
                                  />
                                </>
                              ) : (
                                <>
                                  <Text style={{ color: "#64748b", fontSize: 12 }}>Height</Text>
                                  <InputNumber
                                    style={{ width: "100%" }}
                                    min={1}
                                    value={selectedElement.height}
                                    onChange={(value) =>
                                      updateElement(selectedElement.id, {
                                        height: value || 1,
                                      })
                                    }
                                  />
                                </>
                              )}

                              <Text style={{ color: "#64748b", fontSize: 12 }}>Thickness</Text>
                              <InputNumber
                                style={{ width: "100%" }}
                                min={1}
                                max={20}
                                value={selectedElement.thickness}
                                onChange={(value) =>
                                  updateElement(selectedElement.id, {
                                    thickness: value || 1,
                                  })
                                }
                              />
                            </Space>
                          )}

                          {/* Box */}
                          {selectedElement.type === "box" && (
                            <Space direction="vertical" style={{ width: "100%" }} size={8}>
                              <Text style={{ color: "#64748b", fontSize: 12 }}>X</Text>
                              <InputNumber
                                style={{ width: "100%" }}
                                min={0}
                                value={selectedElement.x}
                                onChange={(value) =>
                                  updateElement(selectedElement.id, {
                                    x: value || 0,
                                  })
                                }
                              />

                              <Text style={{ color: "#64748b", fontSize: 12 }}>Y</Text>
                              <InputNumber
                                style={{ width: "100%" }}
                                min={0}
                                value={selectedElement.y}
                                onChange={(value) =>
                                  updateElement(selectedElement.id, {
                                    y: value || 0,
                                  })
                                }
                              />

                              <Text style={{ color: "#64748b", fontSize: 12 }}>Width</Text>
                              <InputNumber
                                style={{ width: "100%" }}
                                min={1}
                                value={selectedElement.width}
                                onChange={(value) =>
                                  updateElement(selectedElement.id, {
                                    width: value || 1,
                                  })
                                }
                              />

                              <Text style={{ color: "#64748b", fontSize: 12 }}>Height</Text>
                              <InputNumber
                                style={{ width: "100%" }}
                                min={1}
                                value={selectedElement.height}
                                onChange={(value) =>
                                  updateElement(selectedElement.id, {
                                    height: value || 1,
                                  })
                                }
                              />

                              <Text style={{ color: "#64748b", fontSize: 12 }}>Thickness</Text>
                              <InputNumber
                                style={{ width: "100%" }}
                                min={1}
                                max={20}
                                value={selectedElement.thickness}
                                onChange={(value) =>
                                  updateElement(selectedElement.id, {
                                    thickness: value || 1,
                                  })
                                }
                              />
                            </Space>
                          )}

                          {/* Text / QR */}
                          {(selectedElement.type === "text" || selectedElement.type === "qr") && (
                            <Space direction="vertical" 
                            style={{ width: "100%" }} 
                            size={8}
                            >
                              <Text style={{ color: "#64748b", fontSize: 12 }}>X</Text>
                              <InputNumber
                                style={{ width: "100%" }}
                                min={0}
                                value={selectedElement.x}
                                onChange={(value) =>
                                  updateElement(selectedElement.id, {
                                    x: value || 0,
                                  })
                                }
                              />

                              <Text style={{ color: "#64748b", fontSize: 12 }}>Y</Text>
                              <InputNumber
                                style={{ width: "100%" }}
                                min={0}
                                value={selectedElement.y}
                                onChange={(value) =>
                                  updateElement(selectedElement.id, {
                                    y: value || 0,
                                  })
                                }
                              />

                              <Text style={{ color: "#64748b", fontSize: 12 }}>Orientation</Text>
                                <Select
                                  style={{ width: "100%" }}
                                  value={selectedElement.rotation || 0}
                                  options={[
                                    { label: "Horizontal (0°)", value: 0 },
                                    { label: "Vertical ↑ (90°)", value: 90 },
                                    { label: "Upside Down (180°)", value: 180 },
                                    { label: "Vertical ↓ (270°)", value: 270 },
                                  ]}
                                  onChange={(value) => updateElement(selectedElement.id, { rotation: value })}
                                />

                              {selectedElement.type === "text" && (
                                <>
                                  <Text style={{ color: "#64748b", fontSize: 12 }}>Text Source</Text>
                                  <Select
                                    style={{ width: "100%" }}
                                    value={selectedElement.source || "field"}
                                    options={TEXT_SOURCES}
                                    onChange={(value) =>
                                      updateElement(selectedElement.id, {
                                        source: value,
                                        ...(value === "manual" &&
                                        !String(selectedElement.text || "").trim()
                                          ? { text: "Sample Text" }
                                          : {}),
                                        ...(value === "date" && !selectedElement.dateFormat
                                          ? { dateFormat: "DD/MM/YY" }
                                          : {}),
                                      })
                                    }
                                  />

                                  {selectedElement.source === "manual" && (
                                    <>
                                      <Text style={{ color: "#64748b", fontSize: 12 }}>Manual Text</Text>
                                      <Input
                                        value={selectedElement.text || ""}
                                        placeholder="Enter text (required)"
                                        status={
                                          !String(selectedElement.text || "").trim() ? "error" : ""
                                        }
                                        onChange={(e) =>
                                          updateElement(selectedElement.id, {
                                            text: e.target.value,
                                          })
                                        }
                                      />
                                    </>
                                  )}

                                  {selectedElement.source === "field" && (
                                    <>
                                      <Text style={{ color: "#64748b", fontSize: 12 }}>Data Field</Text>
                                      <Select
                                        style={{ width: "100%" }}
                                        value={selectedElement.field}
                                        options={fields}
                                        onChange={(value) =>
                                          updateElement(selectedElement.id, {
                                            field: value,
                                          })
                                        }
                                      />
                                    </>
                                  )}

                                  {selectedElement.source === "date" && (
                                    <>
                                      <Text style={{ color: "#64748b", fontSize: 12 }}>Date Format</Text>
                                      <Select
                                        style={{ width: "100%" }}
                                        value={selectedElement.dateFormat || "DD/MM/YY"}
                                        options={DATE_FORMATS}
                                        onChange={(value) =>
                                          updateElement(selectedElement.id, {
                                            dateFormat: value,
                                          })
                                        }
                                      />
                                    </>
                                  )}

                                  <Text style={{ color: "#64748b", fontSize: 12 }}>Font Size</Text>
                                  <InputNumber
                                    style={{ width: "100%" }}
                                    min={1}
                                    value={selectedElement.fontSize}
                                    onChange={(value) =>
                                      updateElement(selectedElement.id, {
                                        fontSize: value || 1,
                                      })
                                    }
                                  />

                                  <Button
                                    block
                                    type={selectedElement.bold ? "primary" : "default"}
                                    onClick={() =>
                                      updateElement(selectedElement.id, {
                                        bold: !selectedElement.bold,
                                      })
                                    }
                                  >
                                    {selectedElement.bold ? "Bold: ON" : "Bold: OFF"}
                                  </Button>
                                </>
                              )}

                              {selectedElement.type === "qr" && (
                              <>
                                <Text style={{ color: "#64748b", fontSize: 12 }}>Data Field</Text>
                                <Select
                                  style={{ width: "100%" }}
                                  value={selectedElement.field}
                                  options={fields}
                                  onChange={(value) =>
                                    updateElement(selectedElement.id, {
                                      field: value,
                                    })
                                  }
                                />

                                <Text style={{ color: "#64748b", fontSize: 12 }}>QR Size</Text>
                                <InputNumber
                                  style={{ width: "100%" }}
                                  min={10}
                                  value={selectedElement.size}
                                  onChange={(value) =>
                                    updateElement(selectedElement.id, {
                                      size: value || 10,
                                    })
                                  }
                                />

                                <Text style={{ color: "#64748b", fontSize: 12 }}>QR Scale</Text>
                                <InputNumber
                                  style={{ width: "100%" }}
                                  min={1}
                                  max={10}
                                  value={selectedElement.scale}
                                  onChange={(value) =>
                                    updateElement(selectedElement.id, {
                                      scale: value || 1,
                                    })
                                  }
                                />
                              </>
                            )}
                            </Space>
                          )}

                        </Space>
                      </Card>
                    </div>
                  )}
                </div>
              </div>

          </div>
        </Space>
      </Card>
    </>
  );
}
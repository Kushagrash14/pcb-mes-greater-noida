import { useState } from "react";
import {
  SettingOutlined,
  ApiOutlined,
  SafetyCertificateOutlined,
  BellOutlined,
  PrinterOutlined,
  BankOutlined,
  ProductOutlined,
  ScanOutlined,
  ApartmentOutlined,
  RollbackOutlined,
  QrcodeOutlined,
} from "@ant-design/icons";

import GeneralSettings from "./sections/GeneralSettings";
import ApiIntegrationSettings from "./sections/ApiIntegrationSettings";
import ApiSourceMapping from "./Sections/ApiSourceMapping";
import SecuritySettings from "./sections/SecuritySettings";
import NotificationSettings from "./sections/NotificationSettings";
import ManageLines from "./Sections/ManageLine.jsx";
import ManageFactories from "./Sections/ManageFactories.jsx";
import ProductionTarget from "./Sections/ProductionTarget.jsx";
import PrinterManager from "./Sections/ManagePrinters.jsx";
import CustomerQrManager from "./Sections/Customerqrmanager.jsx";
import LabelTemplateEditor from "./Sections/LabelTemplateEditor.jsx";
import ProductionSerialRuleManager from "./Sections/ProductionSerialRuleManager.jsx";
import { calc } from "antd/es/theme/internal.js";

const SECTIONS = [
  { key: "factories", label: "Manage Factories", icon: <BankOutlined />, component: ManageFactories },
  { key: "lines", label: "Manage Lines", icon: <RollbackOutlined />, component: ManageLines },
  { key: "printers", label: "Manage Printers", icon: <PrinterOutlined />, component: PrinterManager },
  { key: "productionSerialRules", label: "Production QR", icon: <ProductOutlined />, component: ProductionSerialRuleManager },
  { key: "customerQr", label: "Customer QR", icon: <ScanOutlined />, component: CustomerQrManager },
  { key: "labelTemplates", label: "Label Templates", icon: <QrcodeOutlined />, component: LabelTemplateEditor },
  { key: "notifications", label: "Notifications", icon: <BellOutlined />, component: NotificationSettings },
  { key: "security", label: "Security", icon: <SafetyCertificateOutlined />, component: SecuritySettings },
  { key: "extSource", label: "External Sources", icon: <ApartmentOutlined />, component: ApiIntegrationSettings },
  { key: "api", label: "API Integration", icon: <ApiOutlined />, component: ApiSourceMapping },
  { key: "general", label: "General", icon: <SettingOutlined />, component: GeneralSettings },
];

const Settings = () => {
  const [activeKey, setActiveKey] = useState("general");

  const ActiveComponent = SECTIONS.find((s) => s.key === activeKey)?.component || GeneralSettings;

  return (
    <div
      style={{
        padding: 10,
        minHeight: "calc(100vh - 64px)",
        background: "#F8FAFC",
      }}
    >
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
        {/* Secondary sidebar */}
        <div
          style={{
            width: 180,
            flexShrink: 0,
            background: "#fff",
            border: "1px solid #eef0f4",
            borderRadius: 10,
            padding: 8,
            boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
          }}
        >
          {SECTIONS.map((section) => {
            const isActive = section.key === activeKey;

            return (
              <div
                key={section.key}
                onClick={() => setActiveKey(section.key)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "9px 10px",
                  borderRadius: 8,
                  marginBottom: 2,
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? "#fff" : "#475569",
                  background: isActive
                    ? "linear-gradient(90deg, #5b5ce2 0%, #3b82f6 50%, #0ea5e9 100%)"
                    : "transparent",
                  boxShadow: isActive ? "0 2px 8px rgba(59,130,246,0.25)" : "none",
                  transition: "background 0.15s ease, color 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "#F8FAFC";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "transparent";
                  }
                }}
              >
                <span style={{ fontSize: 14 }}>{section.icon}</span>
                {section.label}
              </div>
            );
          })}
        </div>

        {/* Content space */}
        <div
          style={{
            flex: 1,
            background: "#ffffff",
            border: "1px solid #eef0f4",
            borderRadius: 10,
            padding: 10,
            // minHeight: 480,
            // maxHeight: 700,
            height:"87vh",
            overflowY:"auto",
            
            boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
          }}
        >
          <ActiveComponent />
        </div>
      </div>
    </div>
  );
};

export default Settings;
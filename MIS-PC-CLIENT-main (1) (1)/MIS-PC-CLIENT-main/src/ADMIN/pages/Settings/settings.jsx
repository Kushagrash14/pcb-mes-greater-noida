import { useState } from "react";
import {
  Building2,
  GitBranch,
  Printer,
  QrCode,
  ScanLine,
  Tag,
  Bell,
  ShieldCheck,
  Network,
  Plug,
  SlidersHorizontal,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

import { Tooltip } from "antd";

import GeneralSettings from "./sections/GeneralSettings";
import ApiIntegrationSettings from "./sections/ApiIntegrationSettings";
import ApiSourceMapping from "./Sections/ApiSourceMapping";
import SecuritySettings from "./sections/SecuritySettings";
import NotificationSettings from "./sections/NotificationSettings";
import ManageLines from "./Sections/ManageLine.jsx";
import ManageFactories from "./Sections/ManageFactories.jsx";
import PrinterManager from "./Sections/ManagePrinters.jsx";
import CustomerQrManager from "./Sections/Customerqrmanager.jsx";
import LabelTemplateEditor from "./Sections/LabelTemplateEditor.jsx";
import ProductionSerialRuleManager from "./Sections/ProductionSerialRuleManager.jsx";

/* Grouped like the main sidebar: a title + divider per group.
   `c` is the icon colour (icons are coloured, no boxes). */
const GROUPS = [
  {
    title: "Organization",
    items: [
      { key: "factories", label: "Manage Factories", icon: Building2, c: "#6366F1", component: ManageFactories },
      { key: "lines", label: "Manage Lines", icon: GitBranch, c: "#0891B2", component: ManageLines },
      { key: "printers", label: "Manage Printers", icon: Printer, c: "#F97316", component: PrinterManager },
    ],
  },
  {
    title: "Labels & QR",
    items: [
      { key: "productionSerialRules", label: "Production QR", icon: QrCode, c: "#8B5CF6", component: ProductionSerialRuleManager },
      { key: "customerQr", label: "Customer QR", icon: ScanLine, c: "#EC4899", component: CustomerQrManager },
      { key: "labelTemplates", label: "Label Templates", icon: Tag, c: "#F59E0B", component: LabelTemplateEditor },
    ],
  },
  {
    title: "System",
    items: [
      { key: "notifications", label: "Notifications", icon: Bell, c: "#EAB308", component: NotificationSettings },
      { key: "security", label: "Security", icon: ShieldCheck, c: "#10B981", component: SecuritySettings },
      { key: "extSource", label: "External Sources", icon: Network, c: "#3B82F6", component: ApiIntegrationSettings },
      { key: "api", label: "API Integration", icon: Plug, c: "#14B8A6", component: ApiSourceMapping },
      { key: "general", label: "General", icon: SlidersHorizontal, c: "#64748B", component: GeneralSettings },
    ],
  },
];

const ALL_ITEMS = GROUPS.flatMap((g) => g.items);

const MUTED = "#94A3B8";
const BORDER = "#EEF2F6";
const WIDTH = 196;
const WIDTH_COLLAPSED = 54;
const STORAGE_KEY = "smes-settings-nav-collapsed";

const readCollapsed = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
};

const Settings = () => {
  const [activeKey, setActiveKey] = useState("general");
  const [collapsed, setCollapsed] = useState(readCollapsed);

  const toggle = () =>
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* ignore storage errors */
      }
      return next;
    });

  const ActiveComponent =
    ALL_ITEMS.find((s) => s.key === activeKey)?.component || GeneralSettings;

  return (
    <div style={{ padding: 10, minHeight: "calc(100vh - 64px)" }}>
      <style>{`
        .smes-set-item {
          display: flex;
          align-items: center;
          gap: 10px;
          box-sizing: border-box;
          width: 100%;
          height: 34px;
          padding: 0 10px;
          margin: 0 0 2px 0;
          border: 1px solid transparent;
          border-radius: 9px;
          background: transparent;
          cursor: pointer;
          text-align: left;
          font: inherit;
          font-size: 13px;
          font-weight: 500;
          color: #475569;
          white-space: nowrap;
          overflow: hidden;
          transition: background .15s ease, color .15s ease, border-color .15s ease;
        }
        .smes-set-item:hover { background: #F8FAFC; color: #0F172A; }
        .smes-set-item.active {
          background: color-mix(in srgb, var(--c) 9%, white);
          border-color: color-mix(in srgb, var(--c) 24%, transparent);
          color: var(--c);
          font-weight: 600;
        }
        /* coloured icons, no box */
        .smes-set-item svg { flex: none; color: var(--c); }

        .smes-set-title {
          padding: 10px 10px 6px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: .09em;
          text-transform: uppercase;
          color: ${MUTED};
          white-space: nowrap;
        }
        .smes-set-divider { height: 1px; background: ${BORDER}; margin: 8px 4px 0; }
        .smes-set-gap { height: 8px; }

        .smes-set-toggle {
          display: flex; align-items: center; justify-content: center;
          width: 28px; height: 28px; padding: 0;
          border: 1px solid transparent; border-radius: 8px;
          background: transparent; color: ${MUTED}; cursor: pointer;
          transition: background .15s ease, color .15s ease, border-color .15s ease;
        }
        .smes-set-toggle:hover {
          background: #F8FAFC; color: #0F172A; border-color: ${BORDER};
        }

        /* collapsed: icon-only rows */
        .smes-set-collapsed .smes-set-item {
          justify-content: center;
          padding: 0;
        }
      `}</style>

      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        {/* Secondary sidebar (collapsible) */}
        <div
          className={collapsed ? "smes-set-collapsed" : ""}
          style={{
            width: collapsed ? WIDTH_COLLAPSED : WIDTH,
            flexShrink: 0,
            position: "sticky",
            top: 74,
            boxSizing: "border-box",
            overflow: "hidden",
            background: "#fff",
            border: `1px solid ${BORDER}`,
            borderRadius: 12,
            padding: "0 8px 8px",
            boxShadow: "0 1px 3px rgba(15,23,42,0.04)",
            transition: "width .2s ease",
          }}
        >
          {/* Header row with the collapse toggle */}
          <div
            style={{
              height: 44,
              display: "flex",
              alignItems: "center",
              justifyContent: collapsed ? "center" : "space-between",
              padding: collapsed ? 0 : "0 2px 0 10px",
            }}
          >
            {!collapsed && (
              <span style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>Settings</span>
            )}
            <Tooltip placement="right" title={collapsed ? "Expand" : "Collapse"}>
              <button
                type="button"
                className="smes-set-toggle"
                onClick={toggle}
                aria-label={collapsed ? "Expand settings menu" : "Collapse settings menu"}
              >
                {collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
              </button>
            </Tooltip>
          </div>

          {GROUPS.map((group) => (
            <div key={group.title}>
              <div className="smes-set-divider" />
              {collapsed ? (
                <div className="smes-set-gap" />
              ) : (
                <div className="smes-set-title">{group.title}</div>
              )}

              {group.items.map((section) => {
                const Icon = section.icon;
                const isActive = section.key === activeKey;

                const btn = (
                  <button
                    key={section.key}
                    type="button"
                    className={`smes-set-item${isActive ? " active" : ""}`}
                    style={{ "--c": section.c }}
                    onClick={() => setActiveKey(section.key)}
                  >
                    <Icon size={16} strokeWidth={2.1} />
                    {!collapsed && section.label}
                  </button>
                );

                return collapsed ? (
                  <Tooltip key={section.key} placement="right" title={section.label}>
                    {btn}
                  </Tooltip>
                ) : (
                  btn
                );
              })}
            </div>
          ))}
        </div>

        {/* Content space */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            background: "#ffffff",
            border: `1px solid ${BORDER}`,
            borderRadius: 12,
            padding: 10,
            height: "calc(100vh - 64px - 20px)",
            overflowY: "auto",
            boxShadow: "0 1px 3px rgba(15,23,42,0.04)",
          }}
        >
          <ActiveComponent />
        </div>
      </div>
    </div>
  );
};

export default Settings;
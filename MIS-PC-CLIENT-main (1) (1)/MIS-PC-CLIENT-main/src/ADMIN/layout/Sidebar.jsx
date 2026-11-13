import {
  LayoutGrid,
  Factory,
  Workflow,
  ClipboardList,
  PackageCheck,
  History,
  Layers,
  Package,
  ListOrdered,
  Wrench,
  BadgeCheck,
  Users,
  FileText,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { Tooltip } from "antd";
import { useNavigate, useLocation } from "react-router-dom";

import Logo from "../../assets/logos/pg-logo.png";

/* ---------------- Navigation config ----------------
   Flat sections, no collapsing. Each section has a title and
   a divider above it. `c` is the icon colour (section default,
   an item can override it).
------------------------------------------------------ */

const sections = [
  {
    title: "Overview",
    items: [
      { key: "/admin/dashboard", icon: LayoutGrid, label: "Dashboard", c: "#6366F1" },
      { key: "/admin/production", icon: Factory, label: "Production", c: "#F97316" },
    ],
  },
  {
    title: "Tracking",
    c: "#0891B2",
    items: [
      { key: "/admin/tracking/product-stage", icon: Workflow, label: "Production Flow" },
      { key: "/admin/tracking/production-order", icon: ClipboardList, label: "Production Order" },
      { key: "/admin/tracking/manage-packaging", icon: PackageCheck, label: "Packaging Manager" },
      { key: "/admin/tracking/scan-history", icon: History, label: "Scan History" },
    ],
  },
  {
    title: "Masters",
    c: "#8B5CF6",
    items: [
      { key: "/admin/masters/categories", icon: Layers, label: "Manage Category" },
      { key: "/admin/masters/products", icon: Package, label: "Manage Products" },
      { key: "/admin/masters/stages", icon: ListOrdered, label: "Manage Stages" },
      { key: "/admin/masters/rework-stations", icon: Wrench, label: "Rework Stations" },
    ],
  },
  {
    title: "Management",
    items: [
      { key: "/admin/quality", icon: BadgeCheck, label: "Quality Control", c: "#10B981" },
      { key: "/admin/users", icon: Users, label: "Users", c: "#EC4899" },
      { key: "/admin/reports", icon: FileText, label: "Reports", c: "#F59E0B" },
      { key: "/admin/settings", icon: Settings, label: "Settings", c: "#64748B" },
    ],
  },
];

/* ---------------- Theme tokens ---------------- */

const ACCENT = "#0891B2";
const TEXT_STRONG = "#0F172A";
const MUTED = "#94A3B8";
const BORDER = "#EEF2F6";

/* ---------------- Component ----------------
   Props:
     collapsed  boolean
     onToggle   () => void          (optional, shows the collapse button)
     onLogout   () => void
     user       { name?, email?, role? }   (optional, shown in the footer)
---------------------------------------------- */

const Sidebar = ({ collapsed, onToggle, onLogout, user = {} }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const displayName = user.name || user.email ||  "User";
  const initial = displayName.trim().charAt(0).toUpperCase();

  const renderItem = (item, sectionColor) => {
    const Icon = item.icon;
    const active = pathname === item.key || pathname.startsWith(item.key + "/");
    const c = item.c || sectionColor || "#64748B";

    const btn = (
      <button
        key={item.key}
        type="button"
        className={`smes-item${active ? " active" : ""}`}
        style={{ "--c": c }}
        onClick={() => navigate(item.key)}
      >
        <span className="smes-ico">
          <Icon size={14} strokeWidth={2.1} />
        </span>
        {!collapsed && <span className="smes-label">{item.label}</span>}
      </button>
    );

    return collapsed ? (
      <Tooltip key={item.key} placement="right" title={item.label}>
        {btn}
      </Tooltip>
    ) : (
      btn
    );
  };

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "#FFFFFF",
        boxShadow: "0 0 24px rgba(15,23,42,0.05)",
        scrollbarWidth: "thin",
        scrollbarColor: "#E2E8F0 transparent",
      }}
    >
      <style>{`
        /* ---------- Rows ---------- */
        .smes-item {
          display: flex;
          align-items: center;
          gap: 10px;
          box-sizing: border-box;
          width: 100%;
          height: 34px;
          padding: 0 8px;
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
          transition: background .15s ease, color .15s ease, border-color .15s ease;
        }
        .smes-item:hover {
          background: #F8FAFC;
          color: ${TEXT_STRONG};
        }
        .smes-item.active {
          background: color-mix(in srgb, var(--c) 9%, white);
          border-color: color-mix(in srgb, var(--c) 24%, transparent);
          color: var(--c);
          font-weight: 600;
        }
        .smes-label {
          flex: 1;
          min-width: 0;
          white-space: nowrap;
          overflow: hidden;
          
          text-overflow: ellipsis;
        }

        /* ---------- Icon box ---------- */
        .smes-ico {
          flex: none;
          box-sizing: border-box;
          width: 24px;
          height: 24px;
          border-radius: 7px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: var(--c);
          background: color-mix(in srgb, var(--c) 12%, white);
          border: 1px solid color-mix(in srgb, var(--c) 22%, white);
          transition: background .15s ease, color .15s ease, box-shadow .15s ease;
        }
        .smes-item.active .smes-ico {
          background: var(--c);
          border-color: var(--c);
          color: #fff;
          box-shadow: 0 2px 6px color-mix(in srgb, var(--c) 35%, transparent);
        }

        /* ---------- Section title + divider ---------- */
        .smes-divider {
          height: 1px;
          background: ${BORDER};
          margin: 8px 4px 0;
        }
        .smes-section {
          padding: 10px 8px 6px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: .09em;
          text-transform: uppercase;
          color: ${MUTED};
        }
        .smes-section-gap { height: 8px; }

        /* ---------- Collapsed ---------- */
        .smes-collapsed .smes-item {
          justify-content: center;
          padding: 0;
        }

        /* ---------- Header collapse button ---------- */
        .smes-collapse-btn {
          display: flex; align-items: center; justify-content: center;
          width: 26px; height: 26px;
          border: none; background: transparent;
          border-radius: 8px; cursor: pointer;
          color: ${MUTED};
          transition: background .15s ease, color .15s ease;
        }
        .smes-collapse-btn:hover { background: #F1F5F9; color: ${TEXT_STRONG}; }

        /* ---------- Footer ---------- */
        .smes-logout {
          display: flex; align-items: center; justify-content: center; gap: 6px;
          box-sizing: border-box;
          width: 100%; height: 32px;
          border: 1px solid #FECACA; border-radius: 8px;
          background: #FEF2F2; color: #DC2626;
          font: inherit; font-size: 12.5px; font-weight: 600;
          cursor: pointer;
          transition: background .15s ease, border-color .15s ease;
        }
        .smes-logout:hover { background: #FEE2E2; border-color: #FCA5A5; }
      `}</style>

      {/* ---------- Header ---------- */}
      <div
        style={{
          height: 56,
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "space-between",
          padding: collapsed ? 0 : "0 12px 0 14px",
          borderBottom: `1px solid ${BORDER}`,
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              border: `1px solid ${ACCENT}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              background: "#fff",
            }}
          >
            <img
              src={Logo}
              alt="PG Technoplast pvt ltd"
              style={{ width: 24, height: 24, objectFit: "contain" }}
            />
          </div>

          {!collapsed && (
            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.25, minWidth: 0 }}>
              <span style={{ color: TEXT_STRONG, fontSize: 14, fontWeight: 700 }}>SMES</span>
              <span
                style={{
                  color: MUTED,
                  fontSize: 9.5,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                Smart Manufacturing Execution System
              </span>
            </div>
          )}
        </div>

        {!collapsed && onToggle && (
          <button className="smes-collapse-btn" onClick={onToggle} aria-label="Collapse sidebar">
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      {/* ---------- Navigation ---------- */}
      <nav
        className={collapsed ? "smes-collapsed" : ""}
        style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "0 10px 8px" }}
      >
        {sections.map((section, i) => (
          <div key={section.title}>
            {i > 0 && <div className="smes-divider" />}
            {collapsed ? (
              <div className="smes-section-gap" />
            ) : (
              <div className="smes-section">{section.title}</div>
            )}
            {section.items.map((item) => renderItem(item, section.c))}
          </div>
        ))}
      </nav>

      {/* ---------- Footer: user + logout ---------- */}
      <div style={{ borderTop: `1px solid ${BORDER}`, padding: 10, flexShrink: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "flex-start",
            gap: 10,
            marginBottom: 8,
          }}
        >
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#E0F5FA",
              color: ACCENT,
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            {initial}
          </div>
          {!collapsed && (
            <div style={{ display: "flex", flexDirection: "column", minWidth: 0, lineHeight: 1.25 }}>
              <span
                style={{
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: TEXT_STRONG,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {displayName}
              </span>
              {user.role && <span style={{ fontSize: 10.5, color: MUTED }}>{user.role}</span>}
            </div>
          )}
        </div>

        {collapsed ? (
          <Tooltip placement="right" title="Logout">
            <button className="smes-logout" onClick={onLogout} aria-label="Logout">
              <LogOut size={14} />
            </button>
          </Tooltip>
        ) : (
          <button className="smes-logout" onClick={onLogout}>
            <LogOut size={14} />
            Logout
          </button>
        )}

        {collapsed && onToggle && (
          <div style={{ display: "flex", justifyContent: "center", marginTop: 8 }}>
            <button className="smes-collapse-btn" onClick={onToggle} aria-label="Expand sidebar">
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
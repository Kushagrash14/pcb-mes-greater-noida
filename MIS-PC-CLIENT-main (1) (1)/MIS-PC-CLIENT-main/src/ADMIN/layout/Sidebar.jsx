import {
  LayoutDashboard,
  Factory,
  ScanSearch,
  Users,
  Database,
  FileText,
  Settings,
  LogOut,
  ShieldCheck,
} from "lucide-react";

import { Menu } from "antd";
import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

import Logo from "../../assets/logos/pg-logo.png";

const menuConfig = [
  { key: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { key: "/admin/production", icon: Factory, label: "Production" },
  { key: "/admin/tracking", icon: ScanSearch, label: "Tracking",
      children: [
      { key: "/admin/tracking/product-stage", label: "Production Flow"},
      // { key: "/admin/tracking/scan-stage", label: "Scan Stage Flow"},
      { key: "/admin/tracking/production-order", label: "Production Order"},
      { key: "/admin/tracking/manage-packaging", label: "Packaging Manager"},
      { key: "/admin/tracking/scan-history", label: "Scan History"},
    ],
   },
  { key: "/admin/masters", icon: Database, label: "Masters",
    children: [
      { key: "/admin/masters/categories", label: "Manage Category"},
      { key: "/admin/masters/products",label: "Manage Products"},
      { key: "/admin/masters/stages", label: "Manage Stages" },
      { key: "/admin/masters/rework-stations", label: "Rework Stations" },
      // { key: "/admin/masters/items", label: "Manage Items" },
      // { key: "/admin/masters/item-fields",label: "Manage Item Field"},
      // { key: "/admin/masters/pd-fields",label: "Manage Pd Field"},
      // { key: "/admin/masters/lines", label: "Manage Lines" },
      // { key: "/admin/masters/models", label: "Manage Models" },
      // { key: "/admin/masters/qr-master", label: "Manage QR" },
    ],
  },
  {
    key: "/admin/quality",
    icon: ShieldCheck,
    label: "Quality Control",
  },
  { key: "/admin/users", icon: Users, label: "Users" },
  { key: "/admin/reports", icon: FileText, label: "Reports" },
  { key: "/admin/settings", icon: Settings, label: "Settings" },
];

const buildItems = (config) =>
  config.map((item) => {
    const Icon = item.icon;
    const base = {
      key: item.key,
      icon: Icon ? <Icon size={17} strokeWidth={2} /> : null,
      label: item.label,
    };
    if (item.children) {
      base.children = item.children.map((child) => ({
        key: child.key,
        label: (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
      position: "relative",
    }}
  >
    <div
      style={{
        position: "absolute",
        left: -14,
        top: -12,
        bottom: -12,
        width: 1,
        background: "#E2E8F0",
      }}
    />

    <span
      style={{
        width: 6,
        height: 6,
        borderRadius: "50%",
        background: "#94A3B8",
        flexShrink: 0,
      }}
    />

    <span>{child.label}</span>
  </div>
)
      }));
    }
    return base;
  });

const items = buildItems(menuConfig);

const Sidebar = ({ collapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const parentKeyForPath = () => menuConfig.find(
      (item) => item.children && location.pathname.startsWith(item.key)
    )?.key;

  const [openKeys, setOpenKeys] = useState(
    parentKeyForPath() ? [parentKeyForPath()] : []
  );

  useEffect(() => {
    const key = parentKeyForPath();
    if (key) setOpenKeys([key]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const handleClick = ({ key }) => navigate(key);

  const handleOpenChange = (keys) => {
    const latest = keys.find((k) => !openKeys.includes(k));
    setOpenKeys(latest ? [latest] : []);
  };

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "#FFFFFF",
      }}
    >
      <style>{`
        .simse-sidebar-menu.ant-menu {
          border-inline-end: none !important;
          background: transparent;
          padding: 14px 12px;
        }
        .simse-sidebar-menu .ant-menu-item,
        .simse-sidebar-menu .ant-menu-submenu-title {
          height: 40px !important;
          line-height: 40px !important;
          border-radius: 10px !important;
          margin: 0 0 4px 0 !important;
          width: 100% !important;
          font-size: 13px;
          font-weight: 500;
          color: #64748B;
          padding-inline: 12px !important;
          transition: background .15s ease, color .15s ease;
        }
        .simse-sidebar-menu .ant-menu-item:hover,
        .simse-sidebar-menu .ant-menu-submenu-title:hover {
          background: #F8FAFC !important;
          color: #0F172A !important;
        }
        .simse-sidebar-menu .ant-menu-item-selected {
          background: linear-gradient(90deg, #5b5ce2 0%, #3b82f6 50%, #0ea5e9 100%) !important;
          color: #fff !important;
          box-shadow: 0 2px 8px rgba(59,130,246,0.25);
        }
        .simse-sidebar-menu .ant-menu-item-selected svg {
          color: #fff !important;
        }
        .simse-sidebar-menu .ant-menu-submenu-open > .ant-menu-submenu-title {
          background: #F8FAFC !important;
          color: #111827 !important;
          font-weight: 600;
        }
        .simse-sidebar-menu .ant-menu-sub.ant-menu-inline {
          background: transparent !important;
        }
        .simse-sidebar-menu .ant-menu-sub .ant-menu-item {
          height: 34px !important;
          line-height: 34px !important;
          font-size: 12.5px;
          padding-inline-start: 42px !important;
          color: #64748B;
        }
        .simse-sidebar-menu .ant-menu-sub .ant-menu-item:hover {
          background: #F8FAFC !important;
          color: #0F172A !important;
        }
        .simse-sidebar-menu .ant-menu-sub .ant-menu-item-selected {
            background: linear-gradient(90deg, rgba(91,92,226,0.1) 0%, rgba(14,165,233,0.1) 100%) !important;
            color: #3b5ce2 !important;
            border-left: 3px solid #3b82f6;
            font-weight: 600;
        }
        .simse-logout {
          display: flex;
          align-items: center;
          height: 40px;
          border-radius: 10px;
          cursor: pointer;
          color: #EF4444;
          font-size: 13px;
          font-weight: 500;
          transition: background .18s ease;
        }
        .simse-logout:hover { background: #FEF2F2; }

        .simse-sidebar-menu .ant-menu-sub {
            animation: fadeMenu .25s ease;
        }

        @keyframes fadeMenu {

            from{
                opacity:0;
                transform:translateY(-6px);
            }

            to{
                opacity:1;
                transform:translateY(0);
            }

        }

        .simse-sidebar-menu .ant-menu-submenu-arrow {
            transition: transform .35s cubic-bezier(.4,0,.2,1);
        }
      `}</style>

      {/* Logo */}
      <div
        style={{
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "flex-start",
          padding: collapsed ? 0 : "0 16px",
          borderBottom: "1px solid #F1F5F9",
        }}
      >
        <img
          src={Logo}
          alt="PG Technoplast pvt ltd"
          style={{ width: 60, height: 60, borderRadius: 7, objectFit: "contain" }}
        />
        {!collapsed && (
          <div style={{ marginLeft: 10, display: "flex", flexDirection: "column", borderLeft:"1px solid red", paddingLeft: 10 }}>
            <span style={{ color: "#0F172A", fontSize: 18, fontWeight: 700, letterSpacing: .2 }}>
              SMES
            </span>
            <span style={{ color: "#94A3B8", fontSize: 10 }}>Smart Manufacturing Execution System</span>
          </div>
        )}
      </div>

      {/* Menu */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        <Menu
          className="simse-sidebar-menu"
          mode="inline"
          inlineCollapsed={collapsed}
          selectedKeys={[location.pathname]}
          openKeys={collapsed ? [] : openKeys}
          onOpenChange={handleOpenChange}
          onClick={handleClick}
          items={items}
        />
      </div>

      {/* Logout */}
      <div style={{ padding: "12px", borderTop: "1px solid #F1F5F9" }}>
        <div
          className="simse-logout"
          style={{
            justifyContent: collapsed ? "center" : "flex-start",
            gap: 11,
            padding: collapsed ? 0 : "0 12px",
          }}
        >
          <LogOut size={17} strokeWidth={2} />
          {!collapsed && <span>Logout</span>}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
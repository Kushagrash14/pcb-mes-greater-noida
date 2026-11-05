// src/User/layout/Sidebar/Sidebar.jsx
import React from "react";
import { Layout, Menu, Typography } from "antd";
import {
  DashboardOutlined,
  AppstoreOutlined,
  FileTextOutlined,
  SettingOutlined,
  LeftOutlined,
  RightOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";

const { Sider } = Layout;
const { Text } = Typography;

// -------------------------------------------------------------
// Menu config: edit `key` (route path) and `label` as per your
// actual routes under /user/*
// -------------------------------------------------------------
const menuItems = [
  {
    key: "/user/dashboard",
    icon: <DashboardOutlined />,
    label: "Dashboard",
  },
  {
    key: "/user/workspace",
    icon: <AppstoreOutlined />,
    label: "Workspace",
  },
  {
    key: "/user/reports",
    icon: <FileTextOutlined />,
    label: "Reports",
  },
  {
    key: "/user/settings",
    icon: <SettingOutlined />,
    label: "Settings",
  },
];

export default function Sidebar({ collapsed, setCollapsed }) {
  const navigate = useNavigate();
  const location = useLocation();

  // highlight the menu item whose key best matches current path
  const selectedKey =
    menuItems.find((item) => location.pathname.startsWith(item.key))?.key ||
    menuItems[0].key;

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      width={230}
      collapsedWidth={72}
      style={{
        background: "#fafbfc",
        borderRight: "1px solid #e3e8ef",
        position: "sticky",
        top: 0,
        left: 0,
        height: "100vh",
      }}
    >
      {/* Logo / App mark */}
      <div
        style={{
          height: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "flex-start",
          padding: collapsed ? 0 : "0 20px",
          borderBottom: "1px solid #e3e8ef",
          gap: 10,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: "rgba(232,163,61,0.15)",
            border: "1px solid rgba(232,163,61,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#c9820a",
            fontWeight: 700,
            fontSize: 12,
            flexShrink: 0,
          }}
        >
          MIS
        </div>
        {!collapsed && (
          <Text style={{ color: "#1b2430", fontWeight: 600, fontSize: 14 }}>
            User Workspace
          </Text>
        )}
      </div>

      <Menu
        theme="light"
        mode="inline"
        selectedKeys={[selectedKey]}
        items={menuItems}
        onClick={({ key }) => navigate(key)}
        style={{ background: "transparent", borderInlineEnd: "none", marginTop: 8 }}
      />

      {/* Collapse toggle */}
      <div
        onClick={() => setCollapsed(!collapsed)}
        style={{
          position: "absolute",
          bottom: 16,
          left: collapsed ? "50%" : 20,
          transform: collapsed ? "translateX(-50%)" : "none",
          width: 32,
          height: 32,
          borderRadius: 8,
          background: "#ffffff",
          border: "1px solid #e3e8ef",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#64748b",
          cursor: "pointer",
        }}
      >
        {collapsed ? <RightOutlined /> : <LeftOutlined />}
      </div>
    </Sider>
  );
}
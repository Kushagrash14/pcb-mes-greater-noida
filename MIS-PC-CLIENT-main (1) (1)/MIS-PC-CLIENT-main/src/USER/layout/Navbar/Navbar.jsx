import React from "react";
import { Layout, Input, Badge, Avatar, Dropdown, Space, Typography, Divider, message } from "antd";
import {
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  SearchOutlined,
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom"; // adjust if you use a different router
import { useAuth } from "../../../Authentication/context/AuthContext";

const { Header } = Layout;
const { Text, Title } = Typography;

const LOGO_URL = "https://cms-complaint-avidence.s3.eu-north-1.amazonaws.com/pg-logo-Photoroom.png";

export default function Navbar({ collapsed, setCollapsed, userName = "User" }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const displayName = user?.name || userName || "User";
  const assignedStage = user?.assignedStage;

  const handleLogout = async () => {
    try {
      await logout();
      message.success("Logged out successfully");
      navigate("/login"); // adjust to your actual login route
    } catch (err) {
      message.error("Something went wrong while logging out");
    }
  };

  const profileMenu = {
    items: [
      { key: "profile", icon: <UserOutlined />, label: "My Profile" },
      { key: "settings", icon: <SettingOutlined />, label: "Settings" },
      { type: "divider" },
      { key: "logout", icon: <LogoutOutlined />, label: "Logout", danger: true },
    ],
    onClick: ({ key }) => {
      if (key === "logout") handleLogout();
      // TODO: hook up "profile" / "settings" navigation as needed
    },
  };

  return (
    <Header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px",
        background: "#ffffff",
        borderBottom: "1px solid #e3e8ef",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}
    >
      {/* Left: logo + title */}
      <Space size={12} align="center">
        <img src={LOGO_URL} alt="PG logo" style={{ height: 30 }} />
        <Divider type="vertical" style={{ height: 30, margin: "0 4px" }} />
        <Space direction="vertical" size={0}>
          <Title level={5} style={{ margin: 0, color: "#1b2430", lineHeight: 1.2 }}>
            SMES
          </Title>
          <Title
            level={5}
            style={{ margin: 0, color: "#ee331e", fontSize: 11, fontWeight: 400, lineHeight: 1.2 }}
          >
            Smart Manufacturing Execution System
          </Title>
        </Space>
      </Space>

      {/* Right: profile dropdown with name/stage */}
      <Space size={20} align="center">
        <Dropdown menu={profileMenu} trigger={["click"]} placement="bottomRight">
          <Space
            size={6}
            align="center"
            style={{
              paddingLeft: 14,
              borderLeft: "1px solid #e3e8ef",
              cursor: "pointer",
            }}
          >
            <UserOutlined style={{ fontSize: 16, color: "#3a6d95" }} />
            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
              <Text strong style={{ color: "#1b2430", fontSize: 13 }}>
                {displayName}
              </Text>
              {assignedStage != null && (
                <Text type="secondary" style={{ fontSize: 11 }}>
                  Stage {assignedStage}
                </Text>
              )}
            </div>
          </Space>
        </Dropdown>
      </Space>
    </Header>
  );
}
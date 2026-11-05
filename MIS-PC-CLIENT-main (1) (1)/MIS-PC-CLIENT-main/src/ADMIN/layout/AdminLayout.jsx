import { Layout } from "antd";
import { Outlet } from "react-router-dom";
import { useState } from "react";

import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

const { Sider, Header, Content } = Layout;

const SIDEBAR_WIDTH = 210;
const SIDEBAR_COLLAPSED_WIDTH = 72;
const HEADER_HEIGHT = 64;

const AdminLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const toggleSidebar = () => setCollapsed(!collapsed);

  const sidebarWidth = collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH;

  return (
    <Layout style={{ minHeight: "100vh", background: "#F8FAFC" }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={SIDEBAR_WIDTH}
        collapsedWidth={SIDEBAR_COLLAPSED_WIDTH}
        style={{
          background: "#fff",
          borderRight: "1px solid #F1F5F9",
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 110,
          overflow: "hidden",
        }}
      >
        <Sidebar collapsed={collapsed} />
      </Sider>

      <Layout
        style={{
          marginLeft: sidebarWidth,
          transition: "margin-left .2s ease",
          background: "#F8FAFC",
        }}
      >
        <Header
          style={{
            background: "#ffffff",
            height: HEADER_HEIGHT,
            lineHeight: `${HEADER_HEIGHT}px`,
            padding: "0 22px",
            display: "flex",
            alignItems: "center",
            borderBottom: "1px solid #F1F5F9",
            position: "fixed",
            top: 0,
            left: sidebarWidth,
            right: 0,
            zIndex: 100,
            transition: "left .2s ease",
          }}
        >
          <Navbar collapsed={collapsed} toggleSidebar={toggleSidebar} />
        </Header>

        <Content
          style={{
            marginTop: HEADER_HEIGHT,
            padding: 0,
            background: "#F8FAFC",
            minHeight: `calc(100vh - ${HEADER_HEIGHT}px)`,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;
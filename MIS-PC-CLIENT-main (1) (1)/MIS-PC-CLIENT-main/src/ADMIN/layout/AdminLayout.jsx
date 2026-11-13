import { Layout, message } from "antd";
import { Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";

import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { useAuth } from "../../Authentication/context/AuthContext";

const { Sider, Header, Content } = Layout;

const SIDEBAR_WIDTH = 210;
const SIDEBAR_COLLAPSED_WIDTH = 72;
const HEADER_HEIGHT = 64;

// Very light page gradient: cool grey -> faint sky blue -> faint lavender.
// To tone it down, move the colours closer to #F8FAFC; to remove it, use "#F8FAFC".
const PAGE_BG =
  "linear-gradient(135deg, #F8FAFC 0%, #EEF6FB 45%, #F4F1FF 100%)";

const AdminLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const toggleSidebar = () => setCollapsed(!collapsed);
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const sidebarWidth = collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH;

  // The new Sidebar has its own Logout button and needs this handler
  const handleLogout = async () => {
    try {
      await logout();
      message.success("Logged out successfully");
      navigate("/login"); // adjust to your actual login route
    } catch (err) {
      message.error("Something went wrong while logging out");
    }
  };

  return (
    <Layout style={{ minHeight: "100vh", background: PAGE_BG, backgroundAttachment: "fixed" }}>
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
        <Sidebar collapsed={collapsed} onLogout={handleLogout} user={user || {}} />
      </Sider>

      <Layout
        style={{
          marginLeft: sidebarWidth,
          transition: "margin-left .2s ease",
          background: PAGE_BG,
          backgroundAttachment: "fixed",
        }}
      >
        <Header
          style={{
            // slightly see-through so the gradient shows under the header
            background: "rgb(255, 255, 255)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            height: HEADER_HEIGHT,
            lineHeight: `${HEADER_HEIGHT}px`,
            padding: "0 22px",
            display: "flex",
            alignItems: "center",
            borderBottom: "1px solid #EEF2F6",
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
            background: "transparent",
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
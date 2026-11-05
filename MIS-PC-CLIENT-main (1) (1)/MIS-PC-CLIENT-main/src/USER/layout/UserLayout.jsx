// src/User/layout/UserLayout.jsx
// -------------------------------------------------------------
// Main shell for the "second floor" - User Workspace.
// Combines Sidebar + Navbar + Content(Outlet).
//
// Usage in your router (e.g. App.jsx):
//
//   <Route path="/user" element={<UserLayout />}>
//     <Route path="dashboard" element={<UserDashboard />} />
//     <Route path="workspace" element={<UserWorkspace />} />
//     <Route path="reports" element={<UserReports />} />
//     <Route path="settings" element={<UserSettings />} />
//   </Route>
//
// -------------------------------------------------------------
import React, { useState } from "react";
import { Layout } from "antd";
import Sidebar from "./Sidebar/Sidebar";
import Navbar from "./Navbar/Navbar";
import Content from "./Content/Content";

export default function UserLayout({ userName, onLogout }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Layout style={{ minHeight: "100vh", background: "#f4f6f9" }}>
      {/* <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} /> */}
      <Layout>
        <Navbar
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          userName={userName}
          onLogout={onLogout}
        />
        <Content />
      </Layout>
    </Layout>
  );
}
// src/User/layout/Content/Content.jsx
import React from "react";
import { Layout, Breadcrumb } from "antd";
import { Outlet, useLocation, Link } from "react-router-dom";

const { Content: AntContent } = Layout;

// Turns "/user/workspace/reports" into
// [ { title: "User" }, { title: "Workspace" }, { title: "Reports" } ]
function buildBreadcrumb(pathname) {
  const parts = pathname.split("/").filter(Boolean);
  return parts.map((part, idx) => ({
    title: part.charAt(0).toUpperCase() + part.slice(1),
    path: "/" + parts.slice(0, idx + 1).join("/"),
  }));
}

export default function Content() {
  const location = useLocation();
  const crumbs = buildBreadcrumb(location.pathname);

  return (
    <AntContent
      style={{
        margin: "10px 10px",
        minHeight: "calc(100vh - 60px - 50px)",
      }}
    >

      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e3e8ef",
          borderRadius: 12,
          padding: 15,
          minHeight: 580,
        }}
      >
        {/* Nested /user/* route pages render here */}
        <Outlet />
      </div>
    </AntContent>
  );
}
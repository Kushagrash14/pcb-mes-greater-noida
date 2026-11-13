import {
  ChevronsLeft,
  ChevronsRight,
  ChevronRight,
  ChevronDown,
  UserRound,
  KeyRound,
  LogOut,
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
} from "lucide-react";

import { Dropdown, message } from "antd";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../Authentication/context/AuthContext";

/* ---------------- Route map ----------------
   crumbs = [section?, page]   icon / c = shown on the current-page chip
   (same icons and colours as the sidebar)
-------------------------------------------- */

const TRACK = "#0891B2";
const MASTER = "#8B5CF6";

const routes = [
  { key: "/admin/dashboard", crumbs: ["Dashboard"], icon: LayoutGrid, c: "#6366F1" },
  { key: "/admin/production", crumbs: ["Production"], icon: Factory, c: "#F97316" },
  { key: "/admin/tracking/product-stage", crumbs: ["Tracking", "Production Flow"], icon: Workflow, c: TRACK },
  { key: "/admin/tracking/production-order", crumbs: ["Tracking", "Production Order"], icon: ClipboardList, c: TRACK },
  { key: "/admin/tracking/manage-packaging", crumbs: ["Tracking", "Packaging Manager"], icon: PackageCheck, c: TRACK },
  { key: "/admin/tracking/scan-history", crumbs: ["Tracking", "Scan History"], icon: History, c: TRACK },
  { key: "/admin/masters/categories", crumbs: ["Masters", "Manage Category"], icon: Layers, c: MASTER },
  { key: "/admin/masters/products", crumbs: ["Masters", "Manage Products"], icon: Package, c: MASTER },
  { key: "/admin/masters/stages", crumbs: ["Masters", "Manage Stages"], icon: ListOrdered, c: MASTER },
  { key: "/admin/masters/rework-stations", crumbs: ["Masters", "Rework Stations"], icon: Wrench, c: MASTER },
  { key: "/admin/quality", crumbs: ["Quality Control"], icon: BadgeCheck, c: "#10B981" },
  { key: "/admin/users", crumbs: ["Users"], icon: Users, c: "#EC4899" },
  { key: "/admin/reports", crumbs: ["Reports"], icon: FileText, c: "#F59E0B" },
  { key: "/admin/settings", crumbs: ["Settings"], icon: Settings, c: "#64748B" },
];

const resolveRoute = (pathname) => {
  // longest matching route wins (handles /admin/users/123 etc.)
  const match = routes
    .filter((r) => pathname === r.key || pathname.startsWith(r.key + "/"))
    .sort((a, b) => b.key.length - a.key.length)[0];
  if (match) return match;

  const last = pathname.split("/").filter(Boolean).pop() || "Dashboard";
  return {
    crumbs: [last.replace(/-/g, " ").replace(/\b\w/g, (ch) => ch.toUpperCase())],
    icon: LayoutGrid,
    c: "#64748B",
  };
};

const ACCENT = "#0891B2";
const TEXT_STRONG = "#0F172A";
const MUTED = "#94A3B8";

const Navbar = ({ collapsed, toggleSidebar }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const route = resolveRoute(location.pathname);
  const PageIcon = route.icon;
  const parents = ["Admin", ...route.crumbs.slice(0, -1)];
  const currentLabel = route.crumbs[route.crumbs.length - 1];

  const displayName = user?.name || user?.email || "Admin";
  const displayRole = user?.role || "System Administrator";
  const initial = displayName.trim().charAt(0).toUpperCase();

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
      { key: "profile", icon: <UserRound size={14} />, label: "My Profile" },
      { key: "password", icon: <KeyRound size={14} />, label: "Change Password" },
      { type: "divider" },
      { key: "logout", danger: true, icon: <LogOut size={14} />, label: "Logout" },
    ],
    onClick: ({ key }) => {
      if (key === "logout") handleLogout();
      // TODO: hook up "profile" / "password" navigation as needed
    },
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0 4px",
      }}
    >
      <style>{`
        /* The antd Header sets a large line-height (64px) that every child
           inherits, which stretched the breadcrumb. Reset it here. */
        .smes-crumbs, .smes-crumbs * {
          box-sizing: border-box;
          line-height: 1;
        }

        .smes-nav-btn {
          display: flex; align-items: center; justify-content: center;
          width: 34px; height: 34px; padding: 0;
          border: 1px solid #E8EDF3; border-radius: 10px;
          background: #fff; color: #64748B; cursor: pointer;
          transition: background .15s ease, color .15s ease, border-color .15s ease, box-shadow .15s ease;
        }
        .smes-nav-btn:hover {
          background: #F8FAFC; color: ${TEXT_STRONG};
          border-color: #DDE4EC;
          box-shadow: 0 1px 4px rgba(15,23,42,0.06);
        }

        .smes-crumbs {
          display: inline-flex; align-items: center; gap: 4px;
          height: 34px; padding: 0 5px 0 12px;
          border: 1px solid #EEF2F6; border-radius: 999px;
          background: #FAFBFD;
          font-size: 12px; color: ${MUTED};
        }
        .smes-crumb-link {
          display: inline-flex; align-items: center;
          height: 22px; margin: 0; padding: 0 6px;
          border: none; border-radius: 6px; background: transparent;
          font: inherit; font-size: 12px; font-weight: 500; color: #64748B;
          cursor: pointer;
          transition: color .15s ease, background .15s ease;
        }
        .smes-crumb-link:hover { color: ${TEXT_STRONG}; background: #F1F5F9; }
        .smes-crumb-link.static { cursor: default; }
        .smes-crumb-link.static:hover { background: transparent; color: #64748B; }

        /* current page chip: coloured icon + page name */
        .smes-crumb-current {
          display: inline-flex; align-items: center; gap: 7px;
          height: 26px; padding: 0 12px 0 3px;
          border-radius: 999px;
          background: color-mix(in srgb, var(--c) 10%, white);
          border: 1px solid color-mix(in srgb, var(--c) 24%, white);
          color: var(--c);
          font-size: 12.5px; font-weight: 600;
          white-space: nowrap;
        }
        .smes-crumb-ico {
          width: 20px; height: 20px; border-radius: 50%;
          display: inline-flex; align-items: center; justify-content: center;
          background: var(--c); color: #fff;
          box-shadow: 0 2px 5px color-mix(in srgb, var(--c) 35%, transparent);
        }

        .smes-profile {
          display: flex; align-items: center; gap: 10px;
          padding: 4px 8px 4px 4px;
          border: 1px solid transparent; border-radius: 12px;
          cursor: pointer;
          transition: background .15s ease, border-color .15s ease;
        }
        .smes-profile:hover, .smes-profile.open {
          background: #F8FAFC; border-color: #EEF2F6;
        }
        .smes-avatar {
          width: 34px; height: 34px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          background: linear-gradient(135deg, #5b5ce2 0%, #3b82f6 55%, #0ea5e9 100%);
          color: #fff; font-size: 14px; font-weight: 700;
          box-shadow: 0 0 0 2px #fff, 0 0 0 3px #DBEAFE;
        }
        .smes-chev { transition: transform .2s ease; }
        .smes-profile.open .smes-chev { transform: rotate(180deg); }
      `}</style>

      {/* ---------- Left ---------- */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <button
          type="button"
          className="smes-nav-btn"
          onClick={toggleSidebar}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronsRight size={17} /> : <ChevronsLeft size={17} />}
        </button>

        <nav className="smes-crumbs" aria-label="Breadcrumb">
          {parents.map((label, i) => (
            <span key={label + i} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <button
                type="button"
                className={`smes-crumb-link${i === 0 ? "" : " static"}`}
                onClick={() => i === 0 && navigate("/admin/dashboard")}
              >
                {label}
              </button>
              <ChevronRight size={12} color="#CBD5E1" />
            </span>
          ))}

          <span className="smes-crumb-current" style={{ "--c": route.c }}>
            <span className="smes-crumb-ico">
              <PageIcon size={11} strokeWidth={2.4} />
            </span>
            {currentLabel}
          </span>
        </nav>
      </div>

      {/* ---------- Right ---------- */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 1, height: 26, background: "#EEF2F6" }} />

        <Dropdown
          menu={profileMenu}
          trigger={["click"]}
          placement="bottomRight"
          onOpenChange={setMenuOpen}
        >
          <div className={`smes-profile${menuOpen ? " open" : ""}`}>
            <div className="smes-avatar">{initial}</div>
            <div style={{ lineHeight: 1.2 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: TEXT_STRONG, lineHeight: 1.2 }}>
                {displayName}
              </div>
              <div style={{ fontSize: 11, color: MUTED, lineHeight: 1.2 }}>{displayRole}</div>
            </div>
            <ChevronDown size={14} color={MUTED} className="smes-chev" />
          </div>
        </Dropdown>
      </div>
    </div>
  );
};

export default Navbar;
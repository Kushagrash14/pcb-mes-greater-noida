// src/ProtectedRoutes/AdminProtected.jsx
// -------------------------------------------------------------
// Wrap admin-only routes with this. Usage in your router:
//
//   <Route element={<AdminProtected />}>
//     <Route path="/admin/dashboard" element={<AdminDashboard />} />
//     ...other admin routes...
//   </Route>
//
// Behaviour:
//   - Not logged in at all           -> redirect to /login
//   - Logged in but NOT an admin     -> redirect to /user/dashboard
//   - Logged in AND admin            -> render the nested route (<Outlet />)
// -------------------------------------------------------------
import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // adjust path if your folder depth differs

const ADMIN_ROLE = ["SYSTEM_ADMIN", "ADMIN"]; // change if your backend uses a different role string

export default function AdminProtected() {
  const { isAuthenticated, user, initializing } = useAuth();
  const location = useLocation();

  if (initializing) {
    // still checking localStorage on first load - avoid a flash-redirect
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!ADMIN_ROLE.includes(user?.role)) {
    // logged in, but this account isn't an admin -> bounce to their own area
    return <Navigate to="/user/dashboard" replace />;
  }

  return <Outlet />;
}
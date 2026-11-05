// src/ProtectedRoutes/UserProtected.jsx
// -------------------------------------------------------------
// Wrap user-only routes with this. Usage in your router:
//
//   <Route element={<UserProtected />}>
//     <Route path="/user/dashboard" element={<UserDashboard />} />
//     <Route path="/user/mi-input" element={<MiInput />} />
//     ...other user routes...
//   </Route>
//
// Behaviour:
//   - Not logged in at all           -> redirect to /login
//   - Logged in AND is an admin      -> redirect to /admin/dashboard
//     (admins have their own workspace; they don't share this one)
//   - Logged in, not an admin        -> render the nested route (<Outlet />)
// -------------------------------------------------------------
import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // adjust path if your folder depth differs

const ADMIN_ROLE = ["SYSTEM_ADMIN", "ADMIN"]; // change if your backend uses a different role string

export default function UserProtected() {
  const { isAuthenticated, user, initializing } = useAuth();
  const location = useLocation();

  if (initializing) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (ADMIN_ROLE.includes(user?.role)) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Outlet />;
}
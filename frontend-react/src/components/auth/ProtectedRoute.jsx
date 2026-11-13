import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getAuthRole, getAuthToken } from "../../services/auth/authStorage";

/**
 * ProtectedRoute component that enforces authentication and optional role-based authorization.
 *
 * @param {Array<string>} [allowedRoles] - Roles allowed to access the nested routes (e.g. ['vendor', 'admin'])
 */
function ProtectedRoute({ allowedRoles = [] }) {
  const token = getAuthToken();
  const role = getAuthRole();
  const location = useLocation();

  if (!token) {
    // User is not authenticated; redirect to /signin while preserving the attempted path
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  // User is authenticated, but their role is not authorized for this portal
  if (
    allowedRoles.length > 0 &&
    role &&
    !allowedRoles.map((r) => r.toLowerCase()).includes(role.toLowerCase())
  ) {
    // Gracefully redirect them to their own authorized dashboard
    return <Navigate to={`/${role.toLowerCase()}/dashboard`} replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;


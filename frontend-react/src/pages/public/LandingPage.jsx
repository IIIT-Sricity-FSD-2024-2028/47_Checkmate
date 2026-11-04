import React from "react";
import { Navigate } from "react-router-dom";
import { getAuthRole, getAuthToken } from "../../services/auth/authStorage";

/**
 * Root landing / entry redirector.
 * Automatically forwards unauthenticated visitors directly to /signin,
 * or logged-in users directly to their designated role dashboard.
 */
function LandingPage() {
  const token = getAuthToken();
  const role = getAuthRole();

  if (token && role) {
    return <Navigate to={`/${role.toLowerCase()}/dashboard`} replace />;
  }

  return <Navigate to="/signin" replace />;
}

export default LandingPage;

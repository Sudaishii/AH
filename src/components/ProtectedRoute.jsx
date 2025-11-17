import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  // Check if user is logged in
  const userSession = localStorage.getItem('userSession');

  if (!userSession) {
    // Not logged in, redirect to login
    return <Navigate to="/login" replace />;
  }

  const user = JSON.parse(userSession);

  // Check if user status is active (status_id = 2)
  if (user.status_id !== 2) {
    // Account not active, redirect to login
    localStorage.removeItem('userSession');
    return <Navigate to="/login" replace />;
  }

  // If roles are specified, check if user has required role
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role_id)) {
    // User doesn't have required role, redirect to appropriate dashboard
    if (user.role_id === 1) {
      return <Navigate to="/human-resources/dashboard" replace />;
    } else if (user.role_id === 2) {
      return <Navigate to="/dashboard-employee" replace />;
    } else {
      // Unknown role, redirect to login
      localStorage.removeItem('userSession');
      return <Navigate to="/login" replace />;
    }
  }

  // User is authenticated and authorized
  return children;
};

export default ProtectedRoute;

import React from 'react';
import { Navigate } from 'react-router-dom';

const PublicRoute = ({ children }) => {
  // Check if user is logged in
  const userSession = localStorage.getItem('userSession');

  if (userSession) {
    const user = JSON.parse(userSession);

    // Check if user status is still active
    if (user.status_id === 2) {
      // Redirect to appropriate dashboard based on role
      if (user.role_id === 1) {
        return <Navigate to="/human-resources/dashboard" replace />;
      } else if (user.role_id === 2) {
        return <Navigate to="/dashboard-employee" replace />;
      } else {
        // Unknown role, redirect to HR dashboard as default
        return <Navigate to="/human-resources/dashboard" replace />;
      }
    } else {
      // Account no longer active, clear session and allow access to login
      localStorage.removeItem('userSession');
    }
  }

  // User is not logged in or session is invalid, allow access to public route
  return children;
};

export default PublicRoute;

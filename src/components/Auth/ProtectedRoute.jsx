import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

/**
 * ProtectedRoute — ensures the user is authenticated before rendering a page.
 * Optionally enforces the 'Admin' role via the adminOnly prop.
 */
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user } = useApp();
  const location = useLocation();
  const token = sessionStorage.getItem('hms_token');

  if (!user || !token) {
    return <Navigate to="/login" state={{ requireLogin: true, from: location }} replace />;
  }

  if (adminOnly && user.role !== 'Admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;

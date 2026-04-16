import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, showToast } = useApp();
  const location = useLocation();
  const token = sessionStorage.getItem('hms_token');

  if (!user || !token) {
    return <Navigate to="/login" state={{ requireLogin: true, from: location }} replace />;
  }

  // RBAC Check
  if (allowedRoles) {
    const userRole = user?.role?.toLowerCase();
    const hasRole = userRole && allowedRoles.some(
      (role) => role.toLowerCase() === userRole
    );

    if (!hasRole) {
      // Small timeout to ensure context is ready or to handle concurrent state updates
      showToast('Access Denied: You do not have permission to view this page.', 'error');
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;

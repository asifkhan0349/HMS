import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { isAuthorized } from '../../lib/permissions';

const Unauthorized = () => {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
      <div className="glass-card p-5 text-center shadow-lg" style={{ maxWidth: '520px', borderRadius: '24px' }}>
        <div className="mb-4">
          <div className="d-inline-flex p-4 rounded-circle bg-danger bg-opacity-10 text-danger mb-3">
            <i className="bi bi-shield-lock-fill" style={{ fontSize: '3.5rem' }} aria-hidden="true"></i>
          </div>
        </div>
        <h1 className="display-6 fw-bold text-gradient-danger mb-3">Access Denied</h1>
        <p className="text-muted fs-5 mb-4">
          You are not authorized to view this module. Please contact your administrator if you believe this is an error.
        </p>
        <div className="pt-2">
          <a href="/" className="btn btn-primary btn-lg px-5 rounded-pill shadow-sm">
            <i className="bi bi-house-door me-2"></i>
            Return Home
          </a>
        </div>
      </div>
    </div>
  );
};

const ProtectedRoute = ({ children, module, allowedRoles }) => {
  const { user } = useApp();
  const location = useLocation();
  const token = sessionStorage.getItem('hms_token');

  if (!user || !token) {
    return <Navigate to="/login" state={{ requireLogin: true, from: location }} replace />;
  }

  if (module && !isAuthorized(user.role, module)) {
    return <Unauthorized />;
  }

  if (allowedRoles) {
    const hasRole = allowedRoles.some(
      (role) => role.toLowerCase() === user.role?.toLowerCase()
    );
    if (!hasRole) return <Unauthorized />;
  }

  return children;
};

export default ProtectedRoute;

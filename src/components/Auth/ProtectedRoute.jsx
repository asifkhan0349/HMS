import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

const ProtectedRoute = ({ children }) => {
  const { user } = useApp();
  const location = useLocation();
  const token = sessionStorage.getItem('hms_token');

  if (!user || !token) {
    return <Navigate to="/login" state={{ requireLogin: true, from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;

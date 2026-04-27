import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import { isAuthorized, MODULES, ROUTE_MODULES } from './lib/permissions';

// Lazy load page components for better performance
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Patients = lazy(() => import('./pages/Patients'));
const Appointments = lazy(() => import('./pages/Appointments'));
const EMR = lazy(() => import('./pages/EMR'));
const Billing = lazy(() => import('./pages/Billing'));
const Pharmacy = lazy(() => import('./pages/Pharmacy'));
const Lab = lazy(() => import('./pages/Lab'));
const Beds = lazy(() => import('./pages/Beds'));
const Staff = lazy(() => import('./pages/Staff'));
const Reports = lazy(() => import('./pages/Reports'));
const Inventory = lazy(() => import('./pages/Inventory'));
const BloodBank = lazy(() => import('./pages/BloodBank'));
const Settings = lazy(() => import('./pages/Settings'));
const Login = lazy(() => import('./pages/Login'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));

// Loading spinner component for Suspense fallback
const PageLoader = () => (
  <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
    <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
      <span className="visually-hidden">Loading...</span>
    </div>
  </div>
);

// Placeholder Pages for other modules
const Placeholder = ({ title }) => (
  <div className="glass-card p-5 text-center">
    <i className="bi bi-tools text-primary opacity-50" style={{ fontSize: '3rem' }}></i>
    <h3 className="mt-4 fw-bold">{title} Module</h3>
    <p className="text-muted">This module is currently under development according to the PRD Phase 1.</p>
  </div>
);

// Role-based landing page logic
const RootRedirect = () => {
  const { user } = useApp();
  if (!user) return <Navigate to="/login" replace />;
  const userRole = user.role;
  
  if (isAuthorized(userRole, MODULES.COMMAND_CENTER)) return <Navigate to="/dashboard" replace />;
  if (isAuthorized(userRole, MODULES.PATIENT_DIRECTORY)) return <Navigate to="/patients" replace />;
  if (isAuthorized(userRole, MODULES.REVENUE_CYCLE)) return <Navigate to="/billing" replace />;
  
  // Fallback to login if no authorized landing page found
  return <Navigate to="/login" replace />;
};

function App() {
  return (
    <Router>
      <AppProvider>
        <Layout>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* Dynamic root redirect based on user role */}
              <Route path="/" element={<RootRedirect />} />

              {/* Protected Routes */}
              <Route path="/dashboard" element={<ProtectedRoute module={ROUTE_MODULES['/dashboard']}><Dashboard /></ProtectedRoute>} />
              <Route path="/patients" element={<ProtectedRoute module={ROUTE_MODULES['/patients']}><Patients /></ProtectedRoute>} />
              <Route path="/appointments" element={<ProtectedRoute module={ROUTE_MODULES['/appointments']}><Appointments /></ProtectedRoute>} />
              <Route path="/emr" element={<ProtectedRoute module={ROUTE_MODULES['/emr']}><EMR /></ProtectedRoute>} />
              <Route path="/billing" element={<ProtectedRoute module={ROUTE_MODULES['/billing']}><Billing /></ProtectedRoute>} />
              <Route path="/pharmacy" element={<ProtectedRoute module={ROUTE_MODULES['/pharmacy']}><Pharmacy /></ProtectedRoute>} />
              <Route path="/lab" element={<ProtectedRoute module={ROUTE_MODULES['/lab']}><Lab /></ProtectedRoute>} />
              <Route path="/beds" element={<ProtectedRoute module={ROUTE_MODULES['/beds']}><Beds /></ProtectedRoute>} />
              <Route path="/staff" element={<ProtectedRoute module={ROUTE_MODULES['/staff']}><Staff /></ProtectedRoute>} />
              <Route path="/reports" element={<ProtectedRoute module={ROUTE_MODULES['/reports']}><Reports /></ProtectedRoute>} />
              <Route path="/inventory" element={<ProtectedRoute module={ROUTE_MODULES['/inventory']}><Inventory /></ProtectedRoute>} />
              <Route path="/blood-bank" element={<ProtectedRoute module={ROUTE_MODULES['/blood-bank']}><BloodBank /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute module={ROUTE_MODULES['/settings']}><Settings /></ProtectedRoute>} />

              {/* Catch-all Route for 404s */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </Layout>
      </AppProvider>
    </Router>
  );
}

export default App;

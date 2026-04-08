import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/Auth/ProtectedRoute';

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
const Login = lazy(() => import('./pages/Login'));

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

function App() {
  return (
    <Router>
      <AppProvider>
        <Layout>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />

              {/* Redirect root to dashboard */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />

              {/* Protected Routes */}
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/patients" element={<ProtectedRoute><Patients /></ProtectedRoute>} />
              <Route path="/appointments" element={<ProtectedRoute><Appointments /></ProtectedRoute>} />
              <Route path="/emr" element={<ProtectedRoute><EMR /></ProtectedRoute>} />
              <Route path="/billing" element={<ProtectedRoute><Billing /></ProtectedRoute>} />
              <Route path="/pharmacy" element={<ProtectedRoute><Pharmacy /></ProtectedRoute>} />
              <Route path="/lab" element={<ProtectedRoute><Lab /></ProtectedRoute>} />
              <Route path="/beds" element={<ProtectedRoute><Beds /></ProtectedRoute>} />
              <Route path="/staff" element={<ProtectedRoute><Staff /></ProtectedRoute>} />
              <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
              <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
              <Route path="/bloodbank" element={<ProtectedRoute><BloodBank /></ProtectedRoute>} />

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

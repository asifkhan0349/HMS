import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
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
const Settings = lazy(() => import('./pages/Settings'));
const UserManagement = lazy(() => import('./pages/UserManagement'));
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

// Roles that can access the Patient Directory
const PATIENT_DIR_ROLES = ['Admin', 'Doctor', 'Nurse', 'Patient'];

// Roles that can access Scheduling
const SCHEDULING_ROLES = ['Admin', 'Doctor', 'Patient'];

// Roles that can access Revenue Cycle
const BILLING_ROLES = ['Admin', 'Reception', 'Patient'];

// Roles that can access Pharmacy
const PHARMACY_ROLES = ['Admin', 'Nurse', 'Reception'];

// Roles that can access Diagnostics & Lab
const LAB_ROLES = ['Admin', 'Doctor', 'Nurse', 'Patient'];

// Roles that can access Facility Management
const BEDS_ROLES = ['Admin', 'Nurse', 'Reception'];

// Roles that can access Hospital Logistics
const INVENTORY_ROLES = ['Admin', 'Nurse', 'Reception'];

// Roles that can access Emergency Blood Bank
const BLOOD_BANK_ROLES = ['Admin', 'Doctor', 'Nurse', 'Reception'];

/**
 * Send each role to its appropriate home page after login / root visit.
 * Must stay in sync with the allowedRoles props on each route below.
 */
const RootRedirect = () => {
  const { user } = useApp();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'Admin')   return <Navigate to="/dashboard" replace />;
  // Doctor, Nurse, Patient → Patient Directory
  if (PATIENT_DIR_ROLES.includes(user.role)) return <Navigate to="/patients" replace />;
  // All other roles (Pharmacist, Lab Technician, Receptionist, …) → Settings
  return <Navigate to="/settings" replace />;
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

              {/* Root redirect */}
              <Route path="/" element={<RootRedirect />} />

              {/* Protected Routes — authentication required, no role restrictions */}
              <Route path="/dashboard" element={<ProtectedRoute adminOnly><Dashboard /></ProtectedRoute>} />
              <Route path="/patients" element={<ProtectedRoute allowedRoles={PATIENT_DIR_ROLES}><Patients /></ProtectedRoute>} />
              <Route path="/appointments" element={<ProtectedRoute allowedRoles={SCHEDULING_ROLES}><Appointments /></ProtectedRoute>} />
              <Route path="/emr" element={<ProtectedRoute allowedRoles={['Admin', 'Patient']}><EMR /></ProtectedRoute>} />
              <Route path="/billing" element={<ProtectedRoute allowedRoles={BILLING_ROLES}><Billing /></ProtectedRoute>} />
              <Route path="/pharmacy" element={<ProtectedRoute allowedRoles={PHARMACY_ROLES}><Pharmacy /></ProtectedRoute>} />
              <Route path="/lab" element={<ProtectedRoute allowedRoles={LAB_ROLES}><Lab /></ProtectedRoute>} />
              <Route path="/beds" element={<ProtectedRoute allowedRoles={BEDS_ROLES}><Beds /></ProtectedRoute>} />
              <Route path="/staff" element={<ProtectedRoute adminOnly><Staff /></ProtectedRoute>} />
              <Route path="/reports" element={<ProtectedRoute adminOnly><Reports /></ProtectedRoute>} />
              <Route path="/inventory" element={<ProtectedRoute allowedRoles={INVENTORY_ROLES}><Inventory /></ProtectedRoute>} />
              <Route path="/blood-bank" element={<ProtectedRoute allowedRoles={BLOOD_BANK_ROLES}><BloodBank /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/user-management" element={<ProtectedRoute adminOnly><UserManagement /></ProtectedRoute>} />

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

import React, { useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useApp } from '../../context/AppContext';

const Layout = ({ children }) => {
  const { user, toast } = useApp();
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';
  const showNav = user && !isAuthPage;

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = useCallback(() => setSidebarOpen(prev => !prev), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  return (
    <div className="hms-layout position-relative">
      <div className="hms-bg-overlay"></div>
      <div className="hms-bg-blur"></div>
      
      {showNav && <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />}
      {showNav && <Navbar onToggleSidebar={toggleSidebar} />}

      {/* Mobile sidebar backdrop */}
      {showNav && (
        <div 
          className={`sidebar-backdrop ${sidebarOpen ? 'show' : ''}`} 
          onClick={closeSidebar}
        />
      )}

      {/* Global Toast Notification System */}
      {toast && (
        <div className="position-fixed bottom-0 start-50 translate-middle-x mb-5" style={{ zIndex: 2000 }}>
          <div className="glass-card border-primary border-opacity-50 px-4 py-3 shadow-lg animate-fade-up d-flex align-items-center" style={{ minWidth: '300px' }}>
            <div className="bg-primary bg-opacity-10 rounded-circle p-2 me-3">
              <i className="bi bi-info-circle text-primary"></i>
            </div>
            <div>
              <small className="text-uppercase text-primary fw-bold d-block mb-1" style={{ fontSize: '0.65rem', letterSpacing: '1.5px' }}>System Response</small>
              <p className="mb-0 fw-medium" style={{ color: 'var(--geist-foreground)' }}>{toast.message}</p>
            </div>
          </div>
        </div>
      )}
      
      <main className={`main-content ${!showNav ? 'ms-0 pt-0' : ''}`}>
        <div className="container-fluid p-4">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;

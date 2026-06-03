import React, { useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useApp } from '../../context/AppContext';

const Layout = ({ children }) => {
  const { user, toast } = useApp();
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';
  const isLandingPage = location.pathname === '/';
  const isPublicPage = isAuthPage || isLandingPage;
  const showNav = user && !isPublicPage;

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = useCallback(() => setSidebarOpen(prev => !prev), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  return (
    <div className="hms-layout">
      {showNav && <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />}
      {showNav && <Navbar onToggleSidebar={toggleSidebar} />}

      {showNav && (
        <div
          className={`sidebar-backdrop ${sidebarOpen ? 'show' : ''}`}
          onClick={closeSidebar}
        />
      )}

      {toast && (
        <div className="position-fixed bottom-0 start-50 translate-middle-x mb-5" style={{ zIndex: 2000 }}>
          <div className="premium-card px-4 py-3 d-flex align-items-center gap-3 animate-slide-up " style={{ minWidth: '320px', borderLeft: `3px solid var(--primary)` }}>
            <div className="d-flex align-items-center justify-content-center" style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary-bg)', flexShrink: 0 }}>
              <i className="bi bi-info-circle text-primary" style={{ fontSize: '0.9rem' }} />
            </div>
            <div>
              <small className="text-uppercase fw-bold d-block mb-0" style={{ fontSize: '0.6rem', letterSpacing: '1px', color: 'var(--primary)' }}>System Response</small>
              <p className="mb-0 fw-medium" style={{ fontSize: '0.85rem', color: 'var(--geist-foreground)' }}>{toast.message}</p>
            </div>
          </div>
        </div>
      )}

      <main className={`main-content ${!showNav ? 'ms-0 pt-0' : ''}`}>
        <div className={isPublicPage ? '' : 'container-fluid p-4'}>
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;

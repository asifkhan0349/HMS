import React from 'react';
import { NavLink } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useApp();

  const menuItems = [
    { title: 'Command Center', path: '/dashboard', icon: 'bi bi-activity' },
    { title: 'Patient Directory', path: '/patients', icon: 'bi bi-people' },
    { title: 'Scheduling', path: '/appointments', icon: 'bi bi-calendar-event', allowedRoles: ['Admin'] },
    { title: 'Medical Records', path: '/emr', icon: 'bi bi-file-medical' },
    { title: 'Revenue Cycle', path: '/billing', icon: 'bi bi-receipt' },
    { title: 'Pharmacy', path: '/pharmacy', icon: 'bi bi-capsule' },
    { title: 'Diagnostics & Lab', path: '/lab', icon: 'bi bi-clipboard2-pulse' },
    { title: 'Facility Management', path: '/beds', icon: 'bi bi-hospital' },
    { title: 'Human Capital', path: '/staff', icon: 'bi bi-person-badge' },
    { title: 'Intelligence', path: '/reports', icon: 'bi bi-bar-chart-line' },
    { title: 'Hospital Logistics', path: '/inventory', icon: 'bi bi-boxes' },
    { title: 'Emergency Blood Bank', path: '/bloodbank', icon: 'bi bi-droplet-half' },
    { title: 'Account Settings', path: '/settings', icon: 'bi bi-gear' },
  ];

  const handleNavClick = () => {
    if (onClose) onClose();
  };

  return (
    <aside className={`sidebar d-flex flex-column border-end ${isOpen ? 'sidebar-open' : ''}`}>
      <button className="sidebar-close-btn" onClick={onClose} aria-label="Close menu">
        <i className="bi bi-x-lg" style={{ fontSize: '0.85rem' }} aria-hidden="true"></i>
      </button>

      <div className="p-4 mb-2">
        <h4 className="fw-bold mb-0">
          <i className="bi bi-hospital me-2" aria-hidden="true"></i>
          <span>HMS Core</span>
        </h4>
        <small className="text-muted">v1.0.0 Premium</small>
      </div>

      <nav className="flex-grow-1 overflow-y-auto custom-scrollbar px-2" aria-label="Main Navigation">
        {menuItems
          .filter((item) => {
            if (!item.allowedRoles) return true;
            if (!user?.role) return false;
            return item.allowedRoles.some(
              (role) => role.toLowerCase() === user.role.toLowerCase()
            );
          })
          .map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-link-custom ${isActive ? 'active' : ''}`}
              onClick={handleNavClick}
            >
              <i className={item.icon} aria-hidden="true"></i>
              <span>{item.title}</span>
            </NavLink>
          ))}
      </nav>

      <div className="p-4 mt-auto">
        <div className="sidebar-footer-card p-3">
          <div className="d-flex align-items-center mb-3 pb-3 border-bottom border-white border-opacity-10">
            <div className="overflow-hidden">
              <h6 className="mb-0 text-truncate small fw-bold">{user?.name || 'Signed-out user'}</h6>
              <small className="text-muted" style={{ fontSize: '0.65rem' }}>
                {user?.role || 'No role'}
              </small>
            </div>
            <button
              className="btn btn-sm btn-link text-muted ms-auto p-0 hover-opacity-100"
              onClick={logout}
              title="Sign Out"
              aria-label="Sign Out"
            >
              <i className="bi bi-box-arrow-right fs-5" aria-hidden="true"></i>
            </button>
          </div>

          <div className="d-flex align-items-center mb-2">
            <span className="pulsing-dot me-2" aria-hidden="true"></span>
            <small className="fw-bold text-muted" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>
              CORE OPERATIONAL
            </small>
          </div>
          <div className="progress mb-2" style={{ height: '4px' }}>
            <div
              className="progress-bar"
              role="progressbar"
              style={{ width: '92%' }}
              aria-valuenow="92"
              aria-valuemin="0"
              aria-valuemax="100"
            ></div>
          </div>
          <div className="d-flex justify-content-between">
            <small className="text-muted" style={{ fontSize: '0.65rem' }}>
              System Health
            </small>
            <small className="fw-bold" style={{ fontSize: '0.65rem' }}>
              OPTIMAL
            </small>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

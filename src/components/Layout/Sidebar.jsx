import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

const menuItems = [
  { title: 'Command Center', path: '/dashboard', icon: 'bi bi-activity', adminOnly: true },
  { title: 'User Management', path: '/user-management', icon: 'bi bi-shield-check', adminOnly: true },
  { title: 'Patient Directory', path: '/patients', icon: 'bi bi-people', allowedRoles: ['Admin', 'Doctor', 'Nurse', 'Patient'] },
  { title: 'Scheduling', path: '/appointments', icon: 'bi bi-calendar-event', allowedRoles: ['Admin', 'Doctor', 'Patient'] },
  { title: 'Medical Records', path: '/emr', icon: 'bi bi-file-medical', allowedRoles: ['Admin', 'Doctor', 'Nurse', 'Reception'] },
  { title: 'Revenue Cycle', path: '/billing', icon: 'bi bi-receipt', allowedRoles: ['Admin', 'Reception'] },
  { title: 'Pharmacy', path: '/pharmacy', icon: 'bi bi-capsule', allowedRoles: ['Admin', 'Nurse', 'Reception'] },
  { title: 'Diagnostics & Lab', path: '/lab', icon: 'bi bi-clipboard2-pulse', allowedRoles: ['Admin', 'Doctor', 'Nurse'] },
  { title: 'Facility Management', path: '/beds', icon: 'bi bi-hospital', allowedRoles: ['Admin', 'Nurse', 'Reception'] },
  { title: 'Human Capital', path: '/staff', icon: 'bi bi-person-badge', adminOnly: true },
  { title: 'Intelligence', path: '/reports', icon: 'bi bi-bar-chart-line', adminOnly: true },
  { title: 'Hospital Logistics', path: '/inventory', icon: 'bi bi-boxes', allowedRoles: ['Admin', 'Nurse', 'Reception'] },
  { title: 'Appointment Calendar', path: '/doctor-calendar', icon: 'bi bi-calendar3', allowedRoles: ['Admin', 'Doctor'] },
  { title: 'Emergency Blood Bank', path: '/blood-bank', icon: 'bi bi-droplet-half', allowedRoles: ['Admin', 'Doctor', 'Nurse', 'Reception'] },
];

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useApp();

  const handleNavClick = () => {
    if (onClose) onClose();
  };

  const filteredMenuItems = menuItems.filter(item => {
    if (item.adminOnly) return user?.role === 'Admin';
    if (item.allowedRoles) return item.allowedRoles.includes(user?.role);
    return true; // no restriction — show to all authenticated users
  });

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
        {filteredMenuItems.map((item) => (
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
            <div className="ms-auto d-flex align-items-center gap-2">
              <Link
                to="/settings"
                className="btn btn-sm btn-link text-muted p-0 hover-opacity-100"
                title="Account Settings"
                aria-label="Account Settings"
                onClick={handleNavClick}
              >
                <i className="bi bi-gear fs-5" aria-hidden="true"></i>
              </Link>
              <button
                className="btn btn-sm btn-link text-muted p-0 hover-opacity-100"
                onClick={logout}
                title="Sign Out"
                aria-label="Sign Out"
              >
                <i className="bi bi-box-arrow-right fs-5" aria-hidden="true"></i>
              </button>
            </div>
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

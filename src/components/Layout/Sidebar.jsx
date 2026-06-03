import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

const menuItems = [
  { title: 'HMS Workspaces', path: '/products', icon: 'bi bi-grid-1x2', allowedRoles: ['Admin', 'Doctor', 'Nurse', 'Patient', 'Reception', 'Pharmacist', 'Lab Technician', 'Accountant'] },
  { title: 'Command Center', path: '/dashboard', icon: 'bi bi-activity', adminOnly: true },
  { title: 'User Management', path: '/user-management', icon: 'bi bi-shield-check', adminOnly: true },
  { title: 'Patient Directory', path: '/patients', icon: 'bi bi-people', allowedRoles: ['Admin', 'Doctor', 'Reception'] },
  { title: 'Scheduling', path: '/appointments', icon: 'bi bi-calendar-event', allowedRoles: ['Admin', 'Doctor', 'Reception', 'Patient'] },
  { title: 'Appointment Calendar', path: '/doctor-calendar', icon: 'bi bi-calendar3', allowedRoles: ['Admin', 'Doctor'] },
  { title: 'Medical Records', path: '/emr', icon: 'bi bi-file-medical', allowedRoles: ['Admin', 'Doctor', 'Nurse'] },
  { title: 'Discharge Summaries', path: '/discharge-summaries', icon: 'bi bi-file-earmark-medical', allowedRoles: ['Admin', 'Doctor', 'Nurse'] },
  { title: 'Revenue Cycle', path: '/billing', icon: 'bi bi-receipt', allowedRoles: ['Admin', 'Reception', 'Accountant'] },
  { title: 'Invoice Generation', path: '/invoice-generation', icon: 'bi bi-receipt-cutoff', allowedRoles: ['Admin', 'Reception', 'Accountant'] },
  { title: 'Cash Receipts', path: '/cash-receipts', icon: 'bi bi-cash-coin', allowedRoles: ['Admin', 'Reception', 'Accountant'] },
  { title: 'Ambulance Service', path: '/ambulance-service', icon: 'bi bi-truck', allowedRoles: ['Admin', 'Reception', 'Nurse'] },
  { title: 'Pharmacy', path: '/pharmacy', icon: 'bi bi-capsule', allowedRoles: ['Admin', 'Pharmacist'] },
  { title: 'Diagnostics & Lab', path: '/lab', icon: 'bi bi-clipboard2-pulse', allowedRoles: ['Admin', 'Doctor', 'Lab Technician'] },
  { title: 'Facility Management', path: '/beds', icon: 'bi bi-hospital', allowedRoles: ['Admin', 'Nurse', 'Reception'] },
  { title: 'Human Capital', path: '/staff', icon: 'bi bi-person-badge', adminOnly: true },
  { title: 'Intelligence', path: '/reports', icon: 'bi bi-bar-chart-line', allowedRoles: ['Admin', 'Accountant'] },
  { title: 'AI Insights', path: '/ai-insights', icon: 'bi bi-stars', allowedRoles: ['Admin', 'Doctor', 'Nurse', 'Reception', 'Pharmacist', 'Lab Technician', 'Accountant'] },
  { title: 'Hospital Logistics', path: '/inventory', icon: 'bi bi-boxes', allowedRoles: ['Admin', 'Pharmacist'] },
  { title: 'Emergency Blood Bank', path: '/blood-bank', icon: 'bi bi-droplet-half', allowedRoles: ['Admin', 'Doctor', 'Nurse'] },
];

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useApp();

  const handleNavClick = () => {
    if (onClose) onClose();
  };

  const filteredMenuItems = menuItems.filter(item => {
    if (item.adminOnly) return user?.role === 'Admin';
    if (item.allowedRoles) return item.allowedRoles.includes(user?.role);
    return true;
  });

  return (
    <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
      <button className="sidebar-close-btn" onClick={onClose} aria-label="Close menu">
        <i className="bi bi-x-lg" style={{ fontSize: '0.85rem' }} />
      </button>

      <div className="sidebar-brand">
        <div className="sidebar-brand-inner">
          <div className="sidebar-brand-icon">
            <i className="bi bi-hospital" />
          </div>
          <div>
            <div className="sidebar-brand-text">HMS Core</div>
            <div className="sidebar-brand-sub">v1.0.0 Premium</div>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav" aria-label="Main Navigation">
        {filteredMenuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-link-custom ${isActive ? 'active' : ''}`}
            onClick={handleNavClick}
          >
            <i className={item.icon} />
            <span>{item.title}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer-section">
        <div className="sidebar-user-card">
          <div className="d-flex align-items-center mb-3 pb-3 border-bottom" style={{ borderColor: 'var(--accents-2)' }}>
            <div style={{ minWidth: 0 }}>
              <h6 className="mb-0 text-truncate small fw-bold">{user?.name || 'Signed-out user'}</h6>
              <small className="text-muted" style={{ fontSize: '0.65rem' }}>
                {user?.role || 'No role'}
              </small>
            </div>
            <div className="ms-auto d-flex align-items-center gap-2">
              <Link
                to="/settings"
                className="btn btn-sm btn-link text-muted p-1"
                title="Account Settings"
                aria-label="Account Settings"
                onClick={handleNavClick}
              >
                <i className="bi bi-gear fs-5" />
              </Link>
              <button
                className="btn btn-sm btn-link text-muted p-1"
                onClick={logout}
                title="Sign Out"
                aria-label="Sign Out"
              >
                <i className="bi bi-box-arrow-right fs-5" />
              </button>
            </div>
          </div>

          <div className="d-flex align-items-center mb-2">
            <span className="pulsing-dot me-2" />
            <small className="fw-bold text-muted" style={{ fontSize: '0.65rem', letterSpacing: '0.5px' }}>
              SYSTEM HEALTH
            </small>
          </div>
          <div className="progress mb-1" style={{ height: '3px' }}>
            <div className="progress-bar" role="progressbar" style={{ width: '92%' }} />
          </div>
          <div className="d-flex justify-content-between">
            <small className="text-muted" style={{ fontSize: '0.6rem' }}>Performance</small>
            <small className="fw-bold" style={{ fontSize: '0.6rem', color: 'var(--success)' }}>OPTIMAL</small>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

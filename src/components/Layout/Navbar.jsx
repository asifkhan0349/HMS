import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';

const Navbar = ({ onToggleSidebar }) => {
  const { theme, toggleTheme, showToast } = useApp();
  const [search, setSearch] = useState('');

  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      const query = search.trim().toLowerCase();
      
      // Keyword to Route Mapping
      const modules = {
        'patient': '/patients',
        'appoint': '/appointments',
        'sched': '/appointments',
        'emr': '/emr', 'ehr': '/emr',
        'bill': '/billing', 'rev': '/billing', 'invoice': '/invoice-generation',
        'ambulance': '/ambulance-service', 'truck': '/ambulance-service',
        'pharm': '/pharmacy', 'med': '/pharmacy',
        'lab': '/lab', 'test': '/lab', 'diag': '/lab',
        'bed': '/beds',
        'staff': '/staff', 'doc': '/staff', 'nurse': '/staff',
        'invent': '/inventory', 'stock': '/inventory',
        'blood': '/bloodbank',
        'rep': '/reports', 'analy': '/reports',
        'dash': '/dashboard'
      };
      
      const match = Object.keys(modules).find(key => query.includes(key));
      if (match) {
        navigate(modules[match]);
      } else {
        // Default: Search for specific patient name/ID
        navigate(`/patients?search=${encodeURIComponent(search.trim())}`);
      }
      setSearch('');
    }
  };

  return (
    <header className="navbar fixed-top w-100" style={{ left: 'var(--sidebar-w)', width: 'calc(100% - var(--sidebar-w))' }}>
      <div className="container-fluid px-3 px-md-4 h-100 d-flex align-items-center">
        {/* Hamburger menu - visible on mobile/tablet */}
        <button className="navbar-hamburger" onClick={onToggleSidebar} aria-label="Open menu">
          <i className="bi bi-list" style={{ fontSize: '1.25rem' }} aria-hidden="true"></i>
        </button>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="d-flex align-items-center flex-grow-1" style={{ maxWidth: '420px' }}>
          <div className="position-relative w-100">
            <i className="bi bi-search position-absolute" style={{ left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--accents-5)', fontSize: '0.85rem' }} aria-hidden="true"></i>
            <input
              type="text"
              className="form-control"
              placeholder="Search patients, records, modules…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ 
                paddingLeft: '36px',
                height: '38px',
                fontSize: '0.85rem',
                background: 'var(--accents-1)',
                border: '1px solid var(--accents-2)',
                color: 'var(--geist-foreground)',
                borderRadius: '8px'
              }}
              id="navbar-search"
            />
          </div>
        </form>

        {/* Right side actions */}
        <div className="d-flex align-items-center gap-2 ms-auto">
          {/* Right side actions - Toggle removed */}
        </div>
      </div>
    </header>
  );
};

export default Navbar;

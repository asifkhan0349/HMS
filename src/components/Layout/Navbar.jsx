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
        navigate(`/patients?search=${encodeURIComponent(search.trim())}`);
      }
      setSearch('');
    }
  };

  return (
    <header className="navbar fixed-top">
      <div className="container-fluid px-3 px-md-4 h-100 d-flex align-items-center gap-3">
        <button className="navbar-hamburger" onClick={onToggleSidebar} aria-label="Open menu">
          <i className="bi bi-list" style={{ fontSize: '1.25rem' }} />
        </button>

        <form onSubmit={handleSearch} className="flex-grow-1" style={{ maxWidth: '420px' }}>
          <div className="navbar-search-wrapper">
            <i className="bi bi-search navbar-search-icon" />
            <input
              type="text"
              className="navbar-search-input"
              placeholder="Search patients, records, modules..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              id="navbar-search"
            />
          </div>
        </form>

        <div className="d-flex align-items-center gap-2 ms-auto">
          <button
            className="btn btn-sm btn-glass px-3"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label="Toggle theme"
          >
            <i className={`bi ${theme === 'dark' ? 'bi-sun' : 'bi-moon'}`} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;

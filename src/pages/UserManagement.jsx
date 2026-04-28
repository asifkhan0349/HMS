import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { authApi } from '../lib/api';
import Modal from '../components/UI/Modal';
import { Skeleton } from 'boneyard-js/react';

const UserManagement = () => {
  const { showToast } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    username: '',
    password: '',
    role: 'Doctor',
  });
  const [statusMessage, setStatusMessage] = useState(null); // { type: 'success' | 'error' | 'warning', text: string }
  const [showPassword, setShowPassword] = useState(false);

  const roles = ['Doctor', 'Nurse', 'Receptionist', 'Patient'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusMessage(null);
    
    if (!formData.full_name || !formData.email || !formData.username || !formData.password) {
      setStatusMessage({ type: 'warning', text: 'All fields are required to register a new user.' });
      return;
    }

    setIsSubmitting(true);
    try {
      await authApi.createUser(formData);
      setStatusMessage({ type: 'success', text: `${formData.role} account created successfully.` });
      // Clear form on success
      setFormData({
        full_name: '',
        email: '',
        username: '',
        password: '',
        role: 'Doctor',
      });
    } catch (error) {
      setStatusMessage({ type: 'error', text: error.message || 'System error: Unable to create user account.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (statusMessage) setStatusMessage(null);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setStatusMessage(null);
    setShowPassword(false);
  };

  return (
    <div className="user-management-page p-4">
      <div className="d-flex justify-content-between align-items-center mb-5">
        <div>
          <h2 className="fw-bold mb-1">Access Control & Identity</h2>
          <p className="text-muted mb-0">Securely onboard hospital personnel and manage system roles.</p>
        </div>
        <button 
          className="btn btn-primary px-4 py-2 rounded-3 shadow-sm d-flex align-items-center" 
          onClick={() => setIsModalOpen(true)}
        >
          <i className="bi bi-person-plus-fill me-2"></i>
          Register New Account
        </button>
      </div>

      <div className="row g-4">
        <div className="col-lg-8">
          <div className="glass-card p-0 overflow-hidden shadow-lg border-0">
            <div className="p-4 border-bottom d-flex justify-content-between align-items-center bg-light bg-opacity-10">
              <h5 className="fw-bold mb-0">Security Protocols</h5>
              <span className="badge-soft-primary px-3 py-1 rounded-pill small">Admin Override Active</span>
            </div>
            <div className="p-5 text-center">
              <div 
                className="bg-primary bg-opacity-10 text-primary rounded-circle d-inline-flex align-items-center justify-content-center mb-4"
                style={{ width: '80px', height: '80px' }}
              >
                <i className="bi bi-shield-lock-fill fs-1"></i>
              </div>
              <h4 className="fw-bold mb-3">RBAC Management System</h4>
              <p className="text-muted mx-auto mb-4" style={{ maxWidth: '500px' }}>
                Use this interface to provision new credentials for healthcare providers and patients. 
                All actions are logged for audit compliance.
              </p>
              <div className="d-flex justify-content-center gap-3">
                <div className="p-3 border rounded-3 bg-white bg-opacity-50" style={{ width: '120px' }}>
                  <h3 className="fw-bold mb-1">04</h3>
                  <small className="text-muted text-uppercase fw-bold" style={{ fontSize: '0.65rem' }}>Active Roles</small>
                </div>
                <div className="p-3 border rounded-3 bg-white bg-opacity-50" style={{ width: '120px' }}>
                  <h3 className="fw-bold mb-1">01</h3>
                  <small className="text-muted text-uppercase fw-bold" style={{ fontSize: '0.65rem' }}>Master Admin</small>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="glass-card p-4 h-100 shadow-sm border-0">
            <h5 className="fw-bold mb-4">System Policies</h5>
            <ul className="list-unstyled mb-0">
              <li className="d-flex mb-4">
                <div className="me-3 text-success"><i className="bi bi-check-circle-fill"></i></div>
                <div>
                  <h6 className="mb-1 fw-bold small text-uppercase">Single Admin Enforcement</h6>
                  <p className="text-muted small mb-0">System restricts administrative elevation to exactly one account.</p>
                </div>
              </li>
              <li className="d-flex mb-4">
                <div className="me-3 text-primary"><i className="bi bi-info-circle-fill"></i></div>
                <div>
                  <h6 className="mb-1 fw-bold small text-uppercase">Secure Provisioning</h6>
                  <p className="text-muted small mb-0">Passwords are cryptographically hashed using industry-standard bcrypt.</p>
                </div>
              </li>
              <li className="d-flex">
                <div className="me-3 text-warning"><i className="bi bi-exclamation-triangle-fill"></i></div>
                <div>
                  <h6 className="mb-1 fw-bold small text-uppercase">Role Limitations</h6>
                  <p className="text-muted small mb-0">Non-admin users are restricted from accessing system configuration.</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal} title="Account Provisioning Protocol">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="form-label text-accent fw-bold small text-uppercase mb-2">Legal Full Name</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Dr. Marcus Holloway"
              value={formData.full_name}
              onChange={(e) => handleInputChange('full_name', e.target.value)}
              required
            />
          </div>
          
          <div className="row g-3 mb-4">
            <div className="col-md-6">
              <label className="form-label text-accent fw-bold small text-uppercase mb-2">Email Address</label>
              <input
                type="email"
                className="form-control"
                placeholder="marcus@hms-elite.com"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
              />
            </div>
            <div className="col-md-6">
              <label className="form-label text-accent fw-bold small text-uppercase mb-2">System Username</label>
              <input
                type="text"
                className="form-control"
                placeholder="dr_marcus"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="row g-3 mb-4">
            <div className="col-md-6">
              <label className="form-label text-accent fw-bold small text-uppercase mb-2">Temporary Password</label>
              <div className="input-group">
                <input
                  type={showPassword ? "text" : "password"}
                  className="form-control border-end-0"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  required
                />
                <button 
                  className="btn btn-outline-secondary border-start-0 bg-white" 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ borderColor: '#dee2e6' }}
                >
                  <i className={`bi bi-eye${showPassword ? '-slash' : ''} text-muted`}></i>
                </button>
              </div>
            </div>
            <div className="col-md-6">
              <label className="form-label text-accent fw-bold small text-uppercase mb-2">Role Assignment</label>
              <select 
                className="form-select"
                value={formData.role}
                onChange={(e) => handleInputChange('role', e.target.value)}
              >
                {roles.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
          </div>

          {statusMessage ? (
            <div className={`alert alert-${statusMessage.type === 'error' ? 'danger' : statusMessage.type} border-0 d-flex mb-4 animate__animated animate__fadeIn`}>
              <i className={`bi bi-${statusMessage.type === 'success' ? 'check-circle-fill' : 'exclamation-triangle-fill'} me-3 mt-1`}></i>
              <small className="fw-bold">{statusMessage.text}</small>
            </div>
          ) : (
            <div className="alert alert-info border-0 bg-primary bg-opacity-10 d-flex mb-4">
              <i className="bi bi-info-square-fill text-primary me-3 mt-1"></i>
              <small className="text-primary-emphasis">
                Provisioning a new account will generate a unique user ID and grant immediate access based on the selected role.
              </small>
            </div>
          )}

          <div className="d-flex gap-3">
            <button type="button" className="btn btn-glass w-100 py-3" onClick={closeModal}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary w-100 py-3" disabled={isSubmitting}>
              {isSubmitting ? (
                <><span className="spinner-border spinner-border-sm me-2"></span>Processing...</>
              ) : 'Provision Account'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UserManagement;

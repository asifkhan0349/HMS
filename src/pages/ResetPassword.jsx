import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { authApi } from '../lib/api';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const { showToast } = useApp();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!password.trim()) errors.password = true;
    if (!confirmPassword.trim()) errors.confirmPassword = true;

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      showToast('Please fill in all mandatory fields highlighted in red.', 'warning');
      return;
    }
    setValidationErrors({});

    if (!token) {
      showToast('Invalid or missing reset token.', 'error');
      return;
    }
    if (password !== confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }
    if (password.length < 8) {
      showToast('Password must be at least 8 characters.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await authApi.resetPassword(token, password);
      showToast(response.message, 'success');
      setTimeout(() => navigate('/login'), 3000);
    } catch (error) {
      showToast(error.message || 'Failed to reset password.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="login-page d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', background: 'var(--geist-background)' }}>
        <div className="p-5 glass-card text-center" style={{ maxWidth: '460px', width: '100%', borderRadius: '12px' }}>
          <i className="bi bi-exclamation-triangle text-danger display-1 mb-4"></i>
          <h3 className="fw-bold">Invalid Link</h3>
          <p className="text-muted">The password reset link is invalid or has expired.</p>
          <button className="btn btn-primary w-100 mt-3" onClick={() => navigate('/forgot-password')}>Request New Link</button>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', background: 'var(--geist-background)' }}>
      <div className="p-4 p-md-5 glass-card shadow-lg" style={{ maxWidth: '460px', width: '100%', borderRadius: '12px' }}>
        <div className="text-center mb-5">
          <div className="bg-success bg-opacity-10 text-success rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '64px', height: '64px' }}>
            <i className="bi bi-shield-lock-fill fs-2"></i>
          </div>
          <h3 className="fw-bold mb-2">Reset Password</h3>
          <p className="text-muted small">Choose a new secure password for your account.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="new-password" className="form-label text-muted small text-uppercase fw-bold mb-2 required-label">New Password</label>
            <input
              id="new-password"
              type="password"
              className={`form-control py-2 ${validationErrors.password ? 'is-invalid' : ''}`}
              placeholder="Min. 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="confirm-new-password" className="form-label text-muted small text-uppercase fw-bold mb-2 required-label">Confirm New Password</label>
            <input
              id="confirm-new-password"
              type="password"
              className={`form-control py-2 ${validationErrors.confirmPassword ? 'is-invalid' : ''}`}
              placeholder="Repeat new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-success w-100 py-2 mt-2 text-white fw-bold" disabled={isSubmitting}>
            {isSubmitting ? (
              <><span className="spinner-border spinner-border-sm me-2"></span>Updating...</>
            ) : (
              'Reset Password'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;

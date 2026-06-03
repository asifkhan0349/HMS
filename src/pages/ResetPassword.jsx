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
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', background: 'var(--geist-canvas-soft)' }}>
        <div className="premium-card" style={{ maxWidth: '420px', width: '100%' }}>
          <div className="p-6 text-center">
            <div className="d-inline-flex align-items-center justify-content-center mb-4" style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--danger-alpha)' }}>
              <i className="bi bi-exclamation-triangle text-danger" style={{ fontSize: '1.5rem' }} />
            </div>
            <h4 className="fw-bold mb-2" style={{ color: 'var(--geist-foreground)' }}>Invalid Link</h4>
            <p className="text-muted small mb-4">The password reset link is invalid or has expired.</p>
            <button className="btn btn-primary w-100" style={{ height: 44 }} onClick={() => navigate('/forgot-password')}>Request New Link</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', background: 'var(--geist-canvas-soft)' }}>
      <div className="premium-card" style={{ maxWidth: '420px', width: '100%' }}>
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="d-inline-flex align-items-center justify-content-center mb-4" style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, #16a34a, #10b981)' }}>
              <i className="bi bi-shield-lock-fill text-white" style={{ fontSize: '1.25rem' }} />
            </div>
            <h4 className="fw-bold mb-1" style={{ color: 'var(--geist-foreground)' }}>Reset Password</h4>
            <p className="text-muted small">Choose a new secure password for your account.</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="new-password" className="form-label required-label">New Password</label>
              <input
                id="new-password"
                type="password"
                className={`form-control ${validationErrors.password ? 'is-invalid' : ''}`}
                placeholder="Min. 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="confirm-new-password" className="form-label required-label">Confirm New Password</label>
              <input
                id="confirm-new-password"
                type="password"
                className={`form-control ${validationErrors.confirmPassword ? 'is-invalid' : ''}`}
                placeholder="Repeat new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>

            <button type="submit" className="btn btn-primary w-100 py-2" disabled={isSubmitting} style={{ height: 44 }}>
              {isSubmitting ? (
                <span className="d-inline-flex align-items-center gap-2">
                  <span className="spinner-border spinner-border-sm" role="status" />
                  Updating...
                </span>
              ) : 'Reset Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { authApi } from '../lib/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const { showToast } = useApp();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setValidationErrors({ email: true });
      showToast('Please fill in all mandatory fields highlighted in red.', 'warning');
      return;
    }
    setValidationErrors({});

    setIsSubmitting(true);
    try {
      const response = await authApi.forgotPassword(email);
      showToast(response.message, 'success');
      setTimeout(() => navigate('/login'), 5000);
    } catch (error) {
      showToast(error.message || 'Failed to request password reset.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', background: 'var(--geist-canvas-soft)' }}>
      <div className="premium-card" style={{ maxWidth: '420px', width: '100%' }}>
        <div className="p-4 p-sm-5">
          <div className="text-center mb-4">
            <div className="d-inline-flex align-items-center justify-content-center mb-4" style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, #16a34a, #10b981)' }}>
              <i className="bi bi-envelope-at text-white" style={{ fontSize: '1.25rem' }} />
            </div>
            <h4 className="fw-bold mb-1" style={{ color: 'var(--geist-foreground)' }}>Forgot Password?</h4>
            <p className="text-muted small">Enter your email and we&apos;ll send you a reset link.</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="reset-email" className="form-label required-label">Email Address</label>
              <input
                id="reset-email"
                type="email"
                className={`form-control ${validationErrors.email ? 'is-invalid' : ''}`}
                placeholder="name@hospital.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary w-100 py-2" disabled={isSubmitting} style={{ height: 44 }}>
              {isSubmitting ? (
                <span className="d-inline-flex align-items-center gap-2">
                  <span className="spinner-border spinner-border-sm" role="status" />
                  Sending Link...
                </span>
              ) : 'Send Reset Link'}
            </button>
          </form>

          <div className="text-center mt-4">
            <Link to="/login" className="text-decoration-none small fw-medium" style={{ color: 'var(--primary)' }}>
              <i className="bi bi-arrow-left me-1" /> Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

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
      // Navigate back to login after some delay
      setTimeout(() => navigate('/login'), 5000);
    } catch (error) {
      showToast(error.message || 'Failed to request password reset.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', background: 'var(--geist-background)' }}>
      <div className="p-4 p-md-5 glass-card shadow-lg" style={{ maxWidth: '460px', width: '100%', borderRadius: '12px' }}>
        <div className="text-center mb-5">
          <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '64px', height: '64px' }}>
            <i className="bi bi-envelope-at fs-2"></i>
          </div>
          <h3 className="fw-bold mb-2">Forgot Password?</h3>
          <p className="text-muted small">Enter your email and we'll send you a link to reset your password.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="reset-email" className="form-label text-muted small text-uppercase fw-bold mb-2 required-label">Email Address</label>
            <input
              id="reset-email"
              type="email"
              className={`form-control py-2 ${validationErrors.email ? 'is-invalid' : ''}`}
              placeholder="name@hospital.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary w-100 py-2 mt-2" disabled={isSubmitting}>
            {isSubmitting ? (
              <><span className="spinner-border spinner-border-sm me-2"></span>Sending Link...</>
            ) : (
              'Send Reset Link'
            )}
          </button>
        </form>

        <div className="text-center mt-4">
          <Link to="/login" className="text-decoration-none small text-muted">
            <i className="bi bi-arrow-left me-1"></i> Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const Login = ({ isModal = false, onClose, initialMode = 'login' }) => {
  const [searchParams] = useSearchParams();
  const urlMode = searchParams.get('mode');
  const [mode, setMode] = useState(urlMode || initialMode);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('Admin');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const { user, login, signup, showToast } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    setMode(urlMode || initialMode);
  }, [initialMode, urlMode]);

  const resetForm = () => {
    setFullName('');
    setEmail('');
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setRole('Admin');
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setShowPassword(false);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = {};
    if (mode === 'login') {
      if (!username.trim()) errors.username = true;
      if (!password.trim()) errors.password = true;
    } else {
      if (!fullName.trim()) errors.fullName = true;
      if (!username.trim()) errors.username = true;
      if (!email.trim()) errors.email = true;
      if (!password.trim()) errors.password = true;
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      showToast('Please fill in all mandatory fields highlighted in red.', 'warning');
      return;
    }
    setValidationErrors({});

    if (mode === 'signup' && password !== confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'login') {
        await login(username, password);
        showToast('Login successful!', 'success');
        const target = location.state?.from?.pathname || '/';
        navigate(target, { replace: true });
        if (isModal && onClose) onClose();
      } else {
        await signup({ fullName, username, email, password, role });
        showToast('Account created successfully. Please sign in.', 'success');
        switchMode('login');
      }
    } catch (error) {
      showToast(error.message || 'Authentication failed.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const content = (
    <div
      className="p-6 p-md-6 position-relative"
      style={{
        maxWidth: '420px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {isModal && (
        <button
          type="button"
          className="btn btn-link position-absolute p-0 text-muted"
          style={{ top: '16px', right: '16px' }}
          onClick={onClose}
        >
          <i className="bi bi-x-lg" style={{ fontSize: '1rem' }} />
        </button>
      )}

      <div className="text-center mb-6">
        <div className="d-inline-flex align-items-center justify-content-center mb-4" style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, #16a34a, #10b981)' }}>
          <i className="bi bi-hospital text-white" style={{ fontSize: '1.25rem' }} />
        </div>
        <h4 className="fw-bold mb-1" style={{ color: 'var(--geist-foreground)' }}>Welcome to HMS</h4>
        <p className="text-muted small mb-0">Sign in to your account</p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        {mode === 'signup' && (
          <>
            <div className="mb-3">
              <label htmlFor="auth-fullname" className="form-label required-label">Full Name</label>
              <input
                id="auth-fullname"
                type="text"
                className={`form-control ${validationErrors.fullName ? 'is-invalid' : ''}`}
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                autoComplete="name"
                spellCheck={false}
              />
            </div>
            <div className="mb-3">
              <label htmlFor="auth-email" className="form-label required-label">Email</label>
              <input
                id="auth-email"
                type="email"
                className={`form-control ${validationErrors.email ? 'is-invalid' : ''}`}
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                spellCheck={false}
              />
            </div>
          </>
        )}

        <div className="mb-3">
          <label htmlFor="auth-username" className="form-label required-label">Username</label>
          <input
            id="auth-username"
            type="text"
            className={`form-control ${validationErrors.username ? 'is-invalid' : ''}`}
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
            spellCheck={false}
          />
        </div>

        <div className="mb-4">
          <div className="d-flex justify-content-between align-items-center mb-1">
            <label htmlFor="auth-password" className="form-label required-label mb-0">Password</label>
            {mode === 'login' && (
              <Link
                to="/forgot-password"
                className="text-decoration-none small fw-medium"
                style={{ color: 'var(--primary)' }}
              >
                Forgot?
              </Link>
            )}
          </div>
          <div className="position-relative">
            <input
              id="auth-password"
              type={showPassword ? 'text' : 'password'}
              className={`form-control ${validationErrors.password ? 'is-invalid' : ''}`}
              placeholder={showPassword ? 'password' : '********'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              style={{ paddingRight: '42px' }}
            />
            <button
              type="button"
              className="btn btn-link position-absolute p-0 text-muted"
              onClick={() => setShowPassword((prev) => !prev)}
              style={{ right: '12px', top: '50%', transform: 'translateY(-50%)', lineHeight: 1 }}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`} style={{ fontSize: '1rem' }} />
            </button>
          </div>
        </div>

        {mode === 'signup' && (
          <div className="mb-4">
            <label htmlFor="auth-confirm-password" className="form-label required-label">Confirm Password</label>
            <input
              id="auth-confirm-password"
              type="password"
              className="form-control"
              placeholder="********"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>
        )}

        <button type="submit" className="btn btn-primary w-100 py-2.5" disabled={isSubmitting} style={{ height: 44 }}>
          {isSubmitting ? (
            <span className="d-inline-flex align-items-center gap-2">
              <span className="spinner-border spinner-border-sm" role="status" />
              Please wait...
            </span>
          ) : mode === 'login' ? 'Sign In' : 'Create Account'}
        </button>
      </form>

      <p className="text-center text-muted small mt-4 mb-0" style={{ fontSize: '0.75rem', lineHeight: 1.5 }}>
        Access restricted to authorized personnel only.
      </p>
    </div>
  );

  if (isModal) {
    return (
      <div
        className="modal-overlay"
        onClick={onClose}
        style={{ background: 'rgba(15, 23, 42, 0.6)' }}
      >
        <div className="premium-card" style={{ maxWidth: '420px', width: '100%' }}>
          {content}
        </div>
      </div>
    );
  }

  return (
    <div
      className="d-flex align-items-center justify-content-center"
      style={{ minHeight: '100vh', background: 'var(--geist-canvas-soft)' }}
    >
      <div className="premium-card" style={{ maxWidth: '420px', width: '100%' }}>
        {content}
      </div>
    </div>
  );
};

export default Login;

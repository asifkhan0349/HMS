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
    // If user is already logged in, they should not see the login page
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
      className="p-4 p-md-5 position-relative shadow-lg"
      style={{ 
        maxWidth: '460px', 
        width: '100%', 
        maxHeight: '90vh',
        overflowY: 'auto',
        border: '1px solid var(--accents-2)',
        borderRadius: '12px',
        backgroundColor: 'var(--geist-background)'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {isModal && (
        <button 
          type="button"
          className="btn btn-link position-absolute p-0 text-muted" 
          style={{ top: '20px', right: '20px' }}
          onClick={onClose}
        >
          <i className="bi bi-x-lg fs-5"></i>
        </button>
      )}
      <div className="text-center mb-5">
          <h3 className="fw-bold mb-2">Sign In</h3>
          <p className="text-muted small mb-0">Elite Hospital Management System</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-4">
            <label htmlFor="auth-username" className="form-label text-muted small text-uppercase fw-bold mb-2 required-label">Username</label>
            <input
              id="auth-username"
              type="text"
              className={`form-control py-2 ${validationErrors.username ? 'is-invalid' : ''}`}
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              spellCheck={false}
            />
          </div>

          <div className="mb-4">
            <div className="d-flex justify-content-between mb-2">
              <label htmlFor="auth-password" className="form-label text-muted small text-uppercase fw-bold mb-0 required-label">Password</label>
              <Link
                to="/forgot-password"
                className="btn btn-link p-0 text-muted small text-decoration-none"
              >
                Forgot?
              </Link>
            </div>
            <div className="position-relative">
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                className={`form-control py-2 ${validationErrors.password ? 'is-invalid' : ''}`}
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                style={{ paddingRight: '42px' }}
              />
              <button
                type="button"
                className="btn btn-link position-absolute p-0 text-muted"
                onClick={() => setShowPassword((prev) => !prev)}
                style={{ right: '12px', top: '50%', transform: 'translateY(-50%)', lineHeight: 1 }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`} style={{ fontSize: '1rem' }}></i>
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-100 py-2 mt-2" disabled={isSubmitting}>
            {isSubmitting ? 'Please wait...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-muted small mt-4 mb-0">
          Access restricted to authorized personnel only.
        </p>
      </div>
  );

  if (isModal) {
    return (
      <div 
        className="modal-overlay d-flex align-items-center justify-content-center"
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 1050
        }}
        onClick={onClose}
      >
        {content}
      </div>
    );
  }

  return (
    <div
      className="login-page d-flex align-items-center justify-content-center"
      style={{ minHeight: '100vh', background: 'var(--geist-background)' }}
    >
      {content}
    </div>
  );
};

export default Login;

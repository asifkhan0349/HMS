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
          <h3 className="fw-bold mb-2">{mode === 'login' ? 'Sign In' : 'Create Account'}</h3>
          <p className="text-muted small mb-0">Elite Hospital Management System</p>
        </div>

        <div
          className="d-flex rounded-pill p-1 mb-4"
          style={{ background: 'var(--accents-1)', border: '1px solid var(--accents-2)' }}
        >
          <button
            type="button"
            className={`btn btn-sm rounded-pill flex-fill ${
              mode === 'login' ? 'btn-primary' : 'btn-link text-muted text-decoration-none'
            }`}
            onClick={() => switchMode('login')}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`btn btn-sm rounded-pill flex-fill ${
              mode === 'signup' ? 'btn-primary' : 'btn-link text-muted text-decoration-none'
            }`}
            onClick={() => switchMode('signup')}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {mode === 'signup' && (
            <>
              <div className="mb-4">
                <label htmlFor="signup-full-name" className="form-label text-muted small text-uppercase fw-bold mb-2">Full Name</label>
                <input
                  id="signup-full-name"
                  type="text"
                  className="form-control py-2"
                  placeholder="Jane Admin"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  autoComplete="name"
                />
              </div>

              <div className="mb-4">
                <label htmlFor="signup-email" className="form-label text-muted small text-uppercase fw-bold mb-2">Email</label>
                <input
                  id="signup-email"
                  type="email"
                  className="form-control py-2"
                  placeholder="name@hospital.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </>
          )}

          <div className="mb-4">
            <label htmlFor="auth-username" className="form-label text-muted small text-uppercase fw-bold mb-2">Username</label>
            <input
              id="auth-username"
              type="text"
              className="form-control py-2"
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
              <label htmlFor="auth-password" className="form-label text-muted small text-uppercase fw-bold mb-0">Password</label>
              {mode === 'login' && (
                <Link
                  to="/forgot-password"
                  className="btn btn-link p-0 text-muted small text-decoration-none"
                >
                  Forgot?
                </Link>
              )}
            </div>
            <div className="position-relative">
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                className="form-control py-2"
                placeholder="********"
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
                <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`} style={{ fontSize: '1rem' }}></i>
              </button>
            </div>
          </div>

          {mode === 'signup' && (
            <>
              <div className="mb-4">
                <label htmlFor="signup-confirm-password" className="form-label text-muted small text-uppercase fw-bold mb-2">Confirm Password</label>
                <input
                  id="signup-confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-control py-2"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>

              <div className="mb-4">
                <label htmlFor="signup-role" className="form-label text-muted small text-uppercase fw-bold mb-2">Role</label>
                <select id="signup-role" className="form-select py-2" value={role} onChange={(e) => setRole(e.target.value)}>
                  <option>Admin</option>
                  <option>Doctor</option>
                  <option>Nurse</option>
                  <option>Reception</option>
                  <option>Patient</option>
                </select>
              </div>
            </>
          )}

          <button type="submit" className="btn btn-primary w-100 py-2 mt-2" disabled={isSubmitting}>
            {isSubmitting ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-muted small mt-4 mb-0">
          {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            type="button"
            className="btn btn-link btn-sm p-0 align-baseline text-decoration-none"
            onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
          >
            {mode === 'login' ? 'Sign up here' : 'Sign in here'}
          </button>
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

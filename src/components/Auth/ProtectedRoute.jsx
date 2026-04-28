import React, { useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

/**
 * ProtectedRoute — ensures the user is authenticated before rendering a page.
 *
 * Props:
 *   adminOnly    {boolean}  Shorthand for allowedRoles={['Admin']}.
 *   allowedRoles {string[]} Whitelist of roles that may access this route.
 *                           When omitted (and adminOnly is false) any
 *                           authenticated user is allowed.
 *
 * Guard order:
 *  1. isAppLoading  — hold render while context hydrates from sessionStorage
 *                     (hard reload race condition — avoids flash to /login).
 *  2. !user|!token  — no valid session → /login.
 *  3. allowedRoles  — authenticated but role not in whitelist:
 *                       • navigate(-1) if there is prior browser history
 *                         (i.e. the user navigated here from within the app).
 *                       • fall back to /settings when the URL was opened fresh
 *                         (new tab / copy-paste) and there is no history to
 *                         return to — /settings is accessible by every role so
 *                         it can never cause a redirect loop.
 */
const ProtectedRoute = ({ children, adminOnly = false, allowedRoles = null }) => {
  const { user, isAppLoading } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const token = sessionStorage.getItem('hms_token');

  // Resolve the effective role whitelist before any early returns so that
  // the hook call below is always reached (Rules of Hooks).
  const effectiveRoles = adminOnly ? ['Admin'] : allowedRoles;
  const isRoleViolation =
    !isAppLoading &&
    !!user &&
    !!token &&
    !!effectiveRoles &&
    !effectiveRoles.includes(user.role);

  useEffect(() => {
    if (!isRoleViolation) return;

    if (window.history.length > 1) {
      // User navigated here from within the app — go back.
      navigate(-1);
    } else {
      // Fresh URL (new tab / direct link) — no prior page to return to.
      navigate('/settings', { replace: true });
    }
  }, [isRoleViolation, navigate]);

  // 1. Hold render until session is restored.
  if (isAppLoading) return null;

  // 2. Unauthenticated → /login (preserves intended destination).
  if (!user || !token) {
    return <Navigate to="/login" state={{ requireLogin: true, from: location }} replace />;
  }

  // 3. Role violation — render nothing while the useEffect navigates back.
  if (isRoleViolation) return null;

  return children;
};

export default ProtectedRoute;

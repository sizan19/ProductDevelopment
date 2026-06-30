// Route guard for the admin area. Verifies the session against the
// existing backend (GET /api/auth/me) — it never inspects tokens
// itself, so the server stays the single source of truth. Redirects
// to the admin login when unauthenticated.
import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getJSON } from '../api';
import { Loading } from './States';

function RequireAuth({ children }) {
  const [status, setStatus] = useState('checking'); // checking | ok | denied
  const location = useLocation();

  useEffect(() => {
    let active = true;
    getJSON('/api/auth/me')
      .then(() => active && setStatus('ok'))
      .catch(() => active && setStatus('denied'));
    return () => { active = false; };
  }, []);

  if (status === 'checking') {
    return <div className="auth-screen"><Loading label="Checking your session…" /></div>;
  }
  if (status === 'denied') {
    return <Navigate to="/admin/login" state={{ from: location.pathname }} replace />;
  }
  return children;
}

export default RequireAuth;

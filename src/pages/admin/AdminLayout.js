// Admin back-office shell: dark sidebar (visually distinct from the
// public cream site) + routed content. Loads the current admin via
// the existing /api/auth/me and logs out via /api/auth/logout.
import { useEffect, useState } from 'react';
import { Outlet, useNavigate, Link } from 'react-router-dom';
import { getJSON, postJSON } from '../../api';
import Brand from '../../components/Brand';
import Icon from '../../components/Icon';

function AdminLayout() {
  const [me, setMe] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    getJSON('/api/auth/me').then((d) => setMe(d.user)).catch(() => {});
  }, []);

  const logout = async () => {
    try { await postJSON('/api/auth/logout', {}); } catch {/* ignore */}
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className="admin">
      <aside className="admin__side">
        <div className="admin__brand"><Brand to={null} onDark /></div>

        <nav aria-label="Admin">
          <Link to="/admin" className="admin__navlink is-active">
            <Icon name="inbox" size={16} /> Enquiries
          </Link>
          <Link to="/" className="admin__navlink">
            <Icon name="globe" size={16} /> View website
          </Link>
        </nav>

        <div className="admin__spacer" />

        <div style={{ borderTop: '1px solid var(--dark-border)', paddingTop: 14 }}>
          {me && (
            <p className="mono" style={{ fontSize: 11, color: 'var(--dark-dim)', marginBottom: 10, wordBreak: 'break-all' }}>
              {me.username}
            </p>
          )}
          <button type="button" className="admin__navlink" onClick={logout}>
            <Icon name="logout" size={16} /> Sign out
          </button>
        </div>
      </aside>

      <div className="admin__main">
        <Outlet />
      </div>
    </div>
  );
}

export default AdminLayout;

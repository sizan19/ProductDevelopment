// Admin dashboard — the sole back-office job: review Contact Us
// enquiries. Headline stats + a searchable, filterable, paginated
// table, with a full-detail modal per enquiry.
import { useEffect, useState, useCallback } from 'react';
import { getJSON, postJSON, apiFetch } from '../../api';
import Modal from '../../components/Modal';
import Icon from '../../components/Icon';
import { Loading, ErrorState, EmptyState } from '../../components/States';

function StatCard({ num, label }) {
  return (
    <div className="stat-card">
      <div className="stat">
        <span className="stat__num">{num}</span>
        <span className="stat__label">{label}</span>
      </div>
    </div>
  );
}

function fmtDateTime(d) {
  return new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [country, setCountry] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const [list, setList] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [active, setActive] = useState(null);     // open enquiry detail
  const [detailLoading, setDetailLoading] = useState(false);

  const limit = 10;

  // Debounce the free-text search.
  useEffect(() => {
    const t = setTimeout(() => { setDebounced(search); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const loadStats = useCallback(() => {
    getJSON('/api/admin/stats').then(setStats).catch(() => {});
  }, []);

  const loadList = useCallback(() => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (debounced) params.set('search', debounced);
    if (country) params.set('country', country);
    if (status) params.set('status', status);
    getJSON(`/api/admin/inquiries?${params.toString()}`)
      .then(setList)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [page, debounced, country, status]);

  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => { loadList(); }, [loadList]);

  const openDetail = async (id) => {
    setDetailLoading(true);
    try {
      const data = await getJSON(`/api/admin/inquiries/${id}`);
      setActive(data.inquiry);
      loadStats();      // unread count may change (viewing marks read)
      loadList();
    } catch (e) {
      setError(e.message);
    } finally {
      setDetailLoading(false);
    }
  };

  const removeInquiry = async (id) => {
    if (!window.confirm('Delete this enquiry? This cannot be undone.')) return;
    try {
      await apiFetch(`/api/admin/inquiries/${id}`, { method: 'DELETE' });
      setActive(null);
      loadStats();
      loadList();
    } catch (e) {
      setError(e.message);
    }
  };

  const toggleRead = async (inq) => {
    try {
      await postJSON(`/api/admin/inquiries/${inq.id}/read`, { is_read: !inq.is_read }, 'PATCH');
      loadStats();
      loadList();
      setActive((a) => (a && a.id === inq.id ? { ...a, is_read: !inq.is_read } : a));
    } catch (e) {
      setError(e.message);
    }
  };

  const inquiries = list?.inquiries || [];
  const pg = list?.pagination;

  return (
    <>
      <div className="admin__topbar">
        <div className="admin__title">
          <h1>Customer Enquiries</h1>
          <p>Every submission from the public Contact Us form.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid--4" style={{ marginBottom: 28 }}>
        <StatCard num={stats ? stats.totalInquiries : '—'} label="Total enquiries" />
        <StatCard num={stats ? stats.unreadInquiries : '—'} label="Unread" />
        <StatCard num={stats ? stats.last7Days : '—'} label="Last 7 days" />
        <StatCard num={stats ? stats.today : '—'} label="Today" />
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="toolbar__grow" style={{ position: 'relative', minWidth: 220 }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-dim)' }}>
            <Icon name="search" size={16} />
          </span>
          <input
            className="input"
            style={{ paddingLeft: 38, width: '100%' }}
            placeholder="Search name, email, company, details…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search enquiries"
          />
        </div>

        <label className="sr-only" htmlFor="f-country">Filter by country</label>
        <select id="f-country" className="select" value={country} onChange={(e) => { setCountry(e.target.value); setPage(1); }}>
          <option value="">All countries</option>
          {(stats?.countries || []).map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        <label className="sr-only" htmlFor="f-status">Filter by status</label>
        <select id="f-status" className="select" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All statuses</option>
          <option value="unread">Unread</option>
          <option value="read">Read</option>
        </select>

        {(search || country || status) && (
          <button type="button" className="btn btn--ghost" onClick={() => { setSearch(''); setCountry(''); setStatus(''); setPage(1); }}>
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      {loading && <Loading label="Loading enquiries…" />}
      {error && !loading && <ErrorState message={error} onRetry={loadList} />}
      {!loading && !error && inquiries.length === 0 && (
        <EmptyState
          title="No enquiries found"
          message={search || country || status ? 'Try clearing your filters.' : 'New Contact Us submissions will appear here.'}
        />
      )}

      {!loading && !error && inquiries.length > 0 && (
        <>
          <div className="table-wrap">
            <table className="data">
              <caption className="sr-only">Customer enquiries</caption>
              <thead>
                <tr>
                  <th scope="col">Status</th>
                  <th scope="col">Name</th>
                  <th scope="col">Company</th>
                  <th scope="col">Country</th>
                  <th scope="col">Received</th>
                  <th scope="col"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {inquiries.map((inq) => (
                  <tr
                    key={inq.id}
                    className={inq.is_read ? '' : 'row-unread'}
                    onClick={() => openDetail(inq.id)}
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter') openDetail(inq.id); }}
                  >
                    <td><span className={`badge ${inq.is_read ? 'badge--read' : 'badge--new'}`}>{inq.is_read ? 'Read' : 'New'}</span></td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{inq.full_name}</div>
                      <div className="muted" style={{ fontSize: 12.5 }}>{inq.email}</div>
                    </td>
                    <td>{inq.company || <span className="muted">—</span>}</td>
                    <td>{inq.country || <span className="muted">—</span>}</td>
                    <td className="mono" style={{ fontSize: 12, color: 'var(--ink-dim)' }}>{fmtDateTime(inq.created_at)}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <button type="button" className="btn btn--ghost" onClick={() => openDetail(inq.id)} aria-label={`View enquiry from ${inq.full_name}`}>
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pg && (
            <div className="pagination">
              <span className="pagination__info">
                Page {pg.page} of {pg.totalPages} · {pg.totalCount} enquir{pg.totalCount === 1 ? 'y' : 'ies'}
              </span>
              <div className="flex gap-8">
                <button type="button" className="btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
                <button type="button" className="btn" disabled={page >= pg.totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Detail modal */}
      {(active || detailLoading) && (
        <Modal title={active ? `Enquiry from ${active.full_name}` : 'Loading…'} onClose={() => setActive(null)}>
          {!active ? (
            <Loading label="Loading enquiry…" />
          ) : (
            <>
              <dl className="dl">
                <dt>Full name</dt><dd>{active.full_name}</dd>
                <dt>Email</dt><dd><a href={`mailto:${active.email}`}>{active.email}</a></dd>
                <dt>Phone</dt><dd>{active.phone || <span className="muted">Not provided</span>}</dd>
                <dt>Company</dt><dd>{active.company || <span className="muted">Not provided</span>}</dd>
                <dt>Country</dt><dd>{active.country || <span className="muted">Not provided</span>}</dd>
                <dt>Job title</dt><dd>{active.job_title || <span className="muted">Not provided</span>}</dd>
                <dt>Received</dt><dd>{fmtDateTime(active.created_at)}</dd>
                <dt>Job details</dt><dd style={{ whiteSpace: 'pre-wrap' }}>{active.job_details}</dd>
              </dl>

              <div className="flex between wrap gap-12 mt-24">
                <div className="flex gap-8 wrap">
                  <a className="btn btn--primary" href={`mailto:${active.email}?subject=Re: your enquiry to AI-Solutions`}>
                    <Icon name="mail" size={15} /> Reply by email
                  </a>
                  <button type="button" className="btn" onClick={() => toggleRead(active)}>
                    Mark as {active.is_read ? 'unread' : 'read'}
                  </button>
                </div>
                <button type="button" className="btn btn--ghost" onClick={() => removeInquiry(active.id)} style={{ color: 'var(--danger)' }}>
                  <Icon name="trash" size={15} /> Delete
                </button>
              </div>
            </>
          )}
        </Modal>
      )}
    </>
  );
}

export default AdminDashboard;

// Shared fetch wrapper that handles CSRF tokens and auto-refreshes expired sessions
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function getCookie(name) {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
}

async function ensureCsrfToken() {
  if (!getCookie('csrfToken')) {
    await fetch(`${API_BASE}/`, { credentials: 'include' });
  }
  return getCookie('csrfToken');
}

async function apiFetch(path, options = {}) {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;

  const csrfToken = await ensureCsrfToken();

  const headers = {
    ...options.headers,
  };

  const method = (options.method || 'GET').toUpperCase();
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method) && csrfToken) {
    headers['X-CSRF-Token'] = csrfToken;
  }

  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (res.status === 401 && !path.includes('/refresh-token')) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      const retryCsrf = getCookie('csrfToken');
      if (!['GET', 'HEAD', 'OPTIONS'].includes(method) && retryCsrf) {
        headers['X-CSRF-Token'] = retryCsrf;
      }
      return fetch(url, {
        ...options,
        headers,
        credentials: 'include',
      });
    }
  }

  return res;
}

async function tryRefreshToken() {
  try {
    const csrfToken = getCookie('csrfToken');
    const headers = {};
    if (csrfToken) headers['X-CSRF-Token'] = csrfToken;

    const res = await fetch(`${API_BASE}/api/auth/refresh-token`, {
      method: 'POST',
      credentials: 'include',
      headers,
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ---- Convenience JSON helpers ------------------------------
// Resolve with parsed JSON on success; throw an Error whose
// message is the backend's message on failure, so callers can
// show clean error states.
async function getJSON(path) {
  const res = await apiFetch(path);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Something went wrong.');
  return data;
}

async function postJSON(path, body, method = 'POST') {
  const res = await apiFetch(path, { method, body: JSON.stringify(body || {}) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || 'Something went wrong.');
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export { apiFetch, API_BASE, getJSON, postJSON };

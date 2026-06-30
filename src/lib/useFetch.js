// Tiny data-fetching hook → { data, loading, error, reload }.
// Wraps the shared getJSON helper so every page gets consistent
// loading / error / empty handling.
import { useState, useEffect, useCallback } from 'react';
import { getJSON } from '../api';

export default function useFetch(path) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    let active = true;
    setLoading(true);
    setError('');
    getJSON(path)
      .then((d) => { if (active) setData(d); })
      .catch((e) => { if (active) setError(e.message || 'Failed to load.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [path]);

  useEffect(() => load(), [load]);

  return { data, loading, error, reload: load };
}

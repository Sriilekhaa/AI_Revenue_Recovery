/* API interaction hooks */

import { useState, useCallback } from 'react';
import { API_BASE } from '../utils/constants';

export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async (endpoint, options = {}) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
      });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();
      setLoading(false);
      return data;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  }, []);

  const post = useCallback(async (endpoint, body) => {
    return fetchData(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }, [fetchData]);

  return { fetchData, post, loading, error };
}

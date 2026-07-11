import { useState, useEffect, useCallback } from 'react';

const API_BASE = '/api';

function buildFilterParams(filters) {
  const params = new URLSearchParams();
  filters.status.forEach((value) => params.append('status', value));
  filters.category.forEach((value) => params.append('category', value));
  filters.priority.forEach((value) => params.append('priority', value));
  return params;
}

export function useTickets(filters) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(null);

    const params = buildFilterParams(filters);
    const query = params.toString();
    const url = `${API_BASE}/tickets${query ? `?${query}` : ''}`;

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch tickets');
      const data = await res.json();
      setTickets(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  return { tickets, loading, error, refetch: fetchTickets };
}

export function useMeta() {
  const [meta, setMeta] = useState({
    statuses: [],
    categories: [],
    priorities: [],
    total: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/meta`)
      .then((res) => res.json())
      .then(setMeta)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { meta, loading };
}

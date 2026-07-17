import { useState, useEffect, useCallback } from 'react';

const API_BASE = '/api';

function buildFilterParams(filters, { page, limit } = {}) {
  const params = new URLSearchParams();
  (filters.status || []).forEach((value) => params.append('status', value));
  (filters.category || []).forEach((value) => params.append('category', value));
  (filters.priority || []).forEach((value) => params.append('priority', value));
  (filters.floor || []).forEach((value) => params.append('floor', value));

  const search = String(filters.search || '').trim();
  if (search) params.set('q', search);

  if (filters.overdue) params.set('overdue', '1');

  const assignee = String(filters.assignee || '').trim();
  if (assignee) params.set('assignee', assignee);

  if (page != null) params.set('page', String(page));
  if (limit != null) params.set('limit', String(limit));

  return params;
}

const EMPTY_PAGINATION = {
  page: 1,
  limit: 0,
  total: 0,
  totalPages: 0,
};

export function filtersKey(filters) {
  return [
    (filters.status || []).join(','),
    (filters.category || []).join(','),
    (filters.priority || []).join(','),
    (filters.floor || []).join(','),
    filters.overdue ? '1' : '0',
    String(filters.search || '').trim(),
    String(filters.assignee || '').trim(),
  ].join('|');
}

export function useTickets(filters, { page, limit, enabled = true } = {}) {
  const [tickets, setTickets] = useState([]);
  const [pagination, setPagination] = useState(EMPTY_PAGINATION);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(null);

  const fetchTickets = useCallback(async () => {
    if (!enabled) {
      setTickets([]);
      setPagination(EMPTY_PAGINATION);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const params = buildFilterParams(filters, { page, limit });
    const query = params.toString();
    const url = `${API_BASE}/tickets${query ? `?${query}` : ''}`;

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch tickets');
      const data = await res.json();
      setTickets(data.tickets ?? []);
      setPagination(data.pagination ?? EMPTY_PAGINATION);
    } catch (err) {
      setError(err.message);
      setTickets([]);
      setPagination(EMPTY_PAGINATION);
    } finally {
      setLoading(false);
    }
  }, [filters, page, limit, enabled]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  return { tickets, pagination, loading, error, refetch: fetchTickets };
}

/**
 * Server-side pagination: owns page state, resets on filter changes,
 * re-fetches when the user changes page.
 */
export function usePagedTickets(filters, limit, { enabled = true } = {}) {
  const [page, setPage] = useState(1);
  const resetKey = filtersKey(filters);

  useEffect(() => {
    setPage(1);
  }, [resetKey]);

  const { tickets, pagination, loading, error, refetch } = useTickets(filters, {
    page,
    limit,
    enabled,
  });

  const totalPages = Math.max(1, pagination.totalPages || 1);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const goToPage = (nextPage) => {
    setPage(Math.min(Math.max(1, nextPage), totalPages));
  };

  return {
    tickets,
    pagination,
    loading,
    error,
    refetch,
    page,
    pageSize: limit,
    totalPages,
    totalItems: pagination.total,
    goToPage,
    goNext: () => goToPage(page + 1),
    goPrev: () => goToPage(page - 1),
    hasPrev: page > 1,
    hasNext: page < totalPages,
  };
}

export function useTicket(id) {
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchTicket = useCallback(async () => {
    if (id == null || id === '') {
      setTicket(null);
      setLoading(false);
      setError('Invalid ticket id');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/tickets/${id}`);
      if (res.status === 404) throw new Error('Ticket not found');
      if (!res.ok) throw new Error('Failed to fetch ticket');
      const data = await res.json();
      setTicket(data);
    } catch (err) {
      setError(err.message);
      setTicket(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTicket();
  }, [fetchTicket]);

  const updateTicket = useCallback(
    async (patch) => {
      if (id == null || id === '') {
        throw new Error('Invalid ticket id');
      }

      setSaving(true);
      try {
        const res = await fetch(`${API_BASE}/tickets/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patch),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Failed to update ticket');
        setTicket(data);
        setError(null);
        return data;
      } finally {
        setSaving(false);
      }
    },
    [id]
  );

  const addAttachment = useCallback(
    async (attachment) => {
      if (id == null || id === '') {
        throw new Error('Invalid ticket id');
      }

      setSaving(true);
      try {
        const res = await fetch(`${API_BASE}/tickets/${id}/attachments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(attachment),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Failed to upload evidence');
        setTicket(data);
        setError(null);
        return data;
      } finally {
        setSaving(false);
      }
    },
    [id]
  );

  const removeAttachment = useCallback(
    async (attachmentId, options = {}) => {
      if (id == null || id === '') {
        throw new Error('Invalid ticket id');
      }
      if (!attachmentId) {
        throw new Error('Missing attachment id');
      }

      setSaving(true);
      try {
        const res = await fetch(
          `${API_BASE}/tickets/${id}/attachments/${encodeURIComponent(attachmentId)}`,
          {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(options),
          }
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Failed to remove image');
        setTicket(data);
        setError(null);
        return data;
      } finally {
        setSaving(false);
      }
    },
    [id]
  );

  const submitQuote = useCallback(
    async (quote) => {
      if (id == null || id === '') {
        throw new Error('Invalid ticket id');
      }

      setSaving(true);
      try {
        const res = await fetch(`${API_BASE}/tickets/${id}/quotes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(quote),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Failed to submit quote');
        setTicket(data);
        setError(null);
        return data;
      } finally {
        setSaving(false);
      }
    },
    [id]
  );

  const decideQuote = useCallback(
    async (quoteId, status, actor) => {
      if (id == null || id === '') {
        throw new Error('Invalid ticket id');
      }

      setSaving(true);
      try {
        const res = await fetch(`${API_BASE}/tickets/${id}/quotes/${quoteId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status, actor }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Failed to update quote');
        setTicket(data);
        setError(null);
        return data;
      } finally {
        setSaving(false);
      }
    },
    [id]
  );

  return {
    ticket,
    loading,
    error,
    saving,
    refetch: fetchTicket,
    updateTicket,
    addAttachment,
    removeAttachment,
    submitQuote,
    decideQuote,
  };
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

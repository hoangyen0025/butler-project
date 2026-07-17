import { useCallback, useEffect, useState } from 'react';
import './TicketSummary.css';

export function TicketSummary({ ticketId, refreshKey }) {
  const [summary, setSummary] = useState('');
  const [source, setSource] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!ticketId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/tickets/${ticketId}/summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Could not summarize ticket');
      }
      setSummary(String(data.summary || '').trim());
      setSource(data.source || null);
    } catch (err) {
      setError(err.message || 'Could not summarize ticket');
      setSummary('');
      setSource(null);
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  if (!ticketId) return null;

  return (
    <div className="ticket-summary" aria-live="polite">
      <div className="ticket-summary__label">
        <span>Summary</span>
        {source === 'openai' && (
          <span className="ticket-summary__badge">AI</span>
        )}
        {source === 'fallback' && !loading && (
          <span className="ticket-summary__badge ticket-summary__badge--local">
            Quick
          </span>
        )}
      </div>
      <div className="ticket-summary__body">
        {loading && !summary ? (
          <p className="ticket-summary__text ticket-summary__text--muted">
            Writing one-liner…
          </p>
        ) : error && !summary ? (
          <p className="ticket-summary__text ticket-summary__text--error">{error}</p>
        ) : (
          <p className="ticket-summary__text" title={summary}>
            {summary}
          </p>
        )}
        <button
          type="button"
          className="btn btn--ghost ticket-summary__refresh"
          onClick={load}
          disabled={loading}
          title="Refresh summary"
        >
          {loading ? '…' : 'Refresh'}
        </button>
      </div>
    </div>
  );
}

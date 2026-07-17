import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import './CategoryExtraCharts.css';

function formatHkd(n) {
  return `HKD ${Math.round(Number(n) || 0).toLocaleString('en-HK')}`;
}

/** Pending vendor part quotes across the current filtered ticket set. */
export function PendingQuotes({ tickets }) {
  const rows = useMemo(() => {
    const items = [];
    for (const ticket of tickets || []) {
      for (const quote of ticket.quoteRequests || []) {
        if (quote.status !== 'pending') continue;
        items.push({
          ticketId: ticket.id,
          title: ticket.title,
          assignee: ticket.assignee,
          category: ticket.category,
          ...quote,
        });
      }
    }
    return items
      .sort((a, b) => String(b.requestedAt || '').localeCompare(String(a.requestedAt || '')))
      .slice(0, 8);
  }, [tickets]);

  const totalPending = useMemo(() => {
    let n = 0;
    for (const ticket of tickets || []) {
      for (const quote of ticket.quoteRequests || []) {
        if (quote.status === 'pending') n += 1;
      }
    }
    return n;
  }, [tickets]);

  return (
    <div className="cat-chart">
      <div className="cat-chart__head">
        <div>
          <h4 className="cat-chart__title">Pending part quotes</h4>
          <p className="cat-chart__subtitle">
            Vendor requests awaiting staff approval
            {totalPending > 0 ? ` · ${totalPending} open` : ''}
          </p>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="empty-state">No pending part quotes in this filter.</div>
      ) : (
        <ul className="pending-quotes" role="list">
          {rows.map((row) => (
            <li key={`${row.ticketId}-${row.id}`} className="pending-quotes__row">
              <div className="pending-quotes__main">
                <Link
                  to={`/tickets/${row.ticketId}`}
                  className="pending-quotes__ticket"
                >
                  #{row.ticketId} · {row.title}
                </Link>
                <p className="pending-quotes__part">
                  <strong>{row.partName}</strong>
                  <span>
                    × {row.qty} · {formatHkd(row.estimatedTotal)}
                  </span>
                </p>
                <p className="pending-quotes__meta">
                  {row.assignee || 'Unassigned'}
                  {row.category ? ` · ${row.category}` : ''}
                  {row.note ? ` · ${row.note}` : ''}
                </p>
              </div>
              <Link
                to={`/tickets/${row.ticketId}`}
                className="btn btn--outline pending-quotes__cta"
              >
                Review
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

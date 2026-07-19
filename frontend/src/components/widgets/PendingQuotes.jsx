import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTickets } from '../../hooks/useTickets';
import { formatDateTime } from '../../utils';
import './CategoryExtraCharts.css';

// load every ticket (not limited by the dashboard FilterBar).
const ALL_TICKETS_FILTERS = {
  status: [],
  category: [],
  priority: [],
  search: '',
};

//format number to HKD
function formatHkd(n) {
  return `HKD ${Math.round(Number(n) || 0).toLocaleString('en-HK')}`;
}

/** All pending vendor part quotes across the whole ticket set. */
export function PendingQuotes() {
  const { tickets, loading } = useTickets(ALL_TICKETS_FILTERS); //→ GET /api/tickets (no filters) so quotes from any ticket can appear.

  const rows = useMemo(() => {
    const items = [];
    //loop through every ticket from useTickets -  if tickets is null/undefined, use an empty array
    for (const ticket of tickets || []) {
      //for each quote of that ticket, loop through every quoteRequest - if no quoteRequest -> use empty array 
      for (const quote of ticket.quoteRequests || []) {
        //if quote status = pending
        if (quote.status !== 'pending') continue;
        items.push({ //get ticket info
          ticketId: ticket.id,
          title: ticket.title,
          assignee: ticket.assignee,
          category: ticket.category,
          ...quote,
        });
      }
    }
    return items.sort((a, b) =>
      String(b.requestedAt || '').localeCompare(String(a.requestedAt || ''))
    );
  }, [tickets]);

  //Pending part quotes

  return (
    <div className="cat-chart">
      <div className="cat-chart__head">
        <div>
          <h4 className="cat-chart__title">Pending part quotes</h4>
          <p className="cat-chart__subtitle">
            Vendor requests awaiting staff approval
            {rows.length > 0 ? ` · ${rows.length} open` : ''}
          </p>
        </div>
      </div>

      {loading && rows.length === 0 ? (
        <div className="empty-state">Loading pending quotes…</div>
      ) : rows.length === 0 ? (
        <div className="empty-state">No pending part quotes.</div>
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
                  {row.requestedAt
                    ? ` · Requested ${formatDateTime(row.requestedAt)}`
                    : ''}
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

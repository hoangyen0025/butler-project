import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '../Badge';
import { Pagination } from '../Pagination';
import { usePagedTickets } from '../../hooks/useTickets';
import { statusClass, priorityClass, formatDate } from '../../utils';
import { recentTicketsAllPath } from '../../utils/filterParams';
import { exportTicketsCsv } from '../../utils/csvExport';

const TICKETS_PER_PAGE = 5;

export function TicketTable({ filters }) {
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(null);

  const {
    tickets,
    totalItems,
    totalPages,
    pageSize,
    page,
    loading,
    error,
    goToPage,
    goNext,
    goPrev,
    hasPrev,
    hasNext,
  } = usePagedTickets(filters, TICKETS_PER_PAGE);

  const handleExport = async () => {
    if (exporting || totalItems === 0) return;
    setExporting(true);
    setExportError(null);
    try {
      await exportTicketsCsv(filters);
    } catch (err) {
      setExportError(err.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  if (loading && tickets.length === 0) {
    return <div className="empty-state">Loading tickets…</div>;
  }

  if (error) {
    return <div className="empty-state">Unable to load tickets.</div>;
  }

  if (totalItems === 0) {
    return <div className="empty-state">No tickets match the current filters.</div>;
  }

  return (
    <div className="table-wrap">
      <div className="table-wrap__toolbar">
        <p className="table-wrap__hint">
          Showing {Math.min(pageSize, tickets.length)} of {totalItems}
          {exportError && (
            <span className="table-wrap__export-error" role="alert">
              {' '}
              · {exportError}
            </span>
          )}
        </p>
        <div className="table-wrap__actions">
          <button
            type="button"
            className="table-wrap__export"
            onClick={handleExport}
            disabled={exporting}
            title="Export matching tickets as CSV"
          >
            {exporting ? 'Exporting…' : 'Export CSV'}
          </button>
          <Link to={recentTicketsAllPath(filters)} className="table-wrap__see-all">
            See all
          </Link>
        </div>
      </div>
      <table className="ticket-table">
        <thead>
          <tr>
            <th className="ticket-table__col-id">ID</th>
            <th className="ticket-table__col-title">Title</th>
            <th className="ticket-table__col-location">Location</th>
            <th>Status</th>
            <th>Category</th>
            <th>Priority</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((ticket) => (
            <tr key={ticket.id}>
              <td className="ticket-table__id">
                <Link to={`/ticket/${ticket.id}`} className="ticket-link">
                  #{ticket.id}
                </Link>
              </td>
              <td className="ticket-table__title" title={ticket.title}>
                <Link to={`/ticket/${ticket.id}`} className="ticket-link">
                  {ticket.title}
                </Link>
              </td>
              <td className="ticket-table__location" title={ticket.location || ''}>
                {ticket.location || '—'}
              </td>
              <td>
                <Badge type={statusClass(ticket.status)} value={ticket.status} />
              </td>
              <td>{ticket.category}</td>
              <td>
                <Badge type={priorityClass(ticket.priority)} value={ticket.priority} />
              </td>
              <td className="ticket-table__date">{formatDate(ticket.created)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination
        page={page}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={goToPage}
        hasPrev={hasPrev}
        hasNext={hasNext}
        onPrev={goPrev}
        onNext={goNext}
      />
    </div>
  );
}

import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '../Badge';
import { Pagination } from '../Pagination';
import { usePagedTickets } from '../../hooks/useTickets';
import { statusClass, priorityClass, formatDate } from '../../utils';

const STATUS_BOARD_PER_PAGE = 5;

export function StatusColumn({ status, filters }) {
  const columnFilters = useMemo(() => {
    const allowedStatuses =
      filters.status.length > 0
        ? filters.status.filter((s) => s === status)
        : [status];

    return {
      status: allowedStatuses,
      category: filters.category,
      priority: filters.priority,
      search: '',
    };
  }, [filters, status]);

  const enabled = columnFilters.status.length > 0;

  const {
    tickets,
    totalItems,
    totalPages,
    pageSize,
    page,
    goToPage,
    goNext,
    goPrev,
    hasPrev,
    hasNext,
  } = usePagedTickets(columnFilters, STATUS_BOARD_PER_PAGE, { enabled });

  const count = enabled ? totalItems : 0;

  return (
    <div className="status-column" id={`status-column-${status.replace(/\s+/g, '-')}`}>
      <div className={`status-column__header status-column__header--${statusClass(status)}`}>
        <span>{status}</span>
        <span className="status-column__count">{count}</span>
      </div>
      <div className="status-column__cards">
        {count === 0 ? (
          <div className="empty-state" style={{ padding: '1rem' }}>
            No tickets
          </div>
        ) : (
          <>
            {tickets.map((ticket) => (
              <Link
                key={ticket.id}
                to={`/ticket/${ticket.id}`}
                className="ticket-card ticket-card--link"
              >
                <div className="ticket-card__header">
                  <span className="ticket-card__id">#{ticket.id}</span>
                  <span className="ticket-card__date">{formatDate(ticket.created)}</span>
                </div>
                <div className="ticket-card__title">{ticket.title}</div>
                <div className="ticket-card__meta">
                  <Badge type={priorityClass(ticket.priority)} value={ticket.priority} />
                  <Badge type="low" value={ticket.category} />
                </div>
              </Link>
            ))}
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
              compact
              ariaLabel={`${status} tickets pagination`}
            />
          </>
        )}
      </div>
    </div>
  );
}

import { Badge } from '../Badge';
import { usePagination, Pagination } from '../Pagination';
import { statusClass, priorityClass, formatDate } from '../../utils';

const STATUS_BOARD_PER_PAGE = 5;

export function StatusColumn({ status, tickets }) {
  const {
    page,
    pageItems,
    totalPages,
    totalItems,
    pageSize,
    goToPage,
    goNext,
    goPrev,
    hasPrev,
    hasNext,
  } = usePagination(tickets, STATUS_BOARD_PER_PAGE);

  return (
    <div className="status-column">
      <div className={`status-column__header status-column__header--${statusClass(status)}`}>
        <span>{status}</span>
        <span className="status-column__count">{tickets.length}</span>
      </div>
      <div className="status-column__cards">
        {tickets.length === 0 ? (
          <div className="empty-state" style={{ padding: '1rem' }}>
            No tickets
          </div>
        ) : (
          <>
            {pageItems.map((ticket) => (
              <div key={ticket.id} className="ticket-card">
                <div className="ticket-card__header">
                  <span className="ticket-card__id">#{ticket.id}</span>
                  <span className="ticket-card__date">{formatDate(ticket.created)}</span>
                </div>
                <div className="ticket-card__title">{ticket.title}</div>
                <div className="ticket-card__meta">
                  <Badge type={priorityClass(ticket.priority)} value={ticket.priority} />
                  <Badge type="low" value={ticket.category} />
                </div>
              </div>
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

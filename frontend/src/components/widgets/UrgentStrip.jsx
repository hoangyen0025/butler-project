import { useMemo } from 'react';
import { Badge } from '../Badge';
import { usePagination, Pagination } from '../Pagination';
import { statusClass, priorityClass, formatDate, isActiveUrgent } from '../../utils';
import '../UrgentStrip.css';

const URGENT_PER_PAGE = 5;

export function UrgentStrip({ tickets }) {
  const urgentTickets = useMemo(
    () =>
      [...tickets.filter(isActiveUrgent)].sort(
        (a, b) => new Date(b.created).getTime() - new Date(a.created).getTime()
      ),
    [tickets]
  );
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
  } = usePagination(urgentTickets, URGENT_PER_PAGE);

  if (urgentTickets.length === 0) {
    return null;
  }

  return (
    <div className="urgent-strip" role="region" aria-label="Urgent tickets">
      <div className="urgent-strip__header">
        <div className="urgent-strip__title">
          <span className="urgent-strip__icon" aria-hidden="true">
            {'\u26A0'}
          </span>
          <span>
            <strong>{urgentTickets.length}</strong> urgent ticket
            {urgentTickets.length !== 1 ? 's' : ''} {'\u00B7'} High / Critical
          </span>
        </div>
      </div>
      <div className="urgent-strip__list">
        {pageItems.map((ticket) => (
          <div key={ticket.id} className="urgent-strip__item">
            <div className="urgent-strip__item-content">
              <div className="urgent-strip__item-header">
                <span className="urgent-strip__item-id">#{ticket.id}</span>
                <span className="urgent-strip__item-date">{formatDate(ticket.created)}</span>
              </div>
              <span className="urgent-strip__item-title">{ticket.title}</span>
            </div>
            <div className="urgent-strip__item-meta">
              <Badge type={statusClass(ticket.status)} value={ticket.status} />
              <Badge type={priorityClass(ticket.priority)} value={ticket.priority} />
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
          itemLabel="urgent tickets"
          ariaLabel="Urgent tickets pagination"
        />
      </div>
    </div>
  );
}

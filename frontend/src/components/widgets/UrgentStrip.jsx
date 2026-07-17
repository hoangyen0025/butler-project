import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '../Badge';
import { Pagination } from '../Pagination';
import { usePagedTickets } from '../../hooks/useTickets';
import { statusClass, priorityClass, formatDate } from '../../utils';
import '../UrgentStrip.css';

const URGENT_PER_PAGE = 5;
const ACTIVE_STATUSES = ['Open', 'In Progress', 'On Hold'];
const URGENT_PRIORITIES = ['High', 'Critical'];

export function UrgentStrip({ filters }) {
  const urgentFilters = useMemo(() => {
    const status =
      filters.status.length > 0
        ? filters.status.filter((s) => s !== 'Closed')
        : ACTIVE_STATUSES;

    return {
      status,
      category: filters.category,
      priority: URGENT_PRIORITIES,
      search: '',
    };
  }, [filters]);

  const {
    tickets,
    totalItems,
    totalPages,
    pageSize,
    page,
    loading,
    goToPage,
    goNext,
    goPrev,
    hasPrev,
    hasNext,
  } = usePagedTickets(urgentFilters, URGENT_PER_PAGE, {
    enabled: urgentFilters.status.length > 0,
  });

  if (urgentFilters.status.length === 0) {
    return null;
  }

  if (loading && tickets.length === 0) {
    return null;
  }

  if (!loading && totalItems === 0) {
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
            <strong>{totalItems}</strong> urgent ticket
            {totalItems !== 1 ? 's' : ''} {'\u00B7'} High / Critical
          </span>
        </div>
      </div>
      <div className="urgent-strip__list">
        {tickets.map((ticket) => (
          <Link
            key={ticket.id}
            to={`/ticket/${ticket.id}`}
            className="urgent-strip__item urgent-strip__item--link"
          >
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
          itemLabel="urgent tickets"
          ariaLabel="Urgent tickets pagination"
        />
      </div>
    </div>
  );
}

import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '../Badge';
import { Pagination } from '../Pagination';
import { usePagedTickets } from '../../hooks/useTickets';
import { statusClass, priorityClass, formatDate } from '../../utils';

const STATUS_BOARD_PER_PAGE = 5; //5 tickets per page

//Kanban column on the Status Board (Open, In Progress, On Hold, or Closed).
export function StatusColumn({ status, filters }) {

  //useMemo: filters or status changes -> recalculate the column filters. if no change, reuse 
  const columnFilters = useMemo(() => {
    //case 1 (:[status]): no status filter (filter.status.length === 0) -> show all status column to the status board 
    //case 2: status filter (filter.status.length > 0) -> show only the status column to the status board 
    const allowedStatuses =
      filters.status.length > 0
      //from the user’s selected statuses, keep only the one that matches this column
        ? filters.status.filter((s) => s === status) 
        : [status];

    return {
      status: allowedStatuses,//keep only the statuses that match this column
      category: filters.category,//keep category filter
      priority: filters.priority, //keep priority filter
      search: '', //clear search
    };
  }, [filters, status]);

  //columnFilters.status = ["something"]  →  length > 0  →  true -> GET /api/tickets?status=Open&page=1&limit=5

  //columnFilters.status = [] →  length = 0  →  false -> no call API
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
  } = usePagedTickets(columnFilters, STATUS_BOARD_PER_PAGE, { enabled });//enable is true: GET /api/tickets?status=Open&page=1&limit=5

 //neu enable: count bang totalItems nguoc lai count = 0 
  const count = enabled ? totalItems : 0;

  return (
    <div className="status-column" id={`status-column-${status.replace(/\s+/g, '-')}`}>
      <div className={`status-column__header status-column__header--${statusClass(status)}`}>
        <span>{status}</span> {/* Status column name */}
        <span className="status-column__count">{count}</span> {/* Number of tickets in the column */}
      </div>
      <div className="status-column__cards">
        {count === 0 ? (
          //No tickets in the column
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
                  <span className="ticket-card__id">#{ticket.id}</span> {/* Ticket ID */}
                  <span className="ticket-card__date">{formatDate(ticket.created)}</span> {/* Ticket creation date */}
                </div>
                <div className="ticket-card__title">{ticket.title}</div> {/* Ticket title */}
                <div className="ticket-card__meta">
                  <Badge type={priorityClass(ticket.priority)} value={ticket.priority} /> {/* Ticket priority */}
                  <Badge type="low" value={ticket.category} /> {/* Ticket category */}
                </div>
              </Link>
            ))}
            {/* Pagination to navigate between pages */}
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

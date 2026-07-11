import { Badge } from './Badge';
import { useCollapsibleItems, ListToggle } from './CollapsibleList';
import { usePagination, Pagination } from './Pagination';
import { NoTicketsEmpty } from './StateViews';
import { statusClass, priorityClass, formatDate } from '../utils';

const TICKETS_PER_PAGE = 10;

export function StatsCards({ tickets }) {
  const open = tickets.filter((t) => t.status === 'Open').length;
  const inProgress = tickets.filter((t) => t.status === 'In Progress').length;
  const closed = tickets.filter((t) => t.status === 'Closed').length;
  const onHold = tickets.filter((t) => t.status === 'On Hold').length;
  const highPriority = tickets.filter(
    (t) => t.priority === 'High' || t.priority === 'Critical'
  ).length;

  const stats = [
    { label: 'Open', value: open, className: 'open' },
    { label: 'In Progress', value: inProgress, className: 'progress' },
    { label: 'Closed', value: closed, className: 'closed' },
    { label: 'On Hold', value: onHold, className: 'hold' },
    { label: 'High / Critical', value: highPriority, className: 'high' },
  ];

  return (
    <div className="stats-grid">
      {stats.map((stat) => (
        <div key={stat.label} className={`stat-card stat-card--${stat.className}`}>
          <div className="stat-card__value">{stat.value}</div>
          <div className="stat-card__label">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}

export function TicketTable({ tickets, hasActiveFilters, onClearFilters }) {
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
  } = usePagination(tickets, TICKETS_PER_PAGE);

  if (tickets.length === 0) {
    return (
      <NoTicketsEmpty
        hasActiveFilters={hasActiveFilters}
        onClearFilters={onClearFilters}
      />
    );
  }

  return (
    <div className="table-wrap">
      <table className="ticket-table">
        <thead>
          <tr>
            <th className="ticket-table__col-id">ID</th>
            <th className="ticket-table__col-title">Title</th>
            <th>Status</th>
            <th>Category</th>
            <th>Priority</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          {pageItems.map((ticket) => (
            <tr key={ticket.id}>
              <td className="ticket-table__id">#{ticket.id}</td>
              <td className="ticket-table__title">{ticket.title}</td>
              <td>
                <Badge type={statusClass(ticket.status)} value={ticket.status} />
              </td>
              <td>
                <Badge type="category" value={ticket.category} />
              </td>
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

function StatusColumn({ status, tickets }) {
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
  } = usePagination(tickets, TICKETS_PER_PAGE);

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

export function StatusBoard({ tickets, hasActiveFilters, onClearFilters }) {
  const statuses = ['Open', 'In Progress', 'On Hold', 'Closed'];

  if (tickets.length === 0) {
    return (
      <NoTicketsEmpty
        hasActiveFilters={hasActiveFilters}
        onClearFilters={onClearFilters}
      />
    );
  }

  const grouped = statuses.reduce((acc, status) => {
    acc[status] = tickets.filter((t) => t.status === status);
    return acc;
  }, {});

  return (
    <div className="status-board">
      {statuses.map((status) => (
        <StatusColumn key={status} status={status} tickets={grouped[status]} />
      ))}
    </div>
  );
}

export function CategoryBreakdown({ tickets, hasActiveFilters, onClearFilters }) {
  const counts = tickets.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + 1;
    return acc;
  }, {});

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const max = sorted.length > 0 ? sorted[0][1] : 1;
  const { visibleItems, isLong, expanded, toggle } = useCollapsibleItems(sorted, 6);

  if (sorted.length === 0) {
    return (
      <NoTicketsEmpty
        hasActiveFilters={hasActiveFilters}
        onClearFilters={onClearFilters}
      />
    );
  }

  return (
    <div className="category-list">
      {visibleItems.map(([category, count]) => (
        <div key={category} className="category-row">
          <span className="category-row__label">{category}</span>
          <div className="category-row__bar-wrap">
            <div
              className="category-row__bar"
              style={{ width: `${(count / max) * 100}%` }}
            />
          </div>
          <span className="category-row__count">{count}</span>
        </div>
      ))}
      {isLong && (
        <ListToggle
          expanded={expanded}
          onToggle={toggle}
          expandLabel={`Show all ${sorted.length} categories`}
          collapseLabel="Show less"
        />
      )}
    </div>
  );
}

import { Badge } from './Badge';
import { useCollapsibleItems, ListToggle } from './CollapsibleList';
import { usePagination, Pagination } from './Pagination';
import { statusClass, priorityClass, formatDate, isActiveUrgent } from '../utils';
import './UrgentStrip.css';

const TICKETS_PER_PAGE = 10;
const STATUS_BOARD_PER_PAGE = 5;
const URGENT_PER_PAGE = 5;

const CATEGORY_CHART_COLORS = [
  '#e07a4f',
  '#4ade80',
  '#a78bfa',
  '#60a5fa',
  '#fbbf24',
  '#f87171',
  '#c4a484',
  '#a8b89f',
  '#b8a9c9',
  '#8b919a',
];

function getCategoryColor(index) {
  return CATEGORY_CHART_COLORS[index % CATEGORY_CHART_COLORS.length];
}

function CategoryDonut({ data, total }) {
  const size = 148;
  const stroke = 22;
  const radius = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;

  let rotation = -90;

  return (
    <div
      className="category-donut"
      role="img"
      aria-label={`Ticket distribution across ${data.length} categories`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="category-donut__svg">
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="var(--chart-track)"
          strokeWidth={stroke}
        />
        {data.map(([label, value], index) => {
          const pct = value / total;
          const dash = pct * circumference;
          const segment = (
            <circle
              key={label}
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke={getCategoryColor(index)}
              strokeWidth={stroke}
              strokeDasharray={`${dash} ${circumference - dash}`}
              transform={`rotate(${rotation} ${cx} ${cy})`}
            />
          );
          rotation += pct * 360;
          return segment;
        })}
      </svg>
      <div className="category-donut__center">
        <span className="category-donut__total">{total}</span>
        <span className="category-donut__label">tickets</span>
      </div>
    </div>
  );
}

function UrgentStrip({ tickets, onFilterUrgent }) {
  const urgentTickets = [...tickets.filter(isActiveUrgent)].sort(
    (a, b) => new Date(b.created).getTime() - new Date(a.created).getTime()
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
        {onFilterUrgent && (
          <button type="button" className="urgent-strip__action" onClick={onFilterUrgent}>
            Filter urgent
          </button>
        )}
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

export function StatsCards({ tickets }) {
  const open = tickets.filter((t) => t.status === 'Open').length;
  const inProgress = tickets.filter((t) => t.status === 'In Progress').length;
  const closed = tickets.filter((t) => t.status === 'Closed').length;
  const onHold = tickets.filter((t) => t.status === 'On Hold').length;
  const highPriority = tickets.filter(
    (t) => t.priority === 'High' || t.priority === 'Critical'
  ).length;

  const stats = [
    { label: 'Open', value: open, className: 'open', pill: 'Active', pillType: 'healthy' },
    { label: 'In Progress', value: inProgress, className: 'progress', pill: 'Active', pillType: 'warn' },
    { label: 'Closed', value: closed, className: 'closed', pill: 'Resolved', pillType: 'healthy' },
    { label: 'On Hold', value: onHold, className: 'hold', pill: onHold > 0 ? 'Paused' : 'Clear', pillType: onHold > 0 ? 'muted' : 'healthy' },
    {
      label: 'High / Critical',
      value: highPriority,
      className: 'high',
      pill: highPriority > 0 ? 'Alert' : 'Healthy',
      pillType: highPriority > 0 ? 'alert' : 'healthy',
    },
  ];

  return (
    <div className="stats-grid">
      {stats.map((stat) => (
        <div key={stat.label} className={`stat-card stat-card--kpi stat-card--${stat.className}`}>
          <div className="stat-card__top">
            <span className="stat-card__label">{stat.label}</span>
            <span className={`stat-card__pill stat-card__pill--${stat.pillType}`}>
              {stat.pill}
            </span>
          </div>
          <div className="stat-card__value">{stat.value}</div>
        </div>
      ))}
    </div>
  );
}

export function TicketTable({ tickets }) {
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
    return <div className="empty-state">No tickets match the current filters.</div>;
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

export function StatusBoard({ tickets, onFilterUrgent }) {
  const statuses = ['Open', 'In Progress', 'On Hold', 'Closed'];

  const grouped = statuses.reduce((acc, status) => {
    acc[status] = tickets.filter((t) => t.status === status);
    return acc;
  }, {});

  return (
    <div className="status-board-wrap">
      <UrgentStrip tickets={tickets} onFilterUrgent={onFilterUrgent} />
      <div className="status-board">
        {statuses.map((status) => (
          <StatusColumn key={status} status={status} tickets={grouped[status]} />
        ))}
      </div>
    </div>
  );
}

export function CategoryBreakdown({ tickets }) {
  const counts = tickets.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + 1;
    return acc;
  }, {});

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const total = tickets.length;
  const { visibleItems, isLong, expanded, toggle } = useCollapsibleItems(sorted, 6);

  if (sorted.length === 0) {
    return <div className="empty-state">No category data available.</div>;
  }

  const colorByCategory = Object.fromEntries(
    sorted.map(([category], index) => [category, getCategoryColor(index)])
  );

  return (
    <div className="category-chart">
      <CategoryDonut data={sorted} total={total} />
      <div className="category-legend" role="list" aria-label="Category breakdown">
        {visibleItems.map(([category, count]) => {
          const pct = total > 0 ? (count / total) * 100 : 0;
          const color = colorByCategory[category];

          return (
            <div key={category} className="category-legend__item" role="listitem">
              <div className="category-legend__header">
                <span className="category-legend__label">
                  <span
                    className="category-legend__swatch"
                    style={{ backgroundColor: color }}
                    aria-hidden="true"
                  />
                  {category}
                </span>
                <span className="category-legend__stats">
                  <span className="category-legend__count">{count}</span>
                  <span className="category-legend__pct">{pct.toFixed(0)}%</span>
                </span>
              </div>
              <div className="category-legend__bar-wrap">
                <div
                  className="category-legend__bar"
                  style={{ width: `${pct}%`, backgroundColor: color }}
                />
              </div>
            </div>
          );
        })}
        {isLong && (
          <ListToggle
            expanded={expanded}
            onToggle={toggle}
            expandLabel={`Show all ${sorted.length} categories`}
            collapseLabel="Show less"
          />
        )}
      </div>
    </div>
  );
}

import './StatsCards.css';

const BOARD_TARGETS = {
  urgent: 'status-board-urgent',
  Open: 'status-column-Open',
  'In Progress': 'status-column-In-Progress',
  Closed: 'status-column-Closed',
  'On Hold': 'status-column-On-Hold',
};

function jumpToStatusBoard(targetId) {
  const board = document.getElementById('widget-board');
  const target = document.getElementById(targetId);
  if (!target && !board) return;

  (board || target).scrollIntoView({ behavior: 'smooth', block: 'start' });

  if (!target) return;

  window.setTimeout(() => {
    target.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    target.classList.add('is-board-flash');
    window.setTimeout(() => target.classList.remove('is-board-flash'), 1400);
  }, board ? 280 : 0);
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
    {
      label: 'Urgent · High / Critical',
      value: highPriority,
      className: 'high',
      urgent: true,
      urgentActive: highPriority > 0,
      pill: highPriority > 0 ? 'Needs attention' : 'All clear',
      pillType: highPriority > 0 ? 'urgent' : 'urgent-clear',
      wide: true,
      boardTarget: BOARD_TARGETS.urgent,
    },
    {
      label: 'Open',
      value: open,
      className: 'open',
      pill: 'Active',
      pillType: 'healthy',
      boardTarget: BOARD_TARGETS.Open,
    },
    {
      label: 'In Progress',
      value: inProgress,
      className: 'progress',
      pill: 'Active',
      pillType: 'warn',
      boardTarget: BOARD_TARGETS['In Progress'],
    },
    {
      label: 'Closed',
      value: closed,
      className: 'closed',
      pill: 'Resolved',
      pillType: 'healthy',
      boardTarget: BOARD_TARGETS.Closed,
    },
    {
      label: 'On Hold',
      value: onHold,
      className: 'hold',
      pill: onHold > 0 ? 'Paused' : 'Clear',
      pillType: onHold > 0 ? 'muted' : 'healthy',
      boardTarget: BOARD_TARGETS['On Hold'],
    },
  ];

  return (
    <div className="stats-grid">
      {stats.map((stat) => (
        <button
          key={stat.label}
          type="button"
          className={`stat-card stat-card--kpi stat-card--clickable stat-card--${stat.className}${
            stat.wide ? ' stat-card--wide' : ''
          }${stat.urgent ? ' stat-card--urgent' : ''}${
            stat.urgentActive ? ' stat-card--urgent-active' : ''
          }`}
          onClick={() => jumpToStatusBoard(stat.boardTarget)}
          aria-label={`Jump to ${stat.label} on status board`}
        >
          <div className="stat-card__top">
            <span className="stat-card__label">
              {stat.urgent && (
                <span className="stat-card__urgent-icon" aria-hidden="true">
                  {'\u26A0'}
                </span>
              )}
              {stat.label}
            </span>
            <span className={`stat-card__pill stat-card__pill--${stat.pillType}`}>
              {stat.pill}
            </span>
          </div>
          <div className={`stat-card__value${stat.urgent ? ' stat-card__value--urgent' : ''}`}>
            {stat.value}
          </div>
        </button>
      ))}
    </div>
  );
}

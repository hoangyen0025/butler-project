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
      label: 'High / Critical',
      value: highPriority,
      className: 'high',
      pill: highPriority > 0 ? 'Alert' : 'Healthy',
      pillType: highPriority > 0 ? 'alert' : 'healthy',
      wide: true,
    },
    { label: 'Open', value: open, className: 'open', pill: 'Active', pillType: 'healthy' },
    { label: 'In Progress', value: inProgress, className: 'progress', pill: 'Active', pillType: 'warn' },
    { label: 'Closed', value: closed, className: 'closed', pill: 'Resolved', pillType: 'healthy' },
    { label: 'On Hold', value: onHold, className: 'hold', pill: onHold > 0 ? 'Paused' : 'Clear', pillType: onHold > 0 ? 'muted' : 'healthy' },
  ];

  return (
    <div className="stats-grid">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={`stat-card stat-card--kpi stat-card--${stat.className}${
            stat.wide ? ' stat-card--wide' : ''
          }`}
        >
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

function Skeleton({ className = '', style }) {
  return <div className={`skeleton ${className}`.trim()} style={style} aria-hidden="true" />;
}

export function StatsSkeleton() {
  return (
    <div className="stats-grid">
      <div className="stat-card stat-card--kpi stat-card--skeleton stat-card--wide">
        <Skeleton style={{ width: '60%', height: 10, marginBottom: 12 }} />
        <Skeleton className="skeleton--value" style={{ margin: '0 0 0' }} />
      </div>
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="stat-card stat-card--kpi stat-card--skeleton">
          <Skeleton style={{ width: '60%', height: 10, marginBottom: 12 }} />
          <Skeleton className="skeleton--value" style={{ margin: '0 0 0' }} />
        </div>
      ))}
    </div>
  );
}

function TableSkeleton({ rows = 6 }) {
  return (
    <div className="table-skeleton">
      <div className="table-skeleton__header">
        <Skeleton style={{ width: '40%' }} />
        <Skeleton style={{ width: '15%' }} />
        <Skeleton style={{ width: '15%' }} />
        <Skeleton style={{ width: '15%' }} />
      </div>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="table-skeleton__row">
          <Skeleton style={{ width: '45%' }} />
          <Skeleton style={{ width: '12%' }} />
          <Skeleton style={{ width: '12%' }} />
          <Skeleton style={{ width: '12%' }} />
        </div>
      ))}
    </div>
  );
}

function BoardSkeleton() {
  return (
    <div className="status-board">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="status-column status-column--skeleton">
          <Skeleton className="skeleton--column-header" />
          <div className="status-column__cards">
            <Skeleton className="skeleton--card" />
            <Skeleton className="skeleton--card" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CategorySkeleton({ compact = false }) {
  if (compact) {
    return (
      <div className="category-chart category-chart--compact">
        <div className="category-donut" style={{ width: 136, height: 136, margin: '0 auto' }}>
          <Skeleton style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
        </div>
        <div className="category-chart-skeleton__legend">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="category-chart-skeleton__row">
              <Skeleton style={{ width: '70%', height: 12 }} />
              <Skeleton className="skeleton--bar" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="category-chart-skeleton">
      <Skeleton className="category-chart-skeleton__donut" />
      <div className="category-chart-skeleton__legend">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="category-chart-skeleton__row">
            <Skeleton style={{ width: '70%', height: 12 }} />
            <Skeleton className="skeleton--bar" />
          </div>
        ))}
      </div>
    </div>
  );
}

const SKELETON_BY_WIDGET = {
  stats: StatsSkeleton,
  table: TableSkeleton,
  board: BoardSkeleton,
  categories: CategorySkeleton,
};

export function DashboardLoadingSkeleton({ widgetIds }) {
  const ids = widgetIds.length > 0 ? widgetIds : ['stats', 'table'];

  return (
    <div className="dashboard" aria-busy="true" aria-label="Loading dashboard">
      {ids.map((id) => {
        const SkeletonContent = SKELETON_BY_WIDGET[id] ?? TableSkeleton;
        return (
          <div key={id} className="widget widget--loading">
            <div className="widget__header">
              <Skeleton style={{ width: 140, height: 14 }} />
            </div>
            <div className="widget__body">
              <SkeletonContent />
            </div>
          </div>
        );
      })}
      <p className="state-card__hint">Loading tickets…</p>
    </div>
  );
}

export function EmptyState({ icon, title, message, actionLabel, onAction, variant = 'empty' }) {
  return (
    <div className={`state-card state-card--${variant}`}>
      <div className="state-card__icon" aria-hidden="true">
        {icon}
      </div>
      <h3 className="state-card__title">{title}</h3>
      <p className="state-card__message">{message}</p>
      {actionLabel && onAction && (
        <button type="button" className="btn btn--primary state-card__action" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function NoTicketsEmpty({ hasActiveFilters, onClearFilters }) {
  return (
    <EmptyState
      variant="empty"
      icon="🔍"
      title="No tickets found"
      message={
        hasActiveFilters
          ? 'No tickets match your current filters. Try adjusting or clearing them.'
          : 'There are no maintenance tickets to display right now.'
      }
      actionLabel={hasActiveFilters ? 'Clear filters' : undefined}
      onAction={hasActiveFilters ? onClearFilters : undefined}
    />
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <EmptyState
      variant="error"
      icon="⚠"
      title="Unable to load tickets"
      message={message || 'Something went wrong while fetching data. Please try again.'}
      actionLabel="Try again"
      onAction={onRetry}
    />
  );
}

export function EmptyWidgetsState({ onCustomize }) {
  return (
    <EmptyState
      variant="widgets"
      icon="📋"
      title="No widgets selected"
      message="Choose which sections to show on your dashboard — key metrics, ticket list, status board, and more."
      actionLabel="Customize dashboard"
      onAction={onCustomize}
    />
  );
}

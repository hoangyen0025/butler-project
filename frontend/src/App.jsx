import { useState, useMemo } from 'react';
import { Header } from './components/Header';
import { FilterBar, EMPTY_FILTERS } from './components/FilterBar';
import { DraggableDashboard } from './components/DraggableDashboard';
import { DashboardCustomizer } from './components/DashboardCustomizer';
import { DashboardLoadingSkeleton, ErrorState } from './components/StateViews';
import {
  StatsCards,
  TicketTable,
  StatusBoard,
  CategoryBreakdown,
} from './components/Widgets';
import { useTickets, useMeta } from './hooks/useTickets';
import { useDashboardLayout } from './hooks/useDashboardLayout';

function App() {
  const [filters, setFilters] = useState({
    status: [],
    category: [],
    priority: [],
  });
  const [showCustomizer, setShowCustomizer] = useState(false);

  const { tickets, loading, error, refetch } = useTickets(filters);

  const boardFilters = useMemo(
    () => ({
      status: filters.status,
      category: filters.category,
      priority: [],
    }),
    [filters.status, filters.category]
  );
  const { tickets: boardTickets } = useTickets(boardFilters, { silent: true });
  const { meta } = useMeta();
  const { layout, visibleWidgets, toggleWidget, reorderWidgets, resetLayout } =
    useDashboardLayout();

  const hasActiveFilters =
    filters.status.length > 0 ||
    filters.category.length > 0 ||
    filters.priority.length > 0;

  const clearFilters = () => setFilters(EMPTY_FILTERS);

  const toggleUrgentFilter = () => {
    const urgentPriorities = ['High', 'Critical'];
    const isActive =
      filters.priority.length === urgentPriorities.length &&
      urgentPriorities.every((p) => filters.priority.includes(p));

    setFilters((prev) => ({
      ...prev,
      priority: isActive ? [] : [...urgentPriorities],
    }));
  };

  const activeCases = useMemo(
    () => tickets.filter((t) => t.status !== 'Closed').length,
    [tickets]
  );

  const widgetContext = {
    hasActiveFilters,
    onClearFilters: clearFilters,
    onFilterUrgent: toggleUrgentFilter,
  };

  const renderWidget = (id) => {
    switch (id) {
      case 'stats':
        return <StatsCards tickets={tickets} />;
      case 'table':
        return <TicketTable tickets={tickets} {...widgetContext} />;
      case 'board':
        return (
          <StatusBoard
            tickets={boardTickets}
            {...widgetContext}
          />
        );
      case 'categories':
        return <CategoryBreakdown tickets={tickets} {...widgetContext} />;
      default:
        return null;
    }
  };

  return (
    <div className="app">
      <Header
        onCustomize={() => setShowCustomizer(true)}
        activeCases={activeCases}
        totalTickets={tickets.length}
      />

      <main className="main">
        <FilterBar
          filters={filters}
          onChange={setFilters}
          meta={meta}
          resultCount={tickets.length}
          loading={loading}
        />

        {loading && <DashboardLoadingSkeleton widgetIds={visibleWidgets} />}

        {!loading && error && (
          <ErrorState message={error} onRetry={refetch} />
        )}

        {!loading && !error && (
          <DraggableDashboard
            widgetIds={visibleWidgets}
            renderWidget={renderWidget}
            onCustomize={() => setShowCustomizer(true)}
          />
        )}
      </main>

      {showCustomizer && (
        <DashboardCustomizer
          order={layout.order}
          visible={layout.visible}
          onToggle={toggleWidget}
          onReorder={reorderWidgets}
          onClose={() => setShowCustomizer(false)}
          onReset={resetLayout}
        />
      )}
    </div>
  );
}

export default App;

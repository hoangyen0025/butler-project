import { useState } from 'react';
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
  const { meta } = useMeta();
  const { layout, visibleWidgets, toggleWidget, reorderWidgets, resetLayout } =
    useDashboardLayout();

  const hasActiveFilters =
    filters.status.length > 0 ||
    filters.category.length > 0 ||
    filters.priority.length > 0;

  const clearFilters = () => setFilters(EMPTY_FILTERS);

  const widgetContext = {
    hasActiveFilters,
    onClearFilters: clearFilters,
  };

  const renderWidget = (id) => {
    switch (id) {
      case 'stats':
        return <StatsCards tickets={tickets} />;
      case 'table':
        return <TicketTable tickets={tickets} {...widgetContext} />;
      case 'board':
        return <StatusBoard tickets={tickets} {...widgetContext} />;
      case 'categories':
        return <CategoryBreakdown tickets={tickets} {...widgetContext} />;
      default:
        return null;
    }
  };

  return (
    <div className="app">
      <Header onCustomize={() => setShowCustomizer(true)} />

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

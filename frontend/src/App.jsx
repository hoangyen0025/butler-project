import { Route, Routes } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { Header } from './components/Header';
import { FilterBar, EMPTY_FILTERS } from './components/FilterBar';
import { DraggableDashboard } from './components/DraggableDashboard';
import { DashboardCustomizer } from './components/DashboardCustomizer';
import { DashboardLoadingSkeleton, ErrorState } from './components/StateViews';
import { WidgetNav } from './components/WidgetNav';
import './components/DashboardTop.css';
import './components/LayoutFix.css';
import {
  StatsCards,
  TicketTable,
  StatusBoard,
  CategoryBreakdown,
} from './components/widgets';
import { useTickets, useMeta } from './hooks/useTickets';
import { useDashboardLayout } from './hooks/useDashboardLayout';
import { TicketDetail } from './pages/TicketDetail';
import { SearchResults } from './pages/SearchResults';
import { RecentTicketsAll } from './pages/RecentTicketsAll';
import { ContractorPortal } from './pages/ContractorPortal';
import { ContractorJobs } from './pages/ContractorJobs';
import { ContractorJobDetail } from './pages/ContractorJobDetail';

function Dashboard() {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [showCustomizer, setShowCustomizer] = useState(false);

  const { tickets, pagination, loading, error, refetch } = useTickets(filters);

  // Status board ignores priority so columns stay filled while the table is priority-filtered.
  const boardFilters = useMemo(
    () => ({
      status: filters.status,
      category: filters.category,
      priority: [],
      search: '',
    }),
    [filters.status, filters.category]
  );
  const { meta } = useMeta();
  const {
    layout,
    visibleWidgets,
    toggleWidget,
    reorderWidgets,
    reorderVisibleWidgets,
    resetLayout,
  } = useDashboardLayout();

  const hasActiveFilters =
    filters.status.length > 0 ||
    filters.category.length > 0 ||
    filters.priority.length > 0;

  const clearFilters = () => setFilters(EMPTY_FILTERS);

  const activeCases = useMemo(
    () => tickets.filter((t) => t.status !== 'Closed').length,
    [tickets]
  );

  const widgetContext = {
    hasActiveFilters,
    onClearFilters: clearFilters,
  };

  const renderWidget = (id) => {
    switch (id) {
      case 'stats':
        return <StatsCards tickets={tickets} />;
      case 'table':
        return <TicketTable filters={filters} {...widgetContext} />;
      case 'board':
        return <StatusBoard filters={boardFilters} />;
      case 'categories':
        return <CategoryBreakdown tickets={tickets} {...widgetContext} />;
      default:
        return null;
    }
  };

  return (
    <div className="app">
      <div className="app-chrome">
        <Header
          onCustomize={() => setShowCustomizer(true)}
          activeCases={activeCases}
          totalTickets={pagination.total}
        />
        {!loading && !error && <WidgetNav widgetIds={visibleWidgets} />}
      </div>

      <main className="main">
        <section className="dashboard-top" aria-label="Filters">
          <FilterBar
            filters={filters}
            onChange={setFilters}
            meta={meta}
            resultCount={pagination.total}
            loading={loading}
          />
        </section>

        {loading && <DashboardLoadingSkeleton widgetIds={visibleWidgets} />}

        {!loading && error && (
          <ErrorState message={error} onRetry={refetch} />
        )}

        {!loading && !error && (
          <DraggableDashboard
            widgetIds={visibleWidgets}
            renderWidget={renderWidget}
            onReorder={reorderVisibleWidgets}
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

function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/search" element={<SearchResults />} />
      <Route path="/recent-ticket/all" element={<RecentTicketsAll />} />
      <Route path="/contractor" element={<ContractorPortal />} />
      <Route path="/contractor/jobs" element={<ContractorJobs />} />
      <Route path="/contractor/jobs/:id" element={<ContractorJobDetail />} />
      <Route path="/ticket/:id" element={<TicketDetail />} />
      <Route path="/tickets/:id" element={<TicketDetail />} />
    </Routes>
  );
}

export default App;

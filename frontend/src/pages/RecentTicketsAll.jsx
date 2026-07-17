import { Link, useSearchParams } from 'react-router-dom';
import { useMemo } from 'react';
import { Header } from '../components/Header';
import { FilterBar, EMPTY_FILTERS } from '../components/FilterBar';
import { Pagination } from '../components/Pagination';
import { Badge } from '../components/Badge';
import { useMeta, usePagedTickets } from '../hooks/useTickets';
import { formatDate, priorityClass, statusClass } from '../utils';
import {
  describeActiveFilters,
  filtersToSearchParams,
  searchParamsToFilters,
} from '../utils/filterParams';

const TICKETS_PER_PAGE = 20;

export function RecentTicketsAll() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { meta } = useMeta();

  const filters = useMemo(
    () => searchParamsToFilters(searchParams),
    [searchParams]
  );

  const hasActiveFilters =
    filters.status.length > 0 ||
    filters.category.length > 0 ||
    filters.priority.length > 0 ||
    Boolean(filters.search);

  const filterSummary = describeActiveFilters(filters);

  const {
    tickets,
    totalItems,
    totalPages,
    pageSize,
    page,
    loading,
    error,
    goToPage,
    goNext,
    goPrev,
    hasPrev,
    hasNext,
    refetch,
  } = usePagedTickets(filters, TICKETS_PER_PAGE);

  const onFiltersChange = (nextFilters) => {
    const next = { ...EMPTY_FILTERS, ...nextFilters };
    const params = filtersToSearchParams(next);
    setSearchParams(params, { replace: true });
  };

  return (
    <div className="app">
      <Header totalTickets={totalItems} />
      <main className="main main--full">
        <div className="recent-all">
          <Link to="/" className="recent-all__back">
            ← Back to dashboard
          </Link>

          <header className="recent-all__header">
            <div>
              <h2 className="recent-all__title">All recent tickets</h2>
              <p className="recent-all__summary">
                {loading ? (
                  'Loading tickets…'
                ) : (
                  <>
                    <strong>{totalItems}</strong> ticket
                    {totalItems !== 1 ? 's' : ''}
                    {hasActiveFilters ? ' matching current filters' : ' (no filters)'}
                  </>
                )}
              </p>
              {hasActiveFilters && (
                <p className="recent-all__active">
                  Filters: {filterSummary.join(' · ')}
                </p>
              )}
            </div>
          </header>

          <section className="dashboard-top" aria-label="Filters">
            <FilterBar
              filters={filters}
              onChange={onFiltersChange}
              meta={meta}
              resultCount={totalItems}
              loading={loading}
            />
          </section>

          {loading && tickets.length === 0 && (
            <div className="empty-state">Loading tickets…</div>
          )}

          {!loading && error && (
            <div className="recent-all__error">
              <p className="empty-state">{error}</p>
              <button type="button" className="btn btn--outline" onClick={refetch}>
                Retry
              </button>
            </div>
          )}

          {!loading && !error && totalItems === 0 && (
            <div className="empty-state">No tickets match the current filters.</div>
          )}

          {!error && totalItems > 0 && (
            <div className="table-wrap">
              <table className="ticket-table">
                <thead>
                  <tr>
                    <th className="ticket-table__col-id">ID</th>
                    <th className="ticket-table__col-title">Title</th>
                    <th className="ticket-table__col-location">Location</th>
                    <th>Status</th>
                    <th>Category</th>
                    <th>Priority</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((ticket) => (
                    <tr key={ticket.id}>
                      <td className="ticket-table__id">
                        <Link to={`/ticket/${ticket.id}`} className="ticket-link">
                          #{ticket.id}
                        </Link>
                      </td>
                      <td className="ticket-table__title" title={ticket.title}>
                        <Link to={`/ticket/${ticket.id}`} className="ticket-link">
                          {ticket.title}
                        </Link>
                      </td>
                      <td className="ticket-table__location" title={ticket.location || ''}>
                        {ticket.location || '—'}
                      </td>
                      <td>
                        <Badge type={statusClass(ticket.status)} value={ticket.status} />
                      </td>
                      <td>{ticket.category}</td>
                      <td>
                        <Badge
                          type={priorityClass(ticket.priority)}
                          value={ticket.priority}
                        />
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
          )}
        </div>
      </main>
    </div>
  );
}

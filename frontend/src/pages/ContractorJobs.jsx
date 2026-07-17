import { useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Badge } from '../components/Badge';
import { FilterBar, EMPTY_FILTERS } from '../components/FilterBar';
import { Header } from '../components/Header';
import { Pagination } from '../components/Pagination';
import { ContractorFloorWalk } from '../components/widgets/ContractorFloorWalk';
import { useContractor } from '../hooks/useContractor';
import { useMeta, usePagedTickets, useTickets } from '../hooks/useTickets';
import { formatSlaCountdown, priorityClass, statusClass } from '../utils';
import '../components/ContractorPortal.css';
import '../components/DashboardTop.css';

const JOBS_PER_PAGE = 10;
const OPEN_STATUSES = ['Open', 'In Progress', 'On Hold'];

function JobSlaChip({ ticket }) {
  const sla = formatSlaCountdown(ticket);
  if (!sla) return null;
  return (
    <span className={`job-sla job-sla--${sla.tone}`} title={`Due ${ticket.dueDate}`}>
      {sla.text}
    </span>
  );
}

export function ContractorJobs() {
  const { contractor, username, clearContractor, isSignedIn, authChecking } = useContractor();
  const { meta } = useMeta();
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  const listFilters = useMemo(
    () => ({
      status: filters.status,
      category: [],
      priority: filters.priority,
      search: '',
      assignee: contractor,
    }),
    [contractor, filters]
  );

  const routeFilters = useMemo(
    () => ({
      status: filters.status.length > 0 ? filters.status : OPEN_STATUSES,
      category: [],
      priority: filters.priority,
      search: '',
      assignee: contractor,
    }),
    [contractor, filters]
  );

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
  } = usePagedTickets(listFilters, JOBS_PER_PAGE, { enabled: isSignedIn });

  const {
    tickets: routeTickets,
    loading: routeLoading,
  } = useTickets(routeFilters, { enabled: isSignedIn });

  const hasActiveFilters =
    filters.status.length > 0 || filters.priority.length > 0;

  if (authChecking) {
    return (
      <div className="app app--contractor">
        <Header showSearch={false} />
        <main className="main">
          <div className="empty-state">Checking session…</div>
        </main>
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/contractor" replace />;
  }

  const openCount = routeTickets.length;

  return (
    <div className="app app--contractor">
      <Header showSearch={false} activeCases={openCount} totalTickets={totalItems} />
      <main className="main main--full">
        <div className="contractor-jobs">
          <div className="contractor-jobs__top">
            <div>
              <p className="contractor-jobs__eyebrow">Contractor portal</p>
              <h2 className="contractor-jobs__title">Jobs for {contractor}</h2>
              <p className="contractor-jobs__summary">
                Signed in as <strong>{username || contractor}</strong>
                {loading
                  ? ' · Loading assigned jobs…'
                  : ` · ${totalItems} assigned ticket${totalItems !== 1 ? 's' : ''}`}
              </p>
            </div>
            <div className="contractor-jobs__actions">
              <Link to="/" className="btn btn--ghost">
                Staff dashboard
              </Link>
              <button
                type="button"
                className="btn btn--outline"
                onClick={() => {
                  clearContractor();
                }}
              >
                Sign out
              </button>
            </div>
          </div>

          <section className="dashboard-top contractor-jobs__filters" aria-label="Job filters">
            <FilterBar
              filters={filters}
              onChange={setFilters}
              meta={meta}
              resultCount={totalItems}
              loading={loading}
              showCategory={false}
            />
          </section>

          {!error && (
            <ContractorFloorWalk tickets={routeTickets} loading={routeLoading} />
          )}

          {loading && tickets.length === 0 && (
            <div className="empty-state">Loading your jobs…</div>
          )}

          {!loading && error && (
            <div className="contractor-jobs__error">
              <p className="empty-state">{error}</p>
              <button type="button" className="btn btn--outline" onClick={refetch}>
                Retry
              </button>
            </div>
          )}

          {!loading && !error && totalItems === 0 && (
            <div className="empty-state">
              {hasActiveFilters
                ? 'No assigned jobs match these filters.'
                : 'No jobs are assigned to you right now.'}
            </div>
          )}

          {!error && totalItems > 0 && (
            <div className="contractor-jobs__list">
              <h3 className="contractor-jobs__list-title">All assigned jobs</h3>
              {tickets.map((ticket) => {
                const sla = formatSlaCountdown(ticket);
                return (
                  <Link
                    key={ticket.id}
                    to={`/contractor/jobs/${ticket.id}`}
                    className={`contractor-job-card${
                      sla ? ` contractor-job-card--${sla.tone}` : ''
                    }`}
                  >
                    <div className="contractor-job-card__top">
                      <span className="contractor-job-card__id">#{ticket.id}</span>
                      <JobSlaChip ticket={ticket} />
                    </div>
                    <h3 className="contractor-job-card__title">{ticket.title}</h3>
                    <p className="contractor-job-card__meta">
                      {ticket.assetId ? `${ticket.assetId} · ` : ''}
                      {ticket.location || ticket.floor || '—'}
                    </p>
                    <div className="contractor-job-card__badges">
                      <Badge type={statusClass(ticket.status)} value={ticket.status} />
                      <Badge type={priorityClass(ticket.priority)} value={ticket.priority} />
                      <Badge type="low" value={ticket.category} />
                    </div>
                  </Link>
                );
              })}
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
                itemLabel="jobs"
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

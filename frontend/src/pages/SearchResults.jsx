import { Link, useSearchParams } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { Header } from '../components/Header';
import { Pagination } from '../components/Pagination';
import { Badge } from '../components/Badge';
import { usePagedTickets } from '../hooks/useTickets';
import { formatDate, priorityClass, statusClass } from '../utils';
import '../components/SearchResults.css';

const RESULTS_PER_PAGE = 10;

const EMPTY_PARSED = {
  status: [],
  category: [],
  priority: [],
  floor: [],
  overdue: false,
  search: '',
};

export function SearchResults() {
  const [searchParams] = useSearchParams();
  const query = (searchParams.get('q') || '').trim();

  const [parsed, setParsed] = useState(null);
  const [parseError, setParseError] = useState(null);
  const [parsing, setParsing] = useState(false);

  useEffect(() => {
    if (!query) {
      setParsed(null);
      setParseError(null);
      setParsing(false);
      return undefined;
    }

    let cancelled = false;
    setParsing(true);
    setParseError(null);

    (async () => {
      try {
        const res = await fetch('/api/search/parse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ q: query }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Could not parse search');
        if (cancelled) return;
        setParsed({
          filters: {
            status: data.filters?.status || [],
            category: data.filters?.category || [],
            priority: data.filters?.priority || [],
            floor: data.filters?.floor || [],
            overdue: Boolean(data.filters?.overdue),
            search: data.filters?.search || '',
          },
          interpretation: data.interpretation || '',
          source: data.source || 'local',
        });
      } catch (err) {
        if (cancelled) return;
        // Fallback: treat whole query as text search
        setParsed({
          filters: { ...EMPTY_PARSED, search: query },
          interpretation: `Title search for “${query}”`,
          source: 'fallback',
        });
        setParseError(err.message || 'Parse failed — using text search');
      } finally {
        if (!cancelled) setParsing(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [query]);

  const filters = useMemo(() => {
    if (!parsed?.filters) {
      return {
        status: [],
        category: [],
        priority: [],
        floor: [],
        overdue: false,
        search: '',
      };
    }
    return parsed.filters;
  }, [parsed]);

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
  } = usePagedTickets(filters, RESULTS_PER_PAGE, {
    enabled: Boolean(query) && Boolean(parsed) && !parsing,
  });

  const chips = useMemo(() => {
    if (!parsed?.filters) return [];
    const f = parsed.filters;
    const list = [];
    f.category?.forEach((c) => list.push({ label: c, tone: 'category' }));
    f.floor?.forEach((fl) => list.push({ label: fl, tone: 'floor' }));
    f.status?.forEach((s) => list.push({ label: s, tone: 'status' }));
    f.priority?.forEach((p) => list.push({ label: p, tone: 'priority' }));
    if (f.overdue) list.push({ label: 'Overdue', tone: 'overdue' });
    if (f.search) list.push({ label: `“${f.search}”`, tone: 'text' });
    return list;
  }, [parsed]);

  const busy = parsing || (Boolean(query) && Boolean(parsed) && loading);

  return (
    <div className="app">
      <Header totalTickets={query && !busy ? totalItems : 0} />
      <main className="main">
        <div className="search-page">
          <Link to="/" className="search-page__back">
            ← Back to dashboard
          </Link>

          <header className="search-page__header">
            <h2 className="search-page__title">Search results</h2>
            {query ? (
              <p className="search-page__summary">
                {busy && !tickets.length ? (
                  parsing ? 'Understanding your search…' : 'Searching…'
                ) : (
                  <>
                    <strong>{totalItems}</strong> ticket{totalItems !== 1 ? 's' : ''} for “
                    <strong>{query}</strong>”
                  </>
                )}
              </p>
            ) : (
              <p className="search-page__summary">
                Try natural language, e.g. “leaking HVAC on 12/F overdue” or “open electrical
                critical”.
              </p>
            )}
          </header>

          {query && parsed && (
            <div className="nl-search">
              <div className="nl-search__row">
                <span className="nl-search__label">Understood as</span>
                {parsed.source === 'openai' && (
                  <span className="nl-search__badge">AI</span>
                )}
                {parsed.source === 'local' && (
                  <span className="nl-search__badge nl-search__badge--local">Smart</span>
                )}
              </div>
              {chips.length > 0 ? (
                <ul className="nl-search__chips" aria-label="Parsed filters">
                  {chips.map((chip) => (
                    <li
                      key={`${chip.tone}-${chip.label}`}
                      className={`nl-search__chip nl-search__chip--${chip.tone}`}
                    >
                      {chip.label}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="nl-search__hint">{parsed.interpretation}</p>
              )}
              {parseError && <p className="nl-search__warn">{parseError}</p>}
            </div>
          )}

          {!query && <div className="empty-state">No search term provided.</div>}

          {query && busy && tickets.length === 0 && (
            <div className="empty-state">
              {parsing ? 'Parsing search…' : 'Loading results…'}
            </div>
          )}

          {query && !busy && error && (
            <div className="search-page__error">
              <p className="empty-state">{error}</p>
              <button type="button" className="btn btn--outline" onClick={refetch}>
                Retry
              </button>
            </div>
          )}

          {query && !busy && !error && parsed && totalItems === 0 && (
            <div className="empty-state">No tickets match that search.</div>
          )}

          {query && !error && totalItems > 0 && (
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
                  {tickets.map((ticket) => (
                    <tr key={ticket.id}>
                      <td className="ticket-table__id">
                        <Link
                          to={`/ticket/${ticket.id}`}
                          state={{ fromSearch: query }}
                          className="ticket-link"
                        >
                          #{ticket.id}
                        </Link>
                      </td>
                      <td className="ticket-table__title" title={ticket.title}>
                        <Link
                          to={`/ticket/${ticket.id}`}
                          state={{ fromSearch: query }}
                          className="ticket-link"
                        >
                          {ticket.title}
                        </Link>
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

import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';

export function Header({ onCustomize, activeCases = 0, totalTickets = 0, showSearch = true }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const urlQuery = location.pathname === '/search' ? (searchParams.get('q') || '') : '';
  const [draft, setDraft] = useState(urlQuery);

  useEffect(() => {
    if (location.pathname === '/search') {
      setDraft(searchParams.get('q') || '');
    }
  }, [location.pathname, searchParams]);

  const submitSearch = (event) => {
    event.preventDefault();
    const q = draft.trim();
    if (!q) return;
    navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <header className="header">
      <Link to="/" className="header__brand">
        <div className="header__logo" aria-hidden="true">
          M
        </div>
        <div>
          <h1 className="header__title">Maintenance Dashboard</h1>
          <p className="header__subtitle">
            Active cases: <strong>{activeCases}</strong>
            {totalTickets > 0 && (
              <>
                {' '}
                · Total tickets: <strong>{totalTickets}</strong>
              </>
            )}
          </p>
        </div>
      </Link>
      <div className="header__actions">
        {showSearch && (
          <form className="header__search" onSubmit={submitSearch} role="search">
            <label htmlFor="ticket-search" className="sr-only">
              Search tickets
            </label>
            <div className="header__search-field">
              <input
                id="ticket-search"
                type="search"
                className="header__search-input"
                placeholder="Try: HVAC on 12/F overdue…"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                autoComplete="off"
              />
              {draft && (
                <button
                  type="button"
                  className="header__search-clear"
                  onClick={() => setDraft('')}
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
              <button
                type="submit"
                className="header__search-submit"
                aria-label="Search tickets"
                disabled={!draft.trim()}
              >
                ⌕
              </button>
            </div>
          </form>
        )}
        {onCustomize && (
          <button type="button" className="btn btn--ghost" onClick={onCustomize}>
            Customize
          </button>
        )}
        {!location.pathname.startsWith('/contractor') && (
          <Link to="/contractor" className="btn btn--outline header__portal-link">
            Contractor portal
          </Link>
        )}
      </div>
    </header>
  );
}

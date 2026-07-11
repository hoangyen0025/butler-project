export function Header({ onCustomize, activeCases = 0, totalTickets = 0 }) {
  return (
    <header className="header">
      <div className="header__brand">
        <div className="header__logo" aria-hidden="true">
          B
        </div>
        <div>
          <h1 className="header__title">Maintenance Dashboard</h1>
          <p className="header__subtitle">
            Butler Asia · Active cases: <strong>{activeCases}</strong>
            {totalTickets > 0 && (
              <>
                {' '}
                · Total tickets: <strong>{totalTickets}</strong>
              </>
            )}
          </p>
        </div>
      </div>
      <div className="header__actions">
        <button type="button" className="btn btn--ghost" onClick={onCustomize}>
          Customize
        </button>
      </div>
    </header>
  );
}

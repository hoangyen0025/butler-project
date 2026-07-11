export function Header({ onCustomize }) {
  return (
    <header className="header">
      <div className="header__brand">
        <div className="header__logo">B</div>
        <div>
          <h1 className="header__title">Maintenance Dashboard</h1>
          <p className="header__subtitle">Butler Asia — Building Operations</p>
        </div>
      </div>
      <div className="header__actions">
        <button type="button" className="btn btn--ghost" onClick={onCustomize}>
          Customize Dashboard
        </button>
      </div>
    </header>
  );
}

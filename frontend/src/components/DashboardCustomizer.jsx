import { WIDGET_DEFINITIONS } from '../hooks/useDashboardLayout';

export function DashboardCustomizer({ visible, onToggle, onClose, onReset }) {
  return (
    <div className="customizer-overlay" onClick={onClose}>
      <div className="customizer-panel" onClick={(e) => e.stopPropagation()}>
        <h2>Customize Dashboard</h2>
        <p>Choose which widgets to display and drag them to reorder on the main view.</p>

        {WIDGET_DEFINITIONS.map((widget) => (
          <label key={widget.id} className="widget-toggle">
            <input
              type="checkbox"
              checked={visible[widget.id] ?? false}
              onChange={() => onToggle(widget.id)}
            />
            <div className="widget-toggle__info">
              <div className="widget-toggle__name">{widget.title}</div>
              <div className="widget-toggle__desc">{widget.description}</div>
            </div>
          </label>
        ))}

        <button type="button" className="btn btn--primary" onClick={onReset}>
          Reset to default
        </button>
        <button type="button" className="btn btn--outline" onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  );
}

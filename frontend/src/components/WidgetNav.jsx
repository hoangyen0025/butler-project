import { WIDGET_DEFINITIONS } from '../hooks/useDashboardLayout';
import './WidgetNav.css';

const titleMap = Object.fromEntries(WIDGET_DEFINITIONS.map((w) => [w.id, w.title]));

export function WidgetNav({ widgetIds }) {
  if (!widgetIds?.length) return null;

  const scrollToWidget = (id) => {
    const el = document.getElementById(`widget-${id}`);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <nav className="widget-nav" aria-label="Dashboard widgets">
      <div className="widget-nav__inner">
        {widgetIds.map((id) => (
          <button
            key={id}
            type="button"
            className="widget-nav__item"
            onClick={() => scrollToWidget(id)}
          >
            {titleMap[id] || id}
          </button>
        ))}
      </div>
    </nav>
  );
}

import { useState } from 'react';
import { WIDGET_DEFINITIONS } from '../hooks/useDashboardLayout';
import { CollapseButton } from './CollapsibleList';
import { EmptyWidgetsState } from './StateViews';

const titleMap = Object.fromEntries(WIDGET_DEFINITIONS.map((w) => [w.id, w.title]));

function DashboardWidget({ title, children }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`widget${collapsed ? ' widget--collapsed' : ''}`}>
      <div className="widget__header">
        <h3 className="widget__title">{title}</h3>
        <CollapseButton
          collapsed={collapsed}
          onToggle={() => setCollapsed((prev) => !prev)}
        />
      </div>
      {!collapsed && <div className="widget__body">{children}</div>}
    </div>
  );
}

export function DraggableDashboard({ widgetIds, renderWidget, onCustomize }) {
  if (widgetIds.length === 0) {
    return <EmptyWidgetsState onCustomize={onCustomize} />;
  }

  return (
    <div className="dashboard">
      {widgetIds.map((id) => (
        <DashboardWidget key={id} title={titleMap[id]}>
          {renderWidget(id)}
        </DashboardWidget>
      ))}
    </div>
  );
}

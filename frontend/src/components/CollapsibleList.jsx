import { useState } from 'react';

export function useCollapsibleItems(items, limit = 8) {
  const [expanded, setExpanded] = useState(false);
  const isLong = items.length > limit;
  const visibleItems = isLong && !expanded ? items.slice(0, limit) : items;

  const toggle = () => setExpanded((prev) => !prev);

  return { visibleItems, isLong, expanded, toggle };
}

export function ListToggle({ expanded, onToggle, expandLabel, collapseLabel }) {
  return (
    <button
      type="button"
      className="list-toggle"
      onClick={onToggle}
      aria-expanded={expanded}
    >
      <span
        className={`list-toggle__chevron${
          expanded ? '' : ' list-toggle__chevron--collapsed'
        }`}
        aria-hidden="true"
      >
        ▼
      </span>
      <span>{expanded ? collapseLabel : expandLabel}</span>
    </button>
  );
}

export function CollapseButton({ collapsed, onToggle, label }) {
  return (
    <button
      type="button"
      className="widget__collapse-btn"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      aria-expanded={!collapsed}
      aria-label={label ?? (collapsed ? 'Expand section' : 'Collapse section')}
    >
      <span
        className={`widget__chevron${collapsed ? ' widget__chevron--collapsed' : ''}`}
        aria-hidden="true"
      >
        ▼
      </span>
    </button>
  );
}

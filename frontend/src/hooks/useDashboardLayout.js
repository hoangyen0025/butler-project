import { useState, useEffect } from 'react';

const STORAGE_KEY = 'butler-dashboard-layout';

export const WIDGET_DEFINITIONS = [
  {
    id: 'stats',
    title: 'Overview Stats',
    description: 'Ticket counts by status and priority',
  },
  {
    id: 'table',
    title: 'Ticket List',
    description: 'Sortable table of all matching tickets',
  },
  {
    id: 'board',
    title: 'Status Board',
    description: 'Kanban-style columns grouped by status',
  },
  {
    id: 'categories',
    title: 'Category Breakdown',
    description: 'Visual breakdown by maintenance category',
  },
];

const DEFAULT_ORDER = WIDGET_DEFINITIONS.map((w) => w.id);
const DEFAULT_VISIBLE = {
  stats: true,
  table: true,
  board: true,
  categories: true,
};

function loadLayout() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        order: parsed.order || DEFAULT_ORDER,
        visible: { ...DEFAULT_VISIBLE, ...parsed.visible },
      };
    }
  } catch {
    /* use defaults */
  }
  return { order: DEFAULT_ORDER, visible: DEFAULT_VISIBLE };
}

export function useDashboardLayout() {
  const [layout, setLayout] = useState(loadLayout);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
  }, [layout]);

  const toggleWidget = (id) => {
    setLayout((prev) => ({
      ...prev,
      visible: { ...prev.visible, [id]: !prev.visible[id] },
    }));
  };

  const reorderWidgets = (newOrder) => {
    setLayout((prev) => ({ ...prev, order: newOrder }));
  };

  const resetLayout = () => {
    setLayout({ order: DEFAULT_ORDER, visible: DEFAULT_VISIBLE });
  };

  const visibleWidgets = layout.order.filter((id) => layout.visible[id]);

  return {
    layout,
    visibleWidgets,
    toggleWidget,
    reorderWidgets,
    resetLayout,
  };
}

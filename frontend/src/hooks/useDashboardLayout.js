import { useState, useEffect } from 'react';

const STORAGE_KEY = 'butler-dashboard-layout';

export const WIDGET_DEFINITIONS = [
  {
    id: 'stats',
    title: 'Key Metrics',
    description: 'Ticket counts by status and priority',
  },
  {
    id: 'table',
    title: 'Recent Tickets',
    description: 'Table of all matching tickets',
  },
  {
    id: 'board',
    title: 'Status Board',
    description: 'Kanban columns grouped by status',
  },
  {
    id: 'categories',
    title: 'Ticket Analytics',
    description: 'Charts and insights across categories, floors, and SLA',
  },
];

const DEFAULT_ORDER = WIDGET_DEFINITIONS.map((w) => w.id);
const DEFAULT_VISIBLE = {
  stats: true,
  table: true,
  board: true,
  categories: true,
};

function normalizeOrder(order) {
  const known = new Set(DEFAULT_ORDER);
  const normalized = order.filter((id) => known.has(id));
  DEFAULT_ORDER.forEach((id) => {
    if (!normalized.includes(id)) normalized.push(id);
  });
  return normalized;
}

function mergeVisibleOrder(fullOrder, newVisibleOrder, visible) {
  const result = [];
  let visibleIdx = 0;

  for (const id of fullOrder) {
    if (visible[id]) {
      if (visibleIdx < newVisibleOrder.length) {
        result.push(newVisibleOrder[visibleIdx++]);
      }
    } else {
      result.push(id);
    }
  }

  while (visibleIdx < newVisibleOrder.length) {
    result.push(newVisibleOrder[visibleIdx++]);
  }

  return normalizeOrder(result);
}

function loadLayout() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        order: normalizeOrder(parsed.order || DEFAULT_ORDER),
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
    setLayout((prev) => ({ ...prev, order: normalizeOrder(newOrder) }));
  };

  const reorderVisibleWidgets = (newVisibleOrder) => {
    setLayout((prev) => ({
      ...prev,
      order: mergeVisibleOrder(prev.order, newVisibleOrder, prev.visible),
    }));
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
    reorderVisibleWidgets,
    resetLayout,
  };
}

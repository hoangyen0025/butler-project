import { getTicketSla } from '../utils';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function buildCategoryStats(tickets) {
  const byCategory = new Map();

  for (const ticket of tickets) {
    const category = ticket.category || 'Unknown';
    if (!byCategory.has(category)) {
      byCategory.set(category, {
        category,
        count: 0,
        estimated: 0,
        actual: 0,
      });
    }

    const row = byCategory.get(category);
    row.count += 1;
    row.estimated += Number(ticket.cost?.estimated) || 0;
    row.actual += Number(ticket.cost?.actual) || 0;
  }

  return [...byCategory.values()].sort((a, b) => b.count - a.count);
}

/**
 * Simple alternating slice-and-dice treemap layout.
 * items: [{ id, value, label, color, meta }]
 */
export function layoutTreemap(items, width, height) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  if (total <= 0 || width <= 0 || height <= 0) return [];

  const result = [];

  function split(nodes, x, y, w, h, vertical) {
    if (nodes.length === 0) return;
    if (nodes.length === 1) {
      result.push({ ...nodes[0], x, y, w, h });
      return;
    }

    const sum = nodes.reduce((s, n) => s + n.value, 0);
    let acc = 0;
    let cut = 1;
    for (let i = 0; i < nodes.length; i += 1) {
      acc += nodes[i].value;
      if (acc >= sum / 2 || i === nodes.length - 2) {
        cut = i + 1;
        break;
      }
    }

    const left = nodes.slice(0, cut);
    const right = nodes.slice(cut);
    const leftSum = left.reduce((s, n) => s + n.value, 0);
    const ratio = leftSum / sum;

    if (vertical) {
      const w1 = w * ratio;
      split(left, x, y, w1, h, false);
      split(right, x + w1, y, w - w1, h, false);
    } else {
      const h1 = h * ratio;
      split(left, x, y, w, h1, true);
      split(right, x, y + h1, w, h - h1, true);
    }
  }

  const sorted = [...items].sort((a, b) => b.value - a.value);
  split(sorted, 0, 0, width, height, width >= height);
  return result;
}

export const STATUS_ORDER = ['Open', 'In Progress', 'On Hold', 'Closed'];
export const PRIORITY_ORDER = ['Critical', 'High', 'Medium', 'Low'];

export const STATUS_COLORS = {
  Open: '#60a5fa',
  'In Progress': '#fbbf24',
  'On Hold': '#a78bfa',
  Closed: '#34d399',
};

export const PRIORITY_COLORS = {
  Critical: '#f87171',
  High: '#fb923c',
  Medium: '#fbbf24',
  Low: '#94a3b8',
};

/** Category rows with counts per status (for stacked bar). */
export function buildStatusStacked(tickets) {
  const map = new Map();
  for (const ticket of tickets) {
    const category = ticket.category || 'Unknown';
    if (!map.has(category)) {
      map.set(category, {
        category,
        total: 0,
        byStatus: Object.fromEntries(STATUS_ORDER.map((s) => [s, 0])),
      });
    }
    const row = map.get(category);
    const status = STATUS_ORDER.includes(ticket.status)
      ? ticket.status
      : 'Open';
    row.byStatus[status] = (row.byStatus[status] || 0) + 1;
    row.total += 1;
  }
  return [...map.values()].sort((a, b) => b.total - a.total);
}

/** Matrix: categories × priorities for heatmap. */
export function buildPriorityHeatmap(tickets) {
  const map = new Map();
  let max = 0;
  for (const ticket of tickets) {
    const category = ticket.category || 'Unknown';
    if (!map.has(category)) {
      map.set(category, {
        category,
        total: 0,
        byPriority: Object.fromEntries(PRIORITY_ORDER.map((p) => [p, 0])),
      });
    }
    const row = map.get(category);
    const priority = PRIORITY_ORDER.includes(ticket.priority)
      ? ticket.priority
      : 'Medium';
    row.byPriority[priority] += 1;
    row.total += 1;
    max = Math.max(max, row.byPriority[priority]);
  }
  const rows = [...map.values()].sort((a, b) => {
    const aHot =
      (a.byPriority.Critical || 0) + (a.byPriority.High || 0);
    const bHot =
      (b.byPriority.Critical || 0) + (b.byPriority.High || 0);
    return bHot - aHot || b.total - a.total;
  });
  return { rows, max: Math.max(max, 1), priorities: PRIORITY_ORDER };
}

/** Floor → ticket count, sorted by volume. */
export function buildFloorCounts(tickets, limit = 12) {
  const counts = new Map();
  for (const ticket of tickets) {
    const floor = ticket.floor || ticket.location?.split(',')[0]?.trim() || 'Unknown';
    counts.set(floor, (counts.get(floor) || 0) + 1);
  }
  return [...counts.entries()]
    .map(([floor, count]) => ({ floor, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/** ISO week key YYYY-Www from created date string. */
function weekKey(dateStr) {
  const d = parseCreated(dateStr);
  if (!d) return null;
  // Thursday of this week determines ISO year/week
  const day = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dow = day.getUTCDay() || 7;
  day.setUTCDate(day.getUTCDate() + 4 - dow);
  const yearStart = new Date(Date.UTC(day.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((day - yearStart) / 86400000 + 1) / 7);
  return `${day.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

function parseCreated(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = String(dateStr).slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(Date.UTC(y, m - 1, d));
}

/**
 * Last N weeks of ticket creates per category.
 * Returns { weekKeys, series: [{ category, color?, values: number[] }] }
 */
export function buildWeeklyByCategory(tickets, weeks = 12) {
  const allKeys = new Set();
  const byCat = new Map();

  for (const ticket of tickets) {
    const key = weekKey(ticket.created);
    if (!key) continue;
    allKeys.add(key);
    const category = ticket.category || 'Unknown';
    if (!byCat.has(category)) byCat.set(category, new Map());
    const m = byCat.get(category);
    m.set(key, (m.get(key) || 0) + 1);
  }

  let weekKeys = [...allKeys].sort();
  if (weekKeys.length > weeks) {
    weekKeys = weekKeys.slice(-weeks);
  } else if (weekKeys.length === 0) {
    // synthesize empty recent weeks from today
    const now = new Date();
    for (let i = weeks - 1; i >= 0; i -= 1) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i * 7));
      const k = weekKey(d.toISOString().slice(0, 10));
      if (k) weekKeys.push(k);
    }
    weekKeys = [...new Set(weekKeys)].sort().slice(-weeks);
  }

  const series = [...byCat.entries()]
    .map(([category, weekMap]) => {
      const values = weekKeys.map((k) => weekMap.get(k) || 0);
      const total = values.reduce((s, v) => s + v, 0);
      return { category, values, total };
    })
    .sort((a, b) => b.total - a.total);

  return { weekKeys, series };
}

/**
 * Assignee load for one category (or all).
 * Returns top assignees by ticket count within that scope.
 */
export function buildAssigneeLoad(tickets, category = null, limit = 10) {
  const scoped = category
    ? tickets.filter((t) => (t.category || 'Unknown') === category)
    : tickets;

  const map = new Map();
  for (const ticket of scoped) {
    const name = ticket.assignee?.trim() || 'Unassigned';
    if (!map.has(name)) {
      map.set(name, {
        assignee: name,
        total: 0,
        open: 0,
        byCategory: {},
      });
    }
    const row = map.get(name);
    row.total += 1;
    if (ticket.status !== 'Closed') row.open += 1;
    const cat = ticket.category || 'Unknown';
    row.byCategory[cat] = (row.byCategory[cat] || 0) + 1;
  }

  return [...map.values()]
    .sort((a, b) => b.open - a.open || b.total - a.total)
    .slice(0, limit);
}

export const AGING_BUCKETS = [
  { key: 'fresh', label: '0–7d', color: '#34d399' },
  { key: 'mid', label: '8–30d', color: '#fbbf24' },
  { key: 'old', label: '30+d', color: '#f87171' },
];

function agingBucketKey(ageDays) {
  if (ageDays <= 7) return 'fresh';
  if (ageDays <= 30) return 'mid';
  return 'old';
}

/** Open tickets only, age from created → today, stacked buckets per category. */
export function buildAgingBuckets(tickets) {
  const today = todayIso();
  const map = new Map();

  for (const ticket of tickets) {
    if (ticket.status === 'Closed') continue;
    const category = ticket.category || 'Unknown';
    if (!map.has(category)) {
      map.set(category, {
        category,
        total: 0,
        buckets: { fresh: 0, mid: 0, old: 0 },
      });
    }
    const row = map.get(category);
    const sla = getTicketSla(ticket, today);
    const key = agingBucketKey(sla.ageDays);
    row.buckets[key] += 1;
    row.total += 1;
  }

  return [...map.values()].sort((a, b) => b.total - a.total);
}

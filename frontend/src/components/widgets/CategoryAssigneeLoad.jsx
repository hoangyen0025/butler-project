import { useMemo, useState, useEffect } from 'react';
import { buildAssigneeLoad } from '../../utils/categoryAnalytics';
import './CategoryExtraCharts.css';

export function CategoryAssigneeLoad({ tickets }) {
  const categories = useMemo(() => {
    const counts = new Map();
    for (const t of tickets) {
      const c = t.category || 'Unknown';
      counts.set(c, (counts.get(c) || 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([category]) => category);
  }, [tickets]);

  const [category, setCategory] = useState(categories[0] || '');

  useEffect(() => {
    if (!categories.includes(category)) {
      setCategory(categories[0] || '');
    }
  }, [categories, category]);

  const rows = useMemo(
    () => (category ? buildAssigneeLoad(tickets, category, 8) : []),
    [tickets, category]
  );
  const max = Math.max(...rows.map((r) => r.open || r.total), 1);

  if (categories.length === 0) {
    return <div className="empty-state">No assignee data.</div>;
  }

  return (
    <div className="cat-chart">
      <div className="cat-chart__head">
        <div>
          <h4 className="cat-chart__title">Assignee load by category</h4>
          <p className="cat-chart__subtitle">
            Who owns the most work in a trade (open first)
          </p>
        </div>
        <label className="cat-chart__select-wrap">
          <span className="visually-hidden">Category</span>
          <select
            className="cat-chart__select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="Category for assignee load"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      </div>

      {rows.length === 0 ? (
        <div className="empty-state">No assignees for this category.</div>
      ) : (
        <div className="aload" role="list">
          {rows.map((row) => (
            <div key={row.assignee} className="aload__row" role="listitem">
              <div className="aload__label" title={row.assignee}>
                {row.assignee}
              </div>
              <div
                className="aload__track"
                title={`${row.open} open · ${row.total} total`}
              >
                <div
                  className="aload__bar"
                  style={{
                    width: `${((row.open || row.total) / max) * 100}%`,
                  }}
                />
              </div>
              <span className="aload__meta">
                <strong>{row.open}</strong>
                <span> open</span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

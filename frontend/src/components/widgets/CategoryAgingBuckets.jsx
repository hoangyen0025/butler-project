import { useMemo } from 'react';
import {
  AGING_BUCKETS,
  buildAgingBuckets,
} from '../../utils/categoryAnalytics';
import './CategoryExtraCharts.css';

export function CategoryAgingBuckets({ tickets, colorByCategory }) {
  const rows = useMemo(() => buildAgingBuckets(tickets).slice(0, 8), [tickets]);
  const max = Math.max(...rows.map((r) => r.total), 1);

  if (rows.length === 0) {
    return <div className="empty-state">No open tickets for aging view.</div>;
  }

  return (
    <div className="cat-chart">
      <div className="cat-chart__head">
        <div>
          <h4 className="cat-chart__title">Aging buckets</h4>
          <p className="cat-chart__subtitle">
            Open tickets by age from created — 0–7 / 8–30 / 30+ days
          </p>
        </div>
      </div>

      <ul className="cat-chart__legend cat-chart__legend--row" aria-label="Age buckets">
        {AGING_BUCKETS.map((b) => (
          <li key={b.key}>
            <span style={{ background: b.color }} />
            {b.label}
          </li>
        ))}
      </ul>

      <div className="stacked-bars" role="list">
        {rows.map((row) => (
          <div key={row.category} className="stacked-bars__row" role="listitem">
            <div className="stacked-bars__label">
              <span
                className="stacked-bars__swatch"
                style={{ background: colorByCategory?.[row.category] }}
                aria-hidden="true"
              />
              <span title={row.category}>{row.category}</span>
              <span className="stacked-bars__total">{row.total}</span>
            </div>
            <div
              className="stacked-bars__track"
              title={AGING_BUCKETS.map(
                (b) => `${b.label}: ${row.buckets[b.key] || 0}`
              ).join(' · ')}
            >
              <div
                className="stacked-bars__fill"
                style={{ width: `${(row.total / max) * 100}%` }}
              >
                {AGING_BUCKETS.map((b) => {
                  const n = row.buckets[b.key] || 0;
                  if (n === 0) return null;
                  return (
                    <div
                      key={b.key}
                      className="stacked-bars__seg"
                      style={{ flexGrow: n, background: b.color }}
                      title={`${b.label}: ${n}`}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

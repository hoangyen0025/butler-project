import { useMemo } from 'react';
import {
  STATUS_ORDER,
  STATUS_COLORS,
  buildStatusStacked,
} from '../../utils/categoryAnalytics';
import './CategoryExtraCharts.css';

export function CategoryStackedBar({ tickets, colorByCategory }) {
  const rows = useMemo(() => buildStatusStacked(tickets).slice(0, 8), [tickets]);
  const max = Math.max(...rows.map((r) => r.total), 1);

  if (rows.length === 0) {
    return <div className="empty-state">No status data.</div>;
  }

  return (
    <div className="cat-chart">
      <div className="cat-chart__head">
        <div>
          <h4 className="cat-chart__title">Stacked — Category × Status</h4>
          <p className="cat-chart__subtitle">
            Open / In Progress / On Hold / Closed per trade
          </p>
        </div>
      </div>

      <ul className="cat-chart__legend cat-chart__legend--row" aria-label="Status legend">
        {STATUS_ORDER.map((status) => (
          <li key={status}>
            <span style={{ background: STATUS_COLORS[status] }} />
            {status}
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
              title={STATUS_ORDER.map(
                (s) => `${s}: ${row.byStatus[s] || 0}`
              ).join(' · ')}
            >
              <div
                className="stacked-bars__fill"
                style={{ width: `${(row.total / max) * 100}%` }}
              >
                {STATUS_ORDER.map((status) => {
                  const n = row.byStatus[status] || 0;
                  if (n === 0) return null;
                  return (
                    <div
                      key={status}
                      className="stacked-bars__seg"
                      style={{
                        flexGrow: n,
                        background: STATUS_COLORS[status],
                      }}
                      title={`${status}: ${n}`}
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

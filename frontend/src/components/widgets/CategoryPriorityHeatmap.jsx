import { useMemo } from 'react';
import {
  PRIORITY_COLORS,
  buildPriorityHeatmap,
} from '../../utils/categoryAnalytics';
import './CategoryExtraCharts.css';

function cellColor(count, max) {
  if (count <= 0) return 'rgba(255,255,255,0.04)';
  const t = Math.min(1, count / max);
  // warm heat: dim slate → amber → coral
  const r = Math.round(120 + t * 135);
  const g = Math.round(130 - t * 50);
  const b = Math.round(150 - t * 90);
  const a = 0.25 + t * 0.7;
  return `rgba(${r},${g},${b},${a})`;
}

export function CategoryPriorityHeatmap({ tickets }) {
  const { rows, max, priorities } = useMemo(
    () => buildPriorityHeatmap(tickets),
    [tickets]
  );
  const visible = rows.slice(0, 8);

  if (visible.length === 0) {
    return <div className="empty-state">No priority data.</div>;
  }

  return (
    <div className="cat-chart">
      <div className="cat-chart__head">
        <div>
          <h4 className="cat-chart__title">Heatmap — Category × Priority</h4>
          <p className="cat-chart__subtitle">
            Hotter cells = more tickets (Critical / High stand out)
          </p>
        </div>
      </div>

      <div className="heatmap-wrap">
        <table className="heatmap" aria-label="Category by priority heatmap">
          <thead>
            <tr>
              <th scope="col">Category</th>
              {priorities.map((p) => (
                <th key={p} scope="col">
                  <span
                    className="heatmap__prio-dot"
                    style={{ background: PRIORITY_COLORS[p] }}
                    aria-hidden="true"
                  />
                  {p}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr key={row.category}>
                <th scope="row">{row.category}</th>
                {priorities.map((p) => {
                  const n = row.byPriority[p] || 0;
                  return (
                    <td key={p}>
                      <span
                        className="heatmap__cell"
                        style={{ background: cellColor(n, max) }}
                        title={`${row.category} · ${p}: ${n}`}
                      >
                        {n > 0 ? n : '·'}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

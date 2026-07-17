import { useMemo } from 'react';
import { buildWeeklyByCategory } from '../../utils/categoryAnalytics';
import './CategoryExtraCharts.css';

function Sparkline({ values, color, width = 120, height = 28 }) {
  const max = Math.max(...values, 1);
  const pad = 2;
  const usableW = width - pad * 2;
  const usableH = height - pad * 2;
  const n = values.length;
  if (n === 0) return null;

  const coords = values.map((v, i) => {
    const x = pad + (n === 1 ? usableW / 2 : (i / (n - 1)) * usableW);
    const y = pad + usableH - (v / max) * usableH;
    return [x, y];
  });
  const linePoints = coords.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const area = [
    `M ${pad},${pad + usableH}`,
    ...coords.map(([x, y]) => `L ${x.toFixed(1)},${y.toFixed(1)}`),
    `L ${pad + usableW},${pad + usableH}`,
    'Z',
  ].join(' ');

  return (
    <svg
      className="sparkline"
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      aria-hidden="true"
    >
      <path d={area} fill={color} opacity="0.15" />
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.75"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={linePoints}
      />
    </svg>
  );
}

export function CategoryWeekSparklines({ tickets, colorByCategory }) {
  const { weekKeys, series } = useMemo(
    () => buildWeeklyByCategory(tickets, 12),
    [tickets]
  );
  const visible = series.slice(0, 8);

  if (visible.length === 0 || weekKeys.length === 0) {
    return <div className="empty-state">No weekly trend data.</div>;
  }

  const rangeLabel =
    weekKeys.length >= 2
      ? `${weekKeys[0]} → ${weekKeys[weekKeys.length - 1]}`
      : weekKeys[0];

  return (
    <div className="cat-chart">
      <div className="cat-chart__head">
        <div>
          <h4 className="cat-chart__title">Trend — tickets / week</h4>
          <p className="cat-chart__subtitle">
            Creates by category · {rangeLabel}
          </p>
        </div>
      </div>

      <div className="sparks" role="list">
        {visible.map((row) => {
          const color = colorByCategory?.[row.category] || '#60a5fa';
          const last = row.values[row.values.length - 1] || 0;
          return (
            <div key={row.category} className="sparks__row" role="listitem">
              <div className="sparks__label">
                <span
                  className="sparks__swatch"
                  style={{ background: color }}
                  aria-hidden="true"
                />
                <span title={row.category}>{row.category}</span>
              </div>
              <Sparkline values={row.values} color={color} />
              <span className="sparks__meta" title="Last week · total in range">
                <strong>{last}</strong>
                <span> / {row.total}</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

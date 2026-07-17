import { useMemo, useState } from 'react';
import { layoutTreemap } from '../../utils/categoryAnalytics';
import './CategoryExtraCharts.css';

export function CategoryTreemap({ stats }) {
  const [mode, setMode] = useState('count'); // count | cost
  const width = 560;
  const height = 220;

  const items = useMemo(
    () =>
      stats
        .map((row) => ({
          id: row.category,
          label: row.category,
          value: mode === 'count' ? row.count : row.estimated || row.count,
          color: row.color,
          meta:
            mode === 'count'
              ? `${row.count} tickets`
              : `Est. HKD ${Math.round(row.estimated).toLocaleString('en-HK')}`,
        }))
        .filter((item) => item.value > 0),
    [stats, mode]
  );

  const cells = useMemo(
    () => layoutTreemap(items, width, height),
    [items, width, height]
  );

  if (items.length === 0) {
    return <div className="empty-state">No treemap data.</div>;
  }

  return (
    <div className="cat-chart">
      <div className="cat-chart__head">
        <div>
          <h4 className="cat-chart__title">Treemap</h4>
          <p className="cat-chart__subtitle">
            Category size = {mode === 'count' ? 'ticket count' : 'estimated cost'}
          </p>
        </div>
        <div className="cat-chart__toggles" role="group" aria-label="Treemap sizing">
          <button
            type="button"
            className={`cat-chart__toggle${mode === 'count' ? ' is-active' : ''}`}
            onClick={() => setMode('count')}
          >
            Count
          </button>
          <button
            type="button"
            className={`cat-chart__toggle${mode === 'cost' ? ' is-active' : ''}`}
            onClick={() => setMode('cost')}
          >
            Cost
          </button>
        </div>
      </div>
      <svg
        className="cat-chart__svg"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Category treemap"
      >
        {cells.map((cell) => (
          <g key={cell.id}>
            <rect
              x={cell.x + 1}
              y={cell.y + 1}
              width={Math.max(0, cell.w - 2)}
              height={Math.max(0, cell.h - 2)}
              rx="6"
              fill={cell.color}
              opacity="0.88"
            >
              <title>
                {cell.label}: {cell.meta}
              </title>
            </rect>
            {cell.w > 56 && cell.h > 34 && (
              <>
                <text
                  x={cell.x + 10}
                  y={cell.y + 20}
                  className="cat-chart__treemap-label"
                  fill="#0b0d10"
                  fontSize="11"
                  fontWeight="700"
                >
                  {cell.label}
                </text>
                <text
                  x={cell.x + 10}
                  y={cell.y + 36}
                  fill="#0b0d10"
                  fontSize="10"
                  opacity="0.8"
                >
                  {mode === 'count' ? cell.value : `$${Math.round(cell.value / 1000)}k`}
                </text>
              </>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}

import { useMemo } from 'react';
import { buildFloorCounts } from '../../utils/categoryAnalytics';
import './CategoryExtraCharts.css';

export function CategoryFloorStrip({ tickets }) {
  const floors = useMemo(() => buildFloorCounts(tickets, 14), [tickets]);
  const max = Math.max(...floors.map((f) => f.count), 1);

  if (floors.length === 0) {
    return <div className="empty-state">No floor data.</div>;
  }

  return (
    <div className="cat-chart">
      <div className="cat-chart__head">
        <div>
          <h4 className="cat-chart__title">Floor strip</h4>
          <p className="cat-chart__subtitle">
            Top floors by ticket volume — pairs with the location map
          </p>
        </div>
      </div>

      <div className="floor-strip" role="list" aria-label="Tickets per floor">
        {floors.map((row) => {
          const h = Math.max(12, (row.count / max) * 72);
          return (
            <div
              key={row.floor}
              className="floor-strip__item"
              role="listitem"
              title={`${row.floor}: ${row.count} tickets`}
            >
              <span className="floor-strip__count">{row.count}</span>
              <div
                className="floor-strip__bar"
                style={{ height: `${h}px` }}
                aria-hidden="true"
              />
              <span className="floor-strip__label">{row.floor}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import { useMemo } from 'react';
import './CategoryExtraCharts.css';

export function CategoryButterfly({ stats }) {
  const rows = useMemo(() => {
    return [...stats]
      .map((row) => ({
        ...row,
        estimated: row.estimated || 0,
        actual: row.actual || 0,
      }))
      .sort((a, b) => b.estimated + b.actual - (a.estimated + a.actual))
      .slice(0, 8);
  }, [stats]);

  const maxValue = Math.max(
    ...rows.flatMap((row) => [row.estimated, row.actual]),
    1
  );

  if (rows.length === 0) {
    return <div className="empty-state">No cost data for butterfly chart.</div>;
  }

  return (
    <div className="cat-chart">
      <div className="cat-chart__head">
        <div>
          <h4 className="cat-chart__title">Butterfly — Est. vs Actual</h4>
          <p className="cat-chart__subtitle">
            Left estimated · right actual (HKD), top categories by spend
          </p>
        </div>
      </div>

      <div className="butterfly">
        <div className="butterfly__axis">
          <span>Estimated</span>
          <span>Category</span>
          <span>Actual</span>
        </div>
        {rows.map((row) => {
          const leftPct = (row.estimated / maxValue) * 100;
          const rightPct = (row.actual / maxValue) * 100;
          return (
            <div key={row.category} className="butterfly__row">
              <div className="butterfly__left">
                <div
                  className="butterfly__bar butterfly__bar--est"
                  style={{ width: `${leftPct}%` }}
                  title={`Estimated HKD ${Math.round(row.estimated).toLocaleString('en-HK')}`}
                />
                <span className="butterfly__value">
                  {Math.round(row.estimated).toLocaleString('en-HK')}
                </span>
              </div>
              <div className="butterfly__label" title={row.category}>
                <span
                  className="butterfly__swatch"
                  style={{ background: row.color }}
                />
                {row.category}
              </div>
              <div className="butterfly__right">
                <div
                  className="butterfly__bar butterfly__bar--act"
                  style={{ width: `${rightPct}%` }}
                  title={`Actual HKD ${Math.round(row.actual).toLocaleString('en-HK')}`}
                />
                <span className="butterfly__value">
                  {Math.round(row.actual).toLocaleString('en-HK')}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

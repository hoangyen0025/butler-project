import { useCollapsibleItems, ListToggle } from '../CollapsibleList';
import { CategoryDonut } from './CategoryDonut';
import { getCategoryColor } from './categoryColors';

export function CategoryBreakdown({ tickets, compact = false }) {
  const counts = tickets.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + 1;
    return acc;
  }, {});

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const total = tickets.length;
  const { visibleItems, isLong, expanded, toggle } = useCollapsibleItems(sorted, compact ? 4 : 6);

  if (sorted.length === 0) {
    return <div className="empty-state">No category data available.</div>;
  }

  const colorByCategory = Object.fromEntries(
    sorted.map(([category], index) => [category, getCategoryColor(index)])
  );

  return (
    <div className={`category-chart${compact ? ' category-chart--compact' : ''}`}>
      <CategoryDonut data={sorted} total={total} compact={compact} />
      <div className="category-legend" role="list" aria-label="Category breakdown">
        {visibleItems.map(([category, count]) => {
          const pct = total > 0 ? (count / total) * 100 : 0;
          const color = colorByCategory[category];

          return (
            <div key={category} className="category-legend__item" role="listitem">
              <div className="category-legend__header">
                <span className="category-legend__label">
                  <span
                    className="category-legend__swatch"
                    style={{ backgroundColor: color }}
                    aria-hidden="true"
                  />
                  {category}
                </span>
                <span className="category-legend__stats">
                  <span className="category-legend__count">{count}</span>
                  <span className="category-legend__pct">{pct.toFixed(0)}%</span>
                </span>
              </div>
              <div className="category-legend__bar-wrap">
                <div
                  className="category-legend__bar"
                  style={{ width: `${pct}%`, backgroundColor: color }}
                />
              </div>
            </div>
          );
        })}
        {isLong && (
          <ListToggle
            expanded={expanded}
            onToggle={toggle}
            expandLabel={`Show all ${sorted.length} categories`}
            collapseLabel="Show less"
          />
        )}
      </div>
    </div>
  );
}

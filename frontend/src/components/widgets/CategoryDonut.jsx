import { getCategoryColor } from './categoryColors';

export function CategoryDonut({ data, total, compact = false }) {
  const size = compact ? 136 : 148;
  const stroke = compact ? 18 : 22;
  const radius = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;

  let rotation = -90;

  return (
    <div
      className="category-donut"
      role="img"
      aria-label={`Ticket distribution across ${data.length} categories`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="category-donut__svg">
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="var(--chart-track)"
          strokeWidth={stroke}
        />
        {data.map(([label, value], index) => {
          const pct = value / total;
          const dash = pct * circumference;
          const segment = (
            <circle
              key={label}
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke={getCategoryColor(index)}
              strokeWidth={stroke}
              strokeDasharray={`${dash} ${circumference - dash}`}
              transform={`rotate(${rotation} ${cx} ${cy})`}
            />
          );
          rotation += pct * 360;
          return segment;
        })}
      </svg>
      <div className="category-donut__center">
        <span className="category-donut__total">{total}</span>
        <span className="category-donut__label">tickets</span>
      </div>
    </div>
  );
}

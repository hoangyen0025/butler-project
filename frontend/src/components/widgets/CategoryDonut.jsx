import { useState, useEffect, useRef } from 'react';
import { getCategoryColor } from './categoryColors';
import './CategoryDonut.css';

function useDonutSize(compact) {
  const containerRef = useRef(null);
  const [size, setSize] = useState(compact ? 168 : 200);

  useEffect(() => {
    if (compact) {
      setSize(168);
      return undefined;
    }

    const element = containerRef.current;
    if (!element) return undefined;

    const measure = () => {
      const width = element.getBoundingClientRect().width;
      if (width > 0) {
        setSize(Math.round(width));
      }
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    window.addEventListener('resize', measure);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [compact]);

  return { containerRef, size };
}

export function CategoryDonut({ data, total, compact = false }) {
  const [hovered, setHovered] = useState(null);
  const { containerRef, size } = useDonutSize(compact);
  const stroke = compact ? 22 : Math.max(24, Math.round(size * 0.12));
  const radius = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;

  let rotation = -90;

  const segments = data.map(([label, value], index) => {
    const pct = total > 0 ? (value / total) * 100 : 0;
    const dash = (value / total) * circumference;
    const segment = {
      label,
      value,
      pct,
      index,
      color: getCategoryColor(index),
      rotation,
      dash,
    };
    rotation += (value / total) * 360;
    return segment;
  });

  return (
    <div
      ref={containerRef}
      className={`category-donut${compact ? ' category-donut--compact' : ''}`}
      role="img"
      aria-label={`Ticket distribution across ${data.length} categories`}
      onMouseLeave={() => setHovered(null)}
    >
      {hovered && (
        <div className="category-donut__tooltip" role="tooltip">
          <span className="category-donut__tooltip-label">{hovered.label}</span>
          <span className="category-donut__tooltip-pct">{hovered.pct.toFixed(0)}%</span>
        </div>
      )}
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="category-donut__svg">
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="var(--chart-track)"
          strokeWidth={stroke}
        />
        {segments.map((segment) => {
          const isHovered = hovered?.label === segment.label;
          const isDimmed = hovered && !isHovered;

          return (
            <g
              key={segment.label}
              className="category-donut__segment"
              onMouseEnter={() =>
                setHovered({
                  label: segment.label,
                  value: segment.value,
                  pct: segment.pct,
                })
              }
            >
              <circle
                cx={cx}
                cy={cy}
                r={radius}
                fill="none"
                stroke="transparent"
                strokeWidth={stroke + 14}
                strokeDasharray={`${segment.dash} ${circumference - segment.dash}`}
                transform={`rotate(${segment.rotation} ${cx} ${cy})`}
                className="category-donut__hit"
              />
              <circle
                cx={cx}
                cy={cy}
                r={radius}
                fill="none"
                stroke={segment.color}
                strokeWidth={isHovered ? stroke + 2 : stroke}
                strokeDasharray={`${segment.dash} ${circumference - segment.dash}`}
                transform={`rotate(${segment.rotation} ${cx} ${cy})`}
                strokeOpacity={isDimmed ? 0.35 : 1}
                className="category-donut__arc"
              />
            </g>
          );
        })}
      </svg>
      <div className="category-donut__center">
        {hovered ? (
          <>
            <span className="category-donut__total">{hovered.pct.toFixed(0)}%</span>
            <span className="category-donut__label">{hovered.label}</span>
          </>
        ) : (
          <>
            <span className="category-donut__total">{total}</span>
            <span className="category-donut__label">tickets</span>
          </>
        )}
      </div>
    </div>
  );
}

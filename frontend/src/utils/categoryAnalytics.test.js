import { describe, it, expect } from 'vitest';
import { buildCategoryStats, layoutTreemap } from './categoryAnalytics';

describe('categoryAnalytics', () => {
  it('buildCategoryStats aggregates counts and costs', () => {
    const stats = buildCategoryStats([
      {
        category: 'HVAC',
        cost: { estimated: 100, actual: 80 },
      },
      {
        category: 'Plumbing',
        cost: { estimated: 50, actual: 40 },
      },
      {
        category: 'HVAC',
        cost: { estimated: 20, actual: 10 },
      },
    ]);

    expect(stats).toEqual([
      { category: 'HVAC', count: 2, estimated: 120, actual: 90 },
      { category: 'Plumbing', count: 1, estimated: 50, actual: 40 },
    ]);
  });

  it('layoutTreemap returns empty for invalid input', () => {
    expect(layoutTreemap([], 100, 100)).toEqual([]);
    expect(layoutTreemap([{ id: 1, value: 1 }], 0, 100)).toEqual([]);
  });

  it('layoutTreemap covers the full area for one item', () => {
    const boxes = layoutTreemap([{ id: 'a', value: 10, label: 'A' }], 200, 100);
    expect(boxes).toHaveLength(1);
    expect(boxes[0]).toMatchObject({ id: 'a', x: 0, y: 0, w: 200, h: 100 });
  });
});

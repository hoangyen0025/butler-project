import { describe, it, expect } from 'vitest';
import {
  filtersToSearchParams,
  searchParamsToFilters,
  recentTicketsAllPath,
  describeActiveFilters,
} from './filterParams';

describe('filterParams', () => {
  it('round-trips filters through URLSearchParams', () => {
    const filters = {
      status: ['Open', 'Closed'],
      category: ['HVAC'],
      priority: ['High'],
      search: 'leak',
    };
    const params = filtersToSearchParams(filters);
    expect(params.getAll('status')).toEqual(['Open', 'Closed']);
    expect(params.get('category')).toBe('HVAC');
    expect(params.get('priority')).toBe('High');
    expect(params.get('q')).toBe('leak');

    expect(searchParamsToFilters(params)).toEqual(filters);
  });

  it('builds recent tickets path with and without query', () => {
    expect(recentTicketsAllPath()).toBe('/recent-ticket/all');
    expect(
      recentTicketsAllPath({
        status: ['Open'],
        category: [],
        priority: [],
        search: '',
      })
    ).toBe('/recent-ticket/all?status=Open');
  });

  it('describeActiveFilters lists only set fields', () => {
    expect(
      describeActiveFilters({
        status: ['Open'],
        category: [],
        priority: ['Critical'],
        search: 'pump',
      })
    ).toEqual(['status: Open', 'priority: Critical', 'title: “pump”']);
  });
});

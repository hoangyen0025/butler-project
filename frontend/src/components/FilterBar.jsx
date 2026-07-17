import { MultiSelectFilter } from './MultiSelectFilter';
import './FilterBar.css';

export const EMPTY_FILTERS = {
  status: [],
  category: [],
  priority: [],
  search: '',
};

export function FilterBar({
  filters,
  onChange,
  meta,
  resultCount,
  loading = false,
  showCategory = true,
}) {
  const updateFilter = (field) => (values) => {
    onChange({ ...filters, [field]: values });
  };

  const clearFilters = () => {
    onChange({
      ...EMPTY_FILTERS,
      ...(showCategory ? {} : { category: [] }),
    });
  };

  const hasFilters =
    filters.status.length > 0 ||
    (showCategory && filters.category.length > 0) ||
    filters.priority.length > 0;

  return (
    <div className="filters">
      <div className="filters__row">
        <MultiSelectFilter
          label="Status"
          placeholder="All statuses"
          hint="Select one or more status"
          options={meta.statuses}
          selected={filters.status}
          onChange={updateFilter('status')}
        />

        {showCategory && (
          <MultiSelectFilter
            label="Category"
            placeholder="All categories"
            hint="Select one or more category"
            options={meta.categories}
            selected={filters.category}
            onChange={updateFilter('category')}
          />
        )}

        <MultiSelectFilter
          label="Priority"
          placeholder="All priorities"
          hint="Select one or more priority"
          options={meta.priorities}
          selected={filters.priority}
          onChange={updateFilter('priority')}
        />

        <div className="filters__actions">
          <button
            type="button"
            className={`btn btn--outline filters__clear${hasFilters ? ' filters__clear--active' : ''}`}
            onClick={clearFilters}
            disabled={!hasFilters}
            title="Clear all filters"
          >
            Clear filters
          </button>
        </div>
      </div>

      <div className="filters__count">
        {loading ? (
          <span className="filters__count-loading">Loading tickets…</span>
        ) : (
          <>
            Showing <strong>{resultCount}</strong> ticket{resultCount !== 1 ? 's' : ''}
          </>
        )}
      </div>
    </div>
  );
}

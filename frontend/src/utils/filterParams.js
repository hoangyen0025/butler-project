import { EMPTY_FILTERS } from '../components/FilterBar';

export function filtersToSearchParams(filters) {
  const params = new URLSearchParams();

  (filters.status || []).forEach((value) => params.append('status', value));
  (filters.category || []).forEach((value) => params.append('category', value));
  (filters.priority || []).forEach((value) => params.append('priority', value));

  const search = String(filters.search || '').trim();
  if (search) params.set('q', search);

  return params;
}

export function searchParamsToFilters(searchParams) {
  return {
    status: searchParams.getAll('status'),
    category: searchParams.getAll('category'),
    priority: searchParams.getAll('priority'),
    search: (searchParams.get('q') || '').trim(),
  };
}

export function recentTicketsAllPath(filters = EMPTY_FILTERS) {
  const params = filtersToSearchParams(filters);
  const query = params.toString();
  return query ? `/ticket/all?${query}` : '/ticket/all';
}

export function describeActiveFilters(filters) {
  const parts = [];
  if (filters.status?.length) parts.push(`status: ${filters.status.join(', ')}`);
  if (filters.category?.length) parts.push(`category: ${filters.category.join(', ')}`);
  if (filters.priority?.length) parts.push(`priority: ${filters.priority.join(', ')}`);
  if (filters.search) parts.push(`title: “${filters.search}”`);
  return parts;
}

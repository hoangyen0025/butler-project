const CSV_COLUMNS = [
  { key: 'id', header: 'ID' },
  { key: 'title', header: 'Title' },
  { key: 'status', header: 'Status' },
  { key: 'category', header: 'Category' },
  { key: 'priority', header: 'Priority' },
  { key: 'created', header: 'Created' },
  { key: 'updated', header: 'Updated' },
  { key: 'dueDate', header: 'Due Date' },
  { key: 'location', header: 'Location' },
  { key: 'floor', header: 'Floor' },
  { key: 'assetId', header: 'Asset ID' },
  { key: 'reporter', header: 'Reporter' },
  { key: 'assignee', header: 'Assignee' },
  { key: 'description', header: 'Description' },
];

function escapeCsvCell(value) {
  const str = value == null ? '' : String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function ticketsToCsv(tickets) {
  const header = CSV_COLUMNS.map((col) => escapeCsvCell(col.header)).join(',');
  const rows = tickets.map((ticket) =>
    CSV_COLUMNS.map((col) => escapeCsvCell(ticket[col.key])).join(',')
  );
  return [header, ...rows].join('\r\n');
}

function buildFilterQuery(filters = {}) {
  const params = new URLSearchParams();
  (filters.status || []).forEach((value) => params.append('status', value));
  (filters.category || []).forEach((value) => params.append('category', value));
  (filters.priority || []).forEach((value) => params.append('priority', value));

  const search = String(filters.search || '').trim();
  if (search) params.set('q', search);

  const assignee = String(filters.assignee || '').trim();
  if (assignee) params.set('assignee', assignee);

  return params;
}

function downloadCsv(filename, csvContent) {
  const bom = '\uFEFF';
  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/**
 * Fetch all tickets matching the current filters (no pagination limit)
 * and download them as a CSV file.
 */
export async function exportTicketsCsv(filters = {}) {
  const params = buildFilterQuery(filters);
  const query = params.toString();
  const url = `/api/tickets${query ? `?${query}` : ''}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch tickets for export');

  const data = await res.json();
  const tickets = data.tickets ?? [];
  if (tickets.length === 0) throw new Error('No tickets to export');

  const csv = ticketsToCsv(tickets);
  const date = new Date().toISOString().slice(0, 10);
  downloadCsv(`tickets-${date}.csv`, csv);
  return tickets.length;
}

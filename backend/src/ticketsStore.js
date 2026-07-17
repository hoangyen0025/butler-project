const path = require('path');
const fs = require('fs');

const ticketsPath = path.join(__dirname, '..', 'data', 'tickets.json');

const STATUSES = ['Open', 'In Progress', 'On Hold', 'Closed'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
const ACTOR = 'Dashboard User';

function loadTickets() {
  const raw = fs.readFileSync(ticketsPath, 'utf-8');
  return JSON.parse(raw);
}

function saveTickets(tickets) {
  fs.writeFileSync(ticketsPath, JSON.stringify(tickets, null, 2) + '\n', 'utf-8');
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function nowIso() {
  return new Date().toISOString();
}

function getNeighborIds(tickets, id) {
  const sortedIds = [...tickets].map((t) => t.id).sort((a, b) => a - b);
  const index = sortedIds.indexOf(id);
  if (index === -1) return { prevId: null, nextId: null };
  return {
    prevId: index > 0 ? sortedIds[index - 1] : null,
    nextId: index < sortedIds.length - 1 ? sortedIds[index + 1] : null,
  };
}

function parseQueryList(value) {
  if (!value) return [];
  const values = Array.isArray(value) ? value : [value];
  return values
    .flatMap((item) => String(item).split(','))
    .map((item) => item.trim())
    .filter(Boolean);
}

function matchesAny(ticketValue, selectedValues) {
  return selectedValues.length === 0 || selectedValues.includes(ticketValue);
}

function sortByCreatedDesc(tickets) {
  return [...tickets].sort(
    (a, b) => new Date(b.created).getTime() - new Date(a.created).getTime()
  );
}

function parsePositiveInt(value, fallback = null) {
  if (value == null || value === '') return fallback;
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function paginateTickets(tickets, page, limit) {
  const total = tickets.length;

  if (limit == null) {
    return {
      tickets,
      pagination: {
        page: 1,
        limit: total,
        total,
        totalPages: total === 0 ? 0 : 1,
      },
    };
  }

  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
  const safePage = totalPages === 0 ? 1 : Math.min(page, totalPages);
  const start = (safePage - 1) * limit;

  return {
    tickets: tickets.slice(start, start + limit),
    pagination: {
      page: safePage,
      limit,
      total,
      totalPages,
    },
  };
}

function logFilterRequest({
  statuses,
  categories,
  priorities,
  search,
  totalBefore,
  matched,
  pagination,
}) {
  if (process.env.DEBUG_TICKETS !== '1') return;

  const hasFilters =
    statuses.length > 0 ||
    categories.length > 0 ||
    priorities.length > 0 ||
    Boolean(search);

  console.log('\n--- GET /api/tickets ---');
  console.log('Filters from client:');
  console.log(`  status:   ${statuses.length ? statuses.join(' OR ') : '(all)'}`);
  console.log(`  category: ${categories.length ? categories.join(' OR ') : '(all)'}`);
  console.log(`  priority: ${priorities.length ? priorities.join(' OR ') : '(all)'}`);
  console.log(`  search:   ${search ? `"${search}"` : '(none)'}`);
  console.log(
    `Pagination: page=${pagination.page}, limit=${pagination.limit}, total=${pagination.total}, totalPages=${pagination.totalPages}`
  );

  if (hasFilters) {
    console.log(
      'Logic: (status) AND (category) AND (priority) AND (title search); OR within each multi-select field'
    );
  }

  console.log(
    `Result: ${matched.length} returned / ${pagination.total} matched / ${totalBefore} total`
  );

  if (matched.length > 0) {
    console.log('Returned IDs:');
    matched.forEach((t) => {
      console.log(`  #${t.id} [${t.status}] ${t.category} / ${t.priority}`);
    });
  }

  console.log('------------------------\n');
}

function toRelatedTicket(ticket) {
  return {
    id: ticket.id,
    title: ticket.title,
    status: ticket.status,
    priority: ticket.priority,
    category: ticket.category,
    assetId: ticket.assetId || null,
    location: ticket.location || null,
    floor: ticket.floor || null,
  };
}

function findRelatedTickets(ticket, allTickets, limit = 5) {
  const others = allTickets.filter((t) => t.id !== ticket.id);

  const sameAsset = others.filter(
    (t) => ticket.assetId && t.assetId === ticket.assetId
  );
  const sameFloorAndCategory = others.filter(
    (t) =>
      ticket.floor &&
      t.floor === ticket.floor &&
      t.category === ticket.category
  );
  const sameFloor = others.filter((t) => ticket.floor && t.floor === ticket.floor);
  const sameCategory = others.filter((t) => t.category === ticket.category);

  const seen = new Set();
  const merged = [];
  for (const candidate of [
    ...sameAsset,
    ...sameFloorAndCategory,
    ...sameFloor,
    ...sameCategory,
  ]) {
    if (seen.has(candidate.id)) continue;
    seen.add(candidate.id);
    merged.push(toRelatedTicket(candidate));
    if (merged.length >= limit) break;
  }

  return merged;
}

function withTicketExtras(ticket, tickets) {
  const related = findRelatedTickets(ticket, tickets);
  const { prevId, nextId } = getNeighborIds(tickets, ticket.id);
  return { ...ticket, related, prevId, nextId };
}

module.exports = {
  STATUSES,
  PRIORITIES,
  ACTOR,
  loadTickets,
  saveTickets,
  todayIso,
  nowIso,
  getNeighborIds,
  parseQueryList,
  matchesAny,
  sortByCreatedDesc,
  parsePositiveInt,
  paginateTickets,
  logFilterRequest,
  findRelatedTickets,
  withTicketExtras,
};

const express = require('express');
const { suggestReply } = require('../suggestReply');
const { summarizeTicket } = require('../summarizeTicket');
const { parseSearchQuery } = require('../parseSearchQuery');
const {
  STATUSES,
  PRIORITIES,
  ACTOR,
  loadTickets,
  saveTickets,
  todayIso,
  nowIso,
  parseQueryList,
  matchesAny,
  sortByCreatedDesc,
  parsePositiveInt,
  paginateTickets,
  logFilterRequest,
  findRelatedTickets,
  getNeighborIds,
} = require('../ticketsStore');

const router = express.Router();

//tickets and dashboard features 
router.get('/tickets', (req, res) => {
  const statuses = parseQueryList(req.query.status);
  const categories = parseQueryList(req.query.category);
  const priorities = parseQueryList(req.query.priority);
  const floors = parseQueryList(req.query.floor);
  const search = String(req.query.q || '').trim().toLowerCase();
  const overdueOnly =
    String(req.query.overdue || '').trim() === '1' ||
    String(req.query.overdue || '').toLowerCase() === 'true';
  const page = parsePositiveInt(req.query.page, 1);
  const limit = parsePositiveInt(req.query.limit, null);
  const today = todayIso();

  const allTickets = loadTickets();
  const totalBefore = allTickets.length;
  let tickets = allTickets;

  if (statuses.length > 0) {
    tickets = tickets.filter((t) => matchesAny(t.status, statuses));
  }
  if (categories.length > 0) {
    tickets = tickets.filter((t) => matchesAny(t.category, categories));
  }
  if (priorities.length > 0) {
    tickets = tickets.filter((t) => matchesAny(t.priority, priorities));
  }
  if (floors.length > 0) {
    tickets = tickets.filter((t) => matchesAny(t.floor, floors));
  }
  if (overdueOnly) {
    tickets = tickets.filter(
      (t) =>
        t.status !== 'Closed' &&
        t.dueDate &&
        String(t.dueDate).slice(0, 10) < today
    );
  }
  if (search) {
    const terms = search.split(/\s+/).filter(Boolean);
    tickets = tickets.filter((t) => {
      const hay = [
        t.title,
        t.description,
        t.location,
        t.floor,
        t.category,
        t.assignee,
        t.assetId,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return terms.every((term) => hay.includes(term));
    });
  }

  const assignee = String(req.query.assignee || '').trim();
  if (assignee) {
    tickets = tickets.filter((t) => t.assignee === assignee);
  }

  const sorted = sortByCreatedDesc(tickets);
  const { tickets: pageTickets, pagination } = paginateTickets(sorted, page, limit);

  logFilterRequest({
    statuses,
    categories,
    priorities,
    search,
    totalBefore,
    matched: pageTickets,
    pagination,
  });

  res.json({ tickets: pageTickets, pagination });
});

//get a single ticket by id + prev/next ids 
router.get('/tickets/:id', (req, res) => {
  const tickets = loadTickets(); //read all tickets from tickets.json 
  //go through tickets one by one 
  //for each item, call it t (ticket object)
  //id id of t = id from URL 
  //return that ticket 
  const ticket = tickets.find((t) => t.id === Number(req.params.id));

  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found' });
  }

  const related = findRelatedTickets(ticket, tickets);
  const { prevId, nextId } = getNeighborIds(tickets, ticket.id);

  res.json({ ...ticket, related, prevId, nextId });
});

router.patch('/tickets/:id', (req, res) => {
  const tickets = loadTickets();
  const index = tickets.findIndex((t) => t.id === Number(req.params.id));

  if (index === -1) {
    return res.status(404).json({ error: 'Ticket not found' });
  }

  const ticket = tickets[index];
  const body = req.body || {};
  const actor = String(body.actor || ACTOR).trim() || ACTOR;
  const asContractor = Boolean(body.asContractor);

  if (asContractor && ticket.assignee !== actor) {
    return res.status(403).json({ error: 'This job is not assigned to you' });
  }

  const activity = Array.isArray(ticket.activity) ? [...ticket.activity] : [];
  const today = todayIso();
  const stamped = nowIso();
  let changed = false;

  if (body.status != null && body.status !== ticket.status) {
    if (!STATUSES.includes(body.status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    if (asContractor && !['In Progress', 'On Hold', 'Closed'].includes(body.status)) {
      return res.status(400).json({ error: 'Contractors can only set In Progress, On Hold, or Closed' });
    }
    activity.push({
      at: stamped,
      type: 'status',
      actor,
      text: `Status changed to ${body.status}`,
      from: ticket.status,
      to: body.status,
    });
    ticket.status = body.status;
    changed = true;
  }

  if (!asContractor && body.priority != null && body.priority !== ticket.priority) {
    if (!PRIORITIES.includes(body.priority)) {
      return res.status(400).json({ error: 'Invalid priority' });
    }
    activity.push({
      at: stamped,
      type: 'assign',
      actor,
      text: `Priority changed from ${ticket.priority} to ${body.priority}`,
    });
    ticket.priority = body.priority;
    changed = true;
  }

  if (!asContractor && body.assignee != null) {
    const nextAssignee = String(body.assignee).trim();
    if (!nextAssignee) {
      return res.status(400).json({ error: 'Assignee required' });
    }
    if (nextAssignee !== ticket.assignee) {
      activity.push({
        at: stamped,
        type: 'assign',
        actor,
        text: `Assigned to ${nextAssignee}`,
      });
      ticket.assignee = nextAssignee;
      changed = true;
    }
  }

  if (body.note != null) {
    const note = String(body.note).trim();
    if (!note) {
      return res.status(400).json({ error: 'Note cannot be empty' });
    }
    const source = String(body.noteSource || '').trim().toLowerCase();
    activity.push({
      at: stamped,
      type: 'message',
      actor,
      text: note,
      ...(source === 'voice' ? { source: 'voice' } : {}),
    });
    changed = true;
  }

  if (body.checkIn) {
    if (!asContractor) {
      return res.status(400).json({ error: 'Only contractors can check in on site' });
    }

    const floor = String(body.floor || ticket.floor || '').trim() || null;
    const latRaw = body.lat != null ? Number(body.lat) : NaN;
    const lngRaw = body.lng != null ? Number(body.lng) : NaN;
    const lat = Number.isFinite(latRaw) ? latRaw : null;
    const lng = Number.isFinite(lngRaw) ? lngRaw : null;

    ticket.siteVisit = {
      arrivedAt: stamped,
      floor,
      lat,
      lng,
      actor,
    };

    const parts = ['Checked in on site'];
    if (floor) parts.push(`· ${floor}`);
    if (lat != null && lng != null) {
      parts.push(`· GPS ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    }

    activity.push({
      at: stamped,
      type: 'checkin',
      actor,
      text: parts.join(' '),
      floor,
      lat,
      lng,
    });

    if (ticket.status === 'Open') {
      activity.push({
        at: stamped,
        type: 'status',
        actor,
        text: 'Status changed to In Progress',
        from: 'Open',
        to: 'In Progress',
      });
      ticket.status = 'In Progress';
    }

    changed = true;
  }

  if (!changed) {
    return res.status(400).json({ error: 'No changes provided' });
  }

  ticket.activity = activity;
  ticket.updated = today;
  tickets[index] = ticket;
  saveTickets(tickets);

  const related = findRelatedTickets(ticket, tickets);
  const { prevId, nextId } = getNeighborIds(tickets, ticket.id);

  res.json({ ...ticket, related, prevId, nextId });
});

router.post('/tickets/:id/attachments', (req, res) => {
  const tickets = loadTickets();
  const index = tickets.findIndex((t) => t.id === Number(req.params.id));

  if (index === -1) {
    return res.status(404).json({ error: 'Ticket not found' });
  }

  const ticket = tickets[index];
  const body = req.body || {};
  const actor = String(body.actor || ACTOR).trim() || ACTOR;
  const asContractor = Boolean(body.asContractor);

  if (asContractor && ticket.assignee !== actor) {
    return res.status(403).json({ error: 'This job is not assigned to you' });
  }

  const kind = String(body.kind || 'evidence').trim();
  const label = String(body.label || 'Photo evidence').trim();
  const url = String(body.url || '').trim();

  if (!url) {
    return res.status(400).json({ error: 'Attachment url is required' });
  }

  const today = todayIso();
  const stamped = nowIso();
  const attachments = Array.isArray(ticket.attachments) ? [...ticket.attachments] : [];
  const attachment = {
    id: `${kind}-${ticket.id}-${Date.now()}`,
    kind,
    label,
    url,
    capturedAt: today,
    uploadedBy: actor,
  };
  attachments.push(attachment);
  ticket.attachments = attachments;

  const activity = Array.isArray(ticket.activity) ? [...ticket.activity] : [];
  activity.push({
    at: stamped,
    type: 'message',
    actor,
    text: `Uploaded photo evidence: ${label}`,
  });
  ticket.activity = activity;
  ticket.updated = today;

  tickets[index] = ticket;
  saveTickets(tickets);

  const related = findRelatedTickets(ticket, tickets);
  const { prevId, nextId } = getNeighborIds(tickets, ticket.id);

  res.status(201).json({ ...ticket, related, prevId, nextId });
});

router.delete('/tickets/:id/attachments/:attachmentId', (req, res) => {
  const tickets = loadTickets();
  const index = tickets.findIndex((t) => t.id === Number(req.params.id));

  if (index === -1) {
    return res.status(404).json({ error: 'Ticket not found' });
  }

  const ticket = tickets[index];
  const body = req.body || {};
  const actor = String(body.actor || ACTOR).trim() || ACTOR;
  const asContractor = Boolean(body.asContractor);

  if (asContractor && ticket.assignee !== actor) {
    return res.status(403).json({ error: 'This job is not assigned to you' });
  }

  const attachmentId = decodeURIComponent(String(req.params.attachmentId || ''));
  const attachments = Array.isArray(ticket.attachments) ? [...ticket.attachments] : [];
  const attachIndex = attachments.findIndex(
    (file) => String(file.id) === attachmentId || String(file.url) === attachmentId
  );

  if (attachIndex === -1) {
    return res.status(404).json({ error: 'Attachment not found' });
  }

  const [removed] = attachments.splice(attachIndex, 1);
  ticket.attachments = attachments;

  const today = todayIso();
  const stamped = nowIso();
  const activity = Array.isArray(ticket.activity) ? [...ticket.activity] : [];
  activity.push({
    at: stamped,
    type: 'message',
    actor,
    text: `Removed photo evidence: ${removed.label || 'Photo'}`,
  });
  ticket.activity = activity;
  ticket.updated = today;

  tickets[index] = ticket;
  saveTickets(tickets);

  const related = findRelatedTickets(ticket, tickets);
  const { prevId, nextId } = getNeighborIds(tickets, ticket.id);

  res.json({ ...ticket, related, prevId, nextId });
});

router.post('/tickets/:id/quotes', (req, res) => {
  const tickets = loadTickets();
  const index = tickets.findIndex((t) => t.id === Number(req.params.id));

  if (index === -1) {
    return res.status(404).json({ error: 'Ticket not found' });
  }

  const ticket = tickets[index];
  const body = req.body || {};
  const actor = String(body.actor || ACTOR).trim() || ACTOR;
  const asContractor = Boolean(body.asContractor);

  if (asContractor && ticket.assignee !== actor) {
    return res.status(403).json({ error: 'This job is not assigned to you' });
  }
  if (!asContractor) {
    return res.status(400).json({ error: 'Only contractors can submit part quotes' });
  }

  const partName = String(body.partName || '').trim();
  const qty = Number(body.qty);
  const unitCost = Number(body.unitCost);
  const note = String(body.note || '').trim();

  if (!partName) {
    return res.status(400).json({ error: 'Part name is required' });
  }
  if (!Number.isFinite(qty) || qty <= 0) {
    return res.status(400).json({ error: 'Quantity must be a positive number' });
  }
  if (!Number.isFinite(unitCost) || unitCost < 0) {
    return res.status(400).json({ error: 'Unit cost must be zero or greater' });
  }

  const today = todayIso();
  const stamped = nowIso();
  const estimatedTotal = Math.round(qty * unitCost * 100) / 100;
  const quote = {
    id: `qr-${ticket.id}-${Date.now()}`,
    partName,
    qty,
    unitCost,
    estimatedTotal,
    note: note || null,
    status: 'pending',
    requestedBy: actor,
    requestedAt: stamped,
    decidedBy: null,
    decidedAt: null,
  };

  const quoteRequests = Array.isArray(ticket.quoteRequests)
    ? [...ticket.quoteRequests]
    : [];
  quoteRequests.push(quote);
  ticket.quoteRequests = quoteRequests;

  const activity = Array.isArray(ticket.activity) ? [...ticket.activity] : [];
  activity.push({
    at: stamped,
    type: 'quote',
    actor,
    text: `Requested part “${partName}” × ${qty} · est. HKD ${estimatedTotal.toLocaleString('en-HK')}`,
    quoteId: quote.id,
    quoteStatus: 'pending',
  });
  ticket.activity = activity;
  ticket.updated = today;

  tickets[index] = ticket;
  saveTickets(tickets);

  const related = findRelatedTickets(ticket, tickets);
  const { prevId, nextId } = getNeighborIds(tickets, ticket.id);

  res.status(201).json({ ...ticket, related, prevId, nextId });
});

router.patch('/tickets/:id/quotes/:quoteId', (req, res) => {
  const tickets = loadTickets();
  const index = tickets.findIndex((t) => t.id === Number(req.params.id));

  if (index === -1) {
    return res.status(404).json({ error: 'Ticket not found' });
  }

  const ticket = tickets[index];
  const body = req.body || {};
  const actor = String(body.actor || ACTOR).trim() || ACTOR;
  const status = String(body.status || '').trim().toLowerCase();

  if (body.asContractor) {
    return res.status(403).json({ error: 'Only staff can approve or reject quotes' });
  }
  if (status !== 'approved' && status !== 'rejected') {
    return res.status(400).json({ error: 'Status must be approved or rejected' });
  }

  const quoteRequests = Array.isArray(ticket.quoteRequests)
    ? [...ticket.quoteRequests]
    : [];
  const quoteIndex = quoteRequests.findIndex((q) => q.id === req.params.quoteId);
  if (quoteIndex === -1) {
    return res.status(404).json({ error: 'Quote request not found' });
  }

  const quote = { ...quoteRequests[quoteIndex] };
  if (quote.status !== 'pending') {
    return res.status(400).json({ error: 'Quote already decided' });
  }

  const today = todayIso();
  const stamped = nowIso();
  quote.status = status;
  quote.decidedBy = actor;
  quote.decidedAt = stamped;
  quoteRequests[quoteIndex] = quote;
  ticket.quoteRequests = quoteRequests;

  if (status === 'approved') {
    const parts = Array.isArray(ticket.parts) ? [...ticket.parts] : [];
    parts.push({
      name: quote.partName,
      qty: quote.qty,
      unitCost: quote.unitCost,
      lineTotal: quote.estimatedTotal,
      fromQuoteId: quote.id,
    });
    ticket.parts = parts;

    const currency = ticket.cost?.currency || 'HKD';
    const estimated = Number(ticket.cost?.estimated) || 0;
    const actual = Number(ticket.cost?.actual) || 0;
    ticket.cost = {
      estimated: Math.round((estimated + quote.estimatedTotal) * 100) / 100,
      actual,
      currency,
    };
  }

  const activity = Array.isArray(ticket.activity) ? [...ticket.activity] : [];
  activity.push({
    at: stamped,
    type: 'quote',
    actor,
    text:
      status === 'approved'
        ? `Approved part quote “${quote.partName}” · HKD ${Number(
            quote.estimatedTotal
          ).toLocaleString('en-HK')} added to estimate`
        : `Rejected part quote “${quote.partName}”`,
    quoteId: quote.id,
    quoteStatus: status,
  });
  ticket.activity = activity;
  ticket.updated = today;

  tickets[index] = ticket;
  saveTickets(tickets);

  const related = findRelatedTickets(ticket, tickets);
  const { prevId, nextId } = getNeighborIds(tickets, ticket.id);

  res.json({ ...ticket, related, prevId, nextId });
});

router.post('/tickets/:id/suggest-reply', async (req, res) => {
  const tickets = loadTickets();
  const ticket = tickets.find((t) => t.id === Number(req.params.id));

  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found' });
  }

  const role =
    String(req.body?.role || '').toLowerCase() === 'contractor'
      ? 'contractor'
      : 'desk';

  try {
    const result = await suggestReply(ticket, role);
    res.json(result);
  } catch (err) {
    res.status(500).json({
      error: err.message || 'Could not suggest a reply',
    });
  }
});

router.post('/tickets/:id/summary', async (req, res) => {
  const tickets = loadTickets();
  const ticket = tickets.find((t) => t.id === Number(req.params.id));

  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found' });
  }

  try {
    const result = await summarizeTicket(ticket);
    res.json(result);
  } catch (err) {
    res.status(500).json({
      error: err.message || 'Could not summarize ticket',
    });
  }
});

//parse natural-language search query into structured filters
router.post('/search/parse', async (req, res) => {
  const q = String(req.body?.q || req.body?.query || '').trim();
  if (!q) {
    return res.status(400).json({ error: 'Query required' });
  }

  try {
    const tickets = loadTickets();
    const catalog = {
      categories: [...new Set(tickets.map((t) => t.category).filter(Boolean))].sort(),
      floors: [...new Set(tickets.map((t) => t.floor).filter(Boolean))].sort(),
    };
    const result = await parseSearchQuery(q, catalog);
    res.json(result);
  } catch (err) {
    res.status(500).json({
      error: err.message || 'Could not parse search',
    });
  }
});

//return all filter options 
router.get('/meta', (_req, res) => {
  const tickets = loadTickets(); //load all tickets 
  //to build unique sorted lists for each field - unique('category') -> returns ['Electrical', 'HVAC', 'Plumbing']
  const unique = (key) => [...new Set(tickets.map((t) => t[key]).filter(Boolean))].sort();

  res.json({
    //if unique list is non-empty, return it. otw, use hardcoded defaults 
    statuses: unique('status').length ? unique('status') : STATUSES,
    categories: unique('category'),
    priorities: unique('priority').length ? unique('priority') : PRIORITIES,
    assignees: unique('assignee'),
    total: tickets.length,
  });
});

module.exports = router;

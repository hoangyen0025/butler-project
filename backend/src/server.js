const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

const ticketsPath = path.join(__dirname, '..', 'data', 'tickets.json');

function loadTickets() {
  const raw = fs.readFileSync(ticketsPath, 'utf-8');
  return JSON.parse(raw);
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

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/tickets', (req, res) => {
  const statuses = parseQueryList(req.query.status);
  const categories = parseQueryList(req.query.category);
  const priorities = parseQueryList(req.query.priority);

  let tickets = loadTickets();

  if (statuses.length > 0) {
    tickets = tickets.filter((t) => matchesAny(t.status, statuses));
  }
  if (categories.length > 0) {
    tickets = tickets.filter((t) => matchesAny(t.category, categories));
  }
  if (priorities.length > 0) {
    tickets = tickets.filter((t) => matchesAny(t.priority, priorities));
  }

  res.json(sortByCreatedDesc(tickets));
});

app.get('/api/tickets/:id', (req, res) => {
  const tickets = loadTickets();
  const ticket = tickets.find((t) => t.id === Number(req.params.id));

  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found' });
  }

  res.json(ticket);
});

app.get('/api/meta', (_req, res) => {
  const tickets = loadTickets();
  const unique = (key) => [...new Set(tickets.map((t) => t[key]))].sort();

  res.json({
    statuses: unique('status'),
    categories: unique('category'),
    priorities: unique('priority'),
    total: tickets.length,
  });
});

app.listen(PORT, () => {
  console.log(`Maintenance API running at http://localhost:${PORT}`);
});

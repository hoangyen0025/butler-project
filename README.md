# Butler Maintenance Dashboard

A maintenance ticket dashboard built for the Butler Asia technical assessment. Property managers can view, filter, and customize their building maintenance overview; vendors use a contractor portal to work assigned jobs on site.

## Features

### Core (assessment requirements)

- **Ticket list** — 80 realistic maintenance tickets served from a JSON data source via a Node.js API
- **Multi-select filtering** — Filter by status, category, and priority; filters are combinable (AND across types, OR within each type)
- **Customizable dashboard** — Toggle widgets on/off and drag to reorder; layout persists in `localStorage`
- **Clean, operations-focused UI** — Dark dashboard theme with clear status/priority badges and at-a-glance metrics

### Dashboard widgets

| Widget | Description |
|--------|-------------|
| **Key Metrics** | Counts by status (Open, In Progress, Closed, On Hold) plus urgent High/Critical; click a card to jump to that section on the Status Board |
| **Recent Tickets** | Paginated table with status and priority badges |
| **Status Board** | Kanban columns by status, urgent strip for High/Critical tickets, and **all pending part quotes** listed below the board (site-wide, independent of dashboard filters) |
| **Ticket Analytics** | Chart grid (donut, floor, stacked, aging, trends, assignee, treemap, butterfly, heatmap) plus location map |

### Ticket detail (staff)

- Full ticket view at `/ticket/:id` (also `/tickets/:id`)
- **Actions** — Update status, priority, and assignee (saved via API; activity timeline updates from the backend)
- **Chat box** — Popup chat with optional voice dictation (Web Speech API); messages persist on the ticket
- **Activity timeline**, photos/attachments (with remove), parts & cost, pending vendor quote approve/reject
- **Print** and **Download PDF** icon buttons (PDF matches the print-style white layout)

### Contractor portal

- Sign-in at `/contractor` with username + password (session token, ~8 hours)
- Jobs list for the signed-in vendor only (`/contractor/jobs`)
- Filters for **status** and **priority** (same FilterBar pattern as staff; category filter omitted)
- Floor walk / today’s route for open jobs
- Job detail: description, summary, status update, photo upload/remove, parts & quote request, chat box with voice

#### Demo contractor logins

Password for all demo accounts: `demo123`

| Username | Maps to assignee |
|----------|------------------|
| `coolair` | CoolAir Cont. |
| `greenscape` | GreenScape |
| `powerfix` | PowerFix HK |
| `leo` | Leo Fung |
| `securetech` | SecureTech |
| `aquapipe` | AquaPipe Co. |
| `cityplumb` | City Plumb |
| `liftcare` | LiftCare Asia |
| `firesafe` | FireSafe Co. |
| `cleanpro` | CleanPro |

### Additional UX

- Fixed filter bar at the top of the staff dashboard (applies to widgets below)
- **Server-side pagination** (`page` / `limit` query params) on tables, status board columns, urgent strip, and contractor jobs
- Natural-language search (`/search`) with optional AI parse
- Loading skeletons, empty states, and error handling with retry
- Widget nav for jumping between dashboard sections
- Responsive layout
- **Unit tests** for core backend helpers and frontend utils (see below)

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, React Router, @dnd-kit, Leaflet, jsPDF + html2canvas |
| Backend | Node.js, Express |
| Data | JSON file (`backend/data/tickets.json`) |
| Tests | Node.js built-in test runner (`node --test`), Vitest |

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- npm (comes with Node.js)

## Setup

### 1. Install dependencies

From the project root:

```bash
npm run install:all
```

Or install each part separately:

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. Start the backend API

```bash
npm run dev:backend
```

The API runs at **http://localhost:3001**.

### 3. Start the frontend (in a new terminal)

```bash
npm run dev:frontend
```

The app opens at **http://localhost:5173**. API requests are proxied to the backend automatically.

Optional: set `OPENAI_API_KEY` in `backend/.env` for AI suggest-reply / summary / search-parse features.

## Main routes

| Path | Description |
|------|-------------|
| `/` | Staff dashboard |
| `/ticket/:id` | Staff ticket detail |
| `/tickets/:id` | Alias for staff ticket detail |
| `/recent-ticket/all` | Full recent-tickets list (respects dashboard filters) |
| `/search` | Search results |
| `/contractor` | Contractor login |
| `/contractor/jobs` | Contractor job list |
| `/contractor/jobs/:id` | Contractor job detail |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tickets` | List tickets (`status`, `category`, `priority`, `assignee`, `page`, `limit`, …) |
| GET | `/api/tickets/:id` | Single ticket (+ related, neighbors) |
| PATCH | `/api/tickets/:id` | Update status / priority / assignee / note (chat) |
| POST | `/api/tickets/:id/attachments` | Add photo evidence |
| DELETE | `/api/tickets/:id/attachments/:attachmentId` | Remove attachment |
| POST | `/api/tickets/:id/quotes` | Contractor parts & quote request |
| PATCH | `/api/tickets/:id/quotes/:quoteId` | Staff approve/reject quote |
| GET | `/api/contractor/accounts` | Demo contractor usernames |
| POST | `/api/contractor/login` | Create contractor session |
| GET | `/api/contractor/session` | Validate session (`Authorization: Bearer …`) |
| POST | `/api/contractor/logout` | End session |
| GET | `/api/meta` | Filter options and totals |
| POST | `/api/tickets/:id/suggest-reply` | AI reply suggestion (optional key) |
| POST | `/api/tickets/:id/summary` | AI ticket summary (optional key) |
| POST | `/api/search/parse` | AI natural-language search parse (optional key) |

### Filter & pagination behaviour

- Multiple values for the same field use **OR** logic (e.g. `status=Open&status=In Progress`)
- Different fields use **AND** logic (e.g. status + category + priority together)
- Results are sorted by `created` date, newest first
- Pagination is **server-side**: pass `page` and `limit`; response includes `{ tickets, pagination }`

## Project Structure

```
butler project/
├── backend/
│   ├── data/tickets.json
│   └── src/
│       ├── server.js                 # App entry (middleware + mount routes)
│       ├── ticketsStore.js           # Load/save tickets + shared helpers
│       ├── ticketsStore.test.js
│       ├── contractorAuth.js         # Demo logins + session tokens
│       ├── contractorAuth.test.js
│       ├── routes/
│       │   ├── contractor.js         # /api/contractor/*
│       │   └── api.js                # /api/tickets, meta, search
│       ├── parseSearchQuery.js
│       ├── suggestReply.js
│       └── summarizeTicket.js
├── frontend/
│   └── src/
│       ├── App.jsx
│       ├── pages/                    # Staff + contractor pages
│       ├── hooks/                    # useTickets, useContractor, layout
│       ├── components/
│       │   ├── TicketChat.jsx
│       │   ├── TicketAttachments.jsx
│       │   ├── TicketActionsPanel.jsx
│       │   ├── ContractorQuoteForm.jsx
│       │   ├── TicketDetail.css
│       │   └── widgets/              # Stats, table, StatusBoard (+ PendingQuotes), analytics
│       ├── utils/
│       │   ├── filterParams.js
│       │   ├── categoryAnalytics.js
│       │   └── *.test.js             # Vitest unit tests
│       └── utils.test.js
├── package.json                      # Root scripts (install, dev, test, build)
└── README.md
```

## Design Decisions

- **Property manager persona** — Staff UI prioritizes urgent cases, status counts, and analytics for building operations.
- **Contractor persona** — Vendors see only their assigned jobs, with site-first layout (description + status, evidence, quotes, chat).
- **Urgent visibility** — High/Critical tickets are highlighted in Key Metrics and the urgent strip; metric cards deep-link into the Status Board.
- **Pending quotes on the board** — All vendor part quotes with status `pending` appear under the Status Board so staff can review them without digging through analytics or filters.
- **Server-side filtering & pagination** — Keeps list logic in the API and demonstrates REST query design.
- **Activity as source of truth** — Status changes, chat notes, uploads, and quotes append to `ticket.activity` on the backend; the UI reads that payload.
- **JSON data source** — Simple to run for reviewers; no database setup required.
- **Persistent staff layout** — Widget order/visibility saved in `localStorage`.
- **Contractor sessions** — Opaque tokens in memory (8h TTL) with credentials stored in the browser tab via `sessionStorage`.
- **Tested helpers** — Auth, pagination/filter helpers, and frontend utils have unit coverage without needing a browser or live server.

## Unit tests

From the project root (after `npm run install:all`):

```bash
npm test
```

Or separately:

```bash
npm run test:backend
npm run test:frontend
```

| Area | Runner | Covers |
|------|--------|--------|
| Backend | `node --test` | Contractor auth (login/session), ticket helpers (filters, pagination, neighbors) |
| Frontend | Vitest | Urgent/SLA helpers, URL filter params, category analytics |

Expect about **24** passing tests (`11` backend + `13` frontend).

## Production Build

```bash
npm run build
```

Built static files are output to `frontend/dist/`. Serve them with any static file server and point API calls to your deployed backend.

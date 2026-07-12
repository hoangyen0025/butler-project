# Butler Maintenance Dashboard

A maintenance ticket dashboard built for the Butler Asia technical assessment. Property managers can view, filter, and customize their building maintenance overview at a glance.

## Features

### Core (assessment requirements)

- **Ticket list** — 80 realistic maintenance tickets served from a JSON data source via a Node.js API
- **Multi-select filtering** — Filter by status, category, and priority; filters are combinable (AND across types, OR within each type)
- **Customizable dashboard** — Toggle widgets on/off and drag to reorder on the main view and in the Customize panel; layout persists in `localStorage`
- **Clean, operations-focused UI** — Dark dashboard theme with clear status/priority badges and at-a-glance metrics

### Dashboard widgets

| Widget | Description |
|--------|-------------|
| **Key Metrics** | Counts by status (Open, In Progress, Closed, On Hold) with urgent High/Critical cases highlighted |
| **Recent Tickets** | Paginated table with status and priority badges |
| **Status Board** | Kanban-style columns by status, plus an urgent strip for active High/Critical tickets |
| **Category Breakdown** | Donut chart with legend; hover a segment to see category name and percentage |

### Additional UX

- Fixed filter bar at the top (applies to all widgets below)
- Pagination (5 items per page) on the ticket table, status board columns, and urgent strip
- Loading skeletons, empty states, and error handling with retry
- Clear filters button when any filter is active
- Responsive layout with collapsible category legend for long lists

## Tech Stack

| Layer    | Technology |
|----------|------------|
| Frontend | React 18, Vite, @dnd-kit |
| Backend  | Node.js, Express |
| Data     | JSON file (`backend/data/tickets.json`) |

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

The dashboard opens at **http://localhost:5173**. API requests are proxied to the backend automatically.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/tickets` | List tickets (supports `?status=`, `?category=`, `?priority=`; multi-value) |
| GET | `/api/tickets/:id` | Single ticket by ID |
| GET | `/api/meta` | Available filter values and total count |

### Filter behaviour

- Multiple values for the same field use **OR** logic (e.g. `status=Open&status=In Progress`)
- Different fields use **AND** logic (e.g. status + category + priority together)
- Results are sorted by `created` date, newest first

## Project Structure

```
butler project/
├── backend/
│   ├── data/tickets.json       # 80 maintenance tickets
│   └── src/server.js           # Express API
├── frontend/
│   └── src/
│       ├── App.jsx             # Main orchestration (filters, widgets, layout)
│       ├── hooks/
│       │   ├── useTickets.js   # API fetching & filter params
│       │   └── useDashboardLayout.js  # Widget registry & localStorage
│       ├── components/
│       │   ├── FilterBar.jsx
│       │   ├── DraggableDashboard.jsx
│       │   ├── DashboardCustomizer.jsx
│       │   └── widgets/        # One file per dashboard widget
│       │       ├── StatsCards.jsx
│       │       ├── TicketTable.jsx
│       │       ├── StatusBoard.jsx
│       │       ├── CategoryBreakdown.jsx
│       │       └── index.js
│       └── utils.js
├── package.json                
└── README.md
```

## Design Decisions

- **Property manager persona** — The UI prioritizes urgent cases, status counts, and category distribution for building operations staff.
- **Urgent visibility** — High/Critical tickets are highlighted in Key Metrics and surfaced in a dedicated urgent strip above the status board.
- **Widget-based dashboard** — Users show only what they need and reorder via drag-and-drop; filters stay fixed at the top.
- **Server-side filtering** — Filtering runs in the API to keep data logic out of the UI and demonstrate REST query design.
- **Status board data** — The board uses a separate fetch without the priority filter so kanban columns still show all priorities when filtering by status/category only.
- **JSON data source** — Keeps the backend simple and easy to run for reviewers; no database setup required.
- **Persistent layout** — Dashboard widget order and visibility are saved to `localStorage` across page refreshes.
- **Modular frontend** — Widgets live in separate files under `components/widgets/`; shared logic is extracted into hooks and utilities.

## Production Build

```bash
npm run build
```

Built static files are output to `frontend/dist/`. Serve them with any static file server and point API calls to your deployed backend.

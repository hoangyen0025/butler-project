# Butler Maintenance Dashboard

A maintenance ticket dashboard built for the Butler Asia technical assessment. Property managers can view, filter, and customize their building maintenance overview at a glance.

## Features

- **Ticket list** — 80 realistic maintenance tickets served from a JSON data source via a Node.js API
- **Filtering** — Filter by status, category, and priority (combinable)
- **Customizable dashboard** — Toggle widgets on/off and drag to reorder; layout persists in localStorage
- **Dashboard widgets**
  - Overview stats (counts by status and high-priority tickets)
  - Ticket table with status and priority badges
  - Status board (kanban-style columns)
  - Category breakdown chart

## Tech Stack

| Layer    | Technology                          |
|----------|-------------------------------------|
| Frontend | React 18, Vite, @dnd-kit            |
| Backend  | Node.js, Express                    |
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

| Method | Endpoint           | Description                          |
|--------|--------------------|--------------------------------------|
| GET    | `/api/health`      | Health check                         |
| GET    | `/api/tickets`     | List tickets (supports `?status=`, `?category=`, `?priority=`) |
| GET    | `/api/tickets/:id` | Single ticket by ID                  |
| GET    | `/api/meta`        | Available filter values and total count |

## Project Structure

```
butler-project/
├── backend/
│   ├── data/tickets.json    # 80 maintenance tickets
│   └── src/server.js        # Express API
├── frontend/
│   └── src/
│       ├── components/      # UI components
│       ├── hooks/           # Data fetching & layout state
│       └── App.jsx          # Main application
└── README.md
```

## Design Decisions

- **Property manager persona** — The UI prioritizes at-a-glance status counts, high-priority visibility, and category distribution for building operations staff.
- **Widget-based dashboard** — Users can show only what they need (e.g. hide the table, keep the status board) and reorder via drag-and-drop.
- **JSON data source** — Keeps the backend simple and focused; filtering is done server-side to demonstrate API design.
- **Persistent layout** — Dashboard preferences are saved to `localStorage` so they survive page refreshes.

## Production Build

```bash
npm run build
```

Built static files are output to `frontend/dist/`. Serve them with any static file server and point API calls to your deployed backend.

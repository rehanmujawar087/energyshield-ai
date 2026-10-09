# EnergyShield AI — Frontend

React + Vite dashboard: digital twin map, corridor risk panel, scenario modeller controls, procurement and SPR panels.

## Status

Only a minimal app shell exists right now — `App.jsx` renders the project name. Verified `npm run dev` starts and serves the page at `http://localhost:5173`. No dashboard components (map, risk panel, scenario/procurement/SPR panels) yet. See the repo root `README.md` → "Status" for the honest current state.

## Structure

```
frontend/
├── package.json
├── vite.config.js
├── index.html
└── src/
    ├── main.jsx        # entrypoint
    ├── App.jsx         # app shell — renders project name only, so far
    ├── components/     # map, risk panel, scenario/procurement/SPR panels (TODO)
    └── lib/            # API client for the backend (TODO)
```

## Tech

React + Vite today. Tailwind CSS, react-leaflet (map), and Recharts (charts) are planned additions once the dashboard components are built — not installed yet.

## Setup

```bash
cd frontend
npm install
npm run dev
# open http://localhost:5173
```

## Ownership

- Digital twin map + corridor risk dashboard — **khadija1407**
- Scenario/procurement/SPR panels, demo script, deck — **PradnyaN21**

See root `CLAUDE.md` for the full ownership table and commit conventions.

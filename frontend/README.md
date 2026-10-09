# EnergyShield AI — Frontend

React + Vite dashboard: digital twin map, corridor risk panel, scenario modeller controls, procurement and SPR panels.

## Status

Full dashboard UI built and build-verified (`npm run build` succeeds, `npm run dev` serves it, no transform errors): dark "energy control room" theme, top bar with live clock and a "Demo data" pill, KPI strip, a react-leaflet map with risk-coloured corridors / ports / refineries / SPR sites / drifting simulated vessels, a corridor detail drawer, and right-column panels for corridor risk ranking, scenario modeller, procurement options, SPR days-of-cover chart, and pipeline timing. An "inject headline" bar drives the whole chain.

Every panel tries the real backend first (`src/lib/api.js`) and falls back to local mock data (`src/mock/*.js`) if it's unreachable — both paths are mock-sourced right now (see `docs/API.md`). **Not yet verified:** actual in-browser rendering and click-through interaction — this was built and build-checked without a browser available in that session. Click through it once (map clicks, inject headline, run scenario) before relying on it for a live demo.

See the repo root `README.md` → "Status" for the honest current state of the whole project.

## Structure

```
frontend/
├── package.json
├── vite.config.js
├── index.html
└── src/
    ├── main.jsx              # entrypoint — imports leaflet + global CSS
    ├── App.jsx               # composes the full dashboard
    ├── index.css             # dark theme, all component styles (plain CSS, no framework)
    ├── lib/
    │   ├── api.js            # fetch client, one function per endpoint
    │   ├── endpoints.js       # typed list of backend endpoints
    │   ├── useApiOrMock.js    # tries live backend, falls back to mock/*.js
    │   └── format.js          # risk colour, number/time formatting helpers
    ├── mock/                 # local mock data mirroring docs/API.md response shapes
    └── components/
        ├── layout/           # TopBar, KpiStrip, Toasts, Skeleton/Empty/Error states
        ├── map/               # MapPanel, CorridorDetailDrawer, icons, vessel drift
        └── panels/            # CorridorRiskList, Scenario/Procurement/SPR/Pipeline/InjectHeadline
```

## Tech

React + Vite, react-leaflet + leaflet (map), Recharts (SPR chart), Inter (Google Fonts). Plain CSS with CSS custom properties for the dark theme — no Tailwind/CSS framework installed.

## Setup

```bash
cd frontend
npm install
npm run dev
# open http://localhost:5173
```

The dashboard works standalone (mock data) even if `backend/` isn't running. To see the "live" pill instead of "demo data", also run the backend (see `backend/README.md`) — note it currently returns mock data too (`meta.source: "mock"`), so visuals won't change, only the pill's live/demo wording.

## Ownership

- Digital twin map + corridor risk dashboard — **khadija1407**
- Scenario/procurement/SPR panels, demo script, deck — **PradnyaN21**

See root `CLAUDE.md` for the full ownership table and commit conventions.

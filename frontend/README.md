# EnergyShield AI — Frontend

React + Vite dashboard: digital twin map, corridor risk panel, scenario modeller controls, procurement and SPR panels.

## Status

Scaffold only — no components implemented yet. See the repo root `README.md` → "Status" for the honest current state.

## Structure

```
frontend/
├── package.json
└── src/
    ├── main.tsx        # entrypoint (TODO)
    ├── App.tsx         # layout/router (TODO)
    ├── components/     # map, risk panel, scenario/procurement/SPR panels (TODO)
    └── lib/            # API client for the backend (TODO)
```

## Tech

React, Vite, Tailwind CSS, react-leaflet (map), Recharts (charts).

## Setup (once scaffolded with Vite)

```bash
cd frontend
npm install
cp ../.env.example ../.env   # sets VITE_API_BASE_URL
npm run dev
```

## Ownership

- Digital twin map + corridor risk dashboard — **khadija1407**
- Scenario/procurement/SPR panels, demo script, deck — **PradnyaN21**

See root `CLAUDE.md` for the full ownership table and commit conventions.

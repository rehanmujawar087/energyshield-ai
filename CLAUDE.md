# CLAUDE.md — EnergyShield AI

Rules for any Claude Code session (or human) working in this repo during IEEE SYNAPSE 2026. Read this before making changes.

## Hard rules (hackathon-critical, no exceptions)

1. **Never force-push.** No `git push --force` / `--force-with-lease`, no `git reset --hard` on pushed history, no rebasing or amending commits that are already on `origin/main`. History manipulation is a disqualifier.
2. **Never alter commit or author timestamps.** No `--date`, no `GIT_AUTHOR_DATE`/`GIT_COMMITTER_DATE` overrides, no backdating.
3. **Always `git pull --rebase origin main` before pushing.** Only rebase your own *local, unpushed* commits this way — never rebase commits already visible on `origin/main`.
4. **Commit often, in small, descriptive commits.** Judges audit history; one giant end-of-day commit looks like plagiarism or a pre-built project. Use the convention below.
5. **Never commit secrets.** `.env` is gitignored. Only `.env.example` (no real keys/values) is committed. If a key is ever pasted into a file by mistake, remove it and rotate the key — don't just delete the line in a new commit.
6. **No fake claims.** README "Status" section and any progress claims must reflect what is actually built and runnable, not what is planned. When in doubt, say "in progress."
7. **Numbers come from deterministic code, not the LLM.** `llm.py` is only used for event extraction (Risk Intelligence Agent) and memo drafting (Procurement Optimiser). Scores, supply gaps, costs, and SPR days-of-cover are always computed by plain Python logic that a judge can read and verify.
8. **Label simulated/approximate data.** Any simulated data (vessel tracks, etc.) must say "SIMULATED" in the UI and in `data/README.md`. Seed numbers that are approximations must note their source/basis in `data/README.md` or `data/assumptions.json`.
9. **Keep code simple, boring, and commented.** We must be able to explain every piece of architecture and code to judges. Prefer a clear 20-line function over a clever 5-line one.

## Commit message convention

Prefix every commit with one of:
- `feat:` — new functionality
- `fix:` — bug fix
- `docs:` — README/CLAUDE.md/docs changes
- `chore:` — scaffolding, config, dependency/tooling changes
- `data:` — seed data, assumptions, data docs

Example: `feat: add disruption score endpoint with mock evidence list`

## Repo structure

```
energyshield-ai/
├── README.md              # project overview, architecture, demo flow, status
├── CLAUDE.md              # this file
├── .env.example           # env var template (never commit real .env)
├── .gitignore
├── docs/
│   └── API.md             # endpoint contracts + example JSON
├── data/
│   ├── README.md          # seed data sources/assumptions
│   ├── suppliers.json
│   ├── corridors.json
│   ├── ports.json
│   ├── refineries.json
│   ├── spr_sites.json
│   └── assumptions.json
├── backend/
│   ├── README.md
│   ├── requirements.txt
│   ├── app/
│   │   ├── main.py        # FastAPI app entrypoint
│   │   ├── llm.py         # single LLM interface (Groq/Gemini), cached, with fallback
│   │   ├── agents/        # Risk Intelligence Agent
│   │   ├── models/        # Pydantic schemas
│   │   └── routers/       # FastAPI routers per module
│   └── .cache/            # gitignored LLM response cache
└── frontend/
    ├── README.md
    ├── package.json
    └── src/                # React + Vite + Tailwind + react-leaflet + Recharts
```

## Stack

- **Backend:** Python 3.11+, FastAPI, Pydantic, pandas, SciPy/PuLP, NetworkX, Uvicorn.
- **LLM:** Groq (llama-3.3-70b) via `backend/app/llm.py`, Gemini as an env-var-swappable alternative. JSON-only outputs, cached in `.cache/`, deterministic fallback if the API is unavailable.
- **Frontend:** React + Vite + Tailwind CSS, react-leaflet, Recharts.
- **Data:** no database — JSON/CSV seed files under `/data`.

## Ownership table

| Owner | Scope |
|-------|-------|
| rehanmujawar087 | Backend core (`backend/app/main.py`), Risk Intelligence Agent (`backend/app/agents/`), Pipeline Runner, `llm.py` |
| sagar3468patil-hash | Scenario Modeller, Procurement Optimiser, SPR Optimiser (their routers/models under `backend/app/`) |
| khadija1407 | Frontend digital twin map + corridor risk dashboard (`frontend/src/`) |
| PradnyaN21 | Frontend scenario/procurement/SPR panels, README upkeep, demo script, deck |

**Working agreement:** work within your own module's files to avoid merge conflicts. If you need to touch a file outside your area, say so in the commit message and keep the change small. Always `git pull --rebase origin main` immediately before `git push`. Never force-push.

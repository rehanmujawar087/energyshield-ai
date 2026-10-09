# EnergyShield AI — Backend

FastAPI service implementing the Risk Intelligence Agent, Scenario Modeller, Procurement Optimiser, SPR Optimiser, and the pipeline runner that chains them together.

## Status

Only `GET /api/health` exists right now — verified running locally, returns `{"status": "ok", ...}`. Module routers (risk, scenario, procurement, SPR, pipeline) are not implemented yet. See the repo root `README.md` → "Status" for the honest current state.

## Structure

```
backend/
├── requirements.txt
├── .cache/            # gitignored — cached LLM responses (not used yet)
└── app/
    ├── main.py        # FastAPI app entrypoint — GET /api/health only, so far
    ├── llm.py         # Groq/Gemini LLM interface, cached, with deterministic fallback (TODO)
    ├── agents/         # Risk Intelligence Agent — rehanmujawar087 (TODO)
    ├── models/         # Pydantic schemas shared across routers (TODO)
    └── routers/        # FastAPI routers: risk, scenario, procurement, spr, pipeline (TODO)
```

## Setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate    # macOS/Linux
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
# curl http://127.0.0.1:8000/api/health
```

## Ownership

- Backend core, Risk Intelligence Agent, Pipeline Runner, `llm.py` — **rehanmujawar087**
- Scenario Modeller, Procurement Optimiser, SPR Optimiser — **sagar3468patil-hash**

See root `CLAUDE.md` for the full ownership table and commit conventions.

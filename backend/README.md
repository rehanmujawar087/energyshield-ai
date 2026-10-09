# EnergyShield AI — Backend

FastAPI service implementing the Risk Intelligence Agent, Scenario Modeller, Procurement Optimiser, SPR Optimiser, and the pipeline runner that chains them together.

## Status

Scaffold only — endpoints are not implemented yet. See the repo root `README.md` → "Status" for the honest current state, and `docs/API.md` (once published) for the planned endpoint contracts.

## Structure

```
backend/
├── requirements.txt
├── .cache/            # gitignored — cached LLM responses
└── app/
    ├── main.py        # FastAPI app entrypoint (TODO)
    ├── llm.py         # Groq/Gemini LLM interface, cached, with deterministic fallback (TODO)
    ├── agents/         # Risk Intelligence Agent — rehanmujawar087
    ├── models/         # Pydantic schemas shared across routers
    └── routers/        # FastAPI routers: risk, scenario, procurement, spr, pipeline
```

## Setup (once `main.py` exists)

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate    # macOS/Linux
pip install -r requirements.txt
cp ../.env.example ../.env    # fill in GROQ_API_KEY etc.
uvicorn app.main:app --reload --port 8000
```

## Ownership

- Backend core, Risk Intelligence Agent, Pipeline Runner, `llm.py` — **rehanmujawar087**
- Scenario Modeller, Procurement Optimiser, SPR Optimiser — **sagar3468patil-hash**

See root `CLAUDE.md` for the full ownership table and commit conventions.

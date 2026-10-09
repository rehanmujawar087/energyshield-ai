"""EnergyShield AI — FastAPI entrypoint.

Wires up the health check plus the module routers. See each router's own
docstring for whether it's live, mock, or partial — see docs/API.md for
the full contract and README.md -> Status for the honest current state.
"""

from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Load the repo-root .env (GROQ_API_KEY etc.) before any router that reads
# os.environ at import/call time (app/llm.py) runs.
load_dotenv(Path(__file__).resolve().parents[2] / ".env")

from app.routers import assumptions, map_layers, pipeline, procurement, risk, scenario, spr  # noqa: E402

app = FastAPI(title="EnergyShield AI API", version="0.1.0")

# Allow the local Vite dev server to call this API during development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(risk.router)
app.include_router(map_layers.router)
app.include_router(assumptions.router)
app.include_router(scenario.router)
app.include_router(procurement.router)
app.include_router(spr.router)
app.include_router(pipeline.router)


@app.get("/api/health")
def health() -> dict:
    """Basic liveness check used to verify the backend is up and running."""
    return {"status": "ok", "service": "energyshield-ai-backend"}

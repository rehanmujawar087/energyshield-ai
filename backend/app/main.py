"""EnergyShield AI — FastAPI entrypoint.

Minimal scaffold for Round 1: exposes a single health-check endpoint so the
team can confirm the backend starts and is reachable. Module routers
(risk, scenario, procurement, SPR, pipeline) are added in later commits.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="EnergyShield AI API", version="0.1.0")

# Allow the local Vite dev server to call this API during development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health() -> dict:
    """Basic liveness check used to verify the backend is up and running."""
    return {"status": "ok", "service": "energyshield-ai-backend"}

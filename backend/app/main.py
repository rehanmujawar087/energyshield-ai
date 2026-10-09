"""EnergyShield AI — FastAPI entrypoint.

Wires up the health check plus the mock routers for all six modules. Every
endpoint here returns MOCK data (see docs/API.md) — real module logic is
added in later commits without changing these response shapes unless the
doc is updated first.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import assumptions, map_layers, pipeline, procurement, risk, scenario, spr

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

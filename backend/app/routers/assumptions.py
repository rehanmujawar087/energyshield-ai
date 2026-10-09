"""Scenario assumptions — backed by the shared in-memory store.

GET /api/assumptions — list every assumption behind the Scenario Modeller.
PUT /api/assumptions — update one or more assumptions (in-memory only).

LIVE: loaded from data/assumptions.json at startup. PUT here actually
changes what scenario.py, spr.py, and risk.py compute with — see
app/assumptions_store.py. Resets on backend restart (no database).
"""

from fastapi import APIRouter

from app import assumptions_store
from app.models.schemas import AssumptionsResponse, UpdateAssumptionsRequest

router = APIRouter(prefix="/api/assumptions", tags=["assumptions"])


@router.get("", response_model=AssumptionsResponse)
def get_assumptions() -> AssumptionsResponse:
    return AssumptionsResponse(assumptions=assumptions_store.all_assumptions())


@router.put("", response_model=AssumptionsResponse)
def update_assumptions(body: UpdateAssumptionsRequest) -> AssumptionsResponse:
    return AssumptionsResponse(assumptions=assumptions_store.update(body.updates))

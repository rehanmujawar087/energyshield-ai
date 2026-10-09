"""Scenario assumptions — mock endpoints.

GET /api/assumptions — list every assumption behind the Scenario Modeller.
PUT /api/assumptions — update one or more assumptions (in-memory only).

MOCK ONLY. Starting values below are placeholders with source notes; they
are not yet loaded from data/assumptions.json (that file is a separate,
independent seed-data deliverable — wiring it in is real-logic work for
a later commit). In-memory state resets on backend restart.
"""

from fastapi import APIRouter

from app.models.schemas import Assumption, AssumptionsResponse, UpdateAssumptionsRequest

router = APIRouter(prefix="/api/assumptions", tags=["assumptions"])

_state: dict[str, Assumption] = {
    a.key: a
    for a in [
        Assumption(
            key="india_crude_demand_bpd",
            value=5300000,
            unit="barrels_per_day",
            source_note="Approximate India crude consumption, public industry estimates (see data/README.md)",
        ),
        Assumption(
            key="india_import_share_pct",
            value=88,
            unit="percent",
            source_note="Commonly cited figure for India's crude import dependence (approximate, see data/README.md)",
        ),
        Assumption(
            key="hormuz_import_share_pct",
            value=42.5,
            unit="percent",
            source_note="Midpoint of commonly cited 40-45% figure for Hormuz-transiting imports",
        ),
        Assumption(
            key="spr_total_days_cover",
            value=9.5,
            unit="days",
            source_note="Commonly cited ISPRL strategic reserve figure (approximate, see data/README.md)",
        ),
        Assumption(
            key="gdp_impact_per_10usd_oil_pct",
            value=-0.3,
            unit="percent_gdp",
            source_note="Rough rule-of-thumb used in public commentary for a sustained $10/bbl rise; not a calibrated model",
        ),
    ]
}


@router.get("", response_model=AssumptionsResponse)
def get_assumptions() -> AssumptionsResponse:
    return AssumptionsResponse(assumptions=list(_state.values()))


@router.put("", response_model=AssumptionsResponse)
def update_assumptions(body: UpdateAssumptionsRequest) -> AssumptionsResponse:
    for updated in body.updates:
        _state[updated.key] = updated
    return AssumptionsResponse(assumptions=list(_state.values()))

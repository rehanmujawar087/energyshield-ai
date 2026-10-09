"""Scenario Modeller — mock endpoint.

POST /api/scenario/run — supply gap, refinery impact, price impact, SPR
days of cover, and a rough GDP effect for a given closure scenario.

MOCK ONLY. Numbers below come from simple placeholder arithmetic sized to
look realistic, not the real deterministic model (owned by
sagar3468patil-hash). The response shape matches docs/API.md so the
frontend and the Procurement Optimiser can build against it now.
"""

import itertools

from fastapi import APIRouter

from app.models.schemas import ScenarioRequest, ScenarioResult

router = APIRouter(prefix="/api/scenario", tags=["scenario"])

_scenario_ids = (f"scn_mock_{i:04d}" for i in itertools.count(1))

# Baseline assumptions used by this mock calculation (mirrors assumptions.py).
_BASELINE_DEMAND_BPD = 5_300_000
_BASELINE_SPR_DAYS = 9.5


@router.post("/run", response_model=ScenarioResult)
def run_scenario(body: ScenarioRequest) -> ScenarioResult:
    closure_fraction = max(0.0, min(body.closure_pct, 100.0)) / 100.0

    # Mock placeholder formulas — NOT the real scenario model.
    supply_gap_bpd = round(_BASELINE_DEMAND_BPD * 0.425 * closure_fraction)  # 42.5% assumed Hormuz share
    refinery_runrate_drop_pct = round(closure_fraction * 25.0, 1)
    fuel_price_impact_pct = round(closure_fraction * 16.0, 1)
    days_consumed = round(closure_fraction * (body.duration_days / 30.0) * 3.3, 1)
    spr_days_of_cover = max(0.0, round(_BASELINE_SPR_DAYS - days_consumed, 1))
    gdp_impact_pct = round(-(fuel_price_impact_pct / 10.0) * 0.3, 2)

    return ScenarioResult(
        scenario_id=next(_scenario_ids),
        supply_gap_bpd=supply_gap_bpd,
        refinery_runrate_drop_pct=refinery_runrate_drop_pct,
        fuel_price_impact_pct=fuel_price_impact_pct,
        spr_days_of_cover=spr_days_of_cover,
        gdp_impact_pct=gdp_impact_pct,
        assumptions_used=["india_crude_demand_bpd", "hormuz_import_share_pct", "spr_total_days_cover"],
    )

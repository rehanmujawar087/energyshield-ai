"""SPR Optimiser.

POST /api/spr/plan — drawdown schedule bridging a supply gap until the
first alternate cargo arrives.

LIVE assumptions: spr_total_days_cover and india_crude_demand_bpd come
from app/assumptions_store.py (PUT /api/assumptions changes these runs
too, same as scenario.py). Linear drawdown model: the SPR depletes by
the supply gap each day, converted back to "days of normal demand"
terms — a simple, explainable approximation, not a real reserve
management optimiser (no multi-site logistics, injection limits, etc.).
"""

from fastapi import APIRouter

from app import assumptions_store
from app.models.schemas import ApiMeta, SprDrawdownPoint, SprPlanRequest, SprPlanResponse

router = APIRouter(prefix="/api/spr", tags=["spr"])


@router.post("/plan", response_model=SprPlanResponse)
def plan(body: SprPlanRequest) -> SprPlanResponse:
    starting_days_of_cover = assumptions_store.get_value("spr_total_days_cover", 9.5)
    demand_bpd = assumptions_store.get_value("india_crude_demand_bpd", 5_300_000)

    daily_drawdown_fraction = (body.supply_gap_bpd / demand_bpd) if demand_bpd else 0.0

    schedule: list[SprDrawdownPoint] = []
    step = max(1, body.bridge_days // 3)
    for day in range(0, body.bridge_days + 1, step):
        remaining = max(0.0, round(starting_days_of_cover - daily_drawdown_fraction * day, 1))
        schedule.append(
            SprDrawdownPoint(day=day, days_of_cover_remaining=remaining, drawdown_bpd=body.supply_gap_bpd)
        )

    return SprPlanResponse(
        schedule=schedule,
        starting_days_of_cover=starting_days_of_cover,
        ending_days_of_cover=schedule[-1].days_of_cover_remaining if schedule else starting_days_of_cover,
        meta=ApiMeta(source="model"),
    )

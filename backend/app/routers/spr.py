"""SPR Optimiser — mock endpoint.

POST /api/spr/plan — drawdown schedule bridging a supply gap until the
first alternate cargo arrives.

MOCK ONLY. Linear drawdown placeholder, not the real optimiser (owned by
sagar3468patil-hash).
"""

from fastapi import APIRouter

from app.models.schemas import SprDrawdownPoint, SprPlanRequest, SprPlanResponse

router = APIRouter(prefix="/api/spr", tags=["spr"])

_STARTING_DAYS_OF_COVER = 9.5
_BASELINE_DEMAND_BPD = 5_300_000


@router.post("/plan", response_model=SprPlanResponse)
def plan(body: SprPlanRequest) -> SprPlanResponse:
    daily_drawdown_fraction = (body.supply_gap_bpd / _BASELINE_DEMAND_BPD) if _BASELINE_DEMAND_BPD else 0.0

    schedule: list[SprDrawdownPoint] = []
    step = max(1, body.bridge_days // 3)
    for day in range(0, body.bridge_days + 1, step):
        remaining = max(0.0, round(_STARTING_DAYS_OF_COVER - daily_drawdown_fraction * day, 1))
        schedule.append(
            SprDrawdownPoint(day=day, days_of_cover_remaining=remaining, drawdown_bpd=body.supply_gap_bpd)
        )

    return SprPlanResponse(
        schedule=schedule,
        starting_days_of_cover=_STARTING_DAYS_OF_COVER,
        ending_days_of_cover=schedule[-1].days_of_cover_remaining if schedule else _STARTING_DAYS_OF_COVER,
    )

"""Procurement Optimiser — mock endpoint.

POST /api/procurement/optimise — ranked sourcing options for a supply gap.

MOCK ONLY. Returns a fixed, illustrative supplier list shaped exactly like
the real LP optimiser's output will be (owned by sagar3468patil-hash).
Volumes are split proportionally to the fixed mock shares below, not solved
for minimum cost.
"""

from fastapi import APIRouter

from app.models.schemas import ProcurementOption, ProcurementRequest, ProcurementResponse

router = APIRouter(prefix="/api/procurement", tags=["procurement"])

# Mock supplier book: (id, name, corridor, share_of_gap, cost_usd_per_bbl, transit_days)
_MOCK_SUPPLIERS = [
    ("sup_uae", "UAE (Fujairah bypass)", "hormuz", 0.42, 84.50, 6),
    ("sup_us_gulf", "US Gulf Coast", "cape_route", 0.32, 89.00, 21),
    ("sup_nigeria", "Nigeria (Bonny Light)", "cape_route", 0.26, 90.25, 18),
]


@router.post("/optimise", response_model=ProcurementResponse)
def optimise(body: ProcurementRequest) -> ProcurementResponse:
    options = [
        ProcurementOption(
            supplier_id=sid,
            supplier_name=name,
            route_corridor=corridor,
            volume_bpd=round(body.supply_gap_bpd * share),
            landed_cost_usd_per_bbl=cost,
            transit_days=transit,
            rank=rank,
        )
        for rank, (sid, name, corridor, share, cost, transit) in enumerate(_MOCK_SUPPLIERS, start=1)
    ]

    top = options[0]
    memo = (
        f"MOCK MEMO: Based on a supply gap of {body.supply_gap_bpd:,.0f} bpd, "
        f"the top-ranked option is {top.supplier_name} via {top.route_corridor} "
        f"at ${top.landed_cost_usd_per_bbl:.2f}/bbl landed, arriving in {top.transit_days:.0f} days."
    )

    return ProcurementResponse(scenario_id=body.scenario_id, options=options, memo=memo)

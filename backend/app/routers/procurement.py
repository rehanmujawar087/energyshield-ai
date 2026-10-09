"""Procurement Optimiser.

POST /api/procurement/optimise — ranked sourcing options for a supply gap.

Minimum-cost allocation under capacity and route-availability constraints,
loaded from data/suppliers.json (illustrative supplier book — see
data/README.md). Solved by cost-ascending greedy fill rather than calling
an LP library: for this constraint shape — one total-volume target, each
supplier bounded only by its own capacity, linear cost — greedy-by-unit-
cost IS the optimal vertex of the linear program (any exchange of volume
from a cheaper, non-exhausted supplier to a pricier one can only raise
total cost), so it reaches the same answer scipy.optimize.linprog would,
without the dependency. If a disrupted_corridor + closure_pct is passed
through from the scenario (see ProcurementRequest), suppliers routed
through that corridor have their usable capacity cut proportionally
before allocation — a real route-availability constraint, not cosmetic.
"""

import json
from pathlib import Path

from fastapi import APIRouter

from app.models.schemas import ApiMeta, ProcurementOption, ProcurementRequest, ProcurementResponse

router = APIRouter(prefix="/api/procurement", tags=["procurement"])

_DATA_FILE = Path(__file__).resolve().parents[3] / "data" / "suppliers.json"


def _load_suppliers() -> list[dict]:
    try:
        return json.loads(_DATA_FILE.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return []


@router.post("/optimise", response_model=ProcurementResponse)
def optimise(body: ProcurementRequest) -> ProcurementResponse:
    suppliers = _load_suppliers()

    # Route-availability constraint: a closure on the supplier's own
    # corridor reduces how much of its nameplate capacity is actually
    # reachable this run.
    available = []
    for s in suppliers:
        capacity = s["capacity_bpd"]
        if body.disrupted_corridor and s["route_corridor"] == body.disrupted_corridor:
            capacity *= max(0.0, 1.0 - body.closure_pct / 100.0)
        if capacity > 0:
            available.append({**s, "usable_capacity_bpd": capacity})

    # Greedy fill, cheapest landed cost first — optimal for this LP shape, see module docstring.
    available.sort(key=lambda s: s["price_usd_per_bbl"])

    remaining = body.supply_gap_bpd
    options: list[ProcurementOption] = []
    for rank, s in enumerate(available, start=1):
        if remaining <= 0:
            break
        volume = min(s["usable_capacity_bpd"], remaining)
        if volume <= 0:
            continue
        options.append(
            ProcurementOption(
                supplier_id=s["id"],
                supplier_name=s["name"],
                route_corridor=s["route_corridor"],
                volume_bpd=round(volume),
                landed_cost_usd_per_bbl=s["price_usd_per_bbl"],
                transit_days=s["transit_days"],
                rank=rank,
            )
        )
        remaining -= volume

    shortfall_bpd = max(0.0, round(remaining))
    total_allocated = body.supply_gap_bpd - remaining

    if not options:
        memo = "No procurement options available — no supplier data loaded, or all capacity disrupted."
    else:
        top = options[0]
        weighted_cost = (
            sum(o.volume_bpd * o.landed_cost_usd_per_bbl for o in options) / total_allocated
            if total_allocated > 0
            else 0.0
        )
        route_note = (
            f" {body.disrupted_corridor} capacity reduced {body.closure_pct:.0f}% by the active scenario."
            if body.disrupted_corridor
            else ""
        )
        shortfall_note = (
            f" {shortfall_bpd:,.0f} bpd of the {body.supply_gap_bpd:,.0f} bpd gap is UNMET by available supplier capacity."
            if shortfall_bpd > 0
            else f" The full {body.supply_gap_bpd:,.0f} bpd gap is covered."
        )
        memo = (
            f"Cheapest-first allocation across {len(options)} supplier(s): top option is {top.supplier_name} "
            f"via {top.route_corridor} at ${top.landed_cost_usd_per_bbl:.2f}/bbl landed, {top.transit_days:.0f}d transit. "
            f"Volume-weighted average cost ${weighted_cost:.2f}/bbl.{shortfall_note}{route_note}"
        )

    return ProcurementResponse(
        scenario_id=body.scenario_id,
        options=options,
        shortfall_bpd=shortfall_bpd,
        memo=memo,
        meta=ApiMeta(source="model"),
    )

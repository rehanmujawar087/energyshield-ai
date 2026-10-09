"""Pipeline Runner — mock endpoint.

POST /api/pipeline/run — chains signal -> risk -> scenario -> procurement
-> SPR in one call, timing each stage and building an audit log.

MOCK ONLY. Calls the same mock functions the individual routers expose, so
the signal-to-recommendation latency metric is demonstrable even before
real module logic lands.
"""

import time
from datetime import datetime, timezone

from fastapi import APIRouter

from app.models.schemas import (
    AuditLogEntry,
    InjectHeadlineRequest,
    PipelineRequest,
    PipelineResponse,
    ProcurementRequest,
    SprPlanRequest,
    StageTiming,
)
from app.routers.procurement import optimise as run_procurement
from app.routers.risk import inject_headline as run_inject_headline
from app.routers.scenario import run_scenario
from app.routers.spr import plan as run_spr_plan

router = APIRouter(prefix="/api/pipeline", tags=["pipeline"])


def _timed(stage_name, fn, *args):
    start = time.perf_counter()
    result = fn(*args)
    duration_ms = round((time.perf_counter() - start) * 1000, 2)
    return result, StageTiming(stage=stage_name, duration_ms=duration_ms)


@router.post("/run", response_model=PipelineResponse)
def run_pipeline(body: PipelineRequest) -> PipelineResponse:
    timings: list[StageTiming] = []
    audit_log: list[AuditLogEntry] = []
    now = lambda: datetime.now(timezone.utc)

    risk_result = None
    if body.headline:
        risk_result, timing = _timed(
            "risk", run_inject_headline, InjectHeadlineRequest(headline=body.headline, corridor=body.scenario.corridor)
        )
        timings.append(timing)
        audit_log.append(
            AuditLogEntry(
                stage="risk",
                detail=f"Injected headline, corridor {risk_result.updated_corridor.corridor} score now {risk_result.updated_corridor.score}",
                timestamp=now(),
            )
        )

    scenario_result, timing = _timed("scenario", run_scenario, body.scenario)
    timings.append(timing)
    audit_log.append(
        AuditLogEntry(
            stage="scenario",
            detail=f"Ran scenario {scenario_result.scenario_id}, supply gap {scenario_result.supply_gap_bpd:,.0f} bpd",
            timestamp=now(),
        )
    )

    procurement_result, timing = _timed(
        "procurement",
        run_procurement,
        ProcurementRequest(
            scenario_id=scenario_result.scenario_id,
            supply_gap_bpd=scenario_result.supply_gap_bpd,
            disrupted_corridor=body.scenario.corridor,
            closure_pct=body.scenario.closure_pct,
        ),
    )
    timings.append(timing)
    audit_log.append(
        AuditLogEntry(
            stage="procurement",
            detail=f"Ranked {len(procurement_result.options)} mock supplier options",
            timestamp=now(),
        )
    )

    bridge_days = int(procurement_result.options[0].transit_days) if procurement_result.options else body.scenario.duration_days
    spr_result, timing = _timed(
        "spr", run_spr_plan, SprPlanRequest(supply_gap_bpd=scenario_result.supply_gap_bpd, bridge_days=bridge_days)
    )
    timings.append(timing)
    audit_log.append(
        AuditLogEntry(stage="spr", detail=f"Computed {bridge_days}-day bridge drawdown schedule", timestamp=now())
    )

    return PipelineResponse(
        risk=risk_result,
        scenario=scenario_result,
        procurement=procurement_result,
        spr=spr_result,
        timings=timings,
        total_duration_ms=round(sum(t.duration_ms for t in timings), 2),
        audit_log=audit_log,
    )

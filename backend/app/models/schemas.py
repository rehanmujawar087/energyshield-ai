"""Shared Pydantic schemas for the EnergyShield AI API.

These mirror docs/API.md exactly. Routers import from here so the frontend
and the real module implementations (added later) share one typed contract.
Keep this file and docs/API.md in sync — update the doc first, then this.
"""

from datetime import datetime, timezone
from typing import Literal, Optional

from pydantic import BaseModel, Field

CorridorId = Literal["hormuz", "bab_el_mandeb", "suez", "malacca", "cape_route"]


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class ApiMeta(BaseModel):
    source: Literal["mock", "model"] = "mock"
    generated_at: datetime = Field(default_factory=utcnow)


class LatLon(BaseModel):
    lat: float
    lon: float


class Evidence(BaseModel):
    headline: str
    source_url: Optional[str] = None
    timestamp: datetime
    event_type: str
    severity: int
    corridor: CorridorId


# --- 1 & 2: Risk Intelligence Agent -----------------------------------------

class RiskBreakdown(BaseModel):
    news_severity: float
    price_volatility: float
    vessel_anomaly: float
    weights: dict[str, float]


class CorridorRisk(BaseModel):
    corridor: CorridorId
    name: str
    score: float
    breakdown: RiskBreakdown
    evidence: list[Evidence]
    updated_at: datetime


class RiskCorridorsResponse(BaseModel):
    corridors: list[CorridorRisk]
    meta: ApiMeta = Field(default_factory=ApiMeta)


class InjectHeadlineRequest(BaseModel):
    headline: str
    source_url: Optional[str] = None
    corridor: Optional[CorridorId] = None


class InjectHeadlineResponse(BaseModel):
    extracted_event: Evidence
    updated_corridor: CorridorRisk
    meta: ApiMeta = Field(default_factory=ApiMeta)


# --- 3: Digital Twin map layers ----------------------------------------------

class Corridor(BaseModel):
    id: CorridorId
    name: str
    waypoints: list[LatLon]
    risk_score: float


class Port(BaseModel):
    id: str
    name: str
    lat: float
    lon: float
    type: str


class Refinery(BaseModel):
    id: str
    name: str
    lat: float
    lon: float
    capacity_bpd_approx: int


class SprSite(BaseModel):
    id: str
    name: str
    lat: float
    lon: float
    capacity_mmt_approx: float


class Vessel(BaseModel):
    id: str
    name: str
    lat: float
    lon: float
    corridor: CorridorId
    simulated: Literal[True] = True


class MapLayersResponse(BaseModel):
    corridors: list[Corridor]
    ports: list[Port]
    refineries: list[Refinery]
    spr_sites: list[SprSite]
    vessels: list[Vessel]
    meta: ApiMeta = Field(default_factory=ApiMeta)


# --- 4: Assumptions -----------------------------------------------------------

class Assumption(BaseModel):
    key: str
    value: float
    unit: str
    source_note: str


class AssumptionsResponse(BaseModel):
    assumptions: list[Assumption]
    meta: ApiMeta = Field(default_factory=ApiMeta)


class UpdateAssumptionsRequest(BaseModel):
    updates: list[Assumption]


# --- 5: Scenario Modeller ------------------------------------------------------

class ScenarioRequest(BaseModel):
    preset: Optional[Literal["hormuz_partial_closure", "red_sea_suspension", "opec_cut"]] = None
    corridor: Optional[CorridorId] = None
    closure_pct: float = 0.0
    duration_days: int = 30
    demand_elasticity: float = 0.05


class ScenarioResult(BaseModel):
    scenario_id: str
    supply_gap_bpd: float
    refinery_runrate_drop_pct: float
    fuel_price_impact_pct: float
    spr_days_of_cover: float
    gdp_impact_pct: float
    assumptions_used: list[str]
    meta: ApiMeta = Field(default_factory=ApiMeta)


# --- 6: Procurement Optimiser --------------------------------------------------

class ProcurementRequest(BaseModel):
    scenario_id: str
    supply_gap_bpd: float


class ProcurementOption(BaseModel):
    supplier_id: str
    supplier_name: str
    route_corridor: CorridorId
    volume_bpd: float
    landed_cost_usd_per_bbl: float
    transit_days: float
    rank: int


class ProcurementResponse(BaseModel):
    scenario_id: str
    options: list[ProcurementOption]
    memo: str
    meta: ApiMeta = Field(default_factory=ApiMeta)


# --- 7: SPR Optimiser ----------------------------------------------------------

class SprDrawdownPoint(BaseModel):
    day: int
    days_of_cover_remaining: float
    drawdown_bpd: float


class SprPlanRequest(BaseModel):
    supply_gap_bpd: float
    bridge_days: int


class SprPlanResponse(BaseModel):
    schedule: list[SprDrawdownPoint]
    starting_days_of_cover: float
    ending_days_of_cover: float
    meta: ApiMeta = Field(default_factory=ApiMeta)


# --- 8: Pipeline Runner ---------------------------------------------------------

class PipelineRequest(BaseModel):
    headline: Optional[str] = None
    scenario: ScenarioRequest


class StageTiming(BaseModel):
    stage: Literal["risk", "scenario", "procurement", "spr"]
    duration_ms: float


class AuditLogEntry(BaseModel):
    stage: str
    detail: str
    timestamp: datetime


class PipelineResponse(BaseModel):
    risk: Optional[InjectHeadlineResponse] = None
    scenario: ScenarioResult
    procurement: ProcurementResponse
    spr: SprPlanResponse
    timings: list[StageTiming]
    total_duration_ms: float
    audit_log: list[AuditLogEntry]
    meta: ApiMeta = Field(default_factory=ApiMeta)

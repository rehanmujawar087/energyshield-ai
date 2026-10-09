# EnergyShield AI — API Contract

Status: **all endpoints below return mock data only** (every response includes `"source": "mock"`). This document is the contract teammates build the frontend and the real module logic against. Real logic replaces the mock generators in later commits without changing these shapes unless this doc is updated first.

State note: there is no database. Where an endpoint appears to "store" something (e.g. injected headlines, assumption edits), it is held in an in-memory Python dict on the running backend process and **resets on restart**. This is fine for a demo; it is not persistence.

Base URL (local dev): `http://127.0.0.1:8000`

All responses are JSON. All endpoints are under `/api`.

---

## Shared schemas

```python
from pydantic import BaseModel
from typing import Literal, Optional
from datetime import datetime

CorridorId = Literal["hormuz", "bab_el_mandeb", "suez", "malacca", "cape_route"]

class LatLon(BaseModel):
    lat: float
    lon: float

class Evidence(BaseModel):
    headline: str
    source_url: Optional[str] = None
    timestamp: datetime
    event_type: str            # e.g. "tanker_incident", "closure_threat", "price_shock"
    severity: int               # 1-5, extracted/assigned by the Risk Intelligence Agent
    corridor: CorridorId

class ApiMeta(BaseModel):
    source: Literal["mock", "model"] = "mock"   # "mock" until real logic lands
    generated_at: datetime
```

---

## 1. `GET /api/risk/corridors`

Current disruption risk score (0–100) per corridor, with the weighted breakdown and evidence trail behind it.

```python
class RiskBreakdown(BaseModel):
    news_severity: float         # 0-100, weighted
    price_volatility: float      # 0-100, weighted
    vessel_anomaly: float        # 0-100, weighted, SIMULATED input
    weights: dict[str, float]    # e.g. {"news_severity": 0.5, "price_volatility": 0.3, "vessel_anomaly": 0.2}

class CorridorRisk(BaseModel):
    corridor: CorridorId
    name: str
    score: float                 # 0-100, weighted sum of breakdown * weights
    breakdown: RiskBreakdown
    evidence: list[Evidence]
    updated_at: datetime

class RiskCorridorsResponse(BaseModel):
    corridors: list[CorridorRisk]
    meta: ApiMeta
```

Example response:

```json
{
  "corridors": [
    {
      "corridor": "hormuz",
      "name": "Strait of Hormuz",
      "score": 42.5,
      "breakdown": {
        "news_severity": 55.0,
        "price_volatility": 30.0,
        "vessel_anomaly": 35.0,
        "weights": { "news_severity": 0.5, "price_volatility": 0.3, "vessel_anomaly": 0.2 }
      },
      "evidence": [
        {
          "headline": "Tensions rise near Strait of Hormuz after naval incident",
          "source_url": "https://example.com/news/hormuz-incident",
          "timestamp": "2026-10-09T03:12:00Z",
          "event_type": "tanker_incident",
          "severity": 3,
          "corridor": "hormuz"
        }
      ],
      "updated_at": "2026-10-09T04:30:00Z"
    },
    {
      "corridor": "bab_el_mandeb",
      "name": "Bab-el-Mandeb / Red Sea",
      "score": 28.0,
      "breakdown": {
        "news_severity": 20.0,
        "price_volatility": 25.0,
        "vessel_anomaly": 40.0,
        "weights": { "news_severity": 0.5, "price_volatility": 0.3, "vessel_anomaly": 0.2 }
      },
      "evidence": [],
      "updated_at": "2026-10-09T04:30:00Z"
    }
  ],
  "meta": { "source": "mock", "generated_at": "2026-10-09T04:30:05Z" }
}
```

---

## 2. `POST /api/risk/inject-headline`

Manual "inject a headline" demo endpoint. Takes raw headline text, (mock) extracts an event, and bumps the named corridor's score. Stored in-memory only.

```python
class InjectHeadlineRequest(BaseModel):
    headline: str
    source_url: Optional[str] = None
    corridor: Optional[CorridorId] = None   # if omitted, mock picks one via keyword match

class InjectHeadlineResponse(BaseModel):
    extracted_event: Evidence
    updated_corridor: CorridorRisk
    meta: ApiMeta
```

Example request:

```json
{
  "headline": "Tanker seized near Strait of Hormuz, shipping insurers raise premiums",
  "source_url": "https://example.com/news/tanker-seized"
}
```

Example response:

```json
{
  "extracted_event": {
    "headline": "Tanker seized near Strait of Hormuz, shipping insurers raise premiums",
    "source_url": "https://example.com/news/tanker-seized",
    "timestamp": "2026-10-09T04:35:00Z",
    "event_type": "tanker_incident",
    "severity": 4,
    "corridor": "hormuz"
  },
  "updated_corridor": {
    "corridor": "hormuz",
    "name": "Strait of Hormuz",
    "score": 58.0,
    "breakdown": {
      "news_severity": 75.0,
      "price_volatility": 30.0,
      "vessel_anomaly": 35.0,
      "weights": { "news_severity": 0.5, "price_volatility": 0.3, "vessel_anomaly": 0.2 }
    },
    "evidence": [
      {
        "headline": "Tanker seized near Strait of Hormuz, shipping insurers raise premiums",
        "source_url": "https://example.com/news/tanker-seized",
        "timestamp": "2026-10-09T04:35:00Z",
        "event_type": "tanker_incident",
        "severity": 4,
        "corridor": "hormuz"
      }
    ],
    "updated_at": "2026-10-09T04:35:00Z"
  },
  "meta": { "source": "mock", "generated_at": "2026-10-09T04:35:00Z" }
}
```

---

## 3. `GET /api/map/layers`

Everything the digital twin map needs in one call: corridors (with waypoints), ports, refineries, SPR sites, and simulated vessels.

```python
class Corridor(BaseModel):
    id: CorridorId
    name: str
    waypoints: list[LatLon]      # APPROXIMATE, for display only — see data/README.md
    risk_score: float            # convenience copy of current score, 0-100

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
    simulated: Literal[True] = True   # always true — no real AIS feed

class MapLayersResponse(BaseModel):
    corridors: list[Corridor]
    ports: list[Port]
    refineries: list[Refinery]
    spr_sites: list[SprSite]
    vessels: list[Vessel]
    meta: ApiMeta
```

Example response (truncated to one item per layer):

```json
{
  "corridors": [
    { "id": "hormuz", "name": "Strait of Hormuz", "waypoints": [{ "lat": 26.75, "lon": 55.95 }, { "lat": 25.95, "lon": 56.90 }], "risk_score": 42.5 }
  ],
  "ports": [
    { "id": "jnpt", "name": "Jawaharlal Nehru Port (Nhava Sheva)", "lat": 18.95, "lon": 72.95, "type": "container_and_liquid" }
  ],
  "refineries": [
    { "id": "jamnagar", "name": "Jamnagar Refinery (Reliance)", "lat": 22.34, "lon": 69.90, "capacity_bpd_approx": 1240000 }
  ],
  "spr_sites": [
    { "id": "visakhapatnam", "name": "Visakhapatnam SPR", "lat": 17.70, "lon": 83.30, "capacity_mmt_approx": 1.33 }
  ],
  "vessels": [
    { "id": "v001", "name": "SIMULATED Tanker 1", "lat": 26.40, "lon": 56.30, "corridor": "hormuz", "simulated": true }
  ],
  "meta": { "source": "mock", "generated_at": "2026-10-09T04:40:00Z" }
}
```

---

## 4. `GET /api/assumptions` / `PUT /api/assumptions`

Every assumption backing the Scenario Modeller, exposed so it is auditable and editable from the UI — not hard-coded magic. Backed by `data/assumptions.json` on disk at startup; `PUT` updates the in-memory copy only (does not rewrite the file) and resets on restart.

```python
class Assumption(BaseModel):
    key: str                 # e.g. "india_crude_demand_bpd"
    value: float
    unit: str
    source_note: str         # where the number comes from / how approximate it is

class AssumptionsResponse(BaseModel):
    assumptions: list[Assumption]
    meta: ApiMeta

class UpdateAssumptionsRequest(BaseModel):
    updates: list[Assumption]   # only the keys being changed; value + source_note required
```

Example `GET` response (truncated):

```json
{
  "assumptions": [
    { "key": "india_crude_demand_bpd", "value": 5300000, "unit": "barrels_per_day", "source_note": "Approximate India crude consumption, public industry estimates (see data/README.md)" },
    { "key": "spr_total_days_cover", "value": 9.5, "unit": "days", "source_note": "Commonly cited ISPRL strategic reserve figure (approximate, see data/README.md)" }
  ],
  "meta": { "source": "mock", "generated_at": "2026-10-09T04:45:00Z" }
}
```

Example `PUT` request:

```json
{ "updates": [{ "key": "spr_total_days_cover", "value": 10.0, "unit": "days", "source_note": "Manually overridden for scenario testing" }] }
```

`PUT` response shape is identical to the `GET` response, reflecting the merged, updated list.

---

## 5. `POST /api/scenario/run`

Deterministic scenario modeller. Mock version returns realistic-shaped numbers computed from simple placeholder arithmetic (not the final model) so the frontend and optimiser can build against the shape now.

```python
class ScenarioRequest(BaseModel):
    preset: Optional[Literal["hormuz_partial_closure", "red_sea_suspension", "opec_cut"]] = None
    corridor: Optional[CorridorId] = None
    closure_pct: float = 0.0          # 0-100
    duration_days: int = 30
    demand_elasticity: float = 0.05   # fraction demand response per 10% price move, placeholder

class ScenarioResult(BaseModel):
    scenario_id: str
    supply_gap_bpd: float
    refinery_runrate_drop_pct: float
    fuel_price_impact_pct: float
    spr_days_of_cover: float
    gdp_impact_pct: float             # rough heuristic, see data/assumptions.json
    assumptions_used: list[str]       # keys from /api/assumptions this run read
    meta: ApiMeta
```

Example request:

```json
{ "preset": "hormuz_partial_closure", "corridor": "hormuz", "closure_pct": 50, "duration_days": 30, "demand_elasticity": 0.05 }
```

Example response:

```json
{
  "scenario_id": "scn_mock_0001",
  "supply_gap_bpd": 950000,
  "refinery_runrate_drop_pct": 12.5,
  "fuel_price_impact_pct": 8.0,
  "spr_days_of_cover": 6.2,
  "gdp_impact_pct": -0.3,
  "assumptions_used": ["india_crude_demand_bpd", "spr_total_days_cover"],
  "meta": { "source": "mock", "generated_at": "2026-10-09T04:50:00Z" }
}
```

---

## 6. `POST /api/procurement/optimise`

Mock version of the LP. Returns a ranked list shaped exactly like the real optimiser's output will be, with placeholder numbers.

```python
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
    memo: str                 # LLM-style draft memo, quoting only the numbers above (mock text for now)
    meta: ApiMeta
```

Example request:

```json
{ "scenario_id": "scn_mock_0001", "supply_gap_bpd": 950000 }
```

Example response:

```json
{
  "scenario_id": "scn_mock_0001",
  "options": [
    { "supplier_id": "sup_uae", "supplier_name": "UAE (Fujairah bypass)", "route_corridor": "hormuz", "volume_bpd": 400000, "landed_cost_usd_per_bbl": 84.5, "transit_days": 6, "rank": 1 },
    { "supplier_id": "sup_us_gulf", "supplier_name": "US Gulf Coast", "route_corridor": "cape_route", "volume_bpd": 300000, "landed_cost_usd_per_bbl": 89.0, "transit_days": 21, "rank": 2 },
    { "supplier_id": "sup_nigeria", "supplier_name": "Nigeria (Bonny Light)", "route_corridor": "cape_route", "volume_bpd": 250000, "landed_cost_usd_per_bbl": 90.25, "transit_days": 18, "rank": 3 }
  ],
  "memo": "MOCK MEMO: Based on a supply gap of 950,000 bpd, the top-ranked option is UAE via the Fujairah bypass at $84.50/bbl landed, arriving in 6 days.",
  "meta": { "source": "mock", "generated_at": "2026-10-09T04:55:00Z" }
}
```

---

## 7. `POST /api/spr/plan`

Mock SPR drawdown plan to bridge a supply gap until alternate cargoes arrive.

```python
class SprDrawdownPoint(BaseModel):
    day: int
    days_of_cover_remaining: float
    drawdown_bpd: float

class SprPlanRequest(BaseModel):
    supply_gap_bpd: float
    bridge_days: int            # days until first alternate cargo arrives

class SprPlanResponse(BaseModel):
    schedule: list[SprDrawdownPoint]
    starting_days_of_cover: float
    ending_days_of_cover: float
    meta: ApiMeta
```

Example request:

```json
{ "supply_gap_bpd": 950000, "bridge_days": 6 }
```

Example response:

```json
{
  "schedule": [
    { "day": 0, "days_of_cover_remaining": 9.5, "drawdown_bpd": 950000 },
    { "day": 3, "days_of_cover_remaining": 8.0, "drawdown_bpd": 950000 },
    { "day": 6, "days_of_cover_remaining": 6.2, "drawdown_bpd": 950000 }
  ],
  "starting_days_of_cover": 9.5,
  "ending_days_of_cover": 6.2,
  "meta": { "source": "mock", "generated_at": "2026-10-09T05:00:00Z" }
}
```

---

## 8. `POST /api/pipeline/run`

Chains signal → risk score → scenario → procurement → SPR in one call. Mock version calls the same mock generators as the individual endpoints above and times each stage, so the signal-to-recommendation latency metric is demonstrable even before real logic lands.

```python
class PipelineRequest(BaseModel):
    headline: Optional[str] = None          # if given, runs inject-headline first
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
    meta: ApiMeta
```

Example request:

```json
{
  "headline": "Tanker seized near Strait of Hormuz",
  "scenario": { "preset": "hormuz_partial_closure", "corridor": "hormuz", "closure_pct": 50, "duration_days": 30 }
}
```

Example response (abbreviated — each sub-object matches the shapes above):

```json
{
  "risk": { "...": "see /api/risk/inject-headline response shape" },
  "scenario": { "...": "see /api/scenario/run response shape" },
  "procurement": { "...": "see /api/procurement/optimise response shape" },
  "spr": { "...": "see /api/spr/plan response shape" },
  "timings": [
    { "stage": "risk", "duration_ms": 12.4 },
    { "stage": "scenario", "duration_ms": 3.1 },
    { "stage": "procurement", "duration_ms": 4.8 },
    { "stage": "spr", "duration_ms": 1.2 }
  ],
  "total_duration_ms": 21.5,
  "audit_log": [
    { "stage": "risk", "detail": "Injected headline, corridor hormuz score 42.5 -> 58.0", "timestamp": "2026-10-09T05:05:00Z" },
    { "stage": "scenario", "detail": "Ran preset hormuz_partial_closure, 50% closure, 30 days", "timestamp": "2026-10-09T05:05:00Z" },
    { "stage": "procurement", "detail": "Ranked 3 mock supplier options", "timestamp": "2026-10-09T05:05:00Z" },
    { "stage": "spr", "detail": "Computed 6-day bridge drawdown schedule", "timestamp": "2026-10-09T05:05:00Z" }
  ],
  "meta": { "source": "mock", "generated_at": "2026-10-09T05:05:00Z" }
}
```

---

## Router file layout (backend)

One router file per module so teammates don't conflict on the same file:

```
backend/app/routers/
├── risk.py           # 1, 2 — rehanmujawar087
├── map_layers.py      # 3 — rehanmujawar087 (reads data/*.json)
├── assumptions.py    # 4 — sagar3468patil-hash
├── scenario.py       # 5 — sagar3468patil-hash
├── procurement.py    # 6 — sagar3468patil-hash
├── spr.py            # 7 — sagar3468patil-hash
└── pipeline.py       # 8 — rehanmujawar087 (imports the mock functions from the others)
```

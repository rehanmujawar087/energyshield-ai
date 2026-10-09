"""Risk Intelligence Agent.

GET /api/risk/corridors        — current per-corridor disruption scores
                                  and probabilities.
POST /api/risk/inject-headline — manual demo input; extracts a structured
                                  event via app/llm.py and bumps the
                                  matching corridor's score accordingly.

Event extraction is LIVE (real Groq call) when GROQ_API_KEY is set and
reachable, CACHED when an identical headline was seen before, or
FALLBACK (deterministic keywords, no LLM) otherwise — see
InjectHeadlineResponse.extraction_source. The score and probability are
always a deterministic formula over news/price/vessel inputs (see
app/probability.py) — the LLM only extracts event_type/severity/corridor,
it never sets a score or probability directly. In-memory state, resets
on backend restart.
"""

from datetime import datetime, timezone

from fastapi import APIRouter

from app import llm, probability
from app.models.schemas import (
    CorridorRisk,
    Evidence,
    InjectHeadlineRequest,
    InjectHeadlineResponse,
    ProbabilityDriver,
    RiskBreakdown,
    RiskCorridorsResponse,
)

router = APIRouter(prefix="/api/risk", tags=["risk"])

_WEIGHTS = {"news_severity": 0.5, "price_volatility": 0.3, "vessel_anomaly": 0.2}

_CORRIDOR_NAMES = {
    "hormuz": "Strait of Hormuz",
    "bab_el_mandeb": "Bab-el-Mandeb / Red Sea",
    "suez": "Suez Canal",
    "malacca": "Strait of Malacca",
    "cape_route": "Cape of Good Hope route",
}


def _weighted_score(b: RiskBreakdown) -> float:
    return round(
        b.news_severity * _WEIGHTS["news_severity"]
        + b.price_volatility * _WEIGHTS["price_volatility"]
        + b.vessel_anomaly * _WEIGHTS["vessel_anomaly"],
        1,
    )


def _build_corridor_risk(corridor_id: str, breakdown: RiskBreakdown, evidence: list[Evidence], now: datetime) -> CorridorRisk:
    prob = probability.compute(breakdown.news_severity, breakdown.price_volatility, breakdown.vessel_anomaly, _WEIGHTS)
    return CorridorRisk(
        corridor=corridor_id,
        name=_CORRIDOR_NAMES[corridor_id],
        score=_weighted_score(breakdown),
        breakdown=breakdown,
        evidence=evidence,
        updated_at=now,
        probability_pct=prob["probability_pct"],
        probability_p10=prob["probability_p10"],
        probability_p50=prob["probability_p50"],
        probability_p90=prob["probability_p90"],
        drivers=[ProbabilityDriver(**d) for d in prob["drivers"]],
        method_note=prob["method_note"],
    )


def _seed_state() -> dict[str, CorridorRisk]:
    """Starting risk per corridor. These baseline inputs are illustrative
    (no live news/price/AIS feed behind them yet — see docs/API.md); the
    scoring and probability formulas applied to them are real and
    deterministic — see app/probability.py."""
    seed_breakdowns = {
        "hormuz": RiskBreakdown(news_severity=55.0, price_volatility=30.0, vessel_anomaly=35.0, weights=_WEIGHTS),
        "bab_el_mandeb": RiskBreakdown(news_severity=20.0, price_volatility=25.0, vessel_anomaly=40.0, weights=_WEIGHTS),
        "suez": RiskBreakdown(news_severity=10.0, price_volatility=15.0, vessel_anomaly=10.0, weights=_WEIGHTS),
        "malacca": RiskBreakdown(news_severity=8.0, price_volatility=10.0, vessel_anomaly=15.0, weights=_WEIGHTS),
        "cape_route": RiskBreakdown(news_severity=5.0, price_volatility=10.0, vessel_anomaly=5.0, weights=_WEIGHTS),
    }
    now = datetime.now(timezone.utc)
    return {cid: _build_corridor_risk(cid, b, [], now) for cid, b in seed_breakdowns.items()}


# In-memory state for the demo. Resets on restart — this is not persistence.
_state: dict[str, CorridorRisk] = _seed_state()


@router.get("/corridors", response_model=RiskCorridorsResponse)
def get_corridors() -> RiskCorridorsResponse:
    return RiskCorridorsResponse(corridors=list(_state.values()))


@router.post("/inject-headline", response_model=InjectHeadlineResponse)
def inject_headline(body: InjectHeadlineRequest) -> InjectHeadlineResponse:
    extraction, source = llm.extract_event(body.headline)
    corridor_id = body.corridor or extraction["corridor"]
    if corridor_id not in _state:
        corridor_id = "hormuz"
    now = datetime.now(timezone.utc)

    event = Evidence(
        headline=body.headline,
        source_url=body.source_url,
        timestamp=now,
        event_type=extraction["event_type"],
        severity=extraction["severity"],
        corridor=corridor_id,
    )

    current = _state[corridor_id]
    # Severity (1-5) drives the news_severity bump — a 1-severity mention
    # moves the needle a little, a 5 (e.g. "tanker seized") moves it a lot.
    severity_delta = extraction["severity"] * 15.0
    bumped_breakdown = RiskBreakdown(
        news_severity=min(current.breakdown.news_severity + severity_delta, 100.0),
        price_volatility=current.breakdown.price_volatility,
        vessel_anomaly=current.breakdown.vessel_anomaly,
        weights=_WEIGHTS,
    )
    updated = _build_corridor_risk(corridor_id, bumped_breakdown, [*current.evidence, event], now)
    _state[corridor_id] = updated

    return InjectHeadlineResponse(extracted_event=event, updated_corridor=updated, extraction_source=source)

"""Risk Intelligence Agent.

GET /api/risk/corridors        — current per-corridor disruption scores.
POST /api/risk/inject-headline — manual demo input; extracts a structured
                                  event via app/llm.py and bumps the
                                  matching corridor's score accordingly.

Event extraction is LIVE (real Groq call) when GROQ_API_KEY is set and
reachable, CACHED when an identical headline was seen before, or
FALLBACK (deterministic keywords, no LLM) otherwise — see
InjectHeadlineResponse.extraction_source. The score itself is always a
deterministic weighted formula over news/price/vessel inputs — the LLM
only extracts event_type/severity/corridor, it never sets the score
directly. In-memory state, resets on backend restart.
"""

from datetime import datetime, timezone

from fastapi import APIRouter

from app import llm
from app.models.schemas import (
    CorridorRisk,
    Evidence,
    InjectHeadlineRequest,
    InjectHeadlineResponse,
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


def _default_breakdown(news: float, price: float, vessel: float) -> RiskBreakdown:
    return RiskBreakdown(
        news_severity=news,
        price_volatility=price,
        vessel_anomaly=vessel,
        weights=_WEIGHTS,
    )


def _weighted_score(b: RiskBreakdown) -> float:
    return round(
        b.news_severity * _WEIGHTS["news_severity"]
        + b.price_volatility * _WEIGHTS["price_volatility"]
        + b.vessel_anomaly * _WEIGHTS["vessel_anomaly"],
        1,
    )


def _seed_state() -> dict[str, CorridorRisk]:
    """Starting risk per corridor. These baseline inputs are illustrative
    (no live news/price/AIS feed behind them yet — see docs/API.md); the
    scoring formula applied to them is real and deterministic."""
    seed = {
        "hormuz": _default_breakdown(55.0, 30.0, 35.0),
        "bab_el_mandeb": _default_breakdown(20.0, 25.0, 40.0),
        "suez": _default_breakdown(10.0, 15.0, 10.0),
        "malacca": _default_breakdown(8.0, 10.0, 15.0),
        "cape_route": _default_breakdown(5.0, 10.0, 5.0),
    }
    now = datetime.now(timezone.utc)
    return {
        cid: CorridorRisk(
            corridor=cid,
            name=_CORRIDOR_NAMES[cid],
            score=_weighted_score(b),
            breakdown=b,
            evidence=[],
            updated_at=now,
        )
        for cid, b in seed.items()
    }


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
    updated = CorridorRisk(
        corridor=corridor_id,
        name=current.name,
        score=_weighted_score(bumped_breakdown),
        breakdown=bumped_breakdown,
        evidence=[*current.evidence, event],
        updated_at=now,
    )
    _state[corridor_id] = updated

    return InjectHeadlineResponse(extracted_event=event, updated_corridor=updated, extraction_source=source)

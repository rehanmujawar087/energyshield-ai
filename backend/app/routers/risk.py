"""Risk Intelligence Agent — mock endpoints.

GET /api/risk/corridors        — current per-corridor disruption scores.
POST /api/risk/inject-headline — manual demo input; bumps the matching corridor.

MOCK ONLY. In-memory state, resets on backend restart. Real event extraction
(LLM) and real scoring formula are not implemented here — see docs/API.md
for the contract this will keep once they are.
"""

from datetime import datetime, timezone

from fastapi import APIRouter

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

# Mock keyword -> corridor match for inject-headline when corridor isn't given.
_KEYWORD_CORRIDOR = {
    "hormuz": "hormuz",
    "iran": "hormuz",
    "red sea": "bab_el_mandeb",
    "yemen": "bab_el_mandeb",
    "houthi": "bab_el_mandeb",
    "suez": "suez",
    "egypt": "suez",
    "malacca": "malacca",
    "singapore": "malacca",
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
    """Mock baseline risk per corridor. Numbers are placeholders, not a real model."""
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


def _pick_corridor(headline: str) -> str:
    lowered = headline.lower()
    for keyword, corridor in _KEYWORD_CORRIDOR.items():
        if keyword in lowered:
            return corridor
    return "hormuz"  # mock default when nothing matches


@router.get("/corridors", response_model=RiskCorridorsResponse)
def get_corridors() -> RiskCorridorsResponse:
    return RiskCorridorsResponse(corridors=list(_state.values()))


@router.post("/inject-headline", response_model=InjectHeadlineResponse)
def inject_headline(body: InjectHeadlineRequest) -> InjectHeadlineResponse:
    corridor_id = body.corridor or _pick_corridor(body.headline)
    now = datetime.now(timezone.utc)

    event = Evidence(
        headline=body.headline,
        source_url=body.source_url,
        timestamp=now,
        event_type="tanker_incident",  # mock — real agent will classify this via LLM
        severity=4,  # mock fixed severity
        corridor=corridor_id,
    )

    current = _state[corridor_id]
    bumped_breakdown = RiskBreakdown(
        news_severity=min(current.breakdown.news_severity + 20.0, 100.0),
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

    return InjectHeadlineResponse(extracted_event=event, updated_corridor=updated)

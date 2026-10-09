"""Single in-memory source of truth for scenario assumptions.

Loaded once at import time from data/assumptions.json. Every router that
needs a numeric assumption (scenario, spr, risk, procurement) reads from
here via get_value()/get() instead of hard-coding its own copy — so
PUT /api/assumptions actually changes what the rest of the app computes,
not just what that one endpoint echoes back.

In-memory only: resets on backend restart, same as every other router's
state in this app (see CLAUDE.md).
"""

import json
from pathlib import Path

from app.models.schemas import Assumption

_DATA_FILE = Path(__file__).resolve().parents[2] / "data" / "assumptions.json"

# Fallback defaults, used only if data/assumptions.json is missing or
# malformed (e.g. a fresh clone that hasn't pulled /data yet) — keeps the
# backend usable rather than crashing at import time.
_FALLBACK = [
    {"key": "india_crude_demand_bpd", "value": 5300000, "unit": "barrels_per_day", "source_note": "fallback default"},
    {"key": "hormuz_import_share_pct", "value": 42.5, "unit": "percent", "source_note": "fallback default"},
    {"key": "spr_total_days_cover", "value": 9.5, "unit": "days", "source_note": "fallback default"},
    {"key": "gdp_impact_per_10usd_oil_pct", "value": -0.3, "unit": "percent_gdp", "source_note": "fallback default"},
    {"key": "default_demand_elasticity", "value": 0.05, "unit": "fraction_per_10pct_price_move", "source_note": "fallback default"},
]


def _load() -> dict[str, Assumption]:
    try:
        raw = json.loads(_DATA_FILE.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        raw = _FALLBACK
    return {a["key"]: Assumption(**a) for a in raw}


_state: dict[str, Assumption] = _load()


def all_assumptions() -> list[Assumption]:
    return list(_state.values())


def get(key: str) -> Assumption | None:
    return _state.get(key)


def get_value(key: str, default: float) -> float:
    a = _state.get(key)
    return a.value if a is not None else default


def update(assumptions: list[Assumption]) -> list[Assumption]:
    for a in assumptions:
        _state[a.key] = a
    return all_assumptions()

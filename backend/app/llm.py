"""Single LLM interface: event extraction for the Risk Intelligence Agent.

Tries Groq (openai/gpt-oss-20b) via a plain stdlib HTTP call — no SDK
dependency, since this ran in an environment where `pip install` was
unreliable mid-build; urllib.request needs nothing extra. Every response
is cached to disk by a hash of the input, and every call result is
labelled with exactly where it came from (LIVE / CACHED / FALLBACK) so
the API response and the UI can be honest about it. If there's no
GROQ_API_KEY, the API errors, or the call times out, falls back to a
deterministic keyword classifier — the LLM only ever extracts text
structure, it never invents the numbers the rest of the app uses.
"""

import hashlib
import json
import logging
import os
import urllib.error
import urllib.request
from pathlib import Path

logger = logging.getLogger("energyshield.llm")
from typing import Literal

CACHE_DIR = Path(__file__).resolve().parent / ".cache"
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "openai/gpt-oss-20b"
REQUEST_TIMEOUT_S = 6

CORRIDOR_IDS = ["hormuz", "bab_el_mandeb", "suez", "malacca", "cape_route"]

_SYSTEM_PROMPT = (
    "You classify one shipping-disruption headline for an energy risk dashboard. "
    "Reply with ONLY a JSON object, no prose, matching exactly this shape: "
    '{"corridor": one of ' + json.dumps(CORRIDOR_IDS) + ', '
    '"event_type": a short snake_case label (e.g. tanker_incident, closure_threat, '
    'price_shock, piracy, diplomatic_statement), '
    '"severity": integer 1-5 (5 = most severe), '
    '"reasoning": one short sentence}. '
    "If the headline doesn't clearly name a corridor, make your best guess from context."
)

ExtractionSource = Literal["live", "cached", "fallback"]

# --- Keyword fallback (also used to seed the mock corridor guess) ----------

_KEYWORD_CORRIDOR = {
    "hormuz": "hormuz",
    "iran": "hormuz",
    "strait of hormuz": "hormuz",
    "red sea": "bab_el_mandeb",
    "yemen": "bab_el_mandeb",
    "houthi": "bab_el_mandeb",
    "bab-el-mandeb": "bab_el_mandeb",
    "suez": "suez",
    "egypt": "suez",
    "malacca": "malacca",
    "singapore": "malacca",
    "cape": "cape_route",
    "good hope": "cape_route",
}
_SEVERITY_KEYWORDS = {
    5: ["seized", "attack", "sunk", "blocked", "closure", "explosion", "strike"],
    4: ["tension", "threat", "warning", "incident", "disrupt"],
    3: ["concern", "risk", "delay"],
}


def _keyword_extract(headline: str) -> dict:
    lowered = headline.lower()
    corridor = next((c for kw, c in _KEYWORD_CORRIDOR.items() if kw in lowered), "hormuz")
    severity = 2
    for level, words in _SEVERITY_KEYWORDS.items():
        if any(w in lowered for w in words):
            severity = level
            break
    event_type = "price_shock" if "price" in lowered or "opec" in lowered else "tanker_incident"
    return {
        "corridor": corridor,
        "event_type": event_type,
        "severity": severity,
        "reasoning": "Keyword match (no LLM call) — corridor/severity guessed from headline text.",
    }


# --- Disk cache --------------------------------------------------------------


def _cache_key(headline: str) -> str:
    return hashlib.sha256(headline.strip().lower().encode("utf-8")).hexdigest()[:24]


def _cache_path(headline: str) -> Path:
    return CACHE_DIR / f"{_cache_key(headline)}.json"


def _read_cache(headline: str) -> dict | None:
    path = _cache_path(headline)
    if not path.exists():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None


def _write_cache(headline: str, data: dict) -> None:
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    try:
        _cache_path(headline).write_text(json.dumps(data), encoding="utf-8")
    except OSError:
        pass  # cache is a convenience, never fatal


# --- Groq call -----------------------------------------------------------------


def _call_groq(headline: str, api_key: str) -> dict:
    body = json.dumps(
        {
            "model": GROQ_MODEL,
            "messages": [
                {"role": "system", "content": _SYSTEM_PROMPT},
                {"role": "user", "content": headline},
            ],
            "temperature": 0.2,
            # openai/gpt-oss-20b is a reasoning model: it spends tokens on a
            # hidden chain-of-thought before the final answer, and strict
            # response_format=json_object conflicts with that (empty
            # failed_generation, 400 json_validate_failed) — so this relies
            # on the system prompt's instruction instead. Reasoning length
            # varies per headline (observed 150-300+ tokens for ambiguous
            # ones) and a too-tight budget truncates the response to
            # nothing before it reaches the actual JSON, so this leaves
            # generous headroom rather than cutting it close.
            "max_tokens": 700,
        }
    ).encode("utf-8")

    req = urllib.request.Request(
        GROQ_URL,
        data=body,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            # Cloudflare (fronting api.groq.com) blocks urllib's default
            # "Python-urllib/x.y" User-Agent as bot-like (error 1010) —
            # any ordinary-looking one works.
            "User-Agent": "EnergyShieldAI/1.0 (+hackathon-demo)",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=REQUEST_TIMEOUT_S) as resp:
        payload = json.loads(resp.read().decode("utf-8"))

    content = payload["choices"][0]["message"]["content"].strip()
    # Defensive: strip markdown code fences if the model wraps its JSON in
    # them despite the system prompt saying not to.
    if content.startswith("```"):
        content = content.strip("`")
        if content.lower().startswith("json"):
            content = content[4:]
        content = content.strip()
    if not content:
        raise ValueError("Groq returned empty content (reasoning likely exhausted max_tokens)")
    parsed = json.loads(content)

    if parsed.get("corridor") not in CORRIDOR_IDS:
        parsed["corridor"] = "hormuz"
    parsed["severity"] = max(1, min(5, int(parsed.get("severity", 3))))
    parsed.setdefault("event_type", "tanker_incident")
    parsed.setdefault("reasoning", "")
    return parsed


# --- Public entrypoint -----------------------------------------------------------


def extract_event(headline: str) -> tuple[dict, ExtractionSource]:
    """Returns (extraction_dict, source) where source is 'live' / 'cached' / 'fallback'."""
    cached = _read_cache(headline)
    if cached is not None:
        return cached, "cached"

    api_key = os.environ.get("GROQ_API_KEY", "").strip()
    if not api_key:
        return _keyword_extract(headline), "fallback"

    try:
        result = _call_groq(headline, api_key)
        _write_cache(headline, result)
        return result, "live"
    except (urllib.error.URLError, TimeoutError, KeyError, ValueError, json.JSONDecodeError, OSError) as e:
        logger.warning("Groq extraction failed, falling back to keywords: %r", e)
        return _keyword_extract(headline), "fallback"

"""Corridor disruption probability: logistic transform + Monte Carlo band.

This is a deterministic, inspectable model, not a trained/calibrated one:
- The weighted score (news/price/vessel inputs x fixed weights) is passed
  through a logistic (sigmoid) curve to get a 0-100 "probability-like"
  figure that saturates at the extremes instead of growing linearly.
- A lightweight Monte Carlo simulation (independent Gaussian jitter on
  each input, re-run N times) gives a p10/p50/p90 band around that point
  estimate, reflecting input uncertainty, not model uncertainty.
- "Drivers" reports each input's share of the weighted score so a judge
  can see what moved the number.

IMPORTANT, and this must stay visible everywhere this is used: these
weights, the jitter size, and the logistic steepness are all authored
constants, not fit to historical disruption data. This is an uncalibrated
prior for demo purposes — it is not a claim of real-world accuracy.
"""

import math
import random
import statistics

MONTE_CARLO_ITERATIONS = 1000
JITTER_STDDEV = 12.0  # points, on the 0-100 input scale
LOGISTIC_MIDPOINT = 50.0
LOGISTIC_STEEPNESS = 0.07

UNCALIBRATED_NOTE = (
    "Uncalibrated prior: a logistic transform of a hand-weighted score, with a Monte Carlo "
    "band from input jitter, not a model fit to historical disruption data. Treat as "
    "illustrative, not a real-world accuracy claim."
)


def _logistic(x: float) -> float:
    return 100.0 / (1.0 + math.exp(-LOGISTIC_STEEPNESS * (x - LOGISTIC_MIDPOINT)))


def _weighted(news: float, price: float, vessel: float, weights: dict[str, float]) -> float:
    return news * weights["news_severity"] + price * weights["price_volatility"] + vessel * weights["vessel_anomaly"]


def compute(news: float, price: float, vessel: float, weights: dict[str, float]) -> dict:
    """Returns probability_pct (point estimate), p10/p50/p90, and drivers."""
    point_score = _weighted(news, price, vessel, weights)
    point_probability = round(_logistic(point_score), 1)

    rng = random.Random(round(news * 97 + price * 31 + vessel * 13))  # seeded: reproducible per input
    samples = []
    for _ in range(MONTE_CARLO_ITERATIONS):
        jittered_news = min(max(news + rng.gauss(0, JITTER_STDDEV), 0), 100)
        jittered_price = min(max(price + rng.gauss(0, JITTER_STDDEV), 0), 100)
        jittered_vessel = min(max(vessel + rng.gauss(0, JITTER_STDDEV), 0), 100)
        samples.append(_logistic(_weighted(jittered_news, jittered_price, jittered_vessel, weights)))

    samples.sort()
    p10 = round(statistics.quantiles(samples, n=10)[0], 1)
    p50 = round(statistics.median(samples), 1)
    p90 = round(statistics.quantiles(samples, n=10)[8], 1)

    contributions = {
        "news_severity": news * weights["news_severity"],
        "price_volatility": price * weights["price_volatility"],
        "vessel_anomaly": vessel * weights["vessel_anomaly"],
    }
    total = sum(contributions.values()) or 1.0
    drivers = sorted(
        (
            {"name": name, "contribution_pct": round(value / total * 100, 1)}
            for name, value in contributions.items()
        ),
        key=lambda d: -d["contribution_pct"],
    )

    return {
        "probability_pct": point_probability,
        "probability_p10": p10,
        "probability_p50": p50,
        "probability_p90": p90,
        "drivers": drivers,
        "method_note": UNCALIBRATED_NOTE,
    }

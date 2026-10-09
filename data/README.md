# Seed data — sources & honesty notes

These files are **seed data for the hackathon prototype**, not official statistics. They exist so the team can build against realistic-shaped numbers before real data integrations (if any) are wired in. Every file below documents where its numbers come from and how approximate they are. Nothing here is wired into the backend's mock endpoints yet — that is real-logic work for a later commit (see `backend/app/routers/` for the current in-router mock values).

| File | Contents | Approximation level |
|------|----------|----------------------|
| `corridors.json` | 5 shipping corridors with illustrative waypoints | **SIMULATED** — waypoints are hand-picked points for map display, not navigational or AIS data |
| `ports.json` | 8 major Indian ports with coordinates | Approximate public coordinates |
| `refineries.json` | 7 major Indian refineries with approximate capacity | Approximate public capacity figures, rounded |
| `spr_sites.json` | 3 Indian Strategic Petroleum Reserve sites | Approximate public capacity figures (ISPRL), rounded |
| `suppliers.json` | 5 illustrative crude suppliers for the Procurement Optimiser | **Illustrative/hypothetical** — not live supplier contracts or prices |
| `assumptions.json` | Baseline numbers behind the Scenario Modeller | Each entry has its own `source_note`; several are rule-of-thumb heuristics, not calibrated models |

## Detail notes

- **India's crude import dependence (~88%) and Hormuz transit share (~40–45%)** are the commonly cited figures used throughout this project's README and pitch. They come from public commentary on India's energy import mix, not from a single verified primary source we can cite precisely — treat them as order-of-magnitude figures appropriate for a hackathon demo, not audited statistics.
- **SPR days-of-cover (~9.5 days)** is a commonly cited figure for India's Strategic Petroleum Reserve (ISPRL) coverage at typical consumption. The per-site capacities in `spr_sites.json` are rounded public figures for Visakhapatnam, Mangaluru, and Padur.
- **Refinery and port coordinates** are approximate (city/facility-level), good enough for map pins at national scale — not surveyed GPS data.
- **Vessel positions are always simulated.** There is no live AIS feed in this project. Any vessel shown on the map or returned by an API must be labelled `"simulated": true` (see `backend/app/models/schemas.py` → `Vessel`).
- **Supplier list and prices in `suppliers.json`** are illustrative placeholders sized to be plausible (e.g. Gulf suppliers cheaper/faster via Hormuz, non-Gulf suppliers costlier/slower via the Cape route) so the Procurement Optimiser has a believable but *fictional* book to optimise over. Do not present these as real quoted prices.
- **`assumptions.json`** is the one file every number in the Scenario Modeller should ultimately trace back to. Each entry carries its own `source_note` — when the real Scenario Modeller is built, it should assumptions.json rather than hard-coding these numbers (see `backend/app/routers/assumptions.py` for the current in-router mock copy, which mirrors this file by hand for now).

## What's NOT here

No real-time feeds, no historical price series, no real AIS/vessel tracking data, no verified government statistics dataset. This is deliberately a small, hand-written seed set sized for a 6-hour build — expanding it with properly sourced data is a reasonable next step after the core pipeline works end to end.

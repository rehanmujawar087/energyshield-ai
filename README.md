# EnergyShield AI

**Turning India's energy-import risk management from reactive to anticipatory — an AI system that watches disruption signals, models their impact, and recommends what to do about it, end to end.**

Built for IEEE SYNAPSE 2026, ET AI Hackathon Problem Statement #2: *AI-Driven Energy Supply Chain Resilience for Import-Dependent Economies*.

---

## 1. The problem

India imports roughly **88% of its crude oil**, and **40–45% of that flows through the Strait of Hormuz**. Our Strategic Petroleum Reserve (SPR) covers only about **9.5 days** of consumption. A single chokepoint incident — a tanker seizure, a strait closure threat, a shipping-lane attack — can put the country within days of a fuel supply gap, and today's planning tools are static spreadsheets that get updated *after* the news breaks, not before.

The gap we are targeting: there is no system that continuously watches geopolitical and logistics risk signals, models what a disruption would actually do to supply and price, and turns that into a concrete, executable procurement and reserve-drawdown plan — fast enough to matter.

## 2. The solution

EnergyShield AI is a pipeline, not a single model. It chains together six purpose-built modules so that a raw signal (a headline, a price move, an anomalous vessel pattern) turns into a ranked, numeric, explainable recommendation:

1. **Risk Intelligence Agent** reads news/feeds, extracts structured events with an LLM, and scores disruption risk (0–100) per shipping corridor from a transparent, weighted formula — never from LLM vibes.
2. **Scenario Modeller** takes a risk scenario (e.g. "Hormuz 50% closure, 30 days") and computes supply gap, refinery run-rate impact, price impact, and SPR days-of-cover using deterministic formulas with documented assumptions — not a black box.
3. **Procurement Optimiser** runs a linear program over real supplier/route/capacity constraints to find the minimum-landed-cost sourcing plan that closes the gap.
4. **SPR Optimiser** computes a drawdown schedule to bridge the gap until alternate cargoes arrive.
5. **Pipeline runner** chains all of the above into one call and times every stage, so we can demonstrate signal-to-recommendation latency directly — one of the problem statement's own evaluation criteria.
6. **React dashboard** visualises all of it on a live map and charts, and lets a judge inject a headline and watch the whole chain react.

LLM calls are confined to text understanding (event extraction, memo drafting) and are cached; **every number shown is produced by a deterministic model**, so the system stays auditable and explainable to judges, not just impressive-looking.

## 3. The six modules

| # | Module | What it does | Owner |
|---|--------|--------------|-------|
| 1 | Risk Intelligence Agent | Ingests headlines (RSS/GDELT + manual "inject headline" endpoint), extracts events via LLM, computes a 0–100 disruption score per corridor (Hormuz, Bab-el-Mandeb/Red Sea, Suez, Malacca, Cape route) from weighted news severity + price volatility + simulated vessel anomaly, with full evidence trail | rehanmujawar087 |
| 2 | Digital Twin Map | Corridors coloured by live risk, Indian ports, refineries, SPR sites (Visakhapatnam, Mangaluru, Padur), simulated AIS vessels on real waypoints | khadija1407 |
| 3 | Scenario Modeller | Deterministic presets (Hormuz partial closure, Red Sea suspension, OPEC+ cut) + sliders (closure %, duration, demand elasticity) → supply gap, refinery impact, price impact, SPR days of cover, rough GDP impact; assumptions documented and editable | sagar3468patil-hash |
| 4 | Procurement Optimiser | LP minimising landed cost under the active scenario, subject to supplier capacity, route availability, transit time, port capacity, and refinery grade compatibility; ranked alternatives + LLM memo quoting only optimiser numbers | sagar3468patil-hash |
| 5 | SPR Optimiser | Drawdown schedule to bridge the supply gap until alternate cargoes arrive, with a days-of-cover chart | sagar3468patil-hash |
| 6 | Pipeline Runner | `POST /api/pipeline/run` chains signal → score → scenario → procurement → SPR in one call, returns per-stage timing and an audit log | rehanmujawar087 |

Frontend panels for modules 3–5 and the overall dashboard/demo script are owned by PradnyaN21.

## 4. Tech stack

**Backend:** Python 3.11+, FastAPI, Pydantic, pandas, SciPy/PuLP (linear programming), NetworkX, Uvicorn.

**LLM:** Groq (Llama 3.3 70B) behind a single `llm.py` interface, with Gemini supported via an environment-variable swap. Structured JSON outputs only, all responses cached under `.cache/`, and a deterministic rule-based fallback if the API is offline or unavailable. The LLM extracts events and drafts memos — it never produces the numbers that drive the dashboard.

**Frontend:** React + Vite + Tailwind CSS, react-leaflet (map/digital twin), Recharts (charts), dark control-room styled UI.

**Data:** No database. JSON/CSV seed data under `/data` (suppliers, corridors, ports, refineries, SPR sites, assumptions). All simulated figures (e.g. vessel tracks) are explicitly labelled **SIMULATED** in both the UI and the docs, and approximate seed numbers are documented with sources/notes in `data/README.md`.

## 5. Architecture

```mermaid
flowchart LR
    subgraph Sources["Data sources"]
        A1[News / RSS / GDELT feed]
        A2[Manual inject-headline endpoint]
        A3[Price & simulated AIS data]
    end

    subgraph Backend["FastAPI backend"]
        B["Risk Intelligence Agent\n(LLM event extraction +\nweighted disruption score)"]
        C["Scenario Modeller\n(deterministic formulas)"]
        D["Procurement Optimiser\n(LP: min landed cost)"]
        E["SPR Optimiser\n(drawdown schedule)"]
        F["Pipeline Runner\n(/api/pipeline/run,\nstage timing + audit log)"]
    end

    G["React Dashboard\n(map, risk panel, scenario\nsliders, procurement &\nSPR charts)"]

    A1 --> B
    A2 --> B
    A3 --> B
    B --> C --> D --> E
    B -.-> F
    C -.-> F
    D -.-> F
    E -.-> F
    F --> G
    B --> G
```

## 6. Planned demo flow

1. Open the dashboard: map shows live corridor risk colouring (Hormuz, Red Sea, Suez, Malacca, Cape route), Indian ports/refineries/SPR sites, and simulated vessels.
2. Judge (or presenter) **injects a headline** via the UI (e.g. "tanker seized near Strait of Hormuz") — the Hormuz risk score jumps and an evidence card appears showing the extracted event and source.
3. Presenter selects the **"Hormuz 50% closure, 30 days"** scenario preset — supply gap, refinery run-rate drop, fuel price impact, and SPR days-of-cover update live, with the underlying assumptions visible and editable.
4. Dashboard shows **ranked procurement alternatives** with landed cost and arrival time for each.
5. **SPR drawdown chart** shows the reserve bridging the gap until the first alternate cargo arrives.
6. An on-screen timer shows **signal → recommendation in N seconds**, end to end.
7. Presenter opens the **assumptions panel** to show every number in the model is sourced and editable, not hard-coded magic.

## 7. Status

**Built:**
- Repository scaffold, `.gitignore`, `.env.example`, `CLAUDE.md` with team rules and ownership.
- `backend/` and `frontend/` folder structure with README stubs.

**In progress (target: working end-to-end by Evaluation Round 2, ~2:00 PM IST):**
- `docs/API.md` with Pydantic schemas and example JSON per endpoint.
- Mock endpoints returning realistic placeholder data for all six modules, so all four members can build against a stable contract in parallel.
- Seed data under `/data` (suppliers, corridors with waypoints, ports, refineries, SPR sites, `assumptions.json`) and `data/README.md`.

**Not yet started:**
- Real Risk Intelligence Agent logic (LLM event extraction, live scoring).
- Scenario Modeller, Procurement Optimiser, SPR Optimiser deterministic implementations.
- Pipeline runner wiring the above together with stage timing.
- React dashboard (map, risk panel, scenario/procurement/SPR panels).
- Stretch goals (knowledge graph, RAG "ask the analyst", backtest, memo export) — only attempted after the core pipeline works end to end.

This section will be kept honest and updated as the build progresses — nothing above is a claim of a working feature unless it says "Built."

## 8. Team

| GitHub | Role |
|--------|------|
| [rehanmujawar087](https://github.com/rehanmujawar087) | Team lead — backend core, Risk Intelligence Agent, pipeline runner, `llm.py` |
| [sagar3468patil-hash](https://github.com/sagar3468patil-hash) | Scenario Modeller, Procurement Optimiser, SPR Optimiser |
| [khadija1407](https://github.com/khadija1407) | Frontend — digital twin map, corridor risk dashboard |
| [PradnyaN21](https://github.com/PradnyaN21) | Frontend — scenario/procurement/SPR panels, README, demo script, deck |

## 9. Setup

Setup instructions will be filled in as `backend/` and `frontend/` become runnable (target: before Evaluation Round 2). See `backend/README.md` and `frontend/README.md` for current stubs, and `docs/API.md` once published for the API contract.

---

*All disruption scenarios, vessel tracks, and seed figures in this project are for hackathon demonstration purposes. Where data is simulated or approximate, it is labelled as such in the UI and in `data/README.md`.*

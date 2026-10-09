<div align="center">

# 🛡️ EnergyShield AI

### From reactive crisis response to anticipatory energy-supply resilience

*An AI pipeline that watches disruption signals, models their impact, and tells procurement teams what to do about it.*

![Event](https://img.shields.io/badge/IEEE-SYNAPSE%202026-1f6feb?style=for-the-badge)
![Problem](https://img.shields.io/badge/ET%20AI%20Hackathon-PS%20%232-orange?style=for-the-badge)
![Backend](https://img.shields.io/badge/FastAPI-Python-009688?style=for-the-badge)
![Frontend](https://img.shields.io/badge/React-Vite-61dafb?style=for-the-badge)
![Status](https://img.shields.io/badge/status-working%20prototype-brightgreen?style=for-the-badge)

</div>

---

## 📑 Contents
[The Problem](#-the-problem) · [Our Solution](#-our-solution) · [Modules](#-the-six-modules) · [Probability Model](#-how-the-disruption-probability-works) · [Architecture](#-architecture) · [Tech Stack](#-tech-stack) · [Demo Flow](#-demo-flow) · [Status](#-project-status) · [Setup](#-setup) · [Repo Layout](#-repository-layout) · [Team](#-team) · [Data & Honesty Notes](#-data--honesty-notes)

---

## 🚨 The Problem

> **India imports ~88% of its crude oil. 40–45% of that passes through the Strait of Hormuz. Our Strategic Petroleum Reserve covers only ~9.5 days.**

A single chokepoint incident (a tanker seizure, a closure threat, a shipping-lane attack) can leave the country days away from a fuel supply gap. Today's planning tools are static: they are updated *after* the news breaks, they cannot model a geopolitical shock in real time, and they cannot turn a risk signal into a concrete procurement and reserve plan fast enough to matter.

**The gap:** no system continuously watches risk signals, models what a disruption would do to supply and price, and produces an *executable* sourcing plan within hours.

*(Figures as stated in the ET AI Hackathon problem statement #2.)*

---

## 💡 Our Solution

EnergyShield AI is a **pipeline, not a single model**. A raw signal (a headline, a price move, an anomalous vessel pattern) becomes a ranked, numeric, explainable recommendation:

```
Signal  →  Disruption probability  →  Scenario impact  →  Procurement plan  →  Reserve plan
```

**Design principle:** the LLM only *understands text* (event extraction, memo drafting). **Every number comes from a deterministic model** with explicit, editable assumptions, so the system is auditable and explainable.

---

## 🧩 The Six Modules

| # | Module | What it does | Owner |
|---|--------|--------------|-------|
| 1 | 🔍 **Risk Intelligence Agent** | Takes headlines (including a manual *inject headline* input), extracts structured events with an LLM (Groq, with disk cache and a keyword fallback), and computes a disruption **probability per corridor** with an uncertainty band and driver breakdown | `rehanmujawar087` |
| 2 | 🗺️ **Digital Twin Map** | Corridors coloured by risk; ports, refineries and SPR sites; simulated vessels on real waypoints | `khadija1407` |
| 3 | 📉 **Scenario Modeller** | Presets (Hormuz partial closure, Red Sea suspension, OPEC+ cut) with sliders for closure %, duration and demand elasticity; reads from the live assumptions store | `sagar3468patil-hash` |
| 4 | 🛢️ **Procurement Optimiser** | Optimiser ranks alternative suppliers and routes by landed cost under capacity and transit constraints | `sagar3468patil-hash` |
| 5 | 🏛️ **SPR Optimiser** | Drawdown plan and days of reserve cover, wired to the same live assumptions | `sagar3468patil-hash` |
| 6 | ⏱️ **Pipeline Runner** | Chains the stages and reports per-stage timing *(verify)* | `rehanmujawar087` |

The **React dashboard** (`khadija1407`, `PradnyaN21`) brings it together: map, probability cards with p10 / p50 / p90, shortfall view,

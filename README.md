# Marswalk Navigator ♂ 🚀
### Hyperlocal EVA Surface Route & Hazard Planner for Martian Astronauts
**2026 NASA Space Apps Challenge:** *Interplanetary Survival Guide: Martian Map*

[![Vitest](https://img.shields.io/badge/Vitest-Passing-brightgreen.svg)](https://vitest.dev)
[![Pytest](https://img.shields.io/badge/Pytest-Passing-brightgreen.svg)](https://pytest.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue.svg)](https://www.typescriptlang.org)
[![License](https://img.shields.io/badge/License-MIT-lightgrey.svg)](LICENSE)

---

## 1. Executive Summary & Challenge Alignment
NASA's **2026 Space Apps Challenge** (*Interplanetary Survival Guide: Martian Map*) asks solvers to create a layered, integrated view of a location on the Martian surface pulling together data from multiple NASA science missions to help human explorers plan and carry out a safe, science-focused Marswalk.

Existing planetary tools (such as JPL Mars Trek and USGS Astrogeology) are built for regional and global views. **Marswalk Navigator** delivers a **hyperlocalized** (meters to 4 km), safety-first system centered on the **Jezero Crater Western Delta Front** ($18.40^\circ\text{N} - 18.47^\circ\text{N}, 77.40^\circ\text{E} - 77.48^\circ\text{E}$), traversed by the Perseverance rover.

---

## 2. Key Capabilities

### 🛰️ Multi-Mission Data Fusion (6 Active Layers — Exceeding ≥3 Requirement)
1. **Optical Basemap (0.25 m/px):** High-resolution controlled orthomosaic from MRO HiRISE (`JEZ_hirise_soc_006_orthoMosaic_25cm`).
2. **Topographic Elevation (MOLA/HRSC):** Accurate planetary elevation referencing the Martian geoid datum.
3. **Derived Slope Angle (°):** 5-meter Horn finite-difference slope raster identifying dangerous scarps ($>10^\circ$ caution, $\ge 15^\circ$ impassable).
4. **Thermal Inertia (Rock Proxy):** 2001 Mars Odyssey THEMIS nighttime infrared imagery distinguishing bedrock/boulder hazards from loose aeolian dust.
5. **CRISM Spectral Mineralogy:** MRO CRISM summary parameter maps identifying astrobiologically significant magnesium carbonates and Fe/Mg smectite clays.
6. **Composite Traversability Cost:** Synthesized raster combining slope, roughness, and sand sinkage hazards.

### 🛡️ Safety-First EVA Route & Suit Consumables Modeling
- **Tobler Martian Suit Mobility:** Walking speed dynamically modeled for $0.38\,g$ and spacesuit joint resistance, clamped to $[0.4, 3.2]\text{ km/h}$.
- **Turnaround Walk-Back Rule:** Enforces NASA's $1.5\times$ safety margin (consumables remaining must exceed $150\%$ of time required to return to Habitat Alpha or rover shelter).
- **Diurnal Weather (Perseverance MEDA):** Real Jezero hourly ambient temperatures ($-78^\circ\text{C}$ to $-12^\circ\text{C}$), winds ($<14\text{ m/s}$), and dust optical depth ($\tau = 0.42$).
- **Surface Radiation & SPE Simulation:** Surface GCR baseline proxy ($9.5\,\mu\text{Sv/h}$ / $0.23\text{ mSv/day}$) from MSL Curiosity RAD, with interactive Solar Particle Event ($10\times$ flux surge) storm alerting.

### 🪖 Dual Display Modes
- **Planning Mode (Habitat / Rover Tablet):** Rich layer controls, opacity sliders, metadata inspector, and waypoint route builder.
- **EVA HUD Mode (Helmet Visor):** Ultra-high-contrast, dark amber/cyan glanceable interface displaying waypoint bearing/distance, walk-back ETA, suit $O_2$/battery vitals, and terrain hazard alerts.

---

## 3. Architecture & Tech Stack

```
NASA Sources (Mars Trek WMTS, PDS, USGS, Mars 2020 API)
                       │
                       ▼
         pipeline/ (Python 3.11 / 3.13)
      [Fetch → AOI Clip → Slope Horn → Resample]
                       │
                       ▼
       web/public/data/ (Static Assets)
  [layers.json, targets.geojson, weather.json, radiation.json]
                       │
                       ▼
          web/ (React 18 + TS + Vite + OpenLayers)
  [Equirectangular Mars Map, Zustand Store, Tobler Suit Engine]
                       │
                       ▼
      Zero-Backend Static Deployment (GitHub Pages / Vercel)
```

---

## 4. Quick Start & Development

### Prerequisites
- Node.js $\ge 18$ (tested on v22)
- Python $\ge 3.11$

### Running the Web Application
```bash
cd web
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Running Test Suites
```bash
# Frontend Unit & Math Tests (Vitest)
cd web && npm test

# Frontend Production Build (Zero TS Errors)
cd web && npm run build

# Python Pipeline Configuration Tests (Pytest)
python3 -m pytest pipeline/tests
```

---

## 5. Provenance & Scientific Data Transparency
In compliance with the project's verification principles, every layer and metric in the application displays an explicit data provenance tag:
- <span style="color:#10b981">**REAL:**</span> Direct instrument measurements from NASA missions (HiRISE, MEDA, CRISM, Mastcam-Z).
- <span style="color:#3b82f6">**DERIVED:**</span> Mathematical products computed from real NASA datasets (Horn slope, distance profiles).
- <span style="color:#f59e0b">**MODEL:**</span> Calibrated physical simulations based on peer-reviewed literature (Tobler suit speed, hazard cost).
- <span style="color:#a855f7">**SAMPLE:**</span> Verified offline cached backups for resilient hackathon judging.

Detailed documentation is available in [docs/data-sources.md](docs/data-sources.md) and [docs/assumptions.md](docs/assumptions.md).

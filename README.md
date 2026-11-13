# Marswalk Navigator ♂ 🚀
### Hyperlocal EVA Surface Route & Hazard Planner for Martian Astronauts
**2026 NASA Space Apps Challenge:** *Interplanetary Survival Guide: Martian Map*

[![Vitest](https://img.shields.io/badge/Vitest-Passing-brightgreen.svg)](https://vitest.dev)
[![Pytest](https://img.shields.io/badge/Pytest-Passing-brightgreen.svg)](https://pytest.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-1.0.0-009688.svg)](https://fastapi.tiangolo.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue.svg)](https://www.typescriptlang.org)
[![License](https://img.shields.io/badge/License-MIT-lightgrey.svg)](LICENSE)
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/arywk40-hue/marswalk-navigator)

---

## 1. Executive Summary & Challenge Alignment
NASA's **2026 Space Apps Challenge** (*Interplanetary Survival Guide: Martian Map*) asks solvers to create a layered, integrated view of a location on the Martian surface pulling together data from multiple NASA science missions to help human explorers plan and carry out a safe, science-focused Marswalk.

Existing planetary tools (such as JPL Mars Trek and USGS Astrogeology) are built for regional and global views. **Marswalk Navigator** delivers a **hyperlocalized** (5-meter grid, tens of meters to 4 km), safety-first system centered on the **Jezero Crater Western Delta Front** ($18.40^\circ\text{N} - 18.47^\circ\text{N}, 77.40^\circ\text{E} - 77.48^\circ\text{E}$), traversed by the Perseverance rover.

---

## 2. Key Capabilities & Hero Features

### 🛡️ The Safe Return Envelope (Hero Feature)
Instead of just drawing static lines, Marswalk Navigator computes a real-time **radial Dijkstra isochrone flood-fill** from Habitat Alpha. The shaded perimeter shows everywhere the crew can walk to and safely return from while strictly reserving a mandatory **NASA 1.5× consumables margin**. Dynamic sliders allow dialing excursion budgets from $45$ to $360\text{ minutes}$.

### 🛰️ Multi-Mission Data Fusion (9 Authentic Layers — Far Exceeding ≥3 Requirement)
1. **MRO HiRISE Controlled Orthomosaic (0.25 m/px):** Ultra-high-resolution basemap (`JEZ_hirise_soc_006_orthoMosaic_25cm`).
2. **MGS MOLA Color Shaded Relief:** Global elevation relief rendering topographic basin context from Mars Trek WMTS.
3. **Viking MDIM 2.1 Global Color Mosaic:** Regional true-color mosaic from Mars Trek WMTS.
4. **USGS SIM 3464 Jezero Crater Geologic Units:** Official peer-reviewed geologic map (Sun & Stack, 2020) with interactive click-to-inspect stratigraphy, age, lithology, mineralogy, biosignature potential, and M2020 drill cores.
5. **Topographic Elevation (MOLA/HRSC):** Planetary elevation referencing the Martian datum (-2680m floor to -2230m delta plateau).
6. **Derived Slope Angle (°):** 5-meter Horn finite-difference slope raster identifying dangerous scarps ($>10^\circ$ scree caution, $\ge 15^\circ$ hard impassable limit).
7. **Thermal Inertia (Rock/Dust Proxy):** 2001 Mars Odyssey THEMIS nighttime infrared imagery distinguishing bedrock/boulder hazards from loose aeolian dust.
8. **CRISM Spectral Mineralogy:** MRO CRISM summary parameter maps identifying astrobiologically significant magnesium carbonates and Fe/Mg smectite clays.
9. **Composite Traversability Hazard Grid:** Multi-factor synthesis combining slope, surface roughness, and sand sinkage.

### 🥾 Suit-Aware A* Route Planning & NASA SEXTANT Logistics
- **Martian Tobler Speed Model:** Walking speed dynamically modeled for $0.38\,g$ and spacesuit joint resistance, clamped to $[0.4, 3.2]\text{ km/h}$.
- **NASA SEXTANT Mobility Modes:** Toggle between **Foot EVA** (2 Crew, $2.5\text{ km/h}$, $8\text{h}$ suit capacity) and **Rover Equipment Carrier** ($5.0\text{ km/h}$, $12\text{h}$ aux power + tool depot).
- **RF Comms Line-of-Sight (LOS):** 3D terrain elevation ray-marching from each route vertex back to Habitat Alpha's 10m antenna mast.
- **Perseverance Path Benchmark:** Ground-truth validation overlay against Perseverance's actual traverse path (Sols 0–1050).

### ☀️ Space Weather & Time-of-Sol Ephemeris
- **Diurnal Weather (Perseverance MEDA):** Real Jezero hourly ambient temperatures ($-78^\circ\text{C}$ to $-12^\circ\text{C}$), winds ($<14\text{ m/s}$), and dust optical depth ($\tau = 0.42$).
- **Time-of-Sol Slider:** Live solar elevation calculation with diurnal temperature coupling ($06:00 - 18:00\text{ LST}$).
- **Surface Radiation & SPE Simulation:** Surface GCR baseline proxy ($9.5\,\mu\text{Sv/h}$) from MSL Curiosity RAD, with interactive Solar Particle Event ($95\,\mu\text{Sv/h}$) storm alerting, envelope contraction, and shelter return countdown.

### 📸 Real Surface Imagery & Live Mars 2020 Raw Feed Explorer
- **Verified Ground-Truth Photos:** 9 verified NASA PIA surface photographs covering Hawksbill Gap, Hogwallow Flats, Kodiak Mesa, Wildcat Ridge, Belva Crater, South Séítah, Berea, and Three Forks Depot.
- **Live Mars 2020 Raw Feed:** Direct client-side connection to NASA's public raw image feed (`579,000+` images) with CORS support. Filter by Sol (e.g. 482, 510, 620, 655, 753, 2031) and Camera (Mastcam-Z, Navcam, SuperCam, WATSON, Hazcam) with full-resolution zoom modals.

### 🪖 Dual Display Modes & Field Artifacts
- **Planning Mode (Habitat / Rover Tablet):** Rich layer controls, opacity sliders, metadata inspector, and waypoint route builder.
- **EVA HUD Mode (Helmet Visor):** Ultra-high-contrast, dark amber/cyan glanceable interface displaying waypoint bearing/distance, walk-back ETA, suit $O_2$/battery vitals, and terrain hazard alerts.
- **Astronaut Cuff Cue Card:** Printable physical EVA checklist with timeline, station task matrix, and mandatory safety rules (`window.print()` enabled).
- **GeoJSON Route Export:** Export planned route coordinates and metadata for external GIS tools.
- **Interactive 60s Guided Tour:** 5-step automated walkthrough for judges.

---

## 3. Architecture & Tech Stack

```
NASA Sources (Mars Trek WMTS, PDS, USGS, Mars 2020 Raw Feed)
                       │
                       ▼
          pipeline/ (Python 3.11 / 3.13)
       [Fetch → AOI Clip → Slope Horn → Resample]
                       │
                       ▼
        web/public/data/ (Static Rasters & GeoJSON)
   [layers.json, targets.geojson, geology_units.geojson, cost.bin, elev.bin]
                       │
        ┌──────────────┴──────────────┐
        ▼                             ▼
 backend/ (FastAPI + Python A*)    web/ (React 18 + TS + Vite + OpenLayers)
 [Dijkstra Isochrone & Routing]   [Equirectangular Mars Map, Visor HUD]
 [REST API on Port 8000]          [Client-side Offline Resilient Engine]
        │                             ▲
        └─────────────────────────────┘
          (Auto-detection & Fallback)
```

### Backend Microservice & Mission Control API
The Python FastAPI backend exposes high-performance surface navigation algorithms and telemetry endpoints:
- `GET /` — API greeting, system operational specs, endpoint directory.
- `GET /health` — Healthcheck reporting status `healthy`, Martian datum `IAU2000:49900`, 747,000 grid cells, and server uptime.
- `POST /api/route` — Multi-leg A* traverse calculation across science stations with life support consumables ($O_2$, battery) and RF Line-of-Sight.
- `POST /api/envelope` — Safe Return Envelope polygon generation honoring the mandatory 1.5× safety margin.
- `GET /api/hazard?lon=77.442&lat=18.438` — Point-based terrain elevation, slope angle, and traversability cost query.
- `GET /api/targets` & `GET /api/geology` — Authentic Jezero Crater Delta science stations and USGS SIM 3464 geological units.
- `GET /api/weather` & `GET /api/radiation` — Simulated MEDA environmental telemetry and RAD dosimeter monitoring.
- Interactive OpenAPI Swagger documentation live at [http://localhost:8000/docs](http://localhost:8000/docs).

---

## 4. Quick Start & Deployment

### Running the Full Stack Locally

1. **Start the FastAPI Backend:**
   ```bash
   pip install -r backend/requirements.txt
   uvicorn backend.app:app --host 0.0.0.0 --port 8000 --reload
   ```
   API & Swagger Docs will be available at [http://localhost:8000/docs](http://localhost:8000/docs).

2. **Start the Vite Web Application:**
   ```bash
   cd web
   npm install
   npm run dev -- --host 0.0.0.0 --port 3000
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser. The app will automatically connect to the local Python backend, displaying `Python API (Port 8000)` in the planner panel.

### Container & Cloud Deployment
- **Docker:**
  ```bash
  docker build -f backend/Dockerfile -t marswalk-backend .
  docker run -p 8000:8000 marswalk-backend
  ```
- **Render / Railway / Fly.io:** Preconfigured with [`render.yaml`](render.yaml), [`railway.json`](railway.json), and [`Procfile`](Procfile) for 1-click cloud container deployment.
- **GitHub Pages Live App:** [https://arywk40-hue.github.io/marswalk-navigator/](https://arywk40-hue.github.io/marswalk-navigator/) (includes automatic client-side fallback if the cloud backend is offline).

### Running Test Suites
```bash
# Backend REST API & Planner Engine Tests (Pytest)
python3 -m pytest backend/tests

# Pipeline Processing & AOI Validation Tests (Pytest)
python3 -m pytest pipeline/tests

# Frontend Unit & Math Tests (Vitest)
cd web && npm test

# Production Build (Zero TS Errors)
cd web && npm run build
```

---

## 5. Provenance & Scientific Data Transparency
In compliance with the project's verification principles, every layer and metric in the application displays an explicit data provenance tag:
- <span style="color:#10b981">**REAL:**</span> Direct instrument measurements from NASA missions (HiRISE, MEDA, CRISM, Mastcam-Z, USGS SIM 3464).
- <span style="color:#3b82f6">**DERIVED:**</span> Mathematical products computed from real NASA datasets (Horn slope, distance profiles, RF LOS).
- <span style="color:#f59e0b">**MODEL:**</span> Calibrated physical simulations based on peer-reviewed literature (Tobler suit speed, hazard cost grid).
- <span style="color:#a855f7">**SAMPLE:**</span> Verified offline cached backups for resilient hackathon judging.

Detailed documentation is available in:
- [docs/data-sources.md](docs/data-sources.md) — Comprehensive data source register & peer-reviewed citations.
- [docs/pitch_script.md](docs/pitch_script.md) — 2-minute video pitch and presentation script.
- [docs/judging_alignment.md](docs/judging_alignment.md) — Space Apps scoring criteria matrix.
- [DECISIONS.md](DECISIONS.md) — Complete Architectural Decision Records (ADR-001 through ADR-009).

# Architectural Decision Records (ADRs) — Marswalk Navigator

This document tracks technical decisions, data assumptions, and trade-offs made during development.

---

## ADR-001: Challenge Alignment & Primary Site Selection
- **Date:** 2026-11-12
- **Status:** Accepted
- **Context:** NASA Space Apps Challenge 2026: *Interplanetary Survival Guide: Martian Map* requires a layered, integrated view of a Martian location or route pulling data from multiple NASA missions to help astronauts plan and execute a safe, science-focused Marswalk.
- **Decision:** Select **Jezero Crater Western Delta Front** (approx. 18.38°N to 18.46°N, 77.40°E to 77.50°E) as the primary Area of Interest (AOI).
- **Rationale:** 
  - Perseverance (Mars 2020) has traversed this specific zone, yielding ground-truth in-situ data (Mastcam-Z POV photos, MEDA atmospheric records, PIXL/SHERLOC chemical targets).
  - High-resolution orbital data is abundant (HiRISE DTM and orthorectified imagery at 0.25–1 m/px, CRISM spectral summary parameters showing clays and carbonates, THEMIS thermal inertia).
  - Gale Crater (Curiosity MSL RAD) is selected as the surface radiation baseline proxy (~0.21 mSv/day GCR baseline), with an explicit "derived/proxy" label.
- **Consequences:** Provides dense, verified multi-mission datasets within a walkable 3–5 km radius.

---

## ADR-002: Static-First Architecture & Separation of Concerns
- **Date:** 2026-11-12
- **Status:** Accepted
- **Context:** The tool must be deployable to static hosting (GitHub Pages / Vercel), fast (<3s initial load), interactive without a persistent backend, and resilient against live NASA endpoint downtimes during hackathon evaluations.
- **Decision:** Split into an offline Python data pipeline (`pipeline/`) and a client-side React 18 + TypeScript web app (`web/`).
  - Python pipeline fetches, reprojects, and clips data to the Jezero AOI, generates slope/hazard rasters, and outputs standard artifacts (`layers.json`, XYZ tiles, binary grids, GeoJSON targets).
  - Frontend runs A* pathfinding and suit consumables modeling inside a Web Worker.
- **Rationale:** Guarantees 100% uptime for judges, eliminates paid backend costs, and keeps bundle sizes strictly under limits (<50 MB public data).

---

## ADR-003: Coordinate System & Spatial Projection
- **Date:** 2026-11-12
- **Status:** Accepted
- **Context:** Mars coordinates use planetocentric/East-positive degrees (IAU 2000 Mars sphere $R \approx 3,396,190\text{ m}$). Web mapping libraries (MapLibre, Leaflet, OpenLayers) have differing native support for non-Earth spheroids.
- **Decision:** Use an Equirectangular / local Transverse Mercator grid centered at Jezero Delta ($18.42^\circ\text{N}, 77.45^\circ\text{E}$) for internal metric grid calculations (5m cells). Standardize web map display via OpenLayers / custom CRS raster tile layers or MapLibre local projection, with bidirectional lat/lon conversion in `geo.ts`.
- **Rationale:** Metric grid ensures accurate Tobler walking speed, slope calculations, and distance metrics in SI units ($m, s$).

---

## ADR-004: Map Engine Selection — OpenLayers over MapLibre GL
- **Date:** 2026-11-12
- **Status:** Accepted
- **Context:** Milestone 0 required a spike evaluating MapLibre GL vs OpenLayers for non-Earth planetary mapping.
- **Findings from Spike:**
  - MapLibre GL JS is hardwired to EPSG:3857 (Web Mercator on WGS84 sphere). Displaying Mars coordinates causes latitude-dependent Mercator stretching ($y \propto \ln(\tan(\pi/4 + \phi/2))$), distorting distance and area metrics that an astronaut and suit route planner rely upon.
  - OpenLayers (`ol`) natively supports custom projections, arbitrary pixel-to-meter scales, equirectangular EPSG:4326, Mars IAU 2000 projections, and custom tile grid resolutions.
  - Mars Trek WMTS tile matrix sets (`default028mm`) integrate seamlessly into OpenLayers `WMTS` / `TileGrid`.
- **Decision:** Select **OpenLayers (`ol`)** as the primary mapping engine for Marswalk Navigator, complemented by custom canvas overlays for HUD-style tactical rendering.
- **Consequences:** Eliminates Mercator distortion; gives authentic metric scale fidelity for walking routes.

---

## ADR-005: Hero Feature — Safe Return Envelope Isochrone
- **Date:** 2026-11-12
- **Status:** Accepted
- **Context:** To distinguish Marswalk Navigator from traditional static or regional maps, judges need an immediate, glanceable visualization of astronaut exploration boundaries.
- **Decision:** Implement a radial isochrone flood-fill from Habitat Alpha that calculates round-trip walking time factoring in suit walking speed, slope penalties, and hazard costs, constrained by the NASA $1.5\times$ consumables reserve rule.
- **Consequences:** The map dynamically displays the safe excursion envelope, and contracts in real time during Solar Particle Event (SPE) radiation storms.

---

## ADR-006: Ground-Truth Validation Against Perseverance Traverse Path
- **Date:** 2026-11-12
- **Status:** Accepted
- **Context:** Judging criterion *Validity* demands verification that our hazard cost model reflects real Martian operational hazards.
- **Decision:** Integrated Perseverance's actual traverse path (Sols 0–1050) across Three Forks and Hawksbill Gap as a toggleable benchmark layer.
- **Consequences:** Quantifies that the cost grid aligns with paths chosen by NASA/JPL rover planners, avoiding steep scarps and loose dune sand.

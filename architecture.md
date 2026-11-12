# ARCHITECTURE.md — Marswalk Navigator

## 1. Overview
Two-part system, **static-first** (no required server):

1. **Data pipeline (offline, Python)** — downloads NASA datasets for a small area of interest (AOI), reprojects/clips/resamples them to a common grid, derives hazard layers, and writes web-friendly artifacts.
2. **Web app (React + TypeScript)** — loads those artifacts, renders layered map, runs route planning in the browser (Web Worker), shows safety dashboard and POV images.

```
NASA sources ──► pipeline/ (Python) ──► public/data/ (tiles, COG/PNG, JSON) ──► web/ (React) ──► user
 Mars Trek WMTS      fetch → clip → reproject      static, versioned                map + planner + HUD
 PDS / USGS          → derive slope/hazard
 Mars2020 raw imgs   → build cost grid
 MEDA / RAD tables   → tile + manifest
```

## 2. Tech stack
| Concern | Choice | Notes |
|---|---|---|
| Frontend | React 18 + TypeScript + Vite | Fast to scaffold |
| Map | **MapLibre GL JS** (or Leaflet if simpler) | Use a custom Mars CRS-free approach: treat AOI as local projected raster in a simple equirectangular/local ENU frame, or use Mars Trek tiles in EPSG:4326 via OpenLayers |
| State | Zustand | Layers, route, mode, scenario |
| Styling | Tailwind CSS | Two themes: `planning`, `hud` |
| Planner | A* in a Web Worker | Grid ≤ 1000×1000 cells |
| Charts | Recharts or uPlot | Elevation profile, weather |
| Pipeline | Python 3.11, `rasterio`, `numpy`, `scipy`, `pyproj`, `requests`, `pandas`, `shapely`, `Pillow` | GDAL required |
| Tests | Vitest (TS), pytest (Python), Playwright (smoke) | |
| Deploy | GitHub Pages / Vercel (static) | |

> If OpenLayers handles Mars CRS/WMTS from Mars Trek more easily than MapLibre, the agent may choose OpenLayers. Decide in Milestone 0 and record in `DECISIONS.md`.

## 3. Repository layout
```
marswalk-navigator/
├── goal.md
├── architecture.md
├── agent.md
├── DECISIONS.md              # running log of choices
├── README.md
├── pipeline/
│   ├── config/aoi.yaml       # AOI bbox, grid res, targets
│   ├── fetch/                # one module per data source
│   │   ├── marstrek.py       # WMTS/WCS imagery & DEM
│   │   ├── hirise.py         # HiRISE DTM/ortho (PDS/USGS)
│   │   ├── crism.py          # mineral summary parameter maps
│   │   ├── themis.py         # thermal inertia / night IR
│   │   ├── meda.py           # Perseverance MEDA weather (PDS)
│   │   ├── radiation.py      # MSL RAD dose-rate proxy table
│   │   ├── images.py         # Mars 2020 raw-image metadata
│   │   └── geology.py        # USGS geologic units / targets
│   ├── process/
│   │   ├── grid.py           # common grid definition
│   │   ├── slope.py          # slope, aspect, roughness
│   │   ├── hazard.py         # cost/hazard raster
│   │   └── tiles.py          # export PNG tiles / COG / terrain-RGB
│   ├── export/manifest.py    # writes layers.json
│   ├── cache/                # gitignored raw downloads
│   └── tests/
├── web/
│   ├── public/data/          # pipeline output (small enough to commit or release)
│   │   ├── layers.json       # manifest (see §5)
│   │   ├── tiles/{layer}/{z}/{x}/{y}.png
│   │   ├── grid/cost.bin + grid/meta.json
│   │   ├── targets.geojson
│   │   ├── weather.json
│   │   ├── radiation.json
│   │   └── pov/index.json
│   └── src/
│       ├── app/              # App shell, routing, mode switch
│       ├── map/              # MapView, LayerManager, Legend
│       ├── planner/          # astar.worker.ts, costModel.ts, suitModel.ts
│       ├── safety/           # SafetyPanel, GoNoGo, RadiationGauge
│       ├── pov/              # PovPanel
│       ├── hud/              # HudView (EVA mode)
│       ├── store/            # zustand stores
│       └── lib/              # geo math, units, formatters
└── docs/                     # screenshots, demo script, data-sources.md
```

## 4. Data sources (verify every URL/endpoint at build time; record in `docs/data-sources.md`)
| Layer | Mission / instrument | Source (starting points) | Use |
|---|---|---|---|
| Optical basemap | MRO HiRISE (~25–50 cm/px), CTX (~6 m/px) | Mars Trek (trek.nasa.gov/mars), USGS Astrogeology, PDS Imaging | Visual context, rock/boulder visibility |
| Elevation | MRO HiRISE DTM, MGS MOLA / HRSC-MOLA blend | Mars Trek, USGS, PDS | Slope, aspect, profile |
| Thermal | Odyssey THEMIS, MGS TES | Mars Trek, PDS | Thermal inertia → rocky vs dusty/sandy surface |
| Spectral | MRO CRISM (mineral parameter maps), OMEGA if needed | PDS Geosciences Node, Mars Trek | Science targets (carbonates, clays, olivine) |
| Geology | USGS–NASA Planetary Geologic Mapping Program | USGS Astrogeology | Unit polygons |
| Weather | Mars 2020 MEDA | PDS Atmospheres Node | Temp, pressure, wind, dust opacity, UV |
| Radiation | MSL RAD (Curiosity, surface), MAVEN SEP (space weather), MARIE (orbit) | PDS Planetary Plasma Interactions / Atmospheres | Dose-rate proxy; SPE alert scenario |
| Chemical | Perseverance PIXL / SHERLOC / SuperCam; Curiosity ChemCam / APXS | PDS Geosciences Node | Target annotations |
| POV imagery | Perseverance Mastcam-Z / Navcam / Hazcam | Mars 2020 raw image JSON feed (mars.nasa.gov/mars2020/multimedia/raw-images) | Waypoint preview |

**Rules**
- If an endpoint is down or format unexpected, fall back to a cached sample, log it in `DECISIONS.md`, and mark the layer `provenance: "sample"` in the manifest.
- Prefer **downsampled, AOI-clipped** products. Keep total `public/data` under ~100 MB (ideally <50 MB).

## 5. Data contracts

### 5.1 `layers.json` (manifest)
```json
{
  "aoi": {"name": "Jezero Delta Front", "bbox": [lon_min, lat_min, lon_max, lat_max], "crs": "IAU:49900 (Mars 2000)", "gridRes_m": 5},
  "layers": [
    {
      "id": "hirise",
      "label": "HiRISE Optical",
      "type": "raster-tiles",
      "category": "optical",
      "url": "data/tiles/hirise/{z}/{x}/{y}.png",
      "resolution_m": 0.5,
      "source": "MRO / HiRISE",
      "productId": "ESP_...",
      "date": "YYYY-MM-DD",
      "link": "https://...",
      "provenance": "real|derived|model|sample",
      "legend": {"kind": "gradient|categorical|none", "stops": []},
      "defaultOpacity": 1.0,
      "defaultVisible": true
    }
  ]
}
```

### 5.2 Cost grid
- `grid/meta.json`: `{width, height, cell_m, origin:[lon,lat], transform, units}`
- `grid/cost.bin`: `Uint8` per cell. `0` = impassable, `1–254` = relative traversal cost, `255` = nodata.
- `grid/slope.bin` (Float32 or Uint8 degrees), `grid/elev.bin` (Float32 m) for profiles.

### 5.3 `targets.geojson`
Point features with `properties: {id, name, science_value (1-5), reason, layer_evidence:[...], priority, estimated_dwell_min}`.

### 5.4 `weather.json`
`{ site, source, sols:[{sol, ls, tmin, tmax, pressure, wind_mean, wind_max, dust_tau, sunrise_local, sunset_local}], hourly_example:{...} }`

### 5.5 `radiation.json`
`{ baseline_dose_uSv_per_h, source, caveat, spe_scenario:{multiplier, duration_h}, limits:{eva_dose_mSv, note} }`
Documented assumption: baseline from MSL RAD surface measurements (~0.2–0.3 mSv/day GCR-dominated, verify) used as proxy at AOI.

### 5.6 `pov/index.json`
`[{id, lon, lat, camera, sol, imageUrl, thumbUrl, credit, link, heading_deg}]` — nearest-neighbor lookup by waypoint.

## 6. Pipeline design
1. **Define AOI & common grid** (`grid.py`): local projected CRS (e.g., equirectangular or Mars 2000 sinusoidal/UTM-like around AOI center), cell size 2–10 m (configurable).
2. **Fetch** each source into `cache/` with checksum + metadata sidecar.
3. **Resample** all rasters onto the common grid (bilinear for continuous, nearest for categorical).
4. **Derive**:
   - `slope` & `aspect` (Horn method) from DEM.
   - `roughness` (std dev of elevation in 3×3 / 5×5 window or TRI).
   - `rockiness_proxy` = f(thermal inertia, HiRISE texture/edge density, roughness). Document formula.
   - `soft_terrain_proxy` = low thermal inertia + low slope → possible dust/sand; add cost.
5. **Hazard / cost raster**:
   ```
   if slope > slope_max or rockiness > rock_max: cost = 0 (impassable)
   else cost = 1 + a*(slope/slope_max)^2 + b*rockiness + c*soft_terrain + d*roughness
   ```
   Parameters in `pipeline/config/cost.yaml`; mirrored in `web/src/planner/costModel.ts`.
6. **Export**: tiles (XYZ PNG, with `gdal2tiles` or custom), grid binaries, GeoJSON, manifest.
7. **Validate**: pytest checks (CRS present, no NaN in cost, grid aligned, manifest links resolve, size budget).

## 7. Web app design

### 7.1 Modules
- **MapView**: base + overlay raster layers from manifest; route line, waypoints, hazard overlay; scale bar, north arrow, coordinate readout, sun direction.
- **LayerPanel**: grouped by category (optical/topo/thermal/spectral/atmos/radiation/chem); toggle, opacity slider, info popover with provenance.
- **TargetList**: science targets ranked; click to add as waypoint.
- **Planner**: start/end/waypoints editing; "Plan route" button; results card.
- **SafetyPanel**: go/no-go composite (radiation, wind, daylight, walk-back, consumables).
- **PovPanel**: image carousel for selected waypoint, with camera/sol/credit.
- **HudView**: dark, large type, only: next waypoint bearing/distance, slope ahead, walk-back distance, O₂/power time left, radiation, alerts.
- **ScenarioControls** (stretch): SPE toggle, time-of-sol slider.

### 7.2 Route planning
- **Algorithm:** A* (8-connected) on cost grid; heuristic = octile distance × min cost. Multi-waypoint = chain legs (optionally brute-force order ≤7 waypoints for shortest total).
- **Edge cost:** `distance * (cost_a + cost_b)/2 * slopePenalty(Δh/distance)`.
- **Output:** polyline (lon/lat), per-vertex elevation/slope, cumulative distance, ETA, max/mean slope, hazard cells within 10 m buffer, walk-back distance to nearest shelter (habitat/rover).
- **Run in Web Worker**; show progress; cancel support.

### 7.3 Suit & consumables model (documented assumptions, editable in UI)
```
speed(slope) = v0 * exp(-k * |tan(slope) + s0|)      // Tobler-style, tuned for 0.38 g + suit; clamp to [vmin, vmax]
metabolic_W  = m0 + m1*speed + m2*max(0, slope)      // simple
o2_minutes_left = o2_capacity / (metabolic_W-based consumption)
turnaround_rule: must keep o2_remaining >= 1.5 × walk-back time (or configurable reserve)
```
Defaults: v0 ≈ 2.5 km/h flat, slope limit 15° (hard), EVA length 6–8 h. All numbers surfaced in a "Assumptions" modal.

### 7.4 Safety composite
Each factor returns `{status: ok|caution|stop, value, reason}`; overall = worst status.
- Radiation: baseline dose × duration vs limit; SPE flag → `stop` unless sheltered within X minutes.
- Wind/dust: MEDA gusts/τ thresholds.
- Daylight: sunset time − ETA ≥ margin.
- Walk-back: consumables margin rule above.
- Terrain: max slope and hazard-buffer intrusions.
- Comms: line-of-sight to habitat/relay via viewshed on DEM (stretch).

### 7.5 UI/UX requirements
- Two themes: Planning (light/dark) and HUD (dark, high contrast, ≥18 px base font, ≥44 px targets).
- Responsive: ≥1024 px desktop; 768–1024 px tablet landscape primary.
- Keyboard accessible; color-blind-safe palettes (use viridis/cividis for continuous, Okabe-Ito for categorical).
- Every layer legend + provenance visible within 1 click.

## 8. Performance & size budgets
- Initial load < 3 s on broadband; map interactive < 5 s.
- Planner returns < 1.5 s for 500×500 grid.
- `public/data` < 100 MB; individual file < 25 MB (GitHub limits).

## 9. Testing strategy
- **Python:** unit tests for slope calc (synthetic ramp), grid alignment, cost thresholds, manifest schema (jsonschema).
- **TS:** unit tests for A* (obstacle maze, impassable-cell avoidance), speed model monotonicity, safety composite.
- **E2E (Playwright):** load → toggle 3 layers → add 2 waypoints → plan → route visible → switch to HUD.
- **Property test:** planned route never crosses cost=0 cells.

## 10. Milestones (build order)
| # | Milestone | Exit criteria |
|---|---|---|
| 0 | Scaffold & decisions | Repo, Vite app, pipeline skeleton, `DECISIONS.md`, map lib chosen |
| 1 | Basemap + AOI | HiRISE/CTX tiles render; AOI fixed; layer manifest loads |
| 2 | Topography | DEM, slope layer, hillshade; elevation readout |
| 3 | Extra layers | Thermal, CRISM spectral, geology — total ≥5 layers |
| 4 | Cost grid + planner | A* route on real grid; route stats; tests pass |
| 5 | Safety + suit model | Go/no-go panel, walk-back, assumptions modal |
| 6 | Weather & radiation | MEDA charts, radiation proxy, SPE scenario |
| 7 | POV panel | Waypoint → nearest real surface photos |
| 8 | HUD mode | Simplified EVA view |
| 9 | Polish & docs | README, screenshots, demo script, deploy |
| 10 | Stretch | Two-astronaut, 3D, offline, export |

## 11. Risks & mitigations
| Risk | Mitigation |
|---|---|
| NASA endpoints change / slow | Cache raw data; ship sample data; `provenance` flag |
| Mars CRS pain in web map | Work in local projected grid; export XYZ tiles in a simple scheme; document transform |
| No site-specific radiation data | Use labeled proxy + scenario; never present as measured |
| Huge rasters | Clip to AOI, downsample, COG, tile |
| Scope creep | Hit milestones 0–6 + 8 first; stretch last |

# GOAL.md — Marswalk Navigator

## One-line pitch
A tablet/HUD-style interactive map that fuses multiple NASA Mars datasets into one hyperlocal, safety-first view an astronaut can use to plan and execute a surface excursion (Marswalk) — including an auto-generated, suit-aware route with science stops.

## Challenge context
NASA hackathon prompt: build a map, tool, or interface a Mars astronaut could use during a surface mission, using NASA data and tools. Requirements and hints from the prompt:
- Layer **at least 3 kinds of data** (optical, thermal, spectral, topographic, geophysical, atmospheric, radiation, chemical).
- **Safety first**: radiation/space weather, mobility in a spacesuit, avoid obstacles (large rocks, steep slopes).
- Include a **route map** connecting science targets while avoiding hazards.
- Optional: point-of-view surface images so the astronaut knows what to expect; rovers/robotic helpers; astronauts working in pairs.
- Existing tools (Mars Trek, USGS planetary geologic mapping) are regional/global; ours must be **hyperlocal** (tens of meters to a few km).

## Chosen mission scenario (default — agent may keep or change with justification)
- **Location:** Jezero Crater western delta front and Three Forks / Hogwallow-area vicinity, explored by Perseverance (lots of imagery, spectral, chemical data).
  - Fallback alternative: Gale Crater / Mount Sharp boxwork region (Curiosity; has MSL RAD radiation data measured on the surface).
- **Science objectives (example):**
  1. Sample/inspect delta-front sedimentary layers (past water, biosignature potential).
  2. Visit a carbonate- or clay-bearing outcrop identified by orbital spectra.
  3. Collect a regolith sample on a safe, flat area.
- **EVA profile:** two astronauts in pressurized suits, on foot, optionally a small pressurized-rover/robotic assistant staged at a drop-off point. Typical EVA 6–8 h, hard walk-back limit.

## Target users
1. **Astronaut on EVA** (tablet / wrist / helmet HUD) — glanceable, high contrast, big touch targets, minimal text.
2. **Crew in habitat/rover** planning the EVA — richer layers, route editing, what-if tools.
3. **Hackathon judges** — must understand value in under 60 seconds.

## Must-have features (MVP)
- [ ] Interactive map centered on the chosen site with pan/zoom to <1 m/px where HiRISE exists.
- [ ] **≥5 toggleable, opacity-adjustable layers** (target 6–8):
  - Optical: HiRISE / CTX basemap
  - Topographic: elevation + **derived slope map** (from MOLA / HiRISE DTM)
  - Thermal: THEMIS / TES thermal inertia (surface roughness/rock abundance proxy)
  - Spectral: CRISM mineral-indicator map (carbonate, phyllosilicate, olivine, etc.)
  - Atmospheric/weather: Perseverance MEDA time series (pressure, temp, wind, dust opacity)
  - Radiation: surface dose-rate (MSL RAD / Odyssey MARIE-derived) + solar-particle-event alert state
  - Chemical/geologic: PIXL/SHERLOC/ChemCam targets or USGS geologic map units
- [ ] **Hazard / traversability cost layer** (slope, rock abundance proxy, roughness, soft-terrain proxy).
- [ ] **Route planner:** user places start, science waypoints, end → app computes a safe route (A*), shows distance, elevation profile, estimated time, max slope, suit-consumables use, and **walk-back margin**.
- [ ] **Safety panel:** radiation level, dust/wind, sunset time, comm line-of-sight, consumables remaining, go/no-go indicator.
- [ ] **POV panel:** for each waypoint, show real Perseverance (or other) surface image(s) nearest to that location with attribution.
- [ ] **Two display modes:** Planning (desktop/tablet) and EVA HUD (dark, high-contrast, simplified).
- [ ] Data provenance: every layer shows source mission, instrument, resolution, date, and link.

## Nice-to-have (stretch)
- Space-weather scenario slider: "SPE event in progress" → radiation-adjusted route and shelter distances.
- Time-of-sol slider: sun elevation/shadow, temperature, remaining daylight along the route.
- Two-astronaut mode: split science tasks, keep within a max separation / comm range.
- 3D terrain view (deck.gl/three.js) of the route.
- Export route as GeoJSON / printable PDF cue card.
- Offline mode via service worker + pre-cached tiles.
- Voice/keyboard-minimal interactions for gloved use.

## Non-goals
- Not a global Mars browser; do not rebuild Mars Trek.
- No fabricated "real" data. Where real data isn't available (e.g., surface dose at Jezero), use a clearly labeled **proxy/model** and say so in the UI.
- No backend that requires paid services.

## Success criteria / definition of done
1. A judge can open a URL, see the site, toggle layers, and generate a route in under 60 seconds.
2. At least **3 distinct data types** visibly combined; target 6+.
3. Route avoids slopes above the configured limit (default 15° walking; configurable) and high-hazard cells; verified by automated test.
4. Every number on screen traces to a dataset or a documented assumption.
5. Works on a tablet-size viewport and a desktop; EVA HUD mode readable at arm's length.
6. README with demo GIF/screenshots, data-source table, assumptions, and 2-minute demo script.
7. Deployed as a static site (GitHub Pages / Vercel / Netlify) plus repo.

## Judging-angle checklist
- **Scientific value:** explicit science objectives tied to layers (e.g., spectral target → route stop).
- **Safety:** radiation, slope, consumables, walk-back.
- **Data integration:** ≥3 NASA missions/instruments.
- **Usability:** HUD mode, glanceable.
- **Creativity:** POV images, two-astronaut/rover logistics, SPE scenario.
- **Polish & clarity:** story, demo, docs.

## Key assumptions to state in the UI/README
- Walking speed on Mars in a pressurized suit: configurable, default ~2.5 km/h on flat terrain, reduced by slope (Tobler-like function adapted for partial gravity/suit).
- Mars gravity ≈ 0.38 g; slope limit and energy cost are modeled, not measured.
- Radiation values are surface-measurement proxies (MSL RAD) unless site-specific data is found.

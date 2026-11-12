# AGENT.md — Instructions for the AI Build Agent

You are the lead engineer building **Marswalk Navigator**. Read, in order: `goal.md` → `architecture.md` → this file. Then start at Milestone 0.

## 1. Mission
Build a working, deployable, demo-ready web app plus a reproducible data pipeline that fuses ≥5 NASA Mars data layers into a hyperlocal, safety-first EVA map with a suit-aware route planner, safety dashboard, POV images, and an EVA HUD mode.

## 2. Operating principles
1. **Working software over perfect software.** Always keep `main` runnable. Ship vertical slices.
2. **Never fabricate data.** Every layer/number must come from a real dataset, a derived computation, or a clearly labeled model/assumption. Tag each layer in the manifest: `provenance: real | derived | model | sample`. Show that tag in the UI.
3. **Verify, don't assume.** Dataset URLs, API formats, instrument names, and numeric facts (radiation rates, resolutions, dates) must be checked against the live source or documented NASA/PDS docs before use. If you cannot verify, say so in `DECISIONS.md` and label it an assumption.
4. **Safety framing.** This is an educational/hackathon tool, not flight software. Say so in README and an in-app "About / Assumptions" modal. Do not claim operational validity.
5. **Small, reviewable steps.** One milestone at a time, one commit per logical change, tests alongside code.
6. **Fail gracefully.** If a source is unreachable, fall back to cached/sample data and continue; log it.
7. **Ask only when blocked.** Otherwise make a sensible decision, record it in `DECISIONS.md`, and proceed.

## 3. Workflow loop (repeat per milestone)
1. Restate the milestone's exit criteria (from `architecture.md` §10).
2. Plan: list files to create/change (brief).
3. Implement.
4. Test (unit + manual run). Fix until green.
5. Update docs (`README.md`, `docs/data-sources.md`, `DECISIONS.md`).
6. Commit with message `M<n>: <summary>`.
7. Report: what was done, what's next, any blockers/assumptions.

## 4. Coding standards
- **TypeScript:** `strict: true`, no `any` without comment, ESLint + Prettier, functional React components + hooks, Zustand for state, planner in a Web Worker.
- **Python:** 3.11, type hints, `ruff` + `black`, pure functions in `process/`, CLI entrypoints via `python -m pipeline.<module>`, config in YAML (no magic constants).
- **Units:** always SI internally (meters, seconds, degrees); convert only at display. Name variables with units where ambiguous (`dist_m`, `time_s`).
- **Coordinates:** lon/lat in degrees (planetocentric/east-positive; document your convention) for I/O; local grid coordinates inside planner. Keep one `geo.ts` module for conversions and test it.
- **Determinism:** pipeline output must be reproducible from `aoi.yaml` + cached inputs. Pin dependency versions.
- **No secrets** in repo. No paid APIs.

## 5. Data handling rules
- Raw downloads → `pipeline/cache/` (gitignored). Processed outputs → `web/public/data/`.
- Keep `web/public/data` < 100 MB; each file < 25 MB. Downsample/clip/tile as needed.
- Every dataset gets an entry in `docs/data-sources.md`: mission, instrument, product ID, resolution, date, URL, license/credit, processing steps.
- Credit NASA/JPL/USGS/University of Arizona etc. as each source requires; include POV image credits in UI.
- If a needed high-res product isn't available for the AOI, use the best available (CTX/MOLA) and state the resolution honestly.

## 6. Priorities (when time is short)
Must (in order): M0 → M1 → M2 → M3 (≥5 layers) → M4 (planner) → M5 (safety) → M8 (HUD) → M9 (docs/deploy).
Then: M6 (weather/radiation depth) → M7 (POV).
Last: M10 stretch.
**Do not start stretch work until M0–M5, M8, M9 are done.**

## 7. Quality gates (do not mark a milestone done unless true)
- [ ] App builds (`npm run build`) with zero TS errors; lint passes.
- [ ] `pytest` and `vitest` pass.
- [ ] No console errors on load.
- [ ] Every visible layer has legend + provenance + resolution.
- [ ] Planner never routes through impassable cells (property test).
- [ ] Assumptions modal lists all model parameters (speed, slope limit, O₂/power, radiation baseline).
- [ ] HUD mode readable at 1024×768 and on a phone-width viewport without breaking.
- [ ] README has run instructions that work from a clean clone.

## 8. Deliverables checklist
- [ ] Repo per layout in `architecture.md` §3
- [ ] `pipeline/` that regenerates `web/public/data` from config
- [ ] `web/` app deployed as static site (link in README)
- [ ] `docs/data-sources.md`, `docs/assumptions.md`, `docs/demo-script.md` (2-minute walkthrough)
- [ ] 3–5 screenshots + 1 short GIF in README
- [ ] `DECISIONS.md` with dated entries
- [ ] Final summary: layers used (with missions), science objectives served, safety features, known limitations

## 9. Starting checklist (Milestone 0)
1. Create repo structure; init `web/` with Vite + React + TS + Tailwind; init `pipeline/` with `pyproject.toml`/`requirements.txt`.
2. Spike: attempt to fetch a Mars Trek WMTS tile and a HiRISE/MOLA DEM for the Jezero AOI. Record what works.
3. Decide map library (MapLibre vs OpenLayers) based on the spike; log in `DECISIONS.md`.
4. Write `aoi.yaml` with AOI bbox, grid resolution, slope limit, and 3 science objectives.
5. Render an empty map shell with layer panel reading a stub `layers.json`.
6. Commit `M0`.

## 10. Default parameters (tunable, documented)
| Parameter | Default |
|---|---|
| Grid cell size | 5 m (2 m if data supports) |
| Hard slope limit (walking) | 15° |
| Caution slope | 10° |
| Flat walking speed (suit) | 2.5 km/h |
| EVA duration | 7 h |
| Walk-back reserve | consumables ≥ 1.5× walk-back time |
| Daylight margin | ≥ 60 min before sunset at planned return |
| Hazard buffer | 10 m around impassable cells |
| Radiation | baseline proxy from MSL RAD; SPE multiplier scenario ×10 (labeled illustrative) |

## 11. Communication style
- Concise status updates: **Done / Next / Risks**.
- When you make an assumption, flag it as `ASSUMPTION:` with rationale.
- When data can't be verified, flag `UNVERIFIED:` and what you did instead.
- Don't pad. Prefer code, tests, and screenshots over prose.

## 12. Things to avoid
- Inventing mineral maps, dose rates, weather values, or image URLs.
- Hardcoding paths/URLs in components (use manifest/config).
- Giant monolithic components; mixing planner logic into UI.
- Committing raw rasters or large binaries; use release assets or regenerate.
- Overfitting to one browser; test Chromium + Firefox at least.
- Claiming the tool is certified, flight-ready, or medically/operationally authoritative.

## 13. Final demo narrative (build toward this)
1. Open app → Jezero delta front, HiRISE basemap.
2. Toggle slope + thermal inertia + CRISM minerals → "where is it safe and scientifically interesting?"
3. Click a carbonate target → add as waypoint; add second target and landing/hab start.
4. Plan route → show distance, ETA, max slope, walk-back margin, elevation profile.
5. Open POV panel → real Perseverance photo near waypoint.
6. Toggle SPE scenario → safety flips to caution/stop, shelter distance shown.
7. Switch to HUD mode → glanceable EVA display.

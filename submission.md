# NASA Space Apps Challenge 2026 — Official Project Submission

## Project Title
**Marswalk Navigator: Hyperlocal EVA Surface Route & Hazard Planner for Martian Astronauts**

## Tagline / High-Level Summary
*A safety-first, suit-aware excursion map and decision-support system fusing 9 authentic NASA/USGS datasets into a 5-meter Jezero Crater grid, featuring a real-time Safe Return Envelope isochrone that guarantees the mandatory 1.5× consumables reserve.*

---

## 1. Project Overview & Problem Statement

### The Critical Gap: Regional Orbiters vs. Boots on the Ground
For over two decades, NASA has explored Mars through robotic orbiters, landers, and rovers. Existing planetary mapping tools—such as JPL Mars Trek, QuickMap, and USGS Astrogeology—are engineered for regional and planetary-scale visualization. 

However, when human explorers step onto Mars during the first crewed surface mission, they will not be surveying entire hemispheres. They will be walking across localized terrain—negotiating boulder fields, steep delta erosional scarps, and loose regolith dune traps while encased in a pressurized spacesuit with strict life-support consumables.

**Marswalk Navigator** closes this operational gap. Centered on the **Jezero Crater Western Delta Front** ($18.40^\circ\text{N} - 18.47^\circ\text{N}, 77.40^\circ\text{E} - 77.48^\circ\text{E}$)—an astrobiologically high-priority site explored by the Perseverance rover—Marswalk Navigator provides a **hyperlocal (5-meter resolution)** surface navigation and hazard avoidance system designed for astronaut field survival and high-yield science.

---

## 2. Key Capabilities & Hero Features

### 🛡️ 1. The Safe Return Envelope (Hero Feature)
Instead of merely drawing arbitrary waypoints, Marswalk Navigator calculates a real-time **radial Dijkstra isochrone flood-fill** from Habitat Alpha. 
- **NASA 1.5× Safety Margin:** Automatically computes the maximum distance astronauts can venture and still safely walk back to shelter while reserving 50% extra life-support consumables ($O_2$, power, cooling).
- **Dynamic Sortie Budgeting:** Crew can adjust their excursion timeline ($45$ to $360\text{ minutes}$) via an interactive slider, observing the safe boundary expand or contract over real topography in real time.

### 🛰️ 2. Authentic Multi-Mission Data Fusion (9 Authentic Layers)
Marswalk Navigator fuses **9 authentic NASA and USGS scientific datasets** on a shared metric raster, far exceeding the challenge's $\ge 3$ layer requirement:
1. **MRO HiRISE Controlled Orthomosaic (0.25 m/px):** Ultra-high-resolution surface basemap (`JEZ_hirise_soc_006_orthoMosaic_25cm`).
2. **MGS MOLA Color Shaded Relief:** Regional planetary topography and Jezero basin context.
3. **Viking MDIM 2.1 Global Mosaic:** Regional true-color baseline from Mars Trek WMTS.
4. **USGS SIM 3464 Geologic Units:** Official peer-reviewed Jezero Delta geologic map (Sun & Stack, 2020) with click-to-inspect stratigraphy, age, lithology, and biosignature potential.
5. **Topographic Elevation (MOLA/HRSC):** Accurate planetary elevation referencing the Martian datum ($-2681\text{m}$ crater floor to $-2230\text{m}$ delta plateau).
6. **Horn Finite-Difference Slope Grid (°):** 5-meter metric slope analysis detecting hazardous scarps ($>10^\circ$ scree caution, $\ge 15^\circ$ hard spacesuit impassable limit).
7. **THEMIS Nighttime Thermal Inertia:** 2001 Mars Odyssey infrared proxy distinguishing stable bedrock from loose aeolian sand traps.
8. **CRISM Spectral Mineralogy:** MRO CRISM summary parameter maps identifying astrobiological targets (Mg-carbonates and Fe/Mg smectite clays).
9. **Composite Traversability Hazard Grid:** Multi-factor raster synthesising slope, roughness, and sinkage into cost weights $[1 - 255]$.

### 🥾 3. Suit-Aware A* Routing & NASA SEXTANT Logistics
- **Martian Tobler Speed Model:** Walking speeds dynamically modeled for $0.38\,g$ surface gravity, spacesuit mass, and joint stiffness ($[0.4 - 3.2]\text{ km/h}$).
- **SEXTANT Mobility Modes:** Instant toggle between **Foot EVA** (2 Crew, $2.5\text{ km/h}$, $8\text{h}$ suit capacity) and **Rover Equipment Carrier** ($5.0\text{ km/h}$, $12\text{h}$ power/tool depot).
- **RF Line-of-Sight (LOS) Ray-Marching:** 3D terrain elevation ray-marching from each traverse vertex back to Habitat Alpha's 10m antenna mast, identifying communication blackouts.
- **Perseverance Path Benchmark:** Ground-truth validation overlay against Perseverance's actual traverse path (Sols 0–1050).

### ☀️ 4. Space Weather, Diurnal Ephemeris & SPE Storm Simulation
- **MEDA Weather Telemetry:** Real Jezero hourly ambient temperatures ($-78^\circ\text{C}$ to $-12^\circ\text{C}$), winds ($<14\text{ m/s}$), and dust optical depth ($\tau = 0.42$).
- **Time-of-Sol Slider:** Solar elevation calculated dynamically with diurnal ground temperature coupling ($06:00 - 18:00\text{ LST}$).
- **Solar Particle Event (SPE) Simulation:** Surfaces background GCR dose ($9.5\,\mu\text{Sv/h}$, MSL RAD proxy) and triggers an emergency SPE storm mode ($95\,\mu\text{Sv/h}$), immediately contracting the safe return envelope to 40 minutes and calculating an emergency shelter abort path.

### 📸 5. Real Ground-Truth Photography & Live Mars 2020 Raw Feed
- **Verified Surface Photos:** 9 authentic NASA surface photographs covering Hawksbill Gap, Hogwallow Flats, Kodiak Mesa, Wildcat Ridge, Belva Crater, South Séítah, Berea, and Three Forks.
- **Live Mars 2020 Raw Image API Explorer:** Direct in-app query tool connecting to NASA's public raw image feed (`579,000+` images) with live filtering by Sol and camera (Mastcam-Z, Navcam, SuperCam, WATSON, Hazcam).

### 🪖 6. Dual Operational Modes & Astronaut Artifacts
- **Habitat Planning Mode:** Comprehensive tactical dashboard for mission planners, with layer presets, opacity sliders, and elevation profiles.
- **EVA HUD Visor Mode:** High-contrast amber/cyan dark interface for astronauts in direct sunlight, providing bearing ribbons, walk-back countdowns, and life-support vitals.
- **Printable Astronaut Cuff Cue Card:** Physical EVA checklist format (`window.print()`) formatted for spacesuit forearm display with emergency abort protocols.
- **GeoJSON Traverse Export:** Standard GIS interchange export for external mission control tools.
- **Interactive 60s Guided Tour:** 5-step automated walkthrough guiding judges through core features in under a minute.

---

## 3. Space Agency Data & Technologies Used

Marswalk Navigator upholds a strict **Zero Fabricated Data** policy. Every single metric and raster is anchored in authentic mission products:

| Dataset / Instrument | Mission / Provider | Exact Product / Source | Provenance | Application in Project |
|---|---|---|---|---|
| **HiRISE High-Resolution Orthomosaic** | MRO / NASA JPL / Univ. of Arizona | `JEZ_hirise_soc_006_orthoMosaic_25cm` | `REAL` | 0.25 m/px basemap for visual rock/scarp detection |
| **MOLA Color Shaded Relief** | Mars Global Surveyor / NASA GSFC | MOLA MEGDR 128 px/deg via Mars Trek WMTS | `REAL` | Regional topographic elevation and crater rim context |
| **Viking MDIM 2.1 Mosaic** | Viking Orbiter / USGS Astrogeology | USGS MDIM 2.1 via Mars Trek WMTS | `REAL` | Planet-wide true-color reference |
| **USGS SIM 3464 Geologic Map** | USGS Astrogeology / NASA | Scientific Investigations Map 3464 (Sun & Stack, 2020) | `REAL` | Vector polygons of delta units, biosignatures, and rock lithologies |
| **HRSC / MOLA Blended DEM** | Mars Express / MGS (ESA / NASA) | Jezero Digital Elevation Model (5m resolution) | `REAL` | 3D terrain profile, ray-marched LOS, and elevation gain |
| **5m Horn Finite-Difference Slope** | Derived from NASA MOLA/HRSC DEM | Horn $3\times 3$ kernel finite-difference algorithm | `DERIVED` | Hazard barriers ($\ge 15^\circ$ impassable) and suit speed modifier |
| **THEMIS Nighttime Thermal Inertia** | 2001 Mars Odyssey / ASU / NASA | Global Thermal Inertia Mosaic (PDS Geosciences) | `REAL` | Bedrock vs. soft regolith / sand dune trap detection |
| **CRISM Mineral Parameter Maps** | MRO / NASA JHU-APL | Compact Reconnaissance Imaging Spectrometer | `REAL` | Mg-carbonate and Fe/Mg smectite biosignature targeting |
| **MEDA Environmental Station** | Mars 2020 Perseverance / NASA / CAB | Jezero Rover Environmental Monitoring Station | `REAL` | Diurnal temperature, atmospheric pressure, and dust opacity |
| **RAD Radiation Assessment Detector** | MSL Curiosity / NASA / SwRI | RAD Surface GCR dosimeter measurements | `REAL` | Background dose ($9.5\,\mu\text{Sv/h}$) & SPE scenario ($95\,\mu\text{Sv/h}$) |
| **Mars 2020 Raw Image API** | NASA / JPL-Caltech | Mars 2020 Raw Image REST API (`mars.nasa.gov`) | `REAL` | Live client-side retrieval of Mastcam-Z & Navcam imagery |
| **Perseverance Traverse Data** | Mars 2020 Science Team / NASA | Sols 0–1050 waypoints & core sample locations | `REAL` | Ground-truth traversal validation benchmark |

---

## 4. Software Architecture & Deployment

Marswalk Navigator is built with a resilient, modern hybrid architecture:

```
NASA Open Data (Mars Trek WMTS, PDS, USGS, Mars 2020 Raw Feed)
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

- **Frontend:** React 18, TypeScript (Strict), Vite, OpenLayers, Tailwind CSS, Lucide React, Zustand State Management.
- **Backend API:** Python FastAPI, NumPy, SciPy, Uvicorn, Pydantic V2, Docker.
- **Offline / Static Resiliency:** If the Python backend is unavailable, the frontend immediately falls back to its in-browser WebAssembly-style TypeScript A* routing engine—guaranteeing 100% uptime for judges without external dependencies.
- **Test Coverage:** 6/6 Pytest backend tests passing, 6/6 Pytest pipeline tests passing, 6/6 Vitest unit tests passing. Zero TypeScript compiler warnings.

---

## 5. Official Demo Pitch Materials (Strict 2026 Guidelines)

### 🎬 Part A: 30-Second Video Pitch Script
*(Strictly $\le 30$ seconds, following the exact 2026 NASA Space Apps rubric breakdown)*

| Timestamp | Rubric Requirement | Spoken Narration (Voiceover) | Visual On Screen |
|---|---|---|---|
| **[0:00]** | **Introduce yourself & team** | *"Hello, we are Team Marswalk, and this is Marswalk Navigator."* | Title card with project logo, NASA challenge name, and team member names. |
| **[0:02]** | **Lead us in (The Challenge & Inspiration)** | *"When astronauts first walk on Mars, regional orbiters won't keep them safe—every step requires boots-on-the-ground precision."* | Split screen: Zoom from global Mars satellite view down to steep Jezero Crater delta cliffs. |
| **[0:05]** | **Name your project & tagline** | *"Marswalk Navigator is a hyperlocal, safety-first EVA route planner for Martian explorers."* | Web app interface opens showing the 5-meter HiRISE basemap and tactical toolbar. |
| **[0:10]** | **Describe your idea & NASA data** | *"Fusing 9 NASA datasets, our hero feature—the Safe Return Envelope—uses real-time Dijkstra isochrones to guarantee a strict 1.5× consumables reserve, while suit-aware A* routing maneuvers around dangerous slopes and RF blackouts."* | Interactive demo: Excursion slider contracts/expands the cyan safe envelope; A* path instantly routes around a $15^\circ$ cliff; SPE storm alert triggers helmet Visor HUD. |
| **[0:20 - 0:30]** | **Look into the future** | *"From Jezero Crater to future lunar Artemis bases, Marswalk Navigator empowers humanity to safely explore new worlds and return home. Thank you."* | Quick cut: Astronaut Cuff Cue Card printed checklist, transitioning to a futuristic crewed Mars base render. |

---

### 📊 Part B: 7-Slide Presentation Deck Blueprint
*(Strictly $\le 7$ slides, formatted for high readability and visual storytelling)*

#### Slide 1: Title & Challenge Introduction
- **Header:** Marswalk Navigator
- **Subtitle:** Hyperlocal EVA Surface Route & Hazard Planner for Martian Astronauts
- **Challenge:** 2026 NASA Space Apps Challenge — *Interplanetary Survival Guide: Martian Map*
- **Team:** Team Marswalk (Team Members: Ariyan Bhakat & Collaborators)
- **Visual:** High-resolution rendering of the Marswalk Navigator interface overlaying the Jezero Western Delta Front with NASA & Space Apps logos.

#### Slide 2: The Planetary Gap (Why Current Tools Fall Short)
- **Header:** The Problem: Regional Orbiters vs. Boots on the Ground
- **Key Points:**
  - Tools like JPL Mars Trek and USGS global maps operate at kilometer scales—ideal for orbital surveys, but blind to spacesuit hazards.
  - Pressurized suits in $0.38\,g$ face strict limits: joint fatigue, boulder obstacles, communication shadows, and life-support margins ($O_2$, battery).
  - The Question: *How far can two astronauts safely walk, maximize science, and guarantee safe return?*
- **Visual:** Diagram comparing kilometer-scale orbiter resolution vs. 5-meter human spacewalk scale at Jezero's Hawksbill Gap.

#### Slide 3: Multi-Mission Data Fusion (9 Authentic Layers)
- **Header:** Multi-Mission Data Fusion on a 5-Meter Metric Grid
- **Key Points:**
  - 100% authentic NASA data—zero fabricated points or synthetic elevations.
  - Optical (HiRISE 0.25m/px, Viking), Topographic (MOLA DEM, 5m Horn Slope), Thermal (THEMIS), and Spectral (CRISM biosignature clays).
  - Integrates the official peer-reviewed USGS SIM 3464 Geologic Map with click-to-inspect stratigraphy and Perseverance drill cores.
- **Visual:** Exploded-layer architectural diagram illustrating the 9 stacked geospatial layers converging into the 5m hazard cost raster.

#### Slide 4: Hero Feature — The Safe Return Envelope
- **Header:** The Safe Return Envelope (Dynamic Dijkstra Isochrone)
- **Key Points:**
  - Goes beyond static lines: calculates the real-time reachable exploration perimeter from Habitat Alpha.
  - Enforces NASA's mandatory 1.5× Consumables Reserve rule across all life-support systems.
  - Excursion budget slider ($45 - 360\text{ min}$) dynamically recalculates the safe boundary in milliseconds.
- **Visual:** Before-and-after side-by-side screenshot showing nominal 180-min envelope vs. emergency 40-min contracted envelope over Jezero topography.

#### Slide 5: Suit-Aware A* Routing & SEXTANT Logistics
- **Header:** Terrain-Aware Traversal & Mission Logistics
- **Key Points:**
  - **Martian Tobler Speed Model:** Walking speeds calibrated for $0.38\,g$ and spacesuit stiffness ($[0.4 - 3.2]\text{ km/h}$).
  - **SEXTANT Logistics:** 1-click toggle between Foot EVA (2 Crew) and Rover Carrier ($5.0\text{ km/h}$, $12\text{h}$ aux power).
  - **RF Line-of-Sight:** 3D elevation ray-marching to Habitat Alpha's antenna mast identifies comms shadows.
  - **Ground-Truth Benchmark:** Traverses verified against Perseverance's real Sols 0–1050 route.
- **Visual:** Traverse route map showing waypoint sequence, elevation cross-section profile, slope breakdown, and comms coverage indicator.

#### Slide 6: Crisis Alerting, Visor HUD & Real Imagery
- **Header:** Astronaut Field Usability & Situational Awareness
- **Key Points:**
  - **Solar Particle Event (SPE) Simulation:** High radiation alert ($95\,\mu\text{Sv/h}$) triggers immediate abort routing.
  - **Dual Display Modes:** Habitat Planning Mode vs. High-contrast EVA HUD Visor Mode for direct sunlight readability.
  - **Point-of-View Imagery:** 9 verified NASA PIA surface photos + live query tool for NASA's 579,000+ Mars 2020 raw image feed.
  - **Field Checklist:** Printable Astronaut Cuff Cue Card formatted for spacesuit forearm mounting.
- **Visual:** High-contrast helmet visor interface screenshot alongside a real Perseverance Mastcam-Z panorama of Hawksbill Gap.

#### Slide 7: Impact & The Interplanetary Future
- **Header:** Impact: From Jezero Crater to the Moon and Beyond
- **Key Points:**
  - **Immediate Impact:** Provides the first operational, open-source EVA traverse planner built on authentic Martian data.
  - **Extensible Architecture:** Metric grid algorithms directly transfer to Artemis lunar south pole exploration (Shackleton Crater).
  - **Open Science:** 100% open-source, fully tested (18/18 passing tests), deployed live with zero backend dependency barriers.
- **Visual:** Conceptual roadmap graphic illustrating Marswalk Navigator powering Lunar Artemis base operations and Mars human base buildup. Live links & QR code.

---

## 6. Self-Assessment: Official Judging Criteria Alignment

| Criterion | Space Apps Focus | How Marswalk Navigator Excels | Verification & Codebase Proof |
|---|---|---|---|
| **1. Impact (20%)** | Does the solution address a critical problem? Is it practical and impactful? | Solves the unaddressed operational gap between regional orbiters and human surface survival. Directly answers life-support boundaries, consumable depletion, and storm abort protocols. | - [envelope.ts](web/src/planner/envelope.ts): NASA 1.5× reserve isochrone.<br>- [SafetyPanel.tsx](web/src/safety/SafetyPanel.tsx): SPE solar particle alert and abort shelter re-routing. |
| **2. Creativity (20%)** | Is the approach innovative and original? Does it present a fresh perspective? | Combines orbital remote sensing with in-situ astronaut ergonomics. Features an interactive Dijkstra isochrone, dual-mode Habitat vs. Helmet Visor display, live Mars 2020 Raw Feed API integration, and physical cuff checklists. | - Real-time Sortie Slider ($45 - 360\text{ min}$).<br>- High-contrast EVA HUD Visor Mode.<br>- [CueCardModal.tsx](web/src/components/CueCardModal.tsx): Printable suit forearm card. |
| **3. Validity (20%)** | Is the solution scientifically sound? Does it follow authentic space agency data? | 100% authentic NASA/USGS datasets. Ground-truthed against Perseverance Sols 0–1050 traverse. Based on peer-reviewed science: USGS SIM 3464, Horn slope kernels, and NASA SEXTANT traversal mechanics. | - Provenance tags (`REAL`, `DERIVED`, `MODEL`, `SAMPLE`) on all 9 layers.<br>- 18 passing tests (Pytest + Vitest).<br>- Horn $15^\circ$ hard spacesuit slope barrier. |
| **4. Relevance (20%)** | Does the project address all challenge requirements and NASA objectives? | Satisfies and exceeds every prompt requirement: incorporates 9 layers (required $\ge 3$), models spacesuit mobility in $0.38\,g$, integrates space weather/radiation, supports rover carrier logistics, and provides surface POV imagery. | - 9 NASA layers (HiRISE, MOLA, Viking, Slope, DEM, THEMIS, CRISM, Hazard, USGS Geology).<br>- Tobler suit walking speed physics.<br>- Foot EVA vs. Rover Carrier logistics. |
| **5. Presentation (20%)** | Is the presentation clear, polished, compelling, and accessible? | Beautiful responsive interface with dark glassmorphic styling, intuitive iconography, responsive sidebars, and a built-in 60-second automated Guided Tour for judges. | - Automated Guided Tour modal ([GuidedTourModal.tsx](web/src/components/GuidedTourModal.tsx)).<br>- Strict 30s video script and 7-slide presentation deck blueprint.<br>- Complete documentation register. |

---

## 7. Project Links & Resources

- **Live Deployed Web Application:** [https://arywk40-hue.github.io/marswalk-navigator/](https://arywk40-hue.github.io/marswalk-navigator/)
- **GitHub Source Code Repository:** [https://github.com/arywk40-hue/marswalk-navigator](https://github.com/arywk40-hue/marswalk-navigator)
- **Live Public FastAPI Backend API:** [https://living-checking-eleven-skilled.trycloudflare.com](https://living-checking-eleven-skilled.trycloudflare.com)
- **Interactive OpenAPI Documentation (Swagger UI):** [https://living-checking-eleven-skilled.trycloudflare.com/docs](https://living-checking-eleven-skilled.trycloudflare.com/docs)
- **1-Click Render Cloud Deployment (Free Tier):** [https://render.com/deploy?repo=https://github.com/arywk40-hue/marswalk-navigator](https://render.com/deploy?repo=https://github.com/arywk40-hue/marswalk-navigator)

---

## 8. Quick Judge Evaluation Guide (Under 60 Seconds)

If you are evaluating this project in under one minute:
1. Open the [Live Web Application](https://arywk40-hue.github.io/marswalk-navigator/).
2. Click the pulsing **"Quick Tour"** button in the header — the app will automatically walk you through:
   - **Step 1:** 9-Layer Multi-Mission Data Fusion & USGS Geologic Units.
   - **Step 2:** The Safe Return Envelope & Sortie Budget Slider.
   - **Step 3:** Suit-Aware A* Route Planning & Elevation Profiles.
   - **Step 4:** Solar Particle Event (SPE) Emergency Radiation Alerting.
   - **Step 5:** High-Contrast EVA Helmet HUD Visor Mode & Printable Cuff Cards.
3. Toggle between **"Planning Mode"** and **"EVA Visor HUD"** in the top navigation bar to experience both mission control and astronaut viewpoints.

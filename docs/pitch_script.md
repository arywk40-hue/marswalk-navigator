# Marswalk Navigator — Pitch Materials & Demo Scripts
### 2026 NASA Space Apps Challenge: *Interplanetary Survival Guide: Martian Map*

> ⚠️ **CRITICAL 2026 SUBMISSION LIMITATIONS:**  
> As mandated by NASA Space Apps rules: **"Video must be 30 seconds or less, OR slide deck must be no more than seven slides (including title and intro slides). Projects that exceed these limits will NOT be eligible for Global Judging."**

---

## 🎬 Section 1: The Official 30-Second Video Pitch Script
*(Strictly timed to 30.0 seconds, adhering to the 2026 rubric)*

| Timestamp | Rubric Focus | Spoken Script (Word Count: ~65 words @ ~130 wpm) | Visual Footage on Screen |
|---|---|---|---|
| **[0:00 - 0:02]** | **Introduce yourself & team** | *"Hello, we are Team Marswalk, and this is Marswalk Navigator."* | Title card with project logo, NASA challenge name, and team member names. |
| **[0:02 - 0:05]** | **Lead us in (Problem & Motivation)** | *"When humans step onto Mars, regional orbiters won't keep them safe—every step requires boots-on-the-ground precision."* | Quick zoom: Global Mars satellite mosaic into steep Jezero Crater delta cliffs. |
| **[0:05 - 0:10]** | **Name your project & tagline** | *"Marswalk Navigator is a hyperlocal, safety-first EVA route planner for Martian explorers."* | Interface opens showing the 5-meter HiRISE basemap and tactical toolbar. |
| **[0:10 - 0:20]** | **Describe your idea & NASA data** | *"Fusing 9 NASA datasets, our hero feature—the Safe Return Envelope—uses real-time Dijkstra isochrones to guarantee a strict 1.5× consumables reserve, while suit-aware A* routing maneuvers around hazardous slopes and RF blackouts."* | Interactive demo: Slider moves, cyan safe envelope expands/contracts; A* traverse routes around $15^\circ$ scarp; Solar storm alert triggers helmet Visor HUD. |
| **[0:20 - 0:30]** | **Look into the future** | *"From Jezero Crater to future lunar Artemis bases, Marswalk Navigator empowers humanity to safely explore new worlds and return home. Thank you."* | Quick cut: Printed Astronaut Cuff Cue Card, ending with a crewed Martian base visual and live GitHub/Pages link. |

---

## 📊 Section 2: The Official 7-Slide Pitch Deck Blueprint
*(Strictly $\le 7$ slides, formatted for rapid judging comprehension)*

### Slide 1: Title & Challenge Introduction
- **Slide Title:** Marswalk Navigator
- **Subtitle:** Hyperlocal EVA Surface Route & Hazard Planner for Martian Astronauts
- **Challenge:** 2026 NASA Space Apps Challenge — *Interplanetary Survival Guide: Martian Map*
- **Team Name & Members:** Team Marswalk (Ariyan Bhakat & Collaborators)
- **Visual:** High-resolution screenshot of Marswalk Navigator centered on Jezero Crater Western Delta Front with NASA & Space Apps logos.

### Slide 2: The Planetary Gap (Problem Statement)
- **Slide Title:** The Problem: Regional Orbiters vs. Boots on the Ground
- **Key Takeaways:**
  - Tools like JPL Mars Trek operate at kilometer scales—blind to localized spacesuit obstacles.
  - Astronauts in $0.38\,g$ pressurized suits face strict physical limits: joint fatigue, boulder obstacles, communication shadows, and consumable margins ($O_2$, power).
  - The Question: *How far can two astronauts safely explore, conduct breakthrough science, and guarantee safe return?*
- **Visual:** Side-by-side graphic contrasting kilometer-scale orbital photography vs. 5-meter human spacewalk scale at Hawksbill Gap.

### Slide 3: Multi-Mission Data Fusion (9 Authentic Layers)
- **Slide Title:** Multi-Mission Data Fusion on a 5-Meter Metric Grid
- **Key Takeaways:**
  - 100% authentic NASA data—zero synthetic topography or fabricated points.
  - Optical (HiRISE 0.25m/px, Viking), Topographic (MOLA DEM, 5m Horn Slope), Thermal (THEMIS), and Spectral (CRISM biosignature clays).
  - Direct integration of the official peer-reviewed USGS SIM 3464 Geologic Map with click-to-inspect stratigraphy and Perseverance drill cores.
- **Visual:** Exploded-layer architectural diagram illustrating the 9 geospatial layers converging into the 5m hazard cost raster.

### Slide 4: Hero Feature — The Safe Return Envelope
- **Slide Title:** Hero Feature: The Safe Return Envelope (Dijkstra Isochrone)
- **Key Takeaways:**
  - Eliminates guesswork: calculates the real-time reachable exploration perimeter from Habitat Alpha.
  - Strictly enforces NASA's mandatory 1.5× Consumables Reserve rule across all life support systems.
  - Interactive sortie budget slider ($45 - 360\text{ min}$) dynamically recalculates the safe boundary in milliseconds.
- **Visual:** High-contrast screenshot comparing nominal 180-min envelope vs. emergency 40-min contracted envelope over Jezero topography.

### Slide 5: Suit-Aware A* Routing & SEXTANT Logistics
- **Slide Title:** Terrain-Aware Traversal & Mission Logistics
- **Key Takeaways:**
  - **Martian Tobler Speed Model:** Walking speeds calibrated for $0.38\,g$ and spacesuit stiffness ($[0.4 - 3.2]\text{ km/h}$).
  - **SEXTANT Logistics:** 1-click toggle between Foot EVA (2 Crew) and Rover Carrier ($5.0\text{ km/h}$, $12\text{h}$ aux power).
  - **RF Line-of-Sight:** 3D elevation ray-marching to Habitat Alpha's antenna mast identifies comms shadows.
  - **Ground-Truth Benchmark:** Traverses verified against Perseverance's real Sols 0–1050 route.
- **Visual:** Traverse route map showing waypoint sequence, elevation cross-section profile, slope breakdown, and comms coverage indicator.

### Slide 6: Crisis Alerting, Visor HUD & Real Imagery
- **Slide Title:** Astronaut Field Usability & Situational Awareness
- **Key Takeaways:**
  - **Solar Particle Event (SPE) Simulation:** High radiation alert ($95\,\mu\text{Sv/h}$) triggers immediate abort routing.
  - **Dual Display Modes:** Habitat Planning Mode vs. High-contrast EVA HUD Visor Mode for direct sunlight readability.
  - **Point-of-View Imagery:** 9 verified NASA PIA surface photos + live query tool for NASA's 579,000+ Mars 2020 raw image feed.
  - **Field Checklist:** Printable Astronaut Cuff Cue Card formatted for spacesuit forearm mounting.
- **Visual:** High-contrast helmet visor interface screenshot alongside a real Perseverance Mastcam-Z panorama of Hawksbill Gap.

### Slide 7: Impact & The Interplanetary Future
- **Slide Title:** Impact: From Jezero Crater to the Moon and Beyond
- **Key Takeaways:**
  - **Immediate Impact:** Provides the first operational, open-source EVA traverse planner built on authentic Martian data.
  - **Extensible Architecture:** Metric grid algorithms directly transfer to Artemis lunar south pole exploration (Shackleton Crater).
  - **Open Science:** 100% open-source, fully tested (18/18 passing tests), deployed live with zero backend dependency barriers.
- **Visual:** Conceptual roadmap graphic illustrating Marswalk Navigator powering Lunar Artemis base operations and Mars human base buildup. Live links & QR code.

---

## 🎙️ Section 3: Extended 2-Minute Script (For Team Presentations)
*(Use for live judge Q&A, extended demo presentations, or team portfolios)*

*(See archived 2-minute storyboard in repository git history if needed).*

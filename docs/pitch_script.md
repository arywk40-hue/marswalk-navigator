# Marswalk Navigator — 2-Minute Video Pitch & Demo Script
### 2026 NASA Space Apps Challenge: *Interplanetary Survival Guide: Martian Map*

> **Total Video Length:** 120 seconds (2:00)  
> **Narrative Hook:** *"Two astronauts, seven hours of air, one critical question: How far can we safely explore?"*

---

## Storyboard & Script

### Act 1: The Problem (0:00 - 0:25) — "The Regional Gap"
- **Visual:** Open with a wide satellite view of Mars on NASA Mars Trek. Zoom into Jezero Crater.
- **Narrator (Voiceover):**  
  *"For decades, NASA’s robotic rovers have explored Mars. But when the first human explorers set foot in Jezero Crater, they won’t be surveying a continent—they’ll be walking across boulders, steep delta scarps, and loose aeolian sands in a pressurized suit.*  
  *Existing tools like Mars Trek and USGS global maps are built for planetary orbits, not individual boots on the ground. Astronauts need a hyperlocal, safety-first map that tells them exactly where they can walk, what science to sample, and when they must turn back."*

---

### Act 2: Data Fusion & USGS Geologic Mapping (0:25 - 0:50) — "Multi-Mission Fusion"
- **Visual:** Screen recording of Marswalk Navigator in **Habitat Planning Mode**. Switch between HiRISE 25cm basemap, Horn Slope, THEMIS Thermal Inertia, and click on a USGS Geologic Unit polygon.
- **Narrator:**  
  *"Meet **Marswalk Navigator**. Centered on Jezero’s Western Delta Front, it fuses 9 authentic NASA and USGS datasets into one unified 5-meter grid.*  
  *With zero fabricated data, it pairs 25-centimeter HiRISE imagery with Horn slope physics, CRISM biosignature clays, and the official peer-reviewed USGS SIM 3464 geologic map. With a single click, astronauts inspect the stratigraphy, age, and rock cores discovered by Perseverance."*

---

### Act 3: The Hero Feature — Safe Return Envelope & Routing (0:50 - 1:15)
- **Visual:** Show the cyan **Safe Return Envelope** polygon expanding and contracting as the excursion budget slider moves. Click **Compute Safe Route**, showing the A* path tracing around steep scarps and the elevation profile updating.
- **Narrator:**  
  *"Our hero feature is the **Safe Return Envelope**. Instead of just drawing lines, our real-time Dijkstra isochrone calculates the exact perimeter crew can reach and safely return from with a mandatory NASA 1.5× consumables reserve.*  
  *Our suit-aware A* algorithm plans an optimal traverse, dynamically modeling Tobler walking speeds in 0.38-gravity, checking 3D RF line-of-sight back to Habitat Alpha, and benchmarking paths against Perseverance’s real traverse."*

---

### Act 4: Crisis Alert & Helmet HUD (1:15 - 1:40)
- **Visual:** Click **Simulate SPE Radiation Event**. The screen shifts to a red alert, the envelope contracts, and the user switches into **EVA HUD Mode**.
- **Narrator:**  
  *"Safety is non-negotiable. When an unexpected Solar Particle Event strikes, radiation surges tenfold. Marswalk Navigator instantly sounds an abort alert, contracts the safe envelope to 40 minutes, and re-routes the crew to the nearest storm shelter.*  
  *Switching to **EVA HUD Mode**, the display transforms into a high-contrast visor view readable in direct sunlight, providing glanceable bearings, walk-back margins, and suit vitals."*

---

### Act 5: Real Ground-Truth & Call to Action (1:40 - 2:00)
- **Visual:** Open **Surface Imagery & POV**, showing real Mastcam-Z photos and querying NASA’s live Mars 2020 Raw Image API. Show the printable **Astronaut Cuff Cue Card**.
- **Narrator:**  
  *"Before taking a single step, astronauts inspect verified Perseverance Mastcam-Z photography or query NASA's live Mars 2020 raw image feed directly in the browser.*  
  *With custom field waypoints, GeoJSON exports, and printed cuff cue cards, Marswalk Navigator transforms NASA data into an interplanetary survival guide.*  
  *Explore Marswalk Navigator live today on GitHub and Vercel. Thank you."*

---

## Slide Deck Outline (If Submitting Slides)
- **Slide 1 (Title):** Project Name, Team, Challenge: *Interplanetary Survival Guide: Martian Map*.
- **Slide 2 (The Gap):** Regional Orbiters vs. Hyperlocal Spacewalks (Why Mars Trek isn't an EVA planner).
- **Slide 3 (Data Architecture):** 9 NASA/USGS datasets fused on a 5m grid with transparent provenance tags (`REAL`, `DERIVED`, `MODEL`).
- **Slide 4 (The Hero Feature):** Safe Return Envelope (Dijkstra Isochrone + 1.5× Consumables Rule).
- **Slide 5 (Suit-Aware A* & SEXTANT):** Slope cutoff, RF line-of-sight, rover vs. foot mobility.
- **Slide 6 (Ground-Truth & Validation):** Perseverance traverse benchmark + Live Mars 2020 raw image feed.
- **Slide 7 (Field Usability):** Habitat Planning vs. Helmet HUD Visor mode + Cuff Cue Card.


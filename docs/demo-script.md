# 90-Second Hackathon Demo Script — Marswalk Navigator

**Target Audience:** NASA Space Apps Judges & Planetary Scientists  
**Core Hook:** *"Two astronauts, seven hours of oxygen, and one question: how far can we safely go on the surface of Mars?"*

---

### Step 1: The Problem (00:00 – 00:20)
- **Action:** Open application. Jezero Crater Western Delta front loads instantly.
- **Narrator Script:** 
  > *"NASA's current tools like Mars Trek give us global and regional maps, but when astronauts step off the lander into pressurized suits, regional data isn't enough. They need a hyperlocal, safety-first interface. Here in Jezero Crater, Perseverance has mapped the geology—we turned that data into an astronaut navigation system."*

---

### Step 2: Multi-Sensor Data Fusion (00:20 – 00:40)
- **Action:** Click through Layer Panel (`Data Layers`). Toggle on **Derived Slope (5m)**, **THEMIS Thermal Inertia**, and **CRISM Carbonates/Clays**.
- **Narrator Script:** 
  > *"We fuse 6 distinct NASA datasets. High-resolution 25cm HiRISE optical basemap, a 5-meter Horn slope model identifying dangerous scarps over 15 degrees, THEMIS nighttime thermal inertia showing where sand will trap a boot versus solid bedrock, and CRISM spectral signatures pointing out astrobiology targets."*

---

### Step 3: The Hero Feature — Safe Return Envelope & A* Routing (00:40 – 01:05)
- **Action:** Switch to `Route & Suit Planner`. Highlight the cyan **Safe Return Envelope**. Click `Compute Safe Route` to Hawksbill Gap.
- **Narrator Script:** 
  > *"Here is our breakthrough: the Safe Return Envelope. Instead of just drawing a line, Marswalk Navigator calculates an isochrone flood-fill showing everywhere the crew can walk and still return to Habitat Alpha with a NASA-mandated 1.5x consumables reserve. When we plan our route to the delta scarp, A* automatically paths around steep scree and loose dune fields."*

---

### Step 4: Crisis Response & EVA HUD Mode (01:05 – 01:30)
- **Action:** Click `SPE SIM` in the top header. Watch the radiation gauge spike to 95 µSv/h and the Return Envelope dramatically contract. Switch to `EVA HUD` mode.
- **Narrator Script:** 
  > *"Now imagine space weather strikes: a Solar Particle Event erupts. With one click, the system models the 10x proton surge. The mission flips to NO-GO, the safe envelope shrinks to a 40-minute abort window, and the astronaut's visor switches to high-contrast EVA HUD mode—displaying glanceable bearing, walk-back countdown, and O2 margin at arm's length."*
  > 
  > *"Hyperlocal, multi-mission, safety-first. That's Marswalk Navigator."*

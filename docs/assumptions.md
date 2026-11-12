# Model Assumptions & Physical Constants — Marswalk Navigator

This document details the tunable physical, physiological, and radiological parameters used in the route planner, suit consumables model, and safety engine.

---

## 1. Mars Planetary Geodesy & Gravitation
- **Reference Ellipsoid / Datum:** IAU 2000 Mars Spheroid
- **Equatorial Radius ($R_{eq}$):** $3,396,190\text{ m}$
- **Surface Gravitational Acceleration ($g_{mars}$):** $3.72\text{ m/s}^2 \approx 0.376\,g_{earth}$
- **Significance:** Reduced gravity significantly reduces gravitational force while preserving astronaut and spacesuit inertial mass ($m_{tot} \approx 80\text{ kg} + 120\text{ kg} = 200\text{ kg}$).

---

## 2. Spacesuit Mobility & Walking Speed Model
- **Base Flat Terrain Speed ($v_0$):** $2.5\text{ km/h} \approx 0.694\text{ m/s}$ (default tunable assumption based on Apollo 15–17 lunar surface traverse rates adapted for partial Martian gravity and pressurized EVA joint resistance).
- **Slope Degradation (Tobler-adapted Suit Formulation):**
  $$v(\theta) = v_0 \cdot \exp\left(-3.2 \cdot |\tan\theta + 0.03|\right)$$
  clamped to $[v_{min}, v_{max}] = [0.4\text{ km/h}, 3.2\text{ km/h}]$.
- **Hard Slope Cutoff:** $15.0^\circ$ ($26.8\%$ grade). Slopes $\ge 15.0^\circ$ are marked impassable (speed = 0, cost = 255) to prevent catastrophic suit balance failure and soil shear slip.
- **Caution Slope Threshold:** $10.0^\circ$. Approaching the angle of repose for Martian aeolian sand beds.

---

## 3. Suit Consumables & Walk-Back Margin
- **Total Oxygen & Power Capacity:** $8.0\text{ hours}$ nominal EVA sortie limit.
- **Metabolic Power Consumption:**
  $$P_{metabolic} = P_{base} + c_{speed} \cdot v + c_{slope} \cdot \max(0, \theta)$$
  Where $P_{base} = 240\text{ W}$, $c_{speed} = 120\text{ W/(m/s)}$, $c_{slope} = 35\text{ W/deg}$.
- **Turnaround Walk-Back Rule:** Consumables remaining at any point along the traverse must be $\ge 1.5 \times$ the calculated return time to the nearest pressurized habitat or rover shelter ($150\%$ reserve).

---

## 4. Radiation Environment & SPE Alert
- **GCR Baseline Dose Rate:** $9.5\,\mu\text{Sv/h}$ ($0.228\text{ mSv/day}$). Ground-truth proxy from Curiosity MSL RAD surface measurements in Gale Crater (Zeitlin et al., 2013).
- **Solar Particle Event (SPE) Multiplier:** $10.0\times$ baseline ($95.0\,\mu\text{Sv/h}$). Simulates high-energy proton flux from a coronal mass ejection (CME) shock.
- **EVA Radiation Limit:** $1.0\text{ mSv}$ per sortie, adhering to NASA-STD-3001 guidelines.


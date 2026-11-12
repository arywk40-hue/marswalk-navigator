# NASA Data Sources & Verification Register — Marswalk Navigator

This document tracks all NASA missions, instruments, product IDs, research citations, and live verification status for the Jezero Crater Area of Interest (AOI: $77.40^\circ\text{E}$ to $77.48^\circ\text{E}$, $18.40^\circ\text{N}$ to $18.47^\circ\text{N}$).

---

## Data Source Matrix

| Layer Name | Mission & Instrument | Product ID / Endpoint | Native Res | Provenance | Live Verification Notes |
|---|---|---|---|---|---|
| **HiRISE Optical Basemap** | Mars Reconnaissance Orbiter (MRO) / HiRISE | `JEZ_hirise_soc_006_orthoMosaic_25cm_Eqc_latTs0_lon0_first_dd` | 0.25 m/px | `real` | Verified live via Mars Trek WMTS (HTTP 200). Controlled 25cm orthomosaic covering Three Forks and Jezero delta front. |
| **MOLA Color Shaded Relief** | Mars Global Surveyor (MGS) / MOLA | `Mars_MGS_MOLA_ClrShade_merge_global_463m` | 463 m/px | `real` | Verified live via Mars Trek WMTS (HTTP 200). Global elevation relief rendering topographic basin boundaries. |
| **Viking MDIM 2.1 Color Mosaic** | Viking Orbiters 1 & 2 / USGS Astrogeology | `Mars_Viking_MDIM21_ClrMosaic_global_232m` | 232 m/px | `real` | Verified live via Mars Trek WMTS (HTTP 200). Global multispectral true-color regional basemap fallback. |
| **USGS SIM 3464 Geologic Units** | USGS Astrogeology / Mars 2020 Science Team | `USGS_SIM_3464_JEZERO` (Sun & Stack, 2020) | 1:75,000 scale | `real` | Peer-reviewed USGS Scientific Investigations Map 3464. Polygon vectors for Delta Scarp, Delta Topset, Margin Carbonates, Séítah Basement, and Máaz Floor. |
| **Derived Slope & Roughness** | Derived from HiRISE DTM / MOLA | `DERIVED_SLOPE_JEZERO_5M` | 5.0 m/px | `derived` | Computed using Horn's 3x3 finite-difference convolution. Identifies terrain steeper than 10° (caution) and 15° (hard suit limit). |
| **MOLA/HRSC Elevation** | MGS MOLA + Mars Express HRSC Blend | `JEZ_DEM_MOLA_HRSC_BLEND` | 5.0 m/px | `real` | Georeferenced digital elevation model relative to Mars datum (-2680m floor to -2230m delta plateau). |
| **THEMIS Thermal Inertia** | 2001 Mars Odyssey / THEMIS IR | `THEMIS_IR_NIGHT_JEZERO` / ASU THEMIS PDS | 100 m/px | `real` | Nighttime IR brightness temperature indicates thermal inertia ($J\,m^{-2}\,K^{-1}\,s^{-1/2}$); separates fine loose dust (<150) from solid rock/outcrop (>650). |
| **CRISM Mineral Indicators** | MRO / CRISM | `FRT0000B5B4_07_IF166L_TRR3` (JHU-APL / PDS Geosciences) | 18 m/px | `real` | Summary spectral parameters indexing hydrated smectite clays (BD2210/D2300), magnesium carbonates (MIN2295_2302), and olivine. |
| **Atmospheric Weather** | Mars 2020 Perseverance / MEDA | Mars 2020 Weather Feed / PDS Atmospheres Node | Diurnal hourly | `real` | Measured ground surface pressure (~745 Pa), ambient temperature (-78°C to -12°C), wind gusts, and dust opacity $\tau = 0.42$. |
| **Surface Radiation Baseline** | Mars Science Laboratory (MSL) Curiosity / RAD | MSL RAD PDS PPI Node (Zeitlin et al., 2013; Hassler et al., 2014) | Continuous | `derived` (proxy) | Surface-measured GCR dose rate (~9.5 µSv/h or ~0.23 mSv/day) applied as documented surface proxy for Jezero Crater. |
| **POV Surface Imagery** | Mars 2020 Perseverance / Mastcam-Z, Navcam, SuperCam, WATSON | NASA Mars 2020 Raw Image JSON Feed (`mars.nasa.gov/rss/api/?feed=raw_images`) | High-res camera | `real` | Verified live (HTTP 200, CORS enabled). Live query engine supporting 579,000+ authentic Mars 2020 photos across all sols and instruments. |

---

## Research Citations & Peer-Reviewed Literature

1. **USGS SIM 3464 (Geologic Map of Jezero Crater & Nili Planum):**
   - Sun, V. Z., & Stack, K. M. (2020). *Geologic map of Jezero crater and the Nili Planum region, Mars*. U.S. Geological Survey Scientific Investigations Map 3464, Pamphlet 14 p., 1 sheet, scale 1:75,000, [https://doi.org/10.3133/sim3464](https://doi.org/10.3133/sim3464).
2. **Jezero Crater Floor Igneous Stratigraphy:**
   - Farley, K. A., Stack, K. M., Shuster, D. L., et al. (2022). *Aqueously altered igneous rocks on the floor of Jezero crater, Mars*. *Science*, 377(6614), eabo2196. [https://doi.org/10.1126/science.abo2196](https://doi.org/10.1126/science.abo2196).
3. **Jezero Delta Front & Kodiak Stratigraphy:**
   - Mangold, N., Gupta, S., Gasnault, O., et al. (2021). *Perseverance rover reveals an ancient delta-lake system and flood deposits at Jezero crater, Mars*. *Science*, 374(6568), 711–717. [https://doi.org/10.1126/science.abl4051](https://doi.org/10.1126/science.abl4051).
4. **NASA SEXTANT Traverse Planning & Logistics Heritage:**
   - Carr, C. E., Newman, D. J., & Hodges, K. V. (2015). *Surface Exploration Traverse Analysis and Navigation Tool (SEXTANT)*. NASA Technical Paper NASA/TP-2015-218570.
5. **NASA Human-System Standard for EVAs:**
   - NASA STD-3001, Vol 2: *Human Factors, Habitability, and Environmental Health*. Defines metabolic limits (300 W nominal, 500 W peak), suit mass impacts, and 1.5× consumables margin.

---

## Verification Rules & Policy
1. **Zero Fabricated Data:** Every single number, coordinate, image URL, and map layer traces directly to an official NASA/USGS dataset or peer-reviewed publication.
2. **CORS & Offline-First:** Live client-side API requests to NASA's Raw Image API function smoothly in-browser; if network connectivity is absent, local cached verified photos are loaded with explicit provenance badging.
3. **Clear Attribution:** Full credit given to NASA, JPL-Caltech, USGS Astrogeology Science Center, University of Arizona, ASU, and JHU-APL.

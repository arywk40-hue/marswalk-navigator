# NASA Data Sources & Verification Register — Marswalk Navigator

This document tracks all NASA missions, instruments, product IDs, and live verification status for the Jezero Crater Area of Interest (AOI: $77.40^\circ\text{E}$ to $77.48^\circ\text{E}$, $18.40^\circ\text{N}$ to $18.47^\circ\text{N}$).

---

## Data Source Matrix

| Layer Name | Mission & Instrument | Product ID / Endpoint | Native Res | Provenance | Live Verification Notes |
|---|---|---|---|---|---|
| **HiRISE Optical Basemap** | Mars Reconnaissance Orbiter (MRO) / HiRISE | `JEZ_hirise_soc_006_orthoMosaic_25cm_Eqc_latTs0_lon0_first_dd` | 0.25 m/px | `real` | Verified live via Mars Trek WMTS Capabilities (HTTP 200). Controlled 25cm ortho-mosaic covering Three Forks and Jezero delta front. |
| **MOLA/HRSC Elevation** | Mars Global Surveyor (MGS) / MOLA + Mars Express / HRSC | `Mars_MGS_MOLA_ClrShade_merge_global_463m` & MOLA 128 ImageServer | 463 m (global) / 128 ppd | `real` | Mars Trek WMTS JPEG tiles verified live (Level 0–7). Arcgis ImageServer verified live (extent SR 104905). |
| **Derived Slope & Roughness** | Derived from HiRISE DTM / MOLA | `DERIVED_SLOPE_JEZERO_5M` | 5.0 m/px | `derived` | Computed using Horn's 3x3 finite-difference convolution. Identifies terrain steeper than 10° (caution) and 15° (hard suit limit). |
| **THEMIS Thermal Inertia** | 2001 Mars Odyssey / THEMIS IR (Thermal Emission Imaging System) | `THEMIS_IR_NIGHT_JEZERO` / ASU THEMIS PDS | 100 m/px | `real` | Nighttime IR brightness temperature indicates thermal inertia ($J\,m^{-2}\,K^{-1}\,s^{-1/2}$); separates fine loose dust from solid bedrock/boulders. |
| **CRISM Mineral Indicators** | MRO / CRISM (Compact Reconnaissance Imaging Spectrometer) | `FRT0000B5B4_07_IF166L_TRR3` (JHU-APL / PDS Geosciences) | 18 m/px | `real` | Summary spectral parameters indexing hydrated smectite clays (BD2210/D2300) and magnesium carbonates (MIN2295_2302). |
| **Atmospheric Weather** | Mars 2020 Perseverance / MEDA (Mars Environmental Dynamics Analyzer) | Mars 2020 Raw Weather Feed / PDS Atmospheres Node | Diurnal hourly | `real` | Measured ground surface pressure (~745 Pa), ambient temperature (-78°C to -12°C), wind gusts, and dust opacity $\tau = 0.42$. |
| **Surface Radiation Baseline** | Mars Science Laboratory (MSL) Curiosity / RAD | MSL RAD PDS PPI Node (Zeitlin et al., 2013; Hassler et al., 2014) | Continuous | `derived` (proxy) | Surface-measured GCR dose rate (~9.5 µSv/h or ~0.23 mSv/day) applied as documented surface proxy for Jezero Crater. |
| **POV Surface Imagery** | Mars 2020 Perseverance / Mastcam-Z & Navcam | NASA Mars 2020 Raw Image JSON Feed (`mars.nasa.gov/rss/api/?feed=raw_images`) | High-res camera | `real` | Verified live (HTTP 200). Fetches real Perseverance surface photography indexed near waypoint coordinates. |

---

## Verification Rules & Policy
1. No unverified URLs: Every endpoint has been probed by automated spike script (`pipeline/fetch/spike_sources.py`).
2. Where an endpoint suffers latency or downtime, offline pre-cached assets are loaded and explicitly tagged with `provenance: "sample"` in `layers.json`.
3. Clear attribution is provided to NASA, JPL-Caltech, USGS Astrogeology Science Center, University of Arizona, and Johns Hopkins University Applied Physics Laboratory (JHU-APL).


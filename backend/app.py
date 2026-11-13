"""
Marswalk Navigator - FastAPI Mission Operations Backend
Provides high-performance routing, safe return envelope calculation,
hazard terrain sampling, and mission telemetry APIs for Jezero Crater Western Delta.
"""

import os
import json
import time
from typing import List, Optional
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from backend.planner import MarsPlannerEngine

# Resolve paths
DATA_DIR = os.path.abspath(
    os.getenv("MARSWALK_DATA_DIR", os.path.join(os.path.dirname(__file__), "..", "web", "public", "data"))
)

START_TIME = time.time()

app = FastAPI(
    title="Marswalk Navigator API",
    description="Hyperlocal safety-first EVA surface excursion planner and telemetry API for Martian astronauts at Jezero Crater.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS for all origins (supports local Vite, GitHub Pages, and cloud deployments)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize planner engine
engine = MarsPlannerEngine(DATA_DIR)

# Request & Response Schemas
class WaypointModel(BaseModel):
    name: str = Field(..., description="Station or landmark name")
    coordinates: List[float] = Field(..., description="[longitude, latitude] in degrees East/North")
    estimated_dwell_min: Optional[float] = Field(30.0, description="Science activity duration at station (minutes)")

class RouteRequest(BaseModel):
    waypoints: List[WaypointModel] = Field(..., min_length=2, description="Ordered list of targets starting from base shelter")
    mobility_mode: Optional[str] = Field("foot", description="'foot' (suit walking 2.5 km/h) or 'rover' (5.0 km/h)")
    max_slope_deg: Optional[float] = Field(20.0, description="Maximum allowable slope limit before impassable")

class EnvelopeRequest(BaseModel):
    base_coordinates: List[float] = Field(default=[77.435, 18.420], description="[lon, lat] of Habitat Alpha shelter")
    max_sortie_min: Optional[float] = Field(180.0, description="Total sortie excursion time budget in minutes")
    reserve_factor: Optional[float] = Field(1.5, description="Safety multiplier for walk-back reserve (default 1.5x)")
    mobility_mode: Optional[str] = Field("foot", description="'foot' or 'rover'")

@app.get("/")
def root():
    return {
        "service": "Marswalk Navigator - Mission Control API",
        "version": "1.0.0",
        "status": "OPERATIONAL",
        "site": "Jezero Crater Western Delta Front, Mars",
        "datum": "IAU2000:49900 (Mars 2000 Sphere)",
        "docs_url": "/docs",
        "endpoints": {
            "health": "/health",
            "route_planner": "POST /api/route",
            "return_envelope": "POST /api/envelope",
            "hazard_sampling": "GET /api/hazard?lon=77.442&lat=18.438",
            "science_targets": "/api/targets",
            "usgs_geology": "/api/geology",
            "meda_weather": "/api/weather",
            "rad_radiation": "/api/radiation",
            "layers_manifest": "/api/layers"
        }
    }

@app.get("/health")
def health_check():
    uptime_sec = round(time.time() - START_TIME, 1)
    return {
        "status": "healthy",
        "uptime_sec": uptime_sec,
        "grid": {
            "width": engine.width,
            "height": engine.height,
            "cell_size_m": engine.cell_size_m,
            "bbox": engine.bbox,
            "total_cells": engine.width * engine.height
        },
        "crs": engine.meta.get("crs", "IAU2000:49900")
    }

@app.post("/api/route")
def calculate_route(req: RouteRequest):
    if len(req.waypoints) < 2:
        raise HTTPException(status_code=400, detail="Route requires at least 2 waypoints.")
    wps = [wp.model_dump() for wp in req.waypoints]
    result = engine.plan_route(
        waypoints=wps,
        mobility_mode=req.mobility_mode or "foot",
        max_slope=req.max_slope_deg or 20.0
    )
    return result

@app.post("/api/envelope")
def calculate_envelope(req: EnvelopeRequest):
    base_lon, base_lat = req.base_coordinates[0], req.base_coordinates[1]
    result = engine.generate_envelope(
        base_lon=base_lon,
        base_lat=base_lat,
        max_sortie_min=req.max_sortie_min or 180.0,
        reserve_factor=req.reserve_factor or 1.5,
        mobility_mode=req.mobility_mode or "foot"
    )
    return result

@app.get("/api/hazard")
def sample_hazard(
    lon: float = Query(..., description="East Longitude in planetocentric degrees (77.40 to 77.48)"),
    lat: float = Query(..., description="Latitude in degrees North (18.40 to 18.47)")
):
    if not (engine.lon_min <= lon <= engine.lon_max and engine.lat_min <= lat <= engine.lat_max):
        raise HTTPException(
            status_code=400,
            detail=f"Coordinates out of bounds: lon [{engine.lon_min}, {engine.lon_max}], lat [{engine.lat_min}, {engine.lat_max}]"
        )
    return engine.sample_hazard(lon, lat)

@app.get("/api/targets")
def get_science_targets():
    targets_file = os.path.join(DATA_DIR, "targets.geojson")
    if not os.path.exists(targets_file):
        raise HTTPException(status_code=404, detail="targets.geojson not found")
    with open(targets_file, "r") as f:
        return json.load(f)

@app.get("/api/geology")
def get_geology_units():
    geology_file = os.path.join(DATA_DIR, "geology_units.geojson")
    if not os.path.exists(geology_file):
        raise HTTPException(status_code=404, detail="geology_units.geojson not found")
    with open(geology_file, "r") as f:
        return json.load(f)

@app.get("/api/weather")
def get_meda_weather():
    weather_file = os.path.join(DATA_DIR, "weather.json")
    if not os.path.exists(weather_file):
        raise HTTPException(status_code=404, detail="weather.json not found")
    with open(weather_file, "r") as f:
        return json.load(f)

@app.get("/api/radiation")
def get_radiation_status():
    rad_file = os.path.join(DATA_DIR, "radiation.json")
    if not os.path.exists(rad_file):
        raise HTTPException(status_code=404, detail="radiation.json not found")
    with open(rad_file, "r") as f:
        return json.load(f)

@app.get("/api/layers")
def get_layers_manifest():
    layers_file = os.path.join(DATA_DIR, "layers.json")
    if not os.path.exists(layers_file):
        raise HTTPException(status_code=404, detail="layers.json not found")
    with open(layers_file, "r") as f:
        return json.load(f)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app:app", host="0.0.0.0", port=8000, reload=True)

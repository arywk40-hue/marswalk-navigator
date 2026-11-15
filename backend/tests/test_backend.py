"""
Tests for Marswalk Navigator FastAPI Backend and Planner Engine.
"""

import pytest
from fastapi.testclient import TestClient
from backend.app import app, engine

client = TestClient(app)

def test_root():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "OPERATIONAL"
    assert "IAU2000:49900" in data["datum"]

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["grid"]["total_cells"] == 747000

def test_sample_hazard():
    response = client.get("/api/hazard?lon=77.442&lat=18.438")
    assert response.status_code == 200
    data = response.json()
    assert "elevation_m" in data
    assert "slope_deg" in data
    assert "terrain_classification" in data
    assert data["hazard_level"].startswith("GREEN")

def test_calculate_envelope():
    response = client.post("/api/envelope", json={
        "base_coordinates": [77.435, 18.420],
        "max_sortie_min": 180.0,
        "reserve_factor": 1.5,
        "mobility_mode": "foot"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["type"] == "Feature"
    assert data["geometry"]["type"] == "Polygon"
    assert len(data["geometry"]["coordinates"][0]) > 30

def test_calculate_route():
    response = client.post("/api/route", json={
        "waypoints": [
            {"name": "Habitat Alpha", "coordinates": [77.435, 18.420], "estimated_dwell_min": 0},
            {"name": "Hawksbill Gap", "coordinates": [77.442, 18.438], "estimated_dwell_min": 25}
        ],
        "mobility_mode": "foot"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["totalDistance_m"] > 0
    assert data["totalDuration_min"] > 0
    assert "elevationProfile" in data
    assert data["walkBackMarginSafe"] is True

def test_auxiliary_endpoints():
    res_weather = client.get("/api/weather")
    assert res_weather.status_code == 200

    res_rad = client.get("/api/radiation")
    assert res_rad.status_code == 200

    res_targets = client.get("/api/targets")
    assert res_targets.status_code == 200
    assert res_targets.json()["type"] == "FeatureCollection"


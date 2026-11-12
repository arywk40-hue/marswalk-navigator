import os
import yaml
import pytest

CONFIG_PATH = os.path.join(os.path.dirname(__file__), "..", "config", "aoi.yaml")

def test_aoi_config_exists_and_valid():
    assert os.path.exists(CONFIG_PATH), f"Config file not found at {CONFIG_PATH}"
    with open(CONFIG_PATH, "r") as f:
        data = yaml.safe_load(f)

    assert "aoi" in data
    aoi = data["aoi"]
    assert aoi["name"] == "Jezero Crater Western Delta Front"
    bbox = aoi["bbox"]
    assert len(bbox) == 4
    lon_min, lat_min, lon_max, lat_max = bbox
    assert lon_min < lon_max
    assert lat_min < lat_max
    assert 75.0 <= lon_min <= 80.0
    assert 15.0 <= lat_min <= 22.0

def test_science_objectives():
    with open(CONFIG_PATH, "r") as f:
        data = yaml.safe_load(f)

    assert "science_objectives" in data
    objs = data["science_objectives"]
    assert len(objs) >= 3, "Must have at least 3 science objectives"
    for obj in objs:
        assert "id" in obj
        assert "name" in obj
        assert "science_value" in obj
        assert 1 <= obj["science_value"] <= 5
        assert len(obj["layer_evidence"]) >= 1

def test_suit_and_hazard_limits():
    with open(CONFIG_PATH, "r") as f:
        data = yaml.safe_load(f)

    limits = data["aoi"]["limits"]
    assert limits["hard_slope_deg"] == 15.0
    assert limits["caution_slope_deg"] == 10.0
    assert limits["hazard_buffer_m"] > 0


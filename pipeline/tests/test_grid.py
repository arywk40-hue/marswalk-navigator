import numpy as np
import pytest
from pipeline.process.grid import MarsGrid
from pipeline.process.slope import compute_slope_horn
from pipeline.process.hazard import compute_hazard_cost

def test_grid_coordinate_roundtrip():
    grid = MarsGrid(bbox=(77.40, 18.40, 77.48, 18.47), cell_size_m=5.0)
    orig_lon, orig_lat = 77.44, 18.435
    col, row = grid.lonlat_to_xy(orig_lon, orig_lat)
    assert 0 <= col < grid.cols
    assert 0 <= row < grid.rows

    recovered_lon, recovered_lat = grid.xy_to_lonlat(col, row)
    assert abs(recovered_lon - orig_lon) < 0.001
    assert abs(recovered_lat - orig_lat) < 0.001

def test_horn_slope_flat_and_ramp():
    # 1. Flat terrain should yield 0 slope
    flat_dem = np.full((20, 20), -2400.0, dtype=np.float32)
    flat_slope = compute_slope_horn(flat_dem, cell_size_m=5.0)
    assert np.allclose(flat_slope[2:-2, 2:-2], 0.0, atol=1e-3)

    # 2. 1:1 ramp (dz = 5m per 5m step) -> 45 degrees
    ramp_dem = np.zeros((30, 30), dtype=np.float32)
    for c in range(30):
        ramp_dem[:, c] = c * 5.0  # 5m rise per cell (cell size = 5m)
    ramp_slope = compute_slope_horn(ramp_dem, cell_size_m=5.0)
    # Interior cells should be exactly 45 degrees
    assert np.allclose(ramp_slope[3:-3, 3:-3], 45.0, atol=0.5)

def test_hazard_cost_impassable_boundary():
    # Create slope matrix with range 0 to 25 deg
    slope = np.array([
        [0.0, 5.0, 9.9],
        [10.0, 14.9, 15.0],
        [15.1, 20.0, 30.0]
    ], dtype=np.float32)
    thermal = np.full_like(slope, 350.0)

    cost = compute_hazard_cost(slope, thermal, hard_slope_deg=15.0, caution_slope_deg=10.0)

    # Below 15 deg must be passable (< 255)
    assert cost[0, 0] < 255
    assert cost[0, 1] < 255
    assert cost[0, 2] < 255
    assert cost[1, 0] < 255
    assert cost[1, 1] < 255

    # At or above 15 deg must be impassable (255)
    assert cost[1, 2] == 255
    assert cost[2, 0] == 255
    assert cost[2, 1] == 255
    assert cost[2, 2] == 255


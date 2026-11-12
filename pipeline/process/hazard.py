"""
Hazard & Traversability Cost grid computation.
Combines:
1. Slope penalty (exponential barrier approaching hard suit limit 15°)
2. THEMIS thermal inertia / rock abundance proxy
3. Soft regolith / sand dune trap proxy
"""
import numpy as np

def compute_hazard_cost(
    slope_deg: np.ndarray,
    thermal_inertia: np.ndarray,
    hard_slope_deg: float = 15.0,
    caution_slope_deg: float = 10.0,
) -> np.ndarray:
    """
    Computes Uint8 cost grid [1 - 255]:
    - 255: Impassable (slope >= hard_slope_deg or impassable rock field)
    - 1: Ideal flat terrain (slope ~ 0°, low roughness)
    - 2 - 254: Scaled traversal effort / cost multiplier
    """
    rows, cols = slope_deg.shape
    cost = np.ones((rows, cols), dtype=np.float32)

    # Slope component: quadratic ramp up to hard limit
    normalized_slope = np.clip(slope_deg / hard_slope_deg, 0.0, 1.0)
    slope_cost = 1.0 + 8.0 * (normalized_slope ** 2)

    # Caution threshold acceleration
    caution_mask = slope_deg >= caution_slope_deg
    slope_cost[caution_mask] += 6.0 * (slope_deg[caution_mask] - caution_slope_deg)

    # Thermal inertia proxy:
    # High thermal inertia (> 550) = boulder fields / rocky blocks (traverse obstacle)
    # Very low thermal inertia (< 180) = soft uncompacted dust mantle / sinkage hazard
    rock_penalty = np.clip((thermal_inertia - 400.0) / 100.0, 0.0, 5.0)
    sand_penalty = np.clip((220.0 - thermal_inertia) / 40.0, 0.0, 4.0)

    total_cost = slope_cost + rock_penalty + sand_penalty

    # Scale to integer cost 1 - 200
    cost_scaled = np.clip(np.round(total_cost * 12.0), 1.0, 200.0).astype(np.uint8)

    # Impassable barrier: slope >= hard_slope_deg
    impassable_mask = slope_deg >= hard_slope_deg
    cost_scaled[impassable_mask] = 255

    return cost_scaled

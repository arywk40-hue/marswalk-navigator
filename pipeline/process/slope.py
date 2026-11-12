"""
Horn's 3x3 finite-difference slope and topographic roughness derivation.
Reference: Horn, B.K.P. (1981), "Hill shading and the reflectance map", Proc. IEEE, 69(1), 14-47.
"""
import numpy as np
from scipy.ndimage import convolve

def compute_slope_horn(dem: np.ndarray, cell_size_m: float = 5.0) -> np.ndarray:
    """
    Computes terrain slope in degrees using Horn's algorithm.
    """
    # 3x3 Horn convolution kernels
    kx = np.array([
        [-1, 0, 1],
        [-2, 0, 2],
        [-1, 0, 1]
    ], dtype=np.float32) / (8.0 * cell_size_m)

    ky = np.array([
        [-1, -2, -1],
        [ 0,  0,  0],
        [ 1,  2,  1]
    ], dtype=np.float32) / (8.0 * cell_size_m)

    dz_dx = convolve(dem, kx, mode='nearest')
    dz_dy = convolve(dem, ky, mode='nearest')

    slope_rad = np.arctan(np.sqrt(dz_dx**2 + dz_dy**2))
    slope_deg = np.degrees(slope_rad)
    return slope_deg.astype(np.float32)

def compute_roughness(dem: np.ndarray, window_size: int = 5) -> np.ndarray:
    """
    Computes topographic roughness (standard deviation in sliding window).
    """
    from scipy.ndimage import generic_filter
    # Fast approximation: difference between uniform max and min in window
    from scipy.ndimage import maximum_filter, minimum_filter
    roughness = maximum_filter(dem, size=window_size) - minimum_filter(dem, size=window_size)
    return roughness.astype(np.float32)

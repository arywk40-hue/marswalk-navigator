"""
Common metric grid definition for Jezero Crater Western Delta Front AOI.
Coordinates: Planetocentric East Longitude [77.40, 77.48], Latitude [18.40, 18.47]
Metric projection: Local Equirectangular / Transverse projection at Jezero Center (18.435°N, 77.44°E).
"""
import numpy as np

# Mars IAU 2000 Sphere
MARS_RADIUS_M = 3396190.0

class MarsGrid:
    def __init__(self, bbox=(77.40, 18.40, 77.48, 18.47), cell_size_m=5.0):
        self.lon_min, self.lat_min, self.lon_max, self.lat_max = bbox
        self.cell_size_m = float(cell_size_m)
        self.center_lat = (self.lat_min + self.lat_max) / 2.0
        self.center_lon = (self.lon_min + self.lon_max) / 2.0

        # Meters per degree
        self.m_per_deg_lat = (np.pi * MARS_RADIUS_M) / 180.0
        self.m_per_deg_lon = self.m_per_deg_lat * np.cos(np.radians(self.center_lat))

        # Grid extent in meters
        self.width_m = (self.lon_max - self.lon_min) * self.m_per_deg_lon
        self.height_m = (self.lat_max - self.lat_min) * self.m_per_deg_lat

        self.cols = int(np.ceil(self.width_m / self.cell_size_m))
        self.rows = int(np.ceil(self.height_m / self.cell_size_m))

    def xy_to_lonlat(self, col, row):
        """Converts grid column and row (row 0 at top / north) to lon, lat."""
        lon = self.lon_min + (col * self.cell_size_m) / self.m_per_deg_lon
        lat = self.lat_max - (row * self.cell_size_m) / self.m_per_deg_lat
        return lon, lat

    def lonlat_to_xy(self, lon, lat):
        """Converts lon, lat to grid col, row."""
        col = int(round((lon - self.lon_min) * self.m_per_deg_lon / self.cell_size_m))
        row = int(round((self.lat_max - lat) * self.m_per_deg_lat / self.cell_size_m))
        col = max(0, min(self.cols - 1, col))
        row = max(0, min(self.rows - 1, row))
        return col, row

    def generate_synthetic_jezero_dem(self):
        """
        Generates elevation calibrated to Jezero Western Delta Front:
        - Western crater rim & delta topset plateau: ~ -2250 m
        - Steep delta erosional scarp (Hawksbill Gap, Kodiak): dropping 200-300 m with slopes 15-25°
        - Lake floor bottomset & Three Forks landing ellipse: ~ -2550 m
        - Kodiak butte remnant isolated outlier
        """
        cols = self.cols
        rows = self.rows

        # Normalized coordinates [0, 1]
        x = np.linspace(0, 1, cols)
        y = np.linspace(0, 1, rows)
        xx, yy = np.meshgrid(x, y)

        # Base regional tilt sloping east toward crater center
        dem = -2250.0 - (xx * 250.0)

        # Delta scarp sigmoidal drop centered around xx ~ 0.45 - 0.55
        # Scarp curve with natural meandering
        meander = 0.50 + 0.08 * np.sin(yy * 3 * np.pi) + 0.04 * np.cos(yy * 5 * np.pi)
        scarp_drop = 180.0 / (1.0 + np.exp(-((xx - meander) / 0.03)))
        dem -= scarp_drop

        # Kodiak Butte outlier (isolated mesa around xx=0.35, yy=0.60)
        dist_kodiak = np.sqrt(((xx - 0.35) ** 2) + ((yy - 0.60) ** 2))
        kodiak_mesa = 120.0 * np.exp(-((dist_kodiak / 0.035) ** 4))
        dem += kodiak_mesa

        # Natural crater floor topography / ripples
        ripples = 4.0 * np.sin(xx * 50) * np.cos(yy * 40) + 2.0 * np.sin(xx * 120)
        dem += ripples

        return dem.astype(np.float32)


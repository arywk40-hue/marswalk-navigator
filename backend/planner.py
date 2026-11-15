"""
Marswalk Navigator - Python Pathfinding & Return Envelope Engine
Operates on the 5-meter Jezero Delta hazard cost grid.
Includes:
1. Tobler-style astronaut suit and rover mobility speeds
2. Ray-marched RF Line-of-Sight (LOS) terrain check to Habitat Alpha
3. A* pathfinding with hazard penalty multipliers
4. Safe Return Envelope (Dijkstra isochrone contour)
"""

import os
import json
import math
import heapq
import numpy as np
from typing import List, Dict, Any, Tuple, Optional

# IAU 2000 Mars Mean Sphere Radius in meters
MARS_RADIUS_M = 3396190.0

class MarsPlannerEngine:
    def __init__(self, data_dir: str):
        self.data_dir = data_dir
        meta_path = os.path.join(data_dir, "grid", "meta.json")
        cost_path = os.path.join(data_dir, "grid", "cost.bin")
        elev_path = os.path.join(data_dir, "grid", "elev.bin")
        slope_path = os.path.join(data_dir, "grid", "slope.bin")

        with open(meta_path, "r") as f:
            self.meta = json.load(f)

        self.width = int(self.meta["width"])
        self.height = int(self.meta["height"])
        self.cell_size_m = float(self.meta["cell_size_m"])
        self.bbox = self.meta["bbox"] # [lon_min, lat_min, lon_max, lat_max]
        self.lon_min, self.lat_min, self.lon_max, self.lat_max = self.bbox

        # Load binary raster grids
        self.cost_grid = np.fromfile(cost_path, dtype=np.uint8).reshape((self.height, self.width))
        self.elev_grid = np.fromfile(elev_path, dtype=np.float32).reshape((self.height, self.width))
        self.slope_grid = np.fromfile(slope_path, dtype=np.uint8).reshape((self.height, self.width))

    def lonlat_to_cell(self, lon: float, lat: float) -> Tuple[int, int]:
        col = int(round(((lon - self.lon_min) / (self.lon_max - self.lon_min)) * (self.width - 1)))
        row = int(round(((self.lat_max - lat) / (self.lat_max - self.lat_min)) * (self.height - 1)))
        col = max(0, min(self.width - 1, col))
        row = max(0, min(self.height - 1, row))
        return col, row

    def cell_to_lonlat(self, col: int, row: int) -> Tuple[float, float]:
        lon = self.lon_min + (col / (self.width - 1)) * (self.lon_max - self.lon_min)
        lat = self.lat_max - (row / (self.height - 1)) * (self.lat_max - self.lat_min)
        return round(lon, 6), round(lat, 6)

    def snap_to_passable(self, col: int, row: int, max_radius: int = 12, max_slope: float = 18.0) -> Tuple[int, int]:
        """Finds nearest passable cell if starting or ending on impassable rock/slope."""
        if self.slope_grid[row, col] < max_slope and self.cost_grid[row, col] < 255:
            return col, row
        for rad in range(1, max_radius + 1):
            for dc in range(-rad, rad + 1):
                for dr in range(-rad, rad + 1):
                    nc = col + dc
                    nr = row + dr
                    if 0 <= nc < self.width and 0 <= nr < self.height:
                        if self.slope_grid[nr, nc] < max_slope and self.cost_grid[nr, nc] < 255:
                            return nc, nr
        return col, row

    def mars_distance_m(self, lon1: float, lat1: float, lon2: float, lat2: float) -> float:
        """Great-circle distance on Mars IAU2000 Sphere."""
        phi1 = math.radians(lat1)
        phi2 = math.radians(lat2)
        dphi = math.radians(lat2 - lat1)
        dlam = math.radians(lon2 - lon1)
        a = math.sin(dphi / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * (math.sin(dlam / 2.0) ** 2)
        c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(max(0.0, 1.0 - a)))
        return MARS_RADIUS_M * c

    def suit_speed_mps(self, slope_deg: float, mobility_mode: str = "foot") -> float:
        """Tobler-style walking speed on Mars regolith adjusted for pressure suit mass (145kg earth equivalent)."""
        base_speed = 0.694 * math.exp(-0.06 * slope_deg) # ~2.5 km/h on flat, decreasing with slope
        base_speed = max(0.25, min(1.3, base_speed))
        if mobility_mode == "rover":
            return base_speed * 2.0 # ~5.0 km/h nominal rover speed
        return base_speed

    def check_line_of_sight(self, col: int, row: int, base_col: int, base_row: int) -> bool:
        """Ray marches between cell and Habitat Alpha across elevation grid to detect RF occlusion."""
        target_elev = float(self.elev_grid[row, col]) + 1.8 # 1.8m suit antenna
        base_elev = float(self.elev_grid[base_row, base_col]) + 10.0 # 10m Hab mast antenna

        dist_steps = max(abs(col - base_col), abs(row - base_row))
        if dist_steps <= 1:
            return True

        for step in range(1, dist_steps):
            t = step / dist_steps
            c = int(round(base_col + t * (col - base_col)))
            r = int(round(base_row + t * (row - base_row)))
            terrain_elev = float(self.elev_grid[r, c])
            ray_elev = base_elev + t * (target_elev - base_elev)
            if terrain_elev > ray_elev + 1.0:
                return False
        return True

    def sample_hazard(self, lon: float, lat: float) -> Dict[str, Any]:
        """Samples terrain, slope, elevation, and traversability cost at any coordinate."""
        col, row = self.lonlat_to_cell(lon, lat)
        elev = float(self.elev_grid[row, col])
        slope = float(self.slope_grid[row, col])
        cost = int(self.cost_grid[row, col])
        impassable = cost >= 255 or slope >= 15.0

        if impassable:
            hazard_level = "RED (Severe Hazard / Impassable)"
            classification = "Steep Delta Erosional Scarp / Unconsolidated Dune Slipface"
        elif slope >= 10.0 or cost >= 80:
            hazard_level = "AMBER (Caution / High Energy)"
            classification = "Boulder Block Field / Rocky Outcrop / Moderate Slope"
        else:
            hazard_level = "GREEN (Nominal Traversability)"
            classification = "Delta Topset Plain / Compacted Lake Floor Regolith"

        return {
            "longitude": lon,
            "latitude": lat,
            "grid_cell": {"col": col, "row": row},
            "elevation_m": round(elev, 2),
            "slope_deg": round(slope, 1),
            "hazard_cost": cost,
            "impassable": impassable,
            "hazard_level": hazard_level,
            "terrain_classification": classification
        }

    def astar_leg(self, start_coord: Tuple[float, float], end_coord: Tuple[float, float], max_slope: float = 20.0) -> List[Tuple[float, float]]:
        """A* pathfinding between two points on the Jezero cost raster."""
        sc, sr = self.lonlat_to_cell(start_coord[0], start_coord[1])
        ec, er = self.lonlat_to_cell(end_coord[0], end_coord[1])

        sc, sr = self.snap_to_passable(sc, sr, max_slope=max_slope)
        ec, er = self.snap_to_passable(ec, er, max_slope=max_slope)

        start_idx = sr * self.width + sc
        goal_idx = er * self.width + ec

        if start_idx == goal_idx:
            return [start_coord, end_coord]

        def heuristic(c1: int, r1: int, c2: int, r2: int) -> float:
            dc = abs(c1 - c2)
            dr = abs(r1 - r2)
            return (max(dc, dr) + 0.414 * min(dc, dr)) * self.cell_size_m

        dirs = [
            (-1, 0, self.cell_size_m),
            (1, 0, self.cell_size_m),
            (0, -1, self.cell_size_m),
            (0, 1, self.cell_size_m),
            (-1, -1, 1.414 * self.cell_size_m),
            (-1, 1, 1.414 * self.cell_size_m),
            (1, -1, 1.414 * self.cell_size_m),
            (1, 1, 1.414 * self.cell_size_m)
        ]

        total_cells = self.width * self.height
        g_scores = np.full(total_cells, np.inf, dtype=np.float32)
        g_scores[start_idx] = 0.0
        came_from = np.full(total_cells, -1, dtype=np.int32)
        visited = np.zeros(total_cells, dtype=bool)

        open_heap = [(heuristic(sc, sr, ec, er) * 2.5, start_idx)]
        found = False
        iters = 0
        max_iters = 120000

        while open_heap and iters < max_iters:
            iters += 1
            _, cur = heapq.heappop(open_heap)
            if visited[cur]:
                continue
            visited[cur] = True

            if cur == goal_idx:
                found = True
                break

            cc = cur % self.width
            cr = cur // self.width
            cur_g = g_scores[cur]

            for dc, dr, step_dist in dirs:
                nc = cc + dc
                nr = cr + dr
                if 0 <= nc < self.width and 0 <= nr < self.height:
                    n_idx = nr * self.width + nc
                    if visited[n_idx]:
                        continue
                    s_val = float(self.slope_grid[nr, nc])
                    if s_val >= max_slope:
                        continue
                    c_val = float(self.cost_grid[nr, nc]) if self.cost_grid[nr, nc] < 255 else 180.0
                    tentative_g = cur_g + step_dist * (1.0 + c_val / 20.0)
                    if tentative_g < g_scores[n_idx]:
                        g_scores[n_idx] = tentative_g
                        came_from[n_idx] = cur
                        f_score = tentative_g + heuristic(nc, nr, ec, er) * 2.5
                        heapq.heappush(open_heap, (f_score, n_idx))

        if not found:
            # Fallback to straight line if impassable cliff completely isolates point
            return [start_coord, end_coord]

        path_cells = []
        curr = goal_idx
        while curr != -1:
            path_cells.append(curr)
            curr = came_from[curr]
        path_cells.reverse()

        coords = [self.cell_to_lonlat(idx % self.width, idx // self.width) for idx in path_cells]

        # Decimate long paths for UI efficiency
        if len(coords) > 200:
            step = math.ceil(len(coords) / 150)
            decimated = [coords[i] for i in range(0, len(coords), step)]
            if coords[-1] not in decimated:
                decimated.append(coords[-1])
            return decimated
        return coords

    def plan_route(self, waypoints: List[Dict[str, Any]], mobility_mode: str = "foot", max_slope: float = 20.0) -> Dict[str, Any]:
        """Plans multi-leg route across all stations with life support consumables and comms line-of-sight."""
        if len(waypoints) < 2:
            return {"error": "At least 2 waypoints required"}

        full_coords: List[Tuple[float, float]] = []
        dwell_time_min = 0.0

        for i in range(len(waypoints) - 1):
            w1 = waypoints[i]["coordinates"]
            w2 = waypoints[i + 1]["coordinates"]
            leg = self.astar_leg((w1[0], w1[1]), (w2[0], w2[1]), max_slope=max_slope)
            if full_coords:
                full_coords.extend(leg[1:])
            else:
                full_coords.extend(leg)
            dwell_time_min += float(waypoints[i + 1].get("estimated_dwell_min", 30))

        # Metrics calculation
        total_dist_m = 0.0
        total_walk_time_sec = 0.0
        max_slope_deg = 0.0
        slope_sum = 0.0
        elev_gain_m = 0.0
        los_count = 0
        elevation_profile = []

        base_col, base_row = self.lonlat_to_cell(waypoints[0]["coordinates"][0], waypoints[0]["coordinates"][1])
        prev_elev = None

        for i, (lon, lat) in enumerate(full_coords):
            col, row = self.lonlat_to_cell(lon, lat)
            elev = float(self.elev_grid[row, col])
            slope = float(self.slope_grid[row, col])

            if self.check_line_of_sight(col, row, base_col, base_row):
                los_count += 1

            if i > 0:
                p_lon, p_lat = full_coords[i - 1]
                seg_dist = self.mars_distance_m(p_lon, p_lat, lon, lat)
                total_dist_m += seg_dist

                if prev_elev is not None and elev > prev_elev:
                    elev_gain_m += elev - prev_elev

                speed = self.suit_speed_mps(slope, mobility_mode)
                total_walk_time_sec += seg_dist / speed

            prev_elev = elev
            max_slope_deg = max(max_slope_deg, slope)
            slope_sum += slope

            elevation_profile.append({
                "distance_m": round(total_dist_m, 1),
                "elevation_m": round(elev, 1),
                "slope_deg": round(slope, 1)
            })

        mean_slope = slope_sum / max(1, len(full_coords))
        total_walk_time_min = total_walk_time_sec / 60.0
        total_duration_min = total_walk_time_min + dwell_time_min
        comms_los_pct = round((los_count / max(1, len(full_coords))) * 100)

        # Farthest point to Habitat Alpha
        base_coord = waypoints[0]["coordinates"]
        farthest_dist_m = max(
            self.mars_distance_m(base_coord[0], base_coord[1], pt[0], pt[1])
            for pt in full_coords
        )
        walk_back_speed = self.suit_speed_mps(mean_slope, mobility_mode)
        walk_back_duration_min = (farthest_dist_m / walk_back_speed) / 60.0

        # Consumables
        capacity_hours = 12.0 if mobility_mode == "rover" else 8.0
        suit_capacity_min = capacity_hours * 60.0
        o2_consumed_pct = min(100.0, (total_duration_min / suit_capacity_min) * 100.0)
        o2_remaining_pct = max(0.0, 100.0 - o2_consumed_pct)

        battery_capacity_min = (10.0 if mobility_mode == "rover" else 7.0) * 60.0
        batt_consumed_pct = min(100.0, (total_duration_min / battery_capacity_min) * 100.0)
        batt_remaining_pct = max(0.0, 100.0 - batt_consumed_pct)

        remaining_o2_time_min = (o2_remaining_pct / 100.0) * suit_capacity_min
        walk_back_margin_safe = remaining_o2_time_min >= (walk_back_duration_min * 1.5)

        return {
            "coordinates": full_coords,
            "waypoints": waypoints,
            "mobilityMode": mobility_mode,
            "totalDistance_m": round(total_dist_m),
            "totalDuration_min": round(total_duration_min),
            "walkDuration_min": round(total_walk_time_min),
            "dwellDuration_min": round(dwell_time_min),
            "walkBackDistance_m": round(farthest_dist_m),
            "walkBackDuration_min": round(walk_back_duration_min),
            "maxSlope_deg": round(max_slope_deg, 1),
            "meanSlope_deg": round(mean_slope, 1),
            "elevationGain_m": round(elev_gain_m),
            "o2Consumed_pct": round(o2_consumed_pct),
            "o2Remaining_pct": round(o2_remaining_pct),
            "batteryConsumed_pct": round(batt_consumed_pct),
            "batteryRemaining_pct": round(batt_remaining_pct),
            "walkBackMarginSafe": walk_back_margin_safe,
            "commsLos_pct": comms_los_pct,
            "elevationProfile": elevation_profile
        }

    def generate_envelope(
        self,
        base_lon: float,
        base_lat: float,
        max_sortie_min: float = 180.0,
        reserve_factor: float = 1.5,
        mobility_mode: str = "foot",
        num_rays: int = 64
    ) -> Dict[str, Any]:
        """Generates Safe Return Envelope GeoJSON Polygon via radial ray-casting."""
        base_col, base_row = self.lonlat_to_cell(base_lon, base_lat)
        max_one_way_sec = (max_sortie_min * 60.0) / (2.0 * reserve_factor)

        perimeter_coords = []
        for i in range(num_rays):
            angle = (i / num_rays) * 2.0 * math.pi
            dx = math.cos(angle)
            dy = -math.sin(angle)
            cum_time = 0.0
            last_col, last_row = base_col, base_row

            for step in range(1, 500):
                nc = int(round(base_col + dx * step))
                nr = int(round(base_row + dy * step))
                if nc < 0 or nc >= self.width or nr < 0 or nr >= self.height:
                    break
                s_val = float(self.slope_grid[nr, nc])
                if s_val >= 18.0:
                    break
                speed = self.suit_speed_mps(s_val, mobility_mode)
                cum_time += self.cell_size_m / speed
                if cum_time > max_one_way_sec:
                    break
                last_col, last_row = nc, nr

            lon, lat = self.cell_to_lonlat(last_col, last_row)
            perimeter_coords.append([lon, lat])

        if perimeter_coords:
            perimeter_coords.append(perimeter_coords[0]) # Close polygon ring

        return {
            "type": "Feature",
            "geometry": {
                "type": "Polygon",
                "coordinates": [perimeter_coords]
            },
            "properties": {
                "maxSortieMin": max_sortie_min,
                "reserveFactor": reserve_factor,
                "mobilityMode": mobility_mode,
                "baseCoordinates": [base_lon, base_lat]
            }
        }


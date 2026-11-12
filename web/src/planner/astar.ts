/**
 * A* Pathfinding Engine for Marswalk Navigator.
 * Operates on the 5-meter Jezero Delta hazard cost grid.
 * Integrates:
 * 1. Tobler-style suit/rover mobility speeds
 * 2. RF Line-of-Sight (LOS) terrain ray-marching to Habitat Alpha
 * 3. Walk-back safety margin validation
 */
import { Target, PlannedRoute, ElevationPoint } from '../types';
import { marsDistanceM, suitWalkingSpeedMps, DEFAULT_SUIT_PARAMS } from '../lib/geo';

export interface GridMeta {
  width: number;
  height: number;
  cell_size_m: number;
  bbox: [number, number, number, number]; // [lon_min, lat_min, lon_max, lat_max]
  elevation_min_m: number;
  elevation_max_m: number;
  hard_slope_deg: number;
  caution_slope_deg: number;
}

export class RoutePlanner {
  private meta: GridMeta;
  private costGrid: Uint8Array;
  private slopeGrid: Uint8Array;
  private elevGrid: Float32Array;

  constructor(meta: GridMeta, costGrid: Uint8Array, slopeGrid: Uint8Array, elevGrid: Float32Array) {
    this.meta = meta;
    this.costGrid = costGrid;
    this.slopeGrid = slopeGrid;
    this.elevGrid = elevGrid;
  }

  public lonlatToCell(lon: number, lat: number): [number, number] {
    const [lonMin, latMin, lonMax, latMax] = this.meta.bbox;
    const col = Math.round(((lon - lonMin) / (lonMax - lonMin)) * (this.meta.width - 1));
    const row = Math.round(((latMax - lat) / (latMax - latMin)) * (this.meta.height - 1));
    return [
      Math.max(0, Math.min(this.meta.width - 1, col)),
      Math.max(0, Math.min(this.meta.height - 1, row)),
    ];
  }

  public cellToLonLat(col: number, row: number): [number, number] {
    const [lonMin, latMin, lonMax, latMax] = this.meta.bbox;
    const lon = lonMin + (col / (this.meta.width - 1)) * (lonMax - lonMin);
    const lat = latMax - (row / (this.meta.height - 1)) * (latMax - latMin);
    return [Number(lon.toFixed(5)), Number(lat.toFixed(5))];
  }

  private getIndex(col: number, row: number): number {
    return row * this.meta.width + col;
  }

  /**
   * Ray marches between target cell and Habitat Alpha across the elevation grid
   * to determine if terrain occludes direct UHF/RF line of sight.
   */
  public checkLineOfSight(col: number, row: number, baseCol: number, baseRow: number): boolean {
    const targetIdx = this.getIndex(col, row);
    const baseIdx = this.getIndex(baseCol, baseRow);

    const targetElev = (this.elevGrid[targetIdx] || -2450.0) + 1.8; // 1.8m astronaut suit antenna
    const baseElev = (this.elevGrid[baseIdx] || -2450.0) + 10.0; // 10m Hab mast antenna

    const distSteps = Math.max(Math.abs(col - baseCol), Math.abs(row - baseRow));
    if (distSteps <= 1) return true;

    // March along line
    for (let step = 1; step < distSteps; step++) {
      const t = step / distSteps;
      const c = Math.round(baseCol + t * (col - baseCol));
      const r = Math.round(baseRow + t * (row - baseRow));

      const idx = this.getIndex(c, r);
      const terrainElev = this.elevGrid[idx] || -2450.0;

      // Line of sight ray elevation at fraction t
      const rayElev = baseElev + t * (targetElev - baseElev);

      // If terrain peaks above the ray, LOS is blocked (RF shadow)
      if (terrainElev > rayElev + 1.0) {
        return false;
      }
    }

    return true;
  }

  /**
   * Plans route visiting an ordered sequence of science targets.
   * @param waypoints Ordered list of target stations
   * @param mobilityMode 'foot' (2.5 km/h) or 'rover' (5.0 km/h)
   */
  public planMultiLegRoute(
    waypoints: Target[],
    mobilityMode: 'foot' | 'rover' = 'foot'
  ): PlannedRoute | null {
    if (waypoints.length < 2) return null;

    let fullCoordinates: [number, number][] = [];
    let totalDistM = 0;
    let totalWalkTimeMin = 0;
    let maxSlopeDeg = 0;
    let slopeSum = 0;
    let elevationGainM = 0;
    let elevationProfile: ElevationPoint[] = [];

    const isRover = mobilityMode === 'rover';
    const speedMultiplier = isRover ? 2.0 : 1.0; // 5.0 km/h for rover vs 2.5 km/h foot

    // Chain consecutive legs
    for (let i = 0; i < waypoints.length - 1; i++) {
      const legStart = waypoints[i].coordinates;
      const legEnd = waypoints[i + 1].coordinates;

      const legPath = this.astarLeg(legStart, legEnd);
      if (!legPath || legPath.length === 0) {
        fullCoordinates.push(legStart, legEnd);
      } else {
        if (fullCoordinates.length > 0) {
          fullCoordinates.push(...legPath.slice(1));
        } else {
          fullCoordinates.push(...legPath);
        }
      }

      // Add science target dwell time
      totalWalkTimeMin += waypoints[i + 1].estimated_dwell_min || 30;
    }

    // Profile & metrics generation
    let prevElev: number | null = null;
    let cumDist = 0;

    const baseCell = this.lonlatToCell(waypoints[0].coordinates[0], waypoints[0].coordinates[1]);
    let losCount = 0;

    for (let i = 0; i < fullCoordinates.length; i++) {
      const [lon, lat] = fullCoordinates[i];
      const [col, row] = this.lonlatToCell(lon, lat);
      const idx = this.getIndex(col, row);

      const elev = this.elevGrid[idx] || -2450.0;
      const slope = this.slopeGrid[idx] || 2.0;

      // Check Comms LOS to Hab Alpha
      if (this.checkLineOfSight(col, row, baseCell[0], baseCell[1])) {
        losCount++;
      }

      if (i > 0) {
        const [pLon, pLat] = fullCoordinates[i - 1];
        const segDist = marsDistanceM(pLon, pLat, lon, lat);
        cumDist += segDist;

        if (prevElev !== null && elev > prevElev) {
          elevationGainM += elev - prevElev;
        }

        const baseSpeed = suitWalkingSpeedMps(slope);
        const actualSpeed = Math.max(0.3, baseSpeed * speedMultiplier);
        const segTimeSec = segDist / actualSpeed;
        totalWalkTimeMin += segTimeSec / 60.0;
      }

      prevElev = elev;
      maxSlopeDeg = Math.max(maxSlopeDeg, slope);
      slopeSum += slope;

      elevationProfile.push({
        distance_m: Math.round(cumDist),
        elevation_m: Math.round(elev),
        slope_deg: Number(slope.toFixed(1)),
      });
    }

    totalDistM = cumDist;
    const meanSlopeDeg = Number((slopeSum / Math.max(1, fullCoordinates.length)).toFixed(1));
    const commsLos_pct = Math.round((losCount / Math.max(1, fullCoordinates.length)) * 100);

    // Walk-back distance from farthest point to Habitat Alpha
    const baseCoord = waypoints[0].coordinates;
    let farthestDistM = 0;
    for (const coord of fullCoordinates) {
      const d = marsDistanceM(baseCoord[0], baseCoord[1], coord[0], coord[1]);
      if (d > farthestDistM) {
        farthestDistM = d;
      }
    }

    const walkBackSpeedMps = suitWalkingSpeedMps(meanSlopeDeg) * speedMultiplier;
    const walkBackDurationMin = (farthestDistM / Math.max(0.4, walkBackSpeedMps)) / 60.0;

    // Consumables (8 hour suit capacity, 12h for rover-assisted)
    const totalEvaDurationMin = totalWalkTimeMin;
    const suitTotalCapacityMin = (isRover ? 12.0 : DEFAULT_SUIT_PARAMS.suit_o2_capacity_hours) * 60.0;
    const o2Consumed_pct = Math.min(100, (totalEvaDurationMin / suitTotalCapacityMin) * 100);
    const o2Remaining_pct = Math.max(0, 100 - o2Consumed_pct);

    const batteryConsumed_pct = Math.min(100, (totalEvaDurationMin / (isRover ? 10.0 : 7.0) / 60.0) * 100);
    const batteryRemaining_pct = Math.max(0, 100 - batteryConsumed_pct);

    const remainingO2TimeMin = (o2Remaining_pct / 100.0) * suitTotalCapacityMin;
    const walkBackMarginSafe = remainingO2TimeMin >= walkBackDurationMin * DEFAULT_SUIT_PARAMS.walk_back_safety_factor;

    return {
      coordinates: fullCoordinates,
      waypoints,
      totalDistance_m: Math.round(totalDistM),
      totalDuration_min: Math.round(totalWalkTimeMin),
      walkBackDistance_m: Math.round(farthestDistM),
      walkBackDuration_min: Math.round(walkBackDurationMin),
      maxSlope_deg: maxSlopeDeg,
      meanSlope_deg: meanSlopeDeg,
      elevationGain_m: Math.round(elevationGainM),
      o2Consumed_pct: Math.round(o2Consumed_pct),
      o2Remaining_pct: Math.round(o2Remaining_pct),
      batteryConsumed_pct: Math.round(batteryConsumed_pct),
      batteryRemaining_pct: Math.round(batteryRemaining_pct),
      walkBackMarginSafe,
      elevationProfile,
      commsLos_pct,
      mobilityMode,
    };
  }

  /**
   * Single A* leg between two coordinates on the cost grid.
   */
  private astarLeg(startCoord: [number, number], endCoord: [number, number]): [number, number][] {
    const startCell = this.lonlatToCell(startCoord[0], startCoord[1]);
    const endCell = this.lonlatToCell(endCoord[0], endCoord[1]);

    const startIdx = this.getIndex(startCell[0], startCell[1]);
    const endIdx = this.getIndex(endCell[0], endCell[1]);

    const width = this.meta.width;
    const height = this.meta.height;

    // Priority queue structures
    const openSet = new Set<number>([startIdx]);
    const cameFrom = new Map<number, number>();

    const gScore = new Map<number, number>();
    gScore.set(startIdx, 0);

    const fScore = new Map<number, number>();
    fScore.set(startIdx, this.heuristic(startCell[0], startCell[1], endCell[0], endCell[1]));

    const directions = [
      [-1, 0], [1, 0], [0, -1], [0, 1], // Cardinal
      [-1, -1], [-1, 1], [1, -1], [1, 1] // Diagonal
    ];

    let iterations = 0;
    const maxIterations = 25000;

    while (openSet.size > 0 && iterations < maxIterations) {
      iterations++;

      // Find node in openSet with lowest fScore
      let currentIdx = -1;
      let lowestF = Infinity;
      for (const idx of openSet) {
        const f = fScore.get(idx) ?? Infinity;
        if (f < lowestF) {
          lowestF = f;
          currentIdx = idx;
        }
      }

      if (currentIdx === -1 || currentIdx === endIdx) {
        return this.reconstructPath(cameFrom, currentIdx);
      }

      openSet.delete(currentIdx);

      const curCol = currentIdx % width;
      const curRow = Math.floor(currentIdx / width);
      const currentG = gScore.get(currentIdx) ?? Infinity;

      for (const [dc, dr] of directions) {
        const nextCol = curCol + dc;
        const nextRow = curRow + dr;

        if (nextCol < 0 || nextCol >= width || nextRow < 0 || nextRow >= height) {
          continue;
        }

        const nextIdx = nextRow * width + nextCol;
        const costVal = this.costGrid[nextIdx];

        // 255 = Impassable barrier (slope >= 15 deg)
        if (costVal >= 255) continue;

        const isDiag = dc !== 0 && dr !== 0;
        const distStep = isDiag ? 1.414 * this.meta.cell_size_m : this.meta.cell_size_m;
        const edgeCost = distStep * (1.0 + (costVal / 20.0));

        const tentativeG = currentG + edgeCost;

        if (tentativeG < (gScore.get(nextIdx) ?? Infinity)) {
          cameFrom.set(nextIdx, currentIdx);
          gScore.set(nextIdx, tentativeG);
          const h = this.heuristic(nextCol, nextRow, endCell[0], endCell[1]);
          fScore.set(nextIdx, tentativeG + h);
          openSet.add(nextIdx);
        }
      }
    }

    return [startCoord, endCoord];
  }

  private heuristic(c1: number, r1: number, c2: number, r2: number): number {
    const dc = Math.abs(c1 - c2);
    const dr = Math.abs(r1 - r2);
    const octile = (Math.max(dc, dr) + 0.414 * Math.min(dc, dr)) * this.meta.cell_size_m;
    return octile;
  }

  private reconstructPath(cameFrom: Map<number, number>, currentIdx: number): [number, number][] {
    const path: [number, number][] = [];
    let curr: number | undefined = currentIdx;

    while (curr !== undefined) {
      const col = curr % this.meta.width;
      const row = Math.floor(curr / this.meta.width);
      path.unshift(this.cellToLonLat(col, row));
      curr = cameFrom.get(curr);
    }

    if (path.length > 200) {
      const step = Math.ceil(path.length / 150);
      return path.filter((_, idx) => idx % step === 0 || idx === path.length - 1);
    }
    return path;
  }
}

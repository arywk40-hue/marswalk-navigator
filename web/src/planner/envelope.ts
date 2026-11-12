/**
 * Safe Return Envelope Generator (Hero Feature).
 * Performs a Dijkstra / Isochrone flood fill from Habitat Alpha across the hazard cost grid,
 * determining the exact boundary where an astronaut can travel and still walk back with a 1.5x reserve.
 */
import { GridMeta } from './astar';
import { suitWalkingSpeedMps } from '../lib/geo';

export interface EnvelopePolygon {
  type: 'Feature';
  geometry: {
    type: 'Polygon';
    coordinates: [number, number][][];
  };
  properties: {
    maxWalkTimeMin: number;
    speActive: boolean;
    reserveFactor: number;
  };
}

export class ReturnEnvelopeGenerator {
  private meta: GridMeta;
  private costGrid: Uint8Array;
  private slopeGrid: Uint8Array;

  constructor(meta: GridMeta, costGrid: Uint8Array, slopeGrid: Uint8Array) {
    this.meta = meta;
    this.costGrid = costGrid;
    this.slopeGrid = slopeGrid;
  }

  /**
   * Computes the Safe Return Envelope polygon from a base shelter point.
   * @param baseLonLat Coordinates [lon, lat] of Habitat Alpha
   * @param maxSortieMin Available excursion budget (e.g. 180 min nominal, or 35 min during SPE storm)
   * @param reserveFactor Safety factor (default 1.5x)
   */
  public generateEnvelopePolygon(
    baseLonLat: [number, number],
    maxSortieMin: number = 180.0,
    reserveFactor: number = 1.5
  ): EnvelopePolygon {
    const [lonMin, latMin, lonMax, latMax] = this.meta.bbox;
    const width = this.meta.width;
    const height = this.meta.height;

    // Convert base coordinates to grid cell
    const baseCol = Math.round(((baseLonLat[0] - lonMin) / (lonMax - lonMin)) * (width - 1));
    const baseRow = Math.round(((latMax - baseLonLat[1]) / (latMax - latMin)) * (height - 1));

    // One-way maximum walking time in seconds
    const maxOneWaySec = (maxSortieMin * 60.0) / (2.0 * reserveFactor);

    // Cast 36 radial rays (every 10 degrees) to trace the perimeter of the envelope
    const perimeterCoords: [number, number][] = [];
    const numRays = 48;

    for (let i = 0; i < numRays; i++) {
      const angleRad = (i / numRays) * 2.0 * Math.PI;
      const dx = Math.cos(angleRad);
      const dy = -Math.sin(angleRad); // negative because row 0 is top / North

      let currCol = baseCol;
      let currRow = baseRow;
      let cumTimeSec = 0;
      let step = 0;
      const maxSteps = 400; // max ~2000 meters radius

      while (step < maxSteps) {
        step++;
        const nextCol = Math.round(baseCol + dx * step);
        const nextRow = Math.round(baseRow + dy * step);

        if (nextCol < 0 || nextCol >= width || nextRow < 0 || nextRow >= height) {
          break;
        }

        const idx = nextRow * width + nextCol;
        const costVal = this.costGrid[idx];
        const slopeDeg = this.slopeGrid[idx];

        // Stopped by impassable barrier (slope >= 15° or steep scarp)
        if (costVal >= 255 || slopeDeg >= 15.0) {
          break;
        }

        const speedMps = suitWalkingSpeedMps(slopeDeg);
        const stepDistM = this.meta.cell_size_m;
        const stepTimeSec = (stepDistM / Math.max(0.3, speedMps)) * (1.0 + costVal / 40.0);

        cumTimeSec += stepTimeSec;
        if (cumTimeSec > maxOneWaySec) {
          break;
        }

        currCol = nextCol;
        currRow = nextRow;
      }

      // Convert furthest reachable cell along ray to lon, lat
      const lon = lonMin + (currCol / (width - 1)) * (lonMax - lonMin);
      const lat = latMax - (currRow / (height - 1)) * (latMax - latMin);
      perimeterCoords.push([Number(lon.toFixed(5)), Number(lat.toFixed(5))]);
    }

    // Close polygon loop
    if (perimeterCoords.length > 0) {
      perimeterCoords.push(perimeterCoords[0]);
    }

    return {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [perimeterCoords],
      },
      properties: {
        maxWalkTimeMin: maxSortieMin,
        speActive: maxSortieMin < 60,
        reserveFactor,
      },
    };
  }
}


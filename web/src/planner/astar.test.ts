import { describe, it, expect } from 'vitest';
import { RoutePlanner, GridMeta } from './astar';
import { ReturnEnvelopeGenerator } from './envelope';
import { Target } from '../types';

describe('A* Route Planner & SEXTANT Navigation', () => {
  const mockMeta: GridMeta = {
    width: 200,
    height: 200,
    cell_size_m: 5.0,
    bbox: [77.40, 18.40, 77.48, 18.47],
    elevation_min_m: -2600,
    elevation_max_m: -2200,
    hard_slope_deg: 15.0,
    caution_slope_deg: 10.0,
  };

  const costGrid = new Uint8Array(200 * 200).fill(10); // Passable grid
  // Add a vertical impassable barrier at col 160 (rows 0 to 140)
  for (let r = 0; r < 140; r++) {
    costGrid[r * 200 + 160] = 255;
  }

  const slopeGrid = new Uint8Array(200 * 200).fill(3);
  const elevGrid = new Float32Array(200 * 200).fill(-2450);

  const waypoints: Target[] = [
    {
      id: 'START',
      name: 'Base Alpha',
      category: 'Base',
      coordinates: [77.41, 18.42],
      science_value: 0,
      priority: 'Base',
      reason: 'Base',
      layer_evidence: [],
      estimated_dwell_min: 0,
      recommended_tools: [],
    },
    {
      id: 'END',
      name: 'Science Target 1',
      category: 'Outcrop',
      coordinates: [77.47, 18.46],
      science_value: 5,
      priority: 'High',
      reason: 'Science inspection',
      layer_evidence: [],
      estimated_dwell_min: 30,
      recommended_tools: [],
    },
  ];

  it('plans a valid multi-leg route avoiding obstacles and calculating Comms LOS', () => {
    const planner = new RoutePlanner(mockMeta, costGrid, slopeGrid, elevGrid);
    const route = planner.planMultiLegRoute(waypoints, 'foot');

    expect(route).not.toBeNull();
    if (route) {
      expect(route.coordinates.length).toBeGreaterThan(1);
      expect(route.totalDistance_m).toBeGreaterThan(0);
      expect(route.totalDuration_min).toBeGreaterThan(30); // includes dwell
      expect(route.walkBackMarginSafe).toBe(true);
      expect(route.commsLos_pct).toBeGreaterThanOrEqual(0);
      expect(route.commsLos_pct).toBeLessThanOrEqual(100);

      // Verify that no vertex lands on an impassable cell (col 160, rows 0-140)
      for (const [lon, lat] of route.coordinates) {
        const [c, r] = planner.lonlatToCell(lon, lat);
        const idx = r * mockMeta.width + c;
        expect(costGrid[idx]).toBeLessThan(255);
      }
    }
  });

  it('calculates rover-assisted traverse with higher speed and reduced transit time', () => {
    const planner = new RoutePlanner(mockMeta, costGrid, slopeGrid, elevGrid);
    const footRoute = planner.planMultiLegRoute(waypoints, 'foot');
    const roverRoute = planner.planMultiLegRoute(waypoints, 'rover');

    expect(footRoute).not.toBeNull();
    expect(roverRoute).not.toBeNull();

    if (footRoute && roverRoute) {
      expect(roverRoute.totalDistance_m).toBeCloseTo(footRoute.totalDistance_m, -2);
      // Rover transit duration should be strictly faster than foot
      expect(roverRoute.totalDuration_min).toBeLessThan(footRoute.totalDuration_min);
      expect(roverRoute.mobilityMode).toBe('rover');
    }
  });

  it('generates a closed Safe Return Envelope polygon that contracts under emergency time limit', () => {
    const envelopeGen = new ReturnEnvelopeGenerator(mockMeta, costGrid, slopeGrid);

    // 1. Long excursion envelope
    const nominalEnvelope = envelopeGen.generateEnvelopePolygon([77.44, 18.435], 5.0, 1.0);
    expect(nominalEnvelope.geometry.type).toBe('Polygon');
    const nomCoords = nominalEnvelope.geometry.coordinates[0];
    expect(nomCoords.length).toBeGreaterThan(10);
    expect(nomCoords[0]).toEqual(nomCoords[nomCoords.length - 1]);

    // 2. Short 0.5 min emergency envelope
    const shortEnvelope = envelopeGen.generateEnvelopePolygon([77.44, 18.435], 0.5, 1.0);
    const shortCoords = shortEnvelope.geometry.coordinates[0];
    expect(shortCoords.length).toBeGreaterThan(10);

    const nomSpan = Math.abs(nomCoords[0][0] - 77.44);
    const shortSpan = Math.abs(shortCoords[0][0] - 77.44);
    expect(nomSpan).toBeGreaterThan(shortSpan);
  });
});

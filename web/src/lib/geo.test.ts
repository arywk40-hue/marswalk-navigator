import { describe, it, expect } from 'vitest';
import { marsDistanceM, marsBearingDeg, suitWalkingSpeedMps } from './geo';

describe('Mars Geo Mathematics', () => {
  it('calculates realistic distance on Mars', () => {
    // 1 degree latitude at equator on Mars:
    // 2 * pi * 3396190 / 360 = ~59,274 m
    const dist = marsDistanceM(0, 0, 0, 1);
    expect(dist).toBeGreaterThan(59000);
    expect(dist).toBeLessThan(60000);
  });

  it('calculates cardinal bearings', () => {
    // Due North
    expect(marsBearingDeg(77.4, 18.4, 77.4, 18.5)).toBeCloseTo(0, 0);
    // Due East
    expect(marsBearingDeg(77.4, 18.4, 77.5, 18.4)).toBeCloseTo(90, 0);
    // Due South
    expect(marsBearingDeg(77.4, 18.5, 77.4, 18.4)).toBeCloseTo(180, 0);
  });

  it('models suit walking speed and hard slope cutoff', () => {
    // Flat ground speed (~2.5 km/h = ~0.69 m/s)
    const flatSpeed = suitWalkingSpeedMps(0);
    expect(flatSpeed).toBeGreaterThan(0.6);
    expect(flatSpeed).toBeLessThan(0.8);

    // Steep slope above 15 degrees is impassable
    expect(suitWalkingSpeedMps(15.0)).toBe(0);
    expect(suitWalkingSpeedMps(25.0)).toBe(0);
    expect(suitWalkingSpeedMps(-16.0)).toBe(0);

    // Moderate uphill slope reduces speed
    const uphillSpeed = suitWalkingSpeedMps(8);
    expect(uphillSpeed).toBeLessThan(flatSpeed);
    expect(uphillSpeed).toBeGreaterThan(0.1);
  });
});


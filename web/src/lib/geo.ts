/**
 * Mars geospatial mathematics and Tobler suit mobility models.
 * Datum: IAU 2000 Mars Sphere (R = 3,396,190 m)
 */

export const MARS_RADIUS_M = 3396190.0;
export const MARS_GRAVITY = 0.376; // g / Earth gravity ratio (~0.38 g)

export const DEFAULT_SUIT_PARAMS = {
  v0_kmh: 2.5, // flat walking speed (km/h)
  vmin_kmh: 0.4, // minimum crawling speed on steep terrain
  vmax_kmh: 3.2, // maximum safe speed on slight downslopes
  hard_slope_deg: 15.0, // impassable slope cutoff
  caution_slope_deg: 10.0,
  o2_rate_w_base: 240.0, // baseline metabolic consumption (Watts)
  o2_rate_w_speed: 120.0, // per m/s speed consumption
  o2_rate_w_slope: 35.0, // per degree positive slope uphill
  suit_o2_capacity_hours: 8.0,
  walk_back_safety_factor: 1.5,
};

/**
 * Calculates the great circle distance in meters between two points on Mars.
 */
export function marsDistanceM(
  lon1: number,
  lat1: number,
  lon2: number,
  lat2: number
): number {
  const toRad = Math.PI / 180;
  const dLat = (lat2 - lat1) * toRad;
  const dLon = (lon2 - lon1) * toRad;
  const phi1 = lat1 * toRad;
  const phi2 = lat2 * toRad;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return MARS_RADIUS_M * c;
}

/**
 * Calculates the forward azimuth / bearing in degrees [0, 360) from point 1 to point 2.
 */
export function marsBearingDeg(
  lon1: number,
  lat1: number,
  lon2: number,
  lat2: number
): number {
  const toRad = Math.PI / 180;
  const toDeg = 180 / Math.PI;

  const phi1 = lat1 * toRad;
  const phi2 = lat2 * toRad;
  const dLon = (lon2 - lon1) * toRad;

  const y = Math.sin(dLon) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLon);

  const b = Math.atan2(y, x) * toDeg;
  return (b + 360) % 360;
}

/**
 * Tobler-style walking speed in m/s on Mars adjusted for 0.38 g gravity and EVA suit mass.
 * @param slopeDeg Slope in degrees (positive = uphill, negative = downhill)
 */
export function suitWalkingSpeedMps(slopeDeg: number): number {
  const { v0_kmh, vmin_kmh, vmax_kmh, hard_slope_deg } = DEFAULT_SUIT_PARAMS;

  if (Math.abs(slopeDeg) >= hard_slope_deg) {
    return 0; // Impassable
  }

  // Tobler-like exponential decay adjusted for spacesuit inertia:
  // v = v0 * exp(-3.0 * |tan(slope) + 0.04|)
  const slopeRad = (slopeDeg * Math.PI) / 180;
  const tanSlope = Math.tan(slopeRad);
  const factor = Math.exp(-3.2 * Math.abs(tanSlope + 0.03));

  const speedKmh = Math.max(vmin_kmh, Math.min(vmax_kmh, v0_kmh * factor));
  return speedKmh / 3.6; // convert km/h to m/s
}

/**
 * Converts meters to friendly string
 */
export function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2)} km`;
  }
  return `${Math.round(meters)} m`;
}

/**
 * Formats duration in minutes to HH:MM
 */
export function formatDuration(minutes: number): string {
  const hrs = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return `${hrs}h ${mins.toString().padStart(2, '0')}m`;
}

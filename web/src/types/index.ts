export type Provenance = 'real' | 'derived' | 'model' | 'sample';

export interface LegendStop {
  value: number;
  color: string;
  label: string;
}

export interface Legend {
  kind: 'gradient' | 'categorical' | 'none';
  title?: string;
  stops: LegendStop[];
}

export interface Layer {
  id: string;
  label: string;
  type: 'raster' | 'raster-tiles' | 'raster-image' | 'vector';
  category: 'optical' | 'topographic' | 'thermal' | 'spectral' | 'hazard' | 'radiation' | 'weather';
  url: string;
  fallbackUrl?: string;
  resolution_m: number;
  source: string;
  productId: string;
  date: string;
  link: string;
  provenance: Provenance;
  legend: Legend;
  defaultOpacity: number;
  defaultVisible: boolean;
}

export interface AOI {
  name: string;
  bbox: [number, number, number, number]; // [lon_min, lat_min, lon_max, lat_max]
  center: [number, number]; // [lon, lat]
  crs: string;
  gridRes_m: number;
}

export interface Manifest {
  aoi: AOI;
  layers: Layer[];
}

export interface Target {
  id: string;
  name: string;
  category: string;
  coordinates: [number, number]; // [lon, lat]
  science_value: number; // 1 - 5
  priority: string;
  reason: string;
  layer_evidence: string[];
  estimated_dwell_min: number;
  recommended_tools: string[];
}

export interface ElevationPoint {
  distance_m: number;
  elevation_m: number;
  slope_deg: number;
}

export interface PlannedRoute {
  coordinates: [number, number][];
  waypoints: Target[];
  totalDistance_m: number;
  totalDuration_min: number;
  walkBackDuration_min: number;
  walkBackDistance_m: number;
  maxSlope_deg: number;
  meanSlope_deg: number;
  elevationGain_m: number;
  o2Consumed_pct: number;
  o2Remaining_pct: number;
  batteryConsumed_pct: number;
  batteryRemaining_pct: number;
  walkBackMarginSafe: boolean;
  elevationProfile: ElevationPoint[];
  commsLos_pct: number; // Line of sight to Habitat Alpha
  mobilityMode: 'foot' | 'rover';
}

export type SafetyLevel = 'ok' | 'caution' | 'critical';

export interface SafetyFactor {
  id: string;
  name: string;
  level: SafetyLevel;
  value: string;
  limit: string;
  detail: string;
}

export interface WeatherData {
  site: string;
  source: string;
  provenance: Provenance;
  sols: Array<{
    sol: number;
    ls_deg: number;
    tmin_c: number;
    tmax_c: number;
    pressure_pa: number;
    wind_mean_mps: number;
    wind_max_mps: number;
    wind_dir_deg: number;
    dust_tau: number;
    sunrise_local: string;
    sunset_local: string;
  }>;
  hourly_profile: Array<{
    hour: string;
    temp_c: number;
    wind_mps: number;
    uv_index: number;
  }>;
}

export interface RadiationData {
  baseline_dose_uSv_per_h: number;
  daily_dose_mSv: number;
  source: string;
  provenance: Provenance;
  caveat: string;
  limits: {
    eva_dose_limit_mSv: number;
    annual_career_limit_mSv: number;
    note: string;
  };
  spe_scenario: {
    event_name: string;
    multiplier: number;
    active_dose_uSv_per_h: number;
    shelter_time_required_min: number;
    description: string;
  };
}

export interface POVImage {
  id: string;
  targetId?: string;
  camera: string;
  sol: number;
  imageUrl: string;
  thumbUrl: string;
  title: string;
  credit: string;
  heading_deg: number;
  caption: string;
}

export type DisplayMode = 'planning' | 'hud';


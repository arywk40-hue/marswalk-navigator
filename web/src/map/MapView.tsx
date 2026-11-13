import React, { useEffect, useRef, useState } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import ImageLayer from 'ol/layer/Image';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import XYZ from 'ol/source/XYZ';
import Static from 'ol/source/ImageStatic';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import LineString from 'ol/geom/LineString';
import Polygon from 'ol/geom/Polygon';
import GeoJSON from 'ol/format/GeoJSON';
import { Style, Stroke, Fill, Text, Circle as CircleStyle } from 'ol/style';
import { defaults as defaultControls, ScaleLine } from 'ol/control';
import { useAppStore } from '../store/useAppStore';
import { Target, GeologicUnit } from '../types';
import {
  Crosshair,
  Compass,
  ZoomIn,
  ZoomOut,
  X,
  Target as TargetIcon,
  Layers,
  Sun,
  Radio,
} from 'lucide-react';

interface MapViewProps {
  envelopeCoords?: [number, number][][];
  showEnvelope?: boolean;
  showTraverse?: boolean;
}

function hexToRgba(hex: string, alpha: number): string {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map((x) => x + x).join('');
  }
  const num = parseInt(c, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const MapView: React.FC<MapViewProps> = ({
  envelopeCoords,
  showEnvelope = true,
  showTraverse = false,
}) => {
  const mapElement = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const tileLayersRef = useRef<Record<string, TileLayer<XYZ>>>({});
  const imageLayersRef = useRef<Record<string, ImageLayer<Static>>>({});
  const vectorLayersRef = useRef<Record<string, VectorLayer<any>>>({});
  const vectorSourceRef = useRef<VectorSource>(new VectorSource());
  const routeSourceRef = useRef<VectorSource>(new VectorSource());
  const envelopeSourceRef = useRef<VectorSource>(new VectorSource());
  const traverseSourceRef = useRef<VectorSource>(new VectorSource());

  const {
    layers,
    layerVisibility,
    layerOpacity,
    toggleLayer,
    targets,
    waypoints,
    plannedRoute,
    displayMode,
    setSelectedTarget,
    timeOfSol,
  } = useAppStore();

  const [cursorCoord, setCursorCoord] = useState<{ lon: number; lat: number } | null>(null);
  const [selectedGeology, setSelectedGeology] = useState<GeologicUnit | null>(null);

  const isHud = displayMode === 'hud';
  const aoiExtent = [77.40, 18.40, 77.48, 18.47]; // [lon_min, lat_min, lon_max, lat_max]

  // Solar calculation from timeOfSol
  const hoursSinceNoon = Math.abs(timeOfSol - 12.0);
  const sunElevationDeg = Math.max(0, Math.round(65.0 - hoursSinceNoon * 11.2));
  const sunAzimuthDeg = Math.round(90 + (timeOfSol / 24) * 240);

  // 1. Initialize OpenLayers Map in Mars Equirectangular Projection (EPSG:4326)
  useEffect(() => {
    if (!mapElement.current || mapRef.current) return;

    const envelopeLayer = new VectorLayer({
      source: envelopeSourceRef.current,
      zIndex: 80,
    });

    const traverseLayer = new VectorLayer({
      source: traverseSourceRef.current,
      zIndex: 85,
    });

    const routeLayer = new VectorLayer({
      source: routeSourceRef.current,
      zIndex: 90,
    });

    const vectorLayer = new VectorLayer({
      source: vectorSourceRef.current,
      zIndex: 100,
    });

    const map = new Map({
      target: mapElement.current,
      layers: [envelopeLayer, traverseLayer, routeLayer, vectorLayer],
      view: new View({
        projection: 'EPSG:4326', // Equirectangular (lon/lat degrees)
        center: [77.44, 18.435], // Jezero Crater Delta Front center
        zoom: 13.5,
        minZoom: 11,
        maxZoom: 18,
      }),
      controls: defaultControls({ attribution: false, zoom: false, rotate: false }).extend([
        new ScaleLine({ units: 'metric', className: 'mars-scale-line' }),
      ]),
    });

    map.on('pointermove', (evt) => {
      const coord = evt.coordinate;
      if (coord) {
        setCursorCoord({
          lon: Number(coord[0].toFixed(5)),
          lat: Number(coord[1].toFixed(5)),
        });
      }
    });

    map.on('click', (evt) => {
      let clickedTarget: Target | null = null;
      let clickedGeology: GeologicUnit | null = null;

      map.forEachFeatureAtPixel(evt.pixel, (f) => {
        const targetData = f.get('targetData') as Target | undefined;
        if (targetData && !clickedTarget) {
          clickedTarget = targetData;
        }

        const code = f.get('code');
        const strat = f.get('stratigraphy');
        if (code && strat && !clickedGeology) {
          clickedGeology = {
            code,
            name: f.get('name') || code,
            stratigraphy: strat,
            age: f.get('age') || '',
            lithology: f.get('lithology') || '',
            mineralogy: f.get('mineralogy') || '',
            biosignature_potential: f.get('biosignature_potential') || '',
            rover_stops: f.get('rover_stops') || [],
            drill_cores: f.get('drill_cores') || [],
            color: f.get('color') || '#0284c7',
          };
        }
      });

      if (clickedTarget) {
        setSelectedTarget(clickedTarget);
        setSelectedGeology(null);
        return;
      }

      if (clickedGeology) {
        setSelectedGeology(clickedGeology);
        return;
      }

      // If clicked on open terrain, create a custom survey stop
      const coord = evt.coordinate;
      if (coord) {
        const lon = Number(coord[0].toFixed(5));
        const lat = Number(coord[1].toFixed(5));

        if (lon >= 77.40 && lon <= 77.48 && lat >= 18.40 && lat <= 18.47) {
          const currentTargets = useAppStore.getState().targets;
          const customTarget: Target = {
            id: `CUSTOM-${Date.now()}`,
            name: `Field Survey Stop ${currentTargets.length}`,
            category: 'In-Situ Field Choice',
            coordinates: [lon, lat],
            science_value: 4,
            priority: 'Opportunity',
            reason: `Astronaut-designated surface observation stop at ${lon}°E, ${lat}°N.`,
            layer_evidence: ['In-Situ Field Choice'],
            estimated_dwell_min: 20,
            recommended_tools: ['Multispectral imager', 'Regolith scoop'],
          };
          useAppStore.getState().setTargets([...currentTargets, customTarget]);
          useAppStore.getState().setSelectedTarget(customTarget);
          setSelectedGeology(null);
        }
      }
    });

    mapRef.current = map;

    return () => {
      map.setTarget(undefined);
      mapRef.current = null;
    };
  }, []);

  // 2. Synchronize Layers (Tile, Static Overlay PNGs, Vector GeoJSON)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || layers.length === 0) return;

    layers.forEach((layerDef, idx) => {
      const isVisible = !!layerVisibility[layerDef.id];
      const opacity = layerOpacity[layerDef.id] ?? layerDef.defaultOpacity;

      if (layerDef.type === 'raster-tiles') {
        let olLayer = tileLayersRef.current[layerDef.id];
        if (!olLayer) {
          const source = new XYZ({
            projection: 'EPSG:4326',
            url: layerDef.url,
            crossOrigin: 'anonymous',
            maxZoom: 18,
          });
          olLayer = new TileLayer({
            source,
            opacity,
            visible: isVisible,
            zIndex: idx + 1,
          });
          tileLayersRef.current[layerDef.id] = olLayer;
          map.addLayer(olLayer);
        } else {
          olLayer.setVisible(isVisible);
          olLayer.setOpacity(opacity);
        }
      } else if (layerDef.type === 'raster-image' || layerDef.type === 'raster') {
        let olLayer = imageLayersRef.current[layerDef.id];
        if (!olLayer) {
          const source = new Static({
            url: layerDef.url,
            imageExtent: aoiExtent,
            projection: 'EPSG:4326',
          });
          olLayer = new ImageLayer({
            source,
            opacity,
            visible: isVisible,
            zIndex: idx + 10,
          });
          imageLayersRef.current[layerDef.id] = olLayer;
          map.addLayer(olLayer);
        } else {
          olLayer.setVisible(isVisible);
          olLayer.setOpacity(opacity);
        }
      } else if (layerDef.type === 'vector') {
        let olLayer = vectorLayersRef.current[layerDef.id];
        if (!olLayer) {
          const vectorSource = new VectorSource({
            url: layerDef.url,
            format: new GeoJSON(),
          });
          olLayer = new VectorLayer({
            source: vectorSource as any,
            opacity,
            visible: isVisible,
            zIndex: idx + 25,
            style: (feature) => {
              const color = (feature.get('color') as string) || '#0284c7';
              const code = (feature.get('code') as string) || '';
              return new Style({
                fill: new Fill({
                  color: hexToRgba(color, 0.4),
                }),
                stroke: new Stroke({
                  color: color,
                  width: 2,
                }),
                text: new Text({
                  text: code,
                  font: 'bold 11px monospace',
                  fill: new Fill({ color: '#ffffff' }),
                  stroke: new Stroke({ color: '#000000', width: 3 }),
                  overflow: true,
                }),
              });
            },
          });
          vectorLayersRef.current[layerDef.id] = olLayer;
          map.addLayer(olLayer);
        } else {
          olLayer.setVisible(isVisible);
          olLayer.setOpacity(opacity);
        }
      }
    });
  }, [layers, layerVisibility, layerOpacity]);

  // 3. Update Targets & Waypoints Vector Layer
  useEffect(() => {
    const source = vectorSourceRef.current;
    source.clear();

    targets.forEach((target) => {
      const feature = new Feature({
        geometry: new Point(target.coordinates),
        targetData: target,
      });

      const isBase = target.id.startsWith('BASE');
      const isSelected = waypoints.some((w) => w.id === target.id);

      const markerColor = isBase
        ? '#38bdf8'
        : isSelected
        ? '#22c55e'
        : '#eab308';

      feature.setStyle(
        new Style({
          image: new CircleStyle({
            radius: isBase ? 11 : 8.5,
            fill: new Fill({ color: markerColor }),
            stroke: new Stroke({
              color: '#ffffff',
              width: 2,
            }),
          }),
          text: new Text({
            text: target.name.split(' ')[0],
            font: 'bold 11px monospace',
            offsetY: -16,
            fill: new Fill({ color: isHud ? '#f59e0b' : '#ffffff' }),
            stroke: new Stroke({ color: '#000000', width: 3 }),
          }),
        })
      );

      source.addFeature(feature);
    });
  }, [targets, waypoints, isHud]);

  // 4. Update Planned Route Polyline
  useEffect(() => {
    const source = routeSourceRef.current;
    source.clear();

    if (plannedRoute && plannedRoute.coordinates.length > 1) {
      const lineFeature = new Feature({
        geometry: new LineString(plannedRoute.coordinates),
      });

      lineFeature.setStyle(
        new Style({
          stroke: new Stroke({
            color: isHud ? '#f59e0b' : '#38bdf8',
            width: isHud ? 4.5 : 3.5,
            lineDash: isHud ? [8, 4] : undefined,
          }),
        })
      );

      source.addFeature(lineFeature);
    }
  }, [plannedRoute, isHud]);

  // 5. Update Safe Return Envelope Polygon
  useEffect(() => {
    const source = envelopeSourceRef.current;
    source.clear();

    if (showEnvelope && envelopeCoords && envelopeCoords.length > 0) {
      const polyFeature = new Feature({
        geometry: new Polygon(envelopeCoords),
      });

      polyFeature.setStyle(
        new Style({
          stroke: new Stroke({
            color: isHud ? 'rgba(239, 68, 68, 0.9)' : 'rgba(56, 189, 248, 0.85)',
            width: 2.5,
            lineDash: [6, 6],
          }),
          fill: new Fill({
            color: isHud ? 'rgba(239, 68, 68, 0.1)' : 'rgba(56, 189, 248, 0.12)',
          }),
        })
      );

      source.addFeature(polyFeature);
    }
  }, [envelopeCoords, showEnvelope, isHud]);

  // 6. Update Perseverance Traverse Benchmark
  useEffect(() => {
    const source = traverseSourceRef.current;
    source.clear();

    if (showTraverse) {
      fetch('./data/perseverance_traverse.geojson')
        .then((res) => res.json())
        .then((data) => {
          const features = new GeoJSON().readFeatures(data);
          features.forEach((f) => {
            f.setStyle(
              new Style({
                stroke: new Stroke({
                  color: '#eab308', // Amber dashed for real rover track
                  width: 2.5,
                  lineDash: [4, 4],
                }),
              })
            );
          });
          source.addFeatures(features);
        })
        .catch((e) => console.error('Failed to load traverse:', e));
    }
  }, [showTraverse]);

  const handleCenterHabitat = () => {
    const view = mapRef.current?.getView();
    view?.animate({
      center: [77.44, 18.435],
      zoom: 13.5,
      duration: 600,
    });
  };

  const isGeologyActive = !!layerVisibility['usgs_geology_units'];

  return (
    <div className="relative flex-1 h-full w-full bg-[#08090c] overflow-hidden select-none">
      {/* OpenLayers Map Canvas */}
      <div ref={mapElement} className="w-full h-full" />

      {/* Tactical Screen Corner HUD Brackets */}
      <div className="absolute top-3 left-3 pointer-events-none opacity-40 text-slate-400 font-mono text-xs">
        ┌ 18.47°N / 77.40°E
      </div>
      <div className="absolute top-3 right-16 pointer-events-none opacity-40 text-slate-400 font-mono text-xs text-right">
        18.47°N / 77.48°E ┐
      </div>
      <div className="absolute bottom-12 left-3 pointer-events-none opacity-40 text-slate-400 font-mono text-xs">
        └ 18.40°N / 77.40°E
      </div>
      <div className="absolute bottom-12 right-3 pointer-events-none opacity-40 text-slate-400 font-mono text-xs text-right">
        18.40°N / 77.48°E ┘
      </div>

      {/* Crosshair Center Reticle */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-25">
        <Crosshair className={`w-10 h-10 ${isHud ? 'text-amber-500' : 'text-cyan-400'}`} />
      </div>

      {/* Floating Tactical Quick Toolbar (Top Center) */}
      {!isHud && (
        <div className="absolute top-3.5 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 p-1 rounded-xl bg-slate-950/85 border border-slate-800/90 shadow-2xl backdrop-blur-xl font-mono text-xs">
          <button
            onClick={handleCenterHabitat}
            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center gap-1.5 transition-all border border-slate-800 shadow-sm"
            title="Pan map to Habitat Alpha base"
          >
            <TargetIcon className="w-3.5 h-3.5 text-cyan-400" />
            <span>Center Base</span>
          </button>

          <button
            onClick={() => toggleLayer('usgs_geology_units')}
            className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all border shadow-sm ${
              isGeologyActive
                ? 'bg-purple-950 text-purple-200 border-purple-700 font-bold'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border-slate-800'
            }`}
            title="Toggle USGS SIM 3464 Geologic Units Layer"
          >
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            <span>USGS Geology</span>
          </button>

          <div className="h-4 w-px bg-slate-800 mx-0.5" />

          <div className="px-2 py-1 text-[10px] text-slate-400 flex items-center gap-1">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span className="hidden sm:inline">Comms LOS: Direct</span>
          </div>
        </div>
      )}

      {/* Tactical Compass / North Arrow */}
      <div className="absolute top-4 right-4 z-10 flex flex-col items-center p-2 rounded-xl bg-slate-950/85 backdrop-blur-xl border border-slate-800/80 text-xs font-mono pointer-events-none select-none shadow-xl">
        <Compass className={`w-6 h-6 mb-1 ${isHud ? 'text-amber-400' : 'text-red-500'}`} />
        <span className="font-bold text-[10px] tracking-wider text-slate-300">N (000°)</span>
      </div>

      {/* Geological Unit Inspector Card */}
      {selectedGeology && (
        <div className="absolute top-14 left-4 z-20 w-84 p-4 rounded-2xl bg-slate-950/95 border border-slate-700/80 shadow-2xl backdrop-blur-2xl text-slate-200 font-mono space-y-3 animate-in fade-in slide-in-from-top-3 ring-1 ring-white/10">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <span
                className="w-4 h-4 rounded-full shrink-0 border border-white/60 shadow-md"
                style={{ backgroundColor: selectedGeology.color }}
              />
              <div>
                <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-cyan-300 border border-slate-700">
                  {selectedGeology.code}
                </span>
                <h4 className="text-xs font-bold text-white mt-1">
                  {selectedGeology.name}
                </h4>
              </div>
            </div>
            <button
              onClick={() => setSelectedGeology(null)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="text-[11px] space-y-1.5 border-t border-slate-800/90 pt-2 text-slate-300 leading-snug">
            <div>
              <span className="text-slate-500 font-semibold mr-1.5">Stratigraphy:</span>
              <span>{selectedGeology.stratigraphy}</span>
            </div>
            <div>
              <span className="text-slate-500 font-semibold mr-1.5">Age:</span>
              <span className="text-amber-300">{selectedGeology.age}</span>
            </div>
            <div>
              <span className="text-slate-500 font-semibold mr-1.5">Lithology:</span>
              <span>{selectedGeology.lithology}</span>
            </div>
            <div>
              <span className="text-slate-500 font-semibold mr-1.5">Mineralogy:</span>
              <span className="text-emerald-300">{selectedGeology.mineralogy}</span>
            </div>
            <div>
              <span className="text-slate-500 font-semibold mr-1.5">Biosignature:</span>
              <span className="text-purple-300 font-bold">{selectedGeology.biosignature_potential}</span>
            </div>
          </div>

          {selectedGeology.drill_cores.length > 0 && (
            <div className="pt-2 border-t border-slate-800/90 flex items-center justify-between text-[10px]">
              <span className="text-slate-500">M2020 Drill Cores:</span>
              <span className="px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800 font-bold shadow-sm">
                {selectedGeology.drill_cores.join(', ')}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Map Zoom Controls */}
      <div className="absolute bottom-16 right-4 z-10 flex flex-col gap-1.5">
        <button
          onClick={() => {
            const view = mapRef.current?.getView();
            view?.setZoom((view.getZoom() ?? 13) + 1);
          }}
          className={`p-2 rounded-xl border backdrop-blur-xl transition-all shadow-lg active:scale-95 ${
            isHud
              ? 'bg-black/85 border-amber-500/50 text-amber-400 hover:bg-amber-950/60'
              : 'bg-slate-950/85 border-slate-800 text-slate-200 hover:bg-slate-800'
          }`}
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            const view = mapRef.current?.getView();
            view?.setZoom((view.getZoom() ?? 13) - 1);
          }}
          className={`p-2 rounded-xl border backdrop-blur-xl transition-all shadow-lg active:scale-95 ${
            isHud
              ? 'bg-black/85 border-amber-500/50 text-amber-400 hover:bg-amber-950/60'
              : 'bg-slate-950/85 border-slate-800 text-slate-200 hover:bg-slate-800'
          }`}
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
      </div>

      {/* Tactical Coordinate & Telemetry HUD Readout Bar */}
      <div
        className={`absolute bottom-3 left-4 z-10 px-3.5 py-1.5 rounded-xl border font-mono text-xs backdrop-blur-xl flex items-center gap-4 shadow-xl ${
          isHud
            ? 'bg-black/90 border-amber-500/50 text-amber-300'
            : 'bg-slate-950/90 border-slate-800 text-slate-300'
        }`}
      >
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500 font-bold">LON:</span>
          <span className="text-white font-semibold">{cursorCoord ? `${cursorCoord.lon}°E` : '77.4400°E'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500 font-bold">LAT:</span>
          <span className="text-white font-semibold">{cursorCoord ? `${cursorCoord.lat}°N` : '18.4350°N'}</span>
        </div>
        <div className="hidden md:flex items-center gap-1.5 text-amber-300">
          <Sun className="w-3.5 h-3.5 text-amber-400" />
          <span>AZ {sunAzimuthDeg}° • ELEV {sunElevationDeg}°</span>
        </div>
        <div className="hidden lg:flex items-center gap-1.5 text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>RF LOS: DIRECT</span>
        </div>
        <div className="hidden sm:block text-[11px] text-slate-500">
          IAU2000 Mars
        </div>
      </div>
    </div>
  );
};

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
import { Target } from '../types';
import { Crosshair, Compass, ZoomIn, ZoomOut } from 'lucide-react';

interface MapViewProps {
  envelopeCoords?: [number, number][][];
  showEnvelope?: boolean;
  showTraverse?: boolean;
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
  const vectorSourceRef = useRef<VectorSource>(new VectorSource());
  const routeSourceRef = useRef<VectorSource>(new VectorSource());
  const envelopeSourceRef = useRef<VectorSource>(new VectorSource());
  const traverseSourceRef = useRef<VectorSource>(new VectorSource());

  const {
    layers,
    layerVisibility,
    layerOpacity,
    targets,
    waypoints,
    plannedRoute,
    displayMode,
    setSelectedTarget,
  } = useAppStore();

  const [cursorCoord, setCursorCoord] = useState<{ lon: number; lat: number } | null>(null);

  const isHud = displayMode === 'hud';
  const aoiExtent = [77.40, 18.40, 77.48, 18.47]; // [lon_min, lat_min, lon_max, lat_max]

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
      const feature = map.forEachFeatureAtPixel(evt.pixel, (f) => f);
      if (feature) {
        const targetData = feature.get('targetData') as Target | undefined;
        if (targetData) {
          setSelectedTarget(targetData);
          return;
        }
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
            name: `Field Survey Point ${currentTargets.length}`,
            category: 'Field Observation',
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
        }
      }
    });

    mapRef.current = map;

    return () => {
      map.setTarget(undefined);
      mapRef.current = null;
    };
  }, []);

  // 2. Synchronize Layers (Tile and Static Overlay PNGs)
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

      const isBase = target.id.startsWith('BASE') || target.id.startsWith('HAB');
      const isWaypoint = waypoints.some((w) => w.id === target.id);
      const wpIndex = waypoints.findIndex((w) => w.id === target.id);

      const color = isBase ? '#10b981' : isWaypoint ? '#00f0ff' : '#f59e0b';

      feature.setStyle(
        new Style({
          image: new CircleStyle({
            radius: isBase ? 10 : 8,
            fill: new Fill({ color: isHud ? '#000000' : color }),
            stroke: new Stroke({
              color: isHud ? (isBase ? '#00ff66' : '#ffb000') : '#ffffff',
              width: 2.5,
            }),
          }),
          text: new Text({
            text: isWaypoint ? `${wpIndex + 1}` : target.name.split(' ')[0],
            offsetY: isWaypoint ? 0 : -16,
            font: isHud ? 'bold 12px monospace' : 'bold 11px sans-serif',
            fill: new Fill({ color: isHud ? '#ffb000' : '#ffffff' }),
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
      const routeFeature = new Feature({
        geometry: new LineString(plannedRoute.coordinates),
      });

      routeFeature.setStyle(
        new Style({
          stroke: new Stroke({
            color: isHud ? '#ffb000' : '#00f0ff',
            width: isHud ? 4.5 : 3.5,
            lineDash: isHud ? [8, 4] : undefined,
          }),
        })
      );

      source.addFeature(routeFeature);
    }
  }, [plannedRoute, isHud]);

  // 5. Update Safe Return Envelope (Hero Feature)
  useEffect(() => {
    const source = envelopeSourceRef.current;
    source.clear();

    if (showEnvelope && envelopeCoords && envelopeCoords.length > 0) {
      const envelopeFeature = new Feature({
        geometry: new Polygon(envelopeCoords),
      });

      envelopeFeature.setStyle(
        new Style({
          fill: new Fill({
            color: isHud ? 'rgba(255, 176, 0, 0.15)' : 'rgba(0, 240, 255, 0.18)',
          }),
          stroke: new Stroke({
            color: isHud ? '#ffb000' : '#00f0ff',
            width: 2,
            lineDash: [6, 6],
          }),
        })
      );

      source.addFeature(envelopeFeature);
    }
  }, [envelopeCoords, showEnvelope, isHud]);

  // 6. Update Perseverance Real Traverse Benchmark
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

  return (
    <div className="relative flex-1 h-full w-full bg-[#0a0b0e] overflow-hidden">
      {/* OpenLayers Map Canvas */}
      <div ref={mapElement} className="w-full h-full" />

      {/* Crosshair Center Reticle */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-30">
        <Crosshair className={`w-8 h-8 ${isHud ? 'text-amber-500' : 'text-slate-400'}`} />
      </div>

      {/* Tactical Compass / North Arrow */}
      <div className="absolute top-4 right-4 z-10 flex flex-col items-center p-2 rounded-lg bg-black/60 backdrop-blur border border-slate-800 text-xs font-mono pointer-events-none select-none">
        <Compass className={`w-6 h-6 mb-1 ${isHud ? 'text-amber-400' : 'text-red-500'}`} />
        <span className="font-bold text-[10px]">N (000°)</span>
      </div>

      {/* Map Zoom Controls */}
      <div className="absolute bottom-16 right-4 z-10 flex flex-col gap-1.5">
        <button
          onClick={() => {
            const view = mapRef.current?.getView();
            view?.setZoom((view.getZoom() ?? 13) + 1);
          }}
          className={`p-2 rounded-lg border backdrop-blur transition-all ${
            isHud
              ? 'bg-black/80 border-amber-500/50 text-amber-400 hover:bg-amber-950/60'
              : 'bg-slate-900/80 border-slate-700 text-slate-200 hover:bg-slate-800'
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
          className={`p-2 rounded-lg border backdrop-blur transition-all ${
            isHud
              ? 'bg-black/80 border-amber-500/50 text-amber-400 hover:bg-amber-950/60'
              : 'bg-slate-900/80 border-slate-700 text-slate-200 hover:bg-slate-800'
          }`}
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
      </div>

      {/* Coordinate HUD Readout Bar */}
      <div className={`absolute bottom-3 left-4 z-10 px-3 py-1.5 rounded-lg border font-mono text-xs backdrop-blur flex items-center gap-4 ${
        isHud
          ? 'bg-black/80 border-amber-500/50 text-amber-300'
          : 'bg-slate-900/80 border-slate-800 text-slate-300'
      }`}>
        <div>
          <span className="text-slate-500 mr-1.5">LON:</span>
          {cursorCoord ? `${cursorCoord.lon}°E` : '77.4400°E'}
        </div>
        <div>
          <span className="text-slate-500 mr-1.5">LAT:</span>
          {cursorCoord ? `${cursorCoord.lat}°N` : '18.4350°N'}
        </div>
        <div className="hidden sm:block">
          <span className="text-slate-500 mr-1.5">CRS:</span>
          <span className="text-emerald-400">IAU2000 Mars Equirectangular</span>
        </div>
      </div>
    </div>
  );
};

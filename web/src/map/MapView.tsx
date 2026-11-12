import React, { useEffect, useRef, useState } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import XYZ from 'ol/source/XYZ';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import LineString from 'ol/geom/LineString';
import { Style, Stroke, Fill, Text, Circle as CircleStyle } from 'ol/style';
import { defaults as defaultControls, ScaleLine } from 'ol/control';
import { useAppStore } from '../store/useAppStore';
import { Target } from '../types';
import { Crosshair, Compass, ZoomIn, ZoomOut } from 'lucide-react';

export const MapView: React.FC = () => {
  const mapElement = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const tileLayersRef = useRef<Record<string, TileLayer<XYZ>>>({});
  const vectorSourceRef = useRef<VectorSource>(new VectorSource());
  const routeSourceRef = useRef<VectorSource>(new VectorSource());

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

  // 1. Initialize Map
  useEffect(() => {
    if (!mapElement.current || mapRef.current) return;

    const vectorLayer = new VectorLayer({
      source: vectorSourceRef.current,
      zIndex: 100,
    });

    const routeLayer = new VectorLayer({
      source: routeSourceRef.current,
      zIndex: 90,
    });

    const map = new Map({
      target: mapElement.current,
      layers: [routeLayer, vectorLayer],
      view: new View({
        projection: 'EPSG:4326', // Equirectangular (lon/lat in degrees)
        center: [77.44, 18.435], // Jezero Crater Delta Front center
        zoom: 13.5,
        minZoom: 10,
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
        }
      }
    });

    mapRef.current = map;

    return () => {
      map.setTarget(undefined);
      mapRef.current = null;
    };
  }, []);

  // 2. Synchronize Tile Layers with Manifest & Visibility
  useEffect(() => {
    const map = mapRef.current;
    if (!map || layers.length === 0) return;

    layers.forEach((layerDef, idx) => {
      let olLayer = tileLayersRef.current[layerDef.id];

      if (!olLayer) {
        // Create XYZ tile source using Mars Trek or fallback
        const source = new XYZ({
          projection: 'EPSG:4326',
          url: layerDef.url,
          crossOrigin: 'anonymous',
          maxZoom: 18,
        });

        olLayer = new TileLayer({
          source,
          opacity: layerOpacity[layerDef.id] ?? layerDef.defaultOpacity,
          visible: !!layerVisibility[layerDef.id],
          zIndex: idx + 1,
        });

        tileLayersRef.current[layerDef.id] = olLayer;
        map.addLayer(olLayer);
      } else {
        olLayer.setVisible(!!layerVisibility[layerDef.id]);
        olLayer.setOpacity(layerOpacity[layerDef.id] ?? layerDef.defaultOpacity);
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

  // 4. Update Planned Route Vector Layer
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
            width: isHud ? 4 : 3,
            lineDash: isHud ? [8, 4] : undefined,
          }),
        })
      );

      source.addFeature(routeFeature);
    }
  }, [plannedRoute, isHud]);

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

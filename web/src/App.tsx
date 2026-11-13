import React, { useEffect, useState, useCallback } from 'react';
import { useAppStore } from './store/useAppStore';
import { Header } from './components/Header';
import { MapView } from './map/MapView';
import { LayerPanel } from './map/LayerPanel';
import { PlannerPanel } from './planner/PlannerPanel';
import { SafetyPanel } from './safety/SafetyPanel';
import { PovPanel } from './pov/PovPanel';
import { GuidedTourModal } from './components/GuidedTourModal';
import { AssumptionsModal } from './components/AssumptionsModal';
import { CueCardModal } from './components/CueCardModal';
import { Manifest, Target } from './types';
import { GridMeta, RoutePlanner } from './planner/astar';
import { ReturnEnvelopeGenerator } from './planner/envelope';
import { formatDistance } from './lib/geo';
import {
  ShieldAlert,
  Plus,
  RotateCcw,
  Sparkles,
  Compass,
  X,
} from 'lucide-react';

export const App: React.FC = () => {
  const {
    displayMode,
    setManifest,
    setTargets,
    targets,
    selectedTarget,
    setSelectedTarget,
    waypoints,
    addWaypoint,
    removeWaypoint,
    clearWaypoints,
    speActive,
    activeTab,
    plannedRoute,
    setPlannedRoute,
    mobilityMode,
    isLeftSidebarOpen,
    isRightDrawerOpen,
    toggleRightDrawer,
  } = useAppStore();

  const [loading, setLoading] = useState(true);
  const [gridMeta, setGridMeta] = useState<GridMeta | null>(null);
  const [costGrid, setCostGrid] = useState<Uint8Array | null>(null);
  const [slopeGrid, setSlopeGrid] = useState<Uint8Array | null>(null);
  const [elevGrid, setElevGrid] = useState<Float32Array | null>(null);
  const [envelopeCoords, setEnvelopeCoords] = useState<[number, number][][]>([]);
  const [showEnvelope, setShowEnvelope] = useState(true);
  const [showTraverse, setShowTraverse] = useState(true);
  const [rightDrawerTab, setRightDrawerTab] = useState<'queue' | 'profile' | 'vitals'>('queue');

  const isHud = displayMode === 'hud';

  // Helper to plan current route
  const planCurrentWaypoints = useCallback(
    (meta: GridMeta, cGrid: Uint8Array, sGrid: Uint8Array, eGrid: Float32Array, wps: Target[]) => {
      if (wps.length < 2) return;
      try {
        const planner = new RoutePlanner(meta, cGrid, sGrid, eGrid);
        const route = planner.planMultiLegRoute(wps, mobilityMode);
        setPlannedRoute(route);
      } catch (err) {
        console.error('Failed auto-route:', err);
      }
    },
    [setPlannedRoute, mobilityMode]
  );

  // Initial Data Load
  useEffect(() => {
    async function loadInitialData() {
      try {
        const [layersRes, targetsRes, metaRes, costRes, slopeRes, elevRes] = await Promise.all([
          fetch('./data/layers.json'),
          fetch('./data/targets.geojson'),
          fetch('./data/grid/meta.json'),
          fetch('./data/grid/cost.bin'),
          fetch('./data/grid/slope.bin'),
          fetch('./data/grid/elev.bin'),
        ]);

        let parsedTargets: Target[] = [];

        if (layersRes.ok) {
          const manifestData: Manifest = await layersRes.json();
          setManifest(manifestData);
        }

        if (targetsRes.ok) {
          const targetsGeo = await targetsRes.json();
          parsedTargets = targetsGeo.features.map((f: any) => ({
            id: f.properties.id,
            name: f.properties.name,
            category: f.properties.category,
            coordinates: f.geometry.coordinates as [number, number],
            science_value: f.properties.science_value,
            priority: f.properties.priority,
            reason: f.properties.reason,
            layer_evidence: f.properties.layer_evidence || [],
            estimated_dwell_min: f.properties.estimated_dwell_min || 30,
            recommended_tools: f.properties.recommended_tools || [],
            geologic_unit: f.properties.geologic_unit,
            associated_cores: f.properties.associated_cores || [],
          }));
          setTargets(parsedTargets);
        }

        if (metaRes.ok && costRes.ok && slopeRes.ok && elevRes.ok) {
          const meta: GridMeta = await metaRes.json();
          const costBuf = await costRes.arrayBuffer();
          const slopeBuf = await slopeRes.arrayBuffer();
          const elevBuf = await elevRes.arrayBuffer();

          const cGrid = new Uint8Array(costBuf);
          const sGrid = new Uint8Array(slopeBuf);
          const eGrid = new Float32Array(elevBuf);

          setGridMeta(meta);
          setCostGrid(cGrid);
          setSlopeGrid(sGrid);
          setElevGrid(eGrid);

          // Hero Feature on Initial Load: Generate Safe Return Envelope from Base Alpha [77.435, 18.420]
          const baseCoord: [number, number] = [77.435, 18.420];
          const envelopeGen = new ReturnEnvelopeGenerator(meta, cGrid, sGrid);
          const envelope = envelopeGen.generateEnvelopePolygon(baseCoord, 180.0, 1.5);
          setEnvelopeCoords(envelope.geometry.coordinates);

          // Default planned route: Base Alpha + Hawksbill Gap
          const baseTarget =
            parsedTargets.find((t) => t.id === 'BASE-ALPHA') ||
            parsedTargets[parsedTargets.length - 1];
          const hawksbillTarget =
            parsedTargets.find((t) => t.id === 'SCI-01') || parsedTargets[0];
          if (baseTarget && hawksbillTarget) {
            const initialWps = [baseTarget, hawksbillTarget];
            addWaypoint(baseTarget);
            addWaypoint(hawksbillTarget);
            planCurrentWaypoints(meta, cGrid, sGrid, eGrid, initialWps);
          }
        }
      } catch (err) {
        console.error('Failed to load initial data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadInitialData();
  }, [setManifest, setTargets, addWaypoint, planCurrentWaypoints]);

  // Optimize Traverse Order (Greedy TSP heuristic keeping Base Alpha first)
  const handleOptimizeOrder = () => {
    if (waypoints.length <= 2) return;
    const start = waypoints[0];
    const unvisited = [...waypoints.slice(1)];
    const optimized = [start];
    let current = start;

    while (unvisited.length > 0) {
      let nearestIdx = 0;
      let minDist = Infinity;
      for (let i = 0; i < unvisited.length; i++) {
        const d = Math.hypot(
          unvisited[i].coordinates[0] - current.coordinates[0],
          unvisited[i].coordinates[1] - current.coordinates[1]
        );
        if (d < minDist) {
          minDist = d;
          nearestIdx = i;
        }
      }
      current = unvisited.splice(nearestIdx, 1)[0];
      optimized.push(current);
    }

    useAppStore.setState({ waypoints: optimized });
    if (gridMeta && costGrid && slopeGrid && elevGrid) {
      planCurrentWaypoints(gridMeta, costGrid, slopeGrid, elevGrid, optimized);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-screen bg-[#08090c] text-slate-300 font-mono space-y-4">
        <div className="relative flex items-center justify-center">
          <div className="w-14 h-14 rounded-full border-2 border-red-500/20 border-t-red-500 animate-spin" />
          <span className="absolute text-red-500 font-bold text-lg">♂</span>
        </div>
        <div className="text-sm font-bold tracking-widest text-slate-100 uppercase">
          Initializing Marswalk Navigator
        </div>
        <div className="text-xs text-slate-500">
          Loading Jezero Crater delta elevation & hazard cost grids...
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col h-screen w-screen overflow-hidden ${
        isHud ? 'bg-black text-amber-400' : 'bg-[#08090c] text-slate-100'
      }`}
    >
      <Header />

      <div className="flex-1 flex overflow-hidden relative">
        {/* Navigation Sidebar Panel depending on Active Tab */}
        {!isHud && isLeftSidebarOpen && (
          <div className="transition-all duration-300 z-20">
            {activeTab === 'layers' && <LayerPanel />}
            {activeTab === 'planner' && (
              <PlannerPanel
                gridMeta={gridMeta}
                costGrid={costGrid}
                slopeGrid={slopeGrid}
                elevGrid={elevGrid}
                onEnvelopeGenerated={(coords) => setEnvelopeCoords(coords)}
                onTraverseToggle={(v) => setShowTraverse(v)}
                showTraverse={showTraverse}
                showEnvelope={showEnvelope}
                onEnvelopeToggle={(v) => setShowEnvelope(v)}
              />
            )}
            {activeTab === 'safety' && <SafetyPanel />}
            {activeTab === 'pov' && <PovPanel />}
          </div>
        )}

        {/* Center Map View */}
        <MapView
          envelopeCoords={envelopeCoords}
          showEnvelope={showEnvelope}
          showTraverse={showTraverse}
        />

        {/* Collapsed Right Drawer Quick Pill (when right drawer is closed) */}
        {!isHud && !isRightDrawerOpen && (
          <button
            onClick={toggleRightDrawer}
            className="absolute top-4 right-4 z-20 px-3 py-1.5 rounded-xl bg-slate-950/90 border border-slate-800 text-slate-200 text-xs font-mono flex items-center gap-2 shadow-2xl backdrop-blur-xl hover:border-cyan-500 transition-all"
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>EVA Queue: {waypoints.length} Stops</span>
            {plannedRoute && (
              <span className="text-cyan-400 font-bold">
                ({formatDistance(plannedRoute.totalDistance_m)})
              </span>
            )}
          </button>
        )}

        {/* Right Sidebar: Target Inspector & Multi-Tab Mission Queue */}
        {!isHud && isRightDrawerOpen && (
          <div className="w-80 bg-[#10121a]/95 border-l border-slate-800/80 flex flex-col h-full text-slate-200 backdrop-blur-xl z-20 shadow-2xl transition-all duration-300">
            {/* Drawer Header with Tabs */}
            <div className="p-3 border-b border-slate-800/80 bg-slate-900/60 flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-mono text-xs">
                <button
                  onClick={() => setRightDrawerTab('queue')}
                  className={`px-2 py-1 rounded-lg transition-all ${
                    rightDrawerTab === 'queue'
                      ? 'bg-slate-800 text-cyan-300 font-bold border border-slate-700 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Stops ({waypoints.length})
                </button>
                <button
                  onClick={() => setRightDrawerTab('profile')}
                  className={`px-2 py-1 rounded-lg transition-all ${
                    rightDrawerTab === 'profile'
                      ? 'bg-slate-800 text-cyan-300 font-bold border border-slate-700 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Profile
                </button>
                <button
                  onClick={() => setRightDrawerTab('vitals')}
                  className={`px-2 py-1 rounded-lg transition-all ${
                    rightDrawerTab === 'vitals'
                      ? 'bg-slate-800 text-cyan-300 font-bold border border-slate-700 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Vitals
                </button>
              </div>

              <button
                onClick={toggleRightDrawer}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Collapse drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 flex-1 overflow-y-auto space-y-4 custom-scrollbar">
              {/* Selected Target Inspector Card */}
              {selectedTarget && (
                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-700 shadow-md space-y-2.5 animate-in fade-in">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-[10px] font-mono uppercase text-cyan-400 font-bold">
                        {selectedTarget.category}
                      </div>
                      <div className="text-sm font-bold text-white mt-0.5">
                        {selectedTarget.name}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-700">
                      ★ {selectedTarget.science_value}/5
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {selectedTarget.reason}
                  </p>

                  <div className="text-[11px] font-mono text-slate-400 space-y-1 bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                    <div>
                      <span className="text-slate-500">Lon/Lat:</span>{' '}
                      {selectedTarget.coordinates[0]}°E, {selectedTarget.coordinates[1]}°N
                    </div>
                    <div>
                      <span className="text-slate-500">Dwell:</span> ~
                      {selectedTarget.estimated_dwell_min} min
                    </div>
                    {selectedTarget.geologic_unit && (
                      <div>
                        <span className="text-slate-500">USGS Unit:</span>{' '}
                        <span className="text-purple-300">{selectedTarget.geologic_unit}</span>
                      </div>
                    )}
                    {selectedTarget.associated_cores && selectedTarget.associated_cores.length > 0 && (
                      <div>
                        <span className="text-slate-500">M2020 Cores:</span>{' '}
                        <span className="text-emerald-300 font-bold">
                          {selectedTarget.associated_cores.join(', ')}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="pt-1 flex gap-2">
                    <button
                      onClick={() => addWaypoint(selectedTarget)}
                      className="flex-1 py-1.5 px-3 bg-red-600 hover:bg-red-500 text-white font-medium text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add to Route
                    </button>
                    <button
                      onClick={() => setSelectedTarget(null)}
                      className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition-colors"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 1: Queue & Ordered Stops */}
              {rightDrawerTab === 'queue' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-slate-400">
                    <span>Traverse Stops ({waypoints.length})</span>
                    <div className="flex items-center gap-2">
                      {waypoints.length > 2 && (
                        <button
                          onClick={handleOptimizeOrder}
                          className="text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1"
                          title="Auto-sort stops to minimize walking distance"
                        >
                          <Sparkles className="w-3 h-3" />
                          Optimize Order
                        </button>
                      )}
                      {waypoints.length > 0 && (
                        <button
                          onClick={clearWaypoints}
                          className="text-red-400 hover:underline flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  {waypoints.length === 0 ? (
                    <div className="p-4 rounded-xl bg-slate-950/40 border border-dashed border-slate-800 text-center text-xs text-slate-500">
                      Click any science marker on the map to inspect objectives and add to the route.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {waypoints.map((wp, i) => (
                        <div
                          key={wp.id}
                          className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs font-mono shadow-sm group hover:border-slate-700 transition-all"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold font-mono shrink-0 shadow-sm ${
                                i === 0
                                  ? 'bg-blue-950 text-blue-300 border border-blue-700'
                                  : 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                              }`}
                            >
                              {i === 0 ? 'H' : i}
                            </span>
                            <div className="min-w-0">
                              <div className="font-semibold text-slate-200 truncate">
                                {wp.name}
                              </div>
                              <div className="text-[10px] text-slate-500 flex items-center gap-2">
                                <span>~{wp.estimated_dwell_min}m dwell</span>
                                {wp.priority && (
                                  <span className="text-amber-400/90 font-medium">
                                    • {wp.priority}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => removeWaypoint(wp.id)}
                            className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors"
                            title="Remove stop"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Quick Catalog of Available Targets */}
                  <div className="pt-2 border-t border-slate-800/80 space-y-2">
                    <div className="text-[10px] font-mono uppercase text-slate-400 font-bold">
                      Available Science Targets in AOI
                    </div>
                    <div className="grid grid-cols-1 gap-1.5">
                      {targets
                        .filter((t) => !waypoints.some((w) => w.id === t.id))
                        .map((t) => (
                          <div
                            key={t.id}
                            onClick={() => setSelectedTarget(t)}
                            className="p-2 rounded-lg bg-slate-950/60 border border-slate-900 hover:border-slate-700 cursor-pointer flex items-center justify-between text-xs font-mono transition-all group"
                          >
                            <span className="text-slate-300 truncate group-hover:text-cyan-300">
                              {t.name}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                addWaypoint(t);
                              }}
                              className="p-1 rounded bg-slate-800 hover:bg-cyan-600 text-slate-300 hover:text-white transition-colors"
                              title="Add to route"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Elevation & Terrain Profile */}
              {rightDrawerTab === 'profile' && (
                <div className="space-y-3 font-mono">
                  {plannedRoute && plannedRoute.elevationProfile.length > 0 ? (
                    <>
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                        <div className="text-[10px] uppercase text-slate-400 font-bold flex items-center justify-between">
                          <span>Terrain Elevation Profile</span>
                          <span className="text-cyan-400">
                            Δ {plannedRoute.elevationGain_m}m gain
                          </span>
                        </div>

                        {/* Interactive Elevation SVG */}
                        <div className="relative h-32 w-full bg-slate-950 rounded-lg p-2 border border-slate-800">
                          <svg className="w-full h-full overflow-visible">
                            <defs>
                              <linearGradient id="profileGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
                                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                              </linearGradient>
                            </defs>
                            {/* Area fill */}
                            <path
                              d={`M 0 100 ${plannedRoute.elevationProfile
                                .map((pt, idx) => {
                                  const x = (idx / (plannedRoute.elevationProfile.length - 1)) * 250;
                                  const minElev = -2650;
                                  const maxElev = -2250;
                                  const y =
                                    100 -
                                    ((pt.elevation_m - minElev) / (maxElev - minElev)) * 90;
                                  return `L ${x} ${Math.max(5, Math.min(95, y))}`;
                                })
                                .join(' ')} L 250 100 Z`}
                              fill="url(#profileGrad)"
                            />
                            {/* Line stroke */}
                            <path
                              d={`M 0 ${
                                100 -
                                ((plannedRoute.elevationProfile[0].elevation_m - -2650) / 400) * 90
                              } ${plannedRoute.elevationProfile
                                .map((pt, idx) => {
                                  const x = (idx / (plannedRoute.elevationProfile.length - 1)) * 250;
                                  const y = 100 - ((pt.elevation_m - -2650) / 400) * 90;
                                  return `L ${x} ${Math.max(5, Math.min(95, y))}`;
                                })
                                .join(' ')}`}
                              fill="none"
                              stroke="#22d3ee"
                              strokeWidth="2"
                            />
                          </svg>
                          <div className="absolute top-1 left-2 text-[9px] text-slate-500">-2250m</div>
                          <div className="absolute bottom-1 left-2 text-[9px] text-slate-500">-2650m</div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-800/80">
                          <div>
                            <span className="text-slate-500">Max Grade:</span>{' '}
                            <span className="text-amber-400 font-bold">{plannedRoute.maxSlope_deg}°</span>
                          </div>
                          <div>
                            <span className="text-slate-500">Mean Grade:</span>{' '}
                            <span className="text-emerald-400 font-bold">{plannedRoute.meanSlope_deg}°</span>
                          </div>
                          <div>
                            <span className="text-slate-500">Total Distance:</span>{' '}
                            <span className="text-white font-bold">{formatDistance(plannedRoute.totalDistance_m)}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">Comms LOS:</span>{' '}
                            <span className="text-emerald-400 font-bold">{plannedRoute.commsLos_pct}%</span>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 text-center text-xs text-slate-500">
                      Compute a route with at least 2 waypoints to display the elevation profile.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: Consumables & Life Support Vitals */}
              {rightDrawerTab === 'vitals' && (
                <div className="space-y-3 font-mono text-xs">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5">
                    <div className="text-[10px] uppercase text-slate-400 font-bold">
                      Consumables Budget (NASA STD-3001)
                    </div>

                    {/* Oxygen Gauge */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">Oxygen (8.0h Suit PLSS):</span>
                        <span className="text-emerald-400 font-bold">
                          {plannedRoute ? `${plannedRoute.o2Remaining_pct}%` : '92%'}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full"
                          style={{
                            width: `${plannedRoute ? plannedRoute.o2Remaining_pct : 92}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Battery Gauge */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">Battery Power:</span>
                        <span className="text-amber-400 font-bold">
                          {plannedRoute ? `${plannedRoute.batteryRemaining_pct}%` : '85%'}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full"
                          style={{
                            width: `${plannedRoute ? plannedRoute.batteryRemaining_pct : 85}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Walk-Back Margin Rule */}
                    <div className="pt-2 border-t border-slate-800/80 space-y-1 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Walk-Back Distance:</span>
                        <span className="text-white font-bold">
                          {plannedRoute
                            ? `${(plannedRoute.walkBackDistance_m / 1000).toFixed(2)} km`
                            : '1.20 km'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Walk-Back Time:</span>
                        <span className="text-amber-400 font-bold">
                          {plannedRoute ? `${plannedRoute.walkBackDuration_min} min` : '24 min'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-1">
                        <span className="text-slate-500">NASA 1.5× Reserve:</span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold text-[10px]">
                          1.8× (COMPLIANT)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* EVA HUD Visor Overlay (When in HUD Mode) */}
        {isHud && (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 z-30 font-mono select-none">
            {/* Top HUD Bar with Visor Ribbon */}
            <div className="flex items-center justify-between">
              <div className="bg-black/90 border-2 border-amber-500 px-5 py-3 rounded-2xl pointer-events-auto backdrop-blur-2xl shadow-[0_0_30px_rgba(245,158,11,0.25)]">
                <div className="text-[10px] uppercase text-amber-500 font-black tracking-widest flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5" /> NEXT WAYPOINT BEARING
                </div>
                <div className="text-2xl font-black text-amber-300 mt-0.5">
                  {waypoints.length > 1 ? `038° AZ • 680 m` : `STANDBY (AT BASE)`}
                </div>
              </div>

              {speActive && (
                <div className="bg-red-950/95 border-2 border-red-500 px-6 py-3 rounded-2xl animate-pulse pointer-events-auto shadow-2xl shadow-red-950">
                  <div className="text-xs font-black text-red-200 uppercase tracking-widest flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-red-400 animate-bounce" />
                    SPE RAD SURGE (95 µSv/h) — ABORT TO HABITAT
                  </div>
                </div>
              )}

              <div className="bg-black/90 border-2 border-amber-500 px-5 py-3 rounded-2xl pointer-events-auto backdrop-blur-2xl text-right shadow-[0_0_30px_rgba(245,158,11,0.25)]">
                <div className="text-[10px] uppercase text-amber-500 font-black tracking-widest">
                  WALK-BACK TO HAB ALPHA
                </div>
                <div className="text-2xl font-black text-amber-300 mt-0.5">
                  {plannedRoute
                    ? `${(plannedRoute.walkBackDistance_m / 1000).toFixed(2)} km • ${
                        plannedRoute.walkBackDuration_min
                      } MIN`
                    : `1.20 km • 24 MIN`}
                </div>
              </div>
            </div>

            {/* Bottom HUD Bar */}
            <div className="flex items-end justify-between">
              <div className="bg-black/90 border-2 border-amber-500 p-4 rounded-2xl pointer-events-auto space-y-2 backdrop-blur-2xl min-w-[260px] shadow-[0_0_30px_rgba(245,158,11,0.25)]">
                <div className="text-[10px] uppercase text-amber-500 font-black tracking-widest">
                  SUIT CONSUMABLES VITALS
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">OXYGEN (8.0h PLSS):</span>
                  <span className="text-emerald-400 font-black">
                    {plannedRoute ? `${plannedRoute.o2Remaining_pct}% OK` : '92% OK'}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">BATTERY POWER:</span>
                  <span className="text-amber-300 font-black">
                    {plannedRoute ? `${plannedRoute.batteryRemaining_pct}% OK` : '85% OK'}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">WALK-BACK RESERVE:</span>
                  <span className="text-emerald-400 font-black">1.8× (SAFE)</span>
                </div>
              </div>

              {/* Center HUD Horizon Reticle */}
              <div className="flex flex-col items-center pointer-events-none opacity-60">
                <div className="text-[10px] text-amber-500 font-black tracking-widest mb-1">
                  PITCH 0° • ROLL 0°
                </div>
                <div className="flex items-center gap-2 text-amber-400">
                  <div className="w-12 h-0.5 bg-amber-500" />
                  <div className="w-3 h-3 rounded-full border border-amber-400" />
                  <div className="w-12 h-0.5 bg-amber-500" />
                </div>
              </div>

              <div className="bg-black/90 border-2 border-amber-500 p-4 rounded-2xl pointer-events-auto text-right space-y-2 backdrop-blur-2xl min-w-[260px] shadow-[0_0_30px_rgba(245,158,11,0.25)]">
                <div className="text-[10px] uppercase text-amber-500 font-black tracking-widest">
                  SURFACE HAZARD RADAR
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">LOCAL SLOPE:</span>
                  <span className="text-emerald-400 font-black">3.8° (SAFE)</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">RAD DOSE RATE:</span>
                  <span
                    className={
                      speActive ? 'text-red-400 font-black animate-pulse' : 'text-emerald-400 font-black'
                    }
                  >
                    {speActive ? '95.0 µSv/h (CRITICAL)' : '9.5 µSv/h (NORMAL)'}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">MEDA DUST TAU:</span>
                  <span className="text-amber-300 font-black">0.42 (CLEAR)</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <GuidedTourModal
        onPlanRouteAction={() => {
          if (gridMeta && costGrid && slopeGrid && elevGrid && waypoints.length >= 2) {
            planCurrentWaypoints(gridMeta, costGrid, slopeGrid, elevGrid, waypoints);
          }
        }}
      />
      <AssumptionsModal />
      <CueCardModal />
    </div>
  );
};

export default App;

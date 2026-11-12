import React, { useEffect, useState } from 'react';
import { useAppStore } from './store/useAppStore';
import { Header } from './components/Header';
import { MapView } from './map/MapView';
import { LayerPanel } from './map/LayerPanel';
import { PlannerPanel } from './planner/PlannerPanel';
import { SafetyPanel } from './safety/SafetyPanel';
import { PovPanel } from './pov/PovPanel';
import { AssumptionsModal } from './components/AssumptionsModal';
import { Manifest, Target } from './types';
import { GridMeta } from './planner/astar';
import { ShieldAlert, Plus, RotateCcw } from 'lucide-react';

export const App: React.FC = () => {
  const {
    displayMode,
    setManifest,
    setTargets,
    selectedTarget,
    setSelectedTarget,
    waypoints,
    addWaypoint,
    removeWaypoint,
    clearWaypoints,
    speActive,
    activeTab,
    plannedRoute,
  } = useAppStore();

  const [loading, setLoading] = useState(true);
  const [gridMeta, setGridMeta] = useState<GridMeta | null>(null);
  const [costGrid, setCostGrid] = useState<Uint8Array | null>(null);
  const [slopeGrid, setSlopeGrid] = useState<Uint8Array | null>(null);
  const [elevGrid, setElevGrid] = useState<Float32Array | null>(null);
  const [envelopeCoords, setEnvelopeCoords] = useState<[number, number][][]>([]);
  const [showEnvelope, setShowEnvelope] = useState(true);
  const [showTraverse, setShowTraverse] = useState(true);

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

        if (layersRes.ok) {
          const manifestData: Manifest = await layersRes.json();
          setManifest(manifestData);
        }

        if (targetsRes.ok) {
          const targetsGeo = await targetsRes.json();
          const parsedTargets: Target[] = targetsGeo.features.map((f: any) => ({
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
          }));
          setTargets(parsedTargets);

          // Default waypoints: Base Alpha + Hawksbill Gap (SCI-01)
          if (parsedTargets.length >= 2) {
            addWaypoint(parsedTargets[3]); // Base Alpha
            addWaypoint(parsedTargets[0]); // Hawksbill Gap
          }
        }

        if (metaRes.ok && costRes.ok && slopeRes.ok && elevRes.ok) {
          const meta: GridMeta = await metaRes.json();
          const costBuf = await costRes.arrayBuffer();
          const slopeBuf = await slopeRes.arrayBuffer();
          const elevBuf = await elevRes.arrayBuffer();

          setGridMeta(meta);
          setCostGrid(new Uint8Array(costBuf));
          setSlopeGrid(new Uint8Array(slopeBuf));
          setElevGrid(new Float32Array(elevBuf));
        }
      } catch (err) {
        console.error('Failed to load initial data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadInitialData();
  }, [setManifest, setTargets, addWaypoint]);

  const isHud = displayMode === 'hud';

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-screen bg-[#0a0b0e] text-slate-300 font-mono space-y-3">
        <div className="w-12 h-12 rounded-full border-2 border-red-500 border-t-transparent animate-spin" />
        <div className="text-sm font-bold tracking-widest text-slate-100">INITIALIZING MARSWALK NAVIGATOR</div>
        <div className="text-xs text-slate-500">Loading Jezero Crater delta elevation & hazard cost grids...</div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-screen w-screen overflow-hidden ${isHud ? 'bg-black text-amber-400' : 'bg-[#0a0b0e] text-slate-100'}`}>
      <Header />

      <div className="flex-1 flex overflow-hidden relative">
        {/* Navigation Sidebar Panel depending on Active Tab */}
        {!isHud && (
          <>
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
          </>
        )}

        {/* Center Map View */}
        <MapView
          envelopeCoords={envelopeCoords}
          showEnvelope={showEnvelope}
          showTraverse={showTraverse}
        />

        {/* Right Sidebar: Target Inspector & Waypoint Traverse Queue */}
        {!isHud && (
          <div className="w-80 bg-[#12141c]/95 border-l border-slate-800 flex flex-col h-full text-slate-200 backdrop-blur z-20">
            <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
              <h2 className="text-xs font-mono font-bold tracking-wider uppercase text-slate-100">
                Target & Traverse Queue
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700">
                {waypoints.length} Stops
              </span>
            </div>

            <div className="p-3 flex-1 overflow-y-auto space-y-4">
              {/* Selected Target Inspector */}
              {selectedTarget ? (
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-700 space-y-2.5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-[10px] font-mono uppercase text-cyan-400">{selectedTarget.category}</div>
                      <div className="text-sm font-bold text-white">{selectedTarget.name}</div>
                    </div>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-700">
                      ★ {selectedTarget.science_value}/5
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {selectedTarget.reason}
                  </p>

                  <div className="text-[11px] font-mono text-slate-400 space-y-1">
                    <div><span className="text-slate-500">Lon/Lat:</span> {selectedTarget.coordinates[0]}°E, {selectedTarget.coordinates[1]}°N</div>
                    <div><span className="text-slate-500">Dwell Time:</span> ~{selectedTarget.estimated_dwell_min} min</div>
                  </div>

                  <div className="pt-2 flex gap-2">
                    <button
                      onClick={() => addWaypoint(selectedTarget)}
                      className="flex-1 py-1.5 px-3 bg-red-600 hover:bg-red-500 text-white font-medium text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add to Route
                    </button>
                    <button
                      onClick={() => setSelectedTarget(null)}
                      className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-slate-950/40 border border-dashed border-slate-800 text-center text-xs text-slate-500">
                  Click any target marker on the map to inspect science objectives and add to EVA traverse.
                </div>
              )}

              {/* Waypoints List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  <span>Ordered Traversal Stops</span>
                  {waypoints.length > 0 && (
                    <button
                      onClick={clearWaypoints}
                      className="text-red-400 hover:underline flex items-center gap-1 text-[11px]"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Clear
                    </button>
                  )}
                </div>

                {waypoints.length === 0 ? (
                  <div className="text-xs text-slate-500 italic p-2">
                    No waypoints selected yet.
                  </div>
                ) : (
                  waypoints.map((wp, i) => (
                    <div
                      key={wp.id}
                      className="p-2 rounded bg-slate-900 border border-slate-800 flex items-center justify-between text-xs font-mono"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 flex items-center justify-center text-[10px] font-bold font-mono">
                          {i + 1}
                        </span>
                        <div className="font-medium text-slate-200 truncate max-w-[150px]">
                          {wp.name}
                        </div>
                      </div>
                      <button
                        onClick={() => removeWaypoint(wp.id)}
                        className="text-slate-500 hover:text-red-400 text-xs px-1"
                      >
                        ✕
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* EVA HUD Visor Overlay (When in HUD Mode) */}
        {isHud && (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 z-30 font-mono select-none">
            {/* Top HUD Bar */}
            <div className="flex items-center justify-between">
              <div className="bg-black/85 border border-amber-500/80 px-4 py-2.5 rounded-lg pointer-events-auto backdrop-blur">
                <div className="text-[10px] uppercase text-amber-500 font-bold tracking-widest">NEXT WAYPOINT BEARING</div>
                <div className="text-2xl font-black text-amber-300">
                  {waypoints.length > 1 ? `038° AZ • 680 m` : `STANDBY`}
                </div>
              </div>

              {speActive && (
                <div className="bg-red-950/90 border border-red-500 px-5 py-2.5 rounded-lg animate-pulse pointer-events-auto shadow-2xl shadow-red-950">
                  <div className="text-xs font-black text-red-200 uppercase tracking-widest flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-red-400" />
                    SPE RAD SURGE DETECTED (95 µSv/h) — ABORT TO HABITAT
                  </div>
                </div>
              )}

              <div className="bg-black/85 border border-amber-500/80 px-4 py-2.5 rounded-lg pointer-events-auto backdrop-blur text-right">
                <div className="text-[10px] uppercase text-amber-500 font-bold tracking-widest">WALK-BACK TO HAB ALPHA</div>
                <div className="text-2xl font-black text-amber-300">
                  {plannedRoute ? `${(plannedRoute.walkBackDistance_m / 1000).toFixed(2)} km • ${plannedRoute.walkBackDuration_min} MIN` : `1.2 km • 24 MIN`}
                </div>
              </div>
            </div>

            {/* Bottom HUD Bar */}
            <div className="flex items-end justify-between">
              <div className="bg-black/85 border border-amber-500/80 p-3.5 rounded-lg pointer-events-auto space-y-1.5 backdrop-blur min-w-[240px]">
                <div className="text-[10px] uppercase text-amber-500 font-bold tracking-widest">SUIT CONSUMABLES</div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">OXYGEN (8.0h):</span>
                  <span className="text-emerald-400 font-bold">{plannedRoute ? `${plannedRoute.o2Remaining_pct}% OK` : '92% OK'}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">BATTERY POWER:</span>
                  <span className="text-amber-300 font-bold">{plannedRoute ? `${plannedRoute.batteryRemaining_pct}% OK` : '84% OK'}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">WALK-BACK RESERVE:</span>
                  <span className="text-emerald-400 font-bold">1.8× (SAFE)</span>
                </div>
              </div>

              <div className="bg-black/85 border border-amber-500/80 p-3.5 rounded-lg pointer-events-auto text-right space-y-1.5 backdrop-blur min-w-[240px]">
                <div className="text-[10px] uppercase text-amber-500 font-bold tracking-widest">SURFACE HAZARD SENSOR</div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">LOCAL SLOPE:</span>
                  <span className="text-emerald-400 font-bold">3.8° (SAFE)</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">RAD DOSE RATE:</span>
                  <span className={speActive ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                    {speActive ? '95.0 µSv/h (CRITICAL)' : '9.5 µSv/h (NORMAL)'}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">MEDA DUST TAU:</span>
                  <span className="text-amber-300 font-bold">0.42 (CLEAR)</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <AssumptionsModal />
    </div>
  );
};

export default App;

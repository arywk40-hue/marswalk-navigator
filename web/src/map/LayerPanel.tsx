import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Provenance } from '../types';
import {
  Layers,
  Eye,
  EyeOff,
  Sliders,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Sparkles,
  Shield,
  Mountain,
  Camera,
} from 'lucide-react';

export const LayerPanel: React.FC = () => {
  const {
    layers,
    layerVisibility,
    layerOpacity,
    toggleLayer,
    setLayerOpacity,
    setLayersVisibilityBatch,
  } = useAppStore();
  const [expandedLayerId, setExpandedLayerId] = useState<string | null>(null);

  const getProvenanceBadge = (prov: Provenance) => {
    switch (prov) {
      case 'real':
        return (
          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-700/60 shadow-sm">
            REAL
          </span>
        );
      case 'derived':
        return (
          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-blue-950/80 text-blue-400 border border-blue-700/60 shadow-sm">
            DERIVED
          </span>
        );
      case 'model':
        return (
          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-950/80 text-amber-400 border border-amber-700/60 shadow-sm">
            MODEL
          </span>
        );
      case 'sample':
        return (
          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-purple-950/80 text-purple-400 border border-purple-700/60 shadow-sm">
            SAMPLE
          </span>
        );
    }
  };

  const categories = [
    { id: 'optical', name: 'Optical Basemap' },
    { id: 'geology', name: 'Geology & Stratigraphy' },
    { id: 'topographic', name: 'Topography & Slope' },
    { id: 'thermal', name: 'Thermal & Rockiness' },
    { id: 'spectral', name: 'Spectral Mineralogy' },
    { id: 'hazard', name: 'Hazard Traversability' },
  ];

  const activeCount = layers.filter((l) => !!layerVisibility[l.id]).length;

  const applyPreset = (presetName: 'science' | 'hazards' | 'topo' | 'ortho') => {
    const newVis: Record<string, boolean> = {};
    layers.forEach((l) => {
      newVis[l.id] = false;
    });

    if (presetName === 'science') {
      newVis['hirise_basemap'] = true;
      newVis['crism_minerals'] = true;
      newVis['usgs_geology_units'] = true;
      setLayerOpacity('hirise_basemap', 0.85);
      setLayerOpacity('usgs_geology_units', 0.65);
    } else if (presetName === 'hazards') {
      newVis['derived_slope'] = true;
      newVis['hazard_cost'] = true;
      newVis['themis_thermal'] = true;
      newVis['hirise_basemap'] = true;
      setLayerOpacity('hirise_basemap', 0.4);
    } else if (presetName === 'topo') {
      newVis['mola_dem'] = true;
      newVis['derived_slope'] = true;
      newVis['mola_color_wmts'] = true;
    } else if (presetName === 'ortho') {
      newVis['hirise_basemap'] = true;
      setLayerOpacity('hirise_basemap', 1.0);
    }

    setLayersVisibilityBatch(newVis);
  };

  return (
    <div className="w-80 bg-[#10121a]/95 border-r border-slate-800/80 flex flex-col h-full text-slate-200 select-none backdrop-blur-xl z-20 shadow-2xl">
      {/* Panel Title */}
      <div className="p-3.5 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/60">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-red-500" />
          <h2 className="text-xs font-mono font-bold tracking-wider uppercase text-slate-100">
            Surface Data Layers
          </h2>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800/90 text-cyan-300 border border-slate-700/80 shadow-sm font-semibold">
          {activeCount} / {layers.length} Active
        </span>
      </div>

      {/* Quick 1-Click Layer Presets */}
      <div className="p-2.5 bg-slate-950/70 border-b border-slate-800/80 space-y-1.5">
        <div className="text-[9px] font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-cyan-400" />
          Mission Quick Presets
        </div>
        <div className="grid grid-cols-2 gap-1.5 font-mono text-[10px]">
          <button
            onClick={() => applyPreset('science')}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 text-slate-200 flex items-center gap-1.5 transition-all text-left shadow-sm active:scale-95"
            title="Enable HiRISE, CRISM minerals, and USGS Geologic Units"
          >
            <Sparkles className="w-3 h-3 text-purple-400 shrink-0" />
            <span className="truncate font-semibold">Science Focus</span>
          </button>
          <button
            onClick={() => applyPreset('hazards')}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/50 text-slate-200 flex items-center gap-1.5 transition-all text-left shadow-sm active:scale-95"
            title="Enable Slope, Hazard Cost Grid, and THEMIS Thermal Inertia"
          >
            <Shield className="w-3 h-3 text-amber-400 shrink-0" />
            <span className="truncate font-semibold">Safety & Hazard</span>
          </button>
          <button
            onClick={() => applyPreset('topo')}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/50 text-slate-200 flex items-center gap-1.5 transition-all text-left shadow-sm active:scale-95"
            title="Enable MOLA DEM, Slope, and Color Shaded Relief"
          >
            <Mountain className="w-3 h-3 text-emerald-400 shrink-0" />
            <span className="truncate font-semibold">Topography</span>
          </button>
          <button
            onClick={() => applyPreset('ortho')}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 text-slate-200 flex items-center gap-1.5 transition-all text-left shadow-sm active:scale-95"
            title="Enable pure 25cm HiRISE controlled orthomosaic"
          >
            <Camera className="w-3 h-3 text-cyan-400 shrink-0" />
            <span className="truncate font-semibold">25cm Ortho</span>
          </button>
        </div>
      </div>

      {/* Layer List grouped by category */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar">
        {categories.map((cat) => {
          const catLayers = layers.filter((l) => l.category === cat.id);
          if (catLayers.length === 0) return null;

          return (
            <div key={cat.id} className="space-y-1.5">
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 px-1 font-semibold flex items-center justify-between">
                <span>{cat.name}</span>
                <span className="text-[9px] text-slate-600 font-bold">
                  {catLayers.filter((l) => layerVisibility[l.id]).length}/{catLayers.length}
                </span>
              </div>
              <div className="space-y-2">
                {catLayers.map((layer) => {
                  const visible = !!layerVisibility[layer.id];
                  const opacity = layerOpacity[layer.id] ?? layer.defaultOpacity;
                  const isExpanded = expandedLayerId === layer.id;

                  return (
                    <div
                      key={layer.id}
                      className={`p-2.5 rounded-xl border transition-all ${
                        visible
                          ? 'bg-slate-900/90 border-slate-700/80 shadow-md ring-1 ring-white/5'
                          : 'bg-slate-950/40 border-slate-900/80 opacity-65 hover:opacity-100 hover:border-slate-800'
                      }`}
                    >
                      {/* Layer Item Row */}
                      <div className="flex items-center justify-between gap-2">
                        <button
                          onClick={() => toggleLayer(layer.id)}
                          className="flex items-center gap-2.5 flex-1 text-left min-w-0 group"
                        >
                          <div
                            className={`p-1 rounded-md transition-colors ${
                              visible
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/80'
                                : 'bg-slate-900 text-slate-500 border border-slate-800 group-hover:text-slate-300'
                            }`}
                          >
                            {visible ? (
                              <Eye className="w-3.5 h-3.5 shrink-0" />
                            ) : (
                              <EyeOff className="w-3.5 h-3.5 shrink-0" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-slate-200 truncate group-hover:text-white transition-colors">
                              {layer.label}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {getProvenanceBadge(layer.provenance)}
                              <span className="text-[10px] font-mono text-slate-400">
                                {layer.resolution_m < 1
                                  ? `${Math.round(layer.resolution_m * 100)} cm/px`
                                  : `${layer.resolution_m} m/px`}
                              </span>
                            </div>
                          </div>
                        </button>

                        <button
                          onClick={() => setExpandedLayerId(isExpanded ? null : layer.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                          title="View metadata and legend"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      {/* Opacity slider (when active) */}
                      {visible && (
                        <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center gap-2 text-xs">
                          <Sliders className="w-3 h-3 text-slate-400 shrink-0" />
                          <input
                            type="range"
                            min="0.1"
                            max="1.0"
                            step="0.05"
                            value={opacity}
                            onChange={(e) => setLayerOpacity(layer.id, parseFloat(e.target.value))}
                            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-500"
                          />
                          <span className="font-mono text-[10px] text-cyan-400 font-bold w-9 text-right">
                            {Math.round(opacity * 100)}%
                          </span>
                        </div>
                      )}

                      {/* Metadata & Legend expansion */}
                      {isExpanded && (
                        <div className="mt-2.5 pt-2 border-t border-slate-800/80 space-y-2 text-[11px] text-slate-300">
                          <div className="space-y-1 font-mono text-[10px] text-slate-400 bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 shadow-inner">
                            <div>
                              <span className="text-slate-500 font-semibold">Source:</span>{' '}
                              {layer.source}
                            </div>
                            <div>
                              <span className="text-slate-500 font-semibold">Product:</span>{' '}
                              <span className="text-cyan-300">{layer.productId}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 font-semibold">Acquired:</span>{' '}
                              {layer.date}
                            </div>
                            {layer.link && (
                              <a
                                href={layer.link}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 hover:underline pt-0.5"
                              >
                                <span>Official PDS / DOI Archive</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>

                          {/* Legend display */}
                          {layer.legend && layer.legend.stops.length > 0 && (
                            <div className="mt-2">
                              <div className="text-[10px] font-mono text-slate-400 mb-1 font-bold">
                                {layer.legend.title || 'Legend'}
                              </div>
                              {layer.legend.kind === 'gradient' ? (
                                <div className="space-y-1">
                                  <div
                                    className="h-2 rounded-full w-full border border-slate-700 shadow-sm"
                                    style={{
                                      background: `linear-gradient(to right, ${layer.legend.stops
                                        .map((s) => s.color)
                                        .join(', ')})`,
                                    }}
                                  />
                                  <div className="flex justify-between text-[9px] font-mono text-slate-400">
                                    <span>{layer.legend.stops[0].label}</span>
                                    <span>
                                      {layer.legend.stops[layer.legend.stops.length - 1].label}
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-1">
                                  {layer.legend.stops.map((stop) => (
                                    <div
                                      key={stop.label}
                                      className="flex items-center gap-2 text-[10px]"
                                    >
                                      <span
                                        className="w-2.5 h-2.5 rounded-sm shrink-0 border border-white/20 shadow-sm"
                                        style={{ backgroundColor: stop.color }}
                                      />
                                      <span className="text-slate-300 font-mono">
                                        {stop.label}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

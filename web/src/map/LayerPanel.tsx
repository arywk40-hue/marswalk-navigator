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
} from 'lucide-react';

export const LayerPanel: React.FC = () => {
  const { layers, layerVisibility, layerOpacity, toggleLayer, setLayerOpacity } = useAppStore();
  const [expandedLayerId, setExpandedLayerId] = useState<string | null>(null);

  const getProvenanceBadge = (prov: Provenance) => {
    switch (prov) {
      case 'real':
        return <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-700/60">REAL</span>;
      case 'derived':
        return <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-blue-950/80 text-blue-400 border border-blue-700/60">DERIVED</span>;
      case 'model':
        return <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-950/80 text-amber-400 border border-amber-700/60">MODEL</span>;
      case 'sample':
        return <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-purple-950/80 text-purple-400 border border-purple-700/60">SAMPLE</span>;
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

  return (
    <div className="w-80 bg-[#12141c]/95 border-r border-slate-800 flex flex-col h-full text-slate-200 select-none backdrop-blur z-20">
      {/* Panel Title */}
      <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-red-500" />
          <h2 className="text-xs font-mono font-bold tracking-wider uppercase text-slate-100">
            Surface Data Layers ({layers.length})
          </h2>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
          ≥3 Required ({activeCount} Active)
        </span>
      </div>

      {/* Layer List grouped by category */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {categories.map((cat) => {
          const catLayers = layers.filter((l) => l.category === cat.id);
          if (catLayers.length === 0) return null;

          return (
            <div key={cat.id} className="space-y-1.5">
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 px-1 font-semibold">
                {cat.name}
              </div>
              <div className="space-y-2">
                {catLayers.map((layer) => {
                  const visible = !!layerVisibility[layer.id];
                  const opacity = layerOpacity[layer.id] ?? layer.defaultOpacity;
                  const isExpanded = expandedLayerId === layer.id;

                  return (
                    <div
                      key={layer.id}
                      className={`p-2.5 rounded-lg border transition-all ${
                        visible
                          ? 'bg-slate-900/90 border-slate-700 shadow-sm'
                          : 'bg-slate-950/40 border-slate-900 opacity-70 hover:opacity-100'
                      }`}
                    >
                      {/* Layer Item Row */}
                      <div className="flex items-center justify-between gap-2">
                        <button
                          onClick={() => toggleLayer(layer.id)}
                          className="flex items-center gap-2 flex-1 text-left"
                        >
                          {visible ? (
                            <Eye className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : (
                            <EyeOff className="w-4 h-4 text-slate-500 shrink-0" />
                          )}
                          <div className="min-w-0">
                            <div className="text-xs font-medium text-slate-200 truncate">
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
                          className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                          title="View metadata and legend"
                        >
                          {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
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
                            className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-500"
                          />
                          <span className="font-mono text-[10px] text-slate-400 w-8 text-right">
                            {Math.round(opacity * 100)}%
                          </span>
                        </div>
                      )}

                      {/* Metadata & Legend expansion */}
                      {isExpanded && (
                        <div className="mt-2.5 pt-2 border-t border-slate-800 space-y-2 text-[11px] text-slate-300">
                          <div className="space-y-1 font-mono text-[10px] text-slate-400 bg-slate-950 p-2 rounded border border-slate-800/80">
                            <div><span className="text-slate-500">Source:</span> {layer.source}</div>
                            <div><span className="text-slate-500">Product:</span> {layer.productId}</div>
                            <div><span className="text-slate-500">Acquired:</span> {layer.date}</div>
                            {layer.link && (
                              <a
                                href={layer.link}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1 text-cyan-400 hover:underline pt-0.5"
                              >
                                <span>PDS / Source Link</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>

                          {/* Legend display */}
                          {layer.legend && layer.legend.stops.length > 0 && (
                            <div className="mt-2">
                              <div className="text-[10px] font-mono text-slate-400 mb-1">
                                {layer.legend.title || 'Legend'}
                              </div>
                              {layer.legend.kind === 'gradient' ? (
                                <div className="space-y-1">
                                  <div
                                    className="h-2 rounded w-full border border-slate-700"
                                    style={{
                                      background: `linear-gradient(to right, ${layer.legend.stops
                                        .map((s) => s.color)
                                        .join(', ')})`,
                                    }}
                                  />
                                  <div className="flex justify-between text-[9px] font-mono text-slate-400">
                                    <span>{layer.legend.stops[0].label}</span>
                                    <span>{layer.legend.stops[layer.legend.stops.length - 1].label}</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-1">
                                  {layer.legend.stops.map((stop) => (
                                    <div key={stop.label} className="flex items-center gap-1.5 text-[10px]">
                                      <span
                                        className="w-2.5 h-2.5 rounded-sm shrink-0 border border-black/30"
                                        style={{ backgroundColor: stop.color }}
                                      />
                                      <span className="text-slate-300 font-mono">{stop.label}</span>
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

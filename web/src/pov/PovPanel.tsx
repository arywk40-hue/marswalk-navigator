import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { POVImage, Target } from '../types';
import { Camera, Layers, CheckCircle2 } from 'lucide-react';

export const PovPanel: React.FC = () => {
  const { selectedTarget, targets, setSelectedTarget } = useAppStore();
  const [povImages, setPovImages] = useState<POVImage[]>([]);

  useEffect(() => {
    async function loadPov() {
      try {
        const res = await fetch('./data/pov_images.json');
        if (res.ok) {
          const data = await res.json();
          setPovImages(data);
        }
      } catch (err) {
        console.error('Failed to load POV images:', err);
      }
    }
    loadPov();
  }, []);

  const activeTarget: Target = selectedTarget || targets[0];
  const activeImage = povImages.find((img) => img.targetId === activeTarget?.id) || povImages[0];

  return (
    <div className="w-80 bg-[#12141c]/95 border-r border-slate-800 flex flex-col h-full text-slate-200 select-none backdrop-blur z-20">
      {/* Header */}
      <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-purple-400" />
          <h2 className="text-xs font-mono font-bold tracking-wider uppercase text-slate-100">
            Planned vs. Expected POV
          </h2>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
          REAL PHOTOS
        </span>
      </div>

      <div className="p-3.5 flex-1 overflow-y-auto space-y-4">
        {/* Waypoint Selector Chips */}
        <div className="space-y-1.5">
          <div className="text-[10px] font-mono uppercase text-slate-400 tracking-wider font-semibold">
            Select Science Waypoint
          </div>
          <div className="flex flex-wrap gap-1.5">
            {targets.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTarget(t)}
                className={`px-2 py-1 rounded text-[11px] font-mono transition-all border ${
                  activeTarget?.id === t.id
                    ? 'bg-purple-600 text-white border-purple-400 shadow'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                {t.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Planned vs Expected Verification Card */}
        {activeTarget && (
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase text-cyan-400">
                  {activeTarget.category}
                </span>
                <h3 className="text-sm font-bold text-white font-mono">
                  {activeTarget.name}
                </h3>
              </div>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-700">
                ★ {activeTarget.science_value}/5
              </span>
            </div>

            {/* Step 1: Real Ground-Truth Surface Image Photo */}
            {activeImage && (
              <div className="space-y-2">
                <div className="text-[10px] font-mono uppercase text-slate-400 font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Expected Ground View (Perseverance)
                </div>
                <div className="relative rounded-lg overflow-hidden border border-slate-700 group bg-black aspect-video flex items-center justify-center">
                  <img
                    src={activeImage.imageUrl}
                    alt={activeImage.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-black/80 text-emerald-400 border border-emerald-600/40 backdrop-blur">
                    {activeImage.camera}
                  </div>
                  <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-black/80 text-amber-300 border border-amber-600/40 backdrop-blur">
                    SOL {activeImage.sol}
                  </div>
                </div>

                <div className="text-xs text-slate-300 leading-relaxed italic">
                  "{activeImage.caption}"
                </div>

                <div className="text-[10px] font-mono text-slate-500 flex justify-between pt-1 border-t border-slate-800">
                  <span>Azimuth: {activeImage.heading_deg}°</span>
                  <span>Credit: {activeImage.credit}</span>
                </div>
              </div>
            )}

            {/* Step 2: Planned Orbital & Derived Hazard Context */}
            <div className="pt-2 border-t border-slate-800 space-y-1.5 text-xs font-mono">
              <div className="text-[10px] uppercase text-slate-400 font-semibold flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                Orbital & Derived Physics Context
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800/80 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Coordinates:</span>
                  <span className="text-slate-300">{activeTarget.coordinates[0]}°E, {activeTarget.coordinates[1]}°N</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Spectral Evidence:</span>
                  <span className="text-cyan-400">{activeTarget.layer_evidence.join(', ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Estimated Dwell Time:</span>
                  <span className="text-amber-300">~{activeTarget.estimated_dwell_min} min</span>
                </div>
              </div>
            </div>

            {/* Step 3: Planned Sampling Protocol & Tools */}
            <div className="pt-2 border-t border-slate-800 space-y-1.5 text-xs">
              <div className="text-[10px] font-mono uppercase text-slate-400 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Astronaut Sampling Protocol
              </div>
              <ul className="space-y-1 text-slate-300 text-[11px] font-mono">
                {activeTarget.recommended_tools.map((tool, idx) => (
                  <li key={idx} className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                    <span>{tool}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

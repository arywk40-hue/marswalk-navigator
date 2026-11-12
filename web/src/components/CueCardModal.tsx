import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { X, Printer, ShieldAlert, FileText } from 'lucide-react';
import { formatDistance, formatDuration } from '../lib/geo';

export const CueCardModal: React.FC = () => {
  const { cueCardOpen, setCueCardOpen, plannedRoute, waypoints } = useAppStore();

  if (!cueCardOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#10131a] border-2 border-amber-500/80 rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl text-slate-200 overflow-hidden font-mono">
        {/* Header */}
        <div className="px-6 py-3.5 border-b border-amber-500/40 flex items-center justify-between bg-black/80">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-sm font-bold tracking-wider text-amber-300 uppercase">
                EVA SURFACE CUE CARD — ASTRONAUT CUFF CHECKLIST
              </h2>
              <div className="text-[10px] text-slate-400">
                SORTIE: EVA-01 DELTA-PROSPECTOR • SITE: JEZERO CRATER (18.44°N, 77.44°E)
              </div>
            </div>
          </div>
          <button
            onClick={() => setCueCardOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cue Card Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* Mission Top Summary */}
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="p-2 rounded bg-black border border-slate-800">
              <div className="text-[9px] text-slate-500">SORTIE DIST</div>
              <div className="text-sm font-bold text-cyan-300">
                {plannedRoute ? formatDistance(plannedRoute.totalDistance_m) : '1.42 km'}
              </div>
            </div>
            <div className="p-2 rounded bg-black border border-slate-800">
              <div className="text-[9px] text-slate-500">PLANNED MET</div>
              <div className="text-sm font-bold text-cyan-300">
                {plannedRoute ? formatDuration(plannedRoute.totalDuration_min) : '1h 15m'}
              </div>
            </div>
            <div className="p-2 rounded bg-black border border-slate-800">
              <div className="text-[9px] text-slate-500">MAX GRADE</div>
              <div className="text-sm font-bold text-amber-400">
                {plannedRoute ? `${plannedRoute.maxSlope_deg}°` : '11.2°'}
              </div>
            </div>
            <div className="p-2 rounded bg-black border border-slate-800">
              <div className="text-[9px] text-slate-500">O2 MARGIN</div>
              <div className="text-sm font-bold text-emerald-400">
                {plannedRoute ? `${plannedRoute.o2Remaining_pct}% OK` : '92% OK'}
              </div>
            </div>
          </div>

          {/* Timeline & Stations Table */}
          <div>
            <div className="text-[10px] uppercase font-bold text-amber-400 tracking-wider mb-1.5 flex items-center gap-1.5">
              <span>Station Timeline & Task Matrix</span>
            </div>
            <div className="border border-slate-800 rounded-lg overflow-hidden bg-black/60">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-2">Station / Stop</th>
                    <th className="p-2">Coords (E / N)</th>
                    <th className="p-2">Dwell</th>
                    <th className="p-2">Science Task / Tools</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {waypoints.map((wp, idx) => (
                    <tr key={wp.id} className="hover:bg-slate-900/40">
                      <td className="p-2 font-bold text-slate-200">
                        {idx + 1}. {wp.name}
                      </td>
                      <td className="p-2 text-slate-400">
                        {wp.coordinates[0]}°, {wp.coordinates[1]}°
                      </td>
                      <td className="p-2 text-cyan-400 font-bold">
                        {wp.estimated_dwell_min} min
                      </td>
                      <td className="p-2 text-slate-300">
                        {wp.recommended_tools.length > 0
                          ? wp.recommended_tools.join(', ')
                          : 'Habitat egress / ingress point'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Critical Operational Rules */}
          <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-500/40 space-y-1.5 text-[11px] text-amber-200">
            <div className="font-bold flex items-center gap-1.5 text-amber-300">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              MANDATORY NASA EVA SAFETY RULES
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-300 text-[10px]">
              <li><strong>Walk-Back Rule:</strong> Consumables remaining must never drop below 1.5× the return time to Habitat Alpha.</li>
              <li><strong>SPE Abort Action:</strong> If the SPE radiation alarm sounds (95 µSv/h), abort sampling immediately and return along the designated azimuth.</li>
              <li><strong>Slope Cutoff:</strong> Do not attempt traverses on slopes exceeding 15.0° to avoid spacesuit balance disruption and soil shear failure.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-black/60 flex items-center justify-between">
          <button
            onClick={() => window.print()}
            className="py-1.5 px-3 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono flex items-center gap-1.5 transition-colors border border-slate-700"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Cue Card
          </button>
          <button
            onClick={() => setCueCardOpen(false)}
            className="py-1.5 px-4 rounded bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs font-mono transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

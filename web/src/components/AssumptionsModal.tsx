import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { X, ShieldCheck, Database, HelpCircle } from 'lucide-react';

export const AssumptionsModal: React.FC = () => {
  const { assumptionsOpen, setAssumptionsOpen } = useAppStore();

  if (!assumptionsOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#12141c] border border-slate-700 rounded-xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl text-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-red-500" />
            <h2 className="text-lg font-bold font-mono tracking-wide text-white">
              Scientific Model Assumptions & Data Provenance
            </h2>
          </div>
          <button
            onClick={() => setAssumptionsOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          <div className="p-3.5 rounded-lg bg-red-950/30 border border-red-800/40 text-red-200 text-xs leading-relaxed">
            <strong>NASA Space Apps Educational Disclaimer:</strong> Marswalk Navigator is built for scientific exploration and hackathon educational modeling. It models physical, physiological, and radiological parameters based on published literature, not certified flight software.
          </div>

          {/* Model Assumptions Table */}
          <div>
            <h3 className="font-mono text-xs uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <Database className="w-4 h-4 text-cyan-400" />
              1. Suit & Mobility Assumptions (SI Units)
            </h3>
            <div className="border border-slate-800 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-slate-400 font-mono">
                  <tr>
                    <th className="p-2.5 border-b border-slate-800">Parameter</th>
                    <th className="p-2.5 border-b border-slate-800">Assumed Value</th>
                    <th className="p-2.5 border-b border-slate-800">Scientific Basis / Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  <tr>
                    <td className="p-2.5 text-slate-300 font-medium">Mars Gravity (g_mars)</td>
                    <td className="p-2.5 text-cyan-400">0.376 g (3.72 m/s²)</td>
                    <td className="p-2.5 text-slate-400">IAU standard Mars gravitational acceleration</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 text-slate-300 font-medium">Flat Walking Speed ($v_0$)</td>
                    <td className="p-2.5 text-cyan-400">2.5 km/h (0.69 m/s)</td>
                    <td className="p-2.5 text-slate-400">Apollo lunar EVA telemetry scaled for Mars 0.38g + suit mass</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 text-slate-300 font-medium">Hard Slope Cutoff</td>
                    <td className="p-2.5 text-red-400">15.0° (26.8% grade)</td>
                    <td className="p-2.5 text-slate-400">Astronaut pressurized suit knee/ankle articulation limits</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 text-slate-300 font-medium">Caution Slope Angle</td>
                    <td className="p-2.5 text-amber-400">10.0°</td>
                    <td className="p-2.5 text-slate-400">Loose regolith scree angle of repose slip boundary</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 text-slate-300 font-medium">Walk-Back Reserve</td>
                    <td className="p-2.5 text-cyan-400">1.5× margin (150%)</td>
                    <td className="p-2.5 text-slate-400">NASA EVA Rule: consumables must exceed 1.5× return time to shelter</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 text-slate-300 font-medium">Metabolic O₂ Rate</td>
                    <td className="p-2.5 text-cyan-400">240 W base + 120 W/(m/s)</td>
                    <td className="p-2.5 text-slate-400">NASA Bioastronautics Data Book (2nd ed.)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Radiation & Weather */}
          <div>
            <h3 className="font-mono text-xs uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-amber-400" />
              2. Environmental & Radiation Proxies
            </h3>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                <span>
                  <strong>Surface Radiation (MSL RAD Proxy):</strong> Baseline dose rate is set to 9.5 µSv/h (~0.23 mSv/day), derived from Curiosity's published in-situ surface measurements in Gale Crater (Zeitlin et al., 2013). Because Perseverance does not carry a RAD instrument, this surface-calibrated measurement is applied as a proxy for Jezero Crater.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                <span>
                  <strong>Solar Particle Event (SPE) Simulation:</strong> Simulates a Coronal Mass Ejection (CME) shock passage with a 10× particle flux surge (95 µSv/h), triggering an immediate EVA abort warning and shelter walk-back timer.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                <span>
                  <strong>Atmospheric Weather (Perseverance MEDA):</strong> Real diurnal pressure, temperature (-78°C to -12°C), and wind speed time series from the Mars Environmental Dynamics Analyzer at Jezero Crater.
                </span>
              </li>
            </ul>
          </div>

          {/* Data Provenance Standards */}
          <div>
            <h3 className="font-mono text-xs uppercase tracking-wider text-slate-400 mb-2">
              3. Data Provenance Tags Used Across the App
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 mr-2">
                  REAL
                </span>
                <span className="text-slate-300">Measured NASA mission instrument data (HiRISE, MEDA, CRISM, Mastcam-Z)</span>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-950 text-blue-400 border border-blue-800 mr-2">
                  DERIVED
                </span>
                <span className="text-slate-300">Mathematically calculated from real data (Horn slope, elevation profile)</span>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950 text-amber-400 border border-amber-800 mr-2">
                  MODEL
                </span>
                <span className="text-slate-300">Physical & physiological simulation (Tobler suit speed, hazard cost grid)</span>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-950 text-purple-400 border border-purple-800 mr-2">
                  SAMPLE
                </span>
                <span className="text-slate-300">Offline cached fallback artifact when live endpoints are unreachable</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/60 flex justify-end">
          <button
            onClick={() => setAssumptionsOpen(false)}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

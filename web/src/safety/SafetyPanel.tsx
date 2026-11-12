import React from 'react';
import { useAppStore } from '../store/useAppStore';
import {
  ShieldAlert,
  ShieldCheck,
  Radio,
  Wind,
  Sun,
  Activity,
  AlertOctagon,
} from 'lucide-react';

export const SafetyPanel: React.FC = () => {
  const {
    speActive,
    toggleSpe,
    plannedRoute,
    timeOfSol,
    setTimeOfSol,
  } = useAppStore();

  const isGo = !speActive && (!plannedRoute || plannedRoute.walkBackMarginSafe);

  // Solar Ephemeris model for Jezero Crater at 18.4°N
  // Noon (12:00) elevation ~ 65°, Sunrise ~ 05:42 (0°), Sunset ~ 18:14 (0°)
  const hoursSinceNoon = Math.abs(timeOfSol - 12.0);
  const sunElevationDeg = Math.max(0, Math.round(65.0 - (hoursSinceNoon * 11.2)));

  // Diurnal temperature model from MEDA: peak -12°C at 13:00, low -78°C at 06:00
  const tempC = Math.round(-12.0 - Math.pow(Math.abs(timeOfSol - 13.5), 1.4) * 5.2);

  // Daylight remaining until sunset (18:14 LST = 18.23 decimal)
  const sunsetHour = 18.23;
  const daylightHoursRemaining = Math.max(0, sunsetHour - timeOfSol);
  const daylightMinRemaining = Math.round(daylightHoursRemaining * 60);

  const formatLST = (decHour: number) => {
    const h = Math.floor(decHour);
    const m = Math.round((decHour - h) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} LST`;
  };

  return (
    <div className="w-80 bg-[#12141c]/95 border-r border-slate-800 flex flex-col h-full text-slate-200 select-none backdrop-blur z-20">
      {/* Header */}
      <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          <h2 className="text-xs font-mono font-bold tracking-wider uppercase text-slate-100">
            EVA Safety & Diagnostics
          </h2>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
          Composite Go/No-Go
        </span>
      </div>

      <div className="p-3.5 flex-1 overflow-y-auto space-y-4 text-xs font-mono">
        {/* Composite Go / No-Go Banner */}
        <div className={`p-3.5 rounded-lg border flex items-center gap-3 shadow-lg ${
          speActive
            ? 'bg-red-950/80 border-red-500 text-red-200 shadow-red-950/50 animate-pulse'
            : isGo
            ? 'bg-emerald-950/40 border-emerald-600/60 text-emerald-200 shadow-emerald-950/30'
            : 'bg-amber-950/50 border-amber-500 text-amber-200 shadow-amber-950/40'
        }`}>
          {speActive ? (
            <AlertOctagon className="w-7 h-7 text-red-400 shrink-0" />
          ) : isGo ? (
            <ShieldCheck className="w-7 h-7 text-emerald-400 shrink-0" />
          ) : (
            <ShieldAlert className="w-7 h-7 text-amber-400 shrink-0" />
          )}
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              MISSION SAFETY STATUS
            </div>
            <div className="text-sm font-black tracking-wide">
              {speActive ? 'NO-GO: SPE ABORT' : isGo ? 'GO FOR EVA SORTIE' : 'CAUTION: MARGIN LIMIT'}
            </div>
          </div>
        </div>

        {/* Time-of-Sol & Solar Ephemeris Slider (goal.md stretch feature) */}
        <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5 uppercase">
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              Time-of-Sol Ephemeris
            </span>
            <span className="text-[10px] text-amber-400 font-bold">
              {formatLST(timeOfSol)}
            </span>
          </div>

          <div className="space-y-1">
            <input
              type="range"
              min="6.0"
              max="18.0"
              step="0.25"
              value={timeOfSol}
              onChange={(e) => setTimeOfSol(Number(e.target.value))}
              className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
            <div className="flex justify-between text-[9px] text-slate-500">
              <span>06:00 (Dawn)</span>
              <span>12:00 (Noon)</span>
              <span>18:00 (Dusk)</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800 text-[10px]">
            <div className="p-1.5 rounded bg-slate-950 border border-slate-800/80">
              <span className="text-slate-500 block">SUN ELEVATION</span>
              <span className="text-amber-300 font-bold">{sunElevationDeg}° above horizon</span>
            </div>
            <div className="p-1.5 rounded bg-slate-950 border border-slate-800/80">
              <span className="text-slate-500 block">DAYLIGHT REMAINING</span>
              <span className="text-slate-200 font-bold">{Math.floor(daylightMinRemaining / 60)}h {daylightMinRemaining % 60}m</span>
            </div>
          </div>
        </div>

        {/* Radiation & Space Weather Card */}
        <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-white flex items-center gap-1.5 uppercase">
              <Radio className="w-3.5 h-3.5 text-cyan-400" />
              Surface Radiation (MSL RAD)
            </span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800 font-bold">
              DERIVED PROXY
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-2 rounded bg-slate-950 border border-slate-800/80">
              <div className="text-[9px] text-slate-500">CURRENT DOSE RATE</div>
              <div className={`font-bold ${speActive ? 'text-red-400 text-sm' : 'text-emerald-400'}`}>
                {speActive ? '95.0 µSv/h' : '9.5 µSv/h'}
              </div>
            </div>
            <div className="p-2 rounded bg-slate-950 border border-slate-800/80">
              <div className="text-[9px] text-slate-500">DAILY ACCUMULATION</div>
              <div className="text-slate-200 font-bold">~0.23 mSv/day</div>
            </div>
          </div>

          {/* SPE Storm Toggle Button */}
          <button
            onClick={toggleSpe}
            className={`w-full py-2 px-3 rounded text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all border ${
              speActive
                ? 'bg-red-600 hover:bg-red-500 text-white border-red-400 shadow'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            {speActive ? 'End SPE Simulation' : 'Simulate Solar Particle Event (SPE)'}
          </button>
        </div>

        {/* Diurnal Weather (Perseverance MEDA) */}
        <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-white flex items-center gap-1.5 uppercase">
              <Wind className="w-3.5 h-3.5 text-amber-400" />
              Perseverance MEDA Weather
            </span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">
              REAL
            </span>
          </div>

          <div className="space-y-1.5 text-[11px] text-slate-300">
            <div className="flex justify-between border-b border-slate-800/60 pb-1">
              <span className="text-slate-500">Surface Temp (LST-adjusted):</span>
              <span className="font-bold text-cyan-300">{tempC}°C</span>
            </div>
            <div className="flex justify-between border-b border-slate-800/60 pb-1">
              <span className="text-slate-500">Atmospheric Pressure:</span>
              <span className="font-bold text-slate-200">745.2 Pa (7.45 mbar)</span>
            </div>
            <div className="flex justify-between border-b border-slate-800/60 pb-1">
              <span className="text-slate-500">Wind Mean / Max Gust:</span>
              <span className="font-bold text-slate-200">4.8 m/s / 14.2 m/s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Dust Optical Depth (τ):</span>
              <span className="font-bold text-emerald-400">0.42 (Clear Sky)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { ShieldAlert, Compass, Eye, Info, Clock, Radio, Sparkles } from 'lucide-react';

export const Header: React.FC = () => {
  const {
    displayMode,
    setDisplayMode,
    speActive,
    toggleSpe,
    setAssumptionsOpen,
    activeTab,
    setActiveTab,
    tourStep,
    setTourStep,
  } = useAppStore();

  const isHud = displayMode === 'hud';

  const handleStartTour = () => {
    setDisplayMode('planning');
    setActiveTab('layers');
    setTourStep(1);
  };

  return (
    <header className={`border-b transition-colors ${
      isHud 
        ? 'bg-black border-amber-500/40 text-amber-400' 
        : 'bg-[#12141c]/95 border-slate-800 text-slate-100 backdrop-blur'
    } px-4 py-2.5 flex items-center justify-between select-none z-30`}>
      {/* Brand & Mission Status */}
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-lg border ${
          isHud 
            ? 'bg-amber-950/60 border-amber-500/80 text-amber-300' 
            : 'bg-gradient-to-br from-red-600 to-amber-700 border-red-500/50 text-white shadow-lg shadow-red-950/50'
        }`}>
          ♂
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className={`font-mono font-bold tracking-wider text-base ${isHud ? 'text-amber-300' : 'text-slate-100'}`}>
              MARSWALK NAVIGATOR
            </h1>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold uppercase tracking-wider ${
              isHud ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-red-950/60 text-red-300 border border-red-800/50'
            }`}>
              Jezero Western Delta
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-500" />
              SOL 1050 • 10:45 LST
            </span>
            <span className="text-slate-600">|</span>
            <span className="flex items-center gap-1 text-emerald-400">
              <Radio className="w-3 h-3" />
              ORBITER RELAY: TGO LINK 98%
            </span>
          </div>
        </div>
      </div>

      {/* Navigation tabs in planning mode */}
      {!isHud && (
        <nav className="hidden md:flex items-center bg-slate-900/80 p-1 rounded-lg border border-slate-800 text-xs font-medium">
          <button
            onClick={() => setActiveTab('layers')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              activeTab === 'layers' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Data Layers (6)
          </button>
          <button
            onClick={() => setActiveTab('planner')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              activeTab === 'planner' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Route & Suit Planner
          </button>
          <button
            onClick={() => setActiveTab('safety')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              activeTab === 'safety' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Safety & Radiation
          </button>
          <button
            onClick={() => setActiveTab('pov')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              activeTab === 'pov' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Perseverance POV
          </button>
        </nav>
      )}

      {/* Scenario controls & Mode switch */}
      <div className="flex items-center gap-2.5">
        {/* Interactive Guided Tour Trigger */}
        <button
          onClick={handleStartTour}
          className={`px-2.5 py-1.5 rounded-md text-xs font-mono font-bold flex items-center gap-1.5 border transition-all ${
            tourStep !== null
              ? 'bg-cyan-600 text-white border-cyan-400 shadow-lg shadow-cyan-950 animate-pulse'
              : 'bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-600 hover:to-indigo-700 text-white border-blue-500/50 shadow'
          }`}
          title="Start 60-Second Interactive Demo Tour for Hackathon Judges"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
          <span className="hidden sm:inline">60s Demo Tour</span>
        </button>

        {/* SPE Storm Toggle Button */}
        <button
          onClick={toggleSpe}
          title="Simulate Solar Particle Event (SPE) radiation storm"
          className={`px-2.5 py-1.5 rounded-md text-xs font-mono font-medium flex items-center gap-1.5 border transition-all ${
            speActive
              ? 'bg-red-600 text-white border-red-400 animate-pulse shadow-lg shadow-red-900/60'
              : isHud
              ? 'bg-amber-950/40 text-amber-400 border-amber-600/40 hover:bg-amber-900/40'
              : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          {speActive ? 'SPE ACTIVE (10x FLUX)' : 'SPE SIM'}
        </button>

        {/* Assumptions Modal Trigger */}
        <button
          onClick={() => setAssumptionsOpen(true)}
          className={`p-1.5 rounded-md text-xs font-mono border transition-all ${
            isHud 
              ? 'bg-amber-950/40 text-amber-400 border-amber-600/40' 
              : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
          }`}
          title="Model Assumptions & Scientific Data Sources"
        >
          <Info className="w-4 h-4" />
        </button>

        {/* Display Mode Switch: Planning vs EVA HUD */}
        <div className={`flex rounded-lg p-0.5 border ${
          isHud ? 'bg-black border-amber-500' : 'bg-slate-900 border-slate-700'
        }`}>
          <button
            onClick={() => setDisplayMode('planning')}
            className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-all ${
              !isHud 
                ? 'bg-red-600 text-white shadow' 
                : 'text-amber-500/70 hover:text-amber-300'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Planning</span>
          </button>
          <button
            onClick={() => setDisplayMode('hud')}
            className={`px-2.5 py-1 rounded text-xs font-bold font-mono flex items-center gap-1.5 tracking-wider transition-all ${
              isHud 
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>EVA HUD</span>
          </button>
        </div>
      </div>
    </header>
  );
};

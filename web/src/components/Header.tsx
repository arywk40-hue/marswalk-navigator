import React from 'react';
import { useAppStore } from '../store/useAppStore';
import {
  ShieldAlert,
  Compass,
  Eye,
  Info,
  Clock,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
} from 'lucide-react';

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
    timeOfSol,
    layers,
    layerVisibility,
    waypoints,
    isLeftSidebarOpen,
    toggleLeftSidebar,
    isRightDrawerOpen,
    toggleRightDrawer,
  } = useAppStore();

  const isHud = displayMode === 'hud';
  const activeCount = layers.filter((l) => !!layerVisibility[l.id]).length;

  const formatLST = (decHour: number) => {
    const h = Math.floor(decHour);
    const m = Math.round((decHour - h) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} LST`;
  };

  const handleStartTour = () => {
    setDisplayMode('planning');
    setActiveTab('layers');
    setTourStep(1);
  };

  return (
    <header
      className={`border-b transition-colors ${
        isHud
          ? 'bg-black border-amber-500/40 text-amber-400 shadow-[0_4px_20px_rgba(245,158,11,0.15)]'
          : 'bg-[#10121a]/95 border-slate-800/90 text-slate-100 backdrop-blur-xl shadow-xl'
      } px-4 py-2.5 flex items-center justify-between select-none z-30`}
    >
      {/* Brand & Left Panel Toggle */}
      <div className="flex items-center gap-3">
        {!isHud && (
          <button
            onClick={toggleLeftSidebar}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors"
            title={isLeftSidebarOpen ? 'Collapse Left Panel' : 'Expand Left Panel'}
          >
            {isLeftSidebarOpen ? (
              <PanelLeftClose className="w-4 h-4 text-cyan-400" />
            ) : (
              <PanelLeftOpen className="w-4 h-4 text-slate-400" />
            )}
          </button>
        )}

        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-lg border transition-all ${
            isHud
              ? 'bg-amber-950/60 border-amber-500/80 text-amber-300 shadow-md shadow-amber-950'
              : 'bg-gradient-to-br from-red-600 to-amber-700 border-red-500/50 text-white shadow-lg shadow-red-950/60 ring-1 ring-white/10'
          }`}
        >
          ♂
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1
              className={`font-mono font-bold tracking-wider text-base ${
                isHud ? 'text-amber-300' : 'text-slate-100'
              }`}
            >
              MARSWALK NAVIGATOR
            </h1>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold uppercase tracking-wider border shadow-sm ${
                isHud
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-red-950/80 text-red-300 border-red-800/60'
              }`}
            >
              Jezero Western Delta
            </span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-slate-400 font-mono mt-0.5">
            <span className="flex items-center gap-1.5 text-slate-300">
              <Clock className="w-3.5 h-3.5 text-amber-400/80" />
              SOL 1050 • {formatLST(timeOfSol)}
            </span>
            <span className="text-slate-700">|</span>
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/80" />
              TGO ORBITER LINK 98%
            </span>
          </div>
        </div>
      </div>

      {/* Navigation tabs in planning mode */}
      {!isHud && (
        <nav className="hidden lg:flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs font-mono font-semibold shadow-inner">
          <button
            onClick={() => setActiveTab('layers')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'layers'
                ? 'bg-gradient-to-r from-slate-700 to-slate-800 text-white shadow-md border border-slate-600/50'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <span>Data Layers</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-950 text-cyan-300 border border-slate-700">
              {activeCount}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('planner')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'planner'
                ? 'bg-gradient-to-r from-slate-700 to-slate-800 text-white shadow-md border border-slate-600/50'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <span>Route & SEXTANT</span>
            {waypoints.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-950 text-amber-300 border border-slate-700">
                {waypoints.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('safety')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'safety'
                ? 'bg-gradient-to-r from-slate-700 to-slate-800 text-white shadow-md border border-slate-600/50'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <span>Safety & Weather</span>
          </button>
          <button
            onClick={() => setActiveTab('pov')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'pov'
                ? 'bg-gradient-to-r from-slate-700 to-slate-800 text-white shadow-md border border-slate-600/50'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <span>Surface POV & Live</span>
          </button>
        </nav>
      )}

      {/* Scenario controls & Mode switch */}
      <div className="flex items-center gap-2">
        {/* Interactive Guided Tour Trigger */}
        <button
          onClick={handleStartTour}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 border transition-all shadow-md active:scale-95 ${
            tourStep !== null
              ? 'bg-cyan-600 text-white border-cyan-400 shadow-cyan-950 animate-pulse'
              : 'bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white border-blue-400/50'
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
          className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 border transition-all active:scale-95 ${
            speActive
              ? 'bg-red-600 text-white border-red-400 animate-pulse shadow-lg shadow-red-900/60'
              : isHud
              ? 'bg-amber-950/40 text-amber-400 border-amber-600/40 hover:bg-amber-900/40'
              : 'bg-slate-800/80 text-slate-300 border-slate-700/80 hover:bg-slate-700'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span className="hidden md:inline">{speActive ? 'SPE ACTIVE (10x)' : 'SPE SIM'}</span>
        </button>

        {/* Assumptions Modal Trigger */}
        <button
          onClick={() => setAssumptionsOpen(true)}
          className={`p-1.5 rounded-lg text-xs font-mono border transition-all ${
            isHud
              ? 'bg-amber-950/40 text-amber-400 border-amber-600/40'
              : 'bg-slate-800/80 text-slate-300 border-slate-700/80 hover:bg-slate-700'
          }`}
          title="Model Assumptions & Scientific Data Sources"
        >
          <Info className="w-4 h-4" />
        </button>

        {/* Display Mode Switch: Planning vs EVA HUD */}
        <div
          className={`flex rounded-xl p-0.5 border ${
            isHud ? 'bg-black border-amber-500' : 'bg-slate-900 border-slate-700/80'
          }`}
        >
          <button
            onClick={() => setDisplayMode('planning')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
              !isHud ? 'bg-red-600 text-white shadow' : 'text-amber-500/70 hover:text-amber-300'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Planning</span>
          </button>
          <button
            onClick={() => setDisplayMode('hud')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono flex items-center gap-1.5 tracking-wider transition-all ${
              isHud
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>EVA HUD</span>
          </button>
        </div>

        {/* Right Drawer Toggle (Planning Mode only) */}
        {!isHud && (
          <button
            onClick={toggleRightDrawer}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors"
            title={isRightDrawerOpen ? 'Collapse Queue Panel' : 'Expand Queue Panel'}
          >
            {isRightDrawerOpen ? (
              <PanelRightClose className="w-4 h-4 text-cyan-400" />
            ) : (
              <PanelRightOpen className="w-4 h-4 text-slate-400" />
            )}
          </button>
        )}
      </div>
    </header>
  );
};

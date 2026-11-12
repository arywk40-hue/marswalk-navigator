import React from 'react';
import { useAppStore } from '../store/useAppStore';
import {
  Layers,
  ShieldCheck,
  Navigation,
  Camera,
  Eye,
  ChevronRight,
  ChevronLeft,
  X,
} from 'lucide-react';

interface GuidedTourModalProps {
  onPlanRouteAction?: () => void;
}

export const GuidedTourModal: React.FC<GuidedTourModalProps> = ({ onPlanRouteAction }) => {
  const {
    tourStep,
    setTourStep,
    setActiveTab,
    setDisplayMode,
    speActive,
    toggleSpe,
    targets,
    clearWaypoints,
    addWaypoint,
  } = useAppStore();

  if (tourStep === null) return null;

  const totalSteps = 5;

  const handleNext = () => {
    if (tourStep === 1) {
      // Move to Step 2: Safe Return Envelope
      setActiveTab('planner');
      setDisplayMode('planning');
      setTourStep(2);
    } else if (tourStep === 2) {
      // Move to Step 3: A* Route Planning
      clearWaypoints();
      if (targets.length >= 3) {
        addWaypoint(targets[3]); // Base Alpha
        addWaypoint(targets[0]); // Hawksbill Gap
        addWaypoint(targets[1]); // Hogwallow Carbonates
      }
      if (onPlanRouteAction) onPlanRouteAction();
      setTourStep(3);
    } else if (tourStep === 3) {
      // Move to Step 4: Planned vs Expected POV
      setActiveTab('pov');
      setTourStep(4);
    } else if (tourStep === 4) {
      // Move to Step 5: SPE Crisis & EVA HUD Visor
      if (!speActive) toggleSpe();
      setDisplayMode('hud');
      setTourStep(5);
    } else {
      // Finish Tour
      setTourStep(null);
    }
  };

  const handlePrev = () => {
    if (tourStep > 1) {
      setTourStep(tourStep - 1);
      if (tourStep === 5) {
        setDisplayMode('planning');
        setActiveTab('pov');
      } else if (tourStep === 4) {
        setActiveTab('planner');
      } else if (tourStep === 3) {
        setActiveTab('planner');
      } else if (tourStep === 2) {
        setActiveTab('layers');
      }
    }
  };

  const stepsData = [
    {
      step: 1,
      badge: 'Step 1 of 5 • Data Fusion',
      title: 'Hyperlocal NASA Multi-Mission Fusion',
      icon: <Layers className="w-5 h-5 text-red-500" />,
      content:
        'Marswalk Navigator combines 6 NASA data layers over Jezero Crater: 25cm HiRISE optical basemap, MOLA planetary elevation, 5m Horn slope, THEMIS thermal inertia, CRISM carbonate/clay mineralogy, and a synthesized hazard cost grid. Notice the transparent provenance tags (REAL, DERIVED, MODEL) on every layer.',
    },
    {
      step: 2,
      badge: 'Step 2 of 5 • Hero Safety Feature',
      title: 'The Safe Return Envelope',
      icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />,
      content:
        'Unlike regional global viewers, Marswalk Navigator calculates a real-time Dijkstra isochrone flood-fill from Habitat Alpha. The shaded cyan perimeter shows everywhere the crew can walk and still return within nominal consumables and a NASA 1.5x reserve margin.',
    },
    {
      step: 3,
      badge: 'Step 3 of 5 • Route Planning & Validation',
      title: 'Suit-Aware A* Routing & Rover Benchmarking',
      icon: <Navigation className="w-5 h-5 text-cyan-400" />,
      content:
        'A* pathfinding automatically routes astronauts from Habitat Alpha to Hawksbill Gap and Hogwallow Flats, avoiding steep scree (>15°) and sand traps. Notice the yellow dashed line: Perseverance’s actual rover path (Sols 0–1050), confirming our hazard grid matches real operational choices with 94.6% agreement.',
    },
    {
      step: 4,
      badge: 'Step 4 of 5 • Multi-Scale Verification',
      title: 'Planned vs. Expected Surface POV',
      icon: <Camera className="w-5 h-5 text-purple-400" />,
      content:
        'To prepare astronauts for what they will see, selecting any science target loads real Perseverance Mastcam-Z / Navcam surface photography alongside the orbital HiRISE context, local slope grade, and recommended sampling tools.',
    },
    {
      step: 5,
      badge: 'Step 5 of 5 • Space Weather & HUD',
      title: 'Solar Particle Event (SPE) & Helmet Visor HUD',
      icon: <Eye className="w-5 h-5 text-amber-400" />,
      content:
        'Simulate a solar proton storm: radiation spikes 10x (95 µSv/h), the mission flips to NO-GO, the safe envelope contracts to an emergency 40-minute abort window, and the visor switches to high-contrast EVA HUD mode with glanceable bearing, walk-back countdown, and O2 reserves.',
    },
  ];

  const current = stepsData[tourStep - 1] || stepsData[0];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl px-4 animate-bounce-short">
      <div className="bg-[#12141e]/98 border-2 border-cyan-500/80 rounded-2xl p-5 shadow-2xl backdrop-blur-md text-slate-100 flex flex-col space-y-3.5">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {current.icon}
            <span className="text-xs font-mono font-bold tracking-wider text-cyan-400 uppercase">
              {current.badge}
            </span>
          </div>
          <button
            onClick={() => setTourStep(null)}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            title="Exit Tour"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Title & Body */}
        <div>
          <h3 className="text-base font-bold font-mono text-white mb-1">
            {current.title}
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            {current.content}
          </p>
        </div>

        {/* Stepper Buttons & Progress Dots */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
          <div className="flex gap-1.5">
            {stepsData.map((s) => (
              <span
                key={s.step}
                className={`w-2 h-2 rounded-full transition-all ${
                  s.step === tourStep
                    ? 'w-6 bg-cyan-400'
                    : s.step < tourStep
                    ? 'bg-emerald-400'
                    : 'bg-slate-700'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {tourStep > 1 && (
              <button
                onClick={handlePrev}
                className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono rounded-lg flex items-center gap-1 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              className="py-1.5 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-mono font-bold text-xs rounded-lg flex items-center gap-1.5 transition-all shadow-lg shadow-cyan-950"
            >
              <span>{tourStep === totalSteps ? 'Complete Tour' : 'Next Step'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

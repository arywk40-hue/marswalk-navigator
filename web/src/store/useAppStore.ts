import { create } from 'zustand';
import { Manifest, Layer, Target, PlannedRoute, DisplayMode } from '../types';

interface AppState {
  manifest: Manifest | null;
  layers: Layer[];
  layerVisibility: Record<string, boolean>;
  layerOpacity: Record<string, number>;
  displayMode: DisplayMode;
  targets: Target[];
  selectedTarget: Target | null;
  waypoints: Target[];
  plannedRoute: PlannedRoute | null;
  isPlanning: boolean;
  speActive: boolean; // Solar Particle Event scenario
  timeOfSol: number; // decimal hours (0 - 24)
  assumptionsOpen: boolean;
  cueCardOpen: boolean;
  activeTab: 'layers' | 'planner' | 'safety' | 'pov';
  tourStep: number | null; // Guided tour step (1 - 5)
  maxSortieMin: number; // Excursion budget in minutes
  mobilityMode: 'foot' | 'rover'; // Foot EVA vs Rover-assisted
  isLeftSidebarOpen: boolean;
  isRightDrawerOpen: boolean;

  // Actions
  setManifest: (manifest: Manifest) => void;
  setTargets: (targets: Target[]) => void;
  toggleLayer: (id: string) => void;
  setLayersVisibilityBatch: (visibility: Record<string, boolean>) => void;
  setLayerOpacity: (id: string, opacity: number) => void;
  setDisplayMode: (mode: DisplayMode) => void;
  setSelectedTarget: (target: Target | null) => void;
  addWaypoint: (target: Target) => void;
  removeWaypoint: (targetId: string) => void;
  clearWaypoints: () => void;
  setPlannedRoute: (route: PlannedRoute | null) => void;
  setIsPlanning: (isPlanning: boolean) => void;
  toggleSpe: () => void;
  setTimeOfSol: (hour: number) => void;
  setAssumptionsOpen: (open: boolean) => void;
  setCueCardOpen: (open: boolean) => void;
  setActiveTab: (tab: 'layers' | 'planner' | 'safety' | 'pov') => void;
  setTourStep: (step: number | null) => void;
  setMaxSortieMin: (mins: number) => void;
  setMobilityMode: (mode: 'foot' | 'rover') => void;
  toggleLeftSidebar: () => void;
  toggleRightDrawer: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  manifest: null,
  layers: [],
  layerVisibility: {},
  layerOpacity: {},
  displayMode: 'planning',
  targets: [],
  selectedTarget: null,
  waypoints: [],
  plannedRoute: null,
  isPlanning: false,
  speActive: false,
  timeOfSol: 10.75, // 10:45 LST
  assumptionsOpen: false,
  cueCardOpen: false,
  activeTab: 'layers',
  tourStep: null,
  maxSortieMin: 180.0,
  mobilityMode: 'foot',
  isLeftSidebarOpen: true,
  isRightDrawerOpen: true,

  setManifest: (manifest) => {
    const visibility: Record<string, boolean> = {};
    const opacity: Record<string, number> = {};
    manifest.layers.forEach((layer) => {
      visibility[layer.id] = layer.defaultVisible;
      opacity[layer.id] = layer.defaultOpacity;
    });
    set({
      manifest,
      layers: manifest.layers,
      layerVisibility: visibility,
      layerOpacity: opacity,
    });
  },

  setTargets: (targets) => set({ targets }),

  toggleLayer: (id) =>
    set((state) => ({
      layerVisibility: {
        ...state.layerVisibility,
        [id]: !state.layerVisibility[id],
      },
    })),

  setLayersVisibilityBatch: (visibility) =>
    set((state) => ({
      layerVisibility: {
        ...state.layerVisibility,
        ...visibility,
      },
    })),

  setLayerOpacity: (id, opacity) =>
    set((state) => ({
      layerOpacity: {
        ...state.layerOpacity,
        [id]: opacity,
      },
    })),

  toggleLeftSidebar: () => set((state) => ({ isLeftSidebarOpen: !state.isLeftSidebarOpen })),

  toggleRightDrawer: () => set((state) => ({ isRightDrawerOpen: !state.isRightDrawerOpen })),

  setDisplayMode: (mode) => set({ displayMode: mode }),

  setSelectedTarget: (target) => set({ selectedTarget: target }),

  addWaypoint: (target) => {
    const { waypoints } = get();
    if (!waypoints.find((w) => w.id === target.id)) {
      set({ waypoints: [...waypoints, target] });
    }
  },

  removeWaypoint: (targetId) =>
    set((state) => ({
      waypoints: state.waypoints.filter((w) => w.id !== targetId),
    })),

  clearWaypoints: () => set({ waypoints: [], plannedRoute: null }),

  setPlannedRoute: (route) => set({ plannedRoute: route }),

  setIsPlanning: (isPlanning) => set({ isPlanning }),

  toggleSpe: () => set((state) => ({ speActive: !state.speActive })),

  setTimeOfSol: (hour) => set({ timeOfSol: hour }),

  setAssumptionsOpen: (open) => set({ assumptionsOpen: open }),

  setCueCardOpen: (open) => set({ cueCardOpen: open }),

  setActiveTab: (tab) => set({ activeTab: tab }),

  setTourStep: (step) => set({ tourStep: step }),

  setMaxSortieMin: (mins) => set({ maxSortieMin: mins }),

  setMobilityMode: (mode) => set({ mobilityMode: mode }),
}));

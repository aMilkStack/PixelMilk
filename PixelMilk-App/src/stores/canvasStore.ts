import { create } from 'zustand';
import type { CanvasState, ToolMode } from '../types';
import { getSetting, setSetting } from '../services/storage/settings';

const ZOOM_SETTING_KEY = 'canvas_zoom';

interface CanvasStore extends CanvasState {
  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  setTool: (tool: ToolMode) => void;
  setBrushSize: (size: number) => void;
  setSelectedColor: (color: string) => void;
  resetCanvas: () => void;
  loadPersistedState: () => Promise<void>;
}

const initialState: CanvasState = {
  zoom: 1,
  panX: 0,
  panY: 0,
  tool: 'draw',
  brushSize: 1,
  selectedColor: '#8bd0ba',
};

export const useCanvasStore = create<CanvasStore>((set) => ({
  ...initialState,

  setZoom: (zoom) => {
    const clampedZoom = Math.max(0.5, Math.min(32, zoom));
    set({ zoom: clampedZoom });
    // Persist zoom level asynchronously
    setSetting(ZOOM_SETTING_KEY, clampedZoom).catch((err) =>
      console.error('Failed to persist zoom level:', err)
    );
  },
  setPan: (x, y) => set({ panX: x, panY: y }),
  setTool: (tool) => set({ tool }),
  setBrushSize: (size) => set({ brushSize: Math.max(1, Math.min(8, size)) }),
  setSelectedColor: (color) => set({ selectedColor: color }),
  resetCanvas: () => set(initialState),

  loadPersistedState: async () => {
    try {
      const savedZoom = await getSetting<number>(ZOOM_SETTING_KEY, initialState.zoom);
      set({ zoom: savedZoom });
    } catch (err) {
      console.error('Failed to load persisted canvas state:', err);
    }
  },
}));

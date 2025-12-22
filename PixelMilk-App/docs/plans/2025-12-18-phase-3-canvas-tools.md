# Phase 3: Canvas & Editing Tools

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build interactive pixel editing canvas with drawing tools, zoom/pan controls, and hotspot-based AI editing (PixShop-style click-to-edit).

**Architecture:** Extend SpriteCanvas with tool state, input handlers, and undo/redo system. Hotspot system captures click coordinates for targeted AI edits.

**Prerequisites:** Phase 2 complete (Character Tab MVP)

---

## Task 3.1: Create Undo/Redo System

**Files:**
- Create: `src/hooks/useHistory.ts`

**Step 1: Create src/hooks/useHistory.ts**

```typescript
import { useState, useCallback } from 'react';

interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

export function useHistory<T>(initialState: T, maxHistory = 50) {
  const [history, setHistory] = useState<HistoryState<T>>({
    past: [],
    present: initialState,
    future: [],
  });

  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  const push = useCallback((newState: T) => {
    setHistory((h) => ({
      past: [...h.past.slice(-maxHistory + 1), h.present],
      present: newState,
      future: [],
    }));
  }, [maxHistory]);

  const undo = useCallback(() => {
    setHistory((h) => {
      if (h.past.length === 0) return h;
      const previous = h.past[h.past.length - 1];
      const newPast = h.past.slice(0, -1);
      return {
        past: newPast,
        present: previous,
        future: [h.present, ...h.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory((h) => {
      if (h.future.length === 0) return h;
      const next = h.future[0];
      const newFuture = h.future.slice(1);
      return {
        past: [...h.past, h.present],
        present: next,
        future: newFuture,
      };
    });
  }, []);

  const reset = useCallback((newState: T) => {
    setHistory({
      past: [],
      present: newState,
      future: [],
    });
  }, []);

  return {
    state: history.present,
    push,
    undo,
    redo,
    reset,
    canUndo,
    canRedo,
  };
}
```

**Step 2: Commit**

```bash
git add .
git commit -m "feat(canvas): add undo/redo history hook"
```

---

## Task 3.2: Create Keyboard Shortcuts Hook

**Files:**
- Create: `src/hooks/useKeyboard.ts`

**Step 1: Create src/hooks/useKeyboard.ts**

```typescript
import { useEffect, useCallback } from 'react';

type KeyHandler = () => void;

interface KeyBindings {
  [key: string]: KeyHandler;
}

export function useKeyboard(bindings: KeyBindings) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Build key string
      const parts: string[] = [];
      if (e.ctrlKey || e.metaKey) parts.push('ctrl');
      if (e.shiftKey) parts.push('shift');
      if (e.altKey) parts.push('alt');
      parts.push(e.key.toLowerCase());
      
      const keyString = parts.join('+');
      
      const handler = bindings[keyString];
      if (handler) {
        e.preventDefault();
        handler();
      }
    },
    [bindings]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

// Common shortcuts for pixel editing
export const EDITOR_SHORTCUTS = {
  UNDO: 'ctrl+z',
  REDO: 'ctrl+shift+z',
  REDO_ALT: 'ctrl+y',
  DRAW: 'd',
  ERASE: 'e',
  FILL: 'f',
  EYEDROPPER: 'i',
  SELECT: 'v',
  ZOOM_IN: '=',
  ZOOM_OUT: '-',
  ZOOM_RESET: '0',
};
```

**Step 2: Commit**

```bash
git add .
git commit -m "feat(canvas): add keyboard shortcuts hook"
```

---

## Task 3.3: Create Zoom Controls Component

**Files:**
- Create: `src/components/canvas/ZoomControls.tsx`

**Step 1: Create src/components/canvas/ZoomControls.tsx**

```tsx
import { Button } from '@/components/shared';
import { useCanvasStore } from '@/stores';
import { ZoomIn, ZoomOut, Maximize } from 'lucide-react';

export function ZoomControls() {
  const { zoom, setZoom } = useCanvasStore();
  
  const zoomLevels = [0.5, 1, 2, 4, 8, 16, 32];
  
  const handleZoomIn = () => {
    const currentIndex = zoomLevels.findIndex((z) => z >= zoom);
    const nextIndex = Math.min(currentIndex + 1, zoomLevels.length - 1);
    setZoom(zoomLevels[nextIndex]);
  };
  
  const handleZoomOut = () => {
    const currentIndex = zoomLevels.findIndex((z) => z >= zoom);
    const prevIndex = Math.max(currentIndex - 1, 0);
    setZoom(zoomLevels[prevIndex]);
  };
  
  const handleReset = () => {
    setZoom(1);
  };
  
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    padding: 'var(--space-2)',
    backgroundColor: 'var(--color-bg-secondary)',
    border: '1px solid var(--color-border-muted)',
  };
  
  const zoomTextStyle: React.CSSProperties = {
    minWidth: '60px',
    textAlign: 'center',
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-text-secondary)',
  };
  
  return (
    <div style={containerStyle}>
      <Button variant="ghost" size="sm" onClick={handleZoomOut} title="Zoom Out (-)">
        <ZoomOut size={16} />
      </Button>
      
      <span style={zoomTextStyle}>{Math.round(zoom * 100)}%</span>
      
      <Button variant="ghost" size="sm" onClick={handleZoomIn} title="Zoom In (=)">
        <ZoomIn size={16} />
      </Button>
      
      <Button variant="ghost" size="sm" onClick={handleReset} title="Reset Zoom (0)">
        <Maximize size={16} />
      </Button>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add .
git commit -m "feat(canvas): add zoom controls component"
```

---

## Task 3.4: Create Tool Palette Component

**Files:**
- Create: `src/components/canvas/ToolPalette.tsx`

**Step 1: Create src/components/canvas/ToolPalette.tsx**

```tsx
import { Button, Tooltip } from '@/components/shared';
import { useCanvasStore } from '@/stores';
import type { ToolMode } from '@/types';
import { 
  MousePointer, 
  Pencil, 
  Eraser, 
  PaintBucket, 
  Pipette,
  Target,
} from 'lucide-react';

interface ToolConfig {
  id: ToolMode;
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  shortcut: string;
}

const tools: ToolConfig[] = [
  { id: 'select', icon: MousePointer, label: 'Select', shortcut: 'V' },
  { id: 'draw', icon: Pencil, label: 'Draw', shortcut: 'D' },
  { id: 'erase', icon: Eraser, label: 'Erase', shortcut: 'E' },
  { id: 'fill', icon: PaintBucket, label: 'Fill', shortcut: 'F' },
  { id: 'eyedropper', icon: Pipette, label: 'Eyedropper', shortcut: 'I' },
  { id: 'hotspot', icon: Target, label: 'AI Hotspot', shortcut: 'H' },
];

export function ToolPalette() {
  const { tool, setTool, brushSize, setBrushSize } = useCanvasStore();
  
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-1)',
    padding: 'var(--space-2)',
    backgroundColor: 'var(--color-bg-secondary)',
    border: '1px solid var(--color-border-muted)',
  };
  
  const getButtonStyle = (isActive: boolean): React.CSSProperties => ({
    backgroundColor: isActive ? 'var(--color-text-primary)' : 'transparent',
    color: isActive ? 'var(--color-bg-primary)' : 'var(--color-text-primary)',
  });
  
  const brushSizeStyle: React.CSSProperties = {
    marginTop: 'var(--space-2)',
    paddingTop: 'var(--space-2)',
    borderTop: '1px solid var(--color-border-muted)',
  };
  
  return (
    <div style={containerStyle}>
      {tools.map((t) => {
        const Icon = t.icon;
        const isActive = tool === t.id;
        return (
          <Tooltip key={t.id} content={`${t.label} (${t.shortcut})`}>
            <Button
              variant="ghost"
              size="sm"
              style={getButtonStyle(isActive)}
              onClick={() => setTool(t.id)}
            >
              <Icon size={18} />
            </Button>
          </Tooltip>
        );
      })}
      
      {(tool === 'draw' || tool === 'erase') && (
        <div style={brushSizeStyle}>
          <label style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
            Size: {brushSize}
          </label>
          <input
            type="range"
            min="1"
            max="8"
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add .
git commit -m "feat(canvas): add tool palette component"
```

---

## Task 3.5: Extend Canvas Store for Editing

**Files:**
- Update: `src/stores/canvasStore.ts`

**Step 1: Update src/stores/canvasStore.ts**

```typescript
import { create } from 'zustand';
import type { CanvasState, ToolMode } from '@/types';

interface EditingState {
  // Hotspot selection
  hotspotX: number | null;
  hotspotY: number | null;
  hotspotRadius: number;
  
  // Drawing state
  isDrawing: boolean;
}

interface CanvasStore extends CanvasState, EditingState {
  // Zoom/Pan
  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  
  // Tools
  setTool: (tool: ToolMode) => void;
  setBrushSize: (size: number) => void;
  setSelectedColor: (color: string) => void;
  
  // Hotspot
  setHotspot: (x: number | null, y: number | null) => void;
  setHotspotRadius: (radius: number) => void;
  clearHotspot: () => void;
  
  // Drawing
  setIsDrawing: (isDrawing: boolean) => void;
  
  // Reset
  resetCanvas: () => void;
}

const initialState: CanvasState & EditingState = {
  zoom: 4,
  panX: 0,
  panY: 0,
  tool: 'draw',
  brushSize: 1,
  selectedColor: '#8bd0ba',
  hotspotX: null,
  hotspotY: null,
  hotspotRadius: 3,
  isDrawing: false,
};

export const useCanvasStore = create<CanvasStore>((set) => ({
  ...initialState,
  
  setZoom: (zoom) => set({ zoom: Math.max(0.5, Math.min(32, zoom)) }),
  setPan: (panX, panY) => set({ panX, panY }),
  
  setTool: (tool) => set({ tool }),
  setBrushSize: (brushSize) => set({ brushSize: Math.max(1, Math.min(8, brushSize)) }),
  setSelectedColor: (selectedColor) => set({ selectedColor }),
  
  setHotspot: (hotspotX, hotspotY) => set({ hotspotX, hotspotY }),
  setHotspotRadius: (hotspotRadius) => set({ hotspotRadius }),
  clearHotspot: () => set({ hotspotX: null, hotspotY: null }),
  
  setIsDrawing: (isDrawing) => set({ isDrawing }),
  
  resetCanvas: () => set(initialState),
}));
```

**Step 2: Commit**

```bash
git add .
git commit -m "feat(canvas): extend canvas store for editing"
```

---

## Task 3.6: Create Interactive Sprite Canvas

**Files:**
- Create: `src/components/canvas/InteractiveCanvas.tsx`

**Step 1: Create src/components/canvas/InteractiveCanvas.tsx**

```tsx
import { useRef, useEffect, useCallback, useState } from 'react';
import type { SpriteData } from '@/types';
import { useCanvasStore } from '@/stores';

interface InteractiveCanvasProps {
  sprite: SpriteData | null;
  onPixelsChange?: (pixels: string[]) => void;
  onHotspotSelect?: (x: number, y: number, radius: number) => void;
  showGrid?: boolean;
}

export function InteractiveCanvas({
  sprite,
  onPixelsChange,
  onHotspotSelect,
  showGrid = true,
}: InteractiveCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [localPixels, setLocalPixels] = useState<string[]>([]);
  
  const {
    zoom,
    panX,
    panY,
    tool,
    brushSize,
    selectedColor,
    hotspotX,
    hotspotY,
    hotspotRadius,
    isDrawing,
    setIsDrawing,
    setHotspot,
    setPan,
  } = useCanvasStore();
  
  const pixelSize = 16 * zoom;
  
  // Sync local pixels with sprite
  useEffect(() => {
    if (sprite) {
      setLocalPixels([...sprite.pixels]);
    }
  }, [sprite]);
  
  // Convert screen coords to pixel coords
  const screenToPixel = useCallback((screenX: number, screenY: number) => {
    const canvas = canvasRef.current;
    if (!canvas || !sprite) return null;
    
    const rect = canvas.getBoundingClientRect();
    const canvasX = screenX - rect.left;
    const canvasY = screenY - rect.top;
    
    const offsetX = (canvas.width - sprite.width * pixelSize) / 2 + panX;
    const offsetY = (canvas.height - sprite.height * pixelSize) / 2 + panY;
    
    const pixelX = Math.floor((canvasX - offsetX) / pixelSize);
    const pixelY = Math.floor((canvasY - offsetY) / pixelSize);
    
    if (pixelX >= 0 && pixelX < sprite.width && pixelY >= 0 && pixelY < sprite.height) {
      return { x: pixelX, y: pixelY };
    }
    return null;
  }, [sprite, pixelSize, panX, panY]);
  
  // Set pixel colour
  const setPixel = useCallback((x: number, y: number, colour: string) => {
    if (!sprite) return;
    
    setLocalPixels((prev) => {
      const newPixels = [...prev];
      
      // Apply brush size
      for (let dy = -brushSize + 1; dy < brushSize; dy++) {
        for (let dx = -brushSize + 1; dx < brushSize; dx++) {
          const px = x + dx;
          const py = y + dy;
          
          if (px >= 0 && px < sprite.width && py >= 0 && py < sprite.height) {
            const index = py * sprite.width + px;
            newPixels[index] = colour;
          }
        }
      }
      
      return newPixels;
    });
  }, [sprite, brushSize]);
  
  // Mouse handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const pixel = screenToPixel(e.clientX, e.clientY);
    if (!pixel) return;
    
    if (tool === 'draw') {
      setIsDrawing(true);
      setPixel(pixel.x, pixel.y, selectedColor);
    } else if (tool === 'erase') {
      setIsDrawing(true);
      setPixel(pixel.x, pixel.y, 'transparent');
    } else if (tool === 'eyedropper') {
      const index = pixel.y * sprite!.width + pixel.x;
      const colour = localPixels[index];
      if (colour && colour !== 'transparent') {
        useCanvasStore.getState().setSelectedColor(colour);
      }
    } else if (tool === 'hotspot') {
      setHotspot(pixel.x, pixel.y);
      onHotspotSelect?.(pixel.x, pixel.y, hotspotRadius);
    } else if (tool === 'fill') {
      // Flood fill
      const targetColour = localPixels[pixel.y * sprite!.width + pixel.x];
      if (targetColour === selectedColor) return;
      
      const filled = floodFill(
        localPixels,
        sprite!.width,
        sprite!.height,
        pixel.x,
        pixel.y,
        targetColour,
        selectedColor
      );
      setLocalPixels(filled);
    }
  }, [tool, screenToPixel, setPixel, selectedColor, localPixels, sprite, hotspotRadius, onHotspotSelect, setHotspot, setIsDrawing]);
  
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDrawing) return;
    
    const pixel = screenToPixel(e.clientX, e.clientY);
    if (!pixel) return;
    
    if (tool === 'draw') {
      setPixel(pixel.x, pixel.y, selectedColor);
    } else if (tool === 'erase') {
      setPixel(pixel.x, pixel.y, 'transparent');
    }
  }, [isDrawing, tool, screenToPixel, setPixel, selectedColor]);
  
  const handleMouseUp = useCallback(() => {
    if (isDrawing) {
      setIsDrawing(false);
      onPixelsChange?.(localPixels);
    }
  }, [isDrawing, localPixels, onPixelsChange, setIsDrawing]);
  
  // Wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -1 : 1;
    const newZoom = Math.max(0.5, Math.min(32, zoom * (1 + delta * 0.1)));
    useCanvasStore.getState().setZoom(newZoom);
  }, [zoom]);
  
  // Draw canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear
    ctx.fillStyle = '#021a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if (!sprite || localPixels.length === 0) {
      ctx.fillStyle = '#4a7a6e';
      ctx.font = '16px VT323';
      ctx.textAlign = 'center';
      ctx.fillText('> No sprite loaded', canvas.width / 2, canvas.height / 2);
      return;
    }
    
    const { width, height } = sprite;
    const offsetX = (canvas.width - width * pixelSize) / 2 + panX;
    const offsetY = (canvas.height - height * pixelSize) / 2 + panY;
    
    // Draw transparency checkerboard
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const isLight = (x + y) % 2 === 0;
        ctx.fillStyle = isLight ? '#043636' : '#032828';
        ctx.fillRect(offsetX + x * pixelSize, offsetY + y * pixelSize, pixelSize, pixelSize);
      }
    }
    
    // Draw pixels
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const colour = localPixels[y * width + x];
        if (colour && colour !== 'transparent') {
          ctx.fillStyle = colour;
          ctx.fillRect(offsetX + x * pixelSize, offsetY + y * pixelSize, pixelSize, pixelSize);
        }
      }
    }
    
    // Draw grid
    if (showGrid && zoom >= 2) {
      ctx.strokeStyle = 'rgba(139, 208, 186, 0.2)';
      ctx.lineWidth = 1;
      
      for (let x = 0; x <= width; x++) {
        ctx.beginPath();
        ctx.moveTo(offsetX + x * pixelSize, offsetY);
        ctx.lineTo(offsetX + x * pixelSize, offsetY + height * pixelSize);
        ctx.stroke();
      }
      
      for (let y = 0; y <= height; y++) {
        ctx.beginPath();
        ctx.moveTo(offsetX, offsetY + y * pixelSize);
        ctx.lineTo(offsetX + width * pixelSize, offsetY + y * pixelSize);
        ctx.stroke();
      }
    }
    
    // Draw hotspot highlight
    if (hotspotX !== null && hotspotY !== null) {
      ctx.strokeStyle = '#f04e4e';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      
      const hx = offsetX + (hotspotX - hotspotRadius + 1) * pixelSize;
      const hy = offsetY + (hotspotY - hotspotRadius + 1) * pixelSize;
      const hw = (hotspotRadius * 2 - 1) * pixelSize;
      
      ctx.strokeRect(hx, hy, hw, hw);
      ctx.setLineDash([]);
    }
  }, [sprite, localPixels, pixelSize, panX, panY, showGrid, zoom, hotspotX, hotspotY, hotspotRadius]);
  
  useEffect(() => {
    draw();
  }, [draw]);
  
  const getCursor = () => {
    switch (tool) {
      case 'draw': return 'crosshair';
      case 'erase': return 'crosshair';
      case 'fill': return 'crosshair';
      case 'eyedropper': return 'crosshair';
      case 'hotspot': return 'pointer';
      default: return 'default';
    }
  };
  
  return (
    <canvas
      ref={canvasRef}
      width={640}
      height={640}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      style={{
        cursor: getCursor(),
        imageRendering: 'pixelated',
        border: '1px solid var(--color-border-muted)',
      }}
    />
  );
}

// Flood fill helper
function floodFill(
  pixels: string[],
  width: number,
  height: number,
  startX: number,
  startY: number,
  targetColour: string,
  fillColour: string
): string[] {
  const result = [...pixels];
  const stack: [number, number][] = [[startX, startY]];
  const visited = new Set<string>();
  
  while (stack.length > 0) {
    const [x, y] = stack.pop()!;
    const key = `${x},${y}`;
    
    if (visited.has(key)) continue;
    if (x < 0 || x >= width || y < 0 || y >= height) continue;
    
    const index = y * width + x;
    if (result[index] !== targetColour) continue;
    
    visited.add(key);
    result[index] = fillColour;
    
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
  
  return result;
}
```

**Step 2: Update src/components/canvas/index.ts**

```typescript
export { SpriteCanvas } from './SpriteCanvas';
export { InteractiveCanvas } from './InteractiveCanvas';
export { ZoomControls } from './ZoomControls';
export { ToolPalette } from './ToolPalette';
```

**Step 3: Commit**

```bash
git add .
git commit -m "feat(canvas): add interactive canvas with drawing tools"
```

---

## Task 3.7: Create Hotspot Edit Modal

**Files:**
- Create: `src/components/canvas/HotspotEditModal.tsx`

**Step 1: Create src/components/canvas/HotspotEditModal.tsx**

```tsx
import { useState } from 'react';
import { Button, Input, Panel } from '@/components/shared';
import { useCanvasStore, useAppStore } from '@/stores';
import { Sparkles, X } from 'lucide-react';

interface HotspotEditModalProps {
  onEdit: (instruction: string) => Promise<void>;
  onClose: () => void;
}

export function HotspotEditModal({ onEdit, onClose }: HotspotEditModalProps) {
  const [instruction, setInstruction] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { hotspotX, hotspotY, hotspotRadius, setHotspotRadius, clearHotspot } = useCanvasStore();
  
  const handleSubmit = async () => {
    if (!instruction.trim()) return;
    
    setIsLoading(true);
    try {
      await onEdit(instruction);
      setInstruction('');
      clearHotspot();
      onClose();
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleClose = () => {
    clearHotspot();
    onClose();
  };
  
  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(2, 26, 26, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  };
  
  const modalStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: '400px',
    margin: 'var(--space-4)',
  };
  
  return (
    <div style={overlayStyle} onClick={handleClose}>
      <div onClick={(e) => e.stopPropagation()}>
        <Panel title="AI Hotspot Edit" style={modalStyle}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
              > Selected area: ({hotspotX}, {hotspotY}) with radius {hotspotRadius}
            </p>
            
            <div>
              <label style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                > Edit radius
              </label>
              <input
                type="range"
                min="1"
                max="8"
                value={hotspotRadius}
                onChange={(e) => setHotspotRadius(Number(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>
            
            <Input
              label="What should change?"
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="e.g., make this part golden"
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
            
            <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
              <Button variant="ghost" onClick={handleClose}>
                <X size={16} /> Cancel
              </Button>
              <Button onClick={handleSubmit} isLoading={isLoading}>
                <Sparkles size={16} /> Apply Edit
              </Button>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
```

**Step 2: Update src/components/canvas/index.ts**

```typescript
export { SpriteCanvas } from './SpriteCanvas';
export { InteractiveCanvas } from './InteractiveCanvas';
export { ZoomControls } from './ZoomControls';
export { ToolPalette } from './ToolPalette';
export { HotspotEditModal } from './HotspotEditModal';
```

**Step 3: Commit**

```bash
git add .
git commit -m "feat(canvas): add hotspot edit modal"
```

---

## Task 3.8: Create Hotspot Edit Service

**Files:**
- Create: `src/services/gemini/editing.ts`
- Update: `src/services/gemini/index.ts`

**Step 1: Create src/services/gemini/editing.ts**

```typescript
import { getClient } from './client';
import { getConfigForTask } from './modelRouter';
import type { SpriteData } from '@/types';

interface HotspotEditParams {
  sprite: SpriteData;
  hotspotX: number;
  hotspotY: number;
  hotspotRadius: number;
  instruction: string;
  lockedPalette: string[];
}

export async function applyHotspotEdit(params: HotspotEditParams): Promise<string[]> {
  const { sprite, hotspotX, hotspotY, hotspotRadius, instruction, lockedPalette } = params;
  const client = getClient();
  const config = getConfigForTask('edit-localised');
  
  // Extract the affected region
  const minX = Math.max(0, hotspotX - hotspotRadius + 1);
  const maxX = Math.min(sprite.width - 1, hotspotX + hotspotRadius - 1);
  const minY = Math.max(0, hotspotY - hotspotRadius + 1);
  const maxY = Math.min(sprite.height - 1, hotspotY + hotspotRadius - 1);
  
  const regionWidth = maxX - minX + 1;
  const regionHeight = maxY - minY + 1;
  
  // Extract current pixels in region
  const regionPixels: string[] = [];
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      regionPixels.push(sprite.pixels[y * sprite.width + x]);
    }
  }
  
  const prompt = `
You are editing a small region of a pixel art sprite.

CURRENT REGION (${regionWidth}x${regionHeight} pixels, row-major):
${JSON.stringify(regionPixels)}

CONTEXT: This region is at position (${minX},${minY}) in a ${sprite.width}x${sprite.height} sprite.

INSTRUCTION: ${instruction}

LOCKED PALETTE - Use ONLY these colours:
${JSON.stringify(lockedPalette)}

Output ONLY a JSON array of exactly ${regionWidth * regionHeight} pixel values.
Each value must be a hex colour from the palette OR "transparent".
Maintain coherence with surrounding pixels.
`;

  const response = await client.models.generateContent({
    model: config.model,
    contents: prompt,
    config: {
      temperature: config.temperature,
      responseMimeType: 'application/json',
    },
  });
  
  const text = response.text;
  if (!text) throw new Error('No response from model');
  
  const newRegionPixels = JSON.parse(text) as string[];
  
  if (newRegionPixels.length !== regionWidth * regionHeight) {
    throw new Error(`Invalid pixel count: got ${newRegionPixels.length}, expected ${regionWidth * regionHeight}`);
  }
  
  // Merge back into full sprite
  const resultPixels = [...sprite.pixels];
  let regionIndex = 0;
  
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      resultPixels[y * sprite.width + x] = newRegionPixels[regionIndex++];
    }
  }
  
  return resultPixels;
}
```

**Step 2: Update src/services/gemini/index.ts**

```typescript
export { initializeClient, getClient, isClientInitialized } from './client';
export { generateContent, generateStructuredContent, generateImage, editImage } from './client';
export { getModelForTask, getConfigForTask } from './modelRouter';
export { generateCharacterIdentity, generateSprite } from './character';
export { applyHotspotEdit } from './editing';
export * from './schemas';
```

**Step 3: Commit**

```bash
git add .
git commit -m "feat(canvas): add hotspot edit service"
```

---

## Task 3.9: Update Character Tab with Editing

**Files:**
- Update: `src/components/character/CharacterTab.tsx`

**Step 1: Update CharacterTab to use interactive canvas and hotspot editing**

```tsx
import { useState, useCallback } from 'react';
import { CharacterForm } from './CharacterForm';
import { StyleControls } from './StyleControls';
import { IdentityCard } from './IdentityCard';
import { PaletteDisplay } from './PaletteDisplay';
import { InteractiveCanvas, ZoomControls, ToolPalette, HotspotEditModal } from '@/components/canvas';
import { useCharacterStore, useAppStore, useCanvasStore } from '@/stores';
import { applyHotspotEdit } from '@/services/gemini';
import { Panel } from '@/components/shared';
import { useKeyboard, EDITOR_SHORTCUTS } from '@/hooks/useKeyboard';
import { useHistory } from '@/hooks/useHistory';

export function CharacterTab() {
  const { currentSprites, lockedPalette, addSprite, currentIdentity } = useCharacterStore();
  const { generationStatus, setGenerationStatus } = useAppStore();
  const { tool, setTool, hotspotX, hotspotY, hotspotRadius, clearHotspot } = useCanvasStore();
  
  const [showHotspotModal, setShowHotspotModal] = useState(false);
  
  const southSprite = currentSprites.get('S') ?? null;
  
  // Pixel history for undo/redo
  const {
    state: pixels,
    push: pushPixels,
    undo,
    redo,
    canUndo,
    canRedo,
    reset: resetPixels,
  } = useHistory<string[]>(southSprite?.pixels ?? []);
  
  // Keyboard shortcuts
  useKeyboard({
    [EDITOR_SHORTCUTS.UNDO]: undo,
    [EDITOR_SHORTCUTS.REDO]: redo,
    [EDITOR_SHORTCUTS.REDO_ALT]: redo,
    [EDITOR_SHORTCUTS.DRAW]: () => setTool('draw'),
    [EDITOR_SHORTCUTS.ERASE]: () => setTool('erase'),
    [EDITOR_SHORTCUTS.FILL]: () => setTool('fill'),
    [EDITOR_SHORTCUTS.EYEDROPPER]: () => setTool('eyedropper'),
    'h': () => setTool('hotspot'),
  });
  
  const handlePixelsChange = useCallback((newPixels: string[]) => {
    pushPixels(newPixels);
    
    // Update sprite in store
    if (southSprite) {
      const updatedSprite = { ...southSprite, pixels: newPixels };
      addSprite('S', updatedSprite);
    }
  }, [pushPixels, southSprite, addSprite]);
  
  const handleHotspotSelect = useCallback((x: number, y: number, radius: number) => {
    setShowHotspotModal(true);
  }, []);
  
  const handleHotspotEdit = async (instruction: string) => {
    if (!southSprite || !lockedPalette || hotspotX === null || hotspotY === null) return;
    
    setGenerationStatus({ isGenerating: true, progress: 50, stage: 'Applying edit...' });
    
    try {
      const newPixels = await applyHotspotEdit({
        sprite: southSprite,
        hotspotX,
        hotspotY,
        hotspotRadius,
        instruction,
        lockedPalette,
      });
      
      pushPixels(newPixels);
      
      const updatedSprite = { ...southSprite, pixels: newPixels };
      addSprite('S', updatedSprite);
      
      setGenerationStatus({ progress: 100, stage: 'Complete!' });
    } catch (err) {
      setGenerationStatus({ error: String(err) });
    }
  };
  
  // Layout styles
  const containerStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '350px 1fr 280px',
    gap: 'var(--space-4)',
    height: '100%',
    padding: 'var(--space-4)',
    overflow: 'hidden',
  };
  
  const leftPanelStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-4)',
    overflowY: 'auto',
  };
  
  const centerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-3)',
    minHeight: 0,
  };
  
  const canvasAreaStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    gap: 'var(--space-2)',
    minHeight: 0,
  };
  
  const rightPanelStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-4)',
    overflowY: 'auto',
  };
  
  const canvasContainerStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--color-bg-secondary)',
    border: '1px solid var(--color-border-muted)',
    overflow: 'hidden',
  };
  
  const toolbarStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  };
  
  // Create display sprite with current pixels
  const displaySprite = southSprite ? { ...southSprite, pixels } : null;
  
  return (
    <div style={containerStyle}>
      {/* Left Panel */}
      <div style={leftPanelStyle}>
        <CharacterForm />
        <StyleControls />
      </div>
      
      {/* Center - Canvas */}
      <div style={centerStyle}>
        {generationStatus.isGenerating && (
          <Panel>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <div style={{ flex: 1, height: '8px', backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border-muted)' }}>
                <div style={{ width: `${generationStatus.progress}%`, height: '100%', backgroundColor: 'var(--color-text-primary)', transition: 'width 0.3s ease' }} />
              </div>
              <span style={{ fontSize: 'var(--font-size-sm)', whiteSpace: 'nowrap' }}>{generationStatus.stage}</span>
            </div>
          </Panel>
        )}
        
        <div style={toolbarStyle}>
          <ZoomControls />
          <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
            {canUndo && 'Ctrl+Z: Undo'} {canRedo && '| Ctrl+Y: Redo'}
          </div>
        </div>
        
        <div style={canvasAreaStyle}>
          <ToolPalette />
          
          <div style={canvasContainerStyle}>
            <InteractiveCanvas
              sprite={displaySprite}
              onPixelsChange={handlePixelsChange}
              onHotspotSelect={handleHotspotSelect}
              showGrid={true}
            />
          </div>
        </div>
        
        <PaletteDisplay />
      </div>
      
      {/* Right Panel */}
      <div style={rightPanelStyle}>
        <IdentityCard />
      </div>
      
      {/* Hotspot Modal */}
      {showHotspotModal && hotspotX !== null && (
        <HotspotEditModal
          onEdit={handleHotspotEdit}
          onClose={() => {
            setShowHotspotModal(false);
            clearHotspot();
          }}
        />
      )}
    </div>
  );
}
```

**Step 2: Create hooks index**

```typescript
// src/hooks/index.ts
export { useHistory } from './useHistory';
export { useKeyboard, EDITOR_SHORTCUTS } from './useKeyboard';
```

**Step 3: Run and verify**

Run: `npm run dev`

Expected:
- Tool palette on left of canvas
- Zoom controls above canvas
- Can draw/erase pixels
- Can use eyedropper to pick colours
- Can select hotspot and trigger AI edit modal
- Undo/redo works with Ctrl+Z / Ctrl+Y

**Step 4: Commit**

```bash
git add .
git commit -m "feat(character): integrate interactive canvas with editing tools"
```

---

## Task 3.10: Implement Pixel Snapper (CRITICAL - Game Engine Ready)

> **Added via NotebookLM Enhancement Plan (2025-12-20)**

**Problem:** AI models do not naturally understand perfect grid structures. Pixels in the output are often "off-grid" or inconsistent in size. Simple browser-based nearest-neighbor scaling (`imageSmoothingEnabled=false`) does NOT correct sub-pixel misalignments created by the AI's internal rendering.

**The Analogy:** "Relying on simple nearest-neighbor scaling without pixel-snapping is like taking a photo of a brick wall and trying to use it as a 3D model in a game. It might look like a wall, but because the 'bricks' (pixels) aren't perfectly aligned to the game world's grid, your character will constantly 'glitch' or get stuck on the uneven edges."

**Files:**
- Create: `src/utils/pixelSnapper.ts`

**Implementation:**

```typescript
/**
 * Pixel Snapper - Grid Alignment for AI-Generated Pixel Art
 *
 * AI models generate pixels that may be "off-grid" or inconsistent in size.
 * This utility re-maps those pixels to a strict, uniform grid for game engine compatibility.
 */

interface SnapOptions {
  /** Target grid size (e.g., 32 for 32x32 output) */
  targetSize: number;
  /** Color tolerance for consolidation (0-255) */
  colorTolerance?: number;
}

/**
 * Detects the actual pixel size in the AI output by analyzing color cluster boundaries.
 * AI might output at 2.3px, 3.7px, etc. instead of exact integers.
 */
function detectPixelSize(imageData: ImageData): number {
  // Analyze horizontal and vertical color transitions
  // Find the most common distance between color changes
  // This gives us the "logical pixel" size the AI used
  const { width, height, data } = imageData;
  const transitions: number[] = [];

  // Sample horizontal lines
  for (let y = 0; y < height; y += Math.floor(height / 10)) {
    let lastColor = getPixelColor(data, 0, y, width);
    let lastTransition = 0;

    for (let x = 1; x < width; x++) {
      const color = getPixelColor(data, x, y, width);
      if (!colorsMatch(lastColor, color, 10)) {
        if (lastTransition > 0) {
          transitions.push(x - lastTransition);
        }
        lastTransition = x;
        lastColor = color;
      }
    }
  }

  // Find mode of transitions (most common pixel width)
  if (transitions.length === 0) return 1;
  const counts = new Map<number, number>();
  for (const t of transitions) {
    const rounded = Math.round(t);
    counts.set(rounded, (counts.get(rounded) || 0) + 1);
  }

  let maxCount = 0;
  let mode = 1;
  for (const [value, count] of counts) {
    if (count > maxCount) {
      maxCount = count;
      mode = value;
    }
  }

  return Math.max(1, mode);
}

function getPixelColor(data: Uint8ClampedArray, x: number, y: number, width: number): [number, number, number, number] {
  const i = (y * width + x) * 4;
  return [data[i], data[i + 1], data[i + 2], data[i + 3]];
}

function colorsMatch(a: [number, number, number, number], b: [number, number, number, number], tolerance: number): boolean {
  return Math.abs(a[0] - b[0]) <= tolerance &&
         Math.abs(a[1] - b[1]) <= tolerance &&
         Math.abs(a[2] - b[2]) <= tolerance &&
         Math.abs(a[3] - b[3]) <= tolerance;
}

/**
 * Snaps an AI-generated image to a strict pixel grid.
 *
 * @param source - The AI output ImageData
 * @param options - Snapping options including target grid size
 * @returns New ImageData with pixels aligned to exact grid
 */
export function snapToGrid(source: ImageData, options: SnapOptions): ImageData {
  const { targetSize, colorTolerance = 20 } = options;
  const detectedPixelSize = detectPixelSize(source);

  const output = new ImageData(targetSize, targetSize);

  // For each target pixel, sample the source region and vote on color
  for (let y = 0; y < targetSize; y++) {
    for (let x = 0; x < targetSize; x++) {
      // Map target pixel to source region
      const sourceX = (x / targetSize) * source.width;
      const sourceY = (y / targetSize) * source.height;

      // Sample a region around this point based on detected pixel size
      const color = sampleWithVoting(source, sourceX, sourceY, detectedPixelSize, colorTolerance);

      // Set output pixel
      const i = (y * targetSize + x) * 4;
      output.data[i] = color[0];
      output.data[i + 1] = color[1];
      output.data[i + 2] = color[2];
      output.data[i + 3] = color[3];
    }
  }

  return output;
}

function sampleWithVoting(
  source: ImageData,
  centerX: number,
  centerY: number,
  sampleSize: number,
  tolerance: number
): [number, number, number, number] {
  const { width, height, data } = source;
  const half = Math.floor(sampleSize / 2);

  // Collect colors in the sample region
  const colorVotes = new Map<string, { color: [number, number, number, number]; count: number }>();

  for (let dy = -half; dy <= half; dy++) {
    for (let dx = -half; dx <= half; dx++) {
      const sx = Math.min(width - 1, Math.max(0, Math.floor(centerX + dx)));
      const sy = Math.min(height - 1, Math.max(0, Math.floor(centerY + dy)));
      const color = getPixelColor(data, sx, sy, width);

      // Quantize color for voting
      const key = `${Math.round(color[0] / tolerance) * tolerance},${Math.round(color[1] / tolerance) * tolerance},${Math.round(color[2] / tolerance) * tolerance},${color[3]}`;

      const existing = colorVotes.get(key);
      if (existing) {
        existing.count++;
      } else {
        colorVotes.set(key, { color, count: 1 });
      }
    }
  }

  // Return the most voted color
  let maxVotes = 0;
  let winner: [number, number, number, number] = [0, 0, 0, 0];

  for (const { color, count } of colorVotes.values()) {
    if (count > maxVotes) {
      maxVotes = count;
      winner = color;
    }
  }

  return winner;
}
```

**Integration with Sprite Generation:**

```typescript
// In pngToPixelArray or after receiving Gemini output:
import { snapToGrid } from './pixelSnapper';

// After getting raw AI output:
const rawImageData = ctx.getImageData(0, 0, width, height);
const snappedImageData = snapToGrid(rawImageData, { targetSize: canvasSize });

// Then continue with pixel extraction from snappedImageData
```

**UI Addition:**
- Add toggle in StyleSelector: "Snap to Grid" (default: on)
- When disabled, use raw AI output for artistic freedom

**Why This Matters:**
This is the difference between "looks nice in browser" and "works in Unity/Godot/GameMaker". Game engines expect exact pixel grids. Without snapping, sprites appear blurry, jittery, or misaligned when rendered at different scales.

---

## Task 3.11: Ensure Hotspot Edit Uses Flash Model

> **Added via NotebookLM Enhancement Plan (2025-12-20)**

**File:** `src/services/gemini/editing.ts`

**Verification:** The model router was updated to route `edit-localised` tasks to Flash model. Ensure the editing service calls `getConfigForTask('edit-localised')` to get the Flash model.

**Why:** Flash is optimized for inpainting and editing operations. Using Pro for small hotspot edits wastes compute and may produce worse results.

---

## Phase 3 Complete

At this point you have:
- ✅ Undo/redo history system
- ✅ Keyboard shortcuts
- ✅ Zoom controls with scroll wheel support
- ✅ Tool palette (draw, erase, fill, eyedropper, hotspot)
- ✅ Interactive canvas with pixel editing
- ✅ Hotspot selection for targeted AI edits
- ✅ Hotspot edit modal with radius control
- ✅ AI-powered localised editing service
- ✅ Pixel Snapper for game engine compatibility (NotebookLM)
- ✅ Correct model routing for editing tasks (NotebookLM)

**Next Phase:** 3D preview and 8-direction sprite sheet generation

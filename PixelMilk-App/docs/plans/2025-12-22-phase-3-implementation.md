# Phase 3 Implementation Plan - Canvas & Editing Tools

**Created:** 2025-12-22
**Status:** Ready for Implementation
**Prerequisites:** Phase 2 Complete (verified)

---

## Overview

Phase 3 transforms the read-only SpriteCanvas into a full pixel editing environment with:
- Drawing tools (pencil, eraser, fill, eyedropper)
- Undo/redo history
- Keyboard shortcuts
- AI-powered hotspot editing (click-to-edit with Gemini)
- Pixel snapping for game engine compatibility

---

## Implementation Tasks

### Task 3.1: Create Hooks Directory and useHistory Hook

**Files to create:**
- `src/hooks/useHistory.ts`
- `src/hooks/index.ts`

**Purpose:** Undo/redo system for pixel editing (max 50 history states)

**Key Functions:**
- `push(newState)` - Add new state to history
- `undo()` - Restore previous state
- `redo()` - Restore next state
- `reset(state)` - Clear history and set new initial state

---

### Task 3.2: Create useKeyboard Hook

**Files to create:**
- `src/hooks/useKeyboard.ts`
- Update `src/hooks/index.ts`

**Shortcuts to implement:**
| Key | Action |
|-----|--------|
| Ctrl+Z | Undo |
| Ctrl+Y / Ctrl+Shift+Z | Redo |
| D | Draw tool |
| E | Erase tool |
| F | Fill tool |
| I | Eyedropper |
| H | Hotspot tool |
| V | Select tool |
| = | Zoom in |
| - | Zoom out |
| 0 | Reset zoom |

---

### Task 3.3: Extend Canvas Store for Editing

**File to update:** `src/stores/canvasStore.ts`

**New state properties:**
```typescript
// Hotspot selection
hotspotX: number | null;
hotspotY: number | null;
hotspotRadius: number;

// Drawing state
isDrawing: boolean;
```

**New actions:**
```typescript
setHotspot: (x: number | null, y: number | null) => void;
setHotspotRadius: (radius: number) => void;
clearHotspot: () => void;
setIsDrawing: (isDrawing: boolean) => void;
```

---

### Task 3.4: Create ZoomControls Component

**File to create:** `src/components/canvas/ZoomControls.tsx`

**Features:**
- Zoom in/out buttons
- Zoom percentage display
- Reset zoom button
- Zoom levels: 0.5x, 1x, 2x, 4x, 8x, 16x, 32x

---

### Task 3.5: Create ToolPalette Component

**File to create:** `src/components/canvas/ToolPalette.tsx`

**Tools:**
| Tool | Icon | Shortcut | Behavior |
|------|------|----------|----------|
| Select | MousePointer | V | No-op (future selection) |
| Draw | Pencil | D | Paint with selectedColor |
| Erase | Eraser | E | Set pixels to transparent |
| Fill | PaintBucket | F | Flood fill |
| Eyedropper | Pipette | I | Pick color from canvas |
| Hotspot | Target | H | Select area for AI edit |

**Brush size slider** for draw/erase (1-8px)

---

### Task 3.6: Create InteractiveCanvas Component

**File to create:** `src/components/canvas/InteractiveCanvas.tsx`

**Features:**
- Mouse handlers for drawing (mousedown, mousemove, mouseup)
- Wheel zoom (scroll to zoom)
- Screen-to-pixel coordinate conversion
- Brush size support (square brush)
- Flood fill algorithm
- Hotspot highlight rendering (dashed red box)
- Real-time pixel updates

**Props:**
```typescript
interface InteractiveCanvasProps {
  sprite: SpriteData | null;
  onPixelsChange?: (pixels: string[]) => void;
  onHotspotSelect?: (x: number, y: number, radius: number) => void;
  showGrid?: boolean;
}
```

---

### Task 3.7: Create HotspotEditModal Component

**File to create:** `src/components/canvas/HotspotEditModal.tsx`

**Features:**
- Display selected hotspot coordinates
- Radius adjustment slider (1-8px)
- Text input for edit instruction
- "Apply Edit" button triggers AI
- Loading state during generation

---

### Task 3.8: Create Hotspot Edit Service

**File to create:** `src/services/gemini/editing.ts`

**Function:** `applyHotspotEdit(params)`

**Algorithm:**
1. Extract affected pixel region based on hotspot + radius
2. Send region pixels + instruction + locked palette to Gemini
3. Receive new pixel values (JSON array)
4. Merge modified region back into full sprite
5. Return updated pixels array

**Model:** Uses `gemini-2.5-flash-image` (fast editing model)

---

### Task 3.9: Create Pixel Snapper Utility

**File to create:** `src/utils/pixelSnapper.ts`

**Purpose:** AI models generate "off-grid" pixels. This utility re-maps to strict grid for game engine compatibility.

**Algorithm:**
1. Detect actual pixel size in AI output (may be 2.3px, 3.7px, etc.)
2. For each target pixel, sample source region
3. Use color voting to determine dominant color
4. Output clean grid-aligned ImageData

**Integration point:** After pngToPixelArray, before validateAndSnapPixelData

---

### Task 3.10: Update Canvas Index Exports

**File to update:** `src/components/canvas/index.ts`

```typescript
export { SpriteCanvas } from './SpriteCanvas';
export { InteractiveCanvas } from './InteractiveCanvas';
export { ZoomControls } from './ZoomControls';
export { ToolPalette } from './ToolPalette';
export { HotspotEditModal } from './HotspotEditModal';
```

---

### Task 3.11: Update Gemini Service Index

**File to update:** `src/services/gemini/index.ts`

Add export for `applyHotspotEdit` from `editing.ts`

---

### Task 3.12: Create Canvas Editor Layout Component

**File to create:** `src/components/canvas/CanvasEditor.tsx`

**Purpose:** Composable editor layout that wraps:
- ToolPalette (left)
- InteractiveCanvas (center)
- ZoomControls (top)
- HotspotEditModal (modal overlay)

**Features:**
- Manages local pixel state with useHistory
- Keyboard shortcuts via useKeyboard
- Connects to characterStore for sprite data
- Handles hotspot edit flow

---

### Task 3.13: Integrate Canvas Editor into CharacterTab

**File to update:** `src/components/character/CharacterTab.tsx`

**Changes:**
- Replace read-only SpriteCanvas with CanvasEditor when a sprite exists
- Keep SpriteCanvas for loading/empty states
- Connect pixel changes back to characterStore

---

## Implementation Order

```
1. useHistory hook
2. useKeyboard hook
3. Extend canvasStore
4. ZoomControls component
5. ToolPalette component
6. InteractiveCanvas component
7. HotspotEditModal component
8. editing.ts service
9. pixelSnapper.ts utility
10. Update exports
11. CanvasEditor layout
12. Integrate into CharacterTab
13. Test full workflow
```

---

## Testing Checklist

- [ ] Draw pixels with pencil tool
- [ ] Erase pixels
- [ ] Fill tool flood fills connected regions
- [ ] Eyedropper picks color from canvas
- [ ] Undo reverts last action
- [ ] Redo restores undone action
- [ ] Keyboard shortcuts work (D, E, F, I, H, Ctrl+Z, Ctrl+Y)
- [ ] Zoom in/out with buttons and scroll wheel
- [ ] Hotspot selection shows red dashed box
- [ ] Hotspot edit modal opens on selection
- [ ] AI edit modifies selected region only
- [ ] Palette remains locked after edits
- [ ] Pixel snapper produces clean grid output

---

## Dependencies

No new npm packages required. Uses existing:
- `zustand` for state
- `@google/genai` for AI edits
- `lucide-react` for icons

---

## Notes

1. **Flash for Editing:** The editing service MUST use `gemini-2.5-flash-image`, not Pro. Flash is optimized for inpainting/editing operations.

2. **Palette Enforcement:** Like sprite generation, don't pass locked palette to Gemini prompt (causes dithering). Apply `validateAndSnapPixelData` after receiving response.

3. **Performance:** InteractiveCanvas uses requestAnimationFrame for smooth drawing. Avoid re-rendering entire component on each pixel change.

4. **Mobile:** ToolPalette collapses to bottom bar on mobile. Touch events not in scope for Phase 3.

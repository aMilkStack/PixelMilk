# Phase 8: Compose Tab

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Assemble scenes by dragging assets together with AI-assisted perspective matching and shadow generation.

**Architecture:** Scene canvas with layer system, asset picker, and AI compositing for coherent scenes.

**Prerequisites:** Phase 7 complete

**Key Reference:** `C:\Users\User\Desktop\PixelMilk\Resources and Guides\home-canvas\`

---

## Core Concepts

### Layer System
Scenes are composed of layers:
- Background layer (tileable textures)
- Ground layer (tiles)
- Object layers (multiple, z-ordered)
- Character layer
- Foreground layer (overlays)

### Asset Placement
Drag assets from Library into scene:
1. Select asset from picker
2. Drop onto canvas
3. Position and scale
4. AI adjusts lighting/shadows to match scene

### Scene Context
Scene has overall context that affects compositing:
- Time of day (lighting direction)
- Environment type (indoor/outdoor)
- Mood (bright/dark/neutral)

### AI Compositing
When placing assets, AI can:
- Generate matching shadows
- Adjust lighting consistency
- Blend edges with environment
- Suggest complementary assets

---

## Tasks Overview

### Task 8.1: Create Compose Store
```typescript
interface ComposeState {
  sceneLayers: Layer[];
  selectedLayerId: string | null;
  sceneContext: SceneContext;
  canvasSize: { width: number; height: number };
  
  addLayer: (layer: Layer) => void;
  removeLayer: (id: string) => void;
  updateLayer: (id: string, updates: Partial<Layer>) => void;
  reorderLayers: (fromIndex: number, toIndex: number) => void;
}

interface Layer {
  id: string;
  type: 'background' | 'tile' | 'object' | 'character';
  assetId: string;
  position: { x: number; y: number };
  scale: number;
  rotation: number;
  zIndex: number;
  visible: boolean;
}

interface SceneContext {
  timeOfDay: 'morning' | 'noon' | 'evening' | 'night';
  environment: 'indoor' | 'outdoor';
  lightDirection: { x: number; y: number };
}
```

### Task 8.2: Create Scene Canvas Component
Large canvas showing composed scene with:
- Layer rendering in z-order
- Selection handles for positioned assets
- Drag to reposition
- Scroll wheel to scale

### Task 8.3: Create Asset Picker Panel
Shows assets from Library filtered by type:
- Tab per asset type (Character, Tile, Object, Texture)
- Thumbnails with drag capability
- Search/filter

### Task 8.4: Create Layer Panel
Shows layer stack:
- Visibility toggle
- Lock toggle
- Drag to reorder
- Delete button
- Layer name

### Task 8.5: Create Scene Context Controls
Panel for scene-wide settings:
- Time of day selector
- Environment type
- Light direction (circular picker)
- Background colour

### Task 8.6: Create AI Compositing Service
```typescript
// src/services/gemini/compositing.ts

export async function generateShadowForAsset(
  asset: SpriteData,
  sceneContext: SceneContext
): Promise<SpriteData>

export async function adjustAssetLighting(
  asset: SpriteData,
  sceneContext: SceneContext,
  lockedPalette: string[]
): Promise<SpriteData>

export async function suggestComplementaryAssets(
  currentAssets: string[],
  sceneContext: SceneContext
): Promise<string[]>
```

### Task 8.7: Create Compose Tab Layout
```
┌─────────────────────────────────────────────────────────────┐
│ [Asset Picker - Scrollable Thumbnails]                      │
├─────────────────────────────────────────────────────────────┤
│                                        │ [Layer Panel]      │
│     [Scene Canvas - Main Area]         │ - Background       │
│                                        │ - Ground           │
│                                        │ - Character        │
│                                        │ - Objects...       │
├─────────────────────────────────────────────────────────────┤
│ [Scene Context: Time ▾] [Environment ▾] [Light Direction]   │
└─────────────────────────────────────────────────────────────┘
```

### Task 8.8: Create Scene Export
Export options:
- Full scene as PNG
- Individual layers
- Scene JSON (for reloading)

---

## Phase 8 Complete

Deliverables:
- ✅ Compose store with layer management
- ✅ Scene canvas with drag/drop/scale
- ✅ Asset picker panel
- ✅ Layer panel with reordering
- ✅ Scene context controls
- ✅ AI compositing for shadows/lighting
- ✅ Scene export

**Next Phase:** Library Tab

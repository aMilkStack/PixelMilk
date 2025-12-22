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

## Task 8.9: Semantic Red Dot Placement

> **Added via NotebookLM Enhancement Plan (2025-12-20)**

**Problem:** Simple drag-and-drop placement ignores 3D perspective and scene context. When placing a character in a scene, users often want them anchored to a specific ground point or interacting with specific objects.

**The Oversight:** Reference implementations (specifically Home-Canvas) use a "red dot" technique where the user marks the image at a specific coordinate, and AI uses that semantic location to logically anchor the sprite.

**Implementation:**

**Step 1: Add placement mode to ComposeState**

```typescript
interface ComposeState {
  // ... existing
  placementMode: 'drag' | 'semantic';
  pendingPlacement?: {
    assetId: string;
    targetCoords?: { x: number; y: number };
  };
}
```

**Step 2: Create SemanticPlacementFlow component**

When user selects an asset and chooses "Semantic Placement":
1. User clicks on scene canvas to place a red target dot
2. System captures the clicked coordinates
3. User describes the placement intent (e.g., "standing behind the table", "sitting on the chair")
4. AI generates the asset positioned at that coordinate, adjusted for perspective and lighting

```typescript
// src/services/gemini/compositing.ts

export async function semanticPlaceAsset(
  asset: SpriteData,
  sceneImage: string,           // Current scene as base64
  targetCoords: { x: number; y: number },
  placementDescription: string, // "standing behind the table"
  sceneContext: SceneContext
): Promise<{
  positionedAsset: SpriteData;
  adjustedScale: number;
  suggestedZIndex: number;
}> {
  const client = getClient();

  // Mark the scene with a red dot at target coords
  const markedScene = await overlayRedDot(sceneImage, targetCoords);

  const prompt = `
IMAGE 1: Scene with a red dot marking the target placement location.
IMAGE 2: Asset sprite to place in the scene.

PLACEMENT INTENT: ${placementDescription}

Place the asset at the red dot location. Adjust:
1. Scale to match scene perspective (objects further back = smaller)
2. Lighting to match scene context (${sceneContext.timeOfDay}, light from ${sceneContext.lightDirection})
3. Shadow appropriate to ground plane
4. Suggest z-index for correct layering (behind/in front of existing objects)

Output the adjusted asset sprite.
`;

  // Prepare both images with white backgrounds
  const preparedScene = await prepareCanvasForGemini(markedScene);
  const preparedAsset = await prepareCanvasForGemini(assetToBase64(asset));

  const response = await client.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: {
      parts: [
        { inlineData: { mimeType: 'image/png', data: preparedScene } },
        { inlineData: { mimeType: 'image/png', data: preparedAsset } },
        { text: prompt },
      ],
    },
    config: {
      responseModalities: [Modality.IMAGE],
    },
  });

  // Extract positioned asset from response
  // ...
}

async function overlayRedDot(
  sceneBase64: string,
  coords: { x: number; y: number }
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;

      ctx.drawImage(img, 0, 0);

      // Draw red target dot
      ctx.fillStyle = '#FF0000';
      ctx.beginPath();
      ctx.arc(coords.x, coords.y, 5, 0, Math.PI * 2);
      ctx.fill();

      // Optional: draw crosshair
      ctx.strokeStyle = '#FF0000';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(coords.x - 10, coords.y);
      ctx.lineTo(coords.x + 10, coords.y);
      ctx.moveTo(coords.x, coords.y - 10);
      ctx.lineTo(coords.x, coords.y + 10);
      ctx.stroke();

      resolve(canvas.toDataURL('image/png').split(',')[1]);
    };
    img.src = `data:image/png;base64,${sceneBase64}`;
  });
}
```

**Step 3: UI Integration**

Add to Scene Canvas:
- Toggle between "Drag Placement" and "Semantic Placement" modes
- When in semantic mode, clicking canvas places the red dot
- Show placement description input modal after dot placement
- Preview the AI-adjusted result before confirming

**Why This Matters:**
Simple drag-drop treats sprites as flat cutouts. Semantic placement with the red dot technique allows the AI to understand the 3D context of the scene and position assets with proper perspective, scale, and integration.

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
- ✅ Semantic Red Dot placement (NotebookLM)

**Next Phase:** Library Tab

# Phase 7: Texture Tab

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create seamless materials and patterns for surfaces - wood grain, stone, fabric, etc.

**Architecture:** Texture tab with material presets, seamless generation, and tiling preview.

**Prerequisites:** Phase 6 complete

---

## Core Concepts

### Material Types
Predefined material categories with sensible defaults:
- **Wood**: Grain direction, knots, colour variation
- **Stone**: Crack patterns, colour variation, roughness
- **Metal**: Reflections, scratches, patina
- **Fabric**: Weave pattern, folds, texture
- **Organic**: Leaves, bark, grass detail

### Seamless Requirements
All textures must tile seamlessly. Generation process:
1. Generate base texture
2. Verify edge matching
3. Regenerate if edges don't match

### Scale Consistency
Textures should work at consistent scales:
- Fine detail for close-up surfaces
- Coarse patterns for distant backgrounds

---

## Tasks Overview

### Task 7.1: Create Texture Store
```typescript
interface TextureState {
  currentTexture: SpriteData | null;
  materialType: 'wood' | 'stone' | 'metal' | 'fabric' | 'organic' | 'custom';
  seamless: boolean;
  scale: 'fine' | 'medium' | 'coarse';
  // ... actions
}
```

### Task 7.2: Create Texture Generation Service
```typescript
// src/services/gemini/textures.ts

export async function generateTexture(
  description: string,
  materialType: string,
  size: number,
  scale: 'fine' | 'medium' | 'coarse'
): Promise<SpriteData>

export async function ensureSeamless(
  texture: SpriteData
): Promise<SpriteData>
```

### Task 7.3: Create Material Presets
Dropdown with common materials:
- Oak wood, Pine wood, Birch wood
- Cobblestone, Brick, Marble
- Iron, Gold, Bronze
- Linen, Leather, Silk
- Grass, Leaves, Bark

### Task 7.4: Create Tiling Preview Component
Shows texture repeated in 4x4 grid at actual scale.

### Task 7.5: Create Texture Tab Layout
```
┌─────────────────────────────────────────────────────────────┐
│ [Material Preset ▾]              │ [4x4 Tiling Preview]     │
│ [Custom Description]             │                          │
│ [Scale: Fine/Medium/Coarse]      │                          │
│ [Seamless ✓]                     │                          │
│ [Generate]                       │                          │
└─────────────────────────────────────────────────────────────┘
```

---

## Texture Prompts

### Wood Texture
```
Generate a seamless ${size}x${size} pixel art wood texture.

WOOD TYPE: ${woodType}
SCALE: ${scale} - ${scale === 'fine' ? 'Close-up grain detail' : scale === 'coarse' ? 'Distant plank pattern' : 'Standard wood texture'}
GRAIN DIRECTION: Horizontal

Include:
- Natural colour variation
- ${scale === 'fine' ? 'Visible grain lines' : 'Suggested wood pattern'}
- Occasional knot or imperfection

Edges must tile seamlessly in all directions.
```

### Stone Texture
```
Generate a seamless ${size}x${size} pixel art stone texture.

STONE TYPE: ${stoneType}
SCALE: ${scale}

Include:
- Natural colour variation (2-3 stone shades)
- ${scale === 'fine' ? 'Surface detail and small cracks' : 'Overall stone pattern'}
- Slight shadows between stones if cobblestone

Edges must tile seamlessly in all directions.
```

---

## Phase 7 Complete

Deliverables:
- ✅ Texture store with material type and scale
- ✅ Texture generation service with seamless check
- ✅ Material presets dropdown
- ✅ Tiling preview component
- ✅ Texture tab layout
- ✅ Export as seamless PNG

**Next Phase:** Compose Tab

# Phase 6: Object Tab

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create props and items with recontextualisation support - same object shown in different contexts/lighting.

**Architecture:** Object tab with description input, context selector, and recontextualisation preview.

**Prerequisites:** Phase 5 complete

---

## Core Concepts

### Recontextualisation
Same object rendered for different game contexts:
- Inventory icon (flat, centered, no shadow)
- World sprite (perspective, shadow, environment lighting)
- UI element (simplified, high contrast)
- Pickup (slight glow, attention-drawing)

### Object Identity
Like characters, objects have identity documents:
```typescript
interface ObjectIdentity {
  id: string;
  name: string;
  description: string;
  category: 'weapon' | 'consumable' | 'key' | 'furniture' | 'decoration';
  material: string;        // 'metal', 'wood', 'glass', 'organic'
  colourPalette: string[];
  createdAt: number;
}
```

---

## Tasks Overview

### Task 6.1: Create Object Store
```typescript
interface ObjectState {
  currentObject: ObjectAsset | null;
  contextMode: 'inventory' | 'world' | 'ui' | 'pickup';
  // ... actions
}
```

### Task 6.2: Create Object Generation Service
```typescript
// src/services/gemini/objects.ts

export async function generateObjectIdentity(
  description: string
): Promise<ObjectIdentity>

export async function generateObjectSprite(
  identity: ObjectIdentity,
  context: 'inventory' | 'world' | 'ui' | 'pickup'
): Promise<SpriteData>

export async function recontextualiseObject(
  sprite: SpriteData,
  fromContext: string,
  toContext: string,
  lockedPalette: string[]
): Promise<SpriteData>
```

### Task 6.3: Create Context Preview Component
Shows same object in all 4 contexts side-by-side.

### Task 6.4: Create Object Tab Layout
```
┌─────────────────────────────────────────────────────────────┐
│ [Description Input]              │ [Main Preview]           │
│ [Category Selector]              │                          │
│ [Material Dropdown]              │ [Context Thumbnails]     │
│ [Generate]                       │ [Inventory][World][UI]   │
└─────────────────────────────────────────────────────────────┘
```

---

## Context Prompts

### Inventory Context
```
Generate an inventory icon for this object.

OBJECT: ${name}
SIZE: ${size}x${size}
STYLE: Flat presentation, centered, no shadow, clean edges
PURPOSE: Small UI element in inventory grid

The icon should be instantly recognisable at small sizes.
```

### World Context
```
Generate a world sprite for this object.

OBJECT: ${name}
SIZE: ${size}x${size}
STYLE: Slight perspective, cast shadow, environmental lighting
PURPOSE: Object placed on ground in game world

Include subtle shadow on lower-right suggesting light from upper-left.
```

### Pickup Context
```
Generate a pickup sprite for this object.

OBJECT: ${name}
SIZE: ${size}x${size}
STYLE: Slight glow outline, attention-drawing, bouncy feel
PURPOSE: Collectable item that draws player attention

Add 1-pixel highlight outline to make it pop against backgrounds.
```

---

## Phase 6 Complete

Deliverables:
- ✅ Object store with context mode
- ✅ Object generation service with recontextualisation
- ✅ Context preview component
- ✅ Object tab layout
- ✅ Export per context or all contexts

**Next Phase:** Texture Tab

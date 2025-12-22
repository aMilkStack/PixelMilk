# PixelMilk Architecture Document

> **For Claude / Code Assistants:** This document captures all architectural decisions for PixelMilk. Read this FIRST before any implementation work.

## Project Overview

**PixelMilk** is a modular pixel art creation suite with AI-powered generation using Google's Gemini image models. It's designed for game developers and pixel artists who want AI assistance without losing creative control.

**Core Philosophy:**
- AI assists, human creates
- Edit-based workflow (refine, don't regenerate)
- Style consistency through locked palettes and identity documents
- Professional output for game development pipelines

---

## Technical Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Framework | React 19 + TypeScript | Modern, type-safe, component-based |
| Build | Vite | Fast dev server, good defaults |
| State | Zustand | Simple, no boilerplate, good DevTools |
| Storage | IndexedDB (via idb) | Persist assets locally, no backend needed |
| AI | @google/genai (Gemini API) | Native image generation, structured output |
| 3D Preview | Three.js + React Three Fiber | Turntable preview for multi-angle sprites |
| Icons | Lucide React | Clean, consistent iconography |
| Styling | CSS Variables + Inline Styles | No build step for CSS, full control |

**Deployment:** Frontend-only. Users provide their own Gemini API key. No backend required.

---

## Visual Design System

### Colour Palette

```css
/* Core palette - deep pub green / mint terminal aesthetic */
--color-bg-primary: #021a1a;      /* Darkest background */
--color-bg-secondary: #032828;    /* Panel backgrounds */
--color-bg-tertiary: #043636;     /* Elevated surfaces */

--color-text-primary: #8bd0ba;    /* Main text - mint */
--color-text-secondary: #6ba89a;  /* Secondary text */
--color-text-muted: #4a7a6e;      /* Disabled/hint text */

--color-accent-red: #f04e4e;      /* Errors, destructive actions */
--color-accent-beige: #d8c8b8;    /* Highlights, hover states */

--color-border: #8bd0ba;          /* Active borders */
--color-border-muted: #4a7a6e;    /* Subtle borders */
```

### Typography

```css
--font-display: 'Playfair Display', Georgia, serif;  /* Headings */
--font-mono: 'VT323', 'Courier New', monospace;      /* Everything else */
```

### Design Rules

1. **NO rounded corners** - Everything is sharp, pixel-perfect
2. **NO gradients** - Flat colours only
3. **Shadows** - TBD; currently used in some components for depth, may be revised
4. **Terminal aesthetic** - Prompts start with `>`, errors with `!`
5. **Subtle grid background** - 20px grid pattern on body
6. **Monospace everywhere** - Except display headings

---

## Application Structure

### Tab System

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ ðŸ¥› PixelMilk                                    [Connected âš™]â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ [Character] [Tile] [Object] [Texture] [Compose] [Library]    â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚                                                              â”‚
â”‚                      Tab Content Area                        â”‚
â”‚                                                              â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

| Tab | Purpose | Primary Operations |
|-----|---------|-------------------|
| **Character** | Sprites with identity | Textâ†’sprite, sketchâ†’sprite, rotations, animations |
| **Tile** | Tileset creation | Seamless tiles, variants, autotile rules |
| **Object** | Props and items | Objects with interaction sounds, recontextualisation |
| **Texture** | Materials/patterns | Seamless textures, material properties |
| **Compose** | Scene assembly | Drag sprites into scenes, perspective matching |
| **Library** | Asset management | Search, filter, export, bulk operations |

### Directory Structure

```
src/
â”œâ”€â”€ components/
â”‚   â”œâ”€â”€ shared/           # Button, Input, Select, Panel, Tooltip
â”‚   â”œâ”€â”€ layout/           # AppShell, TabBar, ApiKeyModal
â”‚   â”œâ”€â”€ canvas/           # PixelCanvas, ZoomControls, ToolPalette
â”‚   â”œâ”€â”€ character/        # CharacterForm, IdentityCard, SpriteSheet
â”‚   â”œâ”€â”€ tile/             # TileEditor, SeamlessPreview, AutotileRules
â”‚   â”œâ”€â”€ object/           # ObjectEditor, ContextPicker
â”‚   â”œâ”€â”€ texture/          # TextureEditor, TilingPreview
â”‚   â”œâ”€â”€ compose/          # SceneCanvas, LayerPanel, AssetPicker
â”‚   â””â”€â”€ library/          # AssetGrid, FilterPanel, ExportModal
â”œâ”€â”€ services/
â”‚   â”œâ”€â”€ gemini/           # client.ts, modelRouter.ts, schemas.ts
â”‚   â””â”€â”€ storage/          # db.ts, assets.ts, settings.ts
â”œâ”€â”€ stores/               # appStore.ts, canvasStore.ts, assetStore.ts
â”œâ”€â”€ hooks/                # useGemini.ts, useCanvas.ts, useKeyboard.ts
â”œâ”€â”€ types/                # index.ts, gemini.ts, assets.ts, ui.ts
â”œâ”€â”€ utils/                # paletteGovernor.ts, imageUtils.ts, exportUtils.ts
â””â”€â”€ styles/               # global.css, variables.css
```

---

## Gemini Model Routing Strategy

### Available Models

| Model | Use Case | Cost | Speed |
|-------|----------|------|-------|
| `gemini-2.5-flash-image` | Fast iteration, drafts, tiles, textures | $ | Fast |
| `gemini-3-pro-image-preview` | Final quality, complex composition, perspective | $$$ | Slower |
| `gemini-2.5-flash` | Text analysis, tooltips | $ | Fast |
| `gemini-3-flash-preview` | Prompt optimization, coaching | $$ | Medium |

### Routing Rules

```typescript
function getModelForTask(task: TaskType, quality: QualityMode): GeminiModel {
  // Always fast (volume-based operations)
  if (['tile', 'texture', 'animation-frame', 'edit-localised'].includes(task)) {
    return 'gemini-2.5-flash-image';
  }
  
  // Always quality (complex reasoning required)
  if (['perspective-shift', 'style-transfer', 'composite'].includes(task)) {
    return 'gemini-3-pro-image-preview';
  }
  
  // Quality-dependent
  if (task === 'sprite-final' && quality === 'final') {
    return 'gemini-3-pro-image-preview';
  }
  
  return 'gemini-2.5-flash-image';
}
```

### Cost Mitigation Strategies

1. **Implicit Caching** - Keep system prompts at START of every request (Gemini caches identical prefixes)
2. **Media Resolution Control** - Use LOW for previews, HIGH for finals
3. **Thinking Level Control** - Set to 'low' for simple tasks on Pro model
4. **Draft/Final Toggle** - Let users choose when to use expensive model

---

## Core Concepts

### Character Identity Document

Every character has a structured identity that ensures consistency across all generated sprites:

```typescript
interface CharacterIdentity {
  id: string;
  name: string;
  description: string;                    // Original user prompt
  physicalDescription: {
    bodyType: string;                     // "muscular", "slim", "round"
    heightStyle: string;                  // "tall", "short", "chibi"
    silhouette: string;                   // Distinctive outline description
  };
  colourPalette: {
    primary: string;                      // Main colour (hex)
    secondary: string;
    accent: string;
    skin: string;
    hair: string;
    outline: string;
  };
  distinctiveFeatures: string[];          // ["scar on left eye", "blue cape"]
  styleParameters: StyleParameters;
  angleNotes: Record<Direction, string>;  // Per-angle visibility notes
  createdAt: number;
  updatedAt: number;
}
```

### Style Parameters

Shared across all asset types:

```typescript
interface StyleParameters {
  outlineStyle: 'black' | 'colored' | 'selective' | 'lineless';
  shadingStyle: 'flat' | 'basic' | 'detailed';
  detailLevel: 'low' | 'medium' | 'high';
  canvasSize: 16 | 32 | 64 | 128;
  paletteMode: 'auto' | 'nes' | 'gameboy' | 'pico8' | 'custom';
  viewType: 'standard' | 'isometric';
}
```

### Palette Locking

Gemini outputs PNG images. Immediately after generation, the client converts the PNG to a pixel array (canvas drawImage + getImageData with nearest-neighbor scaling) and extracts a palette from the pixels. Once a sprite is generated, its palette is locked. All subsequent operations (rotations, animations, edits) must use ONLY colours from the locked palette. This ensures visual consistency. Conversion is implemented in imageUtils.ts (pngToPixelArray) before paletteGovernor is applied.

```typescript
// In paletteGovernor.ts
function validateAndSnapPixelData(data: PixelData, lockedPalette?: string[]): PixelData {
  if (!lockedPalette) return data;
  
  // Snap any out-of-palette colours to nearest palette colour
  data.pixels = data.pixels.map(pixel => {
    if (pixel === 'transparent') return pixel;
    return findNearestPaletteColor(pixel, lockedPalette);
  });
  
  return data;
}
```

---

## Key Workflows

### Text â†’ Sprite (Character Tab)

```
1. User enters description: "A knight with blue armor and a red cape"
2. [Optional] User adjusts style parameters
3. Click "Generate"
4. System generates CharacterIdentity (structured JSON via Gemini text model)
5. System generates South-facing sprite as PNG (image model)
6. Client converts PNG to pixel array and extracts palette
7. Palette is locked from extracted palette
8. User can then generate other directions using locked palette
```

### Sketch â†’ Sprite (Co-Drawing)

```
1. User draws rough sketch on canvas
2. User describes what they want: "Make this into a wizard"
3. System sends sketch + description to Gemini
4. Gemini generates refined sprite maintaining sketch structure
5. User can iterate with further edits
```

### Hotspot Editing (PixShop-style)

```
1. User clicks on specific area of generated sprite
2. Hotspot is highlighted
3. User types modification: "make this part gold instead of silver"
4. System generates localised edit
5. Only affected area changes, rest preserved
```

### 8-Direction Sprite Sheet

```
1. User generates or imports South-facing sprite
2. Click "Generate Rotations"
3. System generates 3D reference (low-poly turntable)
4. For each direction (N, E, W, NE, NW, SE, SW):
   - Render 3D reference at that angle
   - Generate sprite using reference + locked palette + identity
5. All 8 sprites assembled into sprite sheet
```

---

## AI Guidance System

### Prompt Wand

Enhances user prompts with pixel-art-specific details:

```
User: "a tree"
Enhanced: "A 32x32 pixel art deciduous tree, brown trunk with 
2-3 shading levels, green foliage cluster, selective outline 
on trunk only, transparent background, game asset style"
```

### Drawing Coach

Provides real-time feedback while user draws:

```
"Your outline varies between 1-3 pixels wide. For cleaner 
pixel art, try maintaining consistent 1px outlines."

"Consider adding a highlight colour to the top-left edges 
to suggest a light source."
```

### Contextual Tooltips

Brief hints that appear on hover, explaining pixel art concepts:

```
[Hover over "Selective Outline"]
"Outlines only where needed for readability. Interior 
details use colour boundaries instead of black lines."
```

---

## Data Persistence

### IndexedDB Schema

```typescript
interface PixelMilkDB {
  assets: {
    key: string;           // Asset ID
    value: Asset;          // Full asset object
    indexes: {
      'by-type': string;   // For filtering by asset type
      'by-updated': number; // For recent assets
    };
  };
  settings: {
    key: string;           // Setting name
    value: unknown;        // Setting value
  };
}
```

### What Gets Stored

- **Assets:** All characters, tiles, objects, textures with full sprite data
- **Settings:** API key, default style parameters, UI preferences
- **NOT stored:** Raw PNG responses from Gemini (converted to pixel arrays and discarded).

---

## Export Formats

### Single Sprite
- PNG (with transparency)
- Indexed PNG (palette-limited)

### Sprite Sheet
- Horizontal strip
- Grid (configurable rows/columns)
- With/without metadata JSON

### Character Bundle
```
character_name/
â”œâ”€â”€ sprites/
â”‚   â”œâ”€â”€ idle_S.png
â”‚   â”œâ”€â”€ idle_N.png
â”‚   â”œâ”€â”€ walk_sheet.png
â”‚   â””â”€â”€ ...
â”œâ”€â”€ identity.json       # Character identity document
â””â”€â”€ metadata.json       # Export settings, palette, etc.
```

### Tileset
- Single image with all variants
- Autotile-compatible formats (RPG Maker, Godot, etc.)

---

## Future Considerations (Not in MVP)

### Audio Integration
- ElevenLabs for SFX generation
- Lyria for music
- Per-character sound profiles
- Per-tile ambient sounds

### Backend Version
- Vertex AI for fine-tuned models
- LoRA-trained pixel art SDXL
- ControlNet for sketchâ†’sprite
- User accounts and cloud storage

### Collaboration
- Share character identities
- Community palette presets
- Asset marketplace

---

## Reference Resources

Located in `C:\Users\User\Desktop\PixelMilk\Resources and Guides\`:

| Resource | Path | Use For |
|----------|------|---------|
| Nano Banana Recipes | `generative-ai-main/gemini/nano-banana/` | Gemini image generation patterns |
| Co-Drawing | `gemini-co-drawing/` | Sketch-to-image workflow |
| PixShop | `pixshop/` | Click-to-edit hotspot system |
| Infinimap | `nano-banana-infinimap-main/` | Tile generation, seamless patterns |
| Home Canvas | `home-canvas/` | Scene composition patterns |
| Consistent Imagery | `consistent_imagery_generation.ipynb` | Multi-angle consistency techniques |

---

## Phase Overview

| Phase | Focus | Key Deliverables |
|-------|-------|------------------|
| 1 | Foundation | Project setup, services, shared components, app shell |
| 2 | Character Tab MVP | Textâ†’sprite, identity system, basic editing |
| 3 | Canvas & Tools | Pixel editor, zoom/pan, drawing tools, hotspot editing |
| 4 | Sprite Rotations | 3D preview, 8-direction generation, sprite sheets |
| 5 | Tile Tab | Seamless tiles, variants, autotile support |
| 6 | Object Tab | Props, recontextualisation |
| 7 | Texture Tab | Materials, seamless patterns |
| 8 | Compose Tab | Scene assembly, layer management |
| 9 | Library Tab | Asset management, search, bulk export |
| 10 | AI Guidance | Prompt Wand, Drawing Coach, tooltips |

Each phase has its own detailed plan in `docs/plans/`.



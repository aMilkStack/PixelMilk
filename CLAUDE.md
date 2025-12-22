# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PixelMilk is a modular pixel art creation suite with AI-powered generation using Google's Gemini image models (Nano Banana family). It's a frontend-only React app where users provide their own Gemini API key.

**Core Philosophy:** AI assists, human creates. Edit-based workflow with style consistency through locked palettes and identity documents.

## Commands

```bash
cd PixelMilk-App
npm run dev          # Start Vite dev server
npm run build        # Production build
npm run preview      # Preview production build
```

## Architecture

### Tech Stack
- **Framework:** React 19 + TypeScript + Vite
- **State:** Zustand (stores in `src/stores/`)
- **Storage:** IndexedDB via `idb` library (no backend)
- **AI:** `@google/genai` (Gemini API direct)
- **Styling:** Tailwind CSS 4 + CSS Variables

### Directory Structure
```
PixelMilk-App/src/
├── components/
│   ├── shared/       # Button, Input, Select, Panel
│   ├── layout/       # AppShell, TabBar, ApiKeyModal
│   ├── canvas/       # SpriteCanvas, pixel rendering
│   └── character/    # CharacterTab, IdentityCard, StyleSelector
├── services/
│   ├── gemini/       # client.ts, modelRouter.ts, geminiService.ts, schemas.ts
│   └── storage/      # db.ts, assets.ts, settings.ts, palettes.ts
├── stores/           # appStore.ts, characterStore.ts, canvasStore.ts
├── data/             # lospecPalettes.ts, pixelArtTechniques.ts
├── utils/            # paletteGovernor.ts, imageUtils.ts, normalizeIdentity.ts
└── types.ts          # All TypeScript interfaces
```

## Gemini Model Routing (Critical)

The model router (`src/services/gemini/modelRouter.ts`) assigns models based on task:

| Task Type | Model | Rationale |
|-----------|-------|-----------|
| **Image Generation** (sprites, tiles, textures) | `gemini-3-pro-image-preview` | Uses "Thinking" for anatomy/physics planning |
| **Image Editing** (hotspots, inpainting) | `gemini-2.5-flash-image` | Fast iteration only |
| **Text/JSON** (identity analysis) | `gemini-3-flash-preview` | Structured output |

**Key Insight:** Flash Image is NOT for generation—only for editing. Pro Image uses a "Thinking" phase to plan physics and composition before rendering.

## Core Data Flow

1. **Character Generation:** User description → `generateCharacterIdentity()` → JSON identity document
2. **Sprite Generation:** Identity + direction → `generateSprite()` → PNG base64
3. **PNG to Pixels:** `imageUtils.ts` converts PNG → pixel array via canvas (nearest-neighbor)
4. **Palette Locking:** `paletteGovernor.ts` extracts and enforces palettes post-generation

## Critical Implementation Patterns

### White Background Injection
Transparent backgrounds cause generation errors in Nano Banana. Before sending ANY canvas data to Gemini:
```typescript
// See prepareCanvasForGemini() in imageUtils.ts
// Always add solid #FFFFFF background before base64 encoding
```

### Palette Enforcement
Palette locking happens CLIENT-SIDE after Gemini returns PNG, NOT via prompting. Prompting Gemini to use exact colors causes background dithering issues.

### Multi-Image Prompting (Reference Stacking)
When sending multiple images, ALWAYS use semantic labels:
```
"Image 1: [Style Reference - line weight and color palette]"
"Image 2: [User Input - the character to transform]"
"Apply the style from Image 1 to the character in Image 2"
```
Never assume the model knows which image is which.

### Identity Normalization
All identity fields use camelCase. Raw Gemini responses may vary, so `normalizeIdentity.ts` ensures consistency.

## Master Pixel Artist System Prompt

The system instruction in `geminiService.ts` frames Gemini as a "Master Pixel Artist" who:
- Places every pixel deliberately (no automated filters/gradients/blur)
- Uses limited palettes with mandatory hue-shifting in color ramps
- Produces clean line art with consistent pixel-step patterns (1:1, 2:1)
- Uses deliberate clusters and implied texture (not fine-grained noise)
- Maintains single consistent light source
- Outputs PNG with transparent background

### Prohibited Patterns
- Automated filters (blur, gradients, sharpening)
- "Jaggies" (inconsistent broken line art)
- Mixed projections (don't mix top-down with isometric)
- Straight color ramps (must have hue-shifting)
- Noisy textures (imply texture, don't render every detail)

## Key Types (src/types.ts)

- `CharacterIdentity`: Structured character document with physicalDescription, colourPalette, styleParameters
- `StyleParameters`: outlineStyle, shadingStyle, detailLevel, canvasSize, paletteMode, viewType
- `PixelData`: width, height, palette[], pixels[] (hex codes or "transparent")
- `Direction`: 'S' | 'N' | 'E' | 'W' | 'SE' | 'SW' | 'NE' | 'NW'

## Design System

- **Aesthetic:** Deep pub green / mint terminal theme
- **NO rounded corners** - sharp, pixel-perfect edges
- **NO gradients** - flat colors only
- **Fonts:** `Playfair Display` for headings, `VT323` for everything else
- **Colors defined in** `src/styles/global.css` as CSS variables

## Known Gaps / Future Work

1. **Pixel Snapper:** AI pixels are often "off-grid". Need Rust/WASM tool to re-map to strict grid
2. **Thought Signatures:** Pro model returns reasoning context that should be circulated for multi-turn consistency
3. **Reference Stacking:** Support up to 14 reference images for identity locking
4. **SynthID Handling:** Auto-crop bottom metadata area from generated images

## Reference Documentation

- **Architecture:** `PixelMilk-App/docs/ARCHITECTURE.md`
- **Reference Guide:** `PixelMilk-App/ReferenceGuide.md` (maps phases to resource files)
- **NotebookLM Analysis:** `NoteBookOutput/Mastering Pixel Art for Gemini Nano Banana - 2025-12-21.md`
- **System Instructions:** `NoteBookOutput/Gemini System Instructions_ Master Pixel Art Sprite Generation - 2025-12-21.md`
- **Phase Plans:** `PixelMilk-App/docs/plans/`
- **Gemini Recipes:** `Resources and Guides/generative-ai-main/gemini/nano-banana/`

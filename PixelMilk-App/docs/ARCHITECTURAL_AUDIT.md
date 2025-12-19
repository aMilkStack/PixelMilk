# PixelMilk Architectural Audit Reference

> **Purpose:** This document serves as the single source of truth for architectural compliance. Use it to verify that all implementation details align with the master specification in `ARCHITECTURE.md`.

**Last Updated:** 2025-12-19  
**Status:** Foundation Phase (Phase 1) - Critical Model Architecture Fixed

---

## Table of Contents

1. [Phase Overview](#phase-overview)
2. [Critical Model Specification](#critical-model-specification)
3. [Phase 1 Checklist](#phase-1-checklist)
4. [Phase 2 Checklist](#phase-2-checklist)
5. [Design System Checklist](#design-system-checklist)
6. [Directory Structure Checklist](#directory-structure-checklist)
7. [Documentation References](#documentation-references)
8. [Priority Fix List](#priority-fix-list)

---

## Phase Overview

| Phase | Name | Status | Priority |
|-------|------|--------|----------|
| **Phase 1** | Foundation & App Shell | ✅ COMPLETE (with fixes) | Critical |
| **Phase 2** | Character Tab MVP | ⚠️ IN PROGRESS | Critical |
| **Phase 3** | Canvas & Tools | ⏸️ PENDING | High |
| **Phase 4** | Sprite Rotations | ⏸️ PENDING | High |
| **Phase 5** | Tile Tab | ⏸️ PENDING | Medium |
| **Phase 6** | Object Tab | ⏸️ PENDING | Medium |
| **Phase 7** | Texture Tab | ⏸️ PENDING | Medium |
| **Phase 8** | Compose Tab | ⏸️ PENDING | Low |
| **Phase 9** | Library Tab | ⏸️ PENDING | Medium |
| **Phase 10** | AI Guidance | ⏸️ PENDING | Low |

---

## Critical Model Specification

### ⚠️ CRITICAL ARCHITECTURE RULE

**PixelMilk uses IMAGE models for sprite generation, NOT TEXT models.**

The fundamental error in the initial implementation was using TEXT-based Gemini models to output JSON arrays of hex codes, when the architecture requires IMAGE-based models that generate actual PNG data.

### Correct Model Usage

| Model | Type | Use Case | Cost | Speed |
|-------|------|----------|------|-------|
| `gemini-2.5-flash-image` | IMAGE | Volume operations: tiles, textures, draft sprites | $ | Fast |
| `gemini-3-pro-image-preview` | IMAGE | Quality operations: final sprites, complex composition | $$$ | Slower |
| `gemini-2.5-flash` | TEXT | Text analysis: tooltips, descriptions | $ | Fast |
| `gemini-3-flash-preview` | TEXT | Text generation: prompt optimization, coaching | $$ | Medium |

### Model Routing Rules

```typescript
function getModelForTask(task: TaskType, quality: QualityMode): GeminiModel {
  // Identity generation: TEXT models (analyzing character descriptions)
  if (task === 'identity') {
    return quality === 'quality' ? 'gemini-3-flash-preview' : 'gemini-2.5-flash';
  }
  
  // Sprite/tile/texture generation: IMAGE models
  if (['sprite', 'tile', 'texture', 'object'].includes(task)) {
    return quality === 'quality' ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
  }
}
```

### Why This Matters

**Current WRONG approach (JSON pixel arrays):**
- 128×128 sprite = 16,384 hex codes in JSON = ~100K+ tokens
- Text models aren't trained for precise pixel placement
- Extremely expensive per sprite
- Poor quality output

**Correct approach (IMAGE generation):**
- Direct PNG output = minimal tokens
- Image models are trained for visual generation
- Much cheaper
- Higher quality

---

## Phase 1 Checklist

### ✅ Core Foundation

- [x] Project scaffolding (Vite + React + TypeScript)
- [x] Dependencies installed
- [x] Type definitions created (`src/types.ts`)
- [x] Tab navigation system
- [x] App shell and layout
- [x] CSS variables and design system

### ⚠️ Critical Fixes Applied (2025-12-19)

- [x] **Fixed:** `GeminiModel` type uses correct image model identifiers
- [x] **Fixed:** `modelRouter.ts` routes to image models for generation tasks
- [x] **Documented:** `geminiService.ts` needs image generation API (not JSON pixel arrays)
- [x] **Fixed:** `characterStore.ts` has `lockedPalette` state and action
- [x] **Fixed:** `characterStore.ts` uses Map for sprites instead of array
- [x] **Fixed:** `variables.css` has all correct colors including `--color-accent-beige`
- [x] **Fixed:** `CharacterIdentity` interface has `createdAt` and `updatedAt` fields
- [x] **Fixed:** `StyleParameters.paletteMode` includes `'custom'` option

### 🔴 Outstanding Phase 1 Issues

- [ ] **CRITICAL:** `geminiService.ts` still uses JSON pixel array output instead of image generation
  - Must change `generateSouthSpriteData()` to use `responseModality: "image"`
  - Must change `generateRotatedSpriteData()` to use `responseModality: "image"`
  - Must implement image-to-PixelData conversion
  - Must implement palette extraction from generated images

### File Status

| File | Status | Notes |
|------|--------|-------|
| `src/types.ts` | ✅ FIXED | Correct model types, added timestamps, added 'custom' palette mode |
| `src/services/gemini/modelRouter.ts` | ✅ FIXED | Correct routing logic for IMAGE vs TEXT models |
| `src/services/gemini/geminiService.ts` | ⚠️ DOCUMENTED | TODO comments added, needs implementation |
| `src/stores/characterStore.ts` | ✅ FIXED | Added lockedPalette, changed to Map structure |
| `src/styles/variables.css` | ✅ FIXED | All colors corrected per spec |

---

## Phase 2 Checklist

### Character Tab Requirements

- [ ] Input panel with prompt textarea
- [ ] Style parameter controls
- [ ] Quality mode selector (draft/balanced/quality)
- [ ] Generate button with loading state
- [ ] Identity generation working
- [ ] South sprite generation working
- [ ] Sprite preview canvas
- [ ] Palette display and locking
- [ ] Direction selector (8-way)
- [ ] Error handling and display

### Character Identity System

- [ ] Identity document generation via TEXT model
- [ ] Structured JSON output with all required fields
- [ ] Physical description extraction
- [ ] Color palette analysis
- [ ] Distinctive features identification
- [ ] Angle-specific notes for rotations

### Sprite Generation Workflow

- [ ] Text → Identity → Sprite pipeline
- [ ] First sprite locks the palette
- [ ] Palette governor enforces color constraints
- [ ] Normal map generation
- [ ] Canvas size support (16/32/64/128/256)

---

## Design System Checklist

### Color Palette

| Variable | Required Value | Current Value | Status |
|----------|---------------|---------------|--------|
| `--color-bg-primary` | `#021a1a` | `#021a1a` | ✅ |
| `--color-bg-secondary` | `#032828` | `#032828` | ✅ |
| `--color-bg-tertiary` | `#043636` | `#043636` | ✅ |
| `--color-text-primary` | `#8bd0ba` | `#8bd0ba` | ✅ |
| `--color-text-secondary` | `#6ba89a` | `#6ba89a` | ✅ FIXED |
| `--color-text-muted` | `#4a7a6e` | `#4a7a6e` | ✅ FIXED |
| `--color-accent-beige` | `#d8c8b8` | `#d8c8b8` | ✅ FIXED |
| `--color-error` | `#f04e4e` | `#f04e4e` | ✅ FIXED |

### Typography

- [x] Display font: `'Playfair Display', Georgia, serif`
- [x] Mono font: `'VT323', 'Courier New', monospace`
- [x] Font sizes defined (sm/base/lg/xl)
- [x] Line heights defined (tight/base/relaxed)

### Design Rules

- [x] **NO rounded corners** (`--border-radius: 0px`)
- [x] **NO gradients** (flat colors only)
- [x] **NO shadows** (use borders for elevation)
- [x] Terminal aesthetic (prompts with `>`, errors with `!`)
- [x] Monospace everywhere except display headings

---

## Directory Structure Checklist

### Required Directories

```
src/
├── components/       ✅ Required
│   ├── tabs/        ✅ Required
│   ├── canvas/      ⏸️ Phase 3
│   ├── ui/          ✅ Required
│   └── shared/      ✅ Required
├── services/        ✅ Required
│   ├── gemini/      ✅ Required
│   ├── db/          ⏸️ Phase 9
│   └── export/      ⏸️ Phase 9
├── stores/          ✅ Required
├── hooks/           ✅ Required
├── types/           ✅ Required (currently single file)
├── utils/           ✅ Required
└── styles/          ✅ Required
```

### Critical Files

| File | Status | Purpose |
|------|--------|---------|
| `src/types.ts` | ✅ EXISTS | Core type definitions |
| `src/services/gemini/modelRouter.ts` | ✅ EXISTS | Model selection logic |
| `src/services/gemini/geminiService.ts` | ⚠️ NEEDS FIX | API integration layer |
| `src/stores/characterStore.ts` | ✅ EXISTS | Character state management |
| `src/utils/paletteGovernor.ts` | ❓ UNKNOWN | Palette locking enforcement |
| `src/styles/variables.css` | ✅ EXISTS | Design system tokens |

---

## Documentation References

### Primary Documents

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Master technical specification
- **[HANDOFF-2025-12-18.md](./HANDOFF-2025-12-18.md)** - Original session context
- **[ARCHITECTURAL_AUDIT.md](./ARCHITECTURAL_AUDIT.md)** - This document

### Phase Plans

- **[Phase 1: Foundation](./plans/2025-12-18-pixelmilk-foundation.md)**
- **[Phase 2: Character Tab](./plans/2025-12-18-phase-2-character-tab.md)**
- **[Phase 3: Canvas Tools](./plans/2025-12-18-phase-3-canvas-tools.md)**
- **[Phase 4: Sprite Rotations](./plans/2025-12-18-phase-4-sprite-rotations.md)**
- **[Phase 5: Tile Tab](./plans/2025-12-18-phase-5-tile-tab.md)**
- **[Phase 6: Object Tab](./plans/2025-12-18-phase-6-object-tab.md)**
- **[Phase 7: Texture Tab](./plans/2025-12-18-phase-7-texture-tab.md)**
- **[Phase 8: Compose Tab](./plans/2025-12-18-phase-8-compose-tab.md)**
- **[Phase 9: Library Tab](./plans/2025-12-18-phase-9-library-tab.md)**
- **[Phase 10: AI Guidance](./plans/2025-12-18-phase-10-ai-guidance.md)**

### Review Reports

- **[Phase 1 Review](./plans/2025-12-19-phase1-review-report.md)**
- **[Phase 2 Review](./plans/2025-12-19-phase2-review-report.md)**
- **[Phase 3 Review](./plans/2025-12-19-phase3-review-report.md)**

---

## Priority Fix List

### 🔴 CRITICAL (Blocks Core Functionality)

1. **Implement Image Generation in geminiService.ts**
   - File: `src/services/gemini/geminiService.ts`
   - Issue: Currently uses JSON pixel arrays instead of image generation
   - Fix Required:
     - Change `generateSouthSpriteData()` to use image models with `responseModality: "image"`
     - Change `generateRotatedSpriteData()` to use image models with `responseModality: "image"`
     - Implement image-to-PixelData conversion utility
     - Implement palette extraction from generated PNG data
   - Impact: Without this, sprite generation is 100x more expensive and produces poor quality
   - References: ARCHITECTURE.md lines 124-156

2. **Verify paletteGovernor Utility Exists**
   - File: `src/utils/paletteGovernor.ts`
   - Issue: Referenced in geminiService.ts but existence not confirmed
   - Fix Required: Create if missing, verify implementation if present
   - Impact: Palette locking won't work without this

### 🟡 HIGH (Important for Quality)

3. **Update All Component References to New Store Structure**
   - Files: Any component using `characterStore`
   - Issue: `sprites` changed from array to `currentSprites` Map
   - Fix Required: Update all `.sprites` references to `.currentSprites`
   - Impact: Components will break if they reference old structure

4. **Add Timestamp Generation to Identity Creation**
   - File: Components that create `CharacterIdentity` objects
   - Issue: New `createdAt` and `updatedAt` fields need to be populated
   - Fix Required: Add `Date.now()` when creating identity objects
   - Impact: Timestamp fields will be undefined

### 🟢 MEDIUM (Nice to Have)

5. **Add 'custom' Palette Mode UI**
   - File: Style parameters component
   - Issue: New 'custom' option added to type but UI may not show it
   - Fix Required: Add 'custom' option to palette mode selector
   - Impact: Users can't access custom palette feature

6. **Document Image-to-PixelData Conversion Strategy**
   - File: New utility or geminiService.ts
   - Issue: Need clear strategy for converting PNG to pixel array format
   - Options:
     - Canvas API to read pixel data
     - Maintain both PNG and pixel array in SpriteAsset
     - Generate pixel array on-demand when needed for editing
   - Impact: Affects how sprites can be edited

### 🟣 LOW (Future Enhancement)

7. **Add Model Cost Tracking**
   - File: New analytics utility
   - Issue: Would be useful to track API costs per session
   - Fix Required: Log model usage and calculate estimated costs
   - Impact: User awareness of API spending

8. **Implement Thinking Level Controls**
   - File: Quality settings UI
   - Issue: `thinkingLevel` configured in modelRouter but no UI control
   - Fix Required: Add advanced settings toggle with thinking level slider
   - Impact: Users can't manually adjust inference time vs quality

---

## Verification Commands

### Build Test

```bash
cd PixelMilk-App
npm run build
```

**Expected:** Clean build with no TypeScript errors

### Type Check

```bash
npx tsc --noEmit
```

**Expected:** Zero errors

### Runtime Test

```bash
npm run dev
```

**Expected:** App loads, no console errors, tabs visible

---

## Change Log

### 2025-12-19: Critical Model Architecture Fix

**Files Changed:**
- `src/types.ts` - Updated GeminiModel type, added timestamps to CharacterIdentity, added 'custom' to paletteMode
- `src/services/gemini/modelRouter.ts` - Updated model constants and routing logic for IMAGE vs TEXT models
- `src/services/gemini/geminiService.ts` - Added TODO comments documenting required image generation changes
- `src/stores/characterStore.ts` - Added lockedPalette state/action, changed sprites to Map structure
- `src/styles/variables.css` - Corrected color values, added --color-accent-beige
- `docs/ARCHITECTURAL_AUDIT.md` - Created this comprehensive audit document

**Issues Fixed:**
- ✅ Model types now reference correct image/text model identifiers
- ✅ Model routing now separates TEXT models (identity) from IMAGE models (sprites)
- ✅ Character store now supports palette locking
- ✅ Sprite storage now uses Map for O(1) direction lookup
- ✅ Design system colors now match specification exactly

**Issues Documented:**
- ⚠️ geminiService.ts requires implementation of actual image generation
- ⚠️ Image-to-PixelData conversion strategy needs to be defined
- ⚠️ Palette extraction from PNG data needs to be implemented

---

## Success Criteria

### Phase 1 Complete When:

- [x] All TypeScript files compile without errors
- [x] Model types use correct identifiers
- [x] Model routing separates IMAGE/TEXT tasks correctly
- [ ] Image generation API is implemented (not just documented)
- [x] Character store supports all required state
- [x] Design system matches specification
- [ ] paletteGovernor utility exists and works

### Phase 2 Complete When:

- [ ] User can enter character description
- [ ] Identity generation produces valid JSON
- [ ] Sprite generation produces actual PNG images
- [ ] Palette is extracted and locked on first sprite
- [ ] All 8 directions can be generated with locked palette
- [ ] Sprites are displayed correctly in UI

---

## Notes for Future Sessions

### When Implementing Image Generation:

1. **Response Format:**
   ```typescript
   const response = await ai.models.generateContent({
     model: SPRITE_FLASH_MODEL,
     contents: prompt,
     config: {
       responseModality: "image",
       // No responseMimeType or responseSchema for image generation
     }
   });
   ```

2. **Extracting Image Data:**
   ```typescript
   // Response will contain image data in parts
   const imagePart = response.candidates[0].content.parts[0];
   if (imagePart.inlineData) {
     const imageBase64 = imagePart.inlineData.data;
     const mimeType = imagePart.inlineData.mimeType; // "image/png"
   }
   ```

3. **Converting to PixelData:**
   - Load image into HTML Canvas
   - Use `getImageData()` to read pixel array
   - Extract unique colors for palette
   - Convert RGBA to hex codes
   - Detect transparent pixels

4. **Palette Extraction:**
   - Use color quantization algorithm (median cut or k-means)
   - Limit to reasonable palette size (8-32 colors)
   - Sort by frequency or luminance

### API Compatibility Notes:

- Image generation models DO NOT support structured JSON output
- Cannot use `responseMimeType: "application/json"` with image models
- Cannot use `responseSchema` with image models
- Text analysis models (identity generation) work as currently implemented

---

**Document End**

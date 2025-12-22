# Implementation Alignment 2025-12-19

Status: Active
Owner: Ethan
Applies to: Phase 0 (ARCHITECTURE), Phase 1 (Foundation), Phase 2 (Character Tab)

## Purpose
Align current implementation with the plans and the clarified hybrid workflow.

## Confirmed Decisions (do not regress)
- Two-step generation: Identity (text model) then Sprite (image model).
- Hybrid workflow: Gemini outputs PNG, client converts PNG to pixel array.
- Storage: pixel arrays in IndexedDB (PNG is intermediate only).
- Palette locking: derived from first sprite palette, enforced in pixel arrays.
- Enhancements to keep: API key modal, header logo, higher-res sizes (128/256), save-to-library, PNG download, mobile tab label hiding.

## Clarified Hybrid Workflow
1. Generate Identity (text model, structured JSON, camelCase)
2. Generate Sprite (image model -> PNG, base64)
3. Convert PNG to pixel array (nearest neighbor, canvas)
4. Extract palette from pixels, lock it
5. Store sprite as pixel array in IndexedDB
6. Local pixel editing operates on pixel arrays
7. Export renders pixel arrays back to PNG

## Data Model Notes
- CharacterIdentity uses camelCase fields only (physicalDescription, colourPalette, styleParameters, angleNotes).
- Sprite storage: width, height, pixels[], palette[], direction, createdAt.
- imageBase64 is optional and temporary; use derived PNG for preview/export.

## Model Routing (source of truth)
- gemini-2.5-flash for identity text analysis
- gemini-2.5-flash-image for draft or volume image generation
- gemini-3-pro-image-preview for final or quality image generation
- Model router should be used everywhere

## Missing Utility
- src/utils/imageUtils.ts
  - pngToPixelArray(imageData, targetWidth, targetHeight) -> { pixels, palette }
  - Uses canvas drawImage + getImageData + nearest-neighbor scaling

## Phase 0 Alignment (ARCHITECTURE.md)
- Add explicit PNG to pixel array conversion step.
- Reword palette locking to reflect client-side conversion.
- Confirm visual design rules and model routing names.

## Phase 1 Alignment (Foundation Plan)
- Types: update GeminiModel and TaskType to include image models and text model.
- Services: ensure gemini service uses modelRouter, remove legacy geminiService.ts.
- Storage: confirm assets store pixel arrays, not PNGs.
- Add imageUtils utility.
- Remove legacy duplicate components.

## Phase 2 Alignment (Character Tab)
- Fix camelCase usage in all components.
- After Generate Sprite: convert PNG to pixel array and store in sprites.
- SpriteCanvas renders from pixel arrays with zoom controls.
- PNG download uses renderPixelDataToDataUrl from pixel arrays.
- Background toggle: transparent default; export uses selected background color.
- PaletteDisplay shows locked palette and updates selected color.
- Add palette locking from first sprite (from extracted palette).
- Ensure direction-aware sprite selection.

## Open Questions
- None.

# Phase 3: Canvas & Editing Tools - Review Report

**Initial Plan:** `2025-12-19-phase3-canvas-tools-initial.md`
**Review Date:** 2025-12-19
**Round:** 2 of 3

## Executive Summary

The plan is solid but has some redundancy (ColorPicker can be simplified), missing edge case handling (sprite overwrite warning, AI edit cancellation), and the task breakdown can be streamlined. Critical path analysis reveals parallelization opportunities in Phase A and B. The core approach (native canvas, separate stores) survives scrutiny.

---

## Assumption Audit

### High-Risk Assumptions

| Assumption | Risk | Evidence | Mitigation |
|------------|------|----------|------------|
| AI hotspot edit returns valid JSON | HIGH | Gemini sometimes wraps JSON in markdown | Already have fallback parser in geminiService - reuse pattern |
| Flood fill won't overflow | MEDIUM | Recursive algorithm on 64x64 = 4096 max pixels | Use iterative algorithm with explicit stack (already noted) |
| User won't edit during generation | MEDIUM | No UI lock mentioned | Disable canvas during AI operations |

### Assumptions Validated

- **Native canvas is sufficient** - Confirmed: 64x64 max = 4096 pixels, trivial for canvas
- **50 undo states is enough** - Confirmed: 50 * ~4KB = ~200KB, minimal memory
- **Separate canvasStore is cleaner** - Confirmed: Canvas state (zoom, tool) is orthogonal to character data

### Low-Risk / Non-Issues

- Keyboard shortcuts conflicting with browser - Low risk, standard pattern with preventDefault
- Canvas performance - Non-issue at 64x64 scale

---

## Edge Cases Requiring Handling

### Critical (Must Address)

1. **Sprite overwrite on re-generate:** If user edits sprite then clicks "Generate Sprite" again, edits are lost
   - **Required handling:** Show confirmation dialog before overwrite, or auto-save to undo history

2. **AI edit cancellation:** User clicks cancel during hotspot AI request
   - **Required handling:** AbortController for fetch, loading state that blocks interaction

3. **Colors outside locked palette:** AI might return hex codes not in the identity palette
   - **Required handling:** Snap to nearest palette color or reject/regenerate

### Important (Should Address)

1. **Hotspot at sprite edge:** Radius 5 at position (0,0) extends to negative coordinates
   - **Suggested handling:** Clamp region bounds to sprite dimensions (already in existing plan code)

2. **Empty sprite state:** InteractiveCanvas with null sprite
   - **Suggested handling:** Show placeholder message, disable tools (pattern exists in SpritePreview)

3. **Rapid flood fill clicks:** Could queue multiple expensive operations
   - **Suggested handling:** Disable canvas input during fill operation

### Nice-to-Have (Can Defer)

1. **Middle-click pan:** Standard in many editors
   - Defer to Phase 4 or later

2. **Touch support:** Mobile drawing
   - Defer to later phase

---

## Redundancy Findings

### Tasks to Remove

- **B4: ColorPicker.tsx** - Unnecessary complexity. The IdentityCard already displays the locked palette. For the canvas, we just need:
  1. Current selected color indicator (small swatch)
  2. Click on palette color in IdentityCard or a simplified inline palette strip

  **Recommendation:** Replace with simpler "SelectedColorDisplay" (just shows current color) and let users click palette colors in existing IdentityCard display.

### Tasks to Combine

- **C1 (draw) + C2 (erase):** Same logic - setPixel with different colors
  - Combine into single implementation with color parameter

- **C6 (undo/redo) + C7 (keyboard shortcuts):** Wire up together since shortcuts call undo/redo
  - Combine into single integration task

- **A1-A3 (hooks):** Creating 3 files for 2 hooks
  - Keep as-is, but note they're independent and can be done in parallel

### Tasks to Defer

- None - scope is appropriate for Phase 3

---

## Alternative Analysis

### Original Approach Strengthened

**Native Canvas vs External Library (Pixi.js):**
- Re-argued FOR Pixi.js: WebGL rendering, built-in interaction, better API
- Counter-argument wins: 64x64 sprites don't need WebGL performance. Native canvas is ~50 lines of drawing code. Adding Pixi.js is 40KB+ bundle size for marginal benefit.
- **Verdict:** Keep native canvas

**Separate canvasStore vs merged with characterStore:**
- Re-argued FOR merged: Simpler, fewer stores to manage
- Counter-argument wins: Canvas state (zoom, tool, pan) persists across character switches. Hotspot coordinates are ephemeral. Clean separation is correct.
- **Verdict:** Keep separate canvasStore

### Approach Modifications

1. **Remove ColorPicker component** - Use inline color swatch + existing palette display
2. **Add overwrite protection** - Before re-generating sprite, check for unsaved edits
3. **Add AbortController** - For cancellable AI requests

---

## Dependency Corrections

### Parallelization Opportunities

**Phase A - All can run in parallel:**
```
A1 (useHistory) ──┐
A2 (useKeyboard)──├── Then A3 (index.ts)
A4 (canvasStore)──┘
A5 (store index update) - after A4
A6 (types update) - can be first
```

**Phase B - Most can run in parallel after B1:**
```
B1 (create directory)
    ├── B2 (ZoomControls)
    ├── B3 (ToolPalette)
    └── B5 (InteractiveCanvas) - depends on B2, B3 being importable
B6 (barrel export) - after all components
```

### Critical Path (Revised)

```
A6 (types)
  └── A4 (canvasStore)
        └── A1,A2 (hooks) [parallel]
              └── B1-B5 (components) [mostly parallel]
                    └── C1-C5 (tools) [sequential within InteractiveCanvas]
                          └── D1-D5 (hotspot) [sequential]
                                └── E1-E4 (integration)
```

### Bottleneck Identified

- **InteractiveCanvas.tsx** is the central piece - most complex, most dependencies
- Recommendation: Start this early, other components can be stubs initially

---

## Recommendations for Final Plan

### Must Change

1. **Remove ColorPicker (B4)** - Replace with simple inline color indicator
2. **Add overwrite protection** - New task: Check for unsaved edits before sprite regeneration
3. **Add AI request cancellation** - New task: AbortController in editing service

### Should Change

1. **Combine C1+C2** - Draw and erase are the same implementation
2. **Combine C6+C7** - Undo/redo and shortcuts wire-up together
3. **Reorder for parallelization** - Update task ordering to reflect true dependencies
4. **Add edge case handling tasks** - Palette color validation for AI responses

### Consider Changing

1. **Extract ZoomControls from SpritePreview** - Could create shared component used by both SpritePreview and InteractiveCanvas (reduces duplication)
2. **Add mini-preview in HotspotEditModal** - Shows selected region before sending to AI (improves UX but adds scope)

---

## Revised Task Count

| Phase | Original | After Review |
|-------|----------|--------------|
| A     | 6        | 6 (no change) |
| B     | 6        | 5 (removed ColorPicker) |
| C     | 7        | 5 (combined draw/erase, combined undo/shortcuts) |
| D     | 5        | 6 (added cancellation, palette validation) |
| E     | 4        | 5 (added overwrite protection) |
| **Total** | **28** | **27** |

---

**Review complete.** Key findings: Remove ColorPicker redundancy, add overwrite protection and AI cancellation, combine similar tasks, leverage parallelization in Phase A/B. Ready for Round 3 - Final consolidation. Use `/sc:plan-final` to create execution-ready plan.

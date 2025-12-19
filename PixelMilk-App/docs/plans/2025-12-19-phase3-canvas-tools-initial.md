# Phase 3: Canvas & Editing Tools - Initial Plan

**Status:** Draft - Pending Review
**Created:** 2025-12-19
**Round:** 1 of 3

## Goal
Build interactive pixel editing canvas with drawing tools (draw, erase, fill, eyedropper), zoom/pan controls, undo/redo system, and hotspot-based AI editing for targeted sprite modifications.

## Context
Phase 2 Character Tab MVP is complete with identity generation, sprite generation, and save to library. Users can now generate pixel art characters but cannot edit them manually. Phase 3 adds the editing layer - allowing users to refine AI-generated sprites with traditional pixel editing tools plus AI-assisted hotspot editing.

## Current State Analysis

### Existing Assets to Leverage
- `SpritePreview.tsx` - Display-only canvas with zoom/background controls (can reference patterns)
- `CanvasState` type in `types.ts` - Basic canvas state definition
- `ToolMode` type in `types.ts` - Basic tools (needs 'hotspot' added)
- Terminal aesthetic color palette and styling patterns

### Missing Infrastructure
- No `src/hooks/` directory
- No `canvasStore` (only appStore, characterStore)
- No interactive canvas component
- No AI editing service

## Approach

Extend the existing SpritePreview pattern into a full interactive canvas while maintaining the terminal aesthetic. Create reusable hooks for history (undo/redo) and keyboard shortcuts. Add a dedicated canvas store for editing state. Build hotspot selection UI that captures click coordinates for targeted AI edits.

### Alternatives Considered
1. **Replace SpritePreview entirely** - Rejected because display-only preview is still useful; better to create separate InteractiveCanvas
2. **Use external library (Pixi.js, Fabric.js)** - Rejected because overkill for pixel-level editing; native canvas is simpler and matches current patterns
3. **Put canvas state in characterStore** - Rejected because canvas state is orthogonal to character data; separate store is cleaner

## Task Breakdown

### Phase A: Foundation (Hooks & Store)
**Objective:** Create reusable hooks and canvas state management

- [ ] A1: Create `src/hooks/useHistory.ts` - Generic undo/redo hook
- [ ] A2: Create `src/hooks/useKeyboard.ts` - Keyboard shortcut handler
- [ ] A3: Create `src/hooks/index.ts` - Barrel export
- [ ] A4: Create `src/stores/canvasStore.ts` - Canvas editing state (tool, zoom, pan, hotspot, brush)
- [ ] A5: Update `src/stores/index.ts` - Export canvasStore
- [ ] A6: Update `src/types.ts` - Add 'hotspot' to ToolMode, add brushSize to CanvasState

**Verification:** TypeScript compiles, stores can be imported

### Phase B: Canvas Components
**Objective:** Build interactive canvas UI components

- [ ] B1: Create `src/components/canvas/` directory structure
- [ ] B2: Create `ZoomControls.tsx` - Zoom in/out/reset buttons with percentage display
- [ ] B3: Create `ToolPalette.tsx` - Vertical tool bar with icons (draw, erase, fill, eyedropper, hotspot)
- [ ] B4: Create `ColorPicker.tsx` - Current color display + palette colors from identity
- [ ] B5: Create `InteractiveCanvas.tsx` - Main canvas with mouse handlers for drawing
- [ ] B6: Create `src/components/canvas/index.ts` - Barrel export

**Verification:** Components render without errors, tools can be selected

### Phase C: Drawing Implementation
**Objective:** Implement actual pixel editing functionality

- [ ] C1: Implement draw tool - Set pixels on mouse down/move
- [ ] C2: Implement erase tool - Set pixels to transparent
- [ ] C3: Implement fill tool - Flood fill algorithm
- [ ] C4: Implement eyedropper tool - Pick color from canvas
- [ ] C5: Implement brush size support (1-8px)
- [ ] C6: Wire up undo/redo with useHistory hook
- [ ] C7: Wire up keyboard shortcuts (Ctrl+Z, Ctrl+Y, D, E, F, I, V, H)

**Verification:** Can draw/erase pixels, undo/redo works, shortcuts work

### Phase D: Hotspot AI Editing
**Objective:** Enable targeted AI-assisted sprite editing

- [ ] D1: Implement hotspot selection tool - Click to select pixel region
- [ ] D2: Create `HotspotEditModal.tsx` - Modal with instruction input and radius control
- [ ] D3: Create `src/services/gemini/editing.ts` - AI editing service
- [ ] D4: Update `src/services/gemini/index.ts` - Export editing functions
- [ ] D5: Wire up hotspot flow: select region -> modal -> AI edit -> apply to canvas

**Verification:** Can select hotspot, enter instruction, see AI-modified pixels

### Phase E: Integration
**Objective:** Integrate canvas editing into CharacterTab

- [ ] E1: Update CharacterTab layout to include ToolPalette and InteractiveCanvas
- [ ] E2: Add progress indicator during AI edits
- [ ] E3: Test full flow: generate sprite -> edit manually -> AI hotspot edit -> save
- [ ] E4: Build verification

**Verification:** Full editing workflow works end-to-end, build succeeds

## Dependencies
- Gemini API key (already handled in Phase 2)
- `@google/genai` package (already installed)
- Lucide React icons (already installed)

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Canvas performance with large sprites | M | M | Limit max canvas size to 64x64, use requestAnimationFrame |
| AI hotspot edit returns wrong format | M | H | Robust JSON parsing with fallback, validation layer |
| Flood fill stack overflow | L | H | Use iterative algorithm with explicit stack, add pixel limit |
| Keyboard shortcuts conflict with browser | L | L | Use preventDefault, test in multiple browsers |

## Open Questions
- [ ] Should brush size affect hotspot selection radius or keep separate?
- [ ] What's the max undo history size before performance degrades? (Starting with 50)
- [ ] Should we show a mini-preview of hotspot region in the modal?

## Estimated Complexity
- Phase A: 4 tasks, low complexity
- Phase B: 6 tasks, medium complexity
- Phase C: 7 tasks, high complexity (drawing logic)
- Phase D: 5 tasks, high complexity (AI integration)
- Phase E: 4 tasks, medium complexity

## File Tree After Phase 3

```
src/
├── hooks/
│   ├── useHistory.ts        [NEW]
│   ├── useKeyboard.ts       [NEW]
│   └── index.ts             [NEW]
├── components/
│   ├── canvas/
│   │   ├── InteractiveCanvas.tsx  [NEW]
│   │   ├── ZoomControls.tsx       [NEW]
│   │   ├── ToolPalette.tsx        [NEW]
│   │   ├── ColorPicker.tsx        [NEW]
│   │   ├── HotspotEditModal.tsx   [NEW]
│   │   └── index.ts               [NEW]
│   └── character/
│       └── CharacterTab.tsx       [UPDATE]
├── stores/
│   ├── canvasStore.ts       [NEW]
│   └── index.ts             [UPDATE]
├── services/gemini/
│   ├── editing.ts           [NEW]
│   └── index.ts             [UPDATE]
└── types.ts                 [UPDATE]
```

---

**Next Step:** Run `/sc:plan-review` to challenge assumptions and find gaps.

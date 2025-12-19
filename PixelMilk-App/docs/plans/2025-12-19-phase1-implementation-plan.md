# PixelMilk Phase 1 Foundation - Initial Plan

**Status:** Draft - Pending Review
**Created:** 2025-12-19
**Round:** 1 of 3

## Goal

Build the complete foundation/scaffolding for PixelMilk so that all future phases (Character, Tile, Object, Texture, Compose, Library tabs) can be implemented on top of it. Success = app runs in browser with working tab navigation, API key modal, and terminal aesthetic.

## Context

PixelMilk is an AI-powered pixel art creation suite using Gemini image models. This Phase 1 establishes the project structure, services layer, and app shell. A detailed implementation plan already exists at `2025-12-18-pixelmilk-foundation.md` with exact code - we're creating a higher-level execution plan that adds verification checkpoints and considers parallelization.

## Approach

**Hybrid Sequential/Parallel Execution**
- Phase A: Sequential scaffolding (must be first)
- Phase B: Parallel foundation layers (independent work)
- Phase C: Sequential application assembly (depends on Phase B)
- Phase D: Sequential validation

### Alternatives Considered

1. **Follow existing plan verbatim** - Rejected because: lacks verification checkpoints, includes three.js deps not needed in Phase 1
2. **Fully parallel execution** - Rejected because: too many interdependencies, risk of merge conflicts
3. **Fully sequential** - Rejected because: unnecessarily slow when independent work exists

## Task Breakdown

### Phase A: Scaffolding (Sequential)
**Objective:** Get a compiling React + TypeScript project with proper structure

- [ ] A1: Initialize Vite project
  - Create package.json (defer three.js deps to Phase 4)
  - Create vite.config.ts with @ path aliases
  - Create tsconfig.json with strict mode
  - Create index.html with Google Fonts (VT323, Playfair Display)
  - Create src/main.tsx entry point
  - Create src/App.tsx placeholder

- [ ] A2: Create directory structure
  - src/components/{shared,layout,canvas,character,tile,object,texture,compose,library}
  - src/services/{gemini,storage}
  - src/stores, src/hooks, src/types, src/utils, src/styles

- [ ] A3: Define core types
  - types/gemini.ts (TaskType, QualityMode, GeminiModel, GeminiConfig)
  - types/assets.ts (Direction, AssetType, StyleParameters, CharacterIdentity, SpriteData, Asset)
  - types/ui.ts (TabId, TabConfig, ToolMode, CanvasState, GenerationStatus)
  - types/index.ts (barrel export)

**Verification:** `npm install && npm run build` succeeds with no errors

### Phase B: Foundation Layers (Parallel)
**Objective:** Build independent service and component layers

- [ ] B1: Global styles
  - styles/variables.css (color palette, typography, spacing)
  - styles/global.css (reset, terminal aesthetic, NO border-radius)

- [ ] B2: Shared UI components
  - shared/Button.tsx (variants: primary, secondary, danger, ghost)
  - shared/Input.tsx (with label and error display)
  - shared/Select.tsx (dropdown with terminal styling)
  - shared/Panel.tsx (container with optional title)
  - shared/Tooltip.tsx (hover tooltips)
  - shared/index.ts (barrel export)

- [ ] B3: Gemini service layer
  - gemini/modelRouter.ts (getModelForTask, getConfigForTask)
  - gemini/schemas.ts (pixelDataSchema, characterIdentitySchema)
  - gemini/client.ts (initializeClient, generateContent, generateImage, editImage)
  - gemini/index.ts (barrel export)

- [ ] B4: Storage service (IndexedDB)
  - storage/db.ts (database initialization, schema)
  - storage/assets.ts (CRUD operations for assets)
  - storage/settings.ts (API key, preferences)
  - storage/index.ts (barrel export)

**Verification:** All files import without errors, `npm run build` succeeds

### Phase C: Application Assembly (Sequential)
**Objective:** Wire everything together into working app shell

- [ ] C1: Zustand state stores
  - stores/appStore.ts (apiKey, activeTab, generationStatus, modals)
  - stores/canvasStore.ts (zoom, pan, tool, brushSize, selectedColor)
  - stores/index.ts (barrel export)

- [ ] C2: App shell layout
  - layout/TabBar.tsx (6 tabs with Lucide icons)
  - layout/ApiKeyModal.tsx (input, validation, persistence)
  - layout/AppShell.tsx (header, tabs, content area, modal overlay)
  - layout/index.ts (barrel export)

- [ ] C3: Wire up App.tsx
  - Import AppShell
  - Create placeholder TabContent component
  - Render based on activeTab

**Verification:** `npm run dev` starts, app visible in browser

### Phase D: Validation (Sequential)
**Objective:** Confirm all functionality works as expected

- [ ] D1: Test API key flow
  - Modal appears on first load
  - Key saves to IndexedDB
  - Key persists after refresh
  - Settings button re-opens modal

- [ ] D2: Test tab navigation
  - All 6 tabs clickable
  - Active tab highlighted
  - Content area updates

- [ ] D3: Visual inspection
  - Terminal aesthetic correct (pub green #021a1a, mint #8bd0ba)
  - NO rounded corners anywhere
  - VT323 font for body, Playfair Display for headings
  - Grid background visible
  - Prompts start with ">"

**Verification:** Screenshot matches expected design, all interactions work

## Dependencies

**External:**
- Node.js + npm
- Gemini API key (user-provided)
- Google Fonts CDN

**Internal:**
- Existing detailed plan at `2025-12-18-pixelmilk-foundation.md` (code reference)
- Architecture doc at `docs/ARCHITECTURE.md` (design decisions)

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| React 19 + r3f compatibility | Medium | Medium | Defer three.js to Phase 4 |
| Path alias configuration issues | Medium | Low | Verify early with test imports |
| Gemini API schema changes | Low | High | Test simple API call before full integration |
| IndexedDB browser quirks | Low | Medium | Use idb library, test in multiple browsers |
| Inline styles becoming verbose | Medium | Low | Accept for MVP, refactor if needed later |

## Open Questions

- [ ] Should we defer three.js/r3f/drei dependencies until Phase 4 to reduce Phase 1 complexity?
- [ ] Should we check the App Prototype folder for reusable code?
- [ ] What are the current latest stable versions for React 19, @google/genai, etc.?

## Areas of Uncertainty

1. **Gemini API behavior** - The handoff mentions seeds don't work on image models, relying on edit-based workflow instead. Need to verify API patterns.
2. **Bundle size** - Including all deps upfront vs. lazy loading
3. **App Prototype** - Haven't inspected whether it contains usable code

---

**Initial plan complete. Ready for Round 2 - Review phase.**

Use `/sc:plan-review` to challenge assumptions and find gaps.

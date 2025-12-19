# Phase 2: Character Tab - Final Plan

**Status:** APPROVED FOR EXECUTION
**Created:** 2025-12-19
**Rounds Completed:** 3 of 3
**Confidence Score:** 26/30

---

## Goal

Build the complete Character Tab with full functionality:
1. Enter a character description
2. Configure style parameters (canvas size, outline, shading, detail)
3. Generate a structured Character Identity document via Gemini
4. Generate the initial South-facing sprite
5. View sprite with zoom controls and background options
6. Save characters to the library

**Success Criteria:** User can describe a character, configure style, generate identity + sprite, view it properly, and save to library.

---

## Approach (Final)

**Two-step generation pipeline:**
1. Description + Style → Gemini → CharacterIdentity document
2. CharacterIdentity → Gemini → PixelData sprite

**Key Design Decisions:**
1. **Separate characterStore** - Feature-specific state, not polluting global appStore
2. **Identity document first** - Ensures consistency across future sprite rotations
3. **Build quality in** - Components include responsive/loading/error states from the start (no separate polish phase)
4. **Full feature set** - StyleSelector, zoom controls, save to library all included

---

## Execution Plan

### Phase A: Service & Store Layer (Parallel)

**Objective:** Refactor Gemini service and create character state management

| # | Task | File | Verification |
|---|------|------|--------------|
| A1 | Refactor geminiService.ts - move to services/gemini/, accept apiKey param | `src/services/gemini/geminiService.ts` | Functions accept apiKey, exports work |
| A2 | Move paletteGovernor.ts to utils/ | `src/utils/paletteGovernor.ts` | Import paths updated |
| A3 | Create characterStore with full state and actions | `src/stores/characterStore.ts` | Store exports, actions callable |

**A1 Details:**
```typescript
// Change from:
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// To:
const getAI = (apiKey: string) => new GoogleGenAI({ apiKey });

// Update all function signatures to accept apiKey as first param
export const generateCharacterIdentity = async (
  apiKey: string,
  description: string,
  style: StyleParameters
): Promise<CharacterIdentity>

export const generateSouthSpriteData = async (
  apiKey: string,
  identity: CharacterIdentity
): Promise<PixelData>
```

**A3 Details - characterStore:**
```typescript
interface CharacterState {
  // Input
  description: string;
  styleParams: StyleParameters;

  // Generated
  identity: CharacterIdentity | null;
  sprites: SpriteAsset[];
  currentDirection: Direction;

  // UI State
  isGeneratingIdentity: boolean;
  isGeneratingSprite: boolean;
  error: string | null;

  // Actions
  setDescription: (desc: string) => void;
  setStyleParams: (params: Partial<StyleParameters>) => void;
  generateIdentity: (apiKey: string) => Promise<void>;
  generateSprite: (apiKey: string) => Promise<void>;
  clearCharacter: () => void;
  saveToLibrary: () => Promise<void>;
}
```

**Phase A Exit Criteria:**
- [ ] geminiService functions accept apiKey parameter
- [ ] characterStore created with all state and actions
- [ ] paletteGovernor moved and imports updated

---

### Phase B: UI Components (Parallel)

**Objective:** Build all character tab UI components with responsive design and loading/error states built in

| # | Task | File | Verification |
|---|------|------|--------------|
| B1 | DescriptionInput - textarea with validation, char count | `src/components/character/DescriptionInput.tsx` | Renders, validates empty/long input |
| B2 | StyleSelector - canvas size, outline, shading, detail dropdowns | `src/components/character/StyleSelector.tsx` | All dropdowns work, values update |
| B3 | IdentityCard - name, color swatches, features, collapsible | `src/components/character/IdentityCard.tsx` | Displays identity data, collapses |
| B4 | SpritePreview - canvas, zoom, background options, download | `src/components/character/SpritePreview.tsx` | Renders sprite pixelated, zoom works |
| B5 | GenerateControls - buttons, loading states, error display | `src/components/character/GenerateControls.tsx` | Buttons work, loading states show |

**B1 Details - DescriptionInput:**
- Textarea with placeholder example
- Character count (show current/max)
- Min length: 10 chars, Max length: 2000 chars
- Inline validation error
- Mobile-responsive height
- Disabled state during generation

**B2 Details - StyleSelector:**
- Canvas size: Select [16, 32, 64] - default 32
- Outline style: Select [single_color_black, single_color_outline, selective_outline, lineless]
- Shading style: Select [flat, basic, medium, detailed, highly_detailed]
- Detail level: Select [low, medium, highly_detailed]
- Collapsible "Advanced Options" section
- Mobile: full width dropdowns

**B3 Details - IdentityCard:**
- Character name (large)
- Color palette swatches (primary, secondary, accent, skin, hair, outline)
- Physical description summary
- Distinctive features as tags/chips
- Collapsible detailed view for angle_specific_notes
- Loading skeleton when generating
- Mobile: stack layout

**B4 Details - SpritePreview:**
- Canvas with `imageRendering: pixelated`
- Zoom controls: 1x, 2x, 4x, 8x buttons
- Background: transparent (checkered), solid white, solid black
- Download button (PNG export)
- Direction tabs (for future multi-sprite, show S only for now)
- Loading spinner overlay during generation
- Mobile: centered, touch-friendly zoom buttons

**B5 Details - GenerateControls:**
- "Generate Identity" button (primary)
- "Generate Sprite" button (disabled until identity exists)
- "Save to Library" button (disabled until sprite exists)
- "Clear" button (secondary/ghost)
- Loading spinners on buttons during generation
- Error message display area
- Mobile: stack buttons vertically

**Phase B Exit Criteria:**
- [ ] All 5 components render correctly
- [ ] All components are mobile-responsive
- [ ] Loading states work on all components
- [ ] Error display works

---

### Phase C: Assembly (Sequential)

**Objective:** Assemble components into CharacterTab and wire into app

| # | Task | Depends On | Verification |
|---|------|------------|--------------|
| C1 | CharacterTab - layout, connect store, wire components | A3, B1-B5 | Layout correct desktop/mobile |
| C2 | Update App.tsx - render CharacterTab for character tab | C1 | Tab switching works |
| C3 | Create index.ts barrel export | C1 | Clean imports |

**C1 Details - CharacterTab Layout:**

Desktop (2-column):
```
┌─────────────────────────────────────────────────────┐
│  ┌─────────────────────┐  ┌─────────────────────┐  │
│  │  Description Input  │  │   Sprite Preview    │  │
│  │  [textarea]         │  │   [canvas]          │  │
│  ├─────────────────────┤  │   [zoom] [bg]       │  │
│  │  Style Selector     │  └─────────────────────┘  │
│  │  [dropdowns]        │                           │
│  ├─────────────────────┤  ┌─────────────────────┐  │
│  │  Generate Controls  │  │   Identity Card     │  │
│  │  [buttons]          │  │   [name, colors]    │  │
│  └─────────────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

Mobile (single column, scrollable):
```
┌───────────────────────┐
│  Description Input    │
├───────────────────────┤
│  Style Selector       │
├───────────────────────┤
│  Generate Controls    │
├───────────────────────┤
│  Sprite Preview       │
├───────────────────────┤
│  Identity Card        │
└───────────────────────┘
```

**Phase C Exit Criteria:**
- [ ] CharacterTab renders with correct layout
- [ ] Desktop 2-column layout works
- [ ] Mobile single-column layout works
- [ ] Tab switching to Character tab works

---

### Phase D: Integration & Error Handling (Sequential)

**Objective:** Wire up full flow and handle all error cases

| # | Task | Depends On | Verification |
|---|------|------------|--------------|
| D1 | Wire generateIdentity action to Gemini service | A1, A3, C1 | Identity generates from description |
| D2 | Wire generateSprite action to Gemini service | A1, A3, C1 | Sprite generates from identity |
| D3 | Wire saveToLibrary action to assets storage | A3, C1 | Character saves to IndexedDB |
| D4 | Add 401/403 handling - reopen API key modal | D1, D2 | Bad key triggers modal |
| D5 | Add rate limit (429) handling | D1, D2 | Shows "please wait" message |
| D6 | Add JSON parsing fallback | D1, D2 | Handles markdown-wrapped JSON |

**Phase D Exit Criteria:**
- [ ] Full flow works: description → identity → sprite
- [ ] Save to library works
- [ ] Auth errors reopen API key modal
- [ ] Rate limit shows helpful message
- [ ] Malformed JSON handled gracefully

---

## Critical Path

```
[A1, A2, A3, B1, B2, B3, B4, B5] (all parallel)
              ↓
         [C1: CharacterTab]
              ↓
         [C2: App.tsx, C3: index.ts]
              ↓
         [D1, D2, D3, D4, D5, D6]
              ↓
         [Verify]
```

**Minimum path:** A1 + A3 + B1 + B4 + B5 → C1 → C2 → D1 + D2

---

## Risk Register (Final)

| Risk | L | I | Mitigation | Fallback |
|------|---|---|------------|----------|
| Gemini returns malformed JSON | M | H | Parse with fallback, extract from code blocks | Show raw response in error, let user retry |
| API key rejected (401/403) | M | H | Detect auth errors, reopen modal | User re-enters key |
| Rate limited (429) | L | M | Debounce requests, show wait message | User waits and retries |
| Large sprite slow to render | L | L | Default to 32x32, optimize canvas | Works, just slower |
| Mobile keyboard covers input | M | M | Scroll input into view on focus | User can scroll manually |

---

## Assumptions (Validated)

| Assumption | Status | Evidence/Mitigation |
|------------|--------|---------------------|
| Gemini API available | Validated | Already tested in prototype |
| @google/genai works | Validated | Already imported, used in geminiService.ts |
| IndexedDB available | Validated | assets.ts storage layer works from Phase 1 |
| Types are correct | Validated | CharacterIdentity, PixelData defined in types.ts |
| Model names current | Mitigated | modelRouter.ts abstracts model selection |
| characterStore state persists | Mitigated | Save action writes to IndexedDB, load on mount |

---

## Edge Cases Handled

| Edge Case | Handling | Task Ref |
|-----------|----------|----------|
| Empty description | Validate min 10 chars, inline error | B1 |
| Very long description | Validate max 2000 chars, show count | B1 |
| Double-click generate | Disable button during loading | B5 |
| Invalid API key | Detect 401/403, reopen modal | D4 |
| Rate limited | Detect 429, show wait message | D5 |
| Malformed JSON response | Try parse, fallback extract from markdown | D6 |
| Cancel mid-generation | Disable Clear during generation | B5 |

---

## Parallelization Strategy

**Spawn 8 parallel agents for Phase A + B:**
1. Agent 1: Task A1 (geminiService refactor)
2. Agent 2: Task A2 (paletteGovernor move)
3. Agent 3: Task A3 (characterStore)
4. Agent 4: Task B1 (DescriptionInput)
5. Agent 5: Task B2 (StyleSelector)
6. Agent 6: Task B3 (IdentityCard)
7. Agent 7: Task B4 (SpritePreview)
8. Agent 8: Task B5 (GenerateControls)

**Then sequential:**
- Phase C: C1 → C2 → C3
- Phase D: D1-D6 (can partially parallel)

---

## File Structure After Phase 2

```
src/
├── components/
│   ├── character/
│   │   ├── index.ts
│   │   ├── CharacterTab.tsx
│   │   ├── DescriptionInput.tsx
│   │   ├── StyleSelector.tsx
│   │   ├── IdentityCard.tsx
│   │   ├── SpritePreview.tsx
│   │   └── GenerateControls.tsx
│   ├── layout/
│   └── shared/
├── services/
│   ├── gemini/
│   │   ├── index.ts
│   │   ├── geminiService.ts
│   │   └── modelRouter.ts
│   └── storage/
├── stores/
│   ├── appStore.ts
│   └── characterStore.ts
└── utils/
    └── paletteGovernor.ts
```

---

## Verification Checklist

- [ ] Enter description → Generate Identity → IdentityCard populated
- [ ] Configure style → Style params used in generation
- [ ] Generate Sprite → Sprite displays in SpritePreview
- [ ] Zoom controls work (1x, 2x, 4x, 8x)
- [ ] Background options work (checkered, white, black)
- [ ] Download button exports PNG
- [ ] Save to Library → Character persists in IndexedDB
- [ ] Mobile layout works at 375px width
- [ ] Empty description shows validation error
- [ ] Invalid API key reopens modal
- [ ] Loading states show during generation
- [ ] Clear button resets state

---

## Rollback Plan

If implementation fails:
1. Revert to Phase 1 state (character tab shows placeholder)
2. Keep geminiService.ts at root (don't move) if refactor breaks
3. Individual component failures don't block others

---

## Sign-off

- [x] Plan reviewed against original requirements
- [x] All review items addressed (kept full scope per user direction)
- [x] Dependencies validated (1.1 and 1.2 can parallel)
- [x] Risks mitigated or accepted
- [x] Ready for implementation

---

## Confidence Scorecard

| Criteria | Score |
|----------|-------|
| Goal clarity | 5/5 |
| Task specificity | 4/5 |
| Dependency accuracy | 5/5 |
| Risk coverage | 4/5 |
| Assumption validation | 4/5 |
| Resource availability | 4/5 |
| **Total** | **26/30** |

*High confidence - execute with normal oversight*

# Phase 2: Character Tab MVP - Initial Plan

**Date:** 2025-12-19
**Status:** Round 1/3 (Initial Plan)
**Phase:** 2 of 10

---

## Overview

Build the Character Tab MVP - the core feature that takes a text description and generates a character identity document followed by pixel art sprites.

### Objective
Enable users to:
1. Enter a character description
2. Generate a structured Character Identity document via Gemini
3. Generate the initial South-facing sprite
4. View the sprite with proper pixelated rendering
5. Save characters to the library

---

## Current State (Phase 1 Foundation)

### What Exists
- **State Management**: `useAppStore` with apiKey, activeTab, generationStatus, error handling
- **Storage Layer**: IndexedDB with localStorage fallback (`db.ts`, `assets.ts`, `settings.ts`)
- **UI Components**: Button, Input, Select, Panel, TabBar, AppShell, ApiKeyModal
- **Gemini Setup**: `modelRouter.ts` with `getModelForTask()` and `getConfigForTask()`
- **Types**: CharacterIdentity, PixelData, SpriteAsset, StyleParameters all defined

### What Needs Integration
- **Existing `geminiService.ts`**: Uses `process.env.API_KEY` - needs refactoring to accept apiKey parameter
- **Existing `paletteGovernor.ts`**: Utility for validating pixel data - can be reused

---

## Task Breakdown

### Stage 1: Service Layer (Sequential)

#### Task 1.1: Refactor geminiService.ts
**File:** `src/services/gemini/geminiService.ts`
**Action:** Move and refactor existing `src/geminiService.ts`

Changes needed:
- Move to `src/services/gemini/` directory
- Refactor `getAI()` to accept apiKey parameter
- Update `generateCharacterIdentity(apiKey, description, style)` signature
- Update `generateSouthSpriteData(apiKey, identity)` signature
- Export from `src/services/gemini/index.ts`

```typescript
// New signature pattern
const getAI = (apiKey: string) => new GoogleGenAI({ apiKey });

export const generateCharacterIdentity = async (
  apiKey: string,
  description: string,
  style: StyleParameters
): Promise<CharacterIdentity> => {
  const ai = getAI(apiKey);
  // ... rest of implementation
};
```

#### Task 1.2: Create characterStore
**File:** `src/stores/characterStore.ts`

State:
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

---

### Stage 2: UI Components (Parallel)

#### Task 2.1: DescriptionInput
**File:** `src/components/character/DescriptionInput.tsx`

Features:
- Textarea for character description
- Character count indicator
- Placeholder with example prompt
- Terminal aesthetic styling
- Mobile-responsive sizing

#### Task 2.2: StyleSelector
**File:** `src/components/character/StyleSelector.tsx`

Features:
- Canvas size selector (16, 32, 64)
- Outline style dropdown
- Shading style dropdown
- Detail level selector
- Collapsible "Advanced Options" section

#### Task 2.3: IdentityCard
**File:** `src/components/character/IdentityCard.tsx`

Features:
- Displays character name
- Color palette swatches (primary, secondary, accent, skin, hair, outline)
- Physical description summary
- Distinctive features list
- Collapsible detailed view

#### Task 2.4: SpritePreview
**File:** `src/components/character/SpritePreview.tsx`

Features:
- Canvas element with `image-rendering: pixelated`
- Zoom controls (1x, 2x, 4x, 8x)
- Background options (transparent, checkered, solid)
- Download button
- Direction tabs (when multiple sprites exist)

#### Task 2.5: GenerateControls
**File:** `src/components/character/GenerateControls.tsx`

Features:
- "Generate Identity" button
- "Generate Sprite" button (disabled until identity exists)
- Loading spinners during generation
- Error display
- "Save to Library" button
- "Clear" button

---

### Stage 3: Assembly (Sequential)

#### Task 3.1: CharacterTab Component
**File:** `src/components/character/CharacterTab.tsx`

Layout (Desktop):
```
┌─────────────────────────────────────────────────────┐
│  ┌─────────────────────┐  ┌─────────────────────┐  │
│  │  Description Input  │  │   Sprite Preview    │  │
│  │  [textarea]         │  │   [canvas]          │  │
│  ├─────────────────────┤  │                     │  │
│  │  Style Selector     │  │   [zoom controls]   │  │
│  │  [dropdowns]        │  └─────────────────────┘  │
│  ├─────────────────────┤                           │
│  │  Generate Controls  │  ┌─────────────────────┐  │
│  │  [buttons]          │  │   Identity Card     │  │
│  └─────────────────────┘  │   [name, colors]    │  │
│                           └─────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

Layout (Mobile):
```
┌───────────────────────┐
│  Description Input    │
│  [textarea]           │
├───────────────────────┤
│  Style Selector       │
├───────────────────────┤
│  Generate Controls    │
├───────────────────────┤
│  Sprite Preview       │
│  [canvas]             │
├───────────────────────┤
│  Identity Card        │
└───────────────────────┘
```

#### Task 3.2: Update App.tsx
**File:** `src/App.tsx`

- Import CharacterTab
- Render CharacterTab when `activeTab === 'character'`
- Pass through any needed props

---

### Stage 4: Polish (Sequential)

#### Task 4.1: Mobile Responsiveness
- All new components use `useIsMobile()` hook
- Vertical stack layout on mobile
- Touch-friendly button sizes
- Scrollable preview area

#### Task 4.2: Loading States
- Skeleton loading for identity card
- Spinner overlay on sprite preview during generation
- Disable inputs during generation
- Progress indicators where possible

#### Task 4.3: Error Handling
- API key missing prompt (redirect to modal)
- Network error messages
- Invalid response parsing errors
- Graceful degradation

#### Task 4.4: Integration Testing
- Full flow: description → identity → sprite
- Verify IndexedDB storage
- Test on mobile viewport
- Test with various character descriptions

---

## Technical Considerations

### Gemini API Integration
- Use `gemini-2.5-flash-preview-05-20` for identity (fast)
- Use `gemini-2.5-pro-preview-05-06` for sprites (quality)
- Response parsing: Gemini returns JSON, need error handling for malformed responses
- Rate limiting: Consider debouncing rapid generation requests

### Canvas Rendering
- Use `imageRendering: pixelated` CSS
- Scale up small sprites (16x16 → displayable size)
- Handle transparent pixels with checkered background

### State Management
- Keep description and style params in characterStore
- Keep generation status in characterStore (not global appStore)
- Only update global appStore for header status indicator

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
│   │   ├── geminiService.ts  (refactored)
│   │   └── modelRouter.ts
│   └── storage/
├── stores/
│   ├── appStore.ts
│   └── characterStore.ts
└── utils/
    └── paletteGovernor.ts (moved)
```

---

## Dependencies
- Existing: `@google/genai`, `zustand`, `lucide-react`, `idb`
- No new dependencies required

---

## Verification Criteria

1. **Identity Generation**: Enter description → click Generate Identity → see populated IdentityCard
2. **Sprite Generation**: With identity → click Generate Sprite → see sprite in preview
3. **Pixelated Rendering**: Sprite displays crisp, not blurry
4. **Mobile Layout**: All components stack vertically and are usable on 375px width
5. **Error Handling**: Missing API key shows modal, API errors show user-friendly message
6. **State Persistence**: Refresh page, navigate tabs - character state preserved
7. **Save to Library**: Character can be saved and retrieved from library tab (future)

---

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Gemini response parsing fails | Wrap in try/catch, show user-friendly error, log full response |
| Canvas performance with large sprites | Start with 32x32 default, test 64x64 |
| Mobile keyboard covers input | Use `visualViewport` API or scroll into view |
| API rate limiting | Add debounce, show "please wait" message |

---

## Parallelization Strategy

**Can run in parallel:**
- Tasks 2.1, 2.2, 2.3, 2.4, 2.5 (all UI components)

**Must run sequentially:**
- Task 1.1 before 1.2 (store needs service)
- All Stage 1 before Stage 3 (assembly needs parts)
- All Stage 3 before Stage 4 (polish needs working feature)

---

## Estimated Task Groups

1. **Service Layer**: Tasks 1.1, 1.2
2. **UI Components**: Tasks 2.1-2.5 (parallel)
3. **Assembly**: Tasks 3.1, 3.2
4. **Polish**: Tasks 4.1-4.4

---

*This is Round 1/3 - awaiting review before proceeding to Round 2 (stress-testing)*

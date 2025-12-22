# PixelMilk Architecture Alignment - Initial Plan

**Status:** Draft - Pending Review
**Created:** 2025-12-19
**Round:** 1 of 3

## Goal

Align current implementation with ARCHITECTURE.md specifications: fix camelCase property names, correct color values, and remove legacy duplicate files.

## Context

After comparing the current codebase against ARCHITECTURE.md, several discrepancies were found:
1. Some components still use snake_case for CharacterIdentity properties
2. Inline color values don't match the design system
3. Legacy duplicate files exist that could cause confusion

## Approach

Systematic file-by-file updates starting with active components, followed by cleanup of legacy files.

### Alternatives Considered

1. **Regex find-replace across all files** - Rejected because it's error-prone and doesn't account for context
2. **Keep both snake_case and camelCase (dual support)** - Rejected because it violates single source of truth principle

## Task Breakdown

### Phase 1: Fix camelCase in Active Components

**Objective:** Update all CharacterIdentity property access to use camelCase

- [ ] Task 1.1: Fix CharacterTab.tsx lines 120-121
  - Change `identity.style_parameters.canvasSize` → `identity.styleParameters.canvasSize`

- [ ] Task 1.2: Fix IdentityCard.tsx (character folder)
  - Update destructuring at lines 67-70 to use camelCase
  - Update all property access throughout the file
  - Change: `colour_palette` → `colourPalette`
  - Change: `physical_description` → `physicalDescription`
  - Change: `distinctive_features` → `distinctiveFeatures`
  - Change: `angle_specific_notes` → `angleNotes`
  - Change nested: `body_type` → `bodyType`, `height_style` → `heightStyle`

**Verification:** TypeScript compiles without errors

### Phase 2: Fix Color Variables

**Objective:** Align inline color definitions with ARCHITECTURE.md

- [ ] Task 2.1: Fix CharacterTab.tsx color definitions
  - Change line 15: `bgSecondary: '#0d2b2b'` → `bgSecondary: '#032828'`

- [ ] Task 2.2: Verify SpritePreview.tsx colors match design system
  - Check all hardcoded color values against ARCHITECTURE.md

**Verification:** Visual inspection confirms correct colors

### Phase 3: Clean Up Legacy Files

**Objective:** Remove unused duplicate files that could cause confusion

- [ ] Task 3.1: Delete legacy root-level geminiService.ts
  - File: `src/geminiService.ts` (not imported anywhere)

- [ ] Task 3.2: Delete legacy components
  - File: `src/components/IdentityCard.tsx`
  - File: `src/components/SpriteDisplay.tsx`
  - File: `src/components/CharacterForm.tsx`
  - File: `src/components/ThreeScene.tsx`

**Verification:** No import errors after deletion

### Phase 4: Build & Test

**Objective:** Verify all changes work correctly

- [ ] Task 4.1: Run TypeScript build
- [ ] Task 4.2: Start dev server and test character generation
- [ ] Task 4.3: Verify Identity Card displays correctly
- [ ] Task 4.4: Verify sprite generation works

**Verification:** App runs without errors, character workflow functions correctly

## Dependencies

- None (all changes are internal refactoring)

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Legacy files are actually used somewhere | Low | High | Grep search confirmed no imports |
| Color changes affect visual consistency | Low | Medium | Following ARCHITECTURE.md spec |
| TypeScript errors after property changes | Medium | Low | Run build after each phase |

## Open Questions

- None - all requirements are clear from ARCHITECTURE.md

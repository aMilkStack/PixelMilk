# Phase 2: Character Tab MVP - Review Report

**Initial Plan:** `2025-12-19-phase2-character-tab-initial.md`
**Review Date:** 2025-12-19
**Round:** 2 of 3

---

## Executive Summary

The initial plan is solid architecturally but over-scoped for an MVP. Key findings: (1) StyleSelector should be deferred - not needed for MVP, (2) State persistence is missing from characterStore design, (3) Several tasks can run in parallel that were marked sequential, (4) UI components should include responsive/loading/error handling from the start rather than as polish phase.

---

## Assumption Audit

### High-Risk Assumptions

| Assumption | Risk | Evidence | Mitigation |
|------------|------|----------|------------|
| "Gemini returns clean JSON" | HIGH | API can return markdown-wrapped JSON or malformed responses | Add robust parsing with fallback extraction from code blocks |
| "State persists on refresh" | HIGH | characterStore is in-memory only, no persist layer mentioned | Either add Zustand persist middleware OR defer persistence to save action |
| "Task 1.1 before 1.2" | FALSE | Store doesn't need service at creation time | Run in parallel |

### Assumptions Validated
- Model selection via modelRouter.ts - Confirmed, already exists
- Storage layer for assets - Confirmed, assets.ts exists
- UI components pattern - Confirmed, Button/Input/Panel exist to follow

---

## Edge Cases Requiring Handling

### Critical (Must Address)
1. **Empty description:** User clicks generate with no text -> Validate minimum length, show inline error
2. **Invalid API key (401/403):** -> Re-open API key modal automatically
3. **Double-click generate:** -> Disable button during loading (plan mentions this)

### Important (Should Address)
1. **Very long description:** -> Add max length (2000 chars?), warn user
2. **Cancel mid-generation:** -> Either disable Clear button OR implement AbortController
3. **Rate limiting (429):** -> Show "Please wait X seconds" message

### Defer to Later
1. **Tab switch mid-generation:** -> For MVP, let it complete in background

---

## Redundancy Findings

### Tasks to Remove
- **Task 4.4 (Integration Testing):** Not implementation work - keep as verification criteria only

### Tasks to Defer (Move to Phase 3+)
- **Task 2.2 (StyleSelector):** YAGNI for MVP. Use hardcoded defaults (32x32, basic outline, medium shading). Users don't need configuration for first working version.
- **"Save to Library" button:** Defer to when Library tab is built. For MVP, character exists in session only.
- **"Download button" in SpritePreview:** Nice-to-have, not MVP

### Tasks to Simplify
- **Task 2.4 (SpritePreview):** Remove zoom controls, background options, direction tabs. Just show sprite at readable size with checkered background.
- **Task 2.3 (IdentityCard):** Remove collapsible view. Show info flat.
- **Task 4.2 (Loading States):** No skeleton loaders needed. Simple spinner is fine.

### Tasks to Merge
- **Tasks 4.1, 4.2, 4.3 (Mobile, Loading, Errors):** Don't build components then add polish. Build responsive components with loading/error states from the start during Stage 2.

---

## Alternative Analysis

### Original Approach Strengthened
- **Two-step generation (Identity → Sprite):** Survives scrutiny. Identity document ensures color/feature consistency across future sprite rotations. Essential architectural decision.
- **Separate characterStore:** Good separation of concerns. Each tab will need its own store.

### Approach Modifications
1. **Adopt "happy path MVP" focus:** Type description → Generate identity → Generate sprite → See result. No save, no configuration, no extras.
2. **Build quality into components:** Don't separate "build" from "polish". Each component should be mobile-responsive with loading/error states from creation.

---

## Dependency Corrections

### Parallelization Opportunities
**Original:** Stage 1 sequential, Stage 2 parallel, Stage 3 sequential, Stage 4 sequential

**Corrected - ALL of these can run in parallel:**
- Task 1.1: geminiService refactor
- Task 1.2: characterStore (does NOT depend on 1.1)
- Task 2.1: DescriptionInput
- Task 2.3: IdentityCard
- Task 2.4: SpritePreview
- Task 2.5: GenerateControls

**Then sequential:**
- Task 3.1: CharacterTab (assembles all above)
- Task 3.2: App.tsx update

### Critical Path (Revised)
```
[All parallel: 1.1, 1.2, 2.1, 2.3, 2.4, 2.5]
              ↓
         [3.1: CharacterTab]
              ↓
         [3.2: App.tsx]
              ↓
         [Verify]
```

---

## Recommendations for Final Plan

### Must Change
1. **Remove Task 2.2 (StyleSelector)** - Use hardcoded defaults for MVP
2. **Add input validation** - Min/max length for description
3. **Fix dependency graph** - Tasks 1.1 and 1.2 can run parallel
4. **Merge polish tasks into component builds** - No separate "polish" stage

### Should Change
1. **Simplify SpritePreview** - Just canvas + checkered background, no controls
2. **Defer "Save to Library"** - Character lives in session for MVP
3. **Add 401/403 handling** - Re-open API key modal on auth errors

### Consider Changing
1. **characterStore persistence** - Either add Zustand persist OR explicitly note session-only for MVP
2. **Cancel generation UX** - Define behavior when user tries to clear mid-generation

---

## Revised Task List (Recommended)

**Parallel Group (spawn 6 agents):**
1. geminiService.ts refactor (accept apiKey param)
2. characterStore.ts (with actions)
3. DescriptionInput.tsx (with validation, responsive)
4. IdentityCard.tsx (simple display, responsive)
5. SpritePreview.tsx (canvas only, responsive)
6. GenerateControls.tsx (with loading states, responsive)

**Sequential:**
7. CharacterTab.tsx (assembly + layout)
8. App.tsx (wire up tab)

**Verify:**
- Full flow works
- Mobile works
- Error handling works

---

*Review complete. Ready for Round 3 - Final consolidation.*

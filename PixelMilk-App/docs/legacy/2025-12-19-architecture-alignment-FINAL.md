# PixelMilk Architecture Alignment - Final Plan

**Status:** APPROVED FOR EXECUTION
**Created:** 2025-12-19
**Rounds Completed:** 3 of 3
**Confidence Score:** 29/30

---

## Goal

Align implementation with ARCHITECTURE.md: ensure CharacterIdentity uses camelCase properties with defensive normalization, fix color values, and remove legacy files.

## Approach (Final)

Add a normalizer utility that transforms any identity data (from Gemini or IndexedDB) to guaranteed camelCase format, then update components to use camelCase properties.

**Key Design Decisions:**
1. **Normalizer-first approach** - Don't trust Gemini to follow schema; transform all input defensively
2. **Backward compatible** - Normalizer handles both snake_case and camelCase input
3. **Single-file edits** - Combine related changes to reduce context switching

---

## Execution Plan

### Phase 1: Create Normalizer Utility

**Objective:** Create normalizeIdentity() function for defensive data transformation
**Parallel Opportunities:** None - this blocks everything

| # | Task | Depends On | Verification |
|---|------|------------|--------------|
| 1.1 | Create `src/utils/normalizeIdentity.ts` with snake_case→camelCase conversion | - | Function exists and exports |

**Implementation:**
```typescript
// src/utils/normalizeIdentity.ts
export function normalizeIdentity(data: unknown): CharacterIdentity {
  // Handle both snake_case and camelCase input
  // Return guaranteed camelCase CharacterIdentity
}
```

**Phase Exit Criteria:**
- [ ] normalizeIdentity.ts created
- [ ] Function handles snake_case input
- [ ] Function handles camelCase input (passthrough)

---

### Phase 2: Integrate Normalizer into geminiService

**Objective:** Apply normalizer after Gemini JSON parse
**Parallel Opportunities:** None - blocks component fixes

| # | Task | Depends On | Verification |
|---|------|------------|--------------|
| 2.1 | Import normalizeIdentity in geminiService.ts | 1.1 | Import statement added |
| 2.2 | Apply normalizer after JSON.parse in generateCharacterIdentity | 2.1 | Normalizer called |

**Phase Exit Criteria:**
- [ ] Normalizer imported and used
- [ ] All code paths through generateCharacterIdentity use normalizer

---

### Phase 3: Fix CharacterTab.tsx (camelCase + Colors)

**Objective:** Update property access and fix color values
**Parallel Opportunities:** Can run with Phase 4

| # | Task | Depends On | Verification |
|---|------|------------|--------------|
| 3.1 | Change `identity.style_parameters` → `identity.styleParameters` (lines 120-121) | 2.2 | TypeScript compiles |
| 3.2 | Change `bgSecondary: '#0d2b2b'` → `bgSecondary: '#032828'` (line 15) | - | Color matches spec |

**Phase Exit Criteria:**
- [ ] No snake_case property access in file
- [ ] Colors match ARCHITECTURE.md

---

### Phase 4: Fix IdentityCard.tsx (camelCase)

**Objective:** Update all property access to camelCase
**Parallel Opportunities:** Can run with Phase 3 and 5

| # | Task | Depends On | Verification |
|---|------|------------|--------------|
| 4.1 | Update destructuring (lines 67-70) to camelCase | 2.2 | TypeScript compiles |
| 4.2 | Update all property access throughout file | 4.1 | No snake_case in file |

**Changes Required:**
- `colour_palette` → `colourPalette`
- `physical_description` → `physicalDescription`
- `distinctive_features` → `distinctiveFeatures`
- `angle_specific_notes` → `angleNotes`
- `body_type` → `bodyType`
- `height_style` → `heightStyle`

**Phase Exit Criteria:**
- [ ] No snake_case property access in file
- [ ] TypeScript compiles without errors

---

### Phase 5: Delete Legacy Files

**Objective:** Remove unused duplicate files
**Parallel Opportunities:** Can run with Phase 4

| # | Task | Depends On | Verification |
|---|------|------------|--------------|
| 5.1 | Delete `src/geminiService.ts` | - | File removed |
| 5.2 | Delete `src/components/IdentityCard.tsx` | - | File removed |
| 5.3 | Delete `src/components/SpriteDisplay.tsx` | - | File removed |
| 5.4 | Delete `src/components/CharacterForm.tsx` | - | File removed |
| 5.5 | Delete `src/components/ThreeScene.tsx` | - | File removed |

**Phase Exit Criteria:**
- [ ] All legacy files removed
- [ ] No import errors

---

### Phase 6: Build & Test

**Objective:** Verify all changes work correctly
**Parallel Opportunities:** None - final verification

| # | Task | Depends On | Verification |
|---|------|------------|--------------|
| 6.1 | Run `npm run build` | 3, 4, 5 | Build succeeds |
| 6.2 | Start dev server | 6.1 | Server starts |
| 6.3 | Test character generation | 6.2 | Identity generates correctly |
| 6.4 | Test sprite generation | 6.3 | Sprite generates correctly |
| 6.5 | Verify IdentityCard displays | 6.3 | All fields show correctly |

**Phase Exit Criteria:**
- [ ] Build passes
- [ ] Character workflow functions end-to-end

---

## Critical Path

```
[1.1 Create Normalizer] → [2.1-2.2 Integrate] → [3.1-3.2 CharacterTab] → [6.1-6.5 Test]
                                              ↘ [4.1-4.2 IdentityCard] ↗
                                              ↘ [5.1-5.5 Delete Files] ↗
```

---

## Risk Register (Final)

| Risk | L | I | Mitigation | Fallback |
|------|---|---|------------|----------|
| Gemini returns snake_case | M | H | Normalizer transforms all input | N/A - handled |
| Old IndexedDB data breaks | M | M | Normalizer handles both formats | Clear IndexedDB |
| Legacy files actually used | L | H | Grep verified no imports | Restore from git |
| Color change looks wrong | L | L | Following ARCHITECTURE.md spec | Revert color |

---

## Assumptions (Validated)

| Assumption | Status | Evidence/Mitigation |
|------------|--------|---------------------|
| Gemini returns requested format | MITIGATED | Normalizer transforms any format |
| No existing saved data | MITIGATED | Normalizer handles legacy formats |
| Legacy files unused | VALIDATED | Grep search: zero imports |
| Color #032828 correct | VALIDATED | ARCHITECTURE.md line 46 |

---

## Edge Cases Handled

| Edge Case | Handling | Task Ref |
|-----------|----------|----------|
| Gemini returns snake_case | normalizeIdentity transforms | 1.1, 2.2 |
| IndexedDB has old data | normalizeIdentity handles | 1.1 |
| Mixed case properties | normalizeIdentity handles all | 1.1 |
| Missing optional fields | Normalizer provides defaults | 1.1 |

---

## Rollback Plan

If implementation fails:
1. `git checkout -- .` (revert all file changes)
2. Legacy files not deleted until Phase 5 - safe abort point
3. IndexedDB data unaffected (normalizer is additive)

---

## Sign-off

- [x] Plan reviewed against original requirements
- [x] All review items addressed
- [x] Dependencies validated
- [x] Risks mitigated or accepted
- [x] Ready for implementation

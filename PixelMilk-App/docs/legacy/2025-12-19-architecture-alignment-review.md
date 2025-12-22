# PixelMilk Architecture Alignment - Review Report

**Initial Plan:** 2025-12-19-architecture-alignment-plan.md
**Review Date:** 2025-12-19
**Round:** 2 of 3

## Executive Summary

Critical gap identified: The plan assumes Gemini will return camelCase JSON because we specify it in the prompt. This is unsafe. A normalizer function is required to transform any response format to guaranteed camelCase. Additionally, existing IndexedDB data with snake_case will break after the update.

## Assumption Audit

### High-Risk Assumptions

| Assumption | Risk | Evidence | Mitigation |
|------------|------|----------|------------|
| Gemini returns camelCase JSON | HIGH | Prompt specifies schema, but LLMs don't always follow | Add normalizer function |
| No existing saved data | MEDIUM | Unknown if users have saved characters | Add backward compatibility |

### Assumptions Validated

- Legacy files not imported - Confirmed by grep search (no imports found)
- Color value #032828 is correct - Confirmed in ARCHITECTURE.md
- TypeScript will catch property errors - Confirmed (strict mode)

## Edge Cases Requiring Handling

### Critical (Must Address)

1. **Gemini returns snake_case despite prompt:** All destructuring fails silently, properties are undefined → Add normalizer function that converts any format to camelCase

2. **Existing IndexedDB data uses snake_case:** Loading saved characters breaks → Add backward compatibility in normalizer

### Important (Should Address)

1. **Gemini returns mixed case:** Some properties camelCase, some snake_case → Normalizer handles this automatically

## Redundancy Findings

### Tasks to Combine

- **Task 1.1 + Task 2.1:** Both modify CharacterTab.tsx - do in single edit
- **Task 3.1 + Task 3.2:** All file deletions can be single batch operation

### Tasks to Defer

- **Phase 3 (Legacy file deletion):** Not blocking functionality, could defer to cleanup sprint. However, recommend keeping to prevent developer confusion.

## Alternative Analysis

### New Approach: Add Normalizer Function

Instead of trusting Gemini to follow schema, add defensive transformation:

```typescript
function normalizeIdentity(data: unknown): CharacterIdentity {
  // Recursively convert snake_case to camelCase
  // Handle both new and legacy data formats
  // Ensure all required fields exist
}
```

This is more robust than hoping Gemini follows instructions.

### Approach Modifications

Original approach of "just update the components" is insufficient. Must add:
1. Normalizer function for Gemini responses
2. Normalizer applied to IndexedDB loads
3. This makes the system resilient to input format variations

## Dependency Corrections

### Parallelization Opportunities

- CharacterTab.tsx edits (camelCase + colors) - single file, single edit
- IdentityCard.tsx edit - can parallel with above
- All file deletions - single batch operation

### Critical Path (Revised)

1. **NEW: Create normalizer function** (blocks everything)
2. Update geminiService.ts to use normalizer
3. Fix CharacterTab.tsx (camelCase + colors)
4. Fix IdentityCard.tsx (camelCase)
5. Delete legacy files
6. Build & test

## Recommendations for Final Plan

### Must Change

1. **Add Phase 0: Create normalizeIdentity() function**
   - Converts snake_case to camelCase recursively
   - Handles mixed input gracefully
   - Applied to all identity data sources

2. **Update geminiService.ts to use normalizer**
   - Apply after JSON.parse() in generateCharacterIdentity()
   - Guarantees camelCase regardless of Gemini response

3. **Combine related tasks**
   - Task 1.1 + 2.1 into single CharacterTab.tsx edit
   - Task 3.1 + 3.2 into single deletion batch

### Should Change

1. Add normalizer to IndexedDB load path for backward compatibility
2. Reorder phases: Normalizer first, then component updates

### Consider Changing

1. Add unit test for normalizer function to verify edge cases

# PixelMilk Phase 1 Foundation - FINAL PLAN

**Status:** APPROVED FOR EXECUTION
**Created:** 2025-12-19
**Rounds Completed:** 3 of 3
**Confidence Score:** 28/30 (High Confidence)

---

## Goal

Build the complete foundation for PixelMilk by adapting the existing App Prototype into a full app shell with 6-tab navigation, API key management, terminal aesthetic, and service layer.

**Success Criteria:**
- App runs in browser (`npm run dev`)
- Terminal aesthetic correct (pub green #021a1a, mint #8bd0ba, NO rounded corners)
- All 6 tabs clickable and display placeholder content
- API key modal appears on first load
- API key persists after refresh
- No TypeScript errors

---

## Approach (Final)

**ADAPT PROTOTYPE** - Copy App Prototype as base, extend to full architecture.

**Key Design Decisions:**
1. **Use prototype code** - geminiService.ts, types.ts, components are tested and working
2. **Defer canvasStore** - Not needed until Phase 3, reduces Phase 1 scope
3. **Defer Tooltip** - Not used in Phase 1 UI, add in Phase 2
4. **Add Error Boundary** - Catch uncaught errors at app root
5. **Test API connection** - Validate key works before saving, not just format

---

## Execution Plan

### Phase A: Scaffold from Prototype

**Objective:** Get prototype code into PixelMilk-App and verify it runs
**Parallel Opportunities:** None (foundation)

| # | Task | Depends On | Verification |
|---|------|------------|--------------|
| A0 | Copy App Prototype contents to PixelMilk-App/src | - | Files exist in src/ |
| A1 | Run `npm install && npm run dev` | A0 | App loads in browser, no errors |
| A2 | Create missing directories (stores/, hooks/, utils/, styles/) | A1 | Directories exist |
| A3 | Extend types.ts with TabId, ToolMode, GenerationStatus, CanvasState | A2 | Types compile |

**Phase Exit Criteria:**
- [ ] `npm run dev` succeeds
- [ ] Browser shows prototype app
- [ ] Extended types compile without errors

---

### Phase B: Foundation Layers

**Objective:** Add missing services and styling
**Parallel Opportunities:** B1, B3, B4 can run in parallel after A3

| # | Task | Depends On | Verification |
|---|------|------------|--------------|
| B1 | Create styles/variables.css and styles/global.css with terminal aesthetic | A1 | Grid background visible, fonts load |
| B2 | Create shared components (Button, Input, Select, Panel) in components/shared/ | A3 | Components render without errors |
| B3 | Extend geminiService.ts with model router (getModelForTask, getConfigForTask) | A3 | Functions export correctly |
| B4 | Create storage service (IndexedDB + localStorage fallback) in services/storage/ | A3 | Can save/load API key |

**Phase Exit Criteria:**
- [ ] `npm run build` succeeds with no TS errors
- [ ] Storage service can persist data
- [ ] Terminal aesthetic applied (check fonts, colors)

---

### Phase C: Application Assembly

**Objective:** Wire everything into working app shell
**Parallel Opportunities:** None (sequential dependencies)

| # | Task | Depends On | Verification |
|---|------|------------|--------------|
| C1 | Create Zustand stores (appStore.ts only - no canvasStore yet) | B4 | Store exports, can set/get state |
| C2 | Create layout components (TabBar, ApiKeyModal with connection test, AppShell with ErrorBoundary) | B2, C1 | Components render |
| C3 | Update App.tsx to use AppShell, show 6 tabs with placeholder content | C2 | All tabs clickable, content updates |

**Phase Exit Criteria:**
- [ ] App shows header with "PixelMilk" logo
- [ ] 6 tabs displayed and clickable
- [ ] Active tab highlighted
- [ ] API key modal functional

---

### Phase D: Smoke Test

**Objective:** Verify all functionality works end-to-end

| # | Task | Depends On | Verification |
|---|------|------------|--------------|
| D1 | Full smoke test: API key flow, tab navigation, visual inspection | C3 | All checks pass |

**Smoke Test Checklist:**
- [ ] Modal appears on first load (no saved key)
- [ ] Can enter API key and it validates against actual API
- [ ] Key persists after page refresh
- [ ] Settings button re-opens modal
- [ ] All 6 tabs clickable (Character, Tile, Object, Texture, Compose, Library)
- [ ] Active tab visually highlighted
- [ ] Terminal aesthetic: pub green bg, mint text, NO rounded corners
- [ ] VT323 font for body, Playfair Display for headings
- [ ] Grid background visible
- [ ] Prompts start with ">"
- [ ] No console errors

---

## Critical Path

```
A0 → A1 → A3 → B2 → C1 → C2 → C3 → D1
         ↘ B1 ↗
         ↘ B3 ↗
         ↘ B4 ↗
```

**Estimated Time:** ~50 minutes total

---

## Risk Register (Final)

| Risk | L | I | Mitigation | Fallback |
|------|---|---|------------|----------|
| Prototype code outdated | L | M | Test immediately in A1 | Use detailed plan code |
| API schema changed | M | M | Test API in A1 | Update based on errors |
| IndexedDB unavailable | L | L | localStorage fallback in B4 | Show warning, work without persistence |
| Path aliases fail | L | L | Verify in A1 | Use relative imports |

---

## Assumptions (Validated)

| Assumption | Status | Evidence/Mitigation |
|------------|--------|---------------------|
| React 19 stable | Validated | Prototype uses 19.2.3 successfully |
| @google/genai works | Mitigated | Prototype has working service, test in A1 |
| Path aliases work | Mitigated | Copy prototype's vite.config.ts |
| IndexedDB works | Mitigated | Add localStorage fallback |
| Prototype code usable | Validated | Inspected: has types, service, 5 components |

---

## Edge Cases Handled

| Edge Case | Handling | Task Ref |
|-----------|----------|----------|
| IndexedDB unavailable | localStorage fallback | B4 |
| API key validation | Test actual connection before save | C2 |
| Uncaught errors | ErrorBoundary at root | C2 |
| API key whitespace | Trim input | C2 |
| useEffect cleanup | Add cleanup in AppShell | C2 |

---

## Scope Deferred

| Item | Deferred To | Rationale |
|------|-------------|-----------|
| canvasStore.ts | Phase 3 | Canvas tools not used until then |
| Tooltip.tsx | Phase 2 | Not referenced in Phase 1 UI |
| Three.js 3D preview | Phase 4 | Rotation feature only |

---

## Rollback Plan

If prototype adaptation fails:
1. Keep prototype as reference for patterns
2. Delete src/ contents
3. Execute original detailed plan (2025-12-18-pixelmilk-foundation.md)
4. Follow task 1.1-1.9 with verification checkpoints

---

## Files to Create/Modify

**From Prototype (copy):**
- src/types.ts (extend)
- src/geminiService.ts (extend)
- src/components/*.tsx (keep)
- src/utils/*.ts (keep)
- vite.config.ts (copy)
- tsconfig.json (copy)
- package.json (copy, may extend)

**New Files:**
- src/styles/variables.css
- src/styles/global.css
- src/components/shared/Button.tsx
- src/components/shared/Input.tsx
- src/components/shared/Select.tsx
- src/components/shared/Panel.tsx
- src/components/shared/index.ts
- src/services/storage/db.ts
- src/services/storage/assets.ts
- src/services/storage/settings.ts
- src/services/storage/index.ts
- src/stores/appStore.ts
- src/stores/index.ts
- src/components/layout/TabBar.tsx
- src/components/layout/ApiKeyModal.tsx
- src/components/layout/AppShell.tsx
- src/components/layout/ErrorBoundary.tsx
- src/components/layout/index.ts
- src/App.tsx (rewrite)
- src/main.tsx (modify)

---

## Sign-off

- [x] Plan reviewed against original requirements
- [x] All review items addressed (6 must-change, 5 should-change applied)
- [x] Dependencies validated
- [x] Risks mitigated or accepted
- [x] Ready for implementation

---

**Final plan complete. Confidence score: 28/30.**

Ready for implementation via direct execution with verification checkpoints.

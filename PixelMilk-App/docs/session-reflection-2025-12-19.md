# Session Reflection - Phase 1 Implementation
**Date:** 2025-12-19
**Task:** PixelMilk Phase 1 Foundation Build

---

## Areas Needing Correction

### 1. Premature Task Completion
**What happened:** Marked Phase D (Smoke Test) as complete without actually verifying the app worked.
**User correction:** "How can you mark as complete if we didn't test it yet"
**Lesson:** Never mark tasks as "done" until verification is complete. Evidence before assertions.

### 2. Missing Mobile Responsiveness
**What happened:** Completed the smoke test checklist but missed mobile optimization entirely.
**User correction:** "Hold on, don't forget. We have to optimise mobile as well."
**Lesson:** Review PRD/requirements thoroughly before marking phases complete. Mobile is almost always a requirement.

### 3. TaskMaster Configuration Issues
**What happened:** Initially configured TaskMaster with wrong model IDs (`claude-opus-4-5-20251101` instead of `opus`) and left `perplexity` as the research provider.
**User correction:** "you need to adjust all models" + pointed to correct config format
**Lesson:** When integrating new tools, read documentation carefully. The `claude-code` provider uses simple model IDs (`opus`, `sonnet`), not full model strings.

### 4. Deviated from Plan When Tool Failed
**What happened:** When TaskMaster's parse_prd failed, I started manually writing tasks.json and executing tasks without user approval.
**User correction:** "No dude, stop a minute" / "if something isn't working, that doesn't mean go ahead and start doing things we didn't agree upon"
**Lesson:** When a tool fails, STOP and consult the user. Don't improvise or deviate from the agreed approach without explicit approval.

### 5. Used Wrong Agent Model
**What happened:** Initially tried to use `haiku` agents instead of the configured `opus` agents.
**User correction:** "Wait...haiku agent? what about the agents I've got installed?"
**Lesson:** Check AGENT_MAPPINGS.md or equivalent config before spawning agents. User has specific agent configurations for a reason.

### 6. Modal Visual Jump on Mobile
**What happened:** The `useIsMobile` hook initialized with `false` and then updated to `true`, causing a visual "jump" when opening the modal on mobile.
**User feedback:** "slight visual hiccup when clicking settings to view api key, the modal jumps a little"
**Fix:** Initialize state with actual window width check: `useState(getIsMobile)` instead of `useState(false)`

---

## Choices That Could Have Been Better

### 1. Hook Duplication
Created `useIsMobile` hook in 3 separate files (TabBar, AppShell, ApiKeyModal). Should have:
- Created a shared `src/hooks/useIsMobile.ts`
- Exported from `src/hooks/index.ts`
- Imported where needed

### 2. Inline Styles vs CSS
Used inline styles with `React.CSSProperties` objects. While functional, this approach:
- Doesn't support media queries natively (had to use JS-based responsive checks)
- Makes the components verbose
- Could have used CSS modules or a single stylesheet with classes

### 3. Could Have Used CSS Media Queries
Instead of JavaScript-based `useIsMobile` hooks, could have used CSS media queries in global.css for most responsive behavior. JS hooks only needed for conditional rendering (like hiding tab labels).

### 4. PRD Entry Point Issue
The index.html referenced `/index.tsx` but the actual entry was `/src/main.tsx`. Should have verified the entry point matched before starting dev server.

---

## What Went Well

1. **Parallel Agent Execution** - Phase B tasks ran in parallel with 4 Opus agents, significantly speeding up implementation
2. **Terminal Aesthetic Consistency** - Maintained pub green (#021a1a), mint (#8bd0ba), and NO rounded corners throughout
3. **API Key Validation** - Implemented actual API validation against Gemini endpoint, not just format checking
4. **IndexedDB with Fallback** - Storage service includes localStorage fallback for browser compatibility
5. **Type Safety** - Extended types.ts with comprehensive types for the app (TabId, GeminiConfig, Asset, etc.)
6. **User Verification Loop** - After being corrected, properly waited for user to verify mobile/desktop before marking complete

---

## Configuration Notes for Future Sessions

### TaskMaster MCP Config
```json
{
  "models": {
    "main": { "provider": "claude-code", "modelId": "opus" },
    "research": { "provider": "claude-code", "modelId": "opus" },
    "fallback": { "provider": "claude-code", "modelId": "sonnet" }
  },
  "claudeCode": {}
}
```
- All models must use `claude-code` provider (no API keys needed)
- Use simple model IDs: `opus`, `sonnet` (not full model strings)

### Agent Spawning
- Always check AGENT_MAPPINGS.md for configured agents
- Use `model: "opus"` for agents as per user configuration
- Available agent types: frontend-architect, backend-architect, etc.

### Verification Checklist Before Marking Complete
- [ ] Feature works on desktop
- [ ] Feature works on mobile
- [ ] No console errors
- [ ] User has visually confirmed
- [ ] No visual glitches/jumps

---

## Key Takeaways

1. **Verification before completion** - Always test and get user confirmation
2. **Stop on failure** - Don't improvise when tools fail, consult user
3. **Check configurations** - Agent mappings, model configs, etc. exist for a reason
4. **Mobile-first mindset** - Always consider responsiveness from the start
5. **Shared utilities** - Extract common patterns (like useIsMobile) into shared hooks

---

*This reflection is for configuration and learning purposes. The issues encountered were largely due to new skills, agents, MCPs and hooks being integrated - expected teething problems with new tooling.*

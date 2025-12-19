# Project Index: PixelMilk

Generated: 2025-12-19

## Overview

**PixelMilk** is a modular pixel art creation suite with AI-powered generation using Google's Gemini image models. Designed for game developers and pixel artists who want AI assistance without losing creative control.

**Core Philosophy:** AI assists, human creates. Edit-based workflow with style consistency through locked palettes and identity documents.

---

## Project Structure

```
PixelMilk - Nano Banana Powered Pixel Art Studio/
├── PixelMilk-App/              # Main application (active development)
│   ├── src/                    # Source code
│   ├── docs/                   # Architecture & phase plans
│   └── .taskmaster/            # Task management
├── App Prototype/              # Original prototype (reference only)
├── Resources and Guides/       # Reference implementations
│   ├── banana-levelup-main/    # Character avatar system
│   ├── nano-banana-infinimap-main/  # Tile generation patterns
│   ├── NanoBananaEditor-main/  # AI image editing patterns
│   └── generative-ai-main/     # Google Gemini examples
├── Backups/                    # Project backups
├── Inspiration/                # Design references
└── LogoSVG.svg                 # Project logo
```

---

## Entry Points

| File | Purpose |
|------|---------|
| `PixelMilk-App/src/main.tsx` | Application bootstrap |
| `PixelMilk-App/src/App.tsx` | Root component with tab routing |
| `PixelMilk-App/vite.config.ts` | Build configuration |

**Run locally:**
```bash
cd PixelMilk-App
npm install
npm run dev
```

---

## Core Modules

### Services

| Path | Purpose |
|------|---------|
| `src/services/gemini/geminiService.ts` | Gemini API client for image generation |
| `src/services/gemini/modelRouter.ts` | Model selection (flash vs pro) based on task |
| `src/services/storage/db.ts` | IndexedDB initialization (with localStorage fallback) |
| `src/services/storage/assets.ts` | Asset CRUD operations |
| `src/services/storage/settings.ts` | API key and preferences persistence |

### Stores (Zustand)

| Path | Purpose |
|------|---------|
| `src/stores/appStore.ts` | Global state: API key, active tab, modals |
| `src/stores/characterStore.ts` | Character generation state |

### Components

| Directory | Contents |
|-----------|----------|
| `src/components/shared/` | Button, Input, Select, Panel (reusable UI) |
| `src/components/layout/` | AppShell, TabBar, ApiKeyModal, ErrorBoundary |
| `src/components/character/` | CharacterTab, DescriptionInput, StyleSelector, SpritePreview, IdentityCard, GenerateControls |

### Utilities

| Path | Purpose |
|------|---------|
| `src/utils/paletteGovernor.ts` | Palette locking and color snapping |
| `src/types.ts` | TypeScript type definitions |

---

## Technical Stack

| Layer | Technology |
|-------|------------|
| Framework | React 19 + TypeScript |
| Build | Vite 6 |
| State | Zustand 5 |
| Storage | IndexedDB (via idb 8) |
| AI | @google/genai (Gemini API) |
| 3D Preview | Three.js 0.160 |
| Icons | Lucide React |

---

## Architecture Decisions

1. **Frontend-only** - No backend. Users provide own Gemini API key.
2. **Model routing** - `gemini-2.5-flash-image` for volume, `gemini-3-pro-image-preview` for quality
3. **Terminal aesthetic** - Pub green (#021a1a), mint text (#8bd0ba), VT323 monospace, NO rounded corners
4. **Character Identity Documents** - Structured JSON for consistency across sprite rotations
5. **Palette Locking** - First sprite locks palette; all edits constrained to locked colors

---

## Tab System

| Tab | Purpose | Status |
|-----|---------|--------|
| Character | Text-to-sprite, identity system, rotations | Phase 2 complete |
| Tile | Seamless tiles, variants, autotile | Planned (Phase 5) |
| Object | Props, recontextualization | Planned (Phase 6) |
| Texture | Materials, patterns | Planned (Phase 7) |
| Compose | Scene assembly, layers | Planned (Phase 8) |
| Library | Asset management, export | Planned (Phase 9) |

---

## Development Phases

| Phase | Focus | Status |
|-------|-------|--------|
| 1 | Foundation (app shell, services) | Complete |
| 2 | Character Tab MVP | Complete |
| 3 | Canvas & Tools | In Progress |
| 4 | Sprite Rotations | Planned |
| 5-10 | Remaining tabs + AI Guidance | Planned |

**Plans location:** `PixelMilk-App/docs/plans/`

---

## Key Documentation

| Document | Path |
|----------|------|
| Architecture | `PixelMilk-App/docs/ARCHITECTURE.md` |
| Handoff Notes | `PixelMilk-App/docs/HANDOFF-2025-12-18.md` |
| PRD | `PixelMilk-App/.taskmaster/docs/prd.txt` |
| AI User Guidance | `PixelMilk-App/docs/AI Guidance for Users.txt` |

---

## Reference Resources

| Resource | Path | Use For |
|----------|------|---------|
| Nano Banana Recipes | `Resources and Guides/generative-ai-main/gemini/nano-banana/` | Gemini image patterns |
| Infinimap | `Resources and Guides/nano-banana-infinimap-main/` | Tile generation |
| NanoBananaEditor | `Resources and Guides/NanoBananaEditor-main/` | AI editing workflow |
| Banana LevelUp | `Resources and Guides/banana-levelup-main/` | Character rotation |

---

## Quick Reference

**Color Palette:**
- Background: `#021a1a` (primary), `#032828` (secondary), `#043636` (tertiary)
- Text: `#8bd0ba` (primary), `#6ba89a` (secondary)
- Accent: `#f04e4e` (red), `#d8c8b8` (beige)

**Fonts:**
- Display: Playfair Display
- Code/UI: VT323

**Design Rules:**
- NO rounded corners
- NO gradients
- NO shadows (use borders)
- Terminal aesthetic (prompts start with `>`)

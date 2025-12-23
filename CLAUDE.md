# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PixelMilk is an AI-powered pixel art creation suite using Google's Gemini API. Built for game developers and pixel artists who want AI assistance without losing creative control. Frontend-only architecture - users provide their own Gemini API key.

**Core Philosophy:**
- AI assists, human creates
- Edit-based workflow (refine, don't regenerate)
- Style consistency through locked palettes and identity documents

## Build & Development Commands

```bash
# Development server (port 3000)
npm run dev

# Production build (type-check + bundle)
npm run build

# Preview production build
npm run preview
```

**Environment setup:** Set `GEMINI_API_KEY` in `.env.local`

## Architecture

### Tech Stack
- **React 19 + TypeScript + Vite** - Frontend framework
- **Zustand** - State management (three stores: app, character, canvas)
- **IndexedDB via idb** - Local persistence with localStorage fallback
- **@google/genai** - Gemini SDK for image generation
- **Three.js + React Three Fiber** - 3D preview (future turntable)

### Directory Structure
```
PixelMilk-App/src/
├── components/
│   ├── canvas/        # Drawing tools, sprite canvas, zoom controls
│   ├── character/     # Character creation workflow (main tab)
│   ├── layout/        # AppShell, TabBar, modals
│   └── shared/        # Button, Input, Select, Panel, Tooltip
├── services/
│   ├── gemini/        # API client, model router, generation logic
│   └── storage/       # IndexedDB setup, asset CRUD, settings
├── stores/            # Zustand stores (appStore, characterStore, canvasStore)
├── utils/             # Image processing, palette governor, pixel snapping
├── data/              # Lospec palettes, pixel art techniques
└── types.ts           # All TypeScript interfaces
```

### Key Architectural Patterns

**1. Multi-Model Router** (`services/gemini/modelRouter.ts`)
Routes tasks to optimal Gemini models:
- `gemini-2.5-flash-image` - Fast iteration, tiles, edits
- `gemini-3-pro-image-preview` - Final quality, complex composition
- `gemini-2.5-flash` / `gemini-3-flash-preview` - Text analysis

**2. Character Identity System**
Every character has a structured identity document ensuring consistency:
- Physical description, colour palette, distinctive features
- Angle notes for per-direction visibility hints
- Used as context for all subsequent sprite generations

**3. Palette Locking**
First sprite locks the palette. All subsequent operations (rotations, edits) snap to locked colours. Implemented in `paletteGovernor.ts` - colours snapped post-generation, not passed to Gemini.

**4. Hotspot Editing**
Click on sprite region, describe change, AI edits only that area. Uses `editing.ts` for localised inpainting.

**5. Rate Limit Handling**
Client distinguishes retryable (429, 5xx) vs permanent errors. Exponential backoff with max 3 retries. See `client.ts`.

### Data Flow
```
User Input → Generate Identity (JSON) → Generate Sprite (PNG)
                                              ↓
                                    pngToPixelArray()
                                              ↓
                                    validateAndSnapPixelData()
                                              ↓
                                    Lock Palette → Store Asset
```

## Visual Design System

Terminal aesthetic with pub green/mint colour scheme:
- `#021a1a` - Primary background
- `#8bd0ba` - Primary text (mint)
- `#d8c8b8` - Accent (beige)
- Font: VT323 monospace (Playfair Display for headings)

**Design rules:** NO rounded corners, NO gradients, sharp pixel-perfect borders.

## Development Phases

| Phase | Status | Focus |
|-------|--------|-------|
| 1-2 | Complete | Foundation, Character Tab MVP |
| 3 | In Progress | Canvas & editing tools, hotspot editing |
| 4-10 | Planned | Rotations, Tile/Object/Texture tabs, Library, AI guidance |

Detailed plans in `docs/plans/`.

## Key Files

| File | Purpose |
|------|---------|
| `components/character/CharacterTab.tsx` | Main workflow orchestration |
| `services/gemini/client.ts` | Gemini SDK wrapper, rate limiting |
| `services/gemini/geminiService.ts` | Identity & sprite generation |
| `services/gemini/modelRouter.ts` | Model selection logic |
| `services/storage/db.ts` | IndexedDB setup & recovery |
| `stores/characterStore.ts` | Character session state |
| `utils/paletteGovernor.ts` | Colour snapping & validation |
| `utils/normalizeIdentity.ts` | Gemini JSON response parsing |
| `types.ts` | All TypeScript definitions |

## Gemini Integration Notes

- System prompts kept at START for implicit caching
- PNG output converted to pixel arrays client-side
- Structured output via JSON schemas for identity documents
- Reference images sent with white background (not transparent)
- `angleNotes` field can run away - truncation logic in normalizeIdentity

**When editing Gemini system instructions or needing Gemini API information:** Use Chrome to query Ethan's NotebookLM notebook (188 sources) for instant, accurate answers:
https://notebooklm.google.com/notebook/bafbef1c-192a-498a-96d4-d80b0e6f021c

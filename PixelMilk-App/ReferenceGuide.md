# PixelMilk Reference Guide

Project Root: C:\Users\User\Documents\MilkStack\Projects\Software\PixelMilk - Nano Banana Powered Pixel Art Studio\PixelMilk-App
Resources Root: C:\Users\User\Documents\MilkStack\Projects\Software\PixelMilk - Nano Banana Powered Pixel Art Studio\Resources and Guides

Purpose: Map phase plans to architecture decisions and resource references. Tags and keywords are included for AI search.

## Global Architecture and Alignment (applies to all phases)
- Path: C:\Users\User\Documents\MilkStack\Projects\Software\PixelMilk - Nano Banana Powered Pixel Art Studio\PixelMilk-App\docs\ARCHITECTURE.md | tags: architecture, stack, design-system, model-routing, workflows | keywords: React 19, Vite, Zustand, IndexedDB, palette locking, text-to-sprite, hotspot editing, 3D preview, export formats, tab system
- Path: C:\Users\User\Documents\MilkStack\Projects\Software\PixelMilk - Nano Banana Powered Pixel Art Studio\PixelMilk-App\docs\IMPLEMENTATION-ALIGNMENT-2025-12-19.md | tags: alignment, hybrid-workflow, phase-0 | keywords: PNG to pixel array, model router, palette lock, camelCase, imageUtils, IndexedDB
- Path: C:\Users\User\Documents\MilkStack\Projects\Software\PixelMilk - Nano Banana Powered Pixel Art Studio\PixelMilk-App\docs\GEMINI-RESOURCES.md | tags: gemini, models, references | keywords: model matrix, prompt patterns, phase resource map, flash-image, pro-image-preview
- Path: C:\Users\User\Documents\MilkStack\Projects\Software\PixelMilk - Nano Banana Powered Pixel Art Studio\PixelMilk-App\docs\HANDOFF-2025-12-18.md | tags: handoff, decisions | keywords: terminal aesthetic, model routing, palette locking, hotspot editing, external refs
- Path: C:\Users\User\Documents\MilkStack\Projects\Software\PixelMilk - Nano Banana Powered Pixel Art Studio\PixelMilk-App\docs\legacy\2025-12-19-architecture-alignment-plan.md | tags: alignment, normalizer, legacy | keywords: camelCase, snake_case, cleanup plan
- Path: C:\Users\User\Documents\MilkStack\Projects\Software\PixelMilk - Nano Banana Powered Pixel Art Studio\PixelMilk-App\docs\legacy\2025-12-19-architecture-alignment-review.md | tags: alignment, normalizer, risk | keywords: normalizeIdentity, backward compatibility, IndexedDB legacy data
- Path: C:\Users\User\Documents\MilkStack\Projects\Software\PixelMilk - Nano Banana Powered Pixel Art Studio\PixelMilk-App\docs\legacy\2025-12-19-architecture-alignment-FINAL.md | tags: alignment, normalizer, execution | keywords: normalizeIdentity, camelCase enforcement, legacy file removal

## Phase 1 - Foundation
Summary: Project scaffolding, shared UI components, gemini service layer, storage, state stores, and app shell.
- Path: C:\Users\User\Documents\MilkStack\Projects\Software\PixelMilk - Nano Banana Powered Pixel Art Studio\PixelMilk-App\docs\plans\2025-12-18-pixelmilk-foundation.md | tags: phase-1, foundation, scaffold, app-shell | keywords: vite, react 19, typescript, zustand, indexeddb, model router, api key modal, shared UI
- Path: C:\Users\User\Documents\MilkStack\Projects\Software\PixelMilk - Nano Banana Powered Pixel Art Studio\PixelMilk-App\docs\ARCHITECTURE.md | tags: architecture, foundation | keywords: directory structure, design system, tab shell
- Path: C:\Users\User\Documents\MilkStack\Projects\Software\PixelMilk - Nano Banana Powered Pixel Art Studio\PixelMilk-App\docs\IMPLEMENTATION-ALIGNMENT-2025-12-19.md | tags: alignment, phase-1 | keywords: PNG to pixel array, palette lock, model router
Resources and Guides (foundation references):
- Path: C:\Users\User\Documents\MilkStack\Projects\Software\PixelMilk - Nano Banana Powered Pixel Art Studio\Resources and Guides\generative-ai-main\gemini\nano-banana\nano_banana_recipes.ipynb | tags: gemini, recipes | keywords: gemini-2.5-flash-image, image generation, image editing, config examples
- Path: C:\Users\User\Documents\MilkStack\Projects\Software\PixelMilk - Nano Banana Powered Pixel Art Studio\Resources and Guides\gemini-co-drawing\Home.tsx | tags: gemini, co-drawing | keywords: canvas to dataURL, inlineData, multimodal parts, sketch to image
- Path: C:\Users\User\Documents\MilkStack\Projects\Software\PixelMilk - Nano Banana Powered Pixel Art Studio\Resources and Guides\pixshop\services\geminiService.ts | tags: gemini, editing | keywords: localized edit, pixel coordinates, hotspot, gemini-2.5-flash-image
- Path: C:\Users\User\Documents\MilkStack\Projects\Software\PixelMilk - Nano Banana Powered Pixel Art Studio\Resources and Guides\nano-banana-infinimap-main\nano-banana-infinimap-main\README.md | tags: tiles, seamless, neighbor-aware | keywords: 3x3 grid, blending, checkerboard matte, infill tiles
- Path: C:\Users\User\Documents\MilkStack\Projects\Software\PixelMilk - Nano Banana Powered Pixel Art Studio\Resources and Guides\home-canvas\services\geminiService.ts | tags: compose, compositing | keywords: semantic placement, red marker, resize to square, gemini-2.5-flash-lite, gemini-2.5-flash-image

## Phase 2 - Character Tab MVP
Summary: Character identity generation, sprite generation, palette locking, sprite canvas display, identity card.
- Path: C:\Users\User\Documents\MilkStack\Projects\Software\PixelMilk - Nano Banana Powered Pixel Art Studio\PixelMilk-App\docs\plans\2025-12-18-phase-2-character-tab.md | tags: phase-2, character, identity, sprite | keywords: text-to-sprite, palette locking, sprite canvas, generate controls
- Path: C:\Users\User\Documents\MilkStack\Projects\Software\PixelMilk - Nano Banana Powered Pixel Art Studio\PixelMilk-App\docs\ARCHITECTURE.md | tags: architecture, character | keywords: CharacterIdentity, StyleParameters, text-to-sprite workflow, palette locking
- Path: C:\Users\User\Documents\MilkStack\Projects\Software\PixelMilk - Nano Banana Powered Pixel Art Studio\PixelMilk-App\docs\IMPLEMENTATION-ALIGNMENT-2025-12-19.md | tags: alignment, character | keywords: two-step generation, PNG to pixel array, camelCase identity fields
Resources and Guides:
- Path: C:\Users\User\Documents\MilkStack\Projects\Software\PixelMilk - Nano Banana Powered Pixel Art Studio\Resources and Guides\consistent_imagery_generation.ipynb | tags: consistency, multi-view | keywords: character sheet, front/back views, image numbering, aspect ratio
- Path: C:\Users\User\Documents\MilkStack\Projects\Software\PixelMilk - Nano Banana Powered Pixel Art Studio\Resources and Guides\gemini-co-drawing\Home.tsx | tags: co-drawing, sketch | keywords: canvas base64, inlineData, prompt plus sketch
- Path: C:\Users\User\Documents\MilkStack\Projects\Software\PixelMilk - Nano Banana Powered Pixel Art Studio\Resources and Guides\one-shot-arcade\services\gemini.ts | tags: sprite-gen, prompts | keywords: solid white background, thick outlines, gemini-3-pro-image-preview, reference image
- Path: C:\Users\User\Documents\MilkStack\Projects\Software\PixelMilk - Nano Banana Powered Pixel Art Studio\Resources and Guides\generative-ai-main\gemini\nano-banana\nano_banana_recipes.ipynb | tags: gemini, recipes | keywords: flash-image patterns, image generation, editing

## Phase 3 - Canvas and Editing Tools
Summary: Interactive pixel editor, tools, undo/redo, hotspot editing, AI localized edits.
- Path: C:\Users\User\Documents\MilkStack\Projects\Software\PixelMilk - Nano Banana Powered Pixel Art Studio\PixelMilk-App\docs\plans\2025-12-18-phase-3-canvas-tools.md | tags: phase-3, canvas, editing | keywords: undo redo, tool palette, fill, eyedropper, hotspot
- Path: C:\Users\User\Documents\MilkStack\Projects\Software\PixelMilk - Nano Banana Powered Pixel Art Studio\PixelMilk-App\docs\ARCHITECTURE.md | tags: architecture, canvas | keywords: hotspot editing, palette governor, pixel arrays
Resources and Guides:
- Path: C:\Users\User\Documents\MilkStack\Projects\Software\PixelMilk - Nano Banana Powered Pixel Art Studio\Resources and Guides\pixshop\services\geminiService.ts | tags: hotspot, editing | keywords: pixel coordinates, localized edit, gemini-2.5-flash-image
- Path: C:\Users\User\Documents\MilkStack\Projects\Software\PixelMilk - Nano Banana Powered Pixel Art Studio\Resources and Guides\NanoBananaEditor-main\NanoBananaEditor-main\src\services\geminiService.ts | tags: mask, segmentation | keywords: mask-based edit, box_2d, binary mask, gemini-2.5-flash-image-preview
- Path: C:\Users\User\Documents\MilkStack\Projects\Software\PixelMilk - Nano Banana Powered Pixel Art Studio\Resources and Guides\spatial-understanding\Types.tsx | tags: detection, bbox | keywords: 2D bounding boxes, 3D bounding boxes, segmentation masks, points
- Path: C:\Users\User\Documents\MilkStack\Projects\Software\PixelMilk - Nano Banana Powered Pixel Art Studio\Resources and Guides\augmented-image\services\geminiService.ts | tags: annotation, bounds | keywords: region bounds, structured JSON, googleSearch tool
- Path: C:\Users\User\Documents\MilkStack\Projects\Software\PixelMilk - Nano Banana Powered Pixel Art Studio\Resources and Guides\gemini-co-drawing\Home.tsx | tags: canvas, multimodal | keywords: canvas to base64, inlineData

## Phase 4 - Sprite Rotations and 3D Preview
Summary: 3D turntable reference, 8-direction generation, sprite sheets.
- Path: C:\Users\User\Documents\MilkStack\Projects\Software\PixelMilk - Nano Banana Powered Pixel Art Studio\PixelMilk-App\docs\plans\2025-12-18-phase-4-sprite-rotations.md | tags: phase-4, rotations, 3d | keywords: turntable, 8-direction, sprite sheet export
- Path: C:\Users\User\Documents\MilkStack\Projects\Software\PixelMilk - Nano Banana Powered Pixel Art Studio\PixelMilk-App\docs\ARCHITECTURE.md | tags: architecture, rotations | keywords: 3D preview, 8-direction workflow
Resources and Guides:
- Path: C:\Users\User\Documents\MilkStack\Projects\Software\PixelMilk - Nano Banana Powered Pixel Art Studio\Resources and Guides\consistent_imagery_generation.ipynb | tags: consistency, reference | keywords: multi-view character sheet, front/back views, image numbering

## Phase 5 - Tile Tab
Summary: Seamless tiles, variants, autotile rules, previews, export.
- Path: C:\Users\User\Documents\MilkStack\Projects\Software\PixelMilk - Nano Banana Powered Pixel Art Studio\PixelMilk-App\docs\plans\2025-12-18-phase-5-tile-tab.md | tags: phase-5, tile, seamless | keywords: variants, autotile, 3x3 preview
- Path: C:\Users\User\Documents\MilkStack\Projects\Software\PixelMilk - Nano Banana Powered Pixel Art Studio\PixelMilk-App\docs\ARCHITECTURE.md | tags: architecture, tile | keywords: tileset, seamless patterns, autotile formats
Resources and Guides:
- Path: C:\Users\User\Documents\MilkStack\Projects\Software\PixelMilk - Nano Banana Powered Pixel Art Studio\Resources and Guides\nano-banana-infinimap-main\nano-banana-infinimap-main\README.md | tags: tiles, neighbor-aware | keywords: 3x3 grid, blend outputs, checkerboard matte
- Path: C:\Users\User\Documents\MilkStack\Projects\Software\PixelMilk - Nano Banana Powered Pixel Art Studio\Resources and Guides\generative-ai-main\gemini\nano-banana\nano_banana_recipes.ipynb | tags: gemini, recipes | keywords: image editing, seamless generation
External references (not in repo, see HANDOFF):
- Piskel (pixel editor patterns)
- pixelmatch (seam verification)
- WaveFunctionCollapse (tile placement)
- Spritesheet-Maker (export formats)

## Phase 6 - Object Tab
Summary: Object identity, context-specific renders (inventory/world/ui/pickup), recontextualization.
- Path: C:\Users\User\Documents\MilkStack\Projects\Software\PixelMilk - Nano Banana Powered Pixel Art Studio\PixelMilk-App\docs\plans\2025-12-18-phase-6-object-tab.md | tags: phase-6, object, recontextualization | keywords: inventory icon, world sprite, ui, pickup
- Path: C:\Users\User\Documents\MilkStack\Projects\Software\PixelMilk - Nano Banana Powered Pixel Art Studio\PixelMilk-App\docs\ARCHITECTURE.md | tags: architecture, object | keywords: object tab, props, recontextualization
Resources and Guides:
- Path: C:\Users\User\Documents\MilkStack\Projects\Software\PixelMilk - Nano Banana Powered Pixel Art Studio\Resources and Guides\product-mockup-visualization\services\geminiService.ts | tags: compositing, layout | keywords: layout hints, gemini-3-pro-image-preview, realistic blending
- Path: C:\Users\User\Documents\MilkStack\Projects\Software\PixelMilk - Nano Banana Powered Pixel Art Studio\Resources and Guides\home-canvas\services\geminiService.ts | tags: compositing, placement | keywords: semantic placement, lighting match, red marker
- Path: C:\Users\User\Documents\MilkStack\Projects\Software\PixelMilk - Nano Banana Powered Pixel Art Studio\Resources and Guides\spatial-understanding\Types.tsx | tags: detection | keywords: points, bounding boxes, segmentation

## Phase 7 - Texture Tab
Summary: Seamless materials and patterns, material presets, scale control, tiling preview.
- Path: C:\Users\User\Documents\MilkStack\Projects\Software\PixelMilk - Nano Banana Powered Pixel Art Studio\PixelMilk-App\docs\plans\2025-12-18-phase-7-texture-tab.md | tags: phase-7, texture, seamless | keywords: material presets, scale, tiling preview
- Path: C:\Users\User\Documents\MilkStack\Projects\Software\PixelMilk - Nano Banana Powered Pixel Art Studio\PixelMilk-App\docs\ARCHITECTURE.md | tags: architecture, texture | keywords: texture tab, materials, patterns
Resources and Guides:
- Path: C:\Users\User\Documents\MilkStack\Projects\Software\PixelMilk - Nano Banana Powered Pixel Art Studio\Resources and Guides\nano-banana-infinimap-main\nano-banana-infinimap-main\README.md | tags: seamless, blending | keywords: edge consistency, neighbor-aware generation
- Path: C:\Users\User\Documents\MilkStack\Projects\Software\PixelMilk - Nano Banana Powered Pixel Art Studio\Resources and Guides\generative-ai-main\gemini\nano-banana\nano_banana_recipes.ipynb | tags: gemini, recipes | keywords: image editing, seamless patterns

## Phase 8 - Compose Tab
Summary: Scene assembly with layers, asset picker, AI compositing for shadows and lighting, export.
- Path: C:\Users\User\Documents\MilkStack\Projects\Software\PixelMilk - Nano Banana Powered Pixel Art Studio\PixelMilk-App\docs\plans\2025-12-18-phase-8-compose-tab.md | tags: phase-8, compose, scenes | keywords: layer system, asset picker, ai compositing, scene export
- Path: C:\Users\User\Documents\MilkStack\Projects\Software\PixelMilk - Nano Banana Powered Pixel Art Studio\PixelMilk-App\docs\ARCHITECTURE.md | tags: architecture, compose | keywords: scene assembly, layer panel, asset picker
Resources and Guides:
- Path: C:\Users\User\Documents\MilkStack\Projects\Software\PixelMilk - Nano Banana Powered Pixel Art Studio\Resources and Guides\home-canvas\services\geminiService.ts | tags: compositing, placement | keywords: red marker, semantic location description, resize to square, composite image
- Path: C:\Users\User\Documents\MilkStack\Projects\Software\PixelMilk - Nano Banana Powered Pixel Art Studio\Resources and Guides\product-mockup-visualization\services\geminiService.ts | tags: compositing | keywords: layout hints, lighting match, perspective blending
- Path: C:\Users\User\Documents\MilkStack\Projects\Software\PixelMilk - Nano Banana Powered Pixel Art Studio\Resources and Guides\spatial-understanding\Types.tsx | tags: detection | keywords: bounding boxes, points, segmentation masks
- Path: C:\Users\User\Documents\MilkStack\Projects\Software\PixelMilk - Nano Banana Powered Pixel Art Studio\Resources and Guides\augmented-image\services\geminiService.ts | tags: annotation | keywords: bounds, structured region data, googleSearch tool

## Phase 9 - Library Tab
Summary: Asset grid, filters, bulk operations, export formats.
- Path: C:\Users\User\Documents\MilkStack\Projects\Software\PixelMilk - Nano Banana Powered Pixel Art Studio\PixelMilk-App\docs\plans\2025-12-18-phase-9-library-tab.md | tags: phase-9, library, export | keywords: search, filter, tags, bulk export, bundle
- Path: C:\Users\User\Documents\MilkStack\Projects\Software\PixelMilk - Nano Banana Powered Pixel Art Studio\PixelMilk-App\docs\ARCHITECTURE.md | tags: architecture, library | keywords: asset management, export formats, metadata
External references (not in repo, see HANDOFF):
- Spritesheet-Maker (export implementations)
- pixelmatch (image diff)
- Piskel (editor patterns)

## Phase 10 - AI Guidance System
Summary: Prompt Wand, Drawing Coach, contextual tooltips, guidance settings.
- Path: C:\Users\User\Documents\MilkStack\Projects\Software\PixelMilk - Nano Banana Powered Pixel Art Studio\PixelMilk-App\docs\plans\2025-12-18-phase-10-ai-guidance.md | tags: phase-10, guidance, prompt-wand | keywords: prompt enhancement, drawing analysis, tooltips
- Path: C:\Users\User\Documents\MilkStack\Projects\Software\PixelMilk - Nano Banana Powered Pixel Art Studio\PixelMilk-App\docs\AI Guidance for Users.txt | tags: guidance, reference | keywords: pixel art styles, palette limits, dithering, anti-aliasing, animation tips
- Path: C:\Users\User\Documents\MilkStack\Projects\Software\PixelMilk - Nano Banana Powered Pixel Art Studio\PixelMilk-App\docs\ARCHITECTURE.md | tags: architecture, guidance | keywords: Prompt Wand, Drawing Coach, contextual tooltips
Resources and Guides:
- Path: C:\Users\User\Documents\MilkStack\Projects\Software\PixelMilk - Nano Banana Powered Pixel Art Studio\Resources and Guides\proactive-co-creator\services\geminiService.ts | tags: prompt-refinement | keywords: belief graph, clarifying questions, retry logic, gemini-2.5-flash
- Path: C:\Users\User\Documents\MilkStack\Projects\Software\PixelMilk - Nano Banana Powered Pixel Art Studio\Resources and Guides\flash-ui\index.tsx | tags: streaming, json | keywords: generateContentStream, parseJsonStream, gemini-3-flash-preview, temperature 1.2
- Path: C:\Users\User\Documents\MilkStack\Projects\Software\PixelMilk - Nano Banana Powered Pixel Art Studio\Resources and Guides\augmented-image\services\geminiService.ts | tags: analysis, annotation | keywords: region bounds, structured JSON, googleSearch tool
- Path: C:\Users\User\Documents\MilkStack\Projects\Software\PixelMilk - Nano Banana Powered Pixel Art Studio\Resources and Guides\gemini-ink-studio\services\liveApi.ts | tags: live-audio, tools | keywords: gemini live connect, function calling, audio preview

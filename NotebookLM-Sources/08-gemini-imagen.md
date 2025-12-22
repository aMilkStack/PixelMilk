# Imagen 3/4 Documentation

## Overview
Imagen is Google's high-fidelity image generation model that creates "realistic and high quality images from text prompts." All outputs include a SynthID watermark.

## Key Difference from Native Gemini
The documentation notes: "You can also generate images with Gemini's built-in multimodal capabilities" but directs users to a separate Image generation guide, indicating Imagen models are specialized, dedicated tools distinct from Gemini's integrated approach.

## Imagen 4 Specifications
**Model Codes:**
- `imagen-4.0-generate-001` (Standard)
- `imagen-4.0-ultra-generate-001` (Ultra)
- `imagen-4.0-fast-generate-001` (Fast)

**Parameters:**
- Input: Text prompts (480 token limit)
- Output: 1-4 images
- Latest update: June 2025

## Imagen 3 Specifications
**Model Code:** `imagen-3.0-generate-002`

**Parameters:**
- Input: Text prompts
- Output: Up to 4 images
- Latest update: February 2025

## Configuration Options (Both Versions)
- **numberOfImages:** 1-4 (default: 4)
- **imageSize:** "1K" or "2K" (Standard/Ultra only)
- **aspectRatio:** "1:1", "3:4", "4:3", "9:16", "16:9" (default: "1:1")
- **personGeneration:** "dont_allow", "allow_adult" (default), or "allow_all"

## Prompt Requirements
English-only support with maximum "480 tokens" per prompt. Best practices emphasize descriptive language covering subject, context, and style for optimal results.

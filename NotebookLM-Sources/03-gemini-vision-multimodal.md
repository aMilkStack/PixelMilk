# Gemini API Image Understanding Documentation

## Overview
The Gemini API supports comprehensive multimodal image processing capabilities including captioning, classification, object detection, and segmentation without requiring specialized ML models.

## Image Input Methods

**Inline Image Data**: For smaller files (total request <20MB), pass Base64-encoded images or local files directly in the `generateContent` request.

**File API Upload**: For larger files or repeated use, upload images using the Files API, which is more efficient than inline data.

## Supported Formats
- PNG (`image/png`)
- JPEG (`image/jpeg`)
- WEBP (`image/webp`)
- HEIC (`image/heic`)
- HEIF (`image/heif`)

## Key Capabilities

**Multiple Images**: Combine multiple images in a single prompt using a mix of uploaded files and inline data.

**Object Detection** (Gemini 2.0+): Models detect objects and return bounding box coordinates normalized to 0-1000 scale, which must be rescaled based on original image dimensions.

**Segmentation** (Gemini 2.5+): Beyond detection, models "segment them and provide their contour masks" as base64-encoded PNG probability maps requiring resizing and binarization at confidence thresholds.

## Technical Specifications

**File Limits**: Maximum 3,600 image files per request

**Token Calculation**:
- Images <= 384px in both dimensions = 258 tokens
- Larger images tile into 768x768px segments at 258 tokens each

**Media Resolution**: The `media_resolution` parameter determines "maximum number of tokens allocated per input image or video frame," affecting detail recognition versus token usage.

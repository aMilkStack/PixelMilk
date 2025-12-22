# Gemini Image Generation Documentation

## Overview

Gemini offers native image generation and editing capabilities through two main models. According to the documentation, "Gemini can generate and process images conversationally."

### Available Models

**Gemini 2.5 Flash Image:**
- Optimized for speed and efficiency
- Generates images at 1024px resolution
- Best for high-volume, low-latency tasks
- Supports up to 3 input images

**Gemini 3 Pro Image Preview:**
- Designed for professional asset production
- Generates up to 4K resolution
- Features built-in "Thinking" process for composition refinement
- Integrates Google Search grounding
- Supports up to 14 reference images (6 objects, 5 humans)

## Core Capabilities

### Text-to-Image Generation
The basic workflow accepts text prompts and returns generated images with optional accompanying text explanations.

### Image Editing & Modification
Users can provide existing images with text prompts to add, remove, or modify elements while maintaining original style and lighting.

### Multi-Turn Conversations
The conversational interface enables iterative refinement: "Chat or multi-turn conversation is the recommended way to iterate on images."

### Advanced Features
- Inpainting through semantic masking
- Style transfer
- Multi-image composition
- Character consistency across multiple angles
- High-fidelity detail preservation

## Configuration Options

### Aspect Ratios Supported
1:1, 2:3, 3:2, 3:4, 4:3, 4:5, 5:4, 9:16, 16:9, 21:9

### Response Modalities
Users can specify `response_modalities=['TEXT', 'IMAGE']` or `['IMAGE']` only, depending on whether explanatory text is desired.

### Image Resolution (Gemini 3 Pro only)
- 1K (1024x1024 base)
- 2K (2048x2048)
- 4K (4096x4096)

Configuration uses `image_config` parameters in `GenerateContentConfig`.

## Prompting Strategies

### Best Practices
The documentation emphasizes: "Describe the scene, don't just list keywords."

**Recommended approach:**
- Provide narrative, descriptive paragraphs rather than keyword lists
- Include photographic or cinematic terminology
- Specify lighting, mood, and composition details
- Use step-by-step instructions for complex scenes

### Use Case Templates

**Photorealistic Scenes:** Include camera angles, lens types, lighting descriptions
**Stylized Illustrations:** Specify art style, line weight, color palette, background treatment
**Text Rendering:** Be explicit about text content, font characteristics, overall design
**Product Mockups:** Detail studio setup, surface materials, camera positioning
**Sequential Art:** Describe scene, character positioning, artistic style

## Code Examples

### Basic Python Example Structure
```python
response = client.models.generate_content(
    model="gemini-2.5-flash-image",
    contents=[prompt],
    config=types.GenerateContentConfig(
        response_modalities=['TEXT', 'IMAGE'],
        image_config=types.ImageConfig(aspect_ratio="16:9")
    )
)
```

## Image Input Handling

### Supported Formats
- PNG, JPEG base64-encoded inline data
- Up to 14 reference images for Gemini 3 Pro

### Input Limitations
- Maximum 3 images recommended for Gemini 2.5 Flash
- Image generation does not support audio or video inputs

## Quality Features

**SynthID Watermarking:** "All generated images include a SynthID watermark."

**Text Accuracy:** Gemini 3 Pro excels at rendering legible, stylized text for professional assets like logos, menus, and diagrams.

**Thinking Process:** The Gemini 3 model generates interim "thought images" to refine composition before producing final output (internal, not charged).

## Grounding with Google Search

Gemini 3 Pro can integrate real-time information through Google Search tool integration, enabling image generation based on current weather, stock data, or recent events. The response includes `groundingMetadata` with sources.

## Limitations

- Optimal performance with: English, Arabic (Egypt), German, Spanish (Mexico), French, Hindi, Indonesian, Italian, Japanese, Korean, Portuguese (Brazil), Russian, Ukrainian, Vietnamese, and Chinese
- Model won't always generate exact quantity of images requested
- Best results generating text first, then requesting text-containing images

## Additional Resources

- Batch API support for high-volume generation (24-hour turnaround)
- Token counting and context caching available
- Integration with Imagen 4 as alternative specialized model

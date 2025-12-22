# Gemini API Resources Guide

Reference documentation for PixelMilk implementation, organized by development phase.

---

## Model Reference

| Model | Purpose | Notes |
|-------|---------|-------|
| `gemini-3-pro-image-preview` | Image generation | Primary model for sprite/image generation |
| `gemini-3-flash-preview` | Text/JSON structured output | For identity generation, text analysis |
| `gemini-2.5-flash-image` | Image EDITING only | NOT for generation - use for inpainting/editing |
| `gemini-2.5-flash` | General text with tools | Google Search, structured output |
| `gemini-2.5-flash-native-audio-preview` | Voice/audio | Live API with function calling |
| `imagen-4.0-generate-001` | High-quality image gen | Alternative for specific styles |
| `veo-3.1-fast-generate-preview` | Video generation | For animation sequences |

---

## Phase 2: Character Generation (CURRENT)

### Relevant Resources

#### `consistent_imagery_generation.ipynb`
**Path:** `Resources and Guides/consistent_imagery_generation.ipynb`

The ESSENTIAL reference for character consistency. Key concepts:

1. **Character Sheet Generation**
   - Use multi-view prompts: "Front view" + "Back view" on same image
   - Include style parameters in character sheet
   - Add accessories (backpacks, weapons) directly in sheet

2. **Scene Composition with Reference**
   ```
   - Image 1: Robot character sheet.
   - Scene: [description]
   - The robot [action/position]
   ```

3. **Config Options**
   ```typescript
   imageConfig: { aspectRatio: '16:9' }  // or '1:1', '3:4', etc.
   responseModalities: ['IMAGE']  // or ['TEXT', 'IMAGE'] for feedback
   ```

4. **Best Practices**
   - Specify which image is which: "Image 1: character sheet, Image 2: previous scene"
   - Use "Remove [item]" to prevent unwanted carryover
   - Temperature affects variation - lower for consistency

#### `gemini-co-drawing/`
**Path:** `Resources and Guides/gemini-co-drawing/Home.tsx`

Canvas + text prompt = image generation. Key patterns:
- Canvas to base64: `canvas.toDataURL('image/png').split(',')[1]`
- Multi-modal content: `[{ inlineData: { data, mimeType } }, { text: prompt }]`
- Model: `gemini-2.5-flash-image` (for editing existing drawings)

#### `one-shot-arcade/`
**Path:** `Resources and Guides/one-shot-arcade/services/gemini.ts`

Sprite generation from reference images:
```typescript
// Sprite from photo - uses gemini-3-pro-image-preview
const response = await ai.models.generateContent({
  model: 'gemini-3-pro-image-preview',
  contents: {
    parts: [
      { inlineData: { data: imageBase64, mimeType } },
      { text: promptStr }
    ]
  },
  config: { responseModalities: [Modality.IMAGE] }
});
```

Key prompt patterns:
- "Centered on a solid WHITE (#FFFFFF) background" - for easy background removal
- "Thick black pixel-art outlines" - enforces clean edges
- "No borders. No frames. No vignette." - prevents unwanted decorations

---

## Phase 3: Canvas & Editing Tools

### Relevant Resources

#### `pixshop/`
**Path:** `Resources and Guides/pixshop/services/geminiService.ts`

Localized image editing with hotspot coordinates:
```typescript
const prompt = `Edit Location: Focus on the area around pixel coordinates (x: ${hotspot.x}, y: ${hotspot.y}).`;
```

Uses `gemini-2.5-flash-image` for editing operations:
- `generateEditedImage()` - localized edits at specific coordinates
- `generateFilteredImage()` - global style filters
- `generateAdjustedImage()` - global adjustments

#### `home-canvas/`
**Path:** `Resources and Guides/home-canvas/services/geminiService.ts`

Object composition in scenes:
1. Resize images to standard dimension (1024x1024 with padding)
2. Use semantic location descriptions for placement
3. Mark image with red dot for reference
4. Generate composite with clean reference

Key technique: **Semantic placement prompts**
```
"The product location is on the dark grey fabric of the sofa cushion,
in the middle section, slightly to the left of the white throw pillow."
```

#### `NanoBananaEditor-main/`
**Path:** `Resources and Guides/NanoBananaEditor-main/.../services/geminiService.ts`

Image editing with masks:
```typescript
// Mask-based editing
const maskInstruction = request.maskImage
  ? "Apply changes ONLY where the mask image shows white pixels (value 255)."
  : "";
```

Segmentation for selection:
```typescript
// Query: "the object at pixel (x,y)" or "the red car"
async segmentImage(request: SegmentationRequest): Promise<any>
```

#### `spatial-understanding/`
**Path:** `Resources and Guides/spatial-understanding/`

Object detection with bounding boxes:
- 2D bounding boxes: `BoundingBoxes2DAtom`
- 3D bounding boxes: `BoundingBoxes3DAtom`
- Mask overlays: `BoundingBoxMasksAtom`
- Point selection: `PointsAtom`

---

## Phase 4+: Advanced Features

### Voice & Real-time

#### `gemini-ink-studio/`
**Path:** `Resources and Guides/gemini-ink-studio/services/liveApi.ts`

Live API with voice + function calling:
```typescript
const session = await ai.live.connect({
  model: 'gemini-2.5-flash-native-audio-preview',
  config: {
    responseModalities: [Modality.AUDIO],
    tools: [{ functionDeclarations: tools }]
  },
  callbacks: { onmessage, onopen, onclose, onerror }
});
```

Function declarations for tool control:
```typescript
const tools: FunctionDeclaration[] = [
  { name: 'updateSimulation', description: '...', parameters: {...} },
  { name: 'setColor', description: '...', parameters: {...} }
];
```

### Prompt Refinement

#### `proactive-co-creator/`
**Path:** `Resources and Guides/proactive-co-creator/services/geminiService.ts`

Belief graph for prompt decomposition:
```typescript
// Parse prompt into entities, attributes, relationships
const graph = await parsePromptToBeliefGraph(prompt, mode);

// Generate clarifying questions
const clarifications = await generateClarifications(prompt, askedQuestions, mode);

// Refine with user answers
const refined = await refinePromptWithAllUpdates(prompt, clarifications, graphUpdates);
```

Retry logic with exponential backoff:
```typescript
const withRetry = async <T>(fn, retries = 3, initialDelay = 1000) => {
  let currentDelay = initialDelay;
  for (let i = 0; i < retries; i++) {
    try { return await fn(); }
    catch (error) {
      if (isRetryableError(error)) {
        await delay(currentDelay);
        currentDelay = currentDelay * 2 + Math.random() * 1000;
      } else throw error;
    }
  }
};
```

### UI Generation

#### `flash-ui/`
**Path:** `Resources and Guides/flash-ui/index.tsx`

Streaming JSON parsing:
```typescript
const parseJsonStream = async function* (responseStream) {
  let buffer = '';
  for await (const chunk of responseStream) {
    buffer += chunk.text;
    // Parse complete JSON objects from buffer
  }
};
```

Multiple variations with high temperature:
```typescript
config: { temperature: 1.2 }  // For creative variations
```

### Infographics & Annotation

#### `augmented-image/`
**Path:** `Resources and Guides/augmented-image/services/geminiService.ts`

Image analysis with bounding boxes:
```typescript
// Analyze regions and return structured data
const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: [{ role: 'user', parts: [{ text: prompt }, { inlineData }] }],
  config: { tools: [{ googleSearch: {} }] }  // Grounding with search
});
```

Region annotation format:
```json
{
  "segments": [{
    "label": "Name",
    "bounds": { "x": 0-100, "y": 0-100, "width": 0-100, "height": 0-100 },
    "description": "Rich text description"
  }]
}
```

---

## API Configuration Reference

### Generation Config
```typescript
config: {
  temperature: 0.3,           // 0.0-2.0, lower = deterministic
  maxOutputTokens: 1024,      // Cap output length
  responseMimeType: 'application/json',
  responseSchema: schema,     // Structured output
  responseModalities: [Modality.IMAGE],
  imageConfig: { aspectRatio: '1:1' },
  thinkingConfig: { thinkingLevel: 'LOW' | 'HIGH' }
}
```

### Structured Output Schema
```typescript
// Gemini supports: type, properties, required, items, enum
// Does NOT support: maxLength for strings (only maxItems for arrays)
const schema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    colors: { type: Type.ARRAY, items: { type: Type.STRING } }
  },
  required: ['name']
};
```

### Image Input/Output
```typescript
// Input
{ inlineData: { mimeType: 'image/png', data: base64String } }

// Output extraction
const parts = response.candidates?.[0]?.content?.parts ?? [];
const imagePart = parts.find(p => p.inlineData);
const base64 = imagePart.inlineData.data;
```

---

## Quick Reference by Feature

| Feature | Model | Resource |
|---------|-------|----------|
| Sprite generation | `gemini-3-pro-image-preview` | one-shot-arcade |
| Character consistency | `gemini-3-pro-image-preview` | consistent_imagery_generation |
| Localized editing | `gemini-2.5-flash-image` | pixshop |
| Mask-based editing | `gemini-2.5-flash-image` | NanoBananaEditor |
| Object detection | `gemini-2.5-flash` | spatial-understanding |
| Prompt refinement | `gemini-2.5-flash` | proactive-co-creator |
| Voice control | `gemini-2.5-flash-native-audio` | gemini-ink-studio |
| Streaming UI gen | `gemini-3-flash-preview` | flash-ui |
| Image annotation | `gemini-2.5-flash` + grounding | augmented-image |
| Canvas drawing | `gemini-2.5-flash-image` | gemini-co-drawing |
| Scene composition | `gemini-2.5-flash-image` | home-canvas |

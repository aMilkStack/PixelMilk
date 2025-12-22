# PixelMilk Architecture Flaws Analysis

Based on NotebookLM analysis, several gaps in logic and implementation exist within the PixelMilk architecture that may impact the quality and technical utility of the generated assets.

## 1. The "Perfect Grid" Problem

The sources note that AI models, including the Nano Banana family, do not naturally understand perfect grid structures.

- **The Logic Gap:** While PixelMilk uses pngToPixelArray with nearest-neighbor scaling to convert AI outputs, this may be insufficient.

- **Implementation Risk:** AI-generated "pixels" are often inconsistent in size or off-grid. Without a dedicated "pixel snapper" (a tool that re-maps logic pixels into a strict grid), assets intended for game engines may exhibit visual artifacts or blurriness. A simple downscale might not correct alignment errors created by the AI's internal rendering.

## 2. Suboptimal Model Routing

PixelMilk's architecture maps specific tasks to models, but recent documentation suggests some of these assignments may be inefficient:

- **Generation vs. Editing:** Source material for developers explicitly states that Gemini 2.5 Flash Image (Nano Banana) is often "NOT for generation" but rather for inpainting and editing.

- **The Pro Advantage:** For the Character Tab (Phase 2) and Tile Tab (Phase 5), using Gemini 2.5 Flash for primary generation may miss the superior "Thinking" process of Gemini 3 Pro, which plans composition and verifies physics before rendering.

- **Reasoning Budgets:** Gemini 3 Pro requires managing "thought signatures" and includeThoughts parameters to maintain reasoning context across turns. If PixelMilk's service layer discards these signatures, multi-turn iterative editing will eventually fail or drift.

## 3. Context and Identity Drift

Sources indicate that "identity drift"—where a character's features change between images—is a primary frustration for AI users.

- **Conversation Management:** Iterative editing in a single conversation has a tendency to get "stuck," where the model ignores requested changes or forgets the subject's identity after 3–4 turns.

- **Missing Technique:** Professional users recommend "Reference Stacking" (uploading up to 14 reference images simultaneously) and starting new conversations for major changes rather than long threads. PixelMilk's Phase 2 and 4 should emphasize passing back a library of reference images rather than just a text "identity document".

## 4. Technical Constraints for Multimodal Input

There are specific technical requirements for sending user-drawn data to Gemini that are not fully detailed in the early Phase plans:

- **Background Handling:** Before sending any canvas data (Co-Drawing/Phases 3 and 14) to the API, it is CRITICAL to add a solid white background. Transparent backgrounds commonly cause generation errors in the Nano Banana models.

- **"Edit, Don't Re-roll":** PixelMilk's UI focuses on "Generate" buttons for new variants. However, the "Golden Rule" for professional Nano Banana output is "Edit, Don't Re-roll"—using conversational natural language to adjust 80% correct images rather than starting over.

## 5. On-Device Realities

The name "Nano" often creates a misconception that the model runs locally on a user's hardware.

- **Cloud Dependency:** "Nano Banana" (Gemini 2.5 Flash Image) is a cloud-based model, not an on-device model like the standard Gemini Nano used for text summarization.

- **Implementation Risk:** If PixelMilk expects to support offline editing or assumes zero latency for image synthesis, the implementation will fail. Generative workflows require active internet connections for both upload and download.

---

## Additional Technical Flaws

Building on the previous analysis of PixelMilk's architecture, the sources reveal further technical flaws and significant opportunities for logic improvements to reach a professional standard.

### Structural Flaws in Model Routing

While PixelMilk's initial phases rely on Gemini 2.5 Flash Image for generation, official developer resources explicitly categorize this model as "NOT for generation," recommending it strictly for inpainting and editing.

- **The Issue:** Using the Flash model for primary creation often results in "hallucinated" anatomy or physics errors.

- **Key Change:** The app should route all Phase 2 (Character) and Phase 5 (Tile) base generations to Gemini 3 Pro Image (Nano Banana Pro), which utilizes a "Thinking" phase to plan scene structure and physical causality (like gravity and fluid dynamics) before rendering.

### The "Off-Grid" Logic Gap

PixelMilk's current implementation uses pngToPixelArray with nearest-neighbor scaling to convert AI outputs into editable pixel art.

- **The Issue:** Sources note that generative models do not naturally understand perfect grid structures; pixels in the output are often "off-grid" or inconsistent in size.

- **Area of Improvement:** To make assets truly "game-engine ready," the app needs a dedicated "pixel snapper" (ideally a high-performance module like those built in Rust) that re-maps these logic pixels into a strict, uniform grid to prevent "jaggies" or visual artifacts upon scaling.

### Critical Failure Points in Canvas Data

The Co-Drawing and Canvas Tools (Phases 3 and 14) require sending user-drawn data to the API.

- **Key Issue:** Sending a canvas with a transparent background is a primary cause of generation errors in the Nano Banana family.

- **Required Change:** The service layer must programmatically inject a solid white background (#FFFFFF) onto a temporary canvas before converting it to the base64 data string required by the API.

### Conversation Staleness and "Thought Signatures"

When using the advanced "Thinking" mode for iterative edits, the app faces a "Limbo State" where the model may ignore requests or forget character identity after 3–4 turns.

- **The Issue:** Gemini 3 Pro requires the circulation of "Thought Signatures" (encrypted reasoning context) across multi-turn turns.

- **Key Change:** If PixelMilk's service layer fails to pass these signatures back exactly as received, the response will fail. To maintain 95%+ character consistency, the app should also implement "Reference Stacking," uploading up to 14 reference images simultaneously rather than relying on a text-based "Identity Card" alone.

### Resolution and the "Last Mile" of Quality

PixelMilk currently targets 128px and 256px canvas sizes.

- **Area of Improvement:** Professional creators argue that raw AI output is often not "print-ready" due to subtle "AI blur" or textural distortions.

- **Suggested Enhancement:** The app should leverage Gemini 3 Pro's native 4K resolution and 16-bit color pipeline. Integrating an AI Image Enhancer as a final post-processing step would help remove these artifacts and prepare images for high-definition 4K displays or professional printing.

---

**Analogy for Understanding:** Relying on simple nearest-neighbor scaling without a pixel-snapping tool is like taking a photo of a brick wall and trying to use it as a 3D model in a game. It might look like a wall, but because the "bricks" (pixels) aren't perfectly aligned to the game world's grid, your character will constantly "glitch" or get stuck on the uneven edges. You need a digital mason (a pixel snapper) to ensure every block fits perfectly before you start building.

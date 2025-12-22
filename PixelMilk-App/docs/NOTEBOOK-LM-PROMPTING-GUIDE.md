# Nano Banana Prompting Guide for PixelMilk

To get the most out of Nano Banana (the Gemini 2.5 Flash Image model) within the PixelMilk app, you should leverage its speed for iterative editing while using specific prompting structures to enforce a traditional pixel-art aesthetic.

The following strategies are recommended based on the documentation:

## 1. Master Descriptive Prompting

Nano Banana performs best when you provide narrative, descriptive paragraphs instead of simple keyword lists.

- **Enforce Technical Specs:** Use the app's Prompt Wand to enhance simple ideas. For example, instead of "a tree," use: "A 32x32 pixel art deciduous tree, brown trunk with 2-3 shading levels, green foliage cluster using dithering, selective outline on trunk, transparent background".

- **Use Negative Constraints:** To ensure clean game assets, explicitly prompt: "Centered on a solid WHITE (#FFFFFF) background," "Thick black pixel-art outlines," and "No borders. No frames. No vignette".

- **Specify Art Style:** Be explicit about color palettes (e.g., "limited 16-color palette") and line weight to maintain a consistent look.

## 2. Leverage Character Sheets for Consistency

One of the best ways to reuse images with Nano Banana is to generate character sheets.

- **Multi-View Prompts:** Request "front view" and "back view" on the same image to preserve visual features across different angles.

- **Object State Management:** When iterating, use specific instructions like "Remove [item]" or "no longer holding X" to prevent the model from carrying over unwanted objects from previous generations.

- **Identify Reference Images:** When providing multiple inputs, label them clearly as "Image 1: [description]" and refer to specific entities as "the [entity] from image [number]" to avoid confusion.

## 3. Use the Co-Drawing Workflow

Because Nano Banana is optimized for speed and efficiency, it is the recommended model for the Co-Drawing feature where you iterate on sketches.

- **Multimodal Input Structure:** Send your drawing as the first part of the prompt, followed by the text instruction as a second part.

- **Style Preservation:** Always include a style anchor in your follow-up prompts, such as: "[Prompt text]. Keep the same pixel art style with clean edges".

- **White Backgrounds:** Ensure your canvas adds a solid white background before sending data to Gemini, as transparent backgrounds can cause generation errors.

## 4. Utilize Hotspot Editing

For localized refinements, use the PixShop-style click-to-edit system.

- By providing specific pixel coordinates (x, y) to Nano Banana, you can request natural, localized edits (like changing a character's hat or eye color) while ensuring the rest of the image remains identical to the original.

## 5. Technical Optimization

- **Resolution Awareness:** Nano Banana generates images at a 1024px resolution. The PixelMilk app then converts these PNG outputs into pixel arrays using nearest-neighbor scaling to maintain "pixel-perfect" integrity.

- **Aspect Ratios:** If you omit an aspect ratio, the model will use the ratio of your last input image; otherwise, you can specify standard ratios like 1:1 or 16:9.

---

**Analogy for Understanding:** Think of Nano Banana as a highly skilled apprentice sketch artist. If you give it a vague request, it might get the vibe wrong. However, if you hand it a character reference (Character Sheet), point to a specific spot on the page (Hotspot Editing), and tell it exactly which pens to use (Technical Prompting), it can iterate through dozens of variations faster than a master could ever draw them.

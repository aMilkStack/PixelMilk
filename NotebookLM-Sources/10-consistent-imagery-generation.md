# Generating Consistent Imagery with Gemini (Nano Banana)

## Challenge

We all have existing images worth reusing in different contexts. This would generally imply modifying the images, a complex (if not impossible) task requiring very specific skills and tools. State-of-the-art vision models have evolved so much that we can reconsider this problem.

So, can we breathe new life into our visual archives?

Let's try to complete this challenge with the following steps:

- 1. Start with an archive image we'd like to reuse
- 2. Extract a character to create a brand-new reference image
- 3. Generate a series of images to illustrate the character's journey, using only prompts and the new assets

For this, we'll explore the capabilities of "Gemini 2.5 Flash Image", also known as "Nano Banana".

## Gemini Model

For this challenge, we select the latest Gemini 2.5 Flash Image model:

`GEMINI_2_5_FLASH_IMAGE = "gemini-2.5-flash-image"`

## Configuration

```python
from google.genai.types import GenerateContentConfig, ImageConfig

# You can add the "TEXT" modality for potential textual feedback (or in iterative chat mode)
RESPONSE_MODALITIES = ["IMAGE"]

# Supported aspect ratios: "1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", and "21:9"
ASPECT_RATIO = "16:9"

GENERATION_CONFIG = GenerateContentConfig(
    response_modalities=RESPONSE_MODALITIES,
    image_config=ImageConfig(aspect_ratio=ASPECT_RATIO),
)
```

## Asset Extraction

### Simple Extraction (Background Removal)
```
source_ids = [AssetId.ARCHIVE]
prompt = "Extract the robot in a clean cutout on a solid white fill."
```

**Warning**: The robot is perfectly extracted, but this is essentially a good background removal job. This prompt uses terms from graphics software, whereas we can now reason in terms of image composition. It's also not necessarily a good idea to try to use traditional binary masks, as object edges and shadows convey significant details about shapes, textures, positions, and lighting.

### Character Sheet Generation

Gemini has spatial understanding, so it is able to provide different views while preserving visual features. Generate a front/back character sheet:

```
source_ids = [AssetId.ARCHIVE]
prompt = """
- Scene: Robot character sheet.
- Left: Front view of the extracted robot.
- Right: Back view of the extracted robot (seamless back).
- The robot wears a same small, brown-felt backpack, with a tiny polished-brass buckle and simple straps in both views. The backpack straps are visible in both views.
- Background: Pure white.
- Text: On the top, caption the image "ROBOT CHARACTER SHEET" and, on the bottom, caption the views "FRONT VIEW" and "BACK VIEW".
"""
```

**Key Insights**:
- Our prompt focuses on the composition of the scene, a common practice in media studios.
- Successive generated images will be consistent, preserving all robot features visible in the provided image.
- Since we only specified some features of the backpack (e.g., a single buckle) and left others unspecified, we'll get slightly different backpacks.
- For simplicity, we directly included the backpack in the character sheet. In a real production pipeline, we would likely make it part of a separate accessory sheet.
- To control the backpack's exact shape and design, we could also use a reference photo of a real backpack and instruct Gemini to "transform the backpack into a stylized felt version."
- Gemini can generate `1024 × 1024` images (`1:1` aspect ratio) or equivalent resolutions (token-wise) for the other supported aspect ratios.

## Scene Generation

### First Scene - Mountain Scenery
```
source_ids = [AssetId.ROBOT]
prompt = """
- Image 1: Robot character sheet.
- Scene: Macro photography of a beautifully crafted miniature diorama.
- Background: Soft-focus of a panoramic range of interspersed, dome-like felt mountains, in various shades of medium blue/green, with curvy white snowcaps, extending over the entire horizon.
- Foreground: In the bottom-left, the robot stands on the edge of a medium-gray felt cliff, viewed from a 3/4 back angle, looking out over a sea of clouds (made of white cotton).
- Lighting: Studio, clean and soft.
"""
```

**Note**: The mountain shape is specified as "dome-like" so our character can stand on one of the summits later on.

It's important to spend some time on this first scene, as it will have a cascading effect that defines the overall look of our story. Take some time to refine the prompt or try a couple of times to get your preferred variation.

### Successive Scene - Valley
```
source_ids = [AssetId.ROBOT, AssetId.MOUNTAINS]
prompt = """
- Image 1: Robot character sheet.
- Image 2: Previous scene.
- The robot has descended from the cliff to a gray felt valley. It stands in the center, seen directly from the back. It is holding/reading a felt map with outstretched arms.
- Large smooth, round, felt rocks in various beige/gray shades are visible on the sides.
- Background: The distant mountain range. A thin layer of clouds obscures its base and the end of the valley.
- Lighting: Golden hour light, soft and diffused.
"""
```

**Key Insights**:
- The provided specifications about our input images (`"Image 1:…"` and `"Image 2:…"`) are important. Without them, "the robot" could refer to any of the 3 robots in the input images (2 in the character sheet, 1 in the previous scene). With them, we indicate that it is the same robot. In case of confusion, we can be more specific with `"the [entity] from image [number]"`.
- Since we didn't provide a precise description of the valley, successive requests will give different, interesting, and creative results.
- Here, we also tested a different lighting, which significantly changes the whole scene.

### Scene - Forest Entry
```
source_ids = [AssetId.ROBOT, AssetId.VALLEY]
prompt = """
- Image 1: Robot character sheet.
- Image 2: Previous scene.
- The robot goes on and faces a dense, infinite forest of simple, giant, thin trees, that fills the entire background.
- The trees are made from various shades of light/medium/dark green felt.
- The robot is on the right, viewed from a 3/4 rear angle, no longer holding the map, with both hands clasped to its ears in despair.
- On the left & right bottom sides, rocks (similar to image 2) are partially visible.
"""
```

**Key Insights**:
- We could position the character, change its point of view, and even "animate" its arms for more expressivity.
- The "no longer holding the map" precision prevents the model from trying to keep it from the previous scene in a meaningful way (e.g., the robot dropped the map on the floor).
- We didn't provide lighting details: The lighting source, quality, and direction have been kept from the previous scene.

### Scene - Clearing
```
source_ids = [AssetId.ROBOT, AssetId.FOREST]
prompt = """
- Image 1: Robot character sheet.
- Image 2: Previous scene.
- The robot goes through the dense forest and emerges into a clearing, pushing aside two tree trunks.
- The robot is in the center, now seen from the front view.
- The ground is made of green felt, with flat patches of white felt snow. Rocks are no longer visible.
"""
```

**Note**: We changed the ground but didn't provide additional details for the view and the forest: The model will generally preserve most of the trees.

### Scene - Mountain Climbing
```
source_ids = [AssetId.ROBOT, AssetId.MOUNTAINS]
prompt = """
- Image 1: Robot character sheet.
- Image 2: Previous scene.
- Close-up of the robot now climbing the peak of a medium-green mountain and reaching its summit.
- The mountain is right in the center, with the robot on its left slope, viewed from a 3/4 rear angle.
- The robot has both feet on the mountain and is using two felt ice axes (brown handles, gray heads), reaching the snowcap.
- Horizon: The distant mountain range.
"""
```

**Note**: The mountain close-up, inferred from the blurred background, is pretty impressive.

### Scene - Summit Victory
```
source_ids = [AssetId.ROBOT, AssetId.ASCENSION]
prompt = """
- Image 1: Robot character sheet.
- Image 2: Previous scene.
- The robot reaches the top and stands on the summit, seen in the front view, in close-up.
- It is no longer holding the ice axes, which are planted upright in the snow on each side.
- It has both arms raised in sign of victory.
"""
```

### Scene Recomposition - Bridge
```
source_ids = [AssetId.ROBOT, AssetId.SUMMIT]
prompt = """
- Image 1: Robot character sheet.
- Image 2: Previous scene.
- Remove the ice axes.
- Move the center mountain to the left edge of the image and add a slightly taller medium-blue mountain to the right edge.
- Suspend a stylized felt bridge between the two mountains: Its deck is made of thick felt planks in various wood shades.
- Place the robot on the center of the bridge with one arm pointing toward the blue mountain.
- View: Close-up.
"""
```

**Key Insights**:
- This imperative prompt composes the scene in terms of actions. It is sometimes easier than descriptions.
- A new mountain is added as instructed, and it is both different and consistent.
- The bridge attaches to the summits in very plausible ways and seems to obey the laws of physics.
- The "Remove the ice axes" instruction is here for a reason. Without it, it is as if we were prompting "do whatever you can with the ice axes from the previous scene: leave them where they are, don't let the robot leave without them, or anything else", leading to random results.

### Scene - Hammock Rest
```
source_ids = [AssetId.ROBOT, AssetId.BRIDGE]
prompt = """
- Image 1: Robot character sheet.
- Image 2: Previous scene.
- The robot is sleeping peacefully (both eyes changed into a "closed" state), in a comfortable brown-and-tan tartan hammock that has replaced the bridge.
"""
```

**Key Insights**:
- This time, the prompt is descriptive, and it works as well as the previous imperative prompt.
- The bridge-hammock transformation is really nice and preserves the attachments on the mountain summits.
- The robot transformation is also impressive, as it has not been seen in this position before.
- The closed eyes are the most difficult detail to get consistently (may require a couple of attempts), probably because we're accumulating many different transformations at once (and diluting the model's attention). For full control and more deterministic results, we can focus on significant changes over iterative steps, or create various character sheets upfront.

## Key Learnings

We managed to generate a full set of new consistent images with Nano Banana and learned a few things along the way:

1. **Images are worth a thousand words**: It is now a lot easier to generate new images from existing ones and simple instructions.

2. **Composition-focused prompting**: We can create or edit images just in terms of composition (letting us all become artistic directors).

3. **Descriptive or imperative**: We can use descriptive or imperative instructions.

4. **Spatial understanding**: The model's spatial understanding allows 3D manipulations.

5. **Text in outputs**: We can add text in our outputs (character sheet) and also refer to text in our inputs (front/back views).

6. **Multi-level consistency**: Consistency can be preserved at very different levels: character, scene, texture, lighting, camera angle/type…

7. **Faster iteration**: The generation process can still be iterative but it feels like 10x-100x faster for reaching better-than-hoped-for results.

8. **Archive revival**: It is now possible to breathe new life into our archives!

## Best Practices Summary

### Image References
- Use `"Image 1:…"` and `"Image 2:…"` to clearly identify which input image you're referring to
- Be more specific with `"the [entity] from image [number]"` if there's confusion

### Object State Management
- Explicitly state "no longer holding X" to prevent unwanted persistence
- Use "Remove X" instructions to prevent random handling of objects from previous scenes

### Consistency Control
- First scene sets the overall look - spend time refining it
- Character sheets ensure feature consistency across generations
- Lighting persists if not specified

### Prompt Styles
- Descriptive: Describe the final state
- Imperative: Describe actions to compose the scene
- Both work well; choose based on what's easier to express

### Aspect Ratios
Supported: "1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", and "21:9"

If aspect_ratio is omitted, Gemini uses the aspect ratio of the input image (the last one if multiple are provided) to select the closest supported aspect ratio.

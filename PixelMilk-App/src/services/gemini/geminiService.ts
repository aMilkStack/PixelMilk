import { Modality, ThinkingLevel } from "@google/genai";
import type { Chat } from "@google/genai";
import { CharacterIdentity, Direction, StyleParameters, QualityMode, SpriteData } from "../../types";
import { getClient, createSpriteSession, getSpriteSession, sendSpriteMessage } from "./client";
import { getConfigForTask } from "./modelRouter";
import { characterIdentitySchema } from "./schemas";
import { normalizeIdentity } from "../../utils/normalizeIdentity";
import { buildTechniquePrompt, getSystemInstruction, getProhibitionsPrompt } from "../../data/pixelArtTechniques";
import { prepareCanvasForGemini } from "../../utils/imageUtils";
import { getLospecColors } from "../../data/lospecPalettes";

/**
 * Maps our string-based thinkingLevel to SDK enum values
 */
function mapThinkingLevel(level: 'minimal' | 'low' | 'medium' | 'high'): ThinkingLevel {
  const mapping: Record<string, ThinkingLevel> = {
    minimal: ThinkingLevel.MINIMAL,
    low: ThinkingLevel.LOW,
    medium: ThinkingLevel.MEDIUM,
    high: ThinkingLevel.HIGH,
  };
  return mapping[level] ?? ThinkingLevel.LOW;
}

/**
 * Determines if an error is retryable (transient) or permanent
 * Returns true for transient errors (429, 5xx, network errors)
 * Returns false for permanent errors (401, 403, 400, etc.)
 */
const isRetryableError = (error: unknown): boolean => {
  if (!error) return false;

  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStr = errorMessage.toLowerCase();

  // Check for HTTP status codes in error message
  // Permanent errors - don't retry
  if (errorStr.includes('401') || errorStr.includes('unauthorized')) return false;
  if (errorStr.includes('403') || errorStr.includes('forbidden')) return false;
  if (errorStr.includes('400') || errorStr.includes('bad request')) return false;
  if (errorStr.includes('404') || errorStr.includes('not found')) return false;
  if (errorStr.includes('invalid api key') || errorStr.includes('api key')) return false;

  // Transient errors - retry with backoff
  if (errorStr.includes('429') || errorStr.includes('rate limit') || errorStr.includes('quota')) return true;
  if (errorStr.includes('500') || errorStr.includes('502') || errorStr.includes('503') || errorStr.includes('504')) return true;
  if (errorStr.includes('internal server error') || errorStr.includes('service unavailable')) return true;
  if (errorStr.includes('timeout') || errorStr.includes('network') || errorStr.includes('econnreset')) return true;
  if (errorStr.includes('enotfound') || errorStr.includes('econnrefused')) return true;

  // Default: assume retryable for unknown errors
  return true;
};

/**
 * Calculate exponential backoff delay
 * attempt 0 = 1000ms, attempt 1 = 2000ms, attempt 2 = 4000ms
 */
const getBackoffDelay = (attempt: number): number => {
  return Math.min(1000 * Math.pow(2, attempt), 8000);
};

/**
 * Builds the palette instruction for Gemini based on paletteMode setting
 * - If 'auto': Uses the character's identity colours (6 semantic colours)
 * - If 'lospec_xxx': Uses the specific Lospec palette colours
 */
const buildPalettePrompt = (identity: CharacterIdentity): string => {
  const { paletteMode } = identity.styleParameters;
  const identityPalette = identity.colourPalette;

  // Always include identity colours for semantic meaning
  const semanticColors = `Character colours - Primary: ${identityPalette.primary}, Secondary: ${identityPalette.secondary}, Accent: ${identityPalette.accent}, Skin: ${identityPalette.skin}, Hair: ${identityPalette.hair}, Outline: ${identityPalette.outline}`;

  // Check if using a Lospec palette
  if (paletteMode && paletteMode.startsWith('lospec_')) {
    const lospecColors = getLospecColors(paletteMode);
    if (lospecColors && lospecColors.length > 0) {
      const colorList = lospecColors.join(', ');
      return `COLOR PALETTE CONSTRAINT:
You MUST use ONLY colours from this palette: ${colorList}
Total available colours: ${lospecColors.length}

${semanticColors}

Match the character's semantic colours to the closest available palette colours.
Do NOT use any colours outside this palette.`;
    }
  }

  // Default: auto mode - use identity colours freely
  return `COLOR PALETTE: ${semanticColors}

Use these colours and natural variations/shades derived from them.`;
};

/**
 * Validates that the parsed JSON has the expected structure for a CharacterIdentity
 * Returns true if valid, throws descriptive error if invalid
 */
const validateIdentityJson = (raw: unknown): raw is Record<string, unknown> => {
  if (raw === null || raw === undefined) {
    throw new Error("Parsed JSON is null or undefined");
  }

  if (typeof raw !== 'object') {
    throw new Error(`Expected object, got ${typeof raw}`);
  }

  const obj = raw as Record<string, unknown>;

  // Check required top-level fields exist
  const requiredFields = ['name', 'description'];
  for (const field of requiredFields) {
    if (!(field in obj)) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  // Validate name is a non-empty string
  if (typeof obj.name !== 'string' || obj.name.trim().length === 0) {
    throw new Error("'name' must be a non-empty string");
  }

  // Validate description is a string
  if (typeof obj.description !== 'string') {
    throw new Error("'description' must be a string");
  }

  // Validate colourPalette structure if present
  if ('colourPalette' in obj && obj.colourPalette !== null) {
    if (typeof obj.colourPalette !== 'object') {
      throw new Error("'colourPalette' must be an object");
    }
  }

  // Validate physicalDescription structure if present
  if ('physicalDescription' in obj && obj.physicalDescription !== null) {
    if (typeof obj.physicalDescription !== 'object') {
      throw new Error("'physicalDescription' must be an object");
    }
  }

  // Validate distinctiveFeatures is an array if present
  if ('distinctiveFeatures' in obj && obj.distinctiveFeatures !== null) {
    if (!Array.isArray(obj.distinctiveFeatures)) {
      throw new Error("'distinctiveFeatures' must be an array");
    }
  }

  return true;
};

/**
 * Master Pixel Artist System Instruction (NotebookLM)
 *
 * Uses expert-framed persona with narrative context instead of keyword lists.
 * The "Thinking" model works best with descriptive, philosophy-driven instructions.
 */
const SPRITE_SYSTEM_PROMPT = `${getSystemInstruction()}

OUTPUT FORMAT:
Your final output will be a single PNG image file with transparent background.
You will omit any explanatory text, focusing solely on delivering the generated pixel art as the primary response.

${getProhibitionsPrompt()}`;

export const generateCharacterIdentity = async (
  description: string,
  style: StyleParameters
): Promise<CharacterIdentity> => {
  const client = getClient();
  const config = getConfigForTask('text-analysis', 'draft');
  const now = Date.now();

  const systemPrompt = `You are an expert technical game artist. Convert character descriptions into structured JSON for a pixel art pipeline.

CRITICAL OUTPUT RULES:
- Return ONLY valid JSON
- Do NOT wrap output in markdown code blocks
- Do NOT include any text before or after the JSON
- The response must start with { and end with }

Output this exact JSON structure:
{
  "id": "char-${now}",
  "name": "Character Name",
  "description": "original description verbatim",
  "physicalDescription": {
    "bodyType": "slim/average/muscular/round",
    "heightStyle": "short/medium/tall/chibi",
    "silhouette": "distinctive outline description"
  },
  "colourPalette": {
    "primary": "#hex",
    "secondary": "#hex",
    "accent": "#hex",
    "skin": "#hex",
    "hair": "#hex",
    "outline": "#hex"
  },
  "distinctiveFeatures": ["feature1", "feature2", "feature3"],
  "styleParameters": {
    "outlineStyle": "${style.outlineStyle}",
    "shadingStyle": "${style.shadingStyle}",
    "detailLevel": "${style.detailLevel}",
    "canvasSize": ${style.canvasSize},
    "paletteMode": "${style.paletteMode}",
    "viewType": "${style.viewType}"
  },
  "angleNotes": {
    "S": "What features are visible from the front",
    "N": "What features are visible from behind",
    "E": "What features are visible from the side"
  },
  "createdAt": ${now},
  "updatedAt": ${now}
}

ANGLE NOTES RULES:
- Write 1-2 sentences for each of the 3 views (S, N, E)
- W is generated by flipping E, so only 3 angle notes needed
- Focus on asymmetric features (which hand holds items, scars, unique markings)
- Example: "Sword held in right hand, shield strapped to left arm, scar visible on right cheek"`;

  let lastError: Error | null = null;
  let text = '';

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await client.models.generateContent({
        model: config.model,
        contents: `Character Description: ${description}`,
        config: {
          systemInstruction: systemPrompt,
          temperature: config.temperature,
          maxOutputTokens: 32768, // Maximum for Gemini 3 - prevents truncation during Thinking
          responseMimeType: "application/json",
          responseSchema: characterIdentitySchema,
          ...(config.thinkingLevel && {
            thinkingConfig: { thinkingLevel: mapThinkingLevel(config.thinkingLevel) },
          }),
        },
      });

      text = response.text ?? '';
      if (text) break;

      throw new Error("No response from model");
    } catch (e) {
      console.warn(`Identity generation attempt ${attempt + 1} failed:`, e);
      lastError = e instanceof Error ? e : new Error(String(e));

      // Don't retry permanent errors (auth failures, bad requests)
      if (!isRetryableError(e)) {
        console.error("Permanent error detected, not retrying:", e);
        break;
      }

      if (attempt < 2) {
        const delay = getBackoffDelay(attempt);
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  if (!text) {
    throw lastError || new Error("Failed to generate identity after multiple attempts");
  }

  // Clean the response - remove any accidental markdown wrapping
  let cleanedText = text.trim();

  // Remove markdown code blocks if present (fallback for non-compliant responses)
  if (cleanedText.startsWith('```')) {
    const jsonMatch = cleanedText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      cleanedText = jsonMatch[1].trim();
    }
  }

  // Validate JSON completeness before parsing (NotebookLM: check for closing braces)
  // Truncated responses often end mid-field without proper closure
  if (!cleanedText.endsWith('}')) {
    console.error("JSON response appears truncated (missing closing brace):", cleanedText.substring(cleanedText.length - 100));
    throw new Error('Identity generation was truncated. Try a shorter description or regenerate.');
  }

  // Count braces to detect incomplete JSON
  const openBraces = (cleanedText.match(/{/g) || []).length;
  const closeBraces = (cleanedText.match(/}/g) || []).length;
  if (openBraces !== closeBraces) {
    console.error(`JSON brace mismatch: ${openBraces} open vs ${closeBraces} close`);
    throw new Error('Identity generation was incomplete. Try a shorter description or regenerate.');
  }

  try {
    const raw: unknown = JSON.parse(cleanedText);

    // Validate the parsed JSON structure before using it
    validateIdentityJson(raw);

    return normalizeIdentity(raw as Record<string, unknown>, style, now);
  } catch (e) {
    console.error("Failed to parse identity response:", cleanedText.substring(0, 500));
    throw new Error(`Failed to generate valid identity JSON: ${e instanceof Error ? e.message : 'Parse error'}`);
  }
};

/**
 * Direction descriptions for prompts
 */
const DIRECTION_DESCRIPTIONS: Record<Direction, string> = {
  S: 'SOUTH (Front View) - Character facing the viewer',
  N: 'NORTH (Back View) - Character facing away',
  E: 'EAST (Right Profile) - Character facing right',
  W: 'WEST (Left Profile) - Character facing left',
  SE: 'SOUTHEAST (Front-Right 3/4 View)',
  SW: 'SOUTHWEST (Front-Left 3/4 View)',
  NE: 'NORTHEAST (Back-Right 3/4 View)',
  NW: 'NORTHWEST (Back-Left 3/4 View)',
};

/**
 * Generates the initial sprite using a chat session
 * This establishes the "Character DNA" for subsequent angle generations
 * Returns base64 encoded PNG data
 */
export const generateSprite = async (
  identity: CharacterIdentity,
  direction: Direction = 'S',
  quality: QualityMode = 'draft',
  lockedPalette?: string[]
): Promise<string> => {
  const config = getConfigForTask(
    quality === 'final' ? 'sprite-final' : 'sprite-draft',
    quality
  );
  const size = identity.styleParameters.canvasSize;

  // Build palette prompt based on paletteMode (auto or lospec_xxx)
  const palettePrompt = buildPalettePrompt(identity);

  // Same composition for all canvas sizes
  const compositionGuide = 'Compact gameplay sprite - character fills frame, may crop at knees/feet';

  // Build technique-specific instructions
  const techniquePrompt = buildTechniquePrompt(
    identity.styleParameters.outlineStyle,
    identity.styleParameters.shadingStyle,
    size
  );

  // Create or get existing chat session for this character
  // Session persists thought signatures across generation calls
  let chat = getSpriteSession(identity.id);
  if (!chat) {
    chat = createSpriteSession(identity.id, config.model, SPRITE_SYSTEM_PROMPT, config.temperature);
    console.log(`Created new sprite session for character: ${identity.id}`);
  }

  const prompt = `Generate a ${size}x${size} pixel art sprite of this character:

CHARACTER: ${identity.name}
DESCRIPTION: ${identity.description}
BODY TYPE: ${identity.physicalDescription.bodyType}
SILHOUETTE: ${identity.physicalDescription.silhouette}
DISTINCTIVE FEATURES: ${identity.distinctiveFeatures.join(', ')}

STYLE:
- Outline: ${identity.styleParameters.outlineStyle}
- Shading: ${identity.styleParameters.shadingStyle}
- Detail Level: ${identity.styleParameters.detailLevel}
- View Type: ${identity.styleParameters.viewType}

VIEW: ${DIRECTION_DESCRIPTIONS[direction]}
${identity.angleNotes[direction] ? `ANGLE NOTES: ${identity.angleNotes[direction]}` : ''}

${palettePrompt}

BACKGROUND: Solid pure white (#FFFFFF) - flat background anchor

COLOUR SAFETY OFFSET (CRITICAL):
- Background pixels: ONLY pure white #FFFFFF
- Character highlights: Use #FEFEFE (off-white) for any bright/white highlights inside the sprite
- This creates mathematical distinction between sprite and background
- NEVER use #FFFFFF anywhere inside the character sprite

COMPOSITION: ${compositionGuide}

CRITICAL REQUIREMENTS:
- Output must be exactly ${size}x${size} pixels
- True pixel art with clean, crisp pixels
- No anti-aliasing on edges
- Horizontally centered
- SOLID WHITE BACKGROUND (#FFFFFF) IS MANDATORY
- Fill ALL background pixels with pure white (#FFFFFF)
- Do NOT draw a checkerboard pattern
- Do NOT use any grey, off-white, or transparent background
- Character sprite must use #FEFEFE for any white/bright highlights, NOT #FFFFFF

${techniquePrompt}`;

  let lastError;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const result = await sendSpriteMessage(chat, prompt);
      return result.imageData;
    } catch (e) {
      console.warn(`Sprite generation attempt ${attempt + 1} failed:`, e);
      lastError = e;

      if (!isRetryableError(e)) {
        console.error("Permanent error detected, not retrying:", e);
        break;
      }

      if (attempt < 2) {
        const delay = getBackoffDelay(attempt);
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error("Failed to generate sprite after multiple attempts");
};

/**
 * Reference image with direction label for reference stacking
 */
export interface ReferenceImage {
  direction: Direction;
  base64Data: string;
}

/**
 * Generates a rotated view sprite using reference stacking
 * Uses chat session for thought signature preservation
 * Accepts array of ALL existing sprites for maximum consistency
 * Returns base64 encoded PNG data
 */
export const generateRotatedSprite = async (
  identity: CharacterIdentity,
  direction: Direction,
  referenceImages: ReferenceImage[],
  quality: QualityMode = 'final',
  lockedPalette?: string[]
): Promise<string> => {
  // Use isRotation=true for lower temperature (0.8) for consistency
  const config = getConfigForTask('sprite-final', quality, { isRotation: true });
  const size = identity.styleParameters.canvasSize;
  const visibilityNotes = identity.angleNotes[direction] || "";

  // Build palette prompt based on paletteMode (auto or lospec_xxx)
  const palettePrompt = buildPalettePrompt(identity);

  // Build technique-specific instructions
  const techniquePrompt = buildTechniquePrompt(
    identity.styleParameters.outlineStyle,
    identity.styleParameters.shadingStyle,
    size
  );

  // Get existing chat session for this character
  // Must be created by generateSprite first
  let chat = getSpriteSession(identity.id);
  if (!chat) {
    // Fallback: create session if it doesn't exist (shouldn't happen in normal flow)
    console.warn(`No existing session for ${identity.id}, creating new one`);
    chat = createSpriteSession(identity.id, config.model, SPRITE_SYSTEM_PROMPT, config.temperature);
  }

  // Build reference stacking labels (NotebookLM best practice)
  // Image 1 is always the master reference (usually South/front view)
  const referenceLabels: string[] = [];
  const masterRef = referenceImages.find(r => r.direction === 'S') || referenceImages[0];

  referenceLabels.push(`IMAGE 1 (MASTER): ${DIRECTION_DESCRIPTIONS[masterRef.direction]} - This is the PRIMARY identity reference. The new sprite MUST be 100% identical to this character.`);

  // Add other references for additional context
  let imageIndex = 2;
  for (const ref of referenceImages) {
    if (ref.direction !== masterRef.direction) {
      referenceLabels.push(`IMAGE ${imageIndex}: ${DIRECTION_DESCRIPTIONS[ref.direction]} - Shows ${ref.direction} angle details.`);
      imageIndex++;
    }
  }

  // Build prompt with identity enforcement (NotebookLM: label reference images semantically)
  const prompt = `Generate a ${size}x${size} pixel art sprite - ${DIRECTION_DESCRIPTIONS[direction]}

REFERENCE IMAGES:
${referenceLabels.join('\n')}

CHARACTER: ${identity.name}
DISTINCTIVE FEATURES: ${identity.distinctiveFeatures.join(', ')}
${visibilityNotes ? `VISIBLE FROM THIS ANGLE: ${visibilityNotes}` : ''}

STYLE LOCK (must match Image 1 exactly):
- Outline: ${identity.styleParameters.outlineStyle}
- Shading: ${identity.styleParameters.shadingStyle}
- Color Palette: ${palettePrompt}

COLOUR SAFETY OFFSET (CRITICAL):
- Background pixels: ONLY pure white #FFFFFF
- Character highlights: Use #FEFEFE (off-white) for any bright/white highlights inside the sprite
- NEVER use #FFFFFF anywhere inside the character sprite

CRITICAL REQUIREMENTS:
- Match the character from Image 1 EXACTLY
- Same proportions, art style, and level of detail as Image 1
- ${size}x${size} pixels, no anti-aliasing
- SOLID WHITE BACKGROUND (#FFFFFF) IS MANDATORY
- Fill ALL background pixels with pure white (#FFFFFF)
- Do NOT draw a checkerboard pattern
- Character sprite must use #FEFEFE for any white/bright highlights, NOT #FFFFFF

${techniquePrompt}`;

  // Prepare all reference images with white backgrounds
  const preparedImages: Array<{ data: string; mimeType: string }> = [];

  // Master reference first
  try {
    const preparedMaster = await prepareCanvasForGemini(masterRef.base64Data);
    preparedImages.push({ data: preparedMaster, mimeType: 'image/png' });
  } catch (prepError) {
    console.error("Failed to prepare master reference:", prepError);
    throw new Error(`Master image preparation failed: ${prepError instanceof Error ? prepError.message : String(prepError)}`);
  }

  // Add other references
  for (const ref of referenceImages) {
    if (ref.direction !== masterRef.direction) {
      try {
        const prepared = await prepareCanvasForGemini(ref.base64Data);
        preparedImages.push({ data: prepared, mimeType: 'image/png' });
      } catch (prepError) {
        console.warn(`Failed to prepare ${ref.direction} reference, skipping:`, prepError);
      }
    }
  }

  let lastError;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const result = await sendSpriteMessage(chat, prompt, preparedImages);
      return result.imageData;
    } catch (e) {
      console.warn(`Rotated sprite generation attempt ${attempt + 1} failed:`, e);
      lastError = e;

      if (!isRetryableError(e)) {
        console.error("Permanent error detected, not retrying:", e);
        break;
      }

      if (attempt < 2) {
        const delay = getBackoffDelay(attempt);
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error("Failed to generate rotated sprite after multiple attempts");
};

/**
 * Legacy single-reference version for backwards compatibility
 * Wraps the new reference stacking version
 */
export const generateRotatedSpriteLegacy = async (
  identity: CharacterIdentity,
  direction: Direction,
  referenceImageBase64: string,
  quality: QualityMode = 'final',
  lockedPalette?: string[]
): Promise<string> => {
  // Convert single reference to array format
  const referenceImages: ReferenceImage[] = [
    { direction: 'S', base64Data: referenceImageBase64 }
  ];
  return generateRotatedSprite(identity, direction, referenceImages, quality, lockedPalette);
};

/**
 * Prompt Optimizer result
 */
export interface OptimizedPromptResult {
  optimizedPrompt: string;
  explanation: string;
}

/**
 * Prompt Wand (Task 10.1) - Transforms user input into Gemini-optimized narrative
 *
 * NotebookLM Specification:
 * - Uses gemini-3-flash-preview (fast text model)
 * - Art Director persona with IQ 160
 * - Converts "tag soup" to narrative paragraphs
 * - Injects materiality, physics, Master Artist directives
 * - Adds compositional anchors and negative constraints
 */
export const optimizePrompt = async (
  userPrompt: string,
  canvasSize: number = 64
): Promise<OptimizedPromptResult> => {
  const client = getClient();

  // Validate input length (NotebookLM: 10-2000 chars)
  if (userPrompt.length < 10) {
    throw new Error('Description must be at least 10 characters');
  }
  if (userPrompt.length > 2000) {
    throw new Error('Description must be under 2000 characters');
  }

  // Art Director persona with one-shot example (NotebookLM specification)
  const systemPrompt = `You are an Art Director with an IQ of 160, specializing in pixel art game assets. Your role is to transform basic character descriptions into rich, narrative prompts optimized for Gemini 3 Pro Image generation.

TRANSFORMATION RULES:
1. Convert tag-style input ("knight, armor, sword") into flowing narrative paragraphs
2. Add materiality descriptors (weathered, polished, matte, brushed, bioluminescent)
3. Add physics/light interaction (how light plays on surfaces, reflections, shadows)
4. Specify texture details (metal grain, fabric weave, organic patterns)
5. Keep the user's core concept intact - enhance, don't replace

MANDATORY INJECTIONS:
- Always describe ONE singular character
- Specify centered composition on solid white background
- Include deliberate pixel art aesthetic notes

ONE-SHOT EXAMPLE:
Before: "forest robot"
After: "A weathered automaton constructed from moss-covered salvaged metal parts. Its torso is fashioned from a repurposed brass boiler, now oxidized to a soft verdigris patina. Vines have threaded through gaps in its articulated limbs, with small ferns sprouting from its shoulder joints. Its single optical lens glows with a warm amber bioluminescence. The robot stands in a relaxed pose, one arm slightly raised as if greeting a woodland creature."

OUTPUT FORMAT:
Return a JSON object with:
- "optimizedPrompt": The enhanced narrative description (150-400 words)
- "explanation": Brief note on what you enhanced (1-2 sentences)`;

  const userMessage = `Transform this character description into a Gemini-optimized narrative for a ${canvasSize}x${canvasSize} pixel art sprite:

"${userPrompt}"`;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await client.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: userMessage,
        config: {
          systemInstruction: systemPrompt,
          temperature: 1.0,
          maxOutputTokens: 4096,
          responseMimeType: "application/json",
        },
      });

      const text = response.text ?? '';
      if (!text) {
        throw new Error("No response from optimizer");
      }

      // Parse the JSON response
      let cleanedText = text.trim();
      if (cleanedText.startsWith('```')) {
        const jsonMatch = cleanedText.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
          cleanedText = jsonMatch[1].trim();
        }
      }

      const result = JSON.parse(cleanedText) as OptimizedPromptResult;

      if (!result.optimizedPrompt || typeof result.optimizedPrompt !== 'string') {
        throw new Error('Invalid optimizer response: missing optimizedPrompt');
      }

      return {
        optimizedPrompt: result.optimizedPrompt,
        explanation: result.explanation || 'Enhanced with materiality and narrative structure',
      };
    } catch (e) {
      console.warn(`Prompt optimization attempt ${attempt + 1} failed:`, e);
      lastError = e instanceof Error ? e : new Error(String(e));

      if (!isRetryableError(e)) {
        break;
      }

      if (attempt < 2) {
        const delay = getBackoffDelay(attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error("Failed to optimize prompt after multiple attempts");
};

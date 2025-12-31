import { Modality, ThinkingLevel } from "@google/genai";
import type { Chat } from "@google/genai";
import { CharacterIdentity, Direction, StyleParameters, QualityMode, SpriteData } from "../../types";
import { getClient, createSpriteSession, getSpriteSession, sendSpriteMessage } from "./client";
import { getConfigForTask } from "./modelRouter";
import { characterIdentitySchema } from "./schemas";
import { normalizeIdentity } from "../../utils/normalizeIdentity";
import { buildTechniquePrompt, getSystemInstruction, getProhibitionsPrompt } from "../../data/pixelArtTechniques";
import { prepareCanvasForGemini } from "../../utils/imageUtils";
import { getPaletteColors } from "../../data/palettes";

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
 * A palette is always required - uses the specific palette colours
 */
const buildPalettePrompt = (identity: CharacterIdentity): string => {
  const { paletteMode } = identity.styleParameters;
  const identityPalette = identity.colourPalette;

  // Always include identity colours for semantic meaning
  const semanticColors = `Character colours - Primary: ${identityPalette.primary}, Secondary: ${identityPalette.secondary}, Accent: ${identityPalette.accent}, Skin: ${identityPalette.skin}, Hair: ${identityPalette.hair}, Outline: ${identityPalette.outline}`;

  // Check if using a curated palette (always required now)
  if (paletteMode) {
    const paletteColors = getPaletteColors(paletteMode);
    if (paletteColors && paletteColors.length > 0) {
      const colorList = paletteColors.join(', ');
      return `COLOR PALETTE CONSTRAINT:
You MUST use ONLY colours from this palette: ${colorList}
Total available colours: ${paletteColors.length}

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
 *
 * CRITICAL: Never mention "transparent background" - this causes the model to
 * ignore chromaKey instructions (Poison Token problem from Gemini consultation).
 */
const SPRITE_SYSTEM_PROMPT = `${getSystemInstruction()}

OUTPUT FORMAT:
Your final output will be a single PNG image file.
You will generate sprites on a SOLID, FLAT background using the exact colour specified in the prompt.
NEVER use transparency, checkerboard patterns, or white backgrounds.
You will omit any explanatory text, focusing solely on delivering the generated pixel art as the primary response.

${getProhibitionsPrompt()}`;

/**
 * Sanitizes user input to remove background-related keywords that could
 * conflict with chromaKey generation (Poison Token prevention).
 *
 * These phrases trigger conflicting behavior in Gemini, causing it to
 * ignore the explicit chromaKey colour instruction.
 */
function sanitizeDescription(description: string): string {
  return description
    .replace(/transparent\s*background/gi, '')
    .replace(/white\s*background/gi, '')
    .replace(/no\s*background/gi, '')
    .replace(/clear\s*background/gi, '')
    .replace(/blank\s*background/gi, '')
    .replace(/on\s*transparency/gi, '')
    .trim();
}

/**
 * Builds the lighting directive to prevent atmospheric bleed.
 * Gemini sometimes reflects the chromaKey colour onto the sprite surface.
 * This directive enforces neutral lighting.
 */
function buildLightingDirective(chromaKey: string): string {
  return `LIGHTING: Neutral studio lighting from above-left. The ${chromaKey} background colour must NOT reflect onto or tint the sprite in any way. The sprite is illuminated by clean white light only.`;
}

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
 *
 * @param chromaKey - Background colour for chroma keying (e.g., "#FF00FF").
 *                    Defaults to "#202020" if not provided.
 */
export const generateSprite = async (
  identity: CharacterIdentity,
  direction: Direction = 'S',
  quality: QualityMode = 'draft',
  lockedPalette?: string[],
  chromaKey: string = '#202020'
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

  // Sanitize description to remove poison tokens
  const cleanDescription = sanitizeDescription(identity.description);

  const prompt = `Generate a ${size}x${size} pixel art sprite of this character:

CHARACTER: ${identity.name}
DESCRIPTION: ${cleanDescription}
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

BACKGROUND: Generate this sprite on a SOLID, FLAT ${chromaKey} background.
This exact colour will be removed in post-processing - do NOT use ${chromaKey} anywhere in the sprite itself.

${buildLightingDirective(chromaKey)}

COMPOSITION: ${compositionGuide}

CRITICAL REQUIREMENTS:
- Output must be exactly ${size}x${size} pixels
- True pixel art with clean, crisp pixels
- No anti-aliasing on edges
- Horizontally centered
- SOLID ${chromaKey} BACKGROUND IS MANDATORY - fill ALL background pixels with this exact colour
- Do NOT draw a checkerboard pattern or any pattern in the background
- Do NOT use transparency - use solid ${chromaKey} for all background areas
- Do NOT use the background colour (${chromaKey}) anywhere in the sprite itself
- White and near-white colours are ALLOWED in the sprite (eyes, teeth, highlights) - only ${chromaKey} is forbidden

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
 * Requests changes to an existing sprite via the chat session.
 * Continues the existing conversation - model has full context.
 * Returns base64 encoded PNG data for processing through standard pipeline.
 */
export const requestSpriteChanges = async (
  identityId: string,
  changeRequest: string
): Promise<string> => {
  const chat = getSpriteSession(identityId);
  if (!chat) {
    throw new Error('No active session for this character. Generate a sprite first.');
  }

  let lastError;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const result = await sendSpriteMessage(chat, changeRequest);
      return result.imageData;
    } catch (e) {
      console.warn(`Sprite change request attempt ${attempt + 1} failed:`, e);
      lastError = e;

      if (!isRetryableError(e)) {
        break;
      }

      if (attempt < 2) {
        const delay = getBackoffDelay(attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error("Failed to apply changes after multiple attempts");
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
 *
 * @param chromaKey - Background colour for chroma keying (e.g., "#FF00FF").
 *                    Defaults to "#202020" if not provided.
 */
export const generateRotatedSprite = async (
  identity: CharacterIdentity,
  direction: Direction,
  referenceImages: ReferenceImage[],
  quality: QualityMode = 'final',
  lockedPalette?: string[],
  chromaKey: string = '#202020'
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

BACKGROUND: Generate this sprite on a SOLID, FLAT ${chromaKey} background.
This exact colour will be removed in post-processing - do NOT use ${chromaKey} anywhere in the sprite itself.

${buildLightingDirective(chromaKey)}

CRITICAL REQUIREMENTS:
- Match the character from Image 1 EXACTLY
- Same proportions, art style, and level of detail as Image 1
- ${size}x${size} pixels, no anti-aliasing
- SOLID ${chromaKey} BACKGROUND IS MANDATORY - fill ALL background pixels with this exact colour
- Do NOT draw a checkerboard pattern or any pattern in the background
- Do NOT use transparency - use solid ${chromaKey} for all background areas
- Do NOT use the background colour (${chromaKey}) anywhere in the sprite itself
- White and near-white colours are ALLOWED in the sprite (eyes, teeth, highlights) - only ${chromaKey} is forbidden

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
  lockedPalette?: string[],
  chromaKey: string = '#202020'
): Promise<string> => {
  // Convert single reference to array format
  const referenceImages: ReferenceImage[] = [
    { direction: 'S', base64Data: referenceImageBase64 }
  ];
  return generateRotatedSprite(identity, direction, referenceImages, quality, lockedPalette, chromaKey);
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
  // CRITICAL: Do NOT mention backgrounds - chromaKey is handled separately by the generation pipeline
  const systemPrompt = `You are an Art Director with an IQ of 160, specializing in pixel art game assets. Your role is to transform basic character descriptions into rich, narrative prompts optimized for Gemini 3 Pro Image generation.

TRANSFORMATION RULES:
1. Convert tag-style input ("knight, armor, sword") into flowing narrative paragraphs
2. Add materiality descriptors (weathered, polished, matte, brushed, bioluminescent)
3. Add physics/light interaction (how light plays on surfaces, reflections, shadows)
4. Specify texture details (metal grain, fabric weave, organic patterns)
5. Keep the user's core concept intact - enhance, don't replace
6. REMOVE any background-related terms from user input (transparent, white, clear background)

MANDATORY INJECTIONS:
- Always describe ONE singular character
- Specify centered composition
- Include deliberate pixel art aesthetic notes
- Do NOT mention backgrounds at all - the generation pipeline handles this separately

FORBIDDEN TERMS (never include these):
- "transparent background"
- "white background"
- "solid background"
- "no background"
- "clear background"

ONE-SHOT EXAMPLE:
Before: "forest robot"
After: "A weathered automaton constructed from moss-covered salvaged metal parts. Its torso is fashioned from a repurposed brass boiler, now oxidized to a soft verdigris patina. Vines have threaded through gaps in its articulated limbs, with small ferns sprouting from its shoulder joints. Its single optical lens glows with a warm amber bioluminescence. The robot stands in a relaxed pose, one arm slightly raised as if greeting a woodland creature."

OUTPUT FORMAT:
Return a JSON object with:
- "optimizedPrompt": The enhanced narrative description (150-400 words, NO background mentions)
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

/**
 * Analyses an image and generates a detailed character description.
 * Used to seed the description input from a reference image.
 *
 * @param base64Data - Base64 encoded image data (no data URL prefix)
 * @param mimeType - Image MIME type (defaults to image/png)
 * @returns Text description suitable for character identity generation
 */
export const describeImageForPixelArt = async (
  base64Data: string,
  mimeType: string = 'image/png'
): Promise<string> => {
  const client = getClient();

  const systemInstruction = `You are an expert at analysing images and describing characters, creatures, and subjects for pixel art generation. Your descriptions must focus ONLY on the subject itself - what they look like, what they wear, what they carry. Never describe the environment, setting, or how the image was captured.`;

  const prompt = `Analyse this image and describe the subject in a single detailed paragraph.

INCLUDE (focus on these):
- Physical appearance (body type, face, hair, skin, expression)
- Clothing and materials (textures, colours, layers, fabric types)
- Accessories, weapons, or props they are holding or wearing
- Pose and stance (how they are standing/positioned)
- Distinctive or unique visual elements

EXCLUDE (never mention these):
- Camera angles or viewpoints (front view, side view, 3/4 angle, etc.)
- Background or environment (indoor, outdoor, studio, etc.)
- Lighting conditions (dramatic lighting, backlit, shadows from environment)
- Perspective or framing
- Image quality or style (photo, illustration, etc.)
- Any setting or context around the subject

Format: Single descriptive paragraph focusing purely on the subject. No intro, no outro, no markdown.`;

  const response = await client.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: [
      {
        role: 'user',
        parts: [
          { text: prompt },
          {
            inlineData: {
              data: base64Data,
              mimeType,
            },
          },
        ],
      },
    ],
    config: {
      systemInstruction,
      temperature: 1.0,
    },
  });

  const text = response.text?.trim();
  if (!text) {
    throw new Error('No description generated from image');
  }

  return text;
};

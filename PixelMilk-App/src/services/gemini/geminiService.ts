import { Modality, ThinkingLevel } from "@google/genai";
import { CharacterIdentity, Direction, StyleParameters, QualityMode } from "../../types";
import { getClient } from "./client";
import { getConfigForTask } from "./modelRouter";
import { characterIdentitySchema } from "./schemas";
import { normalizeIdentity } from "../../utils/normalizeIdentity";
import { buildTechniquePrompt, getSystemInstruction, getProhibitionsPrompt } from "../../data/pixelArtTechniques";
import { prepareCanvasForGemini } from "../../utils/imageUtils";

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

  Output this exact JSON structure:
  {
    "id": "char-xxxx",
    "name": "string",
    "description": "original description",
    "physicalDescription": { "bodyType": "string", "heightStyle": "string", "silhouette": "string" },
    "colourPalette": { "primary": "#hex", "secondary": "#hex", "accent": "#hex", "skin": "#hex", "hair": "#hex", "outline": "#hex" },
    "distinctiveFeatures": ["feature1", "feature2"],
    "styleParameters": {
       "outlineStyle": "${style.outlineStyle}",
       "shadingStyle": "${style.shadingStyle}",
       "detailLevel": "${style.detailLevel}",
       "canvasSize": ${style.canvasSize},
       "paletteMode": "${style.paletteMode}",
       "viewType": "${style.viewType}"
    },
    "angleNotes": { "S": "hint", "N": "hint", "E": "hint", "W": "hint" },
    "createdAt": ${now},
    "updatedAt": ${now}
  }

  ABSOLUTELY CRITICAL - angleNotes RULES:
  - MAXIMUM 20 characters per hint
  - Write 2-3 words ONLY, then STOP IMMEDIATELY
  - NEVER repeat words
  - Examples: "eyes front", "side curve", "back smooth", "tail left"
  - If you write more than 20 characters, the system BREAKS
  `;

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
          maxOutputTokens: 8192,
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

  // Pre-process: fix runaway angleNotes that break JSON parsing
  // This regex finds angleNotes values and truncates them to 30 chars
  let cleanedText = text;
  const angleNotesPattern = /"(S|N|E|W)":\s*"([^"]{30,})"/g;
  cleanedText = cleanedText.replace(angleNotesPattern, (match, dir, value) => {
    // Truncate to 30 chars and close the string properly
    const truncated = value.substring(0, 30).replace(/\s+$/, '');
    return `"${dir}": "${truncated}"`;
  });

  // Also fix if JSON got cut off mid-angleNotes (common failure mode)
  // Look for unclosed strings in angleNotes section
  if (cleanedText.includes('"angleNotes"') && !cleanedText.trim().endsWith('}')) {
    // Try to close the JSON properly
    const lastBrace = cleanedText.lastIndexOf('}');
    if (lastBrace > 0) {
      cleanedText = cleanedText.substring(0, lastBrace + 1);
    }
  }

  try {
    const raw: unknown = JSON.parse(cleanedText);

    // Validate the parsed JSON structure before using it
    validateIdentityJson(raw);

    return normalizeIdentity(raw as Record<string, unknown>, style, now);
  } catch (e) {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = cleanedText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      const raw: unknown = JSON.parse(jsonMatch[1].trim());

      // Validate the parsed JSON structure before using it
      validateIdentityJson(raw);

      return normalizeIdentity(raw as Record<string, unknown>, style, now);
    }
    console.error("Failed to parse identity response:", cleanedText);
    throw new Error(`Failed to generate valid identity JSON: ${e instanceof Error ? e.message : cleanedText.substring(0, 200)}`);
  }
};

/**
 * Generates a sprite PNG for a given direction
 * Returns base64 encoded PNG data
 */
export const generateSprite = async (
  identity: CharacterIdentity,
  direction: Direction = 'S',
  quality: QualityMode = 'draft',
  lockedPalette?: string[]
): Promise<string> => {
  const client = getClient();
  const config = getConfigForTask(
    quality === 'final' ? 'sprite-final' : 'sprite-draft',
    quality
  );
  const size = identity.styleParameters.canvasSize;

  const paletteColors = identity.colourPalette;
  const paletteStr = `Primary: ${paletteColors.primary}, Secondary: ${paletteColors.secondary}, Accent: ${paletteColors.accent}, Skin: ${paletteColors.skin}, Hair: ${paletteColors.hair}, Outline: ${paletteColors.outline}`;

  const directionDescriptions: Record<Direction, string> = {
    S: 'SOUTH (Front View) - Character facing the viewer',
    N: 'NORTH (Back View) - Character facing away',
    E: 'EAST (Right Profile) - Character facing right',
    W: 'WEST (Left Profile) - Character facing left',
    SE: 'SOUTHEAST (Front-Right 3/4 View)',
    SW: 'SOUTHWEST (Front-Left 3/4 View)',
    NE: 'NORTHEAST (Back-Right 3/4 View)',
    NW: 'NORTHWEST (Back-Left 3/4 View)',
  };

  // Note: We no longer pass locked palettes to Gemini - it causes background dithering issues
  // Palette enforcement happens in post-processing via validateAndSnapPixelData
  const paletteInstruction = `COLOR PALETTE SUGGESTION: ${paletteStr}`;

  // Composition guidance based on canvas size
  // 128x128 = compact gameplay sprite, 256x256 = portrait/character creation (full body)
  const compositionGuide = size >= 256
    ? 'FULL BODY portrait - show character from head to feet, vertically centered'
    : 'Compact gameplay sprite - character fills frame, may crop at knees/feet';

  // Build technique-specific instructions from pixel art reference
  const techniquePrompt = buildTechniquePrompt(
    identity.styleParameters.outlineStyle,
    identity.styleParameters.shadingStyle,
    size
  );

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

VIEW: ${directionDescriptions[direction]}
${identity.angleNotes[direction] ? `ANGLE NOTES: ${identity.angleNotes[direction]}` : ''}

${paletteInstruction}

BACKGROUND: Solid pure white (#FFFFFF)

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
- Only the character sprite should have non-white pixels

${techniquePrompt}`;

  let lastError;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await client.models.generateContent({
        model: config.model,
        contents: prompt,
        config: {
          responseModalities: [Modality.IMAGE],
          temperature: config.temperature,
          systemInstruction: SPRITE_SYSTEM_PROMPT,
          ...(config.thinkingLevel && {
            thinkingConfig: { thinkingLevel: mapThinkingLevel(config.thinkingLevel) },
          }),
        },
      });

      const parts = response.candidates?.[0]?.content?.parts ?? [];
      const imagePart = parts.find((part) => part.inlineData);

      if (imagePart?.inlineData?.data) {
        return imagePart.inlineData.data;
      }

      throw new Error("No image data in response");
    } catch (e) {
      console.warn(`Sprite generation attempt ${attempt + 1} failed:`, e);
      lastError = e;

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

  throw lastError || new Error("Failed to generate sprite after multiple attempts");
};

/**
 * Generates a rotated view sprite using reference image
 * Returns base64 encoded PNG data
 */
export const generateRotatedSprite = async (
  identity: CharacterIdentity,
  direction: Direction,
  referenceImageBase64: string,
  quality: QualityMode = 'final',
  lockedPalette?: string[]
): Promise<string> => {
  const client = getClient();
  const config = getConfigForTask('sprite-final', quality);
  const size = identity.styleParameters.canvasSize;

  let directionDesc = "";
  const visibilityNotes = identity.angleNotes[direction] || "";

  switch (direction) {
    case 'N':
      directionDesc = "NORTH (Back View)";
      break;
    case 'E':
      directionDesc = "EAST (Right Profile)";
      break;
    case 'W':
      directionDesc = "WEST (Left Profile)";
      break;
    case 'S':
      directionDesc = "SOUTH (Front View)";
      break;
    case 'NE':
      directionDesc = "NORTHEAST (Back-Right 3/4 View)";
      break;
    case 'NW':
      directionDesc = "NORTHWEST (Back-Left 3/4 View)";
      break;
    case 'SE':
      directionDesc = "SOUTHEAST (Front-Right 3/4 View)";
      break;
    case 'SW':
      directionDesc = "SOUTHWEST (Front-Left 3/4 View)";
      break;
    default:
      directionDesc = `${direction} View`;
  }

  const paletteColors = identity.colourPalette;
  const paletteStr = `Primary: ${paletteColors.primary}, Secondary: ${paletteColors.secondary}, Accent: ${paletteColors.accent}, Skin: ${paletteColors.skin}, Hair: ${paletteColors.hair}, Outline: ${paletteColors.outline}`;

  // Note: Like generateSprite, we don't strictly enforce palette here - Gemini dithers backgrounds
  // Palette enforcement happens in post-processing via validateAndSnapPixelData
  const paletteInstruction = `COLOR PALETTE SUGGESTION: ${paletteStr}`;

  // Build technique-specific instructions from pixel art reference
  const techniquePrompt = buildTechniquePrompt(
    identity.styleParameters.outlineStyle,
    identity.styleParameters.shadingStyle,
    size
  );

  // NotebookLM best practice: Label reference images with semantic context
  const prompt = `Generate a ${size}x${size} pixel art sprite - ${directionDesc}

IMAGE 1: Reference sprite showing this character from the front view. Use this as your identity reference.

CHARACTER: ${identity.name}
DISTINCTIVE FEATURES: ${identity.distinctiveFeatures.join(', ')}
VISIBLE FROM THIS ANGLE: ${visibilityNotes}

STYLE LOCK (must match Image 1 exactly):
- Outline: ${identity.styleParameters.outlineStyle}
- Shading: ${identity.styleParameters.shadingStyle}
- Color Palette: ${paletteInstruction}

CRITICAL REQUIREMENTS:
- Match the character from Image 1 EXACTLY
- Same proportions, art style, and level of detail as Image 1
- ${size}x${size} pixels, no anti-aliasing
- SOLID WHITE BACKGROUND (#FFFFFF) IS MANDATORY
- Fill ALL background pixels with pure white (#FFFFFF)
- Do NOT draw a checkerboard pattern

${techniquePrompt}`;

  // CRITICAL (NotebookLM): Add white background to reference image before sending to Gemini
  // Transparent backgrounds cause generation errors in the Nano Banana family
  let preparedImage: string;
  try {
    preparedImage = await prepareCanvasForGemini(referenceImageBase64);
  } catch (prepError) {
    console.error("Failed to prepare image for Gemini:", prepError);
    throw new Error(`Image preparation failed: ${prepError instanceof Error ? prepError.message : String(prepError)}`);
  }

  let lastError;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await client.models.generateContent({
        model: config.model,
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: "image/png",
                data: preparedImage,
              },
            },
            { text: prompt },
          ],
        },
        config: {
          responseModalities: [Modality.IMAGE],
          temperature: config.temperature,
          systemInstruction: SPRITE_SYSTEM_PROMPT,
          ...(config.thinkingLevel && {
            thinkingConfig: { thinkingLevel: mapThinkingLevel(config.thinkingLevel) },
          }),
        },
      });

      const part = response.candidates?.[0]?.content?.parts?.[0];
      if (part && 'inlineData' in part && part.inlineData?.data) {
        return part.inlineData.data;
      }

      throw new Error("No image data in response");
    } catch (e) {
      console.warn(`Rotated sprite generation attempt ${attempt + 1} failed:`, e);
      lastError = e;

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

  throw lastError || new Error("Failed to generate rotated sprite after multiple attempts");
};

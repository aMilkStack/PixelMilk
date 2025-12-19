import { GoogleGenAI, Schema, Type } from "@google/genai";
import { CharacterIdentity, Direction, PixelData, StyleParameters } from "../../types";
import { validateAndSnapPixelData } from "../../utils/paletteGovernor";

const getAI = (apiKey: string) => new GoogleGenAI({ apiKey });

// Using TEXT models for identity generation (complex reasoning and structured JSON output)
const IDENTITY_MODEL = "gemini-2.5-flash";

// Using IMAGE models for sprite generation (actual image output, not JSON pixel arrays)
const SPRITE_FLASH_MODEL = "gemini-2.5-flash-image";
const SPRITE_PRO_MODEL = "gemini-3-pro-image-preview";

// Helper for schema definition
const pixelDataSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    width: { type: Type.INTEGER },
    height: { type: Type.INTEGER },
    palette: {
      type: Type.ARRAY,
      items: { type: Type.STRING, description: "Hex code #RRGGBB" }
    },
    pixels: {
      type: Type.ARRAY,
      items: { type: Type.STRING, description: "Hex code #RRGGBB or 'transparent'" }
    },
    normalMap: {
      type: Type.ARRAY,
      items: { type: Type.STRING, description: "Hex code #RRGGBB" }
    }
  },
  required: ["name", "width", "height", "palette", "pixels", "normalMap"]
};

export const generateCharacterIdentity = async (
  apiKey: string,
  description: string,
  style: StyleParameters
): Promise<CharacterIdentity> => {
  const ai = getAI(apiKey);

  const systemPrompt = `You are an expert technical game artist. Your task is to analyze a character description and convert it into a structured "Character Identity Document" JSON for a pixel art generation pipeline.

  The JSON must strictly follow this schema:
  {
    "name": "string",
    "physical_description": { "body_type": "string", "height_style": "string", "silhouette": "string" },
    "colour_palette": { "primary": "hex", "secondary": "hex", "accent": "hex", "skin": "hex", "hair": "hex", "outline": "hex" },
    "distinctive_features": ["string"],
    "style_parameters": {
       "outline_style": "${style.outlineStyle}",
       "shading_style": "${style.shadingStyle}",
       "detail_level": "${style.detailLevel}",
       "canvas_size": ${style.canvasSize}
    },
    "angle_specific_notes": { "north": "string", "east": "string", "west": "string", "south": "string" }
  }
  `;

  const response = await ai.models.generateContent({
    model: IDENTITY_MODEL,
    contents: `Character Description: ${description}`,
    config: {
      systemInstruction: systemPrompt,
      responseMimeType: "application/json",
    },
  });

  const text = response.text;
  if (!text) throw new Error("No response from model");

  try {
    return JSON.parse(text) as CharacterIdentity;
  } catch (e) {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1].trim()) as CharacterIdentity;
    }
    throw new Error("Failed to generate valid identity JSON");
  }
};

/**
 * Generates the initial South (Front) sprite data
 * 
 * TODO: CRITICAL ARCHITECTURAL FIX NEEDED
 * This function currently uses JSON pixel array output, which is:
 * - Extremely token-expensive (1024+ hex codes in JSON)
 * - Poor quality (text models aren't trained for this)
 * - Architecturally wrong per ARCHITECTURE.md
 * 
 * REQUIRED CHANGES:
 * 1. Use SPRITE_FLASH_MODEL or SPRITE_PRO_MODEL (image models)
 * 2. Request image output: config: { responseModality: "image" }
 * 3. Handle binary/base64 image responses instead of JSON
 * 4. Extract palette from generated images (sample colors from image data)
 * 5. Convert image to PixelData format for editor compatibility
 */
export const generateSouthSpriteData = async (
  apiKey: string,
  identity: CharacterIdentity
): Promise<PixelData> => {
  const ai = getAI(apiKey);
  const size = identity.style_parameters.canvasSize;

  let paletteInstruction = "";
  if (identity.style_parameters.paletteMode === 'auto') {
     paletteInstruction = "Select appropriate colors. Include at least one highlight, midtone, and shadow per major element.";
  } else {
     paletteInstruction = `Start with these base colors but expand if needed for shading: ${JSON.stringify(identity.colour_palette)}`;
  }

  const prompt = `
  You are a pixel art data generator. Output ONLY valid JSON matching the schema.

  CHARACTER: ${identity.description || identity.name}
  CANVAS: ${size}x${size} pixels (${size * size} total pixels)
  STYLE: ${identity.style_parameters.outlineStyle}, ${identity.style_parameters.shadingStyle} shading, ${identity.style_parameters.detailLevel} detail.
  VIEW: South (Standard Front View)
  TYPE: ${identity.style_parameters.viewType}

  PALETTE INSTRUCTION: ${paletteInstruction}

  Output a JSON object with:
  - "name": Character name
  - "width": ${size}
  - "height": ${size}
  - "palette": Array of hex codes actually used.
  - "pixels": Array of exactly ${size * size} values. Row-major order (top-left to bottom-right). Each value is either a hex code from the palette OR "transparent".
  - "normalMap": Array of exactly ${size * size} hex codes encoding surface normals. Use #808080 for flat, R channel for X normal, G for Y normal, B for Z depth.

  CRITICAL:
  - Output ONLY the JSON object. No markdown.
  - pixels array must be EXACTLY ${size * size} items.
  - "transparent" for background.
  `;

  // NOTE: Currently using TEXT model with JSON output - needs to switch to IMAGE model
  const response = await ai.models.generateContent({
    model: IDENTITY_MODEL, // FIXME: Should use SPRITE_FLASH_MODEL with responseModality: "image"
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: pixelDataSchema
    }
  });

  const text = response.text;
  if (!text) throw new Error("No data returned");

  try {
    const data = JSON.parse(text) as PixelData;
    return validateAndSnapPixelData(data);
  } catch (e) {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[1].trim()) as PixelData;
      return validateAndSnapPixelData(data);
    }
    throw new Error("Failed to parse sprite data JSON");
  }
};

/**
 * Generates a rotated view using the 3D Reference
 * 
 * TODO: CRITICAL ARCHITECTURAL FIX NEEDED
 * This function currently uses JSON pixel array output, which is:
 * - Extremely token-expensive (1024+ hex codes in JSON)
 * - Poor quality (text models aren't trained for this)
 * - Architecturally wrong per ARCHITECTURE.md
 * 
 * REQUIRED CHANGES:
 * 1. Use SPRITE_FLASH_MODEL or SPRITE_PRO_MODEL (image models)
 * 2. Request image output: config: { responseModality: "image" }
 * 3. Handle binary/base64 image responses instead of JSON
 * 4. Convert image to PixelData format for editor compatibility
 * 5. Enforce locked palette during conversion
 */
export const generateRotatedSpriteData = async (
  apiKey: string,
  identity: CharacterIdentity,
  direction: Direction,
  referenceImageBase64: string,
  lockedPalette: string[]
): Promise<PixelData> => {
  const ai = getAI(apiKey);
  const size = identity.style_parameters.canvasSize;

  let anglePrompt = "";
  if (direction === 'N') anglePrompt = `TARGET: NORTH (Back View). Visible: ${identity.angle_specific_notes.north}`;
  else if (direction === 'E') anglePrompt = `TARGET: EAST (Right Profile). Visible: ${identity.angle_specific_notes.east}`;
  else if (direction === 'W') anglePrompt = `TARGET: WEST (Left Profile). Visible: ${identity.angle_specific_notes.west}`;
  else anglePrompt = `TARGET: ${direction} View.`;

  const prompt = `
  You are a pixel art data generator. Output ONLY valid JSON.

  CHARACTER: ${identity.name}
  CANVAS: ${size}x${size}
  VIEW: ${direction}
  TYPE: ${identity.style_parameters.viewType}

  REFERENCE IMAGE: Attached is a 3D low-poly reference. Match its silhouette and positioning EXACTLY.

  STYLE LOCK (match exactly):
  - Palette: Use ONLY these colors: ${JSON.stringify(lockedPalette)}
  - Outline: ${identity.style_parameters.outlineStyle}
  - Shading: ${identity.style_parameters.shadingStyle}

  IDENTITY LOCK:
  - Body type: ${identity.physical_description.body_type}
  - Features: ${identity.distinctive_features.join(', ')}

  Output JSON with:
  - "name": "${identity.name}"
  - "width": ${size}
  - "height": ${size}
  - "palette": The locked palette array provided above.
  - "pixels": Array of ${size * size} pixels.
  - "normalMap": Array of ${size * size} normal map pixels.

  CRITICAL: Use ONLY colors from the locked palette. "transparent" for background.
  `;

  const parts = [
    { text: prompt },
    {
      inlineData: {
        mimeType: "image/png",
        data: referenceImageBase64.replace(/^data:image\/\w+;base64,/, "")
      }
    }
  ];

  // NOTE: Currently using TEXT model with JSON output - needs to switch to IMAGE model
  const response = await ai.models.generateContent({
    model: IDENTITY_MODEL, // FIXME: Should use SPRITE_FLASH_MODEL/SPRITE_PRO_MODEL with responseModality: "image"
    contents: { parts },
    config: {
      responseMimeType: "application/json",
      responseSchema: pixelDataSchema
    }
  });

  const text = response.text;
  if (!text) throw new Error("No data returned");

  const data = JSON.parse(text) as PixelData;

  // Enforce the locked palette strictly
  data.palette = lockedPalette;
  return validateAndSnapPixelData(data);
};

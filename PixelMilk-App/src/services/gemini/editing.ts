import { getClient } from './client';
import { getConfigForTask } from './modelRouter';
import type { SpriteData } from '../../types';

interface HotspotEditParams {
  sprite: SpriteData;
  hotspotX: number;
  hotspotY: number;
  hotspotRadius: number;
  instruction: string;
  lockedPalette: string[];
}

/**
 * Applies a localized edit to a sprite using AI.
 * Extracts the affected region, sends to Gemini, and merges result back.
 *
 * Uses Flash model for fast iteration (not Pro).
 */
export async function applyHotspotEdit(params: HotspotEditParams): Promise<string[]> {
  const { sprite, hotspotX, hotspotY, hotspotRadius, instruction, lockedPalette } = params;
  const client = getClient();
  const config = getConfigForTask('edit-localised', 'draft');

  // Calculate affected region bounds
  const half = Math.floor(hotspotRadius / 2);
  const minX = Math.max(0, hotspotX - half);
  const maxX = Math.min(sprite.width - 1, hotspotX + half + (hotspotRadius % 2 === 0 ? 0 : 1));
  const minY = Math.max(0, hotspotY - half);
  const maxY = Math.min(sprite.height - 1, hotspotY + half + (hotspotRadius % 2 === 0 ? 0 : 1));

  const regionWidth = maxX - minX + 1;
  const regionHeight = maxY - minY + 1;

  // Extract current pixels in region (row-major order)
  const regionPixels: string[] = [];
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      regionPixels.push(sprite.pixels[y * sprite.width + x] || 'transparent');
    }
  }

  // Extract surrounding context (pixels immediately adjacent to region)
  const contextPixels: { [key: string]: string } = {};
  const contextPositions = [
    { dx: -1, dy: 0, label: 'left' },
    { dx: 1, dy: 0, label: 'right' },
    { dx: 0, dy: -1, label: 'top' },
    { dx: 0, dy: 1, label: 'bottom' },
  ];

  for (let y = minY; y <= maxY; y++) {
    for (const pos of [{ dx: -1, dy: 0, label: 'left' }, { dx: regionWidth, dy: 0, label: 'right' }]) {
      const px = minX + pos.dx;
      const py = y;
      if (px >= 0 && px < sprite.width && py >= 0 && py < sprite.height) {
        contextPixels[`${pos.label}_${y - minY}`] = sprite.pixels[py * sprite.width + px] || 'transparent';
      }
    }
  }

  const systemPrompt = `You are editing a small region of a pixel art sprite. Output ONLY valid JSON - no explanations.

Your task is to modify the pixels according to the instruction while:
1. Maintaining the pixel art style (clean edges, no anti-aliasing)
2. Using ONLY colors from the provided locked palette
3. Ensuring visual coherence with surrounding pixels
4. Keeping transparent pixels transparent unless specifically instructed otherwise`;

  const prompt = `CURRENT REGION (${regionWidth}x${regionHeight} pixels, row-major order):
${JSON.stringify(regionPixels)}

REGION POSITION: (${minX}, ${minY}) to (${maxX}, ${maxY}) in a ${sprite.width}x${sprite.height} sprite

INSTRUCTION: ${instruction}

LOCKED PALETTE (use ONLY these colors or "transparent"):
${JSON.stringify(lockedPalette)}

Output ONLY a JSON array of exactly ${regionWidth * regionHeight} pixel values.
Each value must be a hex color from the palette OR "transparent".
No explanations, no markdown, just the JSON array.`;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await client.models.generateContent({
        model: config.model,
        contents: prompt,
        config: {
          systemInstruction: systemPrompt,
          temperature: config.temperature,
          responseMimeType: 'application/json',
        },
      });

      const text = response.text;
      if (!text) throw new Error('No response from model');

      // Parse JSON response
      let newRegionPixels: string[];
      try {
        newRegionPixels = JSON.parse(text) as string[];
      } catch {
        // Try to extract JSON from response
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          newRegionPixels = JSON.parse(jsonMatch[0]) as string[];
        } else {
          throw new Error('Failed to parse JSON response');
        }
      }

      if (newRegionPixels.length !== regionWidth * regionHeight) {
        throw new Error(
          `Invalid pixel count: got ${newRegionPixels.length}, expected ${regionWidth * regionHeight}`
        );
      }

      // Validate and snap to palette
      const validatedPixels = newRegionPixels.map((p) => {
        if (p === 'transparent' || p === null || p === undefined) return 'transparent';
        const lower = p.toLowerCase();
        // Check if it's in the palette
        if (lockedPalette.some((c) => c.toLowerCase() === lower)) {
          return p;
        }
        // Find nearest palette color
        return findNearestColor(p, lockedPalette);
      });

      // Merge back into full sprite
      const resultPixels = [...sprite.pixels];
      let regionIndex = 0;

      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          resultPixels[y * sprite.width + x] = validatedPixels[regionIndex++];
        }
      }

      return resultPixels;
    } catch (e) {
      console.warn(`Hotspot edit attempt ${attempt + 1} failed:`, e);
      lastError = e instanceof Error ? e : new Error(String(e));

      if (attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }

  throw lastError || new Error('Failed to apply hotspot edit after multiple attempts');
}

/**
 * Find the nearest color in a palette using simple RGB distance
 */
function findNearestColor(color: string, palette: string[]): string {
  const targetRgb = hexToRgb(color);
  if (!targetRgb) return palette[0] || 'transparent';

  let nearestColor = palette[0];
  let nearestDistance = Infinity;

  for (const paletteColor of palette) {
    const rgb = hexToRgb(paletteColor);
    if (!rgb) continue;

    const distance =
      Math.pow(targetRgb.r - rgb.r, 2) +
      Math.pow(targetRgb.g - rgb.g, 2) +
      Math.pow(targetRgb.b - rgb.b, 2);

    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestColor = paletteColor;
    }
  }

  return nearestColor;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return match
    ? {
        r: parseInt(match[1], 16),
        g: parseInt(match[2], 16),
        b: parseInt(match[3], 16),
      }
    : null;
}


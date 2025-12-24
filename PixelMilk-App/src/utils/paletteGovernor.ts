import { PixelData } from "../types";

// Maximum colors for auto palette mode
const MAX_AUTO_PALETTE_COLORS = 64;

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

export function rgbToHex(r: number, g: number, b: number): string {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}

/**
 * Color distance using weighted Euclidean (human perception weighted)
 */
function colorDistance(c1: { r: number; g: number; b: number }, c2: { r: number; g: number; b: number }): number {
  // Weighted for human perception - red and blue less sensitive than green
  const rMean = (c1.r + c2.r) / 2;
  const dR = c1.r - c2.r;
  const dG = c1.g - c2.g;
  const dB = c1.b - c2.b;
  return Math.sqrt(
    (2 + rMean / 256) * dR * dR +
    4 * dG * dG +
    (2 + (255 - rMean) / 256) * dB * dB
  );
}

/**
 * Reduces a palette to maxColors using popularity + similarity merging
 * Keeps the most frequently used colors and merges similar ones
 */
export function quantizePalette(
  pixels: string[],
  maxColors: number = MAX_AUTO_PALETTE_COLORS
): string[] {
  // Count color frequencies
  const colorCounts = new Map<string, number>();
  for (const pixel of pixels) {
    if (pixel === 'transparent') continue;
    colorCounts.set(pixel, (colorCounts.get(pixel) || 0) + 1);
  }

  // If already under limit, return unique colors sorted by frequency
  if (colorCounts.size <= maxColors) {
    return Array.from(colorCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([color]) => color);
  }

  // Sort by frequency (most used first)
  const sortedColors = Array.from(colorCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([color]) => color);

  // Start with most popular colors
  const palette: string[] = sortedColors.slice(0, Math.floor(maxColors * 0.7));
  const remaining = sortedColors.slice(Math.floor(maxColors * 0.7));

  // Add remaining colors only if they're different enough from existing palette
  const MIN_DISTANCE = 30; // Threshold for "different enough"

  for (const color of remaining) {
    if (palette.length >= maxColors) break;

    const colorRgb = hexToRgb(color);
    let isDifferent = true;

    for (const existing of palette) {
      const existingRgb = hexToRgb(existing);
      if (colorDistance(colorRgb, existingRgb) < MIN_DISTANCE) {
        isDifferent = false;
        break;
      }
    }

    if (isDifferent) {
      palette.push(color);
    }
  }

  return palette;
}

/**
 * Snaps a single hex color to the nearest color in the palette.
 */
export function snapColor(color: string, palette: string[]): string {
  if (color === 'transparent' || !color) return 'transparent';
  if (!palette || palette.length === 0) return color;
  if (palette.includes(color)) return color;

  const target = hexToRgb(color);
  let nearest = palette[0];
  let minDistance = Infinity;

  for (const p of palette) {
    const current = hexToRgb(p);
    // Euclidean distance
    const dist = Math.sqrt(
      Math.pow(target.r - current.r, 2) +
      Math.pow(target.g - current.g, 2) +
      Math.pow(target.b - current.b, 2)
    );

    if (dist < minDistance) {
      minDistance = dist;
      nearest = p;
    }
  }

  return nearest;
}

/**
 * Validates and fixes PixelData to ensure strictly adhered palette usage.
 * For auto mode (no lockedPalette), reduces colors to MAX_AUTO_PALETTE_COLORS.
 */
export function validateAndSnapPixelData(data: PixelData, lockedPalette?: string[]): PixelData {
  const { width, height, pixels } = data;
  const expectedLength = width * height;

  // 1. Validate Length
  let validPixels = [...pixels];
  if (validPixels.length !== expectedLength) {
    console.warn(`Pixel array length mismatch. Expected ${expectedLength}, got ${validPixels.length}. Truncating or padding.`);
    if (validPixels.length > expectedLength) {
      validPixels = validPixels.slice(0, expectedLength);
    } else {
      while (validPixels.length < expectedLength) {
        validPixels.push('transparent');
      }
    }
  }

  // 2. Determine palette
  let palette: string[];
  if (lockedPalette && lockedPalette.length > 0) {
    // Lospec or manually locked palette - use as-is
    palette = lockedPalette;
  } else {
    // Auto mode - quantize to max colors
    palette = quantizePalette(validPixels, MAX_AUTO_PALETTE_COLORS);
    console.log(`Auto palette: ${data.palette.length} colors → ${palette.length} colors (max ${MAX_AUTO_PALETTE_COLORS})`);
  }

  // 3. Snap Colors to the palette
  const snappedPixels = validPixels.map((p) => snapColor(p, palette));

  return {
    ...data,
    palette,
    pixels: snappedPixels
  };
}

/**
 * Utility to convert PixelData to a data URL (PNG) for display/reference
 */
export async function renderPixelDataToDataUrl(
  data: PixelData,
  background?: string | null
): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = data.width;
    canvas.height = data.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      resolve('');
      return;
    }

    // Ensure crisp pixel rendering
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, data.width, data.height);

    if (background) {
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, data.width, data.height);
    }

    data.pixels.forEach((color, i) => {
      if (color === 'transparent') return;
      const x = i % data.width;
      const y = Math.floor(i / data.width);
      ctx.fillStyle = color;
      ctx.fillRect(x, y, 1, 1);
    });

    resolve(canvas.toDataURL('image/png'));
  });
}

/**
 * Utility to convert PixelData to base64 PNG data for Gemini API
 * Returns just the base64 data without the data URL prefix
 */
export async function renderPixelDataToBase64(
  data: PixelData,
  background?: string | null
): Promise<string> {
  const dataUrl = await renderPixelDataToDataUrl(data, background);
  // Strip the "data:image/png;base64," prefix
  return dataUrl.replace(/^data:image\/png;base64,/, '');
}

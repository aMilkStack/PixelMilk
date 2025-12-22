import { PixelData } from "../types";

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
 */
export function validateAndSnapPixelData(data: PixelData, lockedPalette?: string[]): PixelData {
  const { width, height, pixels } = data;
  const palette = lockedPalette ?? data.palette;
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

  // 2. Snap Colors
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

import { rgbToHex, hexToRgb } from './paletteGovernor';
import { snapToGrid } from './pixelSnapper';

/**
 * Prepares an image for Gemini API by adding a white background.
 *
 * CRITICAL (NotebookLM): Transparent backgrounds on INPUT images cause Gemini
 * generation errors. Before sending any canvas/reference data to Gemini,
 * inject a solid white background (#FFFFFF).
 *
 * @param base64 - Base64 encoded image data (with or without data URL prefix)
 * @returns Base64 encoded PNG with white background (no data URL prefix)
 */
export async function prepareCanvasForGemini(base64: string): Promise<string> {
  // Clean the base64 data
  const cleanBase64 = base64.replace(/^data:image\/\w+;base64,/, '');

  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      // Fill with white background first
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw the image on top (transparency becomes white)
      ctx.drawImage(img, 0, 0);

      // Return base64 without the data URL prefix
      const result = canvas.toDataURL('image/png').split(',')[1];
      resolve(result);
    };

    img.onerror = () => {
      reject(new Error('Failed to load image for white background injection'));
    };

    img.src = `data:image/png;base64,${cleanBase64}`;
  });
}

function resolveImageSrc(imageData: Blob | string): { src: string; revoke: boolean } {
  if (typeof imageData === 'string') {
    if (imageData.startsWith('data:')) {
      return { src: imageData, revoke: false };
    }
    return { src: `data:image/png;base64,${imageData}`, revoke: false };
  }

  const objectUrl = URL.createObjectURL(imageData);
  return { src: objectUrl, revoke: true };
}

export async function pngToPixelArray(
  imageData: Blob | string,
  targetWidth: number,
  targetHeight: number
): Promise<{ pixels: string[]; palette: string[] }> {
  const { src, revoke } = resolveImageSrc(imageData);
  const image = new Image();
  image.decoding = 'async';
  image.src = src;

  // Use decode() if available, otherwise fallback to onload event
  if (typeof image.decode === 'function') {
    await image.decode();
  } else {
    await new Promise<void>((resolve, reject) => {
      (image as HTMLImageElement).onload = () => resolve();
      (image as HTMLImageElement).onerror = () => reject(new Error('Failed to load image'));
    });
  }

  // Step 1: Draw full-size image to get raw ImageData
  const sourceCanvas = document.createElement('canvas');
  sourceCanvas.width = image.width;
  sourceCanvas.height = image.height;
  const sourceCtx = sourceCanvas.getContext('2d');
  if (!sourceCtx) {
    throw new Error('Canvas context not available');
  }
  sourceCtx.drawImage(image, 0, 0);
  const sourceImageData = sourceCtx.getImageData(0, 0, image.width, image.height);

  // Step 2: Apply pixel snapper to clean up off-grid pixels
  // This uses color voting to determine the correct color for each target pixel
  const snappedImageData = snapToGrid(sourceImageData, {
    targetSize: targetWidth,
    colorTolerance: 20,
  });

  // Step 3: Extract pixels from snapped data
  const data = snappedImageData.data;
  const pixels: string[] = [];
  const paletteSet = new Set<string>();

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    if (a === 0 || a < 128) {
      pixels.push('transparent');
      continue;
    }

    const hex = rgbToHex(r, g, b);
    pixels.push(hex);
    paletteSet.add(hex);
  }

  if (revoke) {
    URL.revokeObjectURL(src);
  }

  return { pixels, palette: Array.from(paletteSet) };
}

/**
 * Unified tolerance for checkerboard detection and removal.
 * Using a single constant ensures consistent behavior across detection and removal phases.
 */
const CHECKERBOARD_TOLERANCE = 25;

/**
 * Common checkerboard colors that Gemini uses to represent "transparency"
 * These need to be detected and converted to actual transparency
 */
const CHECKERBOARD_COLORS = [
  // Pink/magenta checkerboard variants
  { r: 255, g: 192, b: 203 }, // Pink
  { r: 255, g: 182, b: 193 }, // Light pink
  { r: 238, g: 162, b: 173 }, // Darker pink
  { r: 255, g: 174, b: 185 }, // Another pink
  { r: 255, g: 200, b: 200 }, // Light salmon pink
  { r: 248, g: 187, b: 208 }, // Soft pink
  { r: 219, g: 112, b: 147 }, // Pale violet red
  // Gray checkerboard variants
  { r: 192, g: 192, b: 192 }, // Light gray
  { r: 128, g: 128, b: 128 }, // Medium gray
  { r: 204, g: 204, b: 204 }, // Lighter gray
  { r: 255, g: 255, b: 255 }, // White (when part of checker)
];

/**
 * Check if a color is likely part of a transparency checkerboard
 */
function isCheckerboardColor(r: number, g: number, b: number, tolerance: number = CHECKERBOARD_TOLERANCE): boolean {
  for (const check of CHECKERBOARD_COLORS) {
    const dr = Math.abs(r - check.r);
    const dg = Math.abs(g - check.g);
    const db = Math.abs(b - check.b);
    if (dr <= tolerance && dg <= tolerance && db <= tolerance) {
      return true;
    }
  }
  return false;
}

/**
 * Detect if an image has a checkerboard pattern in the corners/edges
 * (indicating Gemini drew a "transparency" pattern instead of real transparency)
 */
function detectCheckerboardBackground(
  data: Uint8ClampedArray,
  width: number,
  height: number
): { hasCheckerboard: boolean; dominantBgColors: Array<{r: number, g: number, b: number}> } {
  // Sample corners and edges to detect checkerboard
  const samplePoints: Array<{x: number, y: number}> = [];
  const cornerSize = Math.min(16, Math.floor(Math.min(width, height) / 4));

  // Top-left corner
  for (let y = 0; y < cornerSize; y++) {
    for (let x = 0; x < cornerSize; x++) {
      samplePoints.push({ x, y });
    }
  }

  // Top-right corner
  for (let y = 0; y < cornerSize; y++) {
    for (let x = Math.max(0, width - cornerSize); x < width; x++) {
      samplePoints.push({ x, y });
    }
  }

  // Bottom-left corner
  for (let y = Math.max(0, height - cornerSize); y < height; y++) {
    for (let x = 0; x < cornerSize; x++) {
      samplePoints.push({ x, y });
    }
  }

  // Bottom-right corner
  for (let y = Math.max(0, height - cornerSize); y < height; y++) {
    for (let x = Math.max(0, width - cornerSize); x < width; x++) {
      samplePoints.push({ x, y });
    }
  }

  // Top edge strip (between corners)
  const edgeStripHeight = Math.min(4, cornerSize);
  for (let y = 0; y < edgeStripHeight; y++) {
    for (let x = cornerSize; x < width - cornerSize; x += 2) {
      samplePoints.push({ x, y });
    }
  }

  // Bottom edge strip (between corners)
  for (let y = height - edgeStripHeight; y < height; y++) {
    for (let x = cornerSize; x < width - cornerSize; x += 2) {
      samplePoints.push({ x, y });
    }
  }

  const colorCounts = new Map<string, { count: number; r: number; g: number; b: number }>();
  let checkerboardHits = 0;

  for (const { x, y } of samplePoints) {
    const i = (y * width + x) * 4;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    if (isCheckerboardColor(r, g, b)) {
      checkerboardHits++;
    }

    // Finer color bucketing (divide by 5 instead of 10) for better precision
    const key = `${Math.floor(r / 5)},${Math.floor(g / 5)},${Math.floor(b / 5)}`;
    const existing = colorCounts.get(key);
    if (existing) {
      existing.count++;
    } else {
      colorCounts.set(key, { count: 1, r, g, b });
    }
  }

  // Use lower threshold (0.3) for smaller sprites (<= 64px) since they have less sample area
  // Use standard threshold (0.4) for larger sprites
  const isSmallSprite = width <= 64 || height <= 64;
  const detectionThreshold = isSmallSprite ? 0.3 : 0.4;
  const hasCheckerboard = checkerboardHits / samplePoints.length > detectionThreshold;

  // Find the dominant background colors
  const sorted = Array.from(colorCounts.values()).sort((a, b) => b.count - a.count);
  const dominantBgColors = sorted.slice(0, 3).map(c => ({ r: c.r, g: c.g, b: c.b }));

  return { hasCheckerboard, dominantBgColors };
}

/**
 * Remove checkerboard "transparency" pattern from Gemini output
 * and convert those pixels to actual transparency
 */
export async function removeCheckerboardBackground(base64: string): Promise<string> {
  const cleanBase64 = base64.replace(/^data:image\/\w+;base64,/, '');

  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      const { hasCheckerboard, dominantBgColors } = detectCheckerboardBackground(
        data,
        canvas.width,
        canvas.height
      );

      if (!hasCheckerboard) {
        // No checkerboard detected, return original
        resolve(cleanBase64);
        return;
      }

      console.log('Checkerboard background detected, removing...');

      // Make checkerboard colors transparent
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Check if this pixel matches any of the dominant background colors
        let isBackground = false;
        for (const bg of dominantBgColors) {
          const dr = Math.abs(r - bg.r);
          const dg = Math.abs(g - bg.g);
          const db = Math.abs(b - bg.b);
          if (dr <= CHECKERBOARD_TOLERANCE && dg <= CHECKERBOARD_TOLERANCE && db <= CHECKERBOARD_TOLERANCE) {
            isBackground = true;
            break;
          }
        }

        // Also check general checkerboard colors (uses CHECKERBOARD_TOLERANCE via default)
        if (!isBackground && isCheckerboardColor(r, g, b)) {
          isBackground = true;
        }

        if (isBackground) {
          data[i + 3] = 0; // Set alpha to 0 (transparent)
        }
      }

      ctx.putImageData(imageData, 0, 0);
      const result = canvas.toDataURL('image/png').split(',')[1];
      resolve(result);
    };

    img.onerror = () => {
      reject(new Error('Failed to load image for checkerboard removal'));
    };

    img.src = `data:image/png;base64,${cleanBase64}`;
  });
}

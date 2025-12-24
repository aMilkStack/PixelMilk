import { rgbToHex, hexToRgb } from './paletteGovernor';
import { snapToGrid } from './pixelSnapper';
import type { SpriteData, Direction } from '../types';

/**
 * Confidence threshold for segmentation mask binarization.
 * Pixels with value > threshold are considered "subject" (foreground).
 * Pixels with value <= threshold are considered "background".
 */
const MASK_CONFIDENCE_THRESHOLD = 128;

/**
 * Result of parsing a segmentation mask.
 * Includes the binary mask and its original dimensions for proper scaling.
 */
export interface ParsedMask {
  /** Boolean array: true = foreground, false = background */
  mask: boolean[];
  /** Width of the mask at its original resolution */
  width: number;
  /** Height of the mask at its original resolution */
  height: number;
}

/**
 * Nearest-neighbor scaling for binary masks.
 *
 * CRITICAL: Standard canvas drawImage() uses bilinear interpolation which
 * corrupts binary decisions. This function preserves hard edges by using
 * nearest-neighbor sampling.
 */
function nearestNeighborScaleMask(
  source: boolean[],
  srcWidth: number,
  srcHeight: number,
  dstWidth: number,
  dstHeight: number
): boolean[] {
  const result = new Array<boolean>(dstWidth * dstHeight);
  const xRatio = srcWidth / dstWidth;
  const yRatio = srcHeight / dstHeight;

  for (let y = 0; y < dstHeight; y++) {
    for (let x = 0; x < dstWidth; x++) {
      const srcX = Math.floor(x * xRatio);
      const srcY = Math.floor(y * yRatio);
      const srcIdx = srcY * srcWidth + srcX;
      const dstIdx = y * dstWidth + x;
      result[dstIdx] = source[srcIdx];
    }
  }

  return result;
}

/**
 * Parses a segmentation mask (base64 PNG) into a boolean array.
 *
 * CRITICAL FIX: Binarizes at ORIGINAL resolution first, then scales with
 * nearest-neighbor. This prevents interpolation from corrupting the binary
 * mask boundaries.
 *
 * @param maskBase64 - Base64 encoded mask image
 * @returns ParsedMask with boolean array and original dimensions
 */
export async function parseSegmentationMask(
  maskBase64: string
): Promise<ParsedMask> {
  const cleanBase64 = maskBase64.replace(/^data:image\/\w+;base64,/, '');

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

      // CRITICAL: Disable smoothing - we want exact pixel values
      ctx.imageSmoothingEnabled = false;

      // Draw at ORIGINAL resolution - no scaling yet
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, img.width, img.height);
      const data = imageData.data;

      // Binarize at ORIGINAL resolution FIRST
      // This preserves hard edges before any scaling
      const mask: boolean[] = [];
      for (let i = 0; i < data.length; i += 4) {
        const confidence = data[i]; // R channel (grayscale mask)
        mask.push(confidence > MASK_CONFIDENCE_THRESHOLD);
      }

      resolve({ mask, width: img.width, height: img.height });
    };

    img.onerror = () => {
      reject(new Error('Failed to load segmentation mask'));
    };

    img.src = `data:image/png;base64,${cleanBase64}`;
  });
}

/**
 * Horizontally flips a sprite's pixel data.
 * Used to generate W from E (symmetric characters save an API call).
 *
 * @param sprite - The source sprite data (e.g., East facing)
 * @param newDirection - The direction for the flipped sprite (e.g., 'W')
 * @returns A new SpriteData with horizontally flipped pixels
 */
export function flipSpriteHorizontally(sprite: SpriteData, newDirection: Direction): SpriteData {
  const { width, height, pixels } = sprite;
  const flippedPixels: string[] = new Array(pixels.length);

  // Flip each row horizontally
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const sourceIndex = y * width + x;
      const targetIndex = y * width + (width - 1 - x);
      flippedPixels[targetIndex] = pixels[sourceIndex];
    }
  }

  return {
    ...sprite,
    id: `${sprite.id}-flipped`,
    direction: newDirection,
    pixels: flippedPixels,
    createdAt: Date.now(),
  };
}

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

      // CRITICAL: Disable smoothing to preserve pixel edges
      ctx.imageSmoothingEnabled = false;

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

/**
 * White background detection using Euclidean distance.
 * Tolerance of 4 catches near-white drift but preserves #FEFEFE highlights.
 *
 * Examples:
 * - Pure white #FFFFFF: distance = 0 (removed)
 * - Near white #FFFFFE: distance = 1 (removed)
 * - Safe white #FEFEFE: distance = sqrt(3) ≈ 1.7 (removed - too close)
 * - Actual safe #FCFCFC: distance = sqrt(27) ≈ 5.2 (preserved)
 */
const WHITE_BG_TOLERANCE = 4;

/**
 * Returns true for pixels close to pure white (#FFFFFF).
 * Preserves #FEFEFE (Safe White) and hue-shifted highlights.
 */
function isWhiteBackground(r: number, g: number, b: number): boolean {
  const distance = Math.sqrt(
    Math.pow(255 - r, 2) +
    Math.pow(255 - g, 2) +
    Math.pow(255 - b, 2)
  );
  return distance < WHITE_BG_TOLERANCE;
}

/**
 * Applies background removal at ORIGINAL resolution by setting alpha to 0.
 *
 * CRITICAL: This must run BEFORE snapToGrid to prevent white pixels from
 * participating in colour voting at sprite edges.
 */
function applyBackgroundRemovalInPlace(
  data: Uint8ClampedArray,
  mask: boolean[] | null
): void {
  const pixelCount = data.length / 4;

  for (let i = 0; i < data.length; i += 4) {
    const pixelIndex = i / 4;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const isWhite = isWhiteBackground(r, g, b);

    if (mask && mask.length === pixelCount) {
      // Dual-check: remove only if BOTH white AND mask says background
      const isForeground = mask[pixelIndex];
      if (isWhite && !isForeground) {
        data[i + 3] = 0; // Set alpha to 0
      }
    } else {
      // No mask: simple white check
      if (isWhite) {
        data[i + 3] = 0;
      }
    }
  }
}

/**
 * Converts a PNG image to a pixel array with palette extraction.
 *
 * WORKFLOW ORDER (CRITICAL):
 * 1. Load image at ORIGINAL resolution
 * 2. Scale mask to match original image dimensions (nearest-neighbor)
 * 3. Apply background removal at ORIGINAL resolution (set alpha = 0)
 * 4. THEN run snapToGrid on the now-transparent image
 * 5. Extract pixels from snapped result
 *
 * This order prevents white background pixels from participating in
 * colour voting during the snapping process, eliminating edge blur.
 *
 * @param imageData - The source image as Blob or base64 string
 * @param targetWidth - Target width in pixels
 * @param targetHeight - Target height in pixels
 * @param parsedMask - Optional ParsedMask from parseSegmentationMask()
 */
export async function pngToPixelArray(
  imageData: Blob | string,
  targetWidth: number,
  targetHeight: number,
  parsedMask?: ParsedMask
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

  // CRITICAL: Disable smoothing to prevent interpolation artifacts
  sourceCtx.imageSmoothingEnabled = false;

  sourceCtx.drawImage(image, 0, 0);
  const sourceImageData = sourceCtx.getImageData(0, 0, image.width, image.height);

  // Step 2: Scale mask to match source image dimensions (if needed)
  let scaledMask: boolean[] | null = null;
  if (parsedMask) {
    if (parsedMask.width === image.width && parsedMask.height === image.height) {
      // Mask already at correct size
      scaledMask = parsedMask.mask;
    } else {
      // Scale mask with nearest-neighbor to match source image
      scaledMask = nearestNeighborScaleMask(
        parsedMask.mask,
        parsedMask.width,
        parsedMask.height,
        image.width,
        image.height
      );
      console.log(`[pngToPixelArray] Scaled mask from ${parsedMask.width}x${parsedMask.height} to ${image.width}x${image.height}`);
    }
  }

  // Step 3: Apply background removal at ORIGINAL resolution BEFORE snapping
  // This is the critical fix - white pixels are removed before they can
  // participate in colour voting during the snap process
  applyBackgroundRemovalInPlace(sourceImageData.data, scaledMask);

  // Step 4: Apply pixel snapper to clean up off-grid pixels
  // Now only opaque (non-background) pixels participate in voting
  const snappedImageData = snapToGrid(sourceImageData, {
    targetSize: targetWidth,
    colorTolerance: 20,
  });

  // Step 5: Extract pixels from snapped data
  // Background removal already done - just extract colours
  const data = snappedImageData.data;
  const pixels: string[] = [];
  const paletteSet = new Set<string>();

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    // Transparent pixels (already removed in step 3, or from original alpha)
    if (a < 128) {
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

      // CRITICAL: Disable smoothing to preserve pixel edges
      ctx.imageSmoothingEnabled = false;

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

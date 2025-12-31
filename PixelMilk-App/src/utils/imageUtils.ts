import { rgbToHex, hexToRgb } from './paletteGovernor';
import { snapToGrid } from './pixelSnapper';
import type { SpriteData, Direction } from '../types';

/**
 * Sprite sheet layout type
 */
export type SpriteSheetLayout = '2x2' | '1x4';

/**
 * Direction order for sprite sheet exports (clockwise from top)
 */
const SPRITE_SHEET_DIRECTION_ORDER: Direction[] = ['N', 'E', 'S', 'W'];

/**
 * Creates a sprite sheet from all 4 direction sprites.
 *
 * @param sprites - Map of direction to sprite data (must contain all 4 cardinal directions)
 * @param layout - Layout type: '2x2' grid or '1x4' horizontal strip
 * @param background - Optional background colour (null for transparent)
 * @returns Data URL of the combined sprite sheet PNG
 */
export function createSpriteSheet(
  sprites: Map<Direction, SpriteData>,
  layout: SpriteSheetLayout = '2x2',
  background?: string | null
): string | null {
  // Verify all 4 directions are present
  const missingDirections = SPRITE_SHEET_DIRECTION_ORDER.filter(dir => !sprites.has(dir));
  if (missingDirections.length > 0) {
    console.warn(`[createSpriteSheet] Missing directions: ${missingDirections.join(', ')}`);
    return null;
  }

  // Get sprite size from first sprite (all should be same size)
  const firstSprite = sprites.get('N')!;
  const spriteSize = firstSprite.width;

  // Calculate canvas dimensions based on layout
  const canvas = document.createElement('canvas');
  if (layout === '2x2') {
    canvas.width = spriteSize * 2;
    canvas.height = spriteSize * 2;
  } else {
    // 1x4 horizontal strip
    canvas.width = spriteSize * 4;
    canvas.height = spriteSize;
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    console.error('[createSpriteSheet] Canvas context not available');
    return null;
  }

  // Ensure crisp pixel rendering
  ctx.imageSmoothingEnabled = false;

  // Clear with transparent or fill with background
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (background) {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Define positions for each direction based on layout
  // 2x2: N(0,0), E(1,0), S(0,1), W(1,1)
  // 1x4: N, E, S, W left to right
  const positions = layout === '2x2'
    ? [
        { dir: 'N' as Direction, x: 0, y: 0 },
        { dir: 'E' as Direction, x: 1, y: 0 },
        { dir: 'S' as Direction, x: 0, y: 1 },
        { dir: 'W' as Direction, x: 1, y: 1 },
      ]
    : [
        { dir: 'N' as Direction, x: 0, y: 0 },
        { dir: 'E' as Direction, x: 1, y: 0 },
        { dir: 'S' as Direction, x: 2, y: 0 },
        { dir: 'W' as Direction, x: 3, y: 0 },
      ];

  // Draw each sprite
  for (const { dir, x, y } of positions) {
    const sprite = sprites.get(dir);
    if (!sprite?.pixels) continue;

    const offsetX = x * spriteSize;
    const offsetY = y * spriteSize;

    for (let i = 0; i < sprite.pixels.length; i++) {
      const px = i % sprite.width;
      const py = Math.floor(i / sprite.width);
      const color = sprite.pixels[i];

      if (color && color !== 'transparent') {
        ctx.fillStyle = color;
        ctx.fillRect(offsetX + px, offsetY + py, 1, 1);
      }
    }
  }

  return canvas.toDataURL('image/png');
}

/**
 * Downloads a sprite sheet PNG file.
 *
 * @param sprites - Map of direction to sprite data
 * @param characterName - Character name for the filename
 * @param layout - Layout type: '2x2' grid or '1x4' horizontal strip
 * @param background - Optional background colour (null for transparent)
 * @returns true if successful, false otherwise
 */
export function downloadSpriteSheet(
  sprites: Map<Direction, SpriteData>,
  characterName: string,
  layout: SpriteSheetLayout = '2x2',
  background?: string | null
): boolean {
  const dataUrl = createSpriteSheet(sprites, layout, background);
  if (!dataUrl) return false;

  const sanitisedName = characterName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
  const filename = `${sanitisedName}_spritesheet_${layout}.png`;

  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  link.click();

  return true;
}

/**
 * Default chroma key colour for background removal.
 * This dark grey is used by Gemini when generating sprites.
 * Exported so callers can use the same value.
 */
export const DEFAULT_CHROMA_KEY = '#202020';

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
 * Tolerance for flood fill background detection.
 * Higher tolerance catches noise/dithering at edges but risks eating into sprite.
 * 20 is conservative - catches #202020 ± noise but preserves dark sprite pixels.
 */
const FLOOD_FILL_TOLERANCE = 20;

/**
 * Checks if two colors are within tolerance (Euclidean distance).
 */
function colorsMatch(
  r1: number, g1: number, b1: number,
  r2: number, g2: number, b2: number,
  tolerance: number
): boolean {
  const distance = Math.sqrt(
    Math.pow(r1 - r2, 2) +
    Math.pow(g1 - g2, 2) +
    Math.pow(b1 - b2, 2)
  );
  return distance <= tolerance;
}

/**
 * Flood fill transparency from a starting point.
 * Like Photoshop's Magic Wand - only removes CONTIGUOUS pixels matching target color.
 * This preserves white/light pixels INSIDE the sprite outline.
 *
 * Uses BFS (breadth-first search) for efficiency.
 */
function floodFillTransparency(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  startX: number,
  startY: number,
  tolerance: number = FLOOD_FILL_TOLERANCE
): void {
  const startIdx = (startY * width + startX) * 4;
  const targetR = data[startIdx];
  const targetG = data[startIdx + 1];
  const targetB = data[startIdx + 2];

  // Track visited pixels to avoid infinite loops
  const visited = new Set<number>();
  const queue: Array<{ x: number; y: number }> = [{ x: startX, y: startY }];

  while (queue.length > 0) {
    const { x, y } = queue.shift()!;
    const pixelKey = y * width + x;

    // Skip if out of bounds or already visited
    if (x < 0 || x >= width || y < 0 || y >= height) continue;
    if (visited.has(pixelKey)) continue;
    visited.add(pixelKey);

    const idx = pixelKey * 4;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    const a = data[idx + 3];

    // Skip if already transparent
    if (a === 0) continue;

    // Check if this pixel matches the target background color
    if (!colorsMatch(r, g, b, targetR, targetG, targetB, tolerance)) continue;

    // Make transparent
    data[idx + 3] = 0;

    // Add 4-connected neighbors to queue
    queue.push({ x: x + 1, y });
    queue.push({ x: x - 1, y });
    queue.push({ x, y: y + 1 });
    queue.push({ x, y: y - 1 });
  }
}

/**
 * Removes background using flood fill from all 4 corners.
 * This catches disconnected background "islands" that might exist.
 *
 * CRITICAL: Run AFTER snapToGrid so fuzzy edge pixels have been
 * snapped to either background or sprite colors first.
 *
 * @deprecated Use removeBackgroundByChromaKey for global keying instead.
 * Flood fill misses interior gaps (between legs, under arms, etc.).
 * Kept for reference/fallback.
 */
function floodFillBackgroundRemoval(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  tolerance: number = FLOOD_FILL_TOLERANCE
): void {
  // Flood fill from all 4 corners to catch any disconnected background
  const corners = [
    { x: 0, y: 0 },                    // Top-left
    { x: width - 1, y: 0 },            // Top-right
    { x: 0, y: height - 1 },           // Bottom-left
    { x: width - 1, y: height - 1 },   // Bottom-right
  ];

  for (const corner of corners) {
    floodFillTransparency(data, width, height, corner.x, corner.y, tolerance);
  }

  console.log(`[floodFillBackgroundRemoval] Removed background from ${width}x${height} image`);
}

/**
 * Default tolerance for chroma key background removal.
 *
 * With cleaned prompts (no "transparent background" poison tokens), Gemini
 * generates much more consistent backgrounds. Reduced from 30 to 10.
 *
 * Lower tolerance = safer for palettes with colours near the chromaKey.
 * If issues arise, can be bumped back up, but start conservative.
 */
const CHROMA_KEY_TOLERANCE = 10;

/**
 * Removes ALL pixels matching the chromaKey colour globally.
 *
 * Unlike flood fill, this catches "interior" gaps (between legs, under arms,
 * inside handles, etc.) because it removes based on colour match, not connectivity.
 *
 * SAFE because each palette has a unique chromaKey that won't appear in the sprite.
 *
 * @param data - ImageData pixel array (mutated in place)
 * @param width - Image width
 * @param height - Image height
 * @param chromaKey - Hex colour to remove, e.g. "#FF00FF"
 * @param tolerance - Euclidean distance tolerance (default 30)
 */
function removeBackgroundByChromaKey(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  chromaKey: string,
  tolerance: number = CHROMA_KEY_TOLERANCE
): void {
  // Parse chromaKey hex to RGB
  const keyR = parseInt(chromaKey.slice(1, 3), 16);
  const keyG = parseInt(chromaKey.slice(3, 5), 16);
  const keyB = parseInt(chromaKey.slice(5, 7), 16);

  let removedCount = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Euclidean distance check
    const distance = Math.sqrt(
      Math.pow(r - keyR, 2) +
      Math.pow(g - keyG, 2) +
      Math.pow(b - keyB, 2)
    );

    if (distance <= tolerance) {
      data[i + 3] = 0; // Make transparent
      removedCount++;
    }
  }

  console.log(`[removeBackgroundByChromaKey] Removed ${removedCount} pixels matching ${chromaKey} (tolerance: ${tolerance}) from ${width}x${height} image`);
}

/**
 * Converts a PNG image to a pixel array with palette extraction.
 *
 * WORKFLOW ORDER (CRITICAL - Gemini recommended):
 * 1. Load image at ORIGINAL resolution
 * 2. Apply pixel snapper FIRST to quantize fuzzy edge pixels
 *    (forces AA pixels to snap to either background or sprite colors)
 * 3. THEN remove background using global chroma key matching
 *    (removes ALL pixels matching chromaKey, including interior gaps)
 * 4. Extract pixels from result
 *
 * This order ensures clean edges because:
 * - Anti-aliased edge pixels snap to background or sprite (not hybrid)
 * - Global chroma key removes ALL matching pixels, not just connected ones
 *
 * @param imageData - The source image as Blob or base64 string
 * @param targetWidth - Target width in pixels
 * @param targetHeight - Target height in pixels
 * @param chromaKey - Hex colour to remove as background, e.g. "#FF00FF"
 * @param tolerance - Euclidean distance tolerance for chromaKey matching (default 10)
 * @param parsedMask - Optional ParsedMask (unused, kept for API compat)
 */
export async function pngToPixelArray(
  imageData: Blob | string,
  targetWidth: number,
  targetHeight: number,
  chromaKey: string,
  tolerance?: number,
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

  // Step 2: Apply pixel snapper FIRST to quantize fuzzy edge pixels
  // This forces anti-aliased pixels at sprite edges to snap to either:
  // - The background colour (chromaKey)
  // - Or the sprite outline colour
  // This eliminates the "fuzzy fringe" problem before background removal
  const snappedImageData = snapToGrid(sourceImageData, {
    targetSize: targetWidth,
    colorTolerance: 20,
  });

  // Step 3: Global chroma key removal
  // Removes ALL pixels matching chromaKey, including interior gaps
  // (between legs, under arms, inside handles, etc.)
  // SAFE because each palette has a unique chromaKey not in the sprite
  // Tolerance comes from per-palette distance calculation (chromakeys.json)
  removeBackgroundByChromaKey(
    snappedImageData.data,
    snappedImageData.width,
    snappedImageData.height,
    chromaKey,
    tolerance
  );

  // Step 4: Extract pixels from processed data
  const data = snappedImageData.data;
  const pixels: string[] = [];
  const paletteSet = new Set<string>();

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    // Transparent pixels (removed by chroma key)
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
 * These need to be detected and converted to actual transparency.
 *
 * CRITICAL: WHITE is NOT included because:
 * 1. White is a valid sprite colour (eyes, teeth, highlights)
 * 2. We use per-palette chromaKey background removal which is colour-safe
 * 3. Including white here caused white eyeballs to disappear
 *
 * The chromaKey system (removeBackgroundByChromaKey) handles all background
 * removal. This checkerboard detection is a legacy fallback for edge cases.
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
  // Gray checkerboard variants (but NOT pure white)
  { r: 192, g: 192, b: 192 }, // Light gray
  { r: 128, g: 128, b: 128 }, // Medium gray
  { r: 204, g: 204, b: 204 }, // Lighter gray
  // WHITE REMOVED - valid sprite colour for eyes, teeth, highlights
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

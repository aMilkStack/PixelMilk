/**
 * Pixel Snapper - Grid Alignment for AI-Generated Pixel Art
 *
 * AI models generate pixels that may be "off-grid" or inconsistent in size.
 * This utility re-maps those pixels to a strict, uniform grid for game engine compatibility.
 *
 * The Analogy: "Relying on simple nearest-neighbor scaling without pixel-snapping is like
 * taking a photo of a brick wall and trying to use it as a 3D model in a game. It might
 * look like a wall, but because the 'bricks' (pixels) aren't perfectly aligned to the
 * game world's grid, your character will constantly 'glitch' or get stuck on uneven edges."
 */

interface SnapOptions {
  /** Target grid size (e.g., 32 for 32x32 output) */
  targetSize: number;
  /** Color tolerance for consolidation (0-255) */
  colorTolerance?: number;
}

/**
 * Detects the actual pixel size in the AI output by analyzing color cluster boundaries.
 * AI might output at 2.3px, 3.7px, etc. instead of exact integers.
 */
function detectPixelSize(imageData: ImageData): number {
  const { width, height, data } = imageData;
  const transitions: number[] = [];

  // Sample horizontal lines
  for (let y = 0; y < height; y += Math.floor(height / 10)) {
    let lastColor = getPixelColor(data, 0, y, width);
    let lastTransition = 0;

    for (let x = 1; x < width; x++) {
      const color = getPixelColor(data, x, y, width);
      if (!colorsMatch(lastColor, color, 10)) {
        if (lastTransition > 0) {
          transitions.push(x - lastTransition);
        }
        lastTransition = x;
        lastColor = color;
      }
    }
  }

  // Sample vertical lines
  for (let x = 0; x < width; x += Math.floor(width / 10)) {
    let lastColor = getPixelColor(data, x, 0, width);
    let lastTransition = 0;

    for (let y = 1; y < height; y++) {
      const color = getPixelColor(data, x, y, width);
      if (!colorsMatch(lastColor, color, 10)) {
        if (lastTransition > 0) {
          transitions.push(y - lastTransition);
        }
        lastTransition = y;
        lastColor = color;
      }
    }
  }

  // Find mode of transitions (most common pixel width)
  if (transitions.length === 0) return 1;

  const counts = new Map<number, number>();
  for (const t of transitions) {
    const rounded = Math.round(t);
    if (rounded > 0) {
      counts.set(rounded, (counts.get(rounded) || 0) + 1);
    }
  }

  let maxCount = 0;
  let mode = 1;
  for (const [value, count] of counts) {
    if (count > maxCount) {
      maxCount = count;
      mode = value;
    }
  }

  return Math.max(1, mode);
}

function getPixelColor(
  data: Uint8ClampedArray,
  x: number,
  y: number,
  width: number
): [number, number, number, number] {
  const i = (y * width + x) * 4;
  return [data[i], data[i + 1], data[i + 2], data[i + 3]];
}

function colorsMatch(
  a: [number, number, number, number],
  b: [number, number, number, number],
  tolerance: number
): boolean {
  return (
    Math.abs(a[0] - b[0]) <= tolerance &&
    Math.abs(a[1] - b[1]) <= tolerance &&
    Math.abs(a[2] - b[2]) <= tolerance &&
    Math.abs(a[3] - b[3]) <= tolerance
  );
}

/**
 * Center-Point Sampler (Gemini recommended)
 *
 * For each target pixel, calculate the CENTER of its corresponding "virtual pixel"
 * region in the source, then sample ONLY that single pixel.
 *
 * This completely ignores anti-aliased edge pixels because:
 * - AA happens at the EDGES of virtual pixels
 * - The CENTER is always the "true" color
 *
 * Much more aggressive than voting - no democracy, just grab the center.
 */
function centerPointSample(
  source: ImageData,
  targetSize: number
): ImageData {
  const { width: srcWidth, height: srcHeight, data: srcData } = source;
  const output = new ImageData(targetSize, targetSize);

  // Step size: how many source pixels per target pixel
  const stepX = srcWidth / targetSize;
  const stepY = srcHeight / targetSize;

  for (let y = 0; y < targetSize; y++) {
    for (let x = 0; x < targetSize; x++) {
      // Calculate the absolute CENTER of this "virtual pixel" in source space
      const centerX = Math.floor((x * stepX) + (stepX / 2));
      const centerY = Math.floor((y * stepY) + (stepY / 2));

      // Clamp to valid range
      const sx = Math.min(srcWidth - 1, Math.max(0, centerX));
      const sy = Math.min(srcHeight - 1, Math.max(0, centerY));

      // Sample ONLY that center pixel
      const srcIdx = (sy * srcWidth + sx) * 4;
      const dstIdx = (y * targetSize + x) * 4;

      output.data[dstIdx] = srcData[srcIdx];
      output.data[dstIdx + 1] = srcData[srcIdx + 1];
      output.data[dstIdx + 2] = srcData[srcIdx + 2];
      output.data[dstIdx + 3] = srcData[srcIdx + 3];
    }
  }

  return output;
}

/**
 * Snaps an AI-generated image to a strict pixel grid.
 *
 * Uses CENTER-POINT SAMPLING (Gemini recommended):
 * - Samples the CENTER of each virtual pixel block
 * - Completely ignores anti-aliased edges
 * - No voting/averaging - direct sampling
 *
 * @param source - The AI output ImageData
 * @param options - Snapping options including target grid size
 * @returns New ImageData with pixels aligned to exact grid
 */
export function snapToGrid(source: ImageData, options: SnapOptions): ImageData {
  const { targetSize } = options;

  // Use center-point sampling - ignores AA completely
  const output = centerPointSample(source, targetSize);

  console.log(`[snapToGrid] Center-sampled ${source.width}x${source.height} → ${targetSize}x${targetSize}`);

  return output;
}

function sampleWithVoting(
  source: ImageData,
  centerX: number,
  centerY: number,
  sampleSize: number,
  tolerance: number
): [number, number, number, number] {
  const { width, height, data } = source;
  const half = Math.floor(sampleSize / 2);

  // Collect colors in the sample region
  const colorVotes = new Map<string, { color: [number, number, number, number]; count: number }>();

  for (let dy = -half; dy <= half; dy++) {
    for (let dx = -half; dx <= half; dx++) {
      const sx = Math.min(width - 1, Math.max(0, Math.floor(centerX + dx)));
      const sy = Math.min(height - 1, Math.max(0, Math.floor(centerY + dy)));
      const color = getPixelColor(data, sx, sy, width);

      // Quantize color for voting
      const key = `${Math.round(color[0] / tolerance) * tolerance},${Math.round(color[1] / tolerance) * tolerance},${Math.round(color[2] / tolerance) * tolerance},${color[3]}`;

      const existing = colorVotes.get(key);
      if (existing) {
        existing.count++;
      } else {
        colorVotes.set(key, { color, count: 1 });
      }
    }
  }

  // Return the most voted color
  let maxVotes = 0;
  let winner: [number, number, number, number] = [0, 0, 0, 0];

  for (const { color, count } of colorVotes.values()) {
    if (count > maxVotes) {
      maxVotes = count;
      winner = color;
    }
  }

  return winner;
}

/**
 * Converts ImageData to a pixel array (hex colors)
 */
export function imageDataToPixelArray(imageData: ImageData): string[] {
  const pixels: string[] = [];
  const { width, height, data } = imageData;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      if (a < 128) {
        pixels.push('transparent');
      } else {
        pixels.push(`#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`);
      }
    }
  }

  return pixels;
}

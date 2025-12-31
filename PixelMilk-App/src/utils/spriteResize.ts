/**
 * Sprite Resize Utilities
 *
 * Handles resizing sprite pixel arrays when the user changes canvas size mid-edit.
 * Supports both scaling (preserve content) and crop/pad (preserve pixel size).
 */

import type { SpriteData, Direction } from '../types';

export type ResizeMode = 'scale' | 'crop-pad';

export const CANVAS_SIZES = [32, 48, 64, 96, 128] as const;
export type CanvasSize = (typeof CANVAS_SIZES)[number];

/**
 * Nearest-neighbour scale for pixel arrays.
 * Preserves hard edges - no interpolation.
 */
function nearestNeighbourScale(
  pixels: string[],
  srcWidth: number,
  srcHeight: number,
  dstWidth: number,
  dstHeight: number
): string[] {
  const result: string[] = new Array(dstWidth * dstHeight);
  const xRatio = srcWidth / dstWidth;
  const yRatio = srcHeight / dstHeight;

  for (let y = 0; y < dstHeight; y++) {
    for (let x = 0; x < dstWidth; x++) {
      const srcX = Math.floor(x * xRatio);
      const srcY = Math.floor(y * yRatio);
      const srcIdx = srcY * srcWidth + srcX;
      const dstIdx = y * dstWidth + x;
      result[dstIdx] = pixels[srcIdx];
    }
  }

  return result;
}

/**
 * Crop or pad pixel array to new size.
 * Centers the content - if shrinking, crops edges; if growing, adds transparent padding.
 */
function cropPad(
  pixels: string[],
  srcWidth: number,
  srcHeight: number,
  dstWidth: number,
  dstHeight: number
): string[] {
  const result: string[] = new Array(dstWidth * dstHeight).fill('transparent');

  // Calculate offset to center the source in destination
  const offsetX = Math.floor((dstWidth - srcWidth) / 2);
  const offsetY = Math.floor((dstHeight - srcHeight) / 2);

  for (let srcY = 0; srcY < srcHeight; srcY++) {
    for (let srcX = 0; srcX < srcWidth; srcX++) {
      const dstX = srcX + offsetX;
      const dstY = srcY + offsetY;

      // Skip if outside destination bounds
      if (dstX < 0 || dstX >= dstWidth || dstY < 0 || dstY >= dstHeight) {
        continue;
      }

      const srcIdx = srcY * srcWidth + srcX;
      const dstIdx = dstY * dstWidth + dstX;
      result[dstIdx] = pixels[srcIdx];
    }
  }

  return result;
}

/**
 * Resize a sprite's pixel data to a new canvas size.
 *
 * @param sprite - The source sprite
 * @param newSize - Target canvas size (square)
 * @param mode - 'scale' to preserve appearance, 'crop-pad' to preserve pixel size
 * @returns New SpriteData with resized pixels
 */
export function resizeSprite(
  sprite: SpriteData,
  newSize: CanvasSize,
  mode: ResizeMode
): SpriteData {
  const { width, height, pixels } = sprite;

  // If same size, return copy
  if (width === newSize && height === newSize) {
    return { ...sprite };
  }

  let newPixels: string[];

  if (mode === 'scale') {
    newPixels = nearestNeighbourScale(pixels, width, height, newSize, newSize);
  } else {
    newPixels = cropPad(pixels, width, height, newSize, newSize);
  }

  return {
    ...sprite,
    width: newSize,
    height: newSize,
    pixels: newPixels,
    // Update name to reflect new size
    name: sprite.name.replace(/\d+x\d+/, `${newSize}x${newSize}`),
  };
}

/**
 * Resize all sprites in a map to a new size.
 *
 * @param sprites - Map of direction to sprite data
 * @param newSize - Target canvas size
 * @param mode - Resize mode
 * @returns New map with all sprites resized
 */
export function resizeAllSprites(
  sprites: Map<Direction, SpriteData>,
  newSize: CanvasSize,
  mode: ResizeMode
): Map<Direction, SpriteData> {
  const result = new Map<Direction, SpriteData>();

  for (const [direction, sprite] of sprites) {
    result.set(direction, resizeSprite(sprite, newSize, mode));
  }

  return result;
}

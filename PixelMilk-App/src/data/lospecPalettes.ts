/**
 * Lospec Palette Data
 * Pre-parsed palette data from .hex files for use in StyleSelector
 */

import type { Palette } from '../types';

// Helper to parse hex file content
function parseHexColors(content: string): string[] {
  return content
    .trim()
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(hex => hex.startsWith('#') ? hex.toUpperCase() : `#${hex.toUpperCase()}`);
}

// Import all .hex files from this directory
const hexModules = import.meta.glob('./*.hex', { query: '?raw', import: 'default', eager: true });

// Parse into Palette objects
export const LOSPEC_PALETTES: Palette[] = Object.entries(hexModules).map(([path, content]) => {
  // Extract filename without extension: "./sweetie-16.hex" -> "sweetie-16"
  const filename = path.replace(/^\.\//, '').replace(/\.hex$/, '');

  // Convert filename to display name: "sweetie-16" -> "Sweetie 16"
  const displayName = filename
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return {
    id: `lospec_${filename}`,
    name: displayName,
    colors: parseHexColors(content as string),
    source: 'lospec',
    createdAt: 0,
  };
}).sort((a, b) => a.name.localeCompare(b.name));

// Get palette by ID
export function getLospecPalette(id: string): Palette | undefined {
  return LOSPEC_PALETTES.find(p => p.id === id);
}

// Get palette colors by ID (for quick lookup)
export function getLospecColors(id: string): string[] | undefined {
  const palette = getLospecPalette(id);
  if (!palette) {
    console.warn(
      `[PixelMilk] Palette not found: "${id}". ` +
      `Available palettes: ${LOSPEC_PALETTES.map(p => p.id).join(', ')}`
    );
    return undefined;
  }
  return palette.colors;
}

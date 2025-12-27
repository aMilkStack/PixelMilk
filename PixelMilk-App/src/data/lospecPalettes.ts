/**
 * Lospec Palette Data
 * Pre-parsed palette data from .hex files for use in StyleSelector
 *
 * New structure loads 105 palettes from Palettes/ folder with nested categories:
 * - Micro (2-7): 2-7 colours
 * - Limited (8-15): 8-15 colours
 * - Extended (16-28): 16-28 colours
 * - Full (32-256): 32-256 colours
 *
 * Metadata is loaded from public/palettes/palettes.json at build time.
 */

import type { Palette } from '../types';

// ============================================
// Types
// ============================================

/** Extended palette with category and tag support */
export interface ExtendedPalette extends Palette {
  category: PaletteCategory;
  colourCount: number;
}

/** Palette category based on folder structure */
export type PaletteCategory = 'Micro' | 'Limited' | 'Extended' | 'Full';

/** Metadata entry from palettes.json */
interface PaletteMetaEntry {
  path: string;
  tags: string[];
  colours: number;
}

// ============================================
// Helpers
// ============================================

/** Parse hex file content into array of colours with # prefix */
function parseHexColors(content: string): string[] {
  return content
    .trim()
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(hex => hex.startsWith('#') ? hex.toUpperCase() : `#${hex.toUpperCase()}`);
}

/** Extract palette ID from path - matches chromakeys.json naming (lowercase, no hyphens in ID) */
function extractPaletteId(path: string): string {
  // Path format: "../Palettes/Micro (2-7)/2/palettename.hex"
  const match = path.match(/\/([^/]+)\.hex$/);
  if (!match) return '';
  return match[1].toLowerCase();
}

/** Extract category from path */
function extractCategory(path: string): PaletteCategory {
  if (path.includes('Micro (2-7)')) return 'Micro';
  if (path.includes('Limited (8-15)')) return 'Limited';
  if (path.includes('Extended (16-28)')) return 'Extended';
  if (path.includes('Full (32-256)')) return 'Full';
  return 'Micro'; // fallback
}

/** Convert palette ID to display name */
function idToDisplayName(id: string): string {
  // Handle camelCase or concatenated words: "cultoftheeighties" -> "Cult Of The Eighties"
  // First try to split on common word boundaries
  return id
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([0-9]+)/g, ' $1 ')
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
    .trim();
}

// ============================================
// Data Loading
// ============================================

// Import all .hex files from the palettes directory structure
const hexModules = import.meta.glob('./palettes/**/*.hex', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

// Import palettes.json for metadata at build time
import palettesMetaRaw from './palettes/palettes.json';
const palettesMeta = palettesMetaRaw as Record<string, PaletteMetaEntry>;

// Import chromakeys.json for background removal
import chromakeysRaw from './palettes/chromakeys.json';
const chromakeys = chromakeysRaw as Record<string, { chromaKey: string; distance: number }>;

// ============================================
// Palette Building
// ============================================

/** Build extended palettes from hex files and metadata */
function buildPalettes(): ExtendedPalette[] {
  const palettes: ExtendedPalette[] = [];

  for (const [path, content] of Object.entries(hexModules)) {
    const id = extractPaletteId(path);
    if (!id) continue;

    const colors = parseHexColors(content);
    const category = extractCategory(path);
    const meta = palettesMeta[id];

    // Use metadata tags if available, otherwise empty array
    const tags = meta?.tags ?? [];
    const colourCount = meta?.colours ?? colors.length;

    palettes.push({
      id: id,
      name: idToDisplayName(id),
      colors,
      source: 'curated',
      createdAt: 0,
      tags,
      category,
      colourCount,
    });
  }

  return palettes.sort((a, b) => a.name.localeCompare(b.name));
}

// ============================================
// Exports
// ============================================

/** All loaded Lospec palettes */
export const LOSPEC_PALETTES: ExtendedPalette[] = buildPalettes();

/** Legacy ID mapping for backwards compatibility */
const legacyIdMap = new Map<string, string>();

// Build legacy mapping: "lospec_sweetie-16" -> "lospec_sweetie16"
// This handles cases where old code might use hyphenated IDs
LOSPEC_PALETTES.forEach(p => {
  // The current ID format is lospec_palettename (no hyphens)
  // Old format might have been lospec_palette-name
  // We normalize by stripping hyphens for lookup
  const normalized = p.id.replace(/-/g, '');
  if (normalized !== p.id) {
    legacyIdMap.set(p.id, normalized);
  }
});

/**
 * Get palette by ID
 * Supports both new format (lospec_palettename) and legacy format (lospec_palette-name)
 */
export function getLospecPalette(id: string): ExtendedPalette | undefined {
  // Direct lookup first
  let palette = LOSPEC_PALETTES.find(p => p.id === id);
  if (palette) return palette;

  // Try normalizing the input ID (remove hyphens)
  const normalizedId = id.replace(/-/g, '');
  palette = LOSPEC_PALETTES.find(p => p.id === normalizedId);

  return palette;
}

/**
 * Get palette colors by ID (for quick lookup)
 * Supports legacy IDs with hyphens like "lospec_sweetie-16"
 */
export function getLospecColors(id: string): string[] | undefined {
  const palette = getLospecPalette(id);
  if (!palette) {
    console.warn(
      `[PixelMilk] Palette not found: "${id}". ` +
      `Available palettes: ${LOSPEC_PALETTES.slice(0, 10).map(p => p.id).join(', ')}...`
    );
    return undefined;
  }
  return palette.colors;
}

/**
 * Filter palettes by tag
 * @param tag - Tag to filter by (case-insensitive)
 * @returns Array of palettes that have the specified tag
 */
export function getLospecPalettesByTag(tag: string): ExtendedPalette[] {
  const normalizedTag = tag.toLowerCase();
  return LOSPEC_PALETTES.filter(p =>
    p.tags?.some(t => t.toLowerCase() === normalizedTag)
  );
}

/**
 * Filter palettes by category
 * @param category - Category to filter by (Micro, Limited, Extended, Full)
 * @returns Array of palettes in the specified category
 */
export function getLospecPalettesByCategory(category: PaletteCategory): ExtendedPalette[] {
  return LOSPEC_PALETTES.filter(p => p.category === category);
}

/**
 * Filter palettes by colour count range
 * @param min - Minimum colours (inclusive)
 * @param max - Maximum colours (inclusive)
 */
export function getLospecPalettesByColourCount(min: number, max: number): ExtendedPalette[] {
  return LOSPEC_PALETTES.filter(p => p.colourCount >= min && p.colourCount <= max);
}

/**
 * Get all unique tags across all palettes
 * Useful for building filter UIs
 */
export function getAllTags(): string[] {
  const tagSet = new Set<string>();
  for (const palette of LOSPEC_PALETTES) {
    if (palette.tags) {
      for (const tag of palette.tags) {
        tagSet.add(tag);
      }
    }
  }
  return Array.from(tagSet).sort();
}

/**
 * Get all palette categories
 */
export function getAllCategories(): PaletteCategory[] {
  return ['Micro', 'Limited', 'Extended', 'Full'];
}

/**
 * Get palette counts by category
 * Useful for showing category stats
 */
export function getPaletteCounts(): Record<PaletteCategory, number> {
  const counts: Record<PaletteCategory, number> = {
    Micro: 0,
    Limited: 0,
    Extended: 0,
    Full: 0,
  };

  for (const palette of LOSPEC_PALETTES) {
    counts[palette.category]++;
  }

  return counts;
}

// ============================================
// ChromaKey Functions
// ============================================

/**
 * Get chromaKey colour for a palette (sync, no fetch needed)
 */
export function getChromaKey(paletteName: string): string | null {
  const entry = chromakeys[paletteName];
  if (!entry) return null;
  return `#${entry.chromaKey}`;
}

/**
 * Get chromaKey with distance for tolerance calculation (sync)
 */
export function getChromaKeyWithDistance(paletteName: string): { chromaKey: string; distance: number } | null {
  const entry = chromakeys[paletteName];
  if (!entry) return null;
  return {
    chromaKey: `#${entry.chromaKey}`,
    distance: entry.distance,
  };
}

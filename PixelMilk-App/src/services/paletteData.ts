/**
 * Palette Data Service
 * Loads and provides access to palette metadata from JSON files
 *
 * Data files expected in public/palettes/:
 * - chromakeys.json - Background removal keys per palette
 * - palettes.json   - Palette metadata (path, tags, colour count)
 * - roles.json      - Colour role assignments (darkest, lightest, outlines, etc.)
 * - shadows.json    - Shadow colour data (if needed)
 */

import type {
  ChromaKeyEntry,
  PaletteMetaEntry,
  PaletteRolesEntry,
} from '../types';

// Re-export types for convenience
export type { ChromaKeyEntry, PaletteMetaEntry, PaletteRolesEntry };

// Shadow data structure (not in main types as it may vary)
export interface ShadowEntry {
  [key: string]: unknown;
}

// Raw JSON structures (keyed by palette name)
type ChromaKeysData = Record<string, ChromaKeyEntry>;
type PalettesData = Record<string, PaletteMetaEntry>;
type RolesData = Record<string, PaletteRolesEntry>;
type ShadowsData = Record<string, ShadowEntry>;

// ============================================
// Data Cache
// ============================================

let chromaKeysCache: ChromaKeysData | null = null;
let palettesCache: PalettesData | null = null;
let rolesCache: RolesData | null = null;
let shadowsCache: ShadowsData | null = null;

// Track loading state to prevent duplicate fetches
let loadingPromise: Promise<void> | null = null;

// ============================================
// Data Loading
// ============================================

/**
 * Base path for palette data files
 * Files should be placed in public/palettes/ for runtime loading
 */
const PALETTE_DATA_PATH = '/palettes';

/**
 * Load all palette data files
 * Caches results after first successful load
 */
async function loadPaletteData(): Promise<void> {
  // Return cached data if already loaded
  if (chromaKeysCache && palettesCache && rolesCache) {
    return;
  }

  // If already loading, wait for that promise
  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = (async () => {
    try {
      const [chromaKeysRes, palettesRes, rolesRes, shadowsRes] = await Promise.all([
        fetch(`${PALETTE_DATA_PATH}/chromakeys.json`),
        fetch(`${PALETTE_DATA_PATH}/palettes.json`),
        fetch(`${PALETTE_DATA_PATH}/roles.json`),
        fetch(`${PALETTE_DATA_PATH}/shadows.json`).catch(() => null), // shadows optional
      ]);

      if (!chromaKeysRes.ok) {
        throw new Error(`Failed to load chromakeys.json: ${chromaKeysRes.status}`);
      }
      if (!palettesRes.ok) {
        throw new Error(`Failed to load palettes.json: ${palettesRes.status}`);
      }
      if (!rolesRes.ok) {
        throw new Error(`Failed to load roles.json: ${rolesRes.status}`);
      }

      chromaKeysCache = await chromaKeysRes.json();
      palettesCache = await palettesRes.json();
      rolesCache = await rolesRes.json();

      if (shadowsRes?.ok) {
        shadowsCache = await shadowsRes.json();
      }
    } catch (error) {
      console.error('[PaletteData] Failed to load palette data:', error);
      // Reset loading promise so retry is possible
      loadingPromise = null;
      throw error;
    }
  })();

  return loadingPromise;
}

/**
 * Ensure data is loaded before accessing
 * Call this at app startup or before first palette operation
 */
export async function initPaletteData(): Promise<void> {
  await loadPaletteData();
}

// ============================================
// Lookup Functions
// ============================================

/**
 * Get the chroma key colour for background removal
 * @param paletteName - Name of the palette (case-sensitive)
 * @returns Hex colour WITH # prefix, or null if not found
 */
export async function getChromaKey(paletteName: string): Promise<string | null> {
  await loadPaletteData();

  const entry = chromaKeysCache?.[paletteName];
  if (!entry) {
    console.warn(`[PaletteData] No chroma key found for palette: ${paletteName}`);
    return null;
  }

  // Source data has no # prefix - add it for consistency
  return `#${entry.chromaKey}`;
}

/**
 * Get the chroma key with distance threshold
 * Useful for more precise background removal
 */
export async function getChromaKeyWithDistance(
  paletteName: string
): Promise<{ chromaKey: string; distance: number } | null> {
  await loadPaletteData();

  const entry = chromaKeysCache?.[paletteName];
  if (!entry) {
    return null;
  }

  return {
    chromaKey: `#${entry.chromaKey}`,
    distance: entry.distance,
  };
}

/**
 * Get palette metadata (path, tags, colour count)
 * @param paletteName - Name of the palette
 */
export async function getPaletteMeta(
  paletteName: string
): Promise<PaletteMetaEntry | null> {
  await loadPaletteData();

  const entry = palettesCache?.[paletteName];
  if (!entry) {
    console.warn(`[PaletteData] No metadata found for palette: ${paletteName}`);
    return null;
  }

  return entry;
}

/**
 * Get colour role assignments for a palette
 * @param paletteName - Name of the palette
 */
export async function getPaletteRoles(
  paletteName: string
): Promise<PaletteRolesEntry | null> {
  await loadPaletteData();

  const entry = rolesCache?.[paletteName];
  if (!entry) {
    console.warn(`[PaletteData] No roles found for palette: ${paletteName}`);
    return null;
  }

  return entry;
}

/**
 * Get shadow data for a palette (if available)
 */
export async function getPaletteShadows(
  paletteName: string
): Promise<ShadowEntry | null> {
  await loadPaletteData();

  if (!shadowsCache) {
    return null;
  }

  return shadowsCache[paletteName] ?? null;
}

// ============================================
// Collection Functions
// ============================================

/**
 * Get all available palette names
 * Returns names from palettes.json (the authoritative source)
 */
export async function getAllPaletteNames(): Promise<string[]> {
  await loadPaletteData();

  if (!palettesCache) {
    return [];
  }

  return Object.keys(palettesCache).sort();
}

/**
 * Filter palettes by tag
 * @param tag - Tag to filter by (e.g., 'warm', 'retro', 'high-contrast')
 * @returns Array of palette names that have the specified tag
 */
export async function getPalettesByTag(tag: string): Promise<string[]> {
  await loadPaletteData();

  if (!palettesCache) {
    return [];
  }

  const normalizedTag = tag.toLowerCase();

  return Object.entries(palettesCache)
    .filter(([, meta]) =>
      meta.tags.some((t) => t.toLowerCase() === normalizedTag)
    )
    .map(([name]) => name)
    .sort();
}

/**
 * Filter palettes by multiple tags (AND logic)
 * @param tags - Tags to filter by
 * @returns Palette names that have ALL specified tags
 */
export async function getPalettesByTags(tags: string[]): Promise<string[]> {
  await loadPaletteData();

  if (!palettesCache || tags.length === 0) {
    return [];
  }

  const normalizedTags = tags.map((t) => t.toLowerCase());

  return Object.entries(palettesCache)
    .filter(([, meta]) => {
      const paletteTags = meta.tags.map((t) => t.toLowerCase());
      return normalizedTags.every((tag) => paletteTags.includes(tag));
    })
    .map(([name]) => name)
    .sort();
}

/**
 * Get palettes by colour count range
 * @param min - Minimum colours (inclusive)
 * @param max - Maximum colours (inclusive)
 */
export async function getPalettesByColourCount(
  min: number,
  max: number
): Promise<string[]> {
  await loadPaletteData();

  if (!palettesCache) {
    return [];
  }

  return Object.entries(palettesCache)
    .filter(([, meta]) => meta.colours >= min && meta.colours <= max)
    .map(([name]) => name)
    .sort();
}

/**
 * Get all unique tags across all palettes
 * Useful for building filter UIs
 */
export async function getAllTags(): Promise<string[]> {
  await loadPaletteData();

  if (!palettesCache) {
    return [];
  }

  const tagSet = new Set<string>();

  for (const meta of Object.values(palettesCache)) {
    for (const tag of meta.tags) {
      tagSet.add(tag);
    }
  }

  return Array.from(tagSet).sort();
}

// ============================================
// Utility Functions
// ============================================

/**
 * Check if a palette exists in the metadata
 */
export async function paletteExists(paletteName: string): Promise<boolean> {
  await loadPaletteData();
  return palettesCache !== null && paletteName in palettesCache;
}

/**
 * Get full palette info (combined from all sources)
 * Convenience function for getting all data about a palette at once
 */
export async function getFullPaletteInfo(paletteName: string): Promise<{
  name: string;
  meta: PaletteMetaEntry | null;
  chromaKey: string | null;
  chromaDistance: number | null;
  roles: PaletteRolesEntry | null;
  shadows: ShadowEntry | null;
} | null> {
  await loadPaletteData();

  if (!palettesCache || !(paletteName in palettesCache)) {
    return null;
  }

  const chromaEntry = chromaKeysCache?.[paletteName];

  return {
    name: paletteName,
    meta: palettesCache[paletteName] ?? null,
    chromaKey: chromaEntry ? `#${chromaEntry.chromaKey}` : null,
    chromaDistance: chromaEntry?.distance ?? null,
    roles: rolesCache?.[paletteName] ?? null,
    shadows: shadowsCache?.[paletteName] ?? null,
  };
}

/**
 * Clear cached data (useful for testing or forcing reload)
 */
export function clearPaletteDataCache(): void {
  chromaKeysCache = null;
  palettesCache = null;
  rolesCache = null;
  shadowsCache = null;
  loadingPromise = null;
}

/**
 * Palette Storage and Loading Service
 * Handles .HEX file parsing and palette persistence
 *
 * TODO: [M6] Migrate palette storage from localStorage to IndexedDB for consistency
 * with the asset storage pattern used in assets.ts. This would provide better storage
 * capacity and align with the rest of the storage architecture.
 */

import type { Palette } from '../../types';

const PALETTES_STORAGE_KEY = 'pixelmilk_palettes';

/**
 * Parse a .HEX file content into a Palette object
 * .HEX format: one hex color per line, no # prefix
 */
export function parseHexFile(content: string, name: string): Palette {
  const lines = content.trim().split(/\r?\n/);
  const colors: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Handle both with and without # prefix
    const hex = trimmed.startsWith('#') ? trimmed : `#${trimmed}`;

    // Validate hex format (3, 4, 6, or 8 characters after #)
    if (/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(hex)) {
      // Normalize to 6-character hex
      const normalized = normalizeHex(hex);
      colors.push(normalized);
    }
  }

  return {
    id: `palette_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name,
    colors,
    source: 'lospec',
    createdAt: Date.now(),
  };
}

/**
 * Normalize hex colors to 6-character format with #
 */
function normalizeHex(hex: string): string {
  const clean = hex.replace('#', '');

  if (clean.length === 3) {
    // Expand shorthand: ABC -> AABBCC
    return `#${clean[0]}${clean[0]}${clean[1]}${clean[1]}${clean[2]}${clean[2]}`.toUpperCase();
  }

  if (clean.length === 4) {
    // Expand shorthand with alpha: ABCD -> AABBCCDD (drop alpha for now)
    return `#${clean[0]}${clean[0]}${clean[1]}${clean[1]}${clean[2]}${clean[2]}`.toUpperCase();
  }

  if (clean.length === 8) {
    // Has alpha - drop it for standard hex
    return `#${clean.slice(0, 6)}`.toUpperCase();
  }

  return `#${clean}`.toUpperCase();
}

/**
 * Load a palette from a File object (drag-drop or file picker)
 */
export async function loadPaletteFromFile(file: File): Promise<Palette> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const name = file.name.replace(/\.(hex|txt)$/i, '');
        const palette = parseHexFile(content, name);

        if (palette.colors.length === 0) {
          reject(new Error('No valid colors found in file'));
          return;
        }

        resolve(palette);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

/**
 * Get all palettes from localStorage
 */
export function getAllPalettes(): Palette[] {
  try {
    const data = localStorage.getItem(PALETTES_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to read palettes from localStorage:', error);
    return [];
  }
}

/**
 * Save a palette to localStorage
 */
export function savePalette(palette: Palette): void {
  try {
    const palettes = getAllPalettes();
    const existingIndex = palettes.findIndex((p) => p.id === palette.id);

    if (existingIndex >= 0) {
      palettes[existingIndex] = palette;
    } else {
      palettes.push(palette);
    }

    localStorage.setItem(PALETTES_STORAGE_KEY, JSON.stringify(palettes));
  } catch (error) {
    console.error('Failed to save palette:', error);
    throw new Error('Failed to save palette: storage quota exceeded or unavailable');
  }
}

/**
 * Delete a palette by ID
 */
export function deletePalette(id: string): void {
  try {
    const palettes = getAllPalettes();
    const filtered = palettes.filter((p) => p.id !== id);
    localStorage.setItem(PALETTES_STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to delete palette:', error);
    throw new Error('Failed to delete palette');
  }
}

/**
 * Get a palette by ID
 */
export function getPalette(id: string): Palette | undefined {
  const palettes = getAllPalettes();
  return palettes.find((p) => p.id === id);
}

/**
 * Import multiple palette files at once
 */
export async function importPaletteFiles(files: FileList): Promise<Palette[]> {
  const imported: Palette[] = [];
  const errors: string[] = [];

  for (const file of Array.from(files)) {
    try {
      const palette = await loadPaletteFromFile(file);
      savePalette(palette);
      imported.push(palette);
    } catch (error) {
      errors.push(`${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  if (errors.length > 0) {
    console.warn('Some palettes failed to import:', errors);
  }

  return imported;
}

/**
 * Built-in palettes (classic gaming palettes)
 */
export const BUILT_IN_PALETTES: Palette[] = [
  {
    id: 'builtin_gameboy',
    name: 'Game Boy',
    colors: ['#0F380F', '#306230', '#8BAC0F', '#9BBC0F'],
    source: 'builtin',
    createdAt: 0,
  },
  {
    id: 'builtin_nes',
    name: 'NES',
    colors: [
      '#000000', '#FCFCFC', '#F8F8F8', '#BCBCBC',
      '#7C7C7C', '#A4E4FC', '#3CBCFC', '#0078F8',
      '#0000FC', '#B8B8F8', '#6888FC', '#0058F8',
      '#0000BC', '#D8B8F8', '#9878F8', '#6844FC',
    ],
    source: 'builtin',
    createdAt: 0,
  },
  {
    id: 'builtin_pico8',
    name: 'PICO-8',
    colors: [
      '#000000', '#1D2B53', '#7E2553', '#008751',
      '#AB5236', '#5F574F', '#C2C3C7', '#FFF1E8',
      '#FF004D', '#FFA300', '#FFEC27', '#00E436',
      '#29ADFF', '#83769C', '#FF77A8', '#FFCCAA',
    ],
    source: 'builtin',
    createdAt: 0,
  },
];

/**
 * Get all palettes including built-ins
 */
export function getAllPalettesWithBuiltins(): Palette[] {
  return [...BUILT_IN_PALETTES, ...getAllPalettes()];
}

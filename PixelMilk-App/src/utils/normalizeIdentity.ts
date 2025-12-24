/**
 * Identity Normalizer
 * Transforms raw Gemini response to consistent camelCase CharacterIdentity
 * Handles snake_case, legacy formats, and missing fields
 */

import { CharacterIdentity, StyleParameters } from '../types';

type RawIdentity = Record<string, unknown>;

/**
 * Normalizes a raw identity object from Gemini to the expected CharacterIdentity format.
 * Handles snake_case to camelCase conversion and provides sensible defaults.
 */
export function normalizeIdentity(
  raw: RawIdentity,
  style: StyleParameters,
  now: number = Date.now()
): CharacterIdentity {
  return {
    id: getString(raw, ['id']) || `char-${now}`,
    name: getString(raw, ['name']) || 'Unnamed Character',
    description: getString(raw, ['description']) || '',

    physicalDescription: {
      bodyType: getString(raw, ['physicalDescription.bodyType', 'physical_description.body_type', 'physicalDescription.body_type']) || 'Standard',
      heightStyle: getString(raw, ['physicalDescription.heightStyle', 'physical_description.height_style', 'physicalDescription.height_style']) || 'Medium',
      silhouette: getString(raw, ['physicalDescription.silhouette', 'physical_description.silhouette']) || 'Balanced',
    },

    colourPalette: {
      primary: getString(raw, ['colourPalette.primary', 'colour_palette.primary', 'colorPalette.primary', 'color_palette.primary']) || '#888888',
      secondary: getString(raw, ['colourPalette.secondary', 'colour_palette.secondary', 'colorPalette.secondary', 'color_palette.secondary']) || '#666666',
      accent: getString(raw, ['colourPalette.accent', 'colour_palette.accent', 'colorPalette.accent', 'color_palette.accent']) || '#FFFFFF',
      skin: getString(raw, ['colourPalette.skin', 'colour_palette.skin', 'colorPalette.skin', 'color_palette.skin']),
      hair: getString(raw, ['colourPalette.hair', 'colour_palette.hair', 'colorPalette.hair', 'color_palette.hair']),
      outline: getString(raw, ['colourPalette.outline', 'colour_palette.outline', 'colorPalette.outline', 'color_palette.outline']) || '#000000',
    },

    distinctiveFeatures: getStringArray(raw, ['distinctiveFeatures', 'distinctive_features']) || [],

    angleNotes: {
      S: truncateAngleNote(getString(raw, ['angleNotes.S', 'angle_notes.S', 'angleNotes.s', 'angle_notes.s'])),
      N: truncateAngleNote(getString(raw, ['angleNotes.N', 'angle_notes.N', 'angleNotes.n', 'angle_notes.n'])),
      E: truncateAngleNote(getString(raw, ['angleNotes.E', 'angle_notes.E', 'angleNotes.e', 'angle_notes.e'])),
      W: truncateAngleNote(getString(raw, ['angleNotes.W', 'angle_notes.W', 'angleNotes.w', 'angle_notes.w'])),
      SE: truncateAngleNote(getString(raw, ['angleNotes.SE', 'angle_notes.SE', 'angleNotes.se', 'angle_notes.se'])),
      SW: truncateAngleNote(getString(raw, ['angleNotes.SW', 'angle_notes.SW', 'angleNotes.sw', 'angle_notes.sw'])),
      NE: truncateAngleNote(getString(raw, ['angleNotes.NE', 'angle_notes.NE', 'angleNotes.ne', 'angle_notes.ne'])),
      NW: truncateAngleNote(getString(raw, ['angleNotes.NW', 'angle_notes.NW', 'angleNotes.nw', 'angle_notes.nw'])),
    },

    styleParameters: style,
    createdAt: getNumber(raw, ['createdAt', 'created_at']) || now,
    updatedAt: getNumber(raw, ['updatedAt', 'updated_at']) || now,
  };
}

/**
 * Gets a string value from a nested path, trying multiple key variants
 */
function getString(obj: RawIdentity, paths: string[]): string | undefined {
  for (const path of paths) {
    const value = getNestedValue(obj, path);
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return undefined;
}

/**
 * Gets a number value from a nested path, trying multiple key variants
 */
function getNumber(obj: RawIdentity, paths: string[]): number | undefined {
  for (const path of paths) {
    const value = getNestedValue(obj, path);
    if (typeof value === 'number') {
      return value;
    }
  }
  return undefined;
}

/**
 * Gets a string array from a nested path, trying multiple key variants
 */
function getStringArray(obj: RawIdentity, paths: string[]): string[] | undefined {
  for (const path of paths) {
    const value = getNestedValue(obj, path);
    if (Array.isArray(value)) {
      return value.filter((v): v is string => typeof v === 'string');
    }
  }
  return undefined;
}

/**
 * Truncates angle notes to prevent runaway text from Gemini.
 * NotebookLM recommends 10-2,000 chars for detailed narrative descriptions.
 * Max 500 chars per angle note, cuts at word boundary.
 * Also detects runaway repetition patterns (e.g., "view view view...").
 */
function truncateAngleNote(note: string | undefined): string | undefined {
  if (!note) return undefined;

  // Detect runaway repetition (same word repeated 3+ times)
  const words = note.split(/\s+/);
  if (words.length >= 3) {
    const firstWord = words[0].toLowerCase();
    const repeatedCount = words.filter(w => w.toLowerCase() === firstWord).length;
    if (repeatedCount >= 3 && repeatedCount > words.length * 0.5) {
      // More than half the words are the same - likely runaway
      return undefined;
    }
  }

  if (note.length <= 500) return note;

  // Try to cut at a word boundary
  const truncated = note.slice(0, 500);
  const lastSpace = truncated.lastIndexOf(' ');

  if (lastSpace > 400) {
    return truncated.slice(0, lastSpace);
  }
  return truncated;
}

/**
 * Gets a nested value from an object using dot notation
 */
function getNestedValue(obj: RawIdentity, path: string): unknown {
  const keys = path.split('.');
  let current: unknown = obj;

  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }

  return current;
}

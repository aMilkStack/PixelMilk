/**
 * Forbidden Words Validation
 *
 * Prevents users from including terms that degrade generation quality.
 * The AI already knows it's generating pixel art - including these terms
 * causes it to over-emphasise pixel aesthetics at the expense of character detail.
 */

export interface ForbiddenWordMatch {
  /** The forbidden word/phrase that was matched */
  word: string;
  /** Human-readable explanation of why this word is forbidden */
  reason: string;
  /** Start index in the original string (for highlighting if needed) */
  startIndex: number;
  /** End index in the original string */
  endIndex: number;
}

export interface ForbiddenWordsResult {
  /** Whether any forbidden words were found */
  hasForbiddenWords: boolean;
  /** All matches found (may be multiple) */
  matches: ForbiddenWordMatch[];
  /** First match for simple display (null if none) */
  firstMatch: ForbiddenWordMatch | null;
}

/**
 * Forbidden words/phrases with their explanations.
 * Ordered roughly by likelihood of use - most common first.
 */
const FORBIDDEN_WORDS: Array<{ pattern: string; reason: string }> = [
  {
    pattern: 'pixel art',
    reason: 'the AI already knows to generate pixel art',
  },
  {
    pattern: 'pixel',
    reason: 'the AI already knows to generate pixel art',
  },
  {
    pattern: 'sprite',
    reason: 'the system already generates sprites - describe the character instead',
  },
  {
    pattern: '8-bit',
    reason: 'style is controlled by canvas settings, not the prompt',
  },
  {
    pattern: '8bit',
    reason: 'style is controlled by canvas settings, not the prompt',
  },
  {
    pattern: '16-bit',
    reason: 'style is controlled by canvas settings, not the prompt',
  },
  {
    pattern: '16bit',
    reason: 'style is controlled by canvas settings, not the prompt',
  },
  {
    pattern: 'retro',
    reason: 'focus on describing the character, not the art style',
  },
  {
    pattern: 'pixelated',
    reason: 'the output is already pixelated - describe visual features instead',
  },
  {
    pattern: 'low resolution',
    reason: 'resolution is set by canvas size, not the prompt',
  },
  {
    pattern: 'low-res',
    reason: 'resolution is set by canvas size, not the prompt',
  },
  {
    pattern: 'lo-res',
    reason: 'resolution is set by canvas size, not the prompt',
  },
];

/**
 * Check a description for forbidden words.
 *
 * @param text - The description text to check
 * @returns Result object with match information
 */
export function checkForbiddenWords(text: string): ForbiddenWordsResult {
  const matches: ForbiddenWordMatch[] = [];
  const lowerText = text.toLowerCase();

  for (const { pattern, reason } of FORBIDDEN_WORDS) {
    const lowerPattern = pattern.toLowerCase();
    let searchStart = 0;

    // Find all occurrences of this pattern
    while (true) {
      const index = lowerText.indexOf(lowerPattern, searchStart);
      if (index === -1) break;

      // Check word boundaries to avoid false positives
      // e.g. "pixel" shouldn't match in "subpixel" but should match "pixel," or "pixel!"
      const charBefore = index > 0 ? lowerText[index - 1] : ' ';
      const charAfter = index + lowerPattern.length < lowerText.length
        ? lowerText[index + lowerPattern.length]
        : ' ';

      const isWordBoundaryBefore = !isLetterOrDigit(charBefore);
      const isWordBoundaryAfter = !isLetterOrDigit(charAfter);

      if (isWordBoundaryBefore && isWordBoundaryAfter) {
        matches.push({
          word: pattern,
          reason,
          startIndex: index,
          endIndex: index + pattern.length,
        });
      }

      searchStart = index + 1;
    }
  }

  // Sort by position in text
  matches.sort((a, b) => a.startIndex - b.startIndex);

  // Deduplicate overlapping matches (prefer longer matches)
  const deduped = deduplicateMatches(matches);

  return {
    hasForbiddenWords: deduped.length > 0,
    matches: deduped,
    firstMatch: deduped.length > 0 ? deduped[0] : null,
  };
}

/**
 * Check if character is a letter or digit (for word boundary detection)
 */
function isLetterOrDigit(char: string): boolean {
  return /[a-zA-Z0-9]/.test(char);
}

/**
 * Remove overlapping matches, preferring longer patterns.
 * e.g. "pixel art" should take precedence over just "pixel"
 */
function deduplicateMatches(matches: ForbiddenWordMatch[]): ForbiddenWordMatch[] {
  if (matches.length <= 1) return matches;

  const result: ForbiddenWordMatch[] = [];

  for (const match of matches) {
    // Check if this match overlaps with any existing result
    const overlappingIndex = result.findIndex(existing =>
      (match.startIndex >= existing.startIndex && match.startIndex < existing.endIndex) ||
      (match.endIndex > existing.startIndex && match.endIndex <= existing.endIndex) ||
      (match.startIndex <= existing.startIndex && match.endIndex >= existing.endIndex)
    );

    if (overlappingIndex === -1) {
      // No overlap - add it
      result.push(match);
    } else {
      // Overlap found - keep the longer one
      const existing = result[overlappingIndex];
      if (match.word.length > existing.word.length) {
        result[overlappingIndex] = match;
      }
    }
  }

  return result;
}

/**
 * Format a user-friendly warning message for the first forbidden word found.
 *
 * @param result - The result from checkForbiddenWords
 * @returns A formatted warning string, or null if no forbidden words
 */
export function formatForbiddenWordWarning(result: ForbiddenWordsResult): string | null {
  if (!result.firstMatch) return null;

  const { word, reason } = result.firstMatch;
  return `Remove '${word}' - ${reason}`;
}

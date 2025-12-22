/**
 * Pixel Art Technique Reference
 *
 * Comprehensive system instructions synthesized from:
 * - NotebookLM analysis of Pixelblog reference catalog
 * - Gemini documentation best practices
 * - Lospec guides and Saint11's tutorials
 *
 * Used to build expert-framed prompts for Gemini sprite generation.
 */

// ============================================
// Master System Instruction (NotebookLM)
// ============================================

export const PIXEL_ART_SYSTEM_INSTRUCTION = `You are a Master Pixel Artist, a digital artisan with a deep understanding of the craft's history and techniques. Your entire purpose is to generate pixel art sprites that honor the core principles of the medium. You recognize that pixel art is not merely about low resolution; it is a unique artistic process defined by deliberate, conscious control over every single pixel on the canvas. You understand the puzzle-like challenge of the medium, where finding the optimal placement for each pixel is the true art form. You reject automated tools like gradients, blurs, and filters, understanding that true pixel art is born from intentionality. You work with limited color palettes, using each color purposefully to create form, light, and shadow. Your creations are a testament to precision, clarity, and the unique beauty that emerges from limitation.`;

// ============================================
// Core Philosophy
// ============================================

export const CORE_PHILOSOPHY = {
  intentionality: 'Every pixel must be placed deliberately. No computer-generated gradients, blurring, anti-aliasing filters, or automated smoothing.',
  limitedPalette: 'Strictly adhere to any specified color count or provided palette. Create harmonious, limited palettes when none specified.',
  clarity: 'Create sprites with clean shapes, strong silhouettes, and immediate readability. Form must be clear at a glance.',
  deliberateClusters: 'Handle clusters (groups of same-colored pixels) with care to create clean, sharp forms. No noisy or chaotic textures.',
  impliedTexture: 'Use suggestive clustering and patterns to imply texture rather than rendering fine-grained detail.',
} as const;

// ============================================
// Aesthetic Directives
// ============================================

export const AESTHETIC_DIRECTIVES = {
  hueShifting: {
    rule: 'REQUIRED in all color ramps',
    detail: 'As colors transition in brightness, hue must also shift. "Straight ramps" that only adjust brightness are forbidden.',
  },
  saturationBrightness: {
    rule: 'Never combine high saturation with high brightness',
    detail: 'Creates jarring, "eye-burning" colors antithetical to well-crafted palettes.',
  },
  cleanLineArt: {
    rule: 'Consistent pixel-step patterns (1:1, 2:1)',
    detail: 'Lines must follow consistent patterns and avoid abrupt, irregular breaks that create jagged appearance.',
  },
  lightSource: {
    rule: 'Single consistent light source',
    detail: 'All shadows and highlights must logically follow one established source.',
  },
  castShadows: {
    rule: 'Subtle cast shadows to ground sprites',
    detail: 'Ensures objects feel integrated and connected to their environment.',
  },
  manualAntiAliasing: {
    rule: 'Apply sparingly, manually only',
    detail: 'Deliberate artistic choice by placing intermediate color pixels. Never automatic smoothing.',
  },
  manualDithering: {
    rule: 'Use for texture and color illusion',
    detail: 'Patterned dithering creates texture within limited palettes. Reinforces rejection of gradients.',
  },
  projectionConsistency: {
    rule: 'Single uniform projection per image',
    detail: 'Never mix top-down, side-view, 3/4, or isometric in one output.',
  },
  isometricRatio: {
    rule: '2:1 pixel ratio for isometric',
    detail: 'Angled lines must use precise 2:1 ratio for correct isometric perspective.',
  },
} as const;

// ============================================
// Strict Prohibitions
// ============================================

export const STRICT_PROHIBITIONS = [
  'NO automated filters (blur, gradients, sharpening, noise reduction)',
  'NO "jaggies" - inconsistent, broken, or jagged line art',
  'NO mixed projections within a single image output',
  'NO palette violations - never exceed specified color count',
  'NO straight color ramps - all ramps must hue-shift',
  'NO noisy textures - no rendering every detail (e.g., every brick)',
] as const;

// ============================================
// Anti-Pattern Definitions
// ============================================

export const ANTI_PATTERNS = {
  jaggies: {
    name: 'Jaggies',
    description: 'Inconsistent staircase patterns on curves and diagonals',
    detection: 'Look for irregular pixel-step sequences on curved/diagonal lines',
    fix: 'Use graduated segment lengths (longest at cardinals, shorter toward 45 degrees)',
  },
  orphanPixels: {
    name: 'Orphan Pixels',
    description: 'Single isolated pixels not connected to any cluster',
    detection: 'Find pixels with no same-colored neighbors',
    fix: 'Remove or connect to nearby clusters',
  },
  pillowShading: {
    name: 'Pillow Shading',
    description: 'Light in center, dark edges all around (no consistent light source)',
    detection: 'Shading mirrors outline shape instead of following light direction',
    fix: 'Establish single light source, shade consistently from that direction',
  },
  banding: {
    name: 'Banding',
    description: 'Parallel lines of color creating unnatural striping',
    detection: 'Adjacent same-width color bands running parallel',
    fix: 'Break up bands with dithering or varied band widths',
  },
  straightRamps: {
    name: 'Straight Color Ramps',
    description: 'Color transitions that only change brightness, not hue',
    detection: 'Color ramps where hue remains constant while brightness changes',
    fix: 'Shift hue as brightness changes (cooler in shadows, warmer in highlights)',
  },
} as const;

// ============================================
// Outline Techniques
// ============================================

export const OUTLINE_TECHNIQUES = {
  black: {
    name: 'Black Outline',
    description: 'Classic pixel art look with solid black outlines',
    rules: [
      'Use single-pixel-wide lines throughout',
      'Diagonal segments must be uniform length for smooth appearance',
      'Curves need graduated segment lengths (longest at cardinals, shorter toward 45 degrees)',
      'Omit outlines where objects touch ground to prevent floating appearance',
      'Focus on external outlines; internal lines only where needed for clarity',
    ],
  },
  colored: {
    name: 'Colored Outline (Sel-out)',
    description: 'Outlines use darker shades of adjacent colours',
    rules: [
      'Outline must ALWAYS be darker than both the object AND background behind it',
      'Use darker shades of the object colour (dark green outline for green areas)',
      'Different parts get outlines matching their respective hues',
      'Apply different outline colours across same object based on local value',
      'Internal lines can fade toward connection points for gradual transitions',
    ],
  },
  selective: {
    name: 'Selective Outline',
    description: 'Outlines only where needed for contrast',
    rules: [
      'Only outline edges that need separation from background',
      'Omit outlines between adjacent shapes with sufficient contrast',
      'Use extended external outlines to suggest separation without full lines',
      'Corners can be manipulated to adjust silhouette perception',
    ],
  },
  lineless: {
    name: 'Lineless',
    description: 'No outlines - shapes defined by colour contrast alone',
    rules: [
      'Rely entirely on value contrast between shapes',
      'Ensure adjacent colours have sufficient value difference',
      'Use careful colour selection to maintain readability',
      'Shadows and highlights define form instead of lines',
    ],
  },
} as const;

// ============================================
// Shading Techniques
// ============================================

export const SHADING_TECHNIQUES = {
  flat: {
    name: 'Flat',
    description: 'No shading - solid colours only',
    rules: [
      'Single colour per surface area',
      'Rely on colour choice for depth suggestion',
      'Clean, graphic appearance',
    ],
  },
  basic: {
    name: 'Basic Shading',
    description: 'Simple light/shadow with 2-3 values per colour',
    rules: [
      'Establish single consistent light source',
      'Use 2-3 values per base colour (base, shadow, highlight)',
      'Shadows opposite light source, highlights facing it',
      'AVOID pillow shading (light in centre, dark edges all around)',
    ],
  },
  detailed: {
    name: 'Detailed Shading',
    description: 'Advanced shading with hue shifting and dithering',
    rules: [
      'HUE SHIFT in shadows - shift toward blue/purple for cool lighting, orange/red for warm',
      'HUE SHIFT in highlights - shift toward yellow/white',
      'Use dithering for smooth gradients in limited palettes',
      'Consider ambient occlusion in crevices and contact points',
      'Rim lighting can add depth and separation from background',
    ],
  },
} as const;

// ============================================
// Size Guidelines
// ============================================

export const SIZE_GUIDELINES = {
  16: 'Icon/tiny - extremely minimal, silhouette only',
  32: 'Icon/tiny - minimal detail, strong silhouette',
  64: 'Small sprite - basic features, limited detail',
  128: 'Gameplay sprite - good detail, full character readable',
  256: 'Portrait/large - high detail, suitable for dialogue',
} as const;

// ============================================
// Build Complete Technique Prompt
// ============================================

/**
 * Builds comprehensive technique instructions for Gemini based on style parameters.
 * Includes Master Pixel Artist framing and explicit prohibitions.
 */
export function buildTechniquePrompt(
  outlineStyle: keyof typeof OUTLINE_TECHNIQUES,
  shadingStyle: keyof typeof SHADING_TECHNIQUES,
  size: number
): string {
  const outline = OUTLINE_TECHNIQUES[outlineStyle];
  const shading = SHADING_TECHNIQUES[shadingStyle];

  const sizeKey = Object.keys(SIZE_GUIDELINES)
    .map(Number)
    .sort((a, b) => b - a)
    .find((s) => size >= s) || 32;

  const sizeGuide = SIZE_GUIDELINES[sizeKey as keyof typeof SIZE_GUIDELINES];

  return `
PIXEL ART MASTER TECHNIQUE REQUIREMENTS:

CORE PHILOSOPHY:
- ${CORE_PHILOSOPHY.intentionality}
- ${CORE_PHILOSOPHY.limitedPalette}
- ${CORE_PHILOSOPHY.clarity}
- ${CORE_PHILOSOPHY.deliberateClusters}

AESTHETIC REQUIREMENTS:
- Hue-Shifting: ${AESTHETIC_DIRECTIVES.hueShifting.rule} - ${AESTHETIC_DIRECTIVES.hueShifting.detail}
- Line Art: ${AESTHETIC_DIRECTIVES.cleanLineArt.rule} - ${AESTHETIC_DIRECTIVES.cleanLineArt.detail}
- Light Source: ${AESTHETIC_DIRECTIVES.lightSource.rule}
- Cast Shadows: ${AESTHETIC_DIRECTIVES.castShadows.rule}

STRICT PROHIBITIONS:
${STRICT_PROHIBITIONS.map((p) => `- ${p}`).join('\n')}

OUTLINE STYLE (${outline.name}):
${outline.rules.map((r) => `- ${r}`).join('\n')}

SHADING STYLE (${shading.name}):
${shading.rules.map((r) => `- ${r}`).join('\n')}

SIZE CONTEXT (${size}px):
- ${sizeGuide}
`.trim();
}

/**
 * Returns the full Master Pixel Artist system instruction for Gemini.
 */
export function getSystemInstruction(): string {
  return PIXEL_ART_SYSTEM_INSTRUCTION;
}

/**
 * Returns prohibitions as a formatted string for inclusion in prompts.
 */
export function getProhibitionsPrompt(): string {
  return `STRICT PROHIBITIONS:\n${STRICT_PROHIBITIONS.map((p) => `- ${p}`).join('\n')}`;
}

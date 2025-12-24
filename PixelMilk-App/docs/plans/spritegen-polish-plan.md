# Sprite Generation Polish Plan

**Status:** Parked - Current system produces gorgeous, varied, artistic output
**Created:** 2024-12-24
**Context:** Red-teamed and decided to document rather than implement

---

## The Idea: Semantic Palette Mapping

Feed Gemini per-palette "colour theory" data from our JSON files:
- `roles.json` - outlines, shadows, highlights, midtones, accents
- `ramps.json` - hue-shifted colour progressions
- `shadows.json` - shadow colour recommendations

### Why It Could Be Good
- Explicit binding of hex codes to latent concepts (outline, shadow, highlight)
- Structure enforcement for readable silhouettes
- Volume consistency (hue-shifted shadows, not muddy blacks)
- "Giving the model a Colour Theory Degree"

### Implementation Sketch
```typescript
function generatePaletteGuide(paletteName: string): string {
  // Load roles.json, ramps.json for palette
  // Format into ~200 token guide:
  // OUTLINES: #X, #Y
  // SHADOWS: #A, #B
  // LIGHTEST: #Z
  // RAMPS: Reds: #1 -> #2 -> #3
}
```

---

## Red Team Concerns

1. **Token budget** - Could bloat system prompt, truncate other instructions
2. **Data completeness** - Not all 105 palettes may have complete data
3. **Style conflicts** - "Use X for outlines" vs Lineless style
4. **Over-constraint** - Too rigid = formulaic, loses creative accidents
5. **Micro palettes** - 2-7 colours have no meaningful ramps
6. **Gemini compliance** - Might ignore guide like it ignores "no swatches"
7. **Palette swatch bug** - More palette info might make swatch rendering worse

---

## What NOT To Include

**ditherpairs.json** - Risk of noise explosion. We fought hard for clean edges.
Telling Gemini "here are dither pairs" might trigger checkerboard patterns everywhere.

---

## Prerequisites Before Implementing

1. Fix the "palette swatches rendered in sprite" bug
2. Audit all 105 palettes for data completeness
3. A/B test to prove improvement over current output

---

## Why We Parked This

Current system produces:
- Gorgeous linework
- Varied output
- Unique and artistic sprites
- Clean transparency (per-palette chromaKey working)

**"Don't fix what ain't broke."**

Revisit if:
- Users report muddy/inverted colours
- Consistency issues across angles become a problem
- We want a "Pro Mode" with tighter control

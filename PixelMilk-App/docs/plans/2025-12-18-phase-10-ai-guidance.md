# Phase 10: AI Guidance System

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement Prompt Wand (prompt enhancement), Drawing Coach (real-time feedback), and contextual tooltips.

**Architecture:** AI guidance services using text models, integrated as optional helpers across all tabs.

**Prerequisites:** Phase 9 complete

**Key Reference:** `C:\Users\User\Desktop\PixelMilk\AI Guidance for Users.txt`

---

## Core Concepts

### Prompt Wand
Enhances user prompts with pixel-art-specific details:

**Before:** "a tree"
**After:** "A 32x32 pixel art deciduous tree, brown trunk with 2-3 shading levels, green foliage cluster using dithering, selective outline on trunk, transparent background, top-down RPG style"

### Drawing Coach
Analyses user's pixel work and provides suggestions:
- Outline consistency
- Colour count optimisation
- Shading direction
- Pixel art anti-patterns (jaggies, orphan pixels)

### Contextual Tooltips
Brief educational hints appearing on hover:
- Explain pixel art terms
- Show examples
- Link to learning resources

---

## Tasks Overview

### Task 10.1: Create Prompt Enhancement Service
```typescript
// src/services/gemini/guidance.ts

export async function enhancePrompt(
  rawPrompt: string,
  context: {
    assetType: AssetType;
    canvasSize: number;
    styleParams: StyleParameters;
  }
): Promise<{
  enhancedPrompt: string;
  explanation: string;
  suggestions: string[];
}>
```

Uses text model (gemini-3-flash-preview) with prompt:
```
You are a pixel art prompt optimizer. Enhance this prompt with specific details that help AI generate better pixel art.

RAW PROMPT: ${rawPrompt}
ASSET TYPE: ${assetType}
CANVAS: ${canvasSize}x${canvasSize}
STYLE: ${styleParams.outlineStyle}, ${styleParams.shadingStyle} shading

Add specific details about:
- Colour palette guidance
- Outline treatment
- Shading approach
- Composition for the canvas size
- Pixel art best practices

Return JSON with:
- enhancedPrompt: The improved prompt
- explanation: Why these changes help
- suggestions: Additional tips as array
```

### Task 10.2: Create Drawing Analysis Service
```typescript
export async function analyseDrawing(
  sprite: SpriteData
): Promise<{
  feedback: FeedbackItem[];
  score: number;
  improvements: string[];
}>

interface FeedbackItem {
  type: 'outline' | 'shading' | 'palette' | 'composition' | 'antipattern';
  severity: 'info' | 'warning' | 'suggestion';
  message: string;
  affectedPixels?: { x: number; y: number }[];
}
```

Analysis checks:
- **Outline consistency**: Are outlines 1px throughout?
- **Orphan pixels**: Single pixels not connected to anything
- **Jaggies**: Staircase patterns that could be smoothed
- **Banding**: Parallel shading lines that look artificial
- **Pillow shading**: Shading that follows shape outline too closely
- **Colour count**: Is palette efficiently used?

### Task 10.3: Create Prompt Wand Component
```tsx
interface PromptWandProps {
  rawPrompt: string;
  assetType: AssetType;
  styleParams: StyleParameters;
  onAccept: (enhancedPrompt: string) => void;
}

export function PromptWand({ rawPrompt, assetType, styleParams, onAccept }: PromptWandProps) {
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [result, setResult] = useState<EnhancedPromptResult | null>(null);
  
  const handleEnhance = async () => {
    setIsEnhancing(true);
    const enhanced = await enhancePrompt(rawPrompt, { assetType, styleParams });
    setResult(enhanced);
    setIsEnhancing(false);
  };
  
  return (
    <div>
      <Button variant="ghost" size="sm" onClick={handleEnhance} disabled={!rawPrompt}>
        <Wand2 size={16} /> Enhance
      </Button>
      
      {result && (
        <Panel title="Enhanced Prompt">
          <p>{result.enhancedPrompt}</p>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
            {result.explanation}
          </p>
          <Button size="sm" onClick={() => onAccept(result.enhancedPrompt)}>
            Use This
          </Button>
        </Panel>
      )}
    </div>
  );
}
```

### Task 10.4: Create Drawing Coach Component
```tsx
interface DrawingCoachProps {
  sprite: SpriteData | null;
  enabled: boolean;
}

export function DrawingCoach({ sprite, enabled }: DrawingCoachProps) {
  const [analysis, setAnalysis] = useState<DrawingAnalysis | null>(null);
  const [isAnalysing, setIsAnalysing] = useState(false);
  
  const handleAnalyse = async () => {
    if (!sprite) return;
    setIsAnalysing(true);
    const result = await analyseDrawing(sprite);
    setAnalysis(result);
    setIsAnalysing(false);
  };
  
  if (!enabled || !sprite) return null;
  
  return (
    <Panel title="Drawing Coach">
      <Button size="sm" onClick={handleAnalyse} disabled={isAnalysing}>
        {isAnalysing ? 'Analysing...' : 'Get Feedback'}
      </Button>
      
      {analysis && (
        <div style={{ marginTop: 'var(--space-3)' }}>
          <p>Score: {analysis.score}/100</p>
          
          {analysis.feedback.map((item, i) => (
            <div key={i} style={{ 
              padding: 'var(--space-2)',
              borderLeft: `3px solid ${item.severity === 'warning' ? 'var(--color-accent-red)' : 'var(--color-text-secondary)'}`,
              marginTop: 'var(--space-2)',
            }}>
              <strong>{item.type}</strong>: {item.message}
            </div>
          ))}
          
          {analysis.improvements.length > 0 && (
            <div style={{ marginTop: 'var(--space-3)' }}>
              <strong>Suggestions:</strong>
              <ul>
                {analysis.improvements.map((imp, i) => (
                  <li key={i}>{imp}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Panel>
  );
}
```

### Task 10.5: Create Tooltip Content Database
```typescript
// src/data/tooltips.ts

export const TOOLTIPS: Record<string, string> = {
  'outline-black': 'Pure black (#000000) outlines create strong contrast. Classic pixel art style used in many retro games.',
  
  'outline-colored': 'Outlines use darker versions of adjacent colours. Creates softer, more modern look.',
  
  'outline-selective': 'Outlines only where needed for readability. Interior details use colour boundaries instead of lines.',
  
  'outline-lineless': 'No outlines at all. Shapes defined purely by colour contrast. Harder to read at small sizes.',
  
  'shading-flat': 'Single colour per element. Bold, iconic look. Best for very small sprites (8x8, 16x16).',
  
  'shading-basic': '2-3 tones per element (base, shadow, highlight). Good balance of detail and clarity.',
  
  'shading-detailed': '4+ tones with smooth gradients. More realistic but can look muddy at small sizes.',
  
  'palette-nes': 'Nintendo Entertainment System palette. 54 colours with characteristic muted tones.',
  
  'palette-gameboy': 'Original Game Boy palette. 4 shades of green. Extreme limitation breeds creativity.',
  
  'palette-pico8': 'PICO-8 fantasy console palette. 16 carefully chosen colours. Very popular for modern pixel art.',
  
  'seamless': 'Tile edges match perfectly when placed adjacent. Essential for repeating textures.',
  
  'dithering': 'Using patterns of two colours to simulate a third. Increases apparent colour depth.',
  
  'anti-aliasing': 'Adding intermediate colour pixels to smooth jagged edges. Use sparingly in pixel art.',
  
  'orphan-pixel': 'A single pixel not connected to others of same colour. Usually considered a mistake.',
  
  'jaggies': 'Staircase patterns on diagonal lines. Can be smoothed with careful pixel placement.',
  
  'pillow-shading': 'Shading that follows the outline shape. Looks unnatural - prefer directional light.',
};
```

### Task 10.6: Create Contextual Tooltip Component
```tsx
interface ContextualTooltipProps {
  term: string;
  children: React.ReactNode;
}

export function ContextualTooltip({ term, children }: ContextualTooltipProps) {
  const content = TOOLTIPS[term];
  
  if (!content) {
    return <>{children}</>;
  }
  
  return (
    <Tooltip content={content}>
      <span style={{ 
        borderBottom: '1px dotted var(--color-text-muted)',
        cursor: 'help',
      }}>
        {children}
      </span>
    </Tooltip>
  );
}
```

### Task 10.7: Integrate Guidance into Existing Tabs

Update CharacterForm, TileForm, ObjectForm to include:
- PromptWand button next to description input
- DrawingCoach panel (collapsible)
- ContextualTooltips on style options

---

## Guidance Settings

Add to app settings:
```typescript
interface GuidanceSettings {
  promptWandEnabled: boolean;
  drawingCoachEnabled: boolean;
  tooltipsEnabled: boolean;
  autoAnalyseOnGenerate: boolean;
}
```

---

## Phase 10 Complete

Deliverables:
- ✅ Prompt enhancement service
- ✅ Drawing analysis service
- ✅ Prompt Wand component
- ✅ Drawing Coach component
- ✅ Tooltip content database
- ✅ Contextual tooltip component
- ✅ Integration across all tabs
- ✅ Guidance settings

---

## Project Complete! 🎉

All 10 phases deliver a complete pixel art creation suite:

1. **Foundation** - Project setup, services, app shell
2. **Character Tab** - Text→sprite with identity system
3. **Canvas & Tools** - Pixel editing, hotspot AI edits
4. **Sprite Rotations** - 8-direction sheets with 3D reference
5. **Tile Tab** - Seamless tiles, variants, autotile
6. **Object Tab** - Props with recontextualisation
7. **Texture Tab** - Materials and patterns
8. **Compose Tab** - Scene assembly with AI compositing
9. **Library Tab** - Asset management and export
10. **AI Guidance** - Prompt Wand, Drawing Coach, tooltips

Future enhancements (post-MVP):
- Audio integration (ElevenLabs SFX, Lyria music)
- Backend with fine-tuned models
- User accounts and cloud storage
- Community features

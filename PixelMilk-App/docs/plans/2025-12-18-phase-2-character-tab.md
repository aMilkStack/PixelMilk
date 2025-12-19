# Phase 2: Character Tab MVP

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the core character sprite generation workflow - from text description to generated sprite with identity document.

**Architecture:** Character tab with description input, style controls, generation pipeline, and sprite display. Identity document ensures consistency for future operations.

**Tech Stack:** React components, Gemini structured output, canvas rendering

**Prerequisites:** Phase 1 complete (foundation, services, app shell)

---

## Task 2.1: Create Character Store

**Files:**
- Create: `src/stores/characterStore.ts`
- Update: `src/stores/index.ts`

**Step 1: Create src/stores/characterStore.ts**

```typescript
import { create } from 'zustand';
import type { CharacterIdentity, SpriteData, StyleParameters, Direction } from '@/types';

interface CharacterState {
  // Current working character
  currentIdentity: CharacterIdentity | null;
  currentSprites: Map<Direction, SpriteData>;
  lockedPalette: string[] | null;
  
  // Form state
  description: string;
  styleParams: StyleParameters;
  
  // Actions
  setDescription: (desc: string) => void;
  setStyleParams: (params: Partial<StyleParameters>) => void;
  setIdentity: (identity: CharacterIdentity) => void;
  addSprite: (direction: Direction, sprite: SpriteData) => void;
  lockPalette: (palette: string[]) => void;
  clearCharacter: () => void;
}

const defaultStyleParams: StyleParameters = {
  outlineStyle: 'black',
  shadingStyle: 'basic',
  detailLevel: 'medium',
  canvasSize: 32,
  paletteMode: 'auto',
  viewType: 'standard',
};

export const useCharacterStore = create<CharacterState>((set) => ({
  currentIdentity: null,
  currentSprites: new Map(),
  lockedPalette: null,
  description: '',
  styleParams: defaultStyleParams,
  
  setDescription: (description) => set({ description }),
  
  setStyleParams: (params) => set((state) => ({
    styleParams: { ...state.styleParams, ...params },
  })),
  
  setIdentity: (identity) => set({ currentIdentity: identity }),
  
  addSprite: (direction, sprite) => set((state) => {
    const newSprites = new Map(state.currentSprites);
    newSprites.set(direction, sprite);
    return { currentSprites: newSprites };
  }),
  
  lockPalette: (palette) => set({ lockedPalette: palette }),
  
  clearCharacter: () => set({
    currentIdentity: null,
    currentSprites: new Map(),
    lockedPalette: null,
    description: '',
  }),
}));
```

**Step 2: Update src/stores/index.ts**

```typescript
export { useAppStore } from './appStore';
export { useCanvasStore } from './canvasStore';
export { useCharacterStore } from './characterStore';
```

**Step 3: Commit**

```bash
git add .
git commit -m "feat(character): add character store"
```

---

## Task 2.2: Create Character Generation Service

**Files:**
- Create: `src/services/gemini/character.ts`
- Update: `src/services/gemini/index.ts`

**Step 1: Create src/services/gemini/character.ts**

```typescript
import { getClient } from './client';
import { getConfigForTask } from './modelRouter';
import { characterIdentitySchema, pixelDataSchema } from './schemas';
import type { CharacterIdentity, SpriteData, StyleParameters, QualityMode } from '@/types';

const IDENTITY_SYSTEM_PROMPT = `You are an expert technical game artist. Your task is to analyze a character description and create a structured "Character Identity Document" for a pixel art generation pipeline.

Be specific about visual details. Infer reasonable defaults for anything not specified.
For angleNotes, describe what would be visible from each direction (e.g., "cape flows behind" for North view).`;

const SPRITE_SYSTEM_PROMPT = `You are a pixel art data generator. Output ONLY valid JSON matching the schema.

CRITICAL RULES:
1. pixels array must be EXACTLY width * height items
2. Use "transparent" for background pixels
3. Row-major order: top-left to bottom-right
4. Every colour in pixels must exist in palette
5. Respect the style parameters exactly`;

export async function generateCharacterIdentity(
  description: string,
  styleParams: StyleParameters
): Promise<CharacterIdentity> {
  const client = getClient();
  const config = getConfigForTask('text-analysis');
  
  const prompt = `
Character Description: ${description}

Style Parameters:
- Canvas Size: ${styleParams.canvasSize}x${styleParams.canvasSize}
- Outline Style: ${styleParams.outlineStyle}
- Shading Style: ${styleParams.shadingStyle}
- Detail Level: ${styleParams.detailLevel}
- View Type: ${styleParams.viewType}

Generate a Character Identity Document JSON.`;

  const response = await client.models.generateContent({
    model: config.model,
    contents: prompt,
    config: {
      systemInstruction: IDENTITY_SYSTEM_PROMPT,
      temperature: config.temperature,
      responseMimeType: 'application/json',
      responseSchema: characterIdentitySchema,
    },
  });

  const text = response.text;
  if (!text) throw new Error('No response from model');
  
  const identity = JSON.parse(text) as CharacterIdentity;
  identity.id = `char_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  identity.styleParameters = styleParams;
  identity.createdAt = Date.now();
  identity.updatedAt = Date.now();
  
  return identity;
}

export async function generateSprite(
  identity: CharacterIdentity,
  direction: 'S' | 'N' | 'E' | 'W' = 'S',
  quality: QualityMode = 'draft',
  lockedPalette?: string[]
): Promise<SpriteData> {
  const client = getClient();
  const config = getConfigForTask(quality === 'final' ? 'sprite-final' : 'sprite-draft', quality);
  const size = identity.styleParameters.canvasSize;
  
  let paletteInstruction = '';
  if (lockedPalette) {
    paletteInstruction = `LOCKED PALETTE - Use ONLY these colours: ${JSON.stringify(lockedPalette)}`;
  } else {
    paletteInstruction = `Select appropriate colours. Include highlight, midtone, and shadow for each major element. Base colours: ${JSON.stringify(identity.colourPalette)}`;
  }

  const directionDescriptions: Record<string, string> = {
    S: 'SOUTH (Front View) - Character facing the viewer',
    N: 'NORTH (Back View) - Character facing away',
    E: 'EAST (Right Profile) - Character facing right',
    W: 'WEST (Left Profile) - Character facing left',
  };

  const prompt = `
CHARACTER: ${identity.name}
DESCRIPTION: ${identity.description}
PHYSICAL: ${identity.physicalDescription.bodyType}, ${identity.physicalDescription.heightStyle}
DISTINCTIVE FEATURES: ${identity.distinctiveFeatures.join(', ')}

CANVAS: ${size}x${size} pixels (${size * size} total pixels)
VIEW: ${directionDescriptions[direction]}
${identity.angleNotes[direction] ? `ANGLE NOTES: ${identity.angleNotes[direction]}` : ''}

STYLE:
- Outline: ${identity.styleParameters.outlineStyle}
- Shading: ${identity.styleParameters.shadingStyle}
- Detail: ${identity.styleParameters.detailLevel}

${paletteInstruction}

Generate pixel data JSON with:
- name: "${identity.name}"
- width: ${size}
- height: ${size}
- palette: Array of hex colours used
- pixels: Array of exactly ${size * size} values (hex codes or "transparent")
`;

  const response = await client.models.generateContent({
    model: config.model,
    contents: prompt,
    config: {
      systemInstruction: SPRITE_SYSTEM_PROMPT,
      temperature: config.temperature,
      responseMimeType: 'application/json',
      responseSchema: pixelDataSchema,
      ...(config.thinkingLevel && {
        thinkingConfig: { thinkingLevel: config.thinkingLevel },
      }),
    },
  });

  const text = response.text;
  if (!text) throw new Error('No response from model');
  
  const data = JSON.parse(text);
  
  // Validate pixel count
  const expectedPixels = size * size;
  if (data.pixels.length !== expectedPixels) {
    throw new Error(`Invalid pixel count: got ${data.pixels.length}, expected ${expectedPixels}`);
  }
  
  const sprite: SpriteData = {
    id: `sprite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: data.name,
    width: size,
    height: size,
    palette: data.palette,
    pixels: data.pixels,
    direction,
    createdAt: Date.now(),
  };
  
  return sprite;
}
```

**Step 2: Update src/services/gemini/index.ts**

```typescript
export { initializeClient, getClient, isClientInitialized } from './client';
export { generateContent, generateStructuredContent, generateImage, editImage } from './client';
export { getModelForTask, getConfigForTask } from './modelRouter';
export { generateCharacterIdentity, generateSprite } from './character';
export * from './schemas';
```

**Step 3: Commit**

```bash
git add .
git commit -m "feat(character): add character generation service"
```

---

## Task 2.3: Create Sprite Display Component

**Files:**
- Create: `src/components/canvas/SpriteCanvas.tsx`
- Create: `src/components/canvas/index.ts`

**Step 1: Create src/components/canvas/SpriteCanvas.tsx**

```tsx
import { useRef, useEffect, useCallback } from 'react';
import type { SpriteData } from '@/types';
import { useCanvasStore } from '@/stores';

interface SpriteCanvasProps {
  sprite: SpriteData | null;
  showGrid?: boolean;
  interactive?: boolean;
  onPixelClick?: (x: number, y: number) => void;
}

export function SpriteCanvas({ 
  sprite, 
  showGrid = true, 
  interactive = false,
  onPixelClick 
}: SpriteCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { zoom, panX, panY } = useCanvasStore();
  
  const pixelSize = 16 * zoom; // Base pixel size * zoom
  
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.fillStyle = '#021a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if (!sprite) {
      // Draw placeholder
      ctx.fillStyle = '#4a7a6e';
      ctx.font = '16px VT323';
      ctx.textAlign = 'center';
      ctx.fillText('> No sprite loaded', canvas.width / 2, canvas.height / 2);
      return;
    }
    
    const { width, height, pixels } = sprite;
    const offsetX = (canvas.width - width * pixelSize) / 2 + panX;
    const offsetY = (canvas.height - height * pixelSize) / 2 + panY;
    
    // Draw checkerboard background for transparency
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const isLight = (x + y) % 2 === 0;
        ctx.fillStyle = isLight ? '#043636' : '#032828';
        ctx.fillRect(
          offsetX + x * pixelSize,
          offsetY + y * pixelSize,
          pixelSize,
          pixelSize
        );
      }
    }
    
    // Draw pixels
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const pixelIndex = y * width + x;
        const colour = pixels[pixelIndex];
        
        if (colour && colour !== 'transparent') {
          ctx.fillStyle = colour;
          ctx.fillRect(
            offsetX + x * pixelSize,
            offsetY + y * pixelSize,
            pixelSize,
            pixelSize
          );
        }
      }
    }
    
    // Draw grid
    if (showGrid && zoom >= 2) {
      ctx.strokeStyle = 'rgba(139, 208, 186, 0.2)';
      ctx.lineWidth = 1;
      
      for (let x = 0; x <= width; x++) {
        ctx.beginPath();
        ctx.moveTo(offsetX + x * pixelSize, offsetY);
        ctx.lineTo(offsetX + x * pixelSize, offsetY + height * pixelSize);
        ctx.stroke();
      }
      
      for (let y = 0; y <= height; y++) {
        ctx.beginPath();
        ctx.moveTo(offsetX, offsetY + y * pixelSize);
        ctx.lineTo(offsetX + width * pixelSize, offsetY + y * pixelSize);
        ctx.stroke();
      }
    }
  }, [sprite, zoom, panX, panY, pixelSize, showGrid]);
  
  useEffect(() => {
    draw();
  }, [draw]);
  
  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!interactive || !sprite || !onPixelClick) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    const offsetX = (canvas.width - sprite.width * pixelSize) / 2 + panX;
    const offsetY = (canvas.height - sprite.height * pixelSize) / 2 + panY;
    
    const pixelX = Math.floor((clickX - offsetX) / pixelSize);
    const pixelY = Math.floor((clickY - offsetY) / pixelSize);
    
    if (pixelX >= 0 && pixelX < sprite.width && pixelY >= 0 && pixelY < sprite.height) {
      onPixelClick(pixelX, pixelY);
    }
  };
  
  const containerStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--color-bg-secondary)',
    border: '1px solid var(--color-border-muted)',
  };
  
  return (
    <div style={containerStyle}>
      <canvas
        ref={canvasRef}
        width={512}
        height={512}
        onClick={handleClick}
        style={{ 
          cursor: interactive ? 'crosshair' : 'default',
          imageRendering: 'pixelated',
        }}
      />
    </div>
  );
}
```

**Step 2: Create src/components/canvas/index.ts**

```typescript
export { SpriteCanvas } from './SpriteCanvas';
```

**Step 3: Commit**

```bash
git add .
git commit -m "feat(canvas): add sprite canvas component"
```

---

## Task 2.4: Create Style Controls Component

**Files:**
- Create: `src/components/character/StyleControls.tsx`

**Step 1: Create src/components/character/StyleControls.tsx**

```tsx
import { Select, Panel } from '@/components/shared';
import { useCharacterStore } from '@/stores';

export function StyleControls() {
  const { styleParams, setStyleParams } = useCharacterStore();
  
  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 'var(--space-3)',
  };
  
  return (
    <Panel title="Style Parameters">
      <div style={gridStyle}>
        <Select
          label="Canvas Size"
          value={String(styleParams.canvasSize)}
          onChange={(e) => setStyleParams({ canvasSize: Number(e.target.value) as 16 | 32 | 64 | 128 })}
          options={[
            { value: '16', label: '16×16' },
            { value: '32', label: '32×32' },
            { value: '64', label: '64×64' },
            { value: '128', label: '128×128' },
          ]}
        />
        
        <Select
          label="Outline Style"
          value={styleParams.outlineStyle}
          onChange={(e) => setStyleParams({ outlineStyle: e.target.value as any })}
          options={[
            { value: 'black', label: 'Black outline' },
            { value: 'colored', label: 'Coloured outline' },
            { value: 'selective', label: 'Selective' },
            { value: 'lineless', label: 'No outline' },
          ]}
        />
        
        <Select
          label="Shading"
          value={styleParams.shadingStyle}
          onChange={(e) => setStyleParams({ shadingStyle: e.target.value as any })}
          options={[
            { value: 'flat', label: 'Flat (no shading)' },
            { value: 'basic', label: 'Basic (2-3 tones)' },
            { value: 'detailed', label: 'Detailed (4+ tones)' },
          ]}
        />
        
        <Select
          label="Detail Level"
          value={styleParams.detailLevel}
          onChange={(e) => setStyleParams({ detailLevel: e.target.value as any })}
          options={[
            { value: 'low', label: 'Low (iconic)' },
            { value: 'medium', label: 'Medium' },
            { value: 'high', label: 'High (intricate)' },
          ]}
        />
        
        <Select
          label="Palette"
          value={styleParams.paletteMode}
          onChange={(e) => setStyleParams({ paletteMode: e.target.value as any })}
          options={[
            { value: 'auto', label: 'Auto' },
            { value: 'nes', label: 'NES (54 colours)' },
            { value: 'gameboy', label: 'Game Boy (4 colours)' },
            { value: 'pico8', label: 'PICO-8 (16 colours)' },
          ]}
        />
        
        <Select
          label="View Type"
          value={styleParams.viewType}
          onChange={(e) => setStyleParams({ viewType: e.target.value as any })}
          options={[
            { value: 'standard', label: 'Standard (top-down)' },
            { value: 'isometric', label: 'Isometric' },
          ]}
        />
      </div>
    </Panel>
  );
}
```

**Step 2: Commit**

```bash
git add .
git commit -m "feat(character): add style controls component"
```

---

## Task 2.5: Create Character Form Component

**Files:**
- Create: `src/components/character/CharacterForm.tsx`

**Step 1: Create src/components/character/CharacterForm.tsx**

```tsx
import { useState } from 'react';
import { Button, Input, Panel } from '@/components/shared';
import { useCharacterStore, useAppStore } from '@/stores';
import { generateCharacterIdentity, generateSprite } from '@/services/gemini';
import { Sparkles, Loader2 } from 'lucide-react';

export function CharacterForm() {
  const { description, setDescription, styleParams, setIdentity, addSprite, lockPalette } = useCharacterStore();
  const { setGenerationStatus, resetGenerationStatus } = useAppStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  
  const handleGenerate = async () => {
    if (!description.trim()) {
      setError('Please enter a character description');
      return;
    }
    
    setIsGenerating(true);
    setError('');
    
    try {
      // Step 1: Generate identity
      setGenerationStatus({ isGenerating: true, progress: 20, stage: 'Creating identity...' });
      const identity = await generateCharacterIdentity(description, styleParams);
      setIdentity(identity);
      
      // Step 2: Generate south-facing sprite
      setGenerationStatus({ progress: 60, stage: 'Generating sprite...' });
      const sprite = await generateSprite(identity, 'S', 'draft');
      addSprite('S', sprite);
      
      // Step 3: Lock palette
      lockPalette(sprite.palette);
      
      setGenerationStatus({ progress: 100, stage: 'Complete!' });
      setTimeout(resetGenerationStatus, 1000);
      
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Generation failed';
      setError(message);
      setGenerationStatus({ error: message });
    } finally {
      setIsGenerating(false);
    }
  };
  
  const textareaStyle: React.CSSProperties = {
    width: '100%',
    minHeight: '120px',
    padding: 'var(--space-3)',
    backgroundColor: 'var(--color-bg-secondary)',
    border: '1px solid var(--color-border-muted)',
    color: 'var(--color-text-primary)',
    fontFamily: 'var(--font-mono)',
    fontSize: 'var(--font-size-base)',
    resize: 'vertical',
  };
  
  return (
    <Panel title="Character Description">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <label style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
          > Describe your character
        </label>
        
        <textarea
          style={textareaStyle}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="A brave knight with silver armor and a flowing red cape. She carries a glowing blue sword and has short dark hair."
          disabled={isGenerating}
        />
        
        {error && (
          <p style={{ color: 'var(--color-accent-red)', fontSize: 'var(--font-size-sm)' }}>
            ! {error}
          </p>
        )}
        
        <Button onClick={handleGenerate} disabled={isGenerating} style={{ alignSelf: 'flex-start' }}>
          {isGenerating ? (
            <>
              <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
              Generating...
            </>
          ) : (
            <>
              <Sparkles size={16} />
              Generate Character
            </>
          )}
        </Button>
      </div>
      
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </Panel>
  );
}
```

**Step 2: Commit**

```bash
git add .
git commit -m "feat(character): add character form component"
```

---

## Task 2.6: Create Identity Card Component

**Files:**
- Create: `src/components/character/IdentityCard.tsx`

**Step 1: Create src/components/character/IdentityCard.tsx**

```tsx
import { Panel } from '@/components/shared';
import { useCharacterStore } from '@/stores';

export function IdentityCard() {
  const { currentIdentity, lockedPalette } = useCharacterStore();
  
  if (!currentIdentity) {
    return (
      <Panel title="Character Identity">
        <p style={{ color: 'var(--color-text-muted)' }}>
          > No character generated yet
        </p>
      </Panel>
    );
  }
  
  const { name, physicalDescription, distinctiveFeatures, colourPalette } = currentIdentity;
  
  const swatchStyle = (colour: string): React.CSSProperties => ({
    width: '24px',
    height: '24px',
    backgroundColor: colour,
    border: '1px solid var(--color-border)',
    display: 'inline-block',
  });
  
  const labelStyle: React.CSSProperties = {
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-text-secondary)',
  };
  
  const valueStyle: React.CSSProperties = {
    fontSize: 'var(--font-size-base)',
    color: 'var(--color-text-primary)',
  };
  
  const rowStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-1)',
    marginBottom: 'var(--space-3)',
  };
  
  return (
    <Panel title="Character Identity">
      <div style={rowStyle}>
        <span style={labelStyle}>> Name</span>
        <span style={valueStyle}>{name}</span>
      </div>
      
      <div style={rowStyle}>
        <span style={labelStyle}>> Physical</span>
        <span style={valueStyle}>
          {physicalDescription.bodyType}, {physicalDescription.heightStyle}
        </span>
      </div>
      
      <div style={rowStyle}>
        <span style={labelStyle}>> Distinctive Features</span>
        <span style={valueStyle}>{distinctiveFeatures.join(', ')}</span>
      </div>
      
      <div style={rowStyle}>
        <span style={labelStyle}>> Locked Palette</span>
        <div style={{ display: 'flex', gap: 'var(--space-1)', flexWrap: 'wrap', marginTop: 'var(--space-1)' }}>
          {lockedPalette?.map((colour, i) => (
            <div key={i} style={swatchStyle(colour)} title={colour} />
          ))}
        </div>
      </div>
    </Panel>
  );
}
```

**Step 2: Commit**

```bash
git add .
git commit -m "feat(character): add identity card component"
```

---

## Task 2.7: Create Palette Display Component

**Files:**
- Create: `src/components/character/PaletteDisplay.tsx`

**Step 1: Create src/components/character/PaletteDisplay.tsx**

```tsx
import { Panel } from '@/components/shared';
import { useCharacterStore, useCanvasStore } from '@/stores';
import { Lock } from 'lucide-react';

export function PaletteDisplay() {
  const { lockedPalette } = useCharacterStore();
  const { selectedColor, setSelectedColor } = useCanvasStore();
  
  if (!lockedPalette || lockedPalette.length === 0) {
    return null;
  }
  
  const getSwatchStyle = (colour: string): React.CSSProperties => ({
    width: '32px',
    height: '32px',
    backgroundColor: colour,
    border: selectedColor === colour 
      ? '2px solid var(--color-text-primary)' 
      : '1px solid var(--color-border-muted)',
    cursor: 'pointer',
    transition: 'var(--transition-fast)',
  });
  
  return (
    <Panel>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
        <Lock size={14} />
        <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
          Locked Palette ({lockedPalette.length} colours)
        </span>
      </div>
      
      <div style={{ display: 'flex', gap: 'var(--space-1)', flexWrap: 'wrap' }}>
        {lockedPalette.map((colour, i) => (
          <button
            key={i}
            style={getSwatchStyle(colour)}
            onClick={() => setSelectedColor(colour)}
            title={colour}
          />
        ))}
      </div>
    </Panel>
  );
}
```

**Step 2: Commit**

```bash
git add .
git commit -m "feat(character): add palette display component"
```

---

## Task 2.8: Create Character Tab Layout

**Files:**
- Create: `src/components/character/CharacterTab.tsx`
- Create: `src/components/character/index.ts`

**Step 1: Create src/components/character/CharacterTab.tsx**

```tsx
import { CharacterForm } from './CharacterForm';
import { StyleControls } from './StyleControls';
import { IdentityCard } from './IdentityCard';
import { PaletteDisplay } from './PaletteDisplay';
import { SpriteCanvas } from '@/components/canvas';
import { useCharacterStore, useAppStore } from '@/stores';
import { Panel } from '@/components/shared';

export function CharacterTab() {
  const { currentSprites } = useCharacterStore();
  const { generationStatus } = useAppStore();
  
  const southSprite = currentSprites.get('S') ?? null;
  
  const containerStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '350px 1fr 280px',
    gap: 'var(--space-4)',
    height: '100%',
    padding: 'var(--space-4)',
    overflow: 'hidden',
  };
  
  const leftPanelStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-4)',
    overflowY: 'auto',
  };
  
  const centerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-4)',
    minHeight: 0,
  };
  
  const canvasContainerStyle: React.CSSProperties = {
    flex: 1,
    minHeight: 0,
  };
  
  const rightPanelStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-4)',
    overflowY: 'auto',
  };
  
  return (
    <div style={containerStyle}>
      {/* Left Panel - Input */}
      <div style={leftPanelStyle}>
        <CharacterForm />
        <StyleControls />
      </div>
      
      {/* Center - Canvas */}
      <div style={centerStyle}>
        {generationStatus.isGenerating && (
          <Panel>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <div style={{ 
                width: '100%', 
                height: '8px', 
                backgroundColor: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border-muted)',
              }}>
                <div style={{ 
                  width: `${generationStatus.progress}%`, 
                  height: '100%', 
                  backgroundColor: 'var(--color-text-primary)',
                  transition: 'width 0.3s ease',
                }} />
              </div>
              <span style={{ fontSize: 'var(--font-size-sm)', whiteSpace: 'nowrap' }}>
                {generationStatus.stage}
              </span>
            </div>
          </Panel>
        )}
        
        <div style={canvasContainerStyle}>
          <SpriteCanvas sprite={southSprite} showGrid={true} />
        </div>
        
        <PaletteDisplay />
      </div>
      
      {/* Right Panel - Info */}
      <div style={rightPanelStyle}>
        <IdentityCard />
      </div>
    </div>
  );
}
```

**Step 2: Create src/components/character/index.ts**

```typescript
export { CharacterTab } from './CharacterTab';
export { CharacterForm } from './CharacterForm';
export { StyleControls } from './StyleControls';
export { IdentityCard } from './IdentityCard';
export { PaletteDisplay } from './PaletteDisplay';
```

**Step 3: Commit**

```bash
git add .
git commit -m "feat(character): add character tab layout"
```

---

## Task 2.9: Wire Up Character Tab to App

**Files:**
- Update: `src/App.tsx`

**Step 1: Update src/App.tsx**

```tsx
import { AppShell } from '@/components/layout';
import { CharacterTab } from '@/components/character';
import { useAppStore } from '@/stores';

function TabContent() {
  const { activeTab } = useAppStore();
  
  const placeholderStyle: React.CSSProperties = {
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    gap: 'var(--space-4)',
  };

  switch (activeTab) {
    case 'character':
      return <CharacterTab />;
    
    case 'tile':
    case 'object':
    case 'texture':
    case 'compose':
    case 'library':
      return (
        <div style={placeholderStyle}>
          <h2 style={{ fontFamily: 'var(--font-display)' }}>
            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Tab
          </h2>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            > Coming in a future phase...
          </p>
        </div>
      );
    
    default:
      return null;
  }
}

export default function App() {
  return (
    <AppShell>
      <TabContent />
    </AppShell>
  );
}
```

**Step 2: Run and verify**

Run: `npm run dev`

Expected:
- Character tab shows three-column layout
- Can enter description and adjust style params
- Generate button triggers API call
- Sprite displays in center canvas
- Identity and palette show in right panel

**Step 3: Commit**

```bash
git add .
git commit -m "feat(character): wire up character tab to app"
```

---

## Phase 2 Complete

At this point you have:
- ✅ Character store with description, identity, sprites, palette
- ✅ Character generation service (identity + sprite)
- ✅ Sprite canvas with zoom-aware rendering
- ✅ Style controls panel
- ✅ Character description form with generation
- ✅ Identity card display
- ✅ Locked palette display
- ✅ Full Character Tab layout wired to app

**Next Phase:** Canvas editing tools, zoom controls, hotspot editing

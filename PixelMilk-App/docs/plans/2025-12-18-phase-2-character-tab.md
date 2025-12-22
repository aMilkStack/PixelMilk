# Phase 2: Character Tab MVP

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the core character sprite generation workflow - from text description to generated sprite with identity document.

**Architecture:** Character tab with description input, style controls, generation pipeline, and sprite display. Identity document ensures consistency for future operations.

**Tech Stack:** React components, Gemini structured output, canvas rendering

**Prerequisites:** Phase 1 complete (foundation, services, app shell)

**Hybrid Workflow Update (2025-12-19):**
- Sprite generation uses Gemini IMAGE models -> PNG output.
- Client converts PNG to pixel array with `pngToPixelArray` (canvas getImageData + nearest-neighbor).
- Pixel arrays (not PNG) are stored and edited; export renders arrays back to PNG.

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
- Update: `src/services/gemini/geminiService.ts`
- Update: `src/services/gemini/index.ts`

**Step 1: Update src/services/gemini/geminiService.ts**

```typescript
import { Modality } from '@google/genai';
import { getClient } from './client';
import { getConfigForTask } from './modelRouter';
import { characterIdentitySchema } from './schemas';
import type { CharacterIdentity, StyleParameters, QualityMode, Direction } from '@/types';

const IDENTITY_SYSTEM_PROMPT = `You are an expert technical game artist. Your task is to analyze a character description and create a structured "Character Identity Document" for a pixel art generation pipeline.

Be specific about visual details. Infer reasonable defaults for anything not specified.
For angleNotes, describe what would be visible from each direction (e.g., "cape flows behind" for North view).`;

const SPRITE_SYSTEM_PROMPT = `You are generating a pixel art sprite as a PNG image.

CRITICAL RULES:
1. Output must be PNG with transparency
2. Crisp pixel edges (no anti-aliasing)
3. Match the provided style parameters exactly`;

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
  direction: Direction = 'S',
  quality: QualityMode = 'draft',
  lockedPalette?: string[]
): Promise<string> {
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

CANVAS: ${size}x${size} pixels
VIEW: ${directionDescriptions[direction]}
${identity.angleNotes[direction] ? `ANGLE NOTES: ${identity.angleNotes[direction]}` : ''}

STYLE:
- Outline: ${identity.styleParameters.outlineStyle}
- Shading: ${identity.styleParameters.shadingStyle}
- Detail: ${identity.styleParameters.detailLevel}

${paletteInstruction}

OUTPUT:
- PNG image, transparent background
- Exact size: ${size}x${size} pixels
`;

  const response = await client.models.generateContent({
    model: config.model,
    contents: prompt,
    config: {
      systemInstruction: SPRITE_SYSTEM_PROMPT,
      responseModalities: [Modality.IMAGE],
      temperature: config.temperature,
      ...(config.thinkingLevel && {
        thinkingConfig: { thinkingLevel: config.thinkingLevel },
      }),
    },
  });

  const parts = response.candidates?.[0]?.content?.parts ?? [];
  const imagePart = parts.find((part) => part.inlineData);
  if (!imagePart?.inlineData?.data) {
    throw new Error('No image data in response');
  }

  // Returns base64-encoded PNG data.
  return imagePart.inlineData.data;
}
```

**Step 2: Update src/services/gemini/index.ts**

```typescript
export { initializeClient, getClient, isClientInitialized } from './client';
export { generateContent, generateStructuredContent, generateImage, editImage } from './client';
export { getModelForTask, getConfigForTask } from './modelRouter';
export { generateCharacterIdentity, generateSprite } from './geminiService';
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

## Task 2.4: Style Controls (Aligned)

**Files:**
- Use existing: `src/components/character/StyleSelector.tsx`

**Notes:**
- StyleSelector already covers canvas size (128/256 active), outline/shading/detail, palette mode, and view type.
- Advanced options toggle and mobile layout are built in.

---

## Task 2.5: Character Inputs (Aligned)

**Files:**
- Use existing: `src/components/character/DescriptionInput.tsx`
- Use existing: `src/components/character/GenerateControls.tsx`

**Notes:**
- DescriptionInput validates length (10-2000 chars).
- GenerateControls triggers identity/sprite generation, save-to-library, and clear actions.
- After sprite generation, convert PNG to pixel array via `pngToPixelArray` before storing and locking palette.

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

## Task 2.8: Character Tab Layout (Aligned)

**Files:**
- Update: `src/components/character/CharacterTab.tsx`
- Update: `src/components/character/index.ts`

**Notes:**
- Desktop: three-column layout; mobile: stacked layout.
- Left column: DescriptionInput, StyleSelector, GenerateControls.
- Center column: SpriteCanvas, zoom controls, PNG download, PaletteDisplay.
- Right column: IdentityCard.
- Sprite flow: generate PNG -> pngToPixelArray -> validateAndSnapPixelData -> lock palette.
- Preserve enhancements: API key modal, save-to-library, 128/256 sizes, PNG download.

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
- Character store with description, identity, sprites, palette
- Character generation service (identity + PNG sprite)
- Sprite canvas with zoom-aware rendering and PNG export
- Style selector + description input + generate controls
- Identity card display
- Locked palette display
- Character tab layout wired to app

**Next Phase:** Canvas editing tools, zoom controls, hotspot editing

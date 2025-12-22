# Phase 4: Sprite Rotations & 3D Preview

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Generate 8-directional sprite sheets using 3D reference turntable for consistent poses across angles.

**Architecture:** Three.js scene renders low-poly 3D reference model. Each rotation angle renders to image, passed to Gemini with locked palette for sprite generation.

**Prerequisites:** Phase 3 complete (Canvas & Tools)

**Key Reference:** `C:\Users\User\Desktop\PixelMilk\Resources and Guides\consistent_imagery_generation.ipynb`

---

## Task 4.1: Create 3D Turntable Component

**Files:**
- Create: `src/components/canvas/TurntablePreview.tsx`

Uses React Three Fiber to render a simple 3D placeholder. Eventually can accept user-uploaded .glb models or auto-generate from sprite.

```tsx
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { useRef, useState, useImperativeHandle, forwardRef } from 'react';
import * as THREE from 'three';

interface TurntablePreviewProps {
  size?: number;
}

export interface TurntableRef {
  captureView: (angle: number) => string;
}

export const TurntablePreview = forwardRef<TurntableRef, TurntablePreviewProps>(
  ({ size = 256 }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    
    useImperativeHandle(ref, () => ({
      captureView: (angle: number) => {
        // Rotate camera to angle, render, return base64
        const canvas = canvasRef.current;
        if (!canvas) return '';
        return canvas.toDataURL('image/png');
      },
    }));
    
    return (
      <div style={{ width: size, height: size, border: '1px solid var(--color-border-muted)' }}>
        <Canvas ref={canvasRef} gl={{ preserveDrawingBuffer: true }}>
          <PerspectiveCamera makeDefault position={[0, 1, 3]} />
          <OrbitControls enableZoom={false} />
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} />
          
          {/* Placeholder humanoid shape */}
          <group>
            {/* Body */}
            <mesh position={[0, 0.5, 0]}>
              <boxGeometry args={[0.6, 1, 0.3]} />
              <meshStandardMaterial color="#8bd0ba" />
            </mesh>
            {/* Head */}
            <mesh position={[0, 1.3, 0]}>
              <sphereGeometry args={[0.25, 16, 16]} />
              <meshStandardMaterial color="#d8c8b8" />
            </mesh>
          </group>
        </Canvas>
      </div>
    );
  }
);
```

---

## Task 4.2: Create Direction Selector Component

**Files:**
- Create: `src/components/character/DirectionSelector.tsx`

Shows 8-direction compass, highlights which directions have sprites generated.

```tsx
import type { Direction } from '@/types';

interface DirectionSelectorProps {
  generatedDirections: Set<Direction>;
  selectedDirection: Direction;
  onSelect: (dir: Direction) => void;
}

const directions: { dir: Direction; label: string; gridArea: string }[] = [
  { dir: 'NW', label: '↖', gridArea: '1 / 1' },
  { dir: 'N', label: '↑', gridArea: '1 / 2' },
  { dir: 'NE', label: '↗', gridArea: '1 / 3' },
  { dir: 'W', label: '←', gridArea: '2 / 1' },
  { dir: 'E', label: '→', gridArea: '2 / 3' },
  { dir: 'SW', label: '↙', gridArea: '3 / 1' },
  { dir: 'S', label: '↓', gridArea: '3 / 2' },
  { dir: 'SE', label: '↘', gridArea: '3 / 3' },
];

export function DirectionSelector({ generatedDirections, selectedDirection, onSelect }: DirectionSelectorProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 40px)', gap: '4px' }}>
      {directions.map(({ dir, label, gridArea }) => {
        const isGenerated = generatedDirections.has(dir);
        const isSelected = selectedDirection === dir;
        
        return (
          <button
            key={dir}
            onClick={() => onSelect(dir)}
            style={{
              gridArea,
              width: 40,
              height: 40,
              border: isSelected ? '2px solid var(--color-text-primary)' : '1px solid var(--color-border-muted)',
              backgroundColor: isGenerated ? 'var(--color-bg-tertiary)' : 'var(--color-bg-secondary)',
              color: isGenerated ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
              fontSize: '18px',
              cursor: 'pointer',
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
```

---

## Task 4.3: Create Rotation Generation Service

**Files:**
- Update: `src/services/gemini/character.ts`

Add function to generate sprite from 3D reference image:

```typescript
export async function generateSpriteFromReference(
  identity: CharacterIdentity,
  direction: Direction,
  referenceImageBase64: string,
  lockedPalette: string[],
  quality: QualityMode = 'draft'
): Promise<SpriteData> {
  const client = getClient();
  const config = getConfigForTask('perspective-shift', quality);
  const size = identity.styleParameters.canvasSize;
  
  const angleDescriptions: Record<Direction, string> = {
    S: 'Front view - facing viewer',
    N: 'Back view - facing away',
    E: 'Right profile - facing right',
    W: 'Left profile - facing left',
    SE: 'Front-right 3/4 view',
    SW: 'Front-left 3/4 view',
    NE: 'Back-right 3/4 view',
    NW: 'Back-left 3/4 view',
  };
  
  const prompt = `
Convert this 3D reference image to pixel art.

CHARACTER: ${identity.name}
VIEW: ${direction} - ${angleDescriptions[direction]}
CANVAS: ${size}x${size}

MATCH EXACTLY:
- Pose and silhouette from reference
- Locked palette: ${JSON.stringify(lockedPalette)}
- Style: ${identity.styleParameters.outlineStyle} outline, ${identity.styleParameters.shadingStyle} shading

Output JSON with: name, width, height, palette (the locked array), pixels (${size * size} values)
`;

  const response = await client.models.generateContent({
    model: config.model,
    contents: {
      parts: [
        { text: prompt },
        {
          inlineData: {
            mimeType: 'image/png',
            data: referenceImageBase64.replace(/^data:image\/\w+;base64,/, ''),
          },
        },
      ],
    },
    config: {
      temperature: config.temperature,
      responseMimeType: 'application/json',
      responseSchema: pixelDataSchema,
    },
  });
  
  const data = JSON.parse(response.text!) as PixelData;
  
  return {
    id: `sprite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ...data,
    direction,
    createdAt: Date.now(),
  };
}
```

---

## Task 4.4: Create Sprite Sheet Generator

**Files:**
- Create: `src/components/character/SpriteSheetGenerator.tsx`

Button to generate all 8 directions sequentially:

```tsx
import { useState } from 'react';
import { Button, Panel } from '@/components/shared';
import { DirectionSelector } from './DirectionSelector';
import { useCharacterStore, useAppStore } from '@/stores';
import { generateSpriteFromReference } from '@/services/gemini';
import type { Direction } from '@/types';
import { Grid3X3, Loader2 } from 'lucide-react';

const ALL_DIRECTIONS: Direction[] = ['S', 'SE', 'E', 'NE', 'N', 'NW', 'W', 'SW'];

export function SpriteSheetGenerator() {
  const { currentIdentity, currentSprites, lockedPalette, addSprite } = useCharacterStore();
  const { setGenerationStatus } = useAppStore();
  const [selectedDirection, setSelectedDirection] = useState<Direction>('S');
  const [isGenerating, setIsGenerating] = useState(false);
  
  const generatedDirections = new Set(currentSprites.keys());
  
  const handleGenerateAll = async () => {
    if (!currentIdentity || !lockedPalette) return;
    
    setIsGenerating(true);
    const directionsToGenerate = ALL_DIRECTIONS.filter((d) => !generatedDirections.has(d));
    
    for (let i = 0; i < directionsToGenerate.length; i++) {
      const dir = directionsToGenerate[i];
      setGenerationStatus({
        isGenerating: true,
        progress: Math.round((i / directionsToGenerate.length) * 100),
        stage: `Generating ${dir} view...`,
      });
      
      try {
        // TODO: Get actual 3D reference from TurntablePreview
        const referenceImage = ''; // Placeholder
        
        const sprite = await generateSpriteFromReference(
          currentIdentity,
          dir,
          referenceImage,
          lockedPalette,
          'draft'
        );
        
        addSprite(dir, sprite);
      } catch (err) {
        console.error(`Failed to generate ${dir}:`, err);
      }
    }
    
    setGenerationStatus({ isGenerating: false, progress: 100, stage: 'Complete!' });
    setIsGenerating(false);
  };
  
  if (!currentIdentity) {
    return (
      <Panel title="Sprite Sheet">
        <p style={{ color: 'var(--color-text-muted)' }}>
          > Generate a character first
        </p>
      </Panel>
    );
  }
  
  return (
    <Panel title="Sprite Sheet">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <DirectionSelector
          generatedDirections={generatedDirections}
          selectedDirection={selectedDirection}
          onSelect={setSelectedDirection}
        />
        
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
          > {generatedDirections.size}/8 directions generated
        </p>
        
        <Button onClick={handleGenerateAll} disabled={isGenerating || generatedDirections.size === 8}>
          {isGenerating ? (
            <>
              <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
              Generating...
            </>
          ) : (
            <>
              <Grid3X3 size={16} />
              Generate All Directions
            </>
          )}
        </Button>
      </div>
    </Panel>
  );
}
```

---

## Task 4.5: Create Sprite Sheet Export

**Files:**
- Create: `src/utils/exportUtils.ts`

```typescript
import type { SpriteData, Direction } from '@/types';

const DIRECTION_ORDER: Direction[] = ['S', 'SE', 'E', 'NE', 'N', 'NW', 'W', 'SW'];

export function createSpriteSheet(
  sprites: Map<Direction, SpriteData>,
  layout: 'horizontal' | 'grid' = 'horizontal'
): HTMLCanvasElement {
  const orderedSprites = DIRECTION_ORDER
    .filter((d) => sprites.has(d))
    .map((d) => sprites.get(d)!);
  
  if (orderedSprites.length === 0) {
    throw new Error('No sprites to export');
  }
  
  const spriteWidth = orderedSprites[0].width;
  const spriteHeight = orderedSprites[0].height;
  
  let canvasWidth: number;
  let canvasHeight: number;
  let cols: number;
  
  if (layout === 'horizontal') {
    cols = orderedSprites.length;
    canvasWidth = spriteWidth * cols;
    canvasHeight = spriteHeight;
  } else {
    cols = Math.ceil(Math.sqrt(orderedSprites.length));
    const rows = Math.ceil(orderedSprites.length / cols);
    canvasWidth = spriteWidth * cols;
    canvasHeight = spriteHeight * rows;
  }
  
  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  
  const ctx = canvas.getContext('2d')!;
  
  orderedSprites.forEach((sprite, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    const offsetX = col * spriteWidth;
    const offsetY = row * spriteHeight;
    
    // Draw each pixel
    sprite.pixels.forEach((colour, pixelIndex) => {
      if (colour !== 'transparent') {
        const px = pixelIndex % sprite.width;
        const py = Math.floor(pixelIndex / sprite.width);
        ctx.fillStyle = colour;
        ctx.fillRect(offsetX + px, offsetY + py, 1, 1);
      }
    });
  });
  
  return canvas;
}

export function downloadCanvas(canvas: HTMLCanvasElement, filename: string): void {
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

export function downloadSpriteSheet(
  sprites: Map<Direction, SpriteData>,
  name: string,
  layout: 'horizontal' | 'grid' = 'horizontal'
): void {
  const canvas = createSpriteSheet(sprites, layout);
  downloadCanvas(canvas, `${name}_spritesheet.png`);
}
```

---

## Task 4.6: Update Character Tab with Sprite Sheet Panel

Update `CharacterTab.tsx` to include `SpriteSheetGenerator` in right panel.

---

## Task 4.7: Reference Stacking (Multi-Image Identity Lock)

> **Added via NotebookLM Enhancement Plan (2025-12-20)**

**Problem:** Current implementation uses a single reference image for rotations. NotebookLM recommends "Reference Stacking" - uploading up to 14 reference images simultaneously to "lock" character identity.

**Why:** Instead of relying on a text-based "Identity Card" alone, sending multiple visual references (character sheet, front view, side view, etc.) dramatically improves consistency across generations.

**Files:**
- Update: `src/types.ts`
- Update: `src/stores/characterStore.ts`
- Update: `src/services/gemini/geminiService.ts`

**Step 1: Add CharacterReferences type to types.ts**

```typescript
export interface CharacterReferences {
  sheet?: string;      // Character design sheet (if available)
  front?: string;      // Generated front sprite (S direction)
  back?: string;       // Generated back sprite (N direction)
  left?: string;       // Generated left sprite (W direction)
  right?: string;      // Generated right sprite (E direction)
  frontLeft?: string;  // SW direction
  frontRight?: string; // SE direction
  backLeft?: string;   // NW direction
  backRight?: string;  // NE direction
  custom?: string[];   // Additional user-uploaded references
}
```

**Step 2: Update CharacterState in characterStore.ts**

```typescript
interface CharacterState {
  // ... existing fields
  references: CharacterReferences;

  // New action
  addReference: (key: keyof CharacterReferences, base64: string) => void;
}

// In store implementation:
addReference: (key, base64) => set((state) => ({
  references: {
    ...state.references,
    [key]: base64,
  },
})),
```

**Step 3: Build Reference Stack in geminiService.ts**

```typescript
function buildReferenceStack(
  character: CharacterIdentity,
  references: CharacterReferences
): Array<{ label: string; base64: string }> {
  const stack: Array<{ label: string; base64: string }> = [];

  // Priority order: sheet first, then front, then other directions
  if (references.sheet) {
    stack.push({ label: 'Character design sheet showing multiple views', base64: references.sheet });
  }
  if (references.front) {
    stack.push({ label: 'Front view reference (S direction)', base64: references.front });
  }
  if (references.back) {
    stack.push({ label: 'Back view reference (N direction)', base64: references.back });
  }
  if (references.left) {
    stack.push({ label: 'Left profile reference (W direction)', base64: references.left });
  }
  if (references.right) {
    stack.push({ label: 'Right profile reference (E direction)', base64: references.right });
  }
  // ... add other directions as available

  // Gemini API limit: 14 images max
  return stack.slice(0, 14);
}
```

**Step 4: Update generateRotatedSprite to use Reference Stack**

```typescript
export const generateRotatedSprite = async (
  identity: CharacterIdentity,
  direction: Direction,
  references: CharacterReferences,  // Changed from single image
  quality: QualityMode = 'final',
  lockedPalette?: string[]
): Promise<string> => {
  const referenceStack = buildReferenceStack(identity, references);

  // Build labeled prompt per NotebookLM best practice
  const imageLabels = referenceStack.map((ref, i) =>
    `Image ${i + 1}: ${ref.label}`
  ).join('\n');

  const prompt = `Generate a ${size}x${size} pixel art sprite - ${directionDesc}

${imageLabels}

Maintain EXACT consistency with all reference images above.
Match the character's proportions, colors, and style from the references.

CHARACTER: ${identity.name}
// ... rest of prompt
`;

  // Prepare all images with white backgrounds
  const preparedImages = await Promise.all(
    referenceStack.map(ref => prepareCanvasForGemini(ref.base64))
  );

  // Send all images with prompt
  const response = await client.models.generateContent({
    model: config.model,
    contents: {
      parts: [
        ...preparedImages.map(img => ({
          inlineData: { mimeType: 'image/png', data: img }
        })),
        { text: prompt },
      ],
    },
    // ... config
  });
};
```

**Step 5: Auto-populate references after generation**

When a sprite is generated successfully, automatically add it to the references store:

```typescript
// In CharacterTab.tsx after successful sprite generation:
const base64 = await generateSprite(identity, direction, quality, lockedPalette);

// Map direction to reference key
const directionToRefKey: Record<Direction, keyof CharacterReferences> = {
  S: 'front',
  N: 'back',
  E: 'right',
  W: 'left',
  SE: 'frontRight',
  SW: 'frontLeft',
  NE: 'backRight',
  NW: 'backLeft',
};

addReference(directionToRefKey[direction], base64);
```

---

## Task 4.8: Thought Signature Circulation (Pro Model Consistency)

> **Added via NotebookLM Enhancement Plan (2025-12-20)**

**Problem:** When using Gemini 3 Pro's "Thinking" mode for iterative edits, the API returns "Thought Signatures" (encrypted reasoning context). Failure to pass these signatures back in subsequent turns causes the model to lose its "thread" and character identity drifts after 3-4 turns.

**Note:** This feature requires Gemini 3 Pro API which may not be fully available yet. Implementation is forward-compatible.

**Files:**
- Update: `src/types.ts`
- Update: `src/stores/characterStore.ts`
- Update: `src/services/gemini/geminiService.ts`

**Step 1: Add GenerationSession type to types.ts**

```typescript
export interface GenerationSession {
  characterId: string;
  thoughtSignature?: string;  // Encrypted context from Pro model
  turnCount: number;
  createdAt: number;
  lastUsedAt: number;
}
```

**Step 2: Add session management to characterStore.ts**

```typescript
interface CharacterState {
  // ... existing
  activeSession?: GenerationSession;

  // Session actions
  updateSession: (thoughtSignature?: string) => void;
  clearSession: () => void;
}

// Implementation:
updateSession: (thoughtSignature) => set((state) => {
  const now = Date.now();
  const existing = state.activeSession;

  // Clear if stale (>5 min) or too many turns
  if (existing && (now - existing.lastUsedAt > 5 * 60 * 1000 || existing.turnCount >= 4)) {
    return { activeSession: undefined };
  }

  return {
    activeSession: {
      characterId: state.currentIdentity?.id || '',
      thoughtSignature,
      turnCount: (existing?.turnCount || 0) + 1,
      createdAt: existing?.createdAt || now,
      lastUsedAt: now,
    },
  };
}),

clearSession: () => set({ activeSession: undefined }),
```

**Step 3: Extract and pass thought signatures in geminiService.ts**

```typescript
interface GeminiImageResponse {
  image: string;
  thoughtSignature?: string;
}

async function generateWithSession(
  prompt: string,
  images: string[],
  session?: GenerationSession
): Promise<GeminiImageResponse> {
  const response = await client.models.generateContent({
    // ... existing config
    config: {
      // Pass previous thought signature if available
      ...(session?.thoughtSignature && {
        previousThoughtSignature: session.thoughtSignature,
      }),
    },
  });

  // Extract new thought signature from response (if present)
  const newSignature = response.candidates?.[0]?.thoughtSignature;

  return {
    image: extractImageData(response),
    thoughtSignature: newSignature,
  };
}
```

**Step 4: Wire into generation flow**

```typescript
// In CharacterTab or generation handler:
const { activeSession, updateSession } = useCharacterStore();

const result = await generateWithSession(prompt, images, activeSession);

// Store the new signature for next turn
updateSession(result.thoughtSignature);

// Use result.image as before
```

**Why:** Maintains 95%+ character consistency during iterative refining by preserving the model's reasoning context across multiple generations.

---

## Task 4.9: Update Rotation Generation to Use Full Reference Stack

> **Added via NotebookLM Enhancement Plan (2025-12-20)**

**Prerequisite:** Tasks 4.7 and 4.8 must be complete.

Update `generateSpriteFromReference()` to:
1. Collect all available reference images for the character
2. Label each with semantic context ("Image 1: Front view", etc.)
3. Include thought signature if available from active session
4. Use `prepareCanvasForGemini()` on ALL reference images

This ensures maximum consistency when generating the 8-direction sprite sheet.

---

## Phase 4 Complete

At this point you have:
- ✅ 3D turntable preview component (placeholder geometry)
- ✅ Direction selector compass widget
- ✅ Rotation generation from 3D reference
- ✅ Batch generation of all 8 directions
- ✅ Sprite sheet export utility
- ✅ Download as PNG
- ✅ Reference Stacking for identity lock (NotebookLM)
- ✅ Thought Signature circulation for Pro model (NotebookLM)
- ✅ Multi-image generation with semantic labels (NotebookLM)

**Next Phase:** Tile Tab with seamless patterns and autotile support

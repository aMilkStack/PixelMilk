# PixelMilk Foundation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the foundation for PixelMilk - a modular pixel art creation suite with AI-powered generation using Gemini's image capabilities.

**Architecture:** Frontend-only React + Vite app. Gemini API called directly from client (user provides API key). IndexedDB for asset persistence. Tab-based UI with shared services layer. Model routing selects optimal Gemini model per task type.

**Tech Stack:** React 19, TypeScript, Vite, @google/genai, IndexedDB (idb), Zustand (state), Three.js (3D preview), Lucide React (icons)

**Reference Resources:**
- Prototype: `C:\Users\User\Desktop\PixelMilk\App Prototype\`
- Gemini Recipes: `C:\Users\User\Desktop\PixelMilk\Resources and Guides\generative-ai-main\gemini\nano-banana\`
- Co-Drawing: `C:\Users\User\Desktop\PixelMilk\Resources and Guides\gemini-co-drawing\`
- PixShop: `C:\Users\User\Desktop\PixelMilk\Resources and Guides\pixshop\`
- Infinimap: `C:\Users\User\Desktop\PixelMilk\Resources and Guides\nano-banana-infinimap-main\`
- Home Canvas: `C:\Users\User\Desktop\PixelMilk\Resources and Guides\home-canvas\`

---

## Phase 1: Project Scaffolding

### Task 1.1: Initialize Vite Project

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `.env.example`
- Create: `.gitignore`

**Step 1: Create package.json**

```json
{
  "name": "pixelmilk",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext ts,tsx"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@google/genai": "^1.34.0",
    "zustand": "^5.0.0",
    "idb": "^8.0.0",
    "lucide-react": "^0.460.0",
    "three": "^0.170.0",
    "@react-three/fiber": "^8.17.0",
    "@react-three/drei": "^9.117.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@types/three": "^0.170.0",
    "@types/node": "^22.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "typescript": "^5.6.0",
    "vite": "^6.0.0"
  }
}
```

**Step 2: Create vite.config.ts**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@services': path.resolve(__dirname, './src/services'),
      '@stores': path.resolve(__dirname, './src/stores'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@types': path.resolve(__dirname, './src/types'),
      '@utils': path.resolve(__dirname, './src/utils'),
    },
  },
  define: {
    'process.env': {},
  },
});
```

**Step 3: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@components/*": ["./src/components/*"],
      "@services/*": ["./src/services/*"],
      "@stores/*": ["./src/stores/*"],
      "@hooks/*": ["./src/hooks/*"],
      "@types/*": ["./src/types/*"],
      "@utils/*": ["./src/utils/*"]
    }
  },
  "include": ["src"]
}
```

**Step 4: Create index.html**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>PixelMilk</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=VT323&family=Playfair+Display:wght@400;700&display=swap" rel="stylesheet">
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      html, body, #root {
        height: 100%;
        width: 100%;
        background: #021a1a;
        color: #8bd0ba;
        font-family: 'VT323', monospace;
      }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

**Step 5: Create src/main.tsx**

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/global.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

**Step 6: Create src/App.tsx (placeholder)**

```tsx
export default function App() {
  return (
    <div style={{ padding: '2rem' }}>
      <h1 style={{ fontFamily: "'Playfair Display', serif" }}>PixelMilk</h1>
      <p>> System initialising...</p>
    </div>
  );
}
```

**Step 7: Create .env.example**

```
VITE_GEMINI_API_KEY=your_api_key_here
```

**Step 8: Create .gitignore**

```
node_modules
dist
.env
.env.local
*.local
.DS_Store
```

**Step 9: Run npm install and verify**

Run: `cd C:\Users\User\Desktop\PixelMilk\PixelMilk-App && npm install`
Run: `npm run dev`
Expected: Dev server starts, shows "PixelMilk" heading in browser

**Step 10: Commit**

```bash
git init
git add .
git commit -m "chore: initial project scaffolding"
```

---

### Task 1.2: Create Directory Structure

**Files:**
- Create directories for the full app structure

**Step 1: Create all directories**

```
src/
├── components/
│   ├── shared/           # Reusable UI components
│   ├── layout/           # App shell, tabs, sidebar
│   ├── canvas/           # Drawing canvas components
│   ├── character/        # Character tab components
│   ├── tile/             # Tile tab components
│   ├── object/           # Object tab components
│   ├── texture/          # Texture tab components
│   ├── compose/          # Compose tab components
│   └── library/          # Library tab components
├── services/
│   ├── gemini/           # All Gemini API interactions
│   └── storage/          # IndexedDB operations
├── stores/               # Zustand state stores
├── hooks/                # Custom React hooks
├── types/                # TypeScript interfaces
├── utils/                # Helper functions
└── styles/               # Global styles
```

Run: Create each directory
Expected: Directory structure exists

**Step 2: Commit**

```bash
git add .
git commit -m "chore: create directory structure"
```

---

### Task 1.3: Define Core Types

**Files:**
- Create: `src/types/index.ts`
- Create: `src/types/gemini.ts`
- Create: `src/types/assets.ts`
- Create: `src/types/ui.ts`

**Step 1: Create src/types/index.ts**

```typescript
export * from './gemini';
export * from './assets';
export * from './ui';
```

**Step 2: Create src/types/gemini.ts**

```typescript
// Model routing types
export type TaskType =
  | 'sprite-draft'
  | 'sprite-final'
  | 'tile'
  | 'texture'
  | 'perspective-shift'
  | 'style-transfer'
  | 'edit-localised'
  | 'animation-frame'
  | 'composite'
  | 'text-analysis';

export type QualityMode = 'draft' | 'final';

export type GeminiModel =
  | 'gemini-2.5-flash-image'      // Fast image gen
  | 'gemini-3-pro-image-preview'  // Quality image gen
  | 'gemini-2.5-flash'            // Fast text
  | 'gemini-3-flash-preview';     // Quality text

export interface GeminiConfig {
  model: GeminiModel;
  temperature?: number;
  thinkingLevel?: 'minimal' | 'low' | 'medium' | 'high';
  mediaResolution?: 'low' | 'medium' | 'high';
}

// Structured output schemas
export interface PixelDataSchema {
  name: string;
  width: number;
  height: number;
  palette: string[];
  pixels: string[];        // Hex codes or "transparent"
  normalMap?: string[];    // Optional normal map data
}
```

**Step 3: Create src/types/assets.ts**

```typescript
export type Direction = 'S' | 'N' | 'E' | 'W' | 'SE' | 'SW' | 'NE' | 'NW';
export type AssetType = 'character' | 'tile' | 'object' | 'texture';

export interface StyleParameters {
  outlineStyle: 'black' | 'colored' | 'selective' | 'lineless';
  shadingStyle: 'flat' | 'basic' | 'detailed';
  detailLevel: 'low' | 'medium' | 'high';
  canvasSize: 16 | 32 | 64 | 128;
  paletteMode: 'auto' | 'nes' | 'gameboy' | 'pico8' | 'custom';
  viewType: 'standard' | 'isometric';
}

export interface CharacterIdentity {
  id: string;
  name: string;
  description: string;
  physicalDescription: {
    bodyType: string;
    heightStyle: string;
    silhouette: string;
  };
  colourPalette: {
    primary: string;
    secondary: string;
    accent: string;
    skin: string;
    hair: string;
    outline: string;
  };
  distinctiveFeatures: string[];
  styleParameters: StyleParameters;
  angleNotes: Record<Direction, string>;
  createdAt: number;
  updatedAt: number;
}

export interface SpriteData {
  id: string;
  name: string;
  width: number;
  height: number;
  palette: string[];
  pixels: string[];
  normalMap?: string[];
  direction?: Direction;
  createdAt: number;
}

export interface Asset {
  id: string;
  type: AssetType;
  name: string;
  tags: string[];
  sprites: SpriteData[];
  identity?: CharacterIdentity;  // Only for characters
  createdAt: number;
  updatedAt: number;
}

// Tile-specific types
export interface TileNeighbors {
  N?: string;   // Asset ID or null
  S?: string;
  E?: string;
  W?: string;
  NE?: string;
  NW?: string;
  SE?: string;
  SW?: string;
}

export interface TileAsset extends Asset {
  type: 'tile';
  seamless: boolean;
  variants: SpriteData[];
}
```

**Step 4: Create src/types/ui.ts**

```typescript
export type TabId = 'character' | 'tile' | 'object' | 'texture' | 'compose' | 'library';

export interface TabConfig {
  id: TabId;
  label: string;
  icon: string;  // Lucide icon name
}

export type ToolMode = 
  | 'select'
  | 'draw'
  | 'erase'
  | 'fill'
  | 'eyedropper'
  | 'hotspot';   // For PixShop-style click-to-edit

export interface CanvasState {
  zoom: number;
  panX: number;
  panY: number;
  tool: ToolMode;
  brushSize: number;
  selectedColor: string;
}

export interface GenerationStatus {
  isGenerating: boolean;
  progress: number;
  stage: string;
  error?: string;
}
```

**Step 5: Commit**

```bash
git add .
git commit -m "feat: add core type definitions"
```

---

### Task 1.4: Create Global Styles

**Files:**
- Create: `src/styles/global.css`
- Create: `src/styles/variables.css`

**Step 1: Create src/styles/variables.css**

```css
:root {
  /* Core palette - pub green / mint terminal aesthetic */
  --color-bg-primary: #021a1a;
  --color-bg-secondary: #032828;
  --color-bg-tertiary: #043636;
  
  --color-text-primary: #8bd0ba;
  --color-text-secondary: #6ba89a;
  --color-text-muted: #4a7a6e;
  
  --color-accent-red: #f04e4e;
  --color-accent-beige: #d8c8b8;
  
  --color-border: #8bd0ba;
  --color-border-muted: #4a7a6e;
  
  /* Typography */
  --font-display: 'Playfair Display', Georgia, serif;
  --font-mono: 'VT323', 'Courier New', monospace;
  
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.25rem;
  --font-size-xl: 1.5rem;
  --font-size-2xl: 2rem;
  --font-size-3xl: 2.5rem;
  
  /* Spacing */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-12: 3rem;
  
  /* Grid */
  --grid-line-color: rgba(139, 208, 186, 0.1);
  --grid-line-width: 1px;
  
  /* Transitions */
  --transition-fast: 100ms ease;
  --transition-normal: 200ms ease;
}
```

**Step 2: Create src/styles/global.css**

```css
@import './variables.css';

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #root {
  height: 100%;
  width: 100%;
  overflow: hidden;
}

body {
  background-color: var(--color-bg-primary);
  color: var(--color-text-primary);
  font-family: var(--font-mono);
  font-size: var(--font-size-lg);
  line-height: 1.4;
  
  /* Subtle grid background */
  background-image: 
    linear-gradient(var(--grid-line-color) var(--grid-line-width), transparent var(--grid-line-width)),
    linear-gradient(90deg, var(--grid-line-color) var(--grid-line-width), transparent var(--grid-line-width));
  background-size: 20px 20px;
}

/* Typography */
h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-display);
  font-weight: 700;
  color: var(--color-text-primary);
}

h1 { font-size: var(--font-size-3xl); }
h2 { font-size: var(--font-size-2xl); }
h3 { font-size: var(--font-size-xl); }

/* Links */
a {
  color: var(--color-text-primary);
  text-decoration: underline;
}

a:hover {
  color: var(--color-accent-beige);
}

/* Selection */
::selection {
  background: var(--color-text-primary);
  color: var(--color-bg-primary);
}

/* Scrollbars - terminal style */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: var(--color-bg-secondary);
}

::-webkit-scrollbar-thumb {
  background: var(--color-border-muted);
  border: 1px solid var(--color-border);
}

::-webkit-scrollbar-thumb:hover {
  background: var(--color-text-secondary);
}

/* Focus states - visible but not rounded */
:focus-visible {
  outline: 2px solid var(--color-text-primary);
  outline-offset: 2px;
}

/* Utility: no border-radius anywhere */
*, *::before, *::after {
  border-radius: 0 !important;
}
```

**Step 3: Commit**

```bash
git add .
git commit -m "feat: add global styles with terminal aesthetic"
```

---

### Task 1.5: Create Shared UI Components

**Files:**
- Create: `src/components/shared/Button.tsx`
- Create: `src/components/shared/Input.tsx`
- Create: `src/components/shared/Select.tsx`
- Create: `src/components/shared/Panel.tsx`
- Create: `src/components/shared/Tooltip.tsx`
- Create: `src/components/shared/index.ts`

**Step 1: Create src/components/shared/Button.tsx**

```tsx
import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', isLoading, children, disabled, style, ...props }, ref) => {
    const baseStyles: React.CSSProperties = {
      fontFamily: "var(--font-mono)",
      cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
      border: '2px solid',
      transition: 'var(--transition-fast)',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 'var(--space-2)',
      opacity: disabled ? 0.5 : 1,
    };

    const sizeStyles: Record<string, React.CSSProperties> = {
      sm: { padding: 'var(--space-1) var(--space-2)', fontSize: 'var(--font-size-sm)' },
      md: { padding: 'var(--space-2) var(--space-4)', fontSize: 'var(--font-size-base)' },
      lg: { padding: 'var(--space-3) var(--space-6)', fontSize: 'var(--font-size-lg)' },
    };

    const variantStyles: Record<string, React.CSSProperties> = {
      primary: {
        backgroundColor: 'var(--color-text-primary)',
        borderColor: 'var(--color-text-primary)',
        color: 'var(--color-bg-primary)',
      },
      secondary: {
        backgroundColor: 'transparent',
        borderColor: 'var(--color-border)',
        color: 'var(--color-text-primary)',
      },
      danger: {
        backgroundColor: 'var(--color-accent-red)',
        borderColor: 'var(--color-accent-red)',
        color: 'var(--color-bg-primary)',
      },
      ghost: {
        backgroundColor: 'transparent',
        borderColor: 'transparent',
        color: 'var(--color-text-primary)',
      },
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        style={{ ...baseStyles, ...sizeStyles[size], ...variantStyles[variant], ...style }}
        {...props}
      >
        {isLoading ? '> Loading...' : children}
      </button>
    );
  }
);

Button.displayName = 'Button';
```

**Step 2: Create src/components/shared/Input.tsx**

```tsx
import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, style, ...props }, ref) => {
    const containerStyle: React.CSSProperties = {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-1)',
    };

    const labelStyle: React.CSSProperties = {
      fontSize: 'var(--font-size-sm)',
      color: 'var(--color-text-secondary)',
    };

    const inputStyle: React.CSSProperties = {
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--font-size-base)',
      padding: 'var(--space-2) var(--space-3)',
      backgroundColor: 'var(--color-bg-secondary)',
      border: '1px solid var(--color-border-muted)',
      color: 'var(--color-text-primary)',
      outline: 'none',
      transition: 'var(--transition-fast)',
    };

    const errorStyle: React.CSSProperties = {
      fontSize: 'var(--font-size-sm)',
      color: 'var(--color-accent-red)',
    };

    return (
      <div style={containerStyle}>
        {label && <label style={labelStyle}>> {label}</label>}
        <input
          ref={ref}
          style={{ ...inputStyle, ...style }}
          {...props}
        />
        {error && <span style={errorStyle}>! {error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
```

**Step 3: Create src/components/shared/Select.tsx**

```tsx
import { SelectHTMLAttributes, forwardRef } from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, style, ...props }, ref) => {
    const containerStyle: React.CSSProperties = {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-1)',
    };

    const labelStyle: React.CSSProperties = {
      fontSize: 'var(--font-size-sm)',
      color: 'var(--color-text-secondary)',
    };

    const selectStyle: React.CSSProperties = {
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--font-size-base)',
      padding: 'var(--space-2) var(--space-3)',
      backgroundColor: 'var(--color-bg-secondary)',
      border: '1px solid var(--color-border-muted)',
      color: 'var(--color-text-primary)',
      outline: 'none',
      cursor: 'pointer',
    };

    return (
      <div style={containerStyle}>
        {label && <label style={labelStyle}>> {label}</label>}
        <select ref={ref} style={{ ...selectStyle, ...style }} {...props}>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    );
  }
);

Select.displayName = 'Select';
```

**Step 4: Create src/components/shared/Panel.tsx**

```tsx
import { HTMLAttributes, forwardRef } from 'react';

interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  variant?: 'default' | 'inset';
}

export const Panel = forwardRef<HTMLDivElement, PanelProps>(
  ({ title, variant = 'default', children, style, ...props }, ref) => {
    const panelStyle: React.CSSProperties = {
      backgroundColor: variant === 'inset' ? 'var(--color-bg-secondary)' : 'var(--color-bg-tertiary)',
      border: '1px solid var(--color-border-muted)',
      padding: 'var(--space-4)',
      ...style,
    };

    const titleStyle: React.CSSProperties = {
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--font-size-lg)',
      marginBottom: 'var(--space-3)',
      paddingBottom: 'var(--space-2)',
      borderBottom: '1px solid var(--color-border-muted)',
    };

    return (
      <div ref={ref} style={panelStyle} {...props}>
        {title && <h3 style={titleStyle}>{title}</h3>}
        {children}
      </div>
    );
  }
);

Panel.displayName = 'Panel';
```

**Step 5: Create src/components/shared/Tooltip.tsx**

```tsx
import { useState, ReactNode } from 'react';

interface TooltipProps {
  content: string;
  children: ReactNode;
}

export function Tooltip({ content, children }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    display: 'inline-block',
  };

  const tooltipStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: '100%',
    left: '50%',
    transform: 'translateX(-50%)',
    marginBottom: 'var(--space-2)',
    padding: 'var(--space-2) var(--space-3)',
    backgroundColor: 'var(--color-bg-primary)',
    border: '1px solid var(--color-border)',
    color: 'var(--color-text-primary)',
    fontSize: 'var(--font-size-sm)',
    whiteSpace: 'nowrap',
    zIndex: 1000,
    opacity: isVisible ? 1 : 0,
    pointerEvents: 'none',
    transition: 'opacity var(--transition-fast)',
  };

  return (
    <div
      style={containerStyle}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      <div style={tooltipStyle}>> {content}</div>
    </div>
  );
}
```

**Step 6: Create src/components/shared/index.ts**

```typescript
export { Button } from './Button';
export { Input } from './Input';
export { Select } from './Select';
export { Panel } from './Panel';
export { Tooltip } from './Tooltip';
```

**Step 7: Commit**

```bash
git add .
git commit -m "feat: add shared UI components with terminal styling"
```

---

### Task 1.6: Create Gemini Service Layer

**Files:**
- Create: `src/services/gemini/client.ts`
- Create: `src/services/gemini/modelRouter.ts`
- Create: `src/services/gemini/schemas.ts`
- Create: `src/services/gemini/index.ts`

**Step 1: Create src/services/gemini/modelRouter.ts**

```typescript
import type { TaskType, QualityMode, GeminiModel, GeminiConfig } from '@/types';

const IMAGE_FAST: GeminiModel = 'gemini-2.5-flash-image';
const IMAGE_QUALITY: GeminiModel = 'gemini-3-pro-image-preview';
const TEXT_FAST: GeminiModel = 'gemini-2.5-flash';
const TEXT_QUALITY: GeminiModel = 'gemini-3-flash-preview';

export function getModelForTask(task: TaskType, quality: QualityMode = 'draft'): GeminiModel {
  switch (task) {
    // Always fast (volume-based operations)
    case 'tile':
    case 'texture':
    case 'animation-frame':
    case 'edit-localised':
      return IMAGE_FAST;

    // Always quality (complex reasoning required)
    case 'perspective-shift':
    case 'style-transfer':
    case 'composite':
      return IMAGE_QUALITY;

    // Quality-dependent
    case 'sprite-draft':
      return IMAGE_FAST;
    case 'sprite-final':
      return quality === 'final' ? IMAGE_QUALITY : IMAGE_FAST;

    // Text tasks
    case 'text-analysis':
      return TEXT_QUALITY;

    default:
      return IMAGE_FAST;
  }
}

export function getConfigForTask(task: TaskType, quality: QualityMode = 'draft'): GeminiConfig {
  const model = getModelForTask(task, quality);
  
  const config: GeminiConfig = {
    model,
    temperature: 1.0,  // Gemini 3 recommends keeping at 1.0
  };

  // Add thinking level for pro image model
  if (model === IMAGE_QUALITY) {
    config.thinkingLevel = quality === 'final' ? 'high' : 'low';
  }

  // Media resolution for reference images
  if (task === 'perspective-shift' || task === 'composite') {
    config.mediaResolution = 'high';
  } else if (task === 'edit-localised') {
    config.mediaResolution = 'medium';
  }

  return config;
}
```

**Step 2: Create src/services/gemini/schemas.ts**

```typescript
import { Type, Schema } from '@google/genai';

// Schema for pixel data output
export const pixelDataSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: 'Asset name' },
    width: { type: Type.INTEGER, description: 'Canvas width in pixels' },
    height: { type: Type.INTEGER, description: 'Canvas height in pixels' },
    palette: {
      type: Type.ARRAY,
      items: { type: Type.STRING, description: 'Hex code #RRGGBB' },
      description: 'Array of unique colours used',
    },
    pixels: {
      type: Type.ARRAY,
      items: { type: Type.STRING, description: 'Hex code #RRGGBB or "transparent"' },
      description: 'Row-major pixel array, length = width * height',
    },
  },
  required: ['name', 'width', 'height', 'palette', 'pixels'],
};

// Schema for character identity
export const characterIdentitySchema: Schema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    physicalDescription: {
      type: Type.OBJECT,
      properties: {
        bodyType: { type: Type.STRING },
        heightStyle: { type: Type.STRING },
        silhouette: { type: Type.STRING },
      },
      required: ['bodyType', 'heightStyle', 'silhouette'],
    },
    colourPalette: {
      type: Type.OBJECT,
      properties: {
        primary: { type: Type.STRING },
        secondary: { type: Type.STRING },
        accent: { type: Type.STRING },
        skin: { type: Type.STRING },
        hair: { type: Type.STRING },
        outline: { type: Type.STRING },
      },
      required: ['primary', 'secondary', 'outline'],
    },
    distinctiveFeatures: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    angleNotes: {
      type: Type.OBJECT,
      properties: {
        S: { type: Type.STRING },
        N: { type: Type.STRING },
        E: { type: Type.STRING },
        W: { type: Type.STRING },
      },
    },
  },
  required: ['name', 'physicalDescription', 'colourPalette', 'distinctiveFeatures'],
};

// Schema for prompt optimization suggestions
export const promptSuggestionSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    optimizedPrompt: { type: Type.STRING, description: 'Improved prompt text' },
    explanation: { type: Type.STRING, description: 'Why these changes help' },
    suggestions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Additional tips',
    },
  },
  required: ['optimizedPrompt', 'explanation'],
};
```

**Step 3: Create src/services/gemini/client.ts**

```typescript
import { GoogleGenAI } from '@google/genai';
import type { GeminiConfig, PixelDataSchema } from '@/types';
import { pixelDataSchema, characterIdentitySchema } from './schemas';

let clientInstance: GoogleGenAI | null = null;

export function initializeClient(apiKey: string): GoogleGenAI {
  clientInstance = new GoogleGenAI({ apiKey });
  return clientInstance;
}

export function getClient(): GoogleGenAI {
  if (!clientInstance) {
    throw new Error('Gemini client not initialized. Call initializeClient first.');
  }
  return clientInstance;
}

export function isClientInitialized(): boolean {
  return clientInstance !== null;
}

// Generic content generation
export async function generateContent(
  prompt: string,
  config: GeminiConfig
): Promise<string> {
  const client = getClient();
  
  const response = await client.models.generateContent({
    model: config.model,
    contents: prompt,
    config: {
      temperature: config.temperature,
      ...(config.thinkingLevel && {
        thinkingConfig: { thinkingLevel: config.thinkingLevel },
      }),
    },
  });

  return response.text ?? '';
}

// Structured JSON output
export async function generateStructuredContent<T>(
  prompt: string,
  config: GeminiConfig,
  schema: 'pixelData' | 'characterIdentity' | 'promptSuggestion'
): Promise<T> {
  const client = getClient();
  
  const schemaMap = {
    pixelData: pixelDataSchema,
    characterIdentity: characterIdentitySchema,
    promptSuggestion: pixelDataSchema, // TODO: use correct schema
  };

  const response = await client.models.generateContent({
    model: config.model,
    contents: prompt,
    config: {
      temperature: config.temperature,
      responseMimeType: 'application/json',
      responseSchema: schemaMap[schema],
      ...(config.thinkingLevel && {
        thinkingConfig: { thinkingLevel: config.thinkingLevel },
      }),
    },
  });

  const text = response.text;
  if (!text) throw new Error('No response from model');
  
  return JSON.parse(text) as T;
}

// Image generation
export async function generateImage(
  prompt: string,
  config: GeminiConfig
): Promise<{ imageData: string; mimeType: string }> {
  const client = getClient();

  const response = await client.models.generateContent({
    model: config.model,
    contents: prompt,
    config: {
      temperature: config.temperature,
      ...(config.thinkingLevel && {
        thinkingConfig: { thinkingLevel: config.thinkingLevel },
      }),
    },
  });

  // Extract image from response parts
  const parts = response.candidates?.[0]?.content?.parts ?? [];
  const imagePart = parts.find((p) => p.inlineData);

  if (!imagePart?.inlineData) {
    throw new Error('No image generated');
  }

  return {
    imageData: imagePart.inlineData.data,
    mimeType: imagePart.inlineData.mimeType,
  };
}

// Image editing with reference
export async function editImage(
  prompt: string,
  referenceImageBase64: string,
  mimeType: string,
  config: GeminiConfig
): Promise<{ imageData: string; mimeType: string }> {
  const client = getClient();

  const response = await client.models.generateContent({
    model: config.model,
    contents: {
      parts: [
        { text: prompt },
        {
          inlineData: {
            mimeType,
            data: referenceImageBase64.replace(/^data:image\/\w+;base64,/, ''),
          },
          ...(config.mediaResolution && {
            mediaResolution: { level: `media_resolution_${config.mediaResolution}` },
          }),
        },
      ],
    },
    config: {
      temperature: config.temperature,
      ...(config.thinkingLevel && {
        thinkingConfig: { thinkingLevel: config.thinkingLevel },
      }),
    },
  });

  const parts = response.candidates?.[0]?.content?.parts ?? [];
  const imagePart = parts.find((p) => p.inlineData);

  if (!imagePart?.inlineData) {
    throw new Error('No image generated');
  }

  return {
    imageData: imagePart.inlineData.data,
    mimeType: imagePart.inlineData.mimeType,
  };
}
```

**Step 4: Create src/services/gemini/index.ts**

```typescript
export { initializeClient, getClient, isClientInitialized } from './client';
export { generateContent, generateStructuredContent, generateImage, editImage } from './client';
export { getModelForTask, getConfigForTask } from './modelRouter';
export * from './schemas';
```

**Step 5: Commit**

```bash
git add .
git commit -m "feat: add Gemini service layer with model routing"
```

---

### Task 1.7: Create Storage Service (IndexedDB)

**Files:**
- Create: `src/services/storage/db.ts`
- Create: `src/services/storage/assets.ts`
- Create: `src/services/storage/settings.ts`
- Create: `src/services/storage/index.ts`

**Step 1: Create src/services/storage/db.ts**

```typescript
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { Asset, CharacterIdentity } from '@/types';

interface PixelMilkDB extends DBSchema {
  assets: {
    key: string;
    value: Asset;
    indexes: {
      'by-type': string;
      'by-updated': number;
    };
  };
  settings: {
    key: string;
    value: unknown;
  };
}

const DB_NAME = 'pixelmilk';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<PixelMilkDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<PixelMilkDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<PixelMilkDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Assets store
      if (!db.objectStoreNames.contains('assets')) {
        const assetStore = db.createObjectStore('assets', { keyPath: 'id' });
        assetStore.createIndex('by-type', 'type');
        assetStore.createIndex('by-updated', 'updatedAt');
      }

      // Settings store
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings');
      }
    },
  });

  return dbInstance;
}

export async function clearAllData(): Promise<void> {
  const db = await getDB();
  await db.clear('assets');
  await db.clear('settings');
}
```

**Step 2: Create src/services/storage/assets.ts**

```typescript
import { getDB } from './db';
import type { Asset, AssetType } from '@/types';

export async function saveAsset(asset: Asset): Promise<void> {
  const db = await getDB();
  asset.updatedAt = Date.now();
  await db.put('assets', asset);
}

export async function getAsset(id: string): Promise<Asset | undefined> {
  const db = await getDB();
  return db.get('assets', id);
}

export async function deleteAsset(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('assets', id);
}

export async function getAllAssets(): Promise<Asset[]> {
  const db = await getDB();
  return db.getAll('assets');
}

export async function getAssetsByType(type: AssetType): Promise<Asset[]> {
  const db = await getDB();
  return db.getAllFromIndex('assets', 'by-type', type);
}

export async function getRecentAssets(limit: number = 20): Promise<Asset[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex('assets', 'by-updated');
  return all.reverse().slice(0, limit);
}

// Generate unique ID
export function generateAssetId(): string {
  return `asset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
```

**Step 3: Create src/services/storage/settings.ts**

```typescript
import { getDB } from './db';

export async function getSetting<T>(key: string, defaultValue: T): Promise<T> {
  const db = await getDB();
  const value = await db.get('settings', key);
  return (value as T) ?? defaultValue;
}

export async function setSetting<T>(key: string, value: T): Promise<void> {
  const db = await getDB();
  await db.put('settings', value, key);
}

// Commonly used settings
export async function getApiKey(): Promise<string | null> {
  return getSetting('apiKey', null);
}

export async function setApiKey(key: string): Promise<void> {
  return setSetting('apiKey', key);
}

export async function getDefaultStyleParams(): Promise<object> {
  return getSetting('defaultStyle', {
    outlineStyle: 'black',
    shadingStyle: 'basic',
    detailLevel: 'medium',
    canvasSize: 32,
    paletteMode: 'auto',
    viewType: 'standard',
  });
}
```

**Step 4: Create src/services/storage/index.ts**

```typescript
export { getDB, clearAllData } from './db';
export {
  saveAsset,
  getAsset,
  deleteAsset,
  getAllAssets,
  getAssetsByType,
  getRecentAssets,
  generateAssetId,
} from './assets';
export {
  getSetting,
  setSetting,
  getApiKey,
  setApiKey,
  getDefaultStyleParams,
} from './settings';
```

**Step 5: Commit**

```bash
git add .
git commit -m "feat: add IndexedDB storage service"
```

---

### Task 1.8: Create App State Store

**Files:**
- Create: `src/stores/appStore.ts`
- Create: `src/stores/canvasStore.ts`
- Create: `src/stores/index.ts`

**Step 1: Create src/stores/appStore.ts**

```typescript
import { create } from 'zustand';
import type { TabId, GenerationStatus } from '@/types';

interface AppState {
  // API key
  apiKey: string | null;
  setApiKey: (key: string) => void;
  
  // Active tab
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  
  // Generation status
  generationStatus: GenerationStatus;
  setGenerationStatus: (status: Partial<GenerationStatus>) => void;
  resetGenerationStatus: () => void;
  
  // Modal state
  activeModal: string | null;
  openModal: (id: string) => void;
  closeModal: () => void;
}

const initialGenerationStatus: GenerationStatus = {
  isGenerating: false,
  progress: 0,
  stage: '',
};

export const useAppStore = create<AppState>((set) => ({
  apiKey: null,
  setApiKey: (key) => set({ apiKey: key }),
  
  activeTab: 'character',
  setActiveTab: (tab) => set({ activeTab: tab }),
  
  generationStatus: initialGenerationStatus,
  setGenerationStatus: (status) =>
    set((state) => ({
      generationStatus: { ...state.generationStatus, ...status },
    })),
  resetGenerationStatus: () => set({ generationStatus: initialGenerationStatus }),
  
  activeModal: null,
  openModal: (id) => set({ activeModal: id }),
  closeModal: () => set({ activeModal: null }),
}));
```

**Step 2: Create src/stores/canvasStore.ts**

```typescript
import { create } from 'zustand';
import type { CanvasState, ToolMode } from '@/types';

interface CanvasStore extends CanvasState {
  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  setTool: (tool: ToolMode) => void;
  setBrushSize: (size: number) => void;
  setSelectedColor: (color: string) => void;
  resetCanvas: () => void;
}

const initialState: CanvasState = {
  zoom: 1,
  panX: 0,
  panY: 0,
  tool: 'draw',
  brushSize: 1,
  selectedColor: '#8bd0ba',
};

export const useCanvasStore = create<CanvasStore>((set) => ({
  ...initialState,
  
  setZoom: (zoom) => set({ zoom: Math.max(0.5, Math.min(32, zoom)) }),
  setPan: (x, y) => set({ panX: x, panY: y }),
  setTool: (tool) => set({ tool }),
  setBrushSize: (size) => set({ brushSize: Math.max(1, Math.min(8, size)) }),
  setSelectedColor: (color) => set({ selectedColor: color }),
  resetCanvas: () => set(initialState),
}));
```

**Step 3: Create src/stores/index.ts**

```typescript
export { useAppStore } from './appStore';
export { useCanvasStore } from './canvasStore';
```

**Step 4: Commit**

```bash
git add .
git commit -m "feat: add Zustand state stores"
```

---

### Task 1.9: Create App Layout Shell

**Files:**
- Create: `src/components/layout/AppShell.tsx`
- Create: `src/components/layout/TabBar.tsx`
- Create: `src/components/layout/ApiKeyModal.tsx`
- Create: `src/components/layout/index.ts`
- Update: `src/App.tsx`

**Step 1: Create src/components/layout/TabBar.tsx**

```tsx
import { useAppStore } from '@/stores';
import type { TabId, TabConfig } from '@/types';
import {
  User,
  Grid3X3,
  Box,
  Layers,
  Combine,
  FolderOpen,
} from 'lucide-react';

const tabs: TabConfig[] = [
  { id: 'character', label: 'Character', icon: 'User' },
  { id: 'tile', label: 'Tile', icon: 'Grid3X3' },
  { id: 'object', label: 'Object', icon: 'Box' },
  { id: 'texture', label: 'Texture', icon: 'Layers' },
  { id: 'compose', label: 'Compose', icon: 'Combine' },
  { id: 'library', label: 'Library', icon: 'FolderOpen' },
];

const iconMap: Record<string, React.ComponentType<{ size?: number }>> = {
  User,
  Grid3X3,
  Box,
  Layers,
  Combine,
  FolderOpen,
};

export function TabBar() {
  const { activeTab, setActiveTab } = useAppStore();

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    gap: '0',
    borderBottom: '2px solid var(--color-border)',
    backgroundColor: 'var(--color-bg-secondary)',
  };

  const getTabStyle = (isActive: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    padding: 'var(--space-3) var(--space-4)',
    border: 'none',
    borderBottom: isActive ? '2px solid var(--color-text-primary)' : '2px solid transparent',
    marginBottom: '-2px',
    backgroundColor: isActive ? 'var(--color-bg-tertiary)' : 'transparent',
    color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
    fontFamily: 'var(--font-mono)',
    fontSize: 'var(--font-size-base)',
    cursor: 'pointer',
    transition: 'var(--transition-fast)',
  });

  return (
    <nav style={containerStyle}>
      {tabs.map((tab) => {
        const Icon = iconMap[tab.icon];
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            style={getTabStyle(isActive)}
            onClick={() => setActiveTab(tab.id)}
          >
            <Icon size={16} />
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
```

**Step 2: Create src/components/layout/ApiKeyModal.tsx**

```tsx
import { useState, useEffect } from 'react';
import { Button, Input, Panel } from '@/components/shared';
import { useAppStore } from '@/stores';
import { initializeClient } from '@/services/gemini';
import { getApiKey, setApiKey as saveApiKey } from '@/services/storage';

export function ApiKeyModal() {
  const { apiKey, setApiKey, closeModal } = useAppStore();
  const [inputKey, setInputKey] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load saved key on mount
    getApiKey().then((savedKey) => {
      if (savedKey) {
        setInputKey(savedKey);
      }
    });
  }, []);

  const handleSubmit = async () => {
    if (!inputKey.trim()) {
      setError('API key is required');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Initialize and test the client
      initializeClient(inputKey.trim());
      
      // Save to IndexedDB
      await saveApiKey(inputKey.trim());
      
      // Update app state
      setApiKey(inputKey.trim());
      closeModal();
    } catch (err) {
      setError('Invalid API key or connection failed');
    } finally {
      setIsLoading(false);
    }
  };

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(2, 26, 26, 0.9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  };

  const modalStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: '500px',
    margin: 'var(--space-4)',
  };

  return (
    <div style={overlayStyle}>
      <Panel title="API Configuration" style={modalStyle}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            > Enter your Gemini API key to enable AI features.
            <br />
            > Get one free at{' '}
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener">
              Google AI Studio
            </a>
          </p>
          
          <Input
            label="Gemini API Key"
            type="password"
            value={inputKey}
            onChange={(e) => setInputKey(e.target.value)}
            placeholder="AIza..."
            error={error}
          />
          
          <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
            {apiKey && (
              <Button variant="ghost" onClick={closeModal}>
                Cancel
              </Button>
            )}
            <Button onClick={handleSubmit} isLoading={isLoading}>
              {apiKey ? 'Update Key' : 'Connect'}
            </Button>
          </div>
        </div>
      </Panel>
    </div>
  );
}
```

**Step 3: Create src/components/layout/AppShell.tsx**

```tsx
import { useEffect } from 'react';
import { TabBar } from './TabBar';
import { ApiKeyModal } from './ApiKeyModal';
import { useAppStore } from '@/stores';
import { getApiKey } from '@/services/storage';
import { initializeClient, isClientInitialized } from '@/services/gemini';
import { Settings } from 'lucide-react';
import { Button } from '@/components/shared';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { apiKey, setApiKey, activeModal, openModal } = useAppStore();

  useEffect(() => {
    // Load API key on mount
    getApiKey().then((savedKey) => {
      if (savedKey) {
        setApiKey(savedKey);
        initializeClient(savedKey);
      } else {
        openModal('apiKey');
      }
    });
  }, []);

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 'var(--space-3) var(--space-4)',
    borderBottom: '1px solid var(--color-border-muted)',
    backgroundColor: 'var(--color-bg-secondary)',
  };

  const logoStyle: React.CSSProperties = {
    fontFamily: 'var(--font-display)',
    fontSize: 'var(--font-size-xl)',
    color: 'var(--color-text-primary)',
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
  };

  const mainStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
  };

  const contentStyle: React.CSSProperties = {
    flex: 1,
    overflow: 'hidden',
  };

  const statusStyle: React.CSSProperties = {
    fontSize: 'var(--font-size-sm)',
    color: apiKey ? 'var(--color-text-secondary)' : 'var(--color-accent-red)',
  };

  return (
    <div style={mainStyle}>
      <header style={headerStyle}>
        <div style={logoStyle}>
          <span>🥛</span>
          <span>PixelMilk</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <span style={statusStyle}>
            {apiKey ? '> Connected' : '> No API Key'}
          </span>
          <Button variant="ghost" size="sm" onClick={() => openModal('apiKey')}>
            <Settings size={16} />
          </Button>
        </div>
      </header>
      
      <TabBar />
      
      <main style={contentStyle}>
        {children}
      </main>
      
      {activeModal === 'apiKey' && <ApiKeyModal />}
    </div>
  );
}
```

**Step 4: Create src/components/layout/index.ts**

```typescript
export { AppShell } from './AppShell';
export { TabBar } from './TabBar';
export { ApiKeyModal } from './ApiKeyModal';
```

**Step 5: Update src/App.tsx**

```tsx
import { AppShell } from '@/components/layout';
import { useAppStore } from '@/stores';

// Placeholder tab content
function TabContent() {
  const { activeTab } = useAppStore();
  
  const style: React.CSSProperties = {
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    gap: 'var(--space-4)',
  };

  return (
    <div style={style}>
      <h2 style={{ fontFamily: 'var(--font-display)' }}>
        {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Tab
      </h2>
      <p style={{ color: 'var(--color-text-secondary)' }}>
        > Content coming soon...
      </p>
    </div>
  );
}

export default function App() {
  return (
    <AppShell>
      <TabContent />
    </AppShell>
  );
}
```

**Step 6: Run and verify**

Run: `npm run dev`
Expected: App shows with header, tab bar, API key modal on first load

**Step 7: Commit**

```bash
git add .
git commit -m "feat: add app layout shell with tab navigation"
```

---

## Phase 1 Complete

At this point you have:
- ✅ Project scaffolded with Vite + React + TypeScript
- ✅ Terminal aesthetic styling system
- ✅ Shared UI components (Button, Input, Select, Panel, Tooltip)
- ✅ Gemini service layer with model routing
- ✅ IndexedDB storage for assets and settings
- ✅ Zustand state management
- ✅ App shell with tab navigation
- ✅ API key management

---

## Phase 2: Character Tab (MVP) - Separate Plan

Phase 2 will be documented in a separate plan file once Phase 1 is verified working.

Key features for Phase 2:
- Character description input
- Style parameter controls
- Sprite generation (text→sprite)
- Sprite display canvas with zoom/pan
- Basic sprite editing
- Export functionality

---

**Plan complete and saved to `docs/plans/2025-12-18-pixelmilk-foundation.md`.**

**Two execution options:**

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**

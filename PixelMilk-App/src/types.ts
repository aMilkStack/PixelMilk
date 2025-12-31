export type Direction = 'S' | 'N' | 'E' | 'W' | 'SE' | 'SW' | 'NE' | 'NW';

// ============================================
// Core Asset Types
// ============================================

export type AssetType = 'character' | 'tile' | 'object' | 'texture';

export interface StyleParameters {
  outlineStyle: 'black' | 'colored' | 'selective' | 'lineless';
  shadingStyle: 'flat' | 'basic' | 'detailed';
  detailLevel: 'low' | 'medium' | 'high';
  canvasSize: 16 | 32 | 64 | 128 | 256; // 128/256 active, smaller sizes coming soon
  paletteMode: string; // Palette ID (e.g., 'rooted', 'sweetie16') - required, no 'auto' option
  viewType: 'standard' | 'isometric';
}

export interface CharacterIdentity {
  id: string;
  name: string;
  description: string; // Original user prompt - required for consistency
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
  angleNotes: Partial<Record<Direction, string>>; // Phase 2: N/S/E/W only, diagonals added in Phase 4
  createdAt: number;
  updatedAt: number;
}

export interface PixelData {
  name: string;
  width: number;
  height: number;
  palette: string[];
  pixels: string[]; // Array of hex codes or "transparent"
  normalMap?: string[]; // Optional normal map data
}

export interface SpriteData extends PixelData {
  id: string;
  direction: Direction;
  createdAt: number;
}

// ============================================
// UI Types
// ============================================

export type TabId = 'character' | 'tile' | 'object' | 'texture' | 'compose' | 'library';

export interface TabConfig {
  id: TabId;
  label: string;
  icon: string; // Lucide icon name
}

export type ToolMode = 'select' | 'draw' | 'erase' | 'fill' | 'eyedropper' | 'hotspot' | 'pan';

export interface CanvasState {
  zoom: number;
  panX: number;
  panY: number;
  tool: ToolMode;
  brushSize: number;
  selectedColor: string;

  // Hotspot selection for AI-powered region editing
  hotspotX: number | null;
  hotspotY: number | null;
  hotspotRadius: number;
  hotspotScreenX: number;
  hotspotScreenY: number;

  // Drawing state
  isDrawing: boolean;
}

export interface GenerationStatus {
  isGenerating: boolean;
  progress: number;
  stage: string;
  error?: string;
}

// ============================================
// Gemini Types
// ============================================

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
  | 'gemini-3-pro-preview'
  | 'gemini-3-pro-image-preview'
  | 'gemini-3-flash-preview'
  | 'gemini-2.5-flash-image';

export interface GeminiConfig {
  model: GeminiModel;
  temperature?: number;
  thinkingLevel?: 'minimal' | 'low' | 'medium' | 'high';
  mediaResolution?: 'low' | 'medium' | 'high';
  maxTokens?: number;
}

// ============================================
// Asset Storage
// ============================================

export interface Asset {
  id: string;
  type: AssetType;
  name: string;
  tags?: string[];
  createdAt: number;
  updatedAt: number;
  thumbnail?: string; // Base64 data URL
  identity?: CharacterIdentity; // For characters
  sprites?: SpriteData[]; // For characters with multiple directions
  data?: PixelData; // For non-character assets
}

// ============================================
// Palette Types
// ============================================

export interface Palette {
  id: string;
  name: string;
  colors: string[]; // Array of hex colors (with #)
  source?: string; // e.g., "lospec", "custom"
  author?: string;
  tags?: string[];
  createdAt: number;
}

// Palette metadata from JSON files (paletteData service)
export interface ChromaKeyEntry {
  chromaKey: string; // Hex WITHOUT # prefix in source
  distance: number;
}

export interface PaletteMetaEntry {
  path: string;
  tags: string[];
  colours: number;
}

export interface PaletteRolesEntry {
  midtones: string[];
  darkest: string;
  outlines: string[];
  lightest: string;
  accents: string[];
}

export type Direction = 'S' | 'N' | 'E' | 'W' | 'SE' | 'SW' | 'NE' | 'NW';

export interface StyleParameters {
  outlineStyle: 'single_color_black' | 'single_color_outline' | 'selective_outline' | 'lineless';
  shadingStyle: 'flat' | 'basic' | 'medium' | 'detailed' | 'highly_detailed';
  detailLevel: 'low' | 'medium' | 'highly_detailed';
  canvasSize: 16 | 32 | 64 | 128 | 256; // 128/256 active, smaller sizes coming soon
  paletteMode: 'auto' | 'nes' | 'gameboy' | 'pico8' | 'custom';
  viewType: 'standard' | 'isometric';
}

export interface CharacterIdentity {
  character_id?: string;
  name: string;
  description?: string; // Original user prompt
  physical_description: {
    body_type: string;
    height_style: string;
    silhouette: string;
  };
  colour_palette: {
    primary: string;
    secondary: string;
    accent: string;
    skin: string;
    hair: string;
    outline: string;
    [key: string]: string;
  };
  distinctive_features: string[];
  style_parameters: StyleParameters;
  angle_specific_notes: {
    north: string;
    east: string;
    west: string;
    south: string;
  };
  createdAt: number;
  updatedAt: number;
}

export interface PixelData {
  name: string;
  width: number;
  height: number;
  palette: string[];
  pixels: string[]; // Array of hex codes or "transparent"
  normalMap: string[]; // Array of hex codes
}

export interface SpriteAsset {
  id: string;
  direction: Direction;
  data: PixelData;
  timestamp: number;
}

// ============================================
// Phase 1 Foundation Types
// ============================================

// Tab Navigation
export type TabId = 'character' | 'tile' | 'object' | 'texture' | 'compose' | 'library';

export interface TabConfig {
  id: TabId;
  label: string;
  icon: string; // Lucide icon name
}

// Canvas Tools
export type ToolMode = 'select' | 'draw' | 'erase' | 'fill' | 'eyedropper';

export interface CanvasState {
  tool: ToolMode;
  zoom: number;
  panX: number;
  panY: number;
  gridVisible: boolean;
  selectedColor: string;
}

// Generation Status
export type GenerationStatus = 'idle' | 'generating' | 'complete' | 'error';

// Gemini Configuration
export type GeminiModel =
  | 'gemini-2.5-flash-image'      // IMAGE model for volume/drafts
  | 'gemini-3-pro-image-preview'  // IMAGE model for quality/finals
  | 'gemini-2.5-flash'            // TEXT model for analysis
  | 'gemini-3-flash-preview';     // TEXT model for prompts

export type TaskType = 'identity' | 'sprite' | 'tile' | 'texture' | 'object';

export type QualityMode = 'draft' | 'balanced' | 'quality';

export interface GeminiConfig {
  model: GeminiModel;
  temperature: number;
  maxTokens?: number;
  thinkingLevel?: 'none' | 'low' | 'medium' | 'high';
}

// Asset Storage
export type AssetType = 'character' | 'tile' | 'object' | 'texture';

export interface Asset {
  id: string;
  type: AssetType;
  name: string;
  createdAt: number;
  updatedAt: number;
  thumbnail?: string; // Base64 data URL
  data: CharacterIdentity | PixelData;
  sprites?: SpriteAsset[]; // For characters with multiple directions
}
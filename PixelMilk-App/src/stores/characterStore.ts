import { create } from 'zustand';
import { Asset, CharacterIdentity, Direction, SpriteData, StyleParameters } from '../types';
import { clearSpriteSession, clearAllSpriteSessions, getSpriteSession } from '../services/gemini/client';
import { resizeAllSprites, type CanvasSize, type ResizeMode } from '../utils/spriteResize';

interface CharacterState {
  // Current working character
  currentIdentity: CharacterIdentity | null;
  currentSprites: Map<Direction, SpriteData>;
  lockedPalette: string[] | null;
  currentDirection: Direction;

  // Form state
  description: string;
  styleParams: StyleParameters;
  referenceImage: string | null; // base64
  referenceImageName: string | null;

  // UI State
  isGeneratingIdentity: boolean;
  isGeneratingSprite: boolean;
  error: string | null;

  // Session state (actual Chat objects stored in client.ts)
  hasActiveSession: boolean;

  // Actions
  setDescription: (desc: string) => void;
  setStyleParams: (params: Partial<StyleParameters>) => void;
  setReferenceImage: (image: string | null, name: string | null) => void;
  clearReferenceImage: () => void;
  setIdentity: (identity: CharacterIdentity | null) => void;
  addSprite: (direction: Direction, sprite: SpriteData) => void;
  updateSprite: (direction: Direction, sprite: SpriteData) => void;
  lockPalette: (palette: string[]) => void;
  unlockPalette: () => void;
  setCurrentDirection: (direction: Direction) => void;
  setGeneratingIdentity: (generating: boolean) => void;
  setGeneratingSprite: (generating: boolean) => void;
  setError: (error: string | null) => void;
  clearCharacter: () => void;
  loadCharacter: (asset: Asset) => void;

  // Session actions
  setHasActiveSession: (hasSession: boolean) => void;
  clearSession: () => void;
  clearAllSessions: () => void;
  checkSessionStatus: () => void;

  // Resize action
  resizeSprites: (newSize: CanvasSize, mode: ResizeMode) => void;
}

const defaultStyleParams: StyleParameters = {
  outlineStyle: 'black',
  shadingStyle: 'basic',
  detailLevel: 'medium',
  canvasSize: 128,
  paletteMode: 'rooted', // Default to 'rooted' - a versatile 16-colour palette
  viewType: 'standard',
};

export const useCharacterStore = create<CharacterState>((set, get) => ({
  currentIdentity: null,
  currentSprites: new Map(),
  lockedPalette: null,
  currentDirection: 'S',
  description: '',
  styleParams: defaultStyleParams,
  referenceImage: null,
  referenceImageName: null,
  isGeneratingIdentity: false,
  isGeneratingSprite: false,
  error: null,
  hasActiveSession: false,

  setDescription: (description) => set({ description }),

  setStyleParams: (params) =>
    set((state) => ({
      styleParams: { ...state.styleParams, ...params },
    })),

  setReferenceImage: (image, name) =>
    set({ referenceImage: image, referenceImageName: name }),

  clearReferenceImage: () =>
    set({ referenceImage: null, referenceImageName: null }),

  setIdentity: (identity) =>
    set({
      currentIdentity: identity,
      currentSprites: new Map(),
      lockedPalette: null,
      currentDirection: 'S',
    }),

  addSprite: (direction, sprite) =>
    set((state) => {
      const nextSprites = new Map(state.currentSprites);
      nextSprites.set(direction, sprite);
      return { currentSprites: nextSprites };
    }),

  updateSprite: (direction, sprite) =>
    set((state) => {
      const nextSprites = new Map(state.currentSprites);
      nextSprites.set(direction, sprite);
      return { currentSprites: nextSprites };
    }),

  lockPalette: (palette) => set({ lockedPalette: palette }),

  unlockPalette: () => set({ lockedPalette: null }),

  setCurrentDirection: (direction) => set({ currentDirection: direction }),

  setGeneratingIdentity: (generating) => set({ isGeneratingIdentity: generating }),

  setGeneratingSprite: (generating) => set({ isGeneratingSprite: generating }),

  setError: (error) => set({ error }),

  clearCharacter: () => {
    // Clear the chat session for this character
    const identity = get().currentIdentity;
    if (identity) {
      clearSpriteSession(identity.id);
    }

    set({
      currentIdentity: null,
      currentSprites: new Map(),
      lockedPalette: null,
      currentDirection: 'S',
      description: '',
      styleParams: defaultStyleParams,
      isGeneratingIdentity: false,
      isGeneratingSprite: false,
      error: null,
      hasActiveSession: false,
    });
  },

  loadCharacter: (asset: Asset) => {
    if (asset.type !== 'character' || !asset.identity) {
      console.warn('[characterStore] Cannot load non-character asset');
      return;
    }

    // Clear any existing session for the previous character
    const currentIdentity = get().currentIdentity;
    if (currentIdentity) {
      clearSpriteSession(currentIdentity.id);
    }

    // Reconstruct sprites map from the array
    const spritesMap = new Map<Direction, SpriteData>();
    if (asset.sprites) {
      for (const sprite of asset.sprites) {
        spritesMap.set(sprite.direction, sprite);
      }
    }

    // Extract locked palette from the first sprite if available
    const firstSprite = asset.sprites?.[0];
    const palette = firstSprite?.palette ?? null;

    set({
      currentIdentity: asset.identity,
      currentSprites: spritesMap,
      lockedPalette: palette,
      currentDirection: 'S',
      description: asset.identity.description,
      styleParams: asset.identity.styleParameters,
      isGeneratingIdentity: false,
      isGeneratingSprite: false,
      error: null,
      hasActiveSession: false, // New character, no session yet
    });
  },

  // Session management actions
  setHasActiveSession: (hasSession) => set({ hasActiveSession: hasSession }),

  clearSession: () => {
    const identity = get().currentIdentity;
    if (identity) {
      clearSpriteSession(identity.id);
      set({ hasActiveSession: false });
    }
  },

  clearAllSessions: () => {
    clearAllSpriteSessions();
    set({ hasActiveSession: false });
  },

  checkSessionStatus: () => {
    const identity = get().currentIdentity;
    if (identity) {
      const session = getSpriteSession(identity.id);
      set({ hasActiveSession: session !== null });
    } else {
      set({ hasActiveSession: false });
    }
  },

  resizeSprites: (newSize: CanvasSize, mode: ResizeMode) => {
    const { currentSprites, currentIdentity, styleParams } = get();

    if (currentSprites.size === 0) {
      console.warn('[characterStore] No sprites to resize');
      return;
    }

    // Resize all sprites
    const resizedSprites = resizeAllSprites(currentSprites, newSize, mode);

    // Update styleParams with new canvas size
    const newStyleParams = {
      ...styleParams,
      canvasSize: newSize as StyleParameters['canvasSize'],
    };

    // Update identity if present
    let updatedIdentity = currentIdentity;
    if (currentIdentity) {
      updatedIdentity = {
        ...currentIdentity,
        styleParameters: newStyleParams,
        updatedAt: Date.now(),
      };
    }

    set({
      currentSprites: resizedSprites,
      styleParams: newStyleParams,
      currentIdentity: updatedIdentity,
    });

    console.log(`[characterStore] Resized ${resizedSprites.size} sprites to ${newSize}px using ${mode} mode`);
  },
}));

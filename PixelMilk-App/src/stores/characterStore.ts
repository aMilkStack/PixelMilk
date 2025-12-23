import { create } from 'zustand';
import { Asset, CharacterIdentity, Direction, SpriteData, StyleParameters } from '../types';
import { clearSpriteSession, clearAllSpriteSessions, getSpriteSession } from '../services/gemini/client';

interface CharacterState {
  // Current working character
  currentIdentity: CharacterIdentity | null;
  currentSprites: Map<Direction, SpriteData>;
  lockedPalette: string[] | null;
  currentDirection: Direction;

  // Form state
  description: string;
  styleParams: StyleParameters;

  // UI State
  isGeneratingIdentity: boolean;
  isGeneratingSprite: boolean;
  error: string | null;

  // Session state (actual Chat objects stored in client.ts)
  hasActiveSession: boolean;

  // Actions
  setDescription: (desc: string) => void;
  setStyleParams: (params: Partial<StyleParameters>) => void;
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
}

const defaultStyleParams: StyleParameters = {
  outlineStyle: 'black',
  shadingStyle: 'basic',
  detailLevel: 'medium',
  canvasSize: 128,
  paletteMode: 'auto',
  viewType: 'standard',
};

export const useCharacterStore = create<CharacterState>((set, get) => ({
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

  setDescription: (description) => set({ description }),

  setStyleParams: (params) =>
    set((state) => ({
      styleParams: { ...state.styleParams, ...params },
    })),

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
}));

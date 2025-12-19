import { create } from 'zustand';
import { CharacterIdentity, Direction, SpriteAsset, StyleParameters } from '../types';

interface CharacterState {
  // Input
  description: string;
  styleParams: StyleParameters;

  // Generated
  identity: CharacterIdentity | null;
  sprites: SpriteAsset[];
  currentDirection: Direction;

  // UI State
  isGeneratingIdentity: boolean;
  isGeneratingSprite: boolean;
  error: string | null;

  // Actions
  setDescription: (desc: string) => void;
  setStyleParams: (params: Partial<StyleParameters>) => void;
  setIdentity: (identity: CharacterIdentity | null) => void;
  addSprite: (sprite: SpriteAsset) => void;
  setCurrentDirection: (direction: Direction) => void;
  setGeneratingIdentity: (generating: boolean) => void;
  setGeneratingSprite: (generating: boolean) => void;
  setError: (error: string | null) => void;
  clearCharacter: () => void;
}

const defaultStyleParams: StyleParameters = {
  outlineStyle: 'single_color_black',
  shadingStyle: 'medium',
  detailLevel: 'medium',
  canvasSize: 128, // Default to 128x128 for gameplay sprites
  paletteMode: 'auto',
  viewType: 'standard',
};

export const useCharacterStore = create<CharacterState>((set) => ({
  // Input
  description: '',
  styleParams: defaultStyleParams,

  // Generated
  identity: null,
  sprites: [],
  currentDirection: 'S',

  // UI State
  isGeneratingIdentity: false,
  isGeneratingSprite: false,
  error: null,

  // Actions
  setDescription: (desc) => set({ description: desc }),

  setStyleParams: (params) =>
    set((state) => ({
      styleParams: { ...state.styleParams, ...params }
    })),

  setIdentity: (identity) => set({ identity }),

  addSprite: (sprite) =>
    set((state) => ({
      sprites: [...state.sprites, sprite]
    })),

  setCurrentDirection: (direction) => set({ currentDirection: direction }),

  setGeneratingIdentity: (generating) =>
    set({ isGeneratingIdentity: generating }),

  setGeneratingSprite: (generating) =>
    set({ isGeneratingSprite: generating }),

  setError: (error) => set({ error }),

  clearCharacter: () =>
    set({
      description: '',
      styleParams: defaultStyleParams,
      identity: null,
      sprites: [],
      currentDirection: 'S',
      isGeneratingIdentity: false,
      isGeneratingSprite: false,
      error: null,
    }),
}));

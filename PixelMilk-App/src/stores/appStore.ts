import { create } from 'zustand';
import { TabId, GenerationStatus } from '../types';

interface AppState {
  // API Key
  apiKey: string | null;
  setApiKey: (key: string | null) => void;

  // Active Tab
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;

  // Generation Status
  generationStatus: GenerationStatus;
  generationMessage: string;
  setGenerationStatus: (status: GenerationStatus, message?: string) => void;

  // Modal State
  isApiKeyModalOpen: boolean;
  openApiKeyModal: () => void;
  closeApiKeyModal: () => void;

  // Error State
  error: string | null;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  // API Key
  apiKey: null,
  setApiKey: (key) => set({ apiKey: key }),

  // Active Tab
  activeTab: 'character',
  setActiveTab: (tab) => set({ activeTab: tab }),

  // Generation Status
  generationStatus: 'idle',
  generationMessage: '',
  setGenerationStatus: (status, message = '') =>
    set({ generationStatus: status, generationMessage: message }),

  // Modal State
  isApiKeyModalOpen: false,
  openApiKeyModal: () => set({ isApiKeyModalOpen: true }),
  closeApiKeyModal: () => set({ isApiKeyModalOpen: false }),

  // Error State
  error: null,
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}));

import { create } from 'zustand';
import { TabId, GenerationStatus } from '../types';

export type ApiKeyStatus = 'unknown' | 'valid' | 'invalid' | 'error';

interface AppState {
  // API Key
  apiKey: string | null;
  setApiKey: (key: string | null) => void;

  // API Key Status (U6: API Status Indicator)
  apiKeyStatus: ApiKeyStatus;
  setApiKeyStatus: (status: ApiKeyStatus) => void;

  // Active Tab
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;

  // Generation Status
  generationStatus: GenerationStatus;
  setGenerationStatus: (status: Partial<GenerationStatus>) => void;
  resetGenerationStatus: () => void;

  // Modal State
  isApiKeyModalOpen: boolean;
  openApiKeyModal: () => void;
  closeApiKeyModal: () => void;

  // Error State
  error: string | null;
  setError: (error: string | null) => void;
  clearError: () => void;
}

const initialGenerationStatus: GenerationStatus = {
  isGenerating: false,
  progress: 0,
  stage: '',
};

export const useAppStore = create<AppState>((set) => ({
  // API Key
  apiKey: null,
  setApiKey: (key) => set({ apiKey: key }),

  // API Key Status (U6: API Status Indicator)
  apiKeyStatus: 'unknown',
  setApiKeyStatus: (status) => set({ apiKeyStatus: status }),

  // Active Tab
  activeTab: 'character',
  setActiveTab: (tab) => set({ activeTab: tab }),

  // Generation Status
  generationStatus: initialGenerationStatus,
  setGenerationStatus: (status) =>
    set((state) => ({
      generationStatus: { ...state.generationStatus, ...status },
    })),
  resetGenerationStatus: () => set({ generationStatus: initialGenerationStatus }),

  // Modal State
  isApiKeyModalOpen: false,
  openApiKeyModal: () => set({ isApiKeyModalOpen: true }),
  closeApiKeyModal: () => set({ isApiKeyModalOpen: false }),

  // Error State
  error: null,
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}));

import { create } from 'zustand';

export type CharacterStage = 'configure' | 'describe' | 'identity' | 'canvas' | 'finalise';

interface StageState {
  currentStage: CharacterStage;
  completedStages: Set<CharacterStage>;
  isTransitioning: boolean;
}

interface CharacterStageStore extends StageState {
  // Navigation
  goToStage: (stage: CharacterStage) => void;
  nextStage: () => void;
  previousStage: () => void;

  // Stage completion
  completeStage: (stage: CharacterStage) => void;
  uncompleteStage: (stage: CharacterStage) => void;

  // Transition state (for animations)
  setTransitioning: (isTransitioning: boolean) => void;

  // Helpers
  canNavigateTo: (stage: CharacterStage) => boolean;
  isStageCompleted: (stage: CharacterStage) => boolean;
  isStageAccessible: (stage: CharacterStage) => boolean;

  // Reset
  resetStages: () => void;
}

const STAGE_ORDER: CharacterStage[] = ['configure', 'describe', 'identity', 'canvas', 'finalise'];

const getStageIndex = (stage: CharacterStage): number => STAGE_ORDER.indexOf(stage);

const initialState: StageState = {
  currentStage: 'configure',
  completedStages: new Set<CharacterStage>(),
  isTransitioning: false,
};

export const useCharacterStageStore = create<CharacterStageStore>((set, get) => ({
  ...initialState,

  goToStage: (stage) => {
    const { canNavigateTo, isTransitioning } = get();
    if (isTransitioning || !canNavigateTo(stage)) return;

    set({ isTransitioning: true });

    // Short delay for transition animation
    setTimeout(() => {
      set({ currentStage: stage, isTransitioning: false });
    }, 50);
  },

  nextStage: () => {
    const { currentStage, completeStage } = get();
    const currentIndex = getStageIndex(currentStage);
    const nextIndex = currentIndex + 1;

    if (nextIndex < STAGE_ORDER.length) {
      // Complete current stage before moving
      completeStage(currentStage);
      get().goToStage(STAGE_ORDER[nextIndex]!);
    }
  },

  previousStage: () => {
    const { currentStage, goToStage } = get();
    const currentIndex = getStageIndex(currentStage);
    const prevIndex = currentIndex - 1;

    if (prevIndex >= 0) {
      goToStage(STAGE_ORDER[prevIndex]!);
    }
  },

  completeStage: (stage) => {
    set((state) => ({
      completedStages: new Set([...state.completedStages, stage]),
    }));
  },

  uncompleteStage: (stage) => {
    set((state) => {
      const newCompleted = new Set(state.completedStages);
      newCompleted.delete(stage);
      return { completedStages: newCompleted };
    });
  },

  setTransitioning: (isTransitioning) => set({ isTransitioning }),

  canNavigateTo: (stage) => {
    const { completedStages, currentStage } = get();

    // Can always go to current stage
    if (stage === currentStage) return true;

    // Can go to any completed stage
    if (completedStages.has(stage)) return true;

    // Can go to the next stage if current is completed
    const currentIndex = getStageIndex(currentStage);
    const targetIndex = getStageIndex(stage);

    if (targetIndex === currentIndex + 1 && completedStages.has(currentStage)) {
      return true;
    }

    // Configure is always accessible
    if (stage === 'configure') return true;

    return false;
  },

  isStageCompleted: (stage) => get().completedStages.has(stage),

  isStageAccessible: (stage) => {
    const { completedStages } = get();
    const stageIndex = getStageIndex(stage);

    // First stage always accessible
    if (stageIndex === 0) return true;

    // Stage is accessible if the previous stage is completed
    const previousStage = STAGE_ORDER[stageIndex - 1];
    return previousStage ? completedStages.has(previousStage) : false;
  },

  resetStages: () => set(initialState),
}));

// Export stage order for external use
export { STAGE_ORDER, getStageIndex };

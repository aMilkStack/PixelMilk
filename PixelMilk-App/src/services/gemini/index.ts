/**
 * Gemini Service Barrel Export
 *
 * Provides centralized access to Gemini-related utilities and configuration.
 */

export { initializeClient, getClient, isClientInitialized, validateApiKey } from './client';
export { generateContent, generateStructuredContent, generateImage, editImage, generateSegmentationMask } from './client';
export {
  createSpriteSession,
  getSpriteSession,
  clearSpriteSession,
  clearAllSpriteSessions,
  sendSpriteMessage,
  restoreSpriteSession,
} from './client';
export { getModelForTask, getConfigForTask } from './modelRouter';
export * from './schemas';

export {
  generateCharacterIdentity,
  generateSprite,
  generateRotatedSprite,
  generateRotatedSpriteLegacy,
  optimizePrompt,
} from './geminiService';

export { applyHotspotEdit } from './editing';

// Re-export types for consumers
export type { ReferenceImage, OptimizedPromptResult } from './geminiService';

/**
 * Gemini Service Barrel Export
 *
 * Provides centralized access to Gemini-related utilities and configuration.
 */

export { initializeClient, getClient, isClientInitialized, validateApiKey } from './client';
export { generateContent, generateStructuredContent, generateImage, editImage } from './client';
export { getModelForTask, getConfigForTask } from './modelRouter';
export * from './schemas';

export {
  generateCharacterIdentity,
  generateSprite,
  generateRotatedSprite,
} from './geminiService';

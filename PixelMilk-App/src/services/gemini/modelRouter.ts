/**
 * Model Router for Gemini API
 *
 * Provides intelligent model selection and configuration based on task type
 * and quality requirements. This ensures optimal model usage:
 * - Pro models for complex reasoning tasks (identity generation)
 * - Flash models for faster, simpler pixel generation tasks
 */

import type { TaskType, QualityMode, GeminiModel, GeminiConfig } from '../../types';

/**
 * Model selection constants
 */
const MODELS = {
  PRO: 'gemini-3-pro-preview' as GeminiModel,
  FLASH: 'gemini-3-flash' as GeminiModel,
} as const;

/**
 * Temperature settings for different task categories
 * - Creative tasks (identity): higher temperature for more variety
 * - Pixel generation: lower temperature for precision and consistency
 */
const TEMPERATURE = {
  CREATIVE: 0.7,
  PRECISE: 0.3,
} as const;

/**
 * Max token limits based on task complexity
 */
const MAX_TOKENS = {
  IDENTITY: 4096, // Complex JSON with detailed descriptions
  QUALITY_PIXEL: 8192, // Large pixel arrays with normal maps
  BALANCED_PIXEL: 4096, // Standard pixel generation
  DRAFT_PIXEL: 2048, // Quick drafts with smaller output
} as const;

/**
 * Determines which Gemini model to use based on task type and quality mode.
 *
 * Model Selection Logic:
 * - Identity tasks: Always use Pro (requires complex reasoning for character analysis)
 * - Pixel generation (sprite/tile/texture/object):
 *   - Draft: Flash (speed priority)
 *   - Balanced: Flash (good balance of speed and quality)
 *   - Quality: Pro (best output quality)
 *
 * @param taskType - The type of generation task
 * @param quality - The quality/speed tradeoff preference
 * @returns The appropriate Gemini model identifier
 */
export function getModelForTask(taskType: TaskType, quality: QualityMode): GeminiModel {
  // Identity generation always requires Pro for complex reasoning
  if (taskType === 'identity') {
    return MODELS.PRO;
  }

  // Pixel generation tasks (sprite, tile, texture, object)
  switch (quality) {
    case 'draft':
    case 'balanced':
      return MODELS.FLASH;
    case 'quality':
      return MODELS.PRO;
    default:
      // TypeScript exhaustive check
      const _exhaustive: never = quality;
      return MODELS.FLASH;
  }
}

/**
 * Determines the thinking level based on task type and quality mode.
 *
 * Thinking Level Logic:
 * - Identity: High (needs deep analysis of character descriptions)
 * - Quality pixel gen: Medium (benefits from some deliberation)
 * - Draft/Balanced pixel gen: Low (prioritize speed)
 *
 * @param taskType - The type of generation task
 * @param quality - The quality/speed tradeoff preference
 * @returns The appropriate thinking level
 */
function getThinkingLevel(
  taskType: TaskType,
  quality: QualityMode
): 'none' | 'low' | 'medium' | 'high' {
  if (taskType === 'identity') {
    return 'high';
  }

  switch (quality) {
    case 'quality':
      return 'medium';
    case 'balanced':
    case 'draft':
      return 'low';
    default:
      return 'low';
  }
}

/**
 * Determines the appropriate temperature for a task.
 *
 * @param taskType - The type of generation task
 * @returns Temperature value (0.0 - 1.0)
 */
function getTemperature(taskType: TaskType): number {
  // Identity generation benefits from creative variety
  if (taskType === 'identity') {
    return TEMPERATURE.CREATIVE;
  }

  // Pixel generation needs precision and consistency
  return TEMPERATURE.PRECISE;
}

/**
 * Determines the max token limit based on task type and quality.
 *
 * @param taskType - The type of generation task
 * @param quality - The quality/speed tradeoff preference
 * @returns Maximum tokens for the response
 */
function getMaxTokens(taskType: TaskType, quality: QualityMode): number {
  if (taskType === 'identity') {
    return MAX_TOKENS.IDENTITY;
  }

  switch (quality) {
    case 'quality':
      return MAX_TOKENS.QUALITY_PIXEL;
    case 'balanced':
      return MAX_TOKENS.BALANCED_PIXEL;
    case 'draft':
      return MAX_TOKENS.DRAFT_PIXEL;
    default:
      return MAX_TOKENS.BALANCED_PIXEL;
  }
}

/**
 * Gets the complete Gemini configuration for a specific task and quality mode.
 *
 * This function combines model selection with appropriate parameters to create
 * an optimal configuration for the given task requirements.
 *
 * @param taskType - The type of generation task
 * @param quality - The quality/speed tradeoff preference
 * @returns Complete GeminiConfig object ready for API calls
 *
 * @example
 * ```typescript
 * // Get config for character identity generation
 * const identityConfig = getConfigForTask('identity', 'quality');
 * // Returns: { model: 'gemini-3-pro-preview', temperature: 0.7, maxTokens: 4096, thinkingLevel: 'high' }
 *
 * // Get config for quick sprite draft
 * const draftConfig = getConfigForTask('sprite', 'draft');
 * // Returns: { model: 'gemini-3-flash', temperature: 0.3, maxTokens: 2048, thinkingLevel: 'low' }
 * ```
 */
export function getConfigForTask(taskType: TaskType, quality: QualityMode): GeminiConfig {
  return {
    model: getModelForTask(taskType, quality),
    temperature: getTemperature(taskType),
    maxTokens: getMaxTokens(taskType, quality),
    thinkingLevel: getThinkingLevel(taskType, quality),
  };
}

/**
 * Type guard to check if a string is a valid TaskType
 */
export function isValidTaskType(value: string): value is TaskType {
  return ['identity', 'sprite', 'tile', 'texture', 'object'].includes(value);
}

/**
 * Type guard to check if a string is a valid QualityMode
 */
export function isValidQualityMode(value: string): value is QualityMode {
  return ['draft', 'balanced', 'quality'].includes(value);
}

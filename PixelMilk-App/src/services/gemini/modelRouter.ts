/**
 * Model Router for Gemini API
 *
 * Provides model selection and configuration based on task type and quality.
 *
 * CRITICAL ROUTING RULES (from NotebookLM analysis):
 * - GENERATION tasks (new sprites, tiles, textures) -> Pro Image (uses "Thinking" for anatomy/physics)
 * - EDITING tasks (inpainting, hotspot edits, co-drawing) -> Flash Image (fast iteration)
 * - TEXT tasks (identity analysis, structured output) -> Flash Preview
 */

import type { TaskType, QualityMode, GeminiModel, GeminiConfig } from '../../types';

// ============================================
// Model Constants
// ============================================
// NOTE: These model identifiers should be updated when Google releases new Gemini models
// or deprecates existing ones. Check the Gemini API documentation for current model names:
// https://ai.google.dev/models/gemini
//
// Last updated: 2025-12 (Gemini 3.x preview models)
// ============================================

/** Pro Image - for GENERATION (uses "Thinking" process for better anatomy/physics) */
const IMAGE_GENERATION_MODEL: GeminiModel = 'gemini-3-pro-image-preview';

/** Flash Image - for EDITING ONLY (fast iteration, inpainting, hotspot edits) */
const IMAGE_EDITING_MODEL: GeminiModel = 'gemini-2.5-flash-image';

/** Text models - Flash Preview for structured output */
const TEXT_MODEL: GeminiModel = 'gemini-3-flash-preview';

/** All valid model identifiers - keep in sync with GeminiModel type in types.ts */
const VALID_MODELS: readonly GeminiModel[] = [
  'gemini-2.5-flash-image',
  'gemini-3-pro-image-preview',
  'gemini-2.5-flash',
  'gemini-3-flash-preview',
] as const;

export function getModelForTask(task: TaskType, _quality: QualityMode = 'draft'): GeminiModel {
  switch (task) {
    // EDITING tasks use Flash (fast, for iteration)
    case 'edit-localised':
      return IMAGE_EDITING_MODEL;

    // GENERATION tasks use Pro (better anatomy, "Thinking" process)
    case 'tile':
    case 'texture':
    case 'animation-frame':
    case 'perspective-shift':
    case 'style-transfer':
    case 'composite':
    case 'sprite-draft':
    case 'sprite-final':
      return IMAGE_GENERATION_MODEL;

    // Text/JSON tasks use Flash Preview
    case 'text-analysis':
      return TEXT_MODEL;

    default:
      return IMAGE_GENERATION_MODEL;
  }
}

/**
 * Options for getConfigForTask
 */
export interface ConfigOptions {
  /** Whether this is a rotation/angle generation (uses lower temperature for consistency) */
  isRotation?: boolean;
}

export function getConfigForTask(
  task: TaskType,
  quality: QualityMode = 'draft',
  options: ConfigOptions = {}
): GeminiConfig {
  const { isRotation = false } = options;
  const model = getModelForTask(task, quality);
  const isImageModel = model === IMAGE_GENERATION_MODEL || model === IMAGE_EDITING_MODEL;
  const isProModel = model === IMAGE_GENERATION_MODEL;

  // Temperature strategy (NotebookLM best practice):
  // - 1.0 for initial generation (creative exploration)
  // - 0.8 for rotations/angles (consistency with reference)
  // - 0.3 for text/JSON (deterministic structured output)
  let temperature: number;
  if (task === 'text-analysis') {
    temperature = 0.3;
  } else if (isRotation) {
    temperature = 0.8; // Lower for consistency with reference images
  } else {
    temperature = 1.0; // Default for Gemini 3 (Google recommended)
  }

  const config: GeminiConfig = {
    model,
    temperature,
  };

  // Add thinkingLevel for text models (3 Flash Preview supports it)
  if (!isImageModel) {
    config.thinkingLevel = quality === 'final' ? 'high' : 'low';
  }

  // Pro Image supports mediaResolution for reference images
  if (isProModel) {
    if (task === 'perspective-shift' || task === 'composite') {
      config.mediaResolution = 'high';
    }
  }

  // Flash Image (editing) uses medium resolution
  if (model === IMAGE_EDITING_MODEL) {
    config.mediaResolution = 'medium';
  }

  return config;
}

export function isValidTaskType(value: string): value is TaskType {
  return [
    'sprite-draft',
    'sprite-final',
    'tile',
    'texture',
    'perspective-shift',
    'style-transfer',
    'edit-localised',
    'animation-frame',
    'composite',
    'text-analysis',
  ].includes(value);
}

export function isValidQualityMode(value: string): value is QualityMode {
  return ['draft', 'final'].includes(value);
}

/**
 * Validates if a model string is a known valid model.
 * Useful for runtime validation of model names.
 */
export function isValidModel(value: string): value is GeminiModel {
  return VALID_MODELS.includes(value as GeminiModel);
}

/**
 * Returns all valid model identifiers.
 * Useful for UI dropdowns or debugging.
 */
export function getValidModels(): readonly GeminiModel[] {
  return VALID_MODELS;
}

/**
 * Returns the default model for each category.
 * Useful for fallback behavior or configuration defaults.
 */
export function getDefaultModels(): {
  imageGeneration: GeminiModel;
  imageEditing: GeminiModel;
  text: GeminiModel;
} {
  return {
    imageGeneration: IMAGE_GENERATION_MODEL,
    imageEditing: IMAGE_EDITING_MODEL,
    text: TEXT_MODEL,
  };
}

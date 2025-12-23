import { GoogleGenAI, Modality, ThinkingLevel, PartMediaResolutionLevel } from '@google/genai';
import type { Chat, Content, Part, GenerateContentResponse } from '@google/genai';
import type { GeminiConfig } from '../../types';
import {
  characterIdentitySchema,
  pixelDataSchema,
  promptSuggestionSchema,
} from './schemas';

let clientInstance: GoogleGenAI | null = null;

/**
 * Maps our string-based thinkingLevel to SDK enum values
 */
function mapThinkingLevel(level: 'minimal' | 'low' | 'medium' | 'high'): ThinkingLevel {
  const mapping: Record<string, ThinkingLevel> = {
    minimal: ThinkingLevel.MINIMAL,
    low: ThinkingLevel.LOW,
    medium: ThinkingLevel.MEDIUM,
    high: ThinkingLevel.HIGH,
  };
  return mapping[level] ?? ThinkingLevel.LOW;
}

/**
 * Maps our string-based mediaResolution to SDK enum values
 */
function mapMediaResolution(level: 'low' | 'medium' | 'high'): PartMediaResolutionLevel {
  const mapping: Record<string, PartMediaResolutionLevel> = {
    low: PartMediaResolutionLevel.MEDIA_RESOLUTION_LOW,
    medium: PartMediaResolutionLevel.MEDIA_RESOLUTION_MEDIUM,
    high: PartMediaResolutionLevel.MEDIA_RESOLUTION_HIGH,
  };
  return mapping[level] ?? PartMediaResolutionLevel.MEDIA_RESOLUTION_MEDIUM;
}

// ============================================
// Rate Limit Handling & Retry Logic
// ============================================

/** Default retry configuration for rate-limited requests */
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
} as const;

/**
 * Extracts retry delay from an error if available.
 * The @google/genai SDK may include retry-after information in error details.
 */
function getRetryDelayFromError(error: unknown): number | null {
  if (error && typeof error === 'object') {
    // Check for retryAfter property in error details
    const errorObj = error as Record<string, unknown>;

    // SDK may expose retry-after in various ways
    if ('retryAfter' in errorObj && typeof errorObj.retryAfter === 'number') {
      return errorObj.retryAfter * 1000; // Convert seconds to ms
    }

    // Check for headers or details property
    if ('details' in errorObj && typeof errorObj.details === 'object') {
      const details = errorObj.details as Record<string, unknown>;
      if ('retryAfter' in details && typeof details.retryAfter === 'number') {
        return details.retryAfter * 1000;
      }
    }

    // Check message for retry-after hints
    if ('message' in errorObj && typeof errorObj.message === 'string') {
      const match = errorObj.message.match(/retry after (\d+)/i);
      if (match) {
        return parseInt(match[1], 10) * 1000;
      }
    }
  }
  return null;
}

/**
 * Checks if an error is a rate limit (429) error.
 */
function isRateLimitError(error: unknown): boolean {
  if (error && typeof error === 'object') {
    const errorObj = error as Record<string, unknown>;

    // Check status code
    if ('status' in errorObj && errorObj.status === 429) {
      return true;
    }
    if ('code' in errorObj && errorObj.code === 429) {
      return true;
    }

    // Check error message
    if ('message' in errorObj && typeof errorObj.message === 'string') {
      const message = errorObj.message.toLowerCase();
      return message.includes('rate limit') ||
             message.includes('429') ||
             message.includes('too many requests') ||
             message.includes('quota exceeded');
    }
  }
  return false;
}

/**
 * Calculates exponential backoff delay with jitter.
 */
function calculateBackoffDelay(attempt: number): number {
  const delay = Math.min(
    RETRY_CONFIG.baseDelayMs * Math.pow(2, attempt),
    RETRY_CONFIG.maxDelayMs
  );
  // Add jitter (0-25% of delay)
  const jitter = delay * Math.random() * 0.25;
  return Math.floor(delay + jitter);
}

/**
 * Wraps an async function with retry logic for rate limit handling.
 * Uses Retry-After header if available, otherwise exponential backoff.
 */
async function withRateLimitRetry<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (!isRateLimitError(error)) {
        // Not a rate limit error, don't retry
        throw error;
      }

      if (attempt === RETRY_CONFIG.maxRetries) {
        console.error(`[Gemini] Rate limit: ${operationName} failed after ${RETRY_CONFIG.maxRetries} retries`);
        throw error;
      }

      // Get delay from error or use exponential backoff
      const retryAfterDelay = getRetryDelayFromError(error);
      const delay = retryAfterDelay ?? calculateBackoffDelay(attempt);

      console.warn(
        `[Gemini] Rate limited on ${operationName}, ` +
        `attempt ${attempt + 1}/${RETRY_CONFIG.maxRetries}, ` +
        `retrying in ${Math.round(delay / 1000)}s` +
        (retryAfterDelay ? ' (from Retry-After)' : ' (exponential backoff)')
      );

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // Should never reach here, but TypeScript needs this
  throw lastError;
}

export function initializeClient(apiKey: string): GoogleGenAI {
  // Clean up previous instance before creating new one
  if (clientInstance !== null) {
    clientInstance = null;
  }
  clientInstance = new GoogleGenAI({ apiKey });
  return clientInstance;
}

export function destroyClient(): void {
  clientInstance = null;
}

export function getClient(): GoogleGenAI {
  if (!clientInstance) {
    throw new Error('Gemini client not initialized. Call initializeClient first.');
  }
  return clientInstance;
}

export function isClientInitialized(): boolean {
  return clientInstance !== null;
}

/**
 * Validates an API key by making a minimal test request.
 * Returns true if valid, false if invalid.
 */
export async function validateApiKey(apiKey: string): Promise<boolean> {
  try {
    const testClient = new GoogleGenAI({ apiKey });
    // Make a minimal request to validate the key
    // Using a very short prompt with minimal tokens
    const response = await testClient.models.generateContent({
      model: 'gemini-2.0-flash-lite',
      contents: 'Say "ok"',
      config: {
        maxOutputTokens: 5,
      },
    });
    // If we get any response, the key is valid
    return response.text !== undefined;
  } catch (error) {
    console.warn('API key validation failed:', error);
    return false;
  }
}

export async function generateContent(
  prompt: string,
  config: GeminiConfig,
  systemInstruction?: string
): Promise<string> {
  const client = getClient();

  return withRateLimitRetry(async () => {
    const response = await client.models.generateContent({
      model: config.model,
      contents: prompt,
      config: {
        temperature: config.temperature,
        ...(systemInstruction && { systemInstruction }),
        ...(config.thinkingLevel && {
          thinkingConfig: { thinkingLevel: mapThinkingLevel(config.thinkingLevel) },
        }),
      },
    });

    return response.text ?? '';
  }, 'generateContent');
}

export async function generateStructuredContent<T>(
  prompt: string,
  config: GeminiConfig,
  schema: 'pixelData' | 'characterIdentity' | 'promptSuggestion',
  systemInstruction?: string
): Promise<T> {
  const client = getClient();

  const schemaMap = {
    pixelData: pixelDataSchema,
    characterIdentity: characterIdentitySchema,
    promptSuggestion: promptSuggestionSchema,
  };

  return withRateLimitRetry(async () => {
    const response = await client.models.generateContent({
      model: config.model,
      contents: prompt,
      config: {
        temperature: config.temperature,
        responseMimeType: 'application/json',
        responseSchema: schemaMap[schema],
        ...(systemInstruction && { systemInstruction }),
        ...(config.thinkingLevel && {
          thinkingConfig: { thinkingLevel: mapThinkingLevel(config.thinkingLevel) },
        }),
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error('No response from model');
    }

    return JSON.parse(text) as T;
  }, 'generateStructuredContent');
}

export async function generateImage(
  prompt: string,
  config: GeminiConfig,
  systemInstruction?: string
): Promise<{ imageData: string; mimeType: string }> {
  const client = getClient();

  return withRateLimitRetry(async () => {
    const response = await client.models.generateContent({
      model: config.model,
      contents: prompt,
      config: {
        temperature: config.temperature,
        responseModalities: [Modality.IMAGE],
        ...(systemInstruction && { systemInstruction }),
        ...(config.thinkingLevel && {
          thinkingConfig: { thinkingLevel: mapThinkingLevel(config.thinkingLevel) },
        }),
      },
    });

    // Check for empty or missing candidates
    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) {
      // Check for prompt feedback indicating content was blocked
      const promptFeedback = response.promptFeedback;
      if (promptFeedback?.blockReason) {
        throw new Error(`Content blocked: ${promptFeedback.blockReason}. Try a different prompt.`);
      }
      throw new Error('No response from model. The request may have been filtered.');
    }

    const candidate = candidates[0];

    // Check for finish reason indicating refusal or safety filtering
    const finishReason = candidate.finishReason;
    if (finishReason === 'SAFETY') {
      throw new Error('Image generation blocked by safety filter. Try a different prompt.');
    }
    if (finishReason === 'RECITATION') {
      throw new Error('Content blocked due to recitation policy. Try a different prompt.');
    }
    if (finishReason === 'OTHER') {
      throw new Error('Image generation stopped unexpectedly. Please try again.');
    }

    const parts = candidate.content?.parts ?? [];
    const imagePart = parts.find((part) => part.inlineData);

    if (!imagePart?.inlineData) {
      // Check if there's text explaining why no image was generated
      const textPart = parts.find((part) => part.text);
      if (textPart?.text) {
        throw new Error(`Model refused to generate image: ${textPart.text.slice(0, 100)}`);
      }
      throw new Error('No image in response. The model may have refused the request.');
    }

    return {
      imageData: imagePart.inlineData.data,
      mimeType: imagePart.inlineData.mimeType,
    };
  }, 'generateImage');
}

export async function editImage(
  prompt: string,
  referenceImageBase64: string,
  mimeType: string,
  config: GeminiConfig,
  systemInstruction?: string
): Promise<{ imageData: string; mimeType: string }> {
  const client = getClient();

  return withRateLimitRetry(async () => {
    const response = await client.models.generateContent({
      model: config.model,
      contents: {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType,
              data: referenceImageBase64.replace(/^data:image\/\w+;base64,/, ''),
            },
            ...(config.mediaResolution && {
              mediaResolution: { level: mapMediaResolution(config.mediaResolution) },
            }),
          },
        ],
      },
      config: {
        temperature: config.temperature,
        responseModalities: [Modality.IMAGE],
        ...(systemInstruction && { systemInstruction }),
        ...(config.thinkingLevel && {
          thinkingConfig: { thinkingLevel: mapThinkingLevel(config.thinkingLevel) },
        }),
      },
    });

    // Check for empty or missing candidates
    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) {
      // Check for prompt feedback indicating content was blocked
      const promptFeedback = response.promptFeedback;
      if (promptFeedback?.blockReason) {
        throw new Error(`Content blocked: ${promptFeedback.blockReason}. Try a different prompt.`);
      }
      throw new Error('No response from model. The request may have been filtered.');
    }

    const candidate = candidates[0];

    // Check for finish reason indicating refusal or safety filtering
    const finishReason = candidate.finishReason;
    if (finishReason === 'SAFETY') {
      throw new Error('Image edit blocked by safety filter. Try a different prompt.');
    }
    if (finishReason === 'RECITATION') {
      throw new Error('Content blocked due to recitation policy. Try a different prompt.');
    }
    if (finishReason === 'OTHER') {
      throw new Error('Image edit stopped unexpectedly. Please try again.');
    }

    const parts = candidate.content?.parts ?? [];
    const imagePart = parts.find((part) => part.inlineData);

    if (!imagePart?.inlineData) {
      // Check if there's text explaining why no image was generated
      const textPart = parts.find((part) => part.text);
      if (textPart?.text) {
        throw new Error(`Model refused to edit image: ${textPart.text.slice(0, 100)}`);
      }
      throw new Error('No image in response. The model may have refused the request.');
    }

    return {
      imageData: imagePart.inlineData.data,
      mimeType: imagePart.inlineData.mimeType,
    };
  }, 'editImage');
}

// ============================================
// Chat Session Management for Multi-Turn Generation
// ============================================
// Using the SDK's chat feature automatically handles thought signatures
// (encrypted context) between turns, preserving model reasoning.

/** Active chat sessions, keyed by character ID */
const activeSessions = new Map<string, Chat>();

/**
 * Creates a new chat session for multi-turn sprite generation.
 * The chat preserves thought signatures between turns automatically.
 */
export function createSpriteSession(
  characterId: string,
  model: string,
  systemInstruction?: string
): Chat {
  const client = getClient();

  // Close any existing session for this character
  if (activeSessions.has(characterId)) {
    activeSessions.delete(characterId);
  }

  const chat = client.chats.create({
    model,
    config: {
      responseModalities: [Modality.IMAGE],
      ...(systemInstruction && { systemInstruction }),
    },
  });

  activeSessions.set(characterId, chat);
  return chat;
}

/**
 * Gets an existing chat session for a character.
 */
export function getSpriteSession(characterId: string): Chat | null {
  return activeSessions.get(characterId) ?? null;
}

/**
 * Clears the chat session for a character.
 */
export function clearSpriteSession(characterId: string): void {
  activeSessions.delete(characterId);
}

/**
 * Clears all active chat sessions.
 */
export function clearAllSpriteSessions(): void {
  activeSessions.clear();
}

/**
 * Sends a message to an existing chat session with reference images.
 * Automatically handles thought signatures.
 */
export async function sendSpriteMessage(
  chat: Chat,
  prompt: string,
  referenceImages?: Array<{ data: string; mimeType: string }>
): Promise<{ imageData: string; mimeType: string }> {
  return withRateLimitRetry(async () => {
    // Build message parts: text prompt + any reference images
    const parts: Part[] = [];

    // Add reference images first (labelled in prompt)
    if (referenceImages && referenceImages.length > 0) {
      for (const img of referenceImages) {
        parts.push({
          inlineData: {
            mimeType: img.mimeType,
            data: img.data,
          },
        });
      }
    }

    // Add text prompt
    parts.push({ text: prompt });

    // sendMessage takes { message: parts } format
    const response: GenerateContentResponse = await chat.sendMessage({ message: parts });

    // Extract image from response
    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) {
      const promptFeedback = response.promptFeedback;
      if (promptFeedback?.blockReason) {
        throw new Error(`Content blocked: ${promptFeedback.blockReason}`);
      }
      throw new Error('No response from model');
    }

    const candidate = candidates[0];
    const finishReason = candidate.finishReason;

    if (finishReason === 'SAFETY') {
      throw new Error('Image generation blocked by safety filter');
    }

    const responseParts = candidate.content?.parts ?? [];
    const imagePart = responseParts.find((part) => part.inlineData);

    if (!imagePart?.inlineData) {
      const textPart = responseParts.find((part) => part.text);
      if (textPart?.text) {
        throw new Error(`Model refused: ${textPart.text.slice(0, 100)}`);
      }
      throw new Error('No image in response');
    }

    return {
      imageData: imagePart.inlineData.data,
      mimeType: imagePart.inlineData.mimeType,
    };
  }, 'sendSpriteMessage');
}

/**
 * Serialises a chat session's history for persistence.
 * Note: Thought signatures are included in the history automatically.
 */
export function serializeChatHistory(chat: Chat): Content[] {
  // The SDK's chat object maintains history internally
  // We can access it via the getHistory method if available,
  // or we need to track it ourselves
  // For now, return empty - we'll implement persistence separately
  return [];
}

/**
 * Creates a chat session from serialised history.
 * Used when restoring a session from IndexedDB.
 */
export function restoreSpriteSession(
  characterId: string,
  model: string,
  history: Content[],
  systemInstruction?: string
): Chat {
  const client = getClient();

  // Close any existing session
  if (activeSessions.has(characterId)) {
    activeSessions.delete(characterId);
  }

  const chat = client.chats.create({
    model,
    history,
    config: {
      responseModalities: [Modality.IMAGE],
      ...(systemInstruction && { systemInstruction }),
    },
  });

  activeSessions.set(characterId, chat);
  return chat;
}

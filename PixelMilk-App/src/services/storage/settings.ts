import { getDB } from './db';
import type { StyleParameters } from '../../types';

const SETTINGS_STORAGE_PREFIX = 'pixelmilk_settings_';
const API_KEY_SETTING = 'gemini_api_key';

/**
 * Get a setting from localStorage fallback
 */
function getLocalStorageSetting<T>(key: string): T | null {
  try {
    const data = localStorage.getItem(SETTINGS_STORAGE_PREFIX + key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to read setting from localStorage:', error);
    return null;
  }
}

/**
 * Save a setting to localStorage fallback
 */
function setLocalStorageSetting<T>(key: string, value: T): void {
  try {
    localStorage.setItem(SETTINGS_STORAGE_PREFIX + key, JSON.stringify(value));
  } catch (error) {
    console.error('Failed to save setting to localStorage:', error);
    throw new Error('Failed to save setting: storage quota exceeded or unavailable');
  }
}

/**
 * Remove a setting from localStorage fallback
 */
function removeLocalStorageSetting(key: string): void {
  try {
    localStorage.removeItem(SETTINGS_STORAGE_PREFIX + key);
  } catch (error) {
    console.error('Failed to remove setting from localStorage:', error);
  }
}

/**
 * Get the stored API key
 */
export async function getApiKey(): Promise<string | null> {
  try {
    const db = await getDB();

    if (db) {
      const result = await db.get('settings', API_KEY_SETTING);
      return result?.value as string | null;
    } else {
      // localStorage fallback
      return getLocalStorageSetting<string>(API_KEY_SETTING);
    }
  } catch (error) {
    console.error('Failed to get API key:', error);
    return null;
  }
}

/**
 * Save the API key
 */
export async function setApiKey(key: string): Promise<void> {
  try {
    const db = await getDB();

    if (db) {
      await db.put('settings', { key: API_KEY_SETTING, value: key });
    } else {
      // localStorage fallback
      setLocalStorageSetting(API_KEY_SETTING, key);
    }
  } catch (error) {
    console.error('Failed to set API key:', error);
    throw new Error('Failed to save API key to storage');
  }
}

/**
 * Clear the stored API key
 */
export async function clearApiKey(): Promise<void> {
  try {
    const db = await getDB();

    if (db) {
      await db.delete('settings', API_KEY_SETTING);
    } else {
      // localStorage fallback
      removeLocalStorageSetting(API_KEY_SETTING);
    }
  } catch (error) {
    console.error('Failed to clear API key:', error);
    throw new Error('Failed to clear API key from storage');
  }
}

/**
 * Get a generic setting with a default value
 */
export async function getSetting<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const db = await getDB();

    if (db) {
      const result = await db.get('settings', key);
      return result?.value !== undefined ? (result.value as T) : defaultValue;
    } else {
      // localStorage fallback
      const value = getLocalStorageSetting<T>(key);
      return value !== null ? value : defaultValue;
    }
  } catch (error) {
    console.error('Failed to get setting:', error);
    return defaultValue;
  }
}

/**
 * Save a generic setting
 */
export async function setSetting<T>(key: string, value: T): Promise<void> {
  try {
    const db = await getDB();

    if (db) {
      await db.put('settings', { key, value });
    } else {
      // localStorage fallback
      setLocalStorageSetting(key, value);
    }
  } catch (error) {
    console.error('Failed to set setting:', error);
    throw new Error('Failed to save setting to storage');
  }
}

/**
 * Get default style parameters
 */
export async function getDefaultStyleParams(): Promise<StyleParameters> {
  return getSetting<StyleParameters>('defaultStyle', {
    outlineStyle: 'black',
    shadingStyle: 'basic',
    detailLevel: 'medium',
    canvasSize: 128,
    paletteMode: 'auto',
    viewType: 'standard',
  });
}

import { getDB, isUsingFallback } from './db';
import type { Asset, AssetType } from '../../types';

const ASSETS_STORAGE_KEY = 'pixelmilk_assets';
const ASSETS_BACKUP_KEY = 'pixelmilk_assets_backup';

/**
 * Validate that an asset has all required fields
 * Returns an error message if invalid, undefined if valid
 */
function validateAsset(asset: unknown): string | undefined {
  if (!asset || typeof asset !== 'object') {
    return 'Asset must be an object';
  }

  const a = asset as Record<string, unknown>;

  if (typeof a.id !== 'string' || !a.id.trim()) {
    return 'Asset must have a non-empty string id';
  }

  if (!['character', 'tile', 'object', 'texture'].includes(a.type as string)) {
    return `Asset must have a valid type, got: ${a.type}`;
  }

  if (typeof a.name !== 'string' || !a.name.trim()) {
    return 'Asset must have a non-empty string name';
  }

  if (typeof a.createdAt !== 'number' || a.createdAt <= 0) {
    return 'Asset must have a valid createdAt timestamp';
  }

  if (typeof a.updatedAt !== 'number' || a.updatedAt <= 0) {
    return 'Asset must have a valid updatedAt timestamp';
  }

  return undefined;
}

/**
 * Check if an object looks like a valid asset (for partial recovery)
 */
function isLikelyAsset(obj: unknown): obj is Asset {
  if (!obj || typeof obj !== 'object') return false;
  const a = obj as Record<string, unknown>;
  // Must have at least id and type to be recoverable
  return typeof a.id === 'string' && typeof a.type === 'string';
}

/**
 * Get all assets from localStorage fallback
 * Bug H8 Fix: Properly handle corruption vs empty storage with recovery attempt
 */
function getLocalStorageAssets(): Asset[] {
  const rawData = localStorage.getItem(ASSETS_STORAGE_KEY);

  // Truly empty storage - no data was ever saved
  if (rawData === null) {
    return [];
  }

  // Empty string edge case
  if (rawData.trim() === '') {
    console.warn('[assets] localStorage contains empty string, treating as empty');
    return [];
  }

  try {
    const parsed = JSON.parse(rawData);

    // Validate it's an array
    if (!Array.isArray(parsed)) {
      console.warn('[assets] localStorage data is not an array, attempting recovery');
      // If it's a single object that looks like an asset, wrap it
      if (isLikelyAsset(parsed)) {
        return [parsed];
      }
      throw new Error('Data is not an array or recoverable asset');
    }

    // Filter and validate each asset, recovering what we can
    const validAssets: Asset[] = [];
    const invalidCount = { malformed: 0, missing: 0 };

    for (let i = 0; i < parsed.length; i++) {
      const item = parsed[i];
      if (isLikelyAsset(item)) {
        // Attempt to repair missing timestamps
        const repaired = {
          ...item,
          createdAt: item.createdAt || Date.now(),
          updatedAt: item.updatedAt || Date.now(),
          name: item.name || `Unnamed ${item.type}`,
        };
        validAssets.push(repaired as Asset);
      } else {
        invalidCount.malformed++;
      }
    }

    if (invalidCount.malformed > 0) {
      console.warn(
        `[assets] Recovered ${validAssets.length} assets, skipped ${invalidCount.malformed} malformed entries`
      );
    }

    return validAssets;
  } catch (error) {
    console.error('[assets] CRITICAL: Failed to parse localStorage data:', error);
    console.warn('[assets] Raw data length:', rawData.length);

    // Try to recover from backup if available
    try {
      const backupData = localStorage.getItem(ASSETS_BACKUP_KEY);
      if (backupData) {
        const backup = JSON.parse(backupData);
        if (Array.isArray(backup) && backup.length > 0) {
          console.warn(`[assets] Recovered ${backup.length} assets from backup`);
          // Restore the backup to main storage
          localStorage.setItem(ASSETS_STORAGE_KEY, backupData);
          return backup.filter(isLikelyAsset);
        }
      }
    } catch (backupError) {
      console.error('[assets] Backup recovery also failed:', backupError);
    }

    // Last resort: try to extract any JSON objects that look like assets
    console.warn('[assets] Attempting regex-based partial recovery...');
    try {
      const assetMatches = rawData.match(/\{[^{}]*"id"\s*:\s*"[^"]+[^{}]*\}/g);
      if (assetMatches && assetMatches.length > 0) {
        const recovered: Asset[] = [];
        for (const match of assetMatches) {
          try {
            const obj = JSON.parse(match);
            if (isLikelyAsset(obj)) {
              recovered.push({
                ...obj,
                createdAt: obj.createdAt || Date.now(),
                updatedAt: obj.updatedAt || Date.now(),
                name: obj.name || `Recovered ${obj.type}`,
              } as Asset);
            }
          } catch {
            // Skip this fragment
          }
        }
        if (recovered.length > 0) {
          console.warn(`[assets] Regex recovery found ${recovered.length} assets`);
          return recovered;
        }
      }
    } catch {
      // Regex recovery failed
    }

    console.error('[assets] All recovery attempts failed. Data may be lost.');
    return [];
  }
}

/**
 * Save all assets to localStorage fallback
 * Creates a backup before overwriting to support recovery
 */
function setLocalStorageAssets(assets: Asset[]): void {
  try {
    // Create backup of current data before overwriting
    const currentData = localStorage.getItem(ASSETS_STORAGE_KEY);
    if (currentData && currentData.length > 2) {
      // Only backup if there's actual data (not just "[]")
      try {
        localStorage.setItem(ASSETS_BACKUP_KEY, currentData);
      } catch {
        // Backup failed, but we should still try to save
        console.warn('[assets] Failed to create backup before save');
      }
    }

    localStorage.setItem(ASSETS_STORAGE_KEY, JSON.stringify(assets));
  } catch (error) {
    console.error('Failed to save assets to localStorage:', error);
    throw new Error('Failed to save assets: storage quota exceeded or unavailable');
  }
}

/**
 * Save an asset to storage
 * Bug H7 Fix: Validates asset before saving to prevent corrupted data
 */
export async function saveAsset(asset: Asset): Promise<void> {
  try {
    // Ensure updatedAt is set
    asset.updatedAt = Date.now();

    // Bug H7: Validate asset before saving
    const validationError = validateAsset(asset);
    if (validationError) {
      console.error('[assets] Validation failed:', validationError, asset);
      throw new Error(`Invalid asset: ${validationError}`);
    }

    const db = await getDB();

    if (db) {
      await db.put('assets', asset);
    } else {
      // localStorage fallback
      const assets = getLocalStorageAssets();
      const existingIndex = assets.findIndex((a) => a.id === asset.id);

      if (existingIndex >= 0) {
        assets[existingIndex] = asset;
      } else {
        assets.push(asset);
      }

      setLocalStorageAssets(assets);
    }
  } catch (error) {
    console.error('Failed to save asset:', error);
    throw error instanceof Error ? error : new Error('Failed to save asset to storage');
  }
}

/**
 * Get an asset by ID
 */
export async function getAsset(id: string): Promise<Asset | undefined> {
  try {
    const db = await getDB();

    if (db) {
      return await db.get('assets', id);
    } else {
      // localStorage fallback
      const assets = getLocalStorageAssets();
      return assets.find((a) => a.id === id);
    }
  } catch (error) {
    console.error('Failed to get asset:', error);
    return undefined;
  }
}

/**
 * Get all assets
 */
export async function getAllAssets(): Promise<Asset[]> {
  try {
    const db = await getDB();

    if (db) {
      return await db.getAll('assets');
    } else {
      // localStorage fallback
      return getLocalStorageAssets();
    }
  } catch (error) {
    console.error('Failed to get all assets:', error);
    return [];
  }
}

/**
 * Get all assets of a specific type
 */
export async function getAssetsByType(type: AssetType): Promise<Asset[]> {
  try {
    const db = await getDB();

    if (db) {
      return await db.getAllFromIndex('assets', 'by-type', type);
    } else {
      // localStorage fallback
      const assets = getLocalStorageAssets();
      return assets.filter((a) => a.type === type);
    }
  } catch (error) {
    console.error('Failed to get assets by type:', error);
    return [];
  }
}

/**
 * Get recent assets ordered by update time
 */
export async function getRecentAssets(limit: number = 20): Promise<Asset[]> {
  try {
    const db = await getDB();

    if (db) {
      const assets = await db.getAllFromIndex('assets', 'by-updated');
      return assets.reverse().slice(0, limit);
    } else {
      const assets = getLocalStorageAssets();
      return assets.sort((a, b) => b.updatedAt - a.updatedAt).slice(0, limit);
    }
  } catch (error) {
    console.error('Failed to get recent assets:', error);
    return [];
  }
}

/**
 * Generate a unique asset ID
 */
export function generateAssetId(): string {
  return `asset_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Delete an asset by ID
 */
export async function deleteAsset(id: string): Promise<void> {
  try {
    const db = await getDB();

    if (db) {
      await db.delete('assets', id);
    } else {
      // localStorage fallback
      const assets = getLocalStorageAssets();
      const filteredAssets = assets.filter((a) => a.id !== id);
      setLocalStorageAssets(filteredAssets);
    }
  } catch (error) {
    console.error('Failed to delete asset:', error);
    throw new Error('Failed to delete asset from storage');
  }
}

/**
 * Update an asset with partial data
 * Bug H15 Fix: Uses atomic transaction for IndexedDB, verification check for localStorage
 */
export async function updateAsset(id: string, updates: Partial<Asset>): Promise<void> {
  try {
    const db = await getDB();

    if (db) {
      // Bug H15: Use IndexedDB transaction for atomic read-modify-write
      const tx = db.transaction('assets', 'readwrite');
      const store = tx.objectStore('assets');

      const existingAsset = await store.get(id);
      if (!existingAsset) {
        await tx.done; // Complete the transaction
        throw new Error(`Asset with id ${id} not found`);
      }

      const updatedAsset: Asset = {
        ...existingAsset,
        ...updates,
        id, // Ensure ID cannot be changed
        updatedAt: Date.now(),
      };

      // Validate before saving
      const validationError = validateAsset(updatedAsset);
      if (validationError) {
        await tx.done;
        throw new Error(`Invalid asset update: ${validationError}`);
      }

      await store.put(updatedAsset);
      await tx.done;
    } else {
      // localStorage fallback - Bug H15: Re-verify asset exists right before write
      const assets = getLocalStorageAssets();
      const existingIndex = assets.findIndex((a) => a.id === id);

      if (existingIndex < 0) {
        throw new Error(`Asset with id ${id} not found`);
      }

      const existingAsset = assets[existingIndex];
      const updatedAsset: Asset = {
        ...existingAsset,
        ...updates,
        id, // Ensure ID cannot be changed
        updatedAt: Date.now(),
      };

      // Validate before saving
      const validationError = validateAsset(updatedAsset);
      if (validationError) {
        throw new Error(`Invalid asset update: ${validationError}`);
      }

      // Re-read and verify asset still exists (minimize race window)
      const freshAssets = getLocalStorageAssets();
      const freshIndex = freshAssets.findIndex((a) => a.id === id);

      if (freshIndex < 0) {
        throw new Error(`Asset with id ${id} was deleted during update`);
      }

      // Check if another update happened (based on updatedAt)
      if (freshAssets[freshIndex].updatedAt !== existingAsset.updatedAt) {
        console.warn(
          `[assets] Concurrent modification detected for asset ${id}. ` +
            `Original: ${existingAsset.updatedAt}, Current: ${freshAssets[freshIndex].updatedAt}. ` +
            `Proceeding with update (last-write-wins).`
        );
      }

      freshAssets[freshIndex] = updatedAsset;
      setLocalStorageAssets(freshAssets);
    }
  } catch (error) {
    console.error('Failed to update asset:', error);
    throw error;
  }
}

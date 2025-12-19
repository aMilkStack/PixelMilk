import { getDB, isUsingFallback } from './db';
import type { Asset, AssetType } from '../../types';

const ASSETS_STORAGE_KEY = 'pixelmilk_assets';

/**
 * Get all assets from localStorage fallback
 */
function getLocalStorageAssets(): Asset[] {
  try {
    const data = localStorage.getItem(ASSETS_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to read assets from localStorage:', error);
    return [];
  }
}

/**
 * Save all assets to localStorage fallback
 */
function setLocalStorageAssets(assets: Asset[]): void {
  try {
    localStorage.setItem(ASSETS_STORAGE_KEY, JSON.stringify(assets));
  } catch (error) {
    console.error('Failed to save assets to localStorage:', error);
    throw new Error('Failed to save assets: storage quota exceeded or unavailable');
  }
}

/**
 * Save an asset to storage
 */
export async function saveAsset(asset: Asset): Promise<void> {
  try {
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
    throw new Error('Failed to save asset to storage');
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
      return await db.getAllFromIndex('assets', 'type', type);
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
 */
export async function updateAsset(id: string, updates: Partial<Asset>): Promise<void> {
  try {
    const existingAsset = await getAsset(id);

    if (!existingAsset) {
      throw new Error(`Asset with id ${id} not found`);
    }

    const updatedAsset: Asset = {
      ...existingAsset,
      ...updates,
      id, // Ensure ID cannot be changed
      updatedAt: Date.now(),
    };

    await saveAsset(updatedAsset);
  } catch (error) {
    console.error('Failed to update asset:', error);
    throw error;
  }
}

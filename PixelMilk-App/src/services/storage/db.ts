import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { Asset } from '../../types';

// Database schema definition
interface PixelMilkDB extends DBSchema {
  assets: {
    key: string;
    value: Asset;
    indexes: {
      type: string;
      createdAt: number;
    };
  };
  settings: {
    key: string;
    value: {
      key: string;
      value: unknown;
    };
  };
}

const DB_NAME = 'pixelmilk-db';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<PixelMilkDB> | null = null;
let useLocalStorageFallback = false;

/**
 * Check if IndexedDB is available in the current browser
 */
function isIndexedDBAvailable(): boolean {
  try {
    if (typeof indexedDB === 'undefined') {
      return false;
    }
    // Test if we can actually open a database
    const testRequest = indexedDB.open('__idb_test__');
    testRequest.onerror = () => {
      indexedDB.deleteDatabase('__idb_test__');
    };
    testRequest.onsuccess = () => {
      testRequest.result.close();
      indexedDB.deleteDatabase('__idb_test__');
    };
    return true;
  } catch {
    return false;
  }
}

/**
 * Initialize and return the database connection
 * Returns null if IndexedDB is not available (use localStorage fallback)
 */
export async function getDB(): Promise<IDBPDatabase<PixelMilkDB> | null> {
  // Check if we should use localStorage fallback
  if (useLocalStorageFallback) {
    return null;
  }

  // Return existing connection if available
  if (dbInstance) {
    return dbInstance;
  }

  // Check IndexedDB availability
  if (!isIndexedDBAvailable()) {
    console.warn('IndexedDB not available, using localStorage fallback');
    useLocalStorageFallback = true;
    return null;
  }

  try {
    dbInstance = await openDB<PixelMilkDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Create assets store with indexes
        if (!db.objectStoreNames.contains('assets')) {
          const assetsStore = db.createObjectStore('assets', { keyPath: 'id' });
          assetsStore.createIndex('type', 'type');
          assetsStore.createIndex('createdAt', 'createdAt');
        }

        // Create settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      },
      blocked() {
        console.warn('Database upgrade blocked by another connection');
      },
      blocking() {
        // Close connection if we're blocking another upgrade
        dbInstance?.close();
        dbInstance = null;
      },
      terminated() {
        console.warn('Database connection terminated unexpectedly');
        dbInstance = null;
      },
    });

    return dbInstance;
  } catch (error) {
    console.error('Failed to open IndexedDB:', error);
    useLocalStorageFallback = true;
    return null;
  }
}

/**
 * Check if using localStorage fallback
 */
export function isUsingFallback(): boolean {
  return useLocalStorageFallback;
}

/**
 * Close the database connection
 */
export function closeDB(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

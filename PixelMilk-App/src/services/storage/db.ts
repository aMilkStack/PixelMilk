import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { Asset } from '../../types';

// Database schema definition
interface PixelMilkDB extends DBSchema {
  assets: {
    key: string;
    value: Asset;
    indexes: {
      'by-type': string;
      'by-created': number;
      'by-updated': number;
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
const DB_VERSION = 3; // Bumped to fix duplicate indexes (H6)

// Storage connection state tracking
interface StorageState {
  dbInstance: IDBPDatabase<PixelMilkDB> | null;
  useLocalStorageFallback: boolean;
  lastFallbackTime: number | null;
  recoveryAttempts: number;
}

const RECOVERY_COOLDOWN_MS = 30000; // 30 seconds between recovery attempts
const MAX_RECOVERY_ATTEMPTS = 3;

const storageState: StorageState = {
  dbInstance: null,
  useLocalStorageFallback: false,
  lastFallbackTime: null,
  recoveryAttempts: 0,
};

// Keep dbInstance as module-level for backward compatibility
let dbInstance: IDBPDatabase<PixelMilkDB> | null = null;

/**
 * Check if IndexedDB is available in the current browser
 * Returns a Promise that resolves to true if IndexedDB works, false otherwise
 */
async function isIndexedDBAvailable(): Promise<boolean> {
  try {
    if (typeof indexedDB === 'undefined') {
      return false;
    }
    // Test if we can actually open a database
    return new Promise<boolean>((resolve) => {
      const testRequest = indexedDB.open('__idb_test__');
      testRequest.onerror = () => {
        indexedDB.deleteDatabase('__idb_test__');
        resolve(false);
      };
      testRequest.onsuccess = () => {
        testRequest.result.close();
        indexedDB.deleteDatabase('__idb_test__');
        resolve(true);
      };
    });
  } catch {
    return false;
  }
}

/**
 * Check if IndexedDB recovery should be attempted
 */
function shouldAttemptRecovery(): boolean {
  if (!storageState.useLocalStorageFallback) {
    return false;
  }

  if (storageState.recoveryAttempts >= MAX_RECOVERY_ATTEMPTS) {
    return false;
  }

  if (storageState.lastFallbackTime === null) {
    return true;
  }

  const timeSinceLastFallback = Date.now() - storageState.lastFallbackTime;
  return timeSinceLastFallback >= RECOVERY_COOLDOWN_MS;
}

/**
 * Attempt to recover IndexedDB connection
 * Returns true if recovery was successful
 */
async function attemptIndexedDBRecovery(): Promise<boolean> {
  storageState.recoveryAttempts++;

  const isAvailable = await isIndexedDBAvailable();
  if (isAvailable) {
    console.info('IndexedDB recovered, switching from localStorage fallback');
    storageState.useLocalStorageFallback = false;
    storageState.lastFallbackTime = null;
    storageState.recoveryAttempts = 0;
    return true;
  }

  storageState.lastFallbackTime = Date.now();
  return false;
}

/**
 * Initialize and return the database connection
 * Returns null if IndexedDB is not available (use localStorage fallback)
 */
export async function getDB(): Promise<IDBPDatabase<PixelMilkDB> | null> {
  // Check if we should attempt IndexedDB recovery
  if (storageState.useLocalStorageFallback) {
    if (shouldAttemptRecovery()) {
      const recovered = await attemptIndexedDBRecovery();
      if (!recovered) {
        return null;
      }
    } else {
      return null;
    }
  }

  // Return existing connection if available
  if (dbInstance) {
    return dbInstance;
  }

  // Check IndexedDB availability
  if (!(await isIndexedDBAvailable())) {
    console.warn('IndexedDB not available, using localStorage fallback');
    storageState.useLocalStorageFallback = true;
    storageState.lastFallbackTime = Date.now();
    return null;
  }

  try {
    dbInstance = await openDB<PixelMilkDB>(DB_NAME, DB_VERSION, {
      upgrade(db, _oldVersion, _newVersion, transaction) {
        // Create assets store with indexes
        // Note: Use consistent index names - 'by-type' for type field, 'by-updated' for updatedAt
        if (!db.objectStoreNames.contains('assets')) {
          const assetsStore = db.createObjectStore('assets', { keyPath: 'id' });
          // Create indexes with 'by-' prefix naming convention
          assetsStore.createIndex('by-type', 'type');
          assetsStore.createIndex('by-created', 'createdAt');
          assetsStore.createIndex('by-updated', 'updatedAt');
        } else {
          // Handle migration for existing stores
          const assetsStore = transaction.objectStore('assets');
          // Cast to DOMStringList for runtime index name checks (old indexes not in schema)
          const indexNames = assetsStore.indexNames as DOMStringList;

          // Remove old duplicate indexes if they exist
          if (indexNames.contains('type')) {
            assetsStore.deleteIndex('type' as never);
          }
          if (indexNames.contains('createdAt')) {
            assetsStore.deleteIndex('createdAt' as never);
          }

          // Ensure new indexes exist
          if (!indexNames.contains('by-type')) {
            assetsStore.createIndex('by-type', 'type');
          }
          if (!indexNames.contains('by-created')) {
            assetsStore.createIndex('by-created', 'createdAt');
          }
          if (!indexNames.contains('by-updated')) {
            assetsStore.createIndex('by-updated', 'updatedAt');
          }
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
        storageState.dbInstance = null;
      },
      terminated() {
        console.warn('Database connection terminated unexpectedly');
        dbInstance = null;
        storageState.dbInstance = null;
      },
    });

    storageState.dbInstance = dbInstance;
    return dbInstance;
  } catch (error) {
    console.error('Failed to open IndexedDB:', error);
    storageState.useLocalStorageFallback = true;
    storageState.lastFallbackTime = Date.now();
    return null;
  }
}

/**
 * Check if using localStorage fallback
 */
export function isUsingFallback(): boolean {
  return storageState.useLocalStorageFallback;
}

/**
 * Get current storage backend information
 */
export function getStorageBackendInfo(): {
  backend: 'indexeddb' | 'localstorage';
  recoveryAttempts: number;
  maxRecoveryAttempts: number;
  lastFallbackTime: number | null;
  canAttemptRecovery: boolean;
} {
  return {
    backend: storageState.useLocalStorageFallback ? 'localstorage' : 'indexeddb',
    recoveryAttempts: storageState.recoveryAttempts,
    maxRecoveryAttempts: MAX_RECOVERY_ATTEMPTS,
    lastFallbackTime: storageState.lastFallbackTime,
    canAttemptRecovery: shouldAttemptRecovery(),
  };
}

/**
 * Force an IndexedDB recovery attempt
 * Returns true if recovery was successful, false otherwise
 */
export async function forceRecoveryAttempt(): Promise<boolean> {
  // Reset recovery state to allow a fresh attempt
  storageState.recoveryAttempts = 0;
  storageState.lastFallbackTime = null;

  const recovered = await attemptIndexedDBRecovery();
  if (recovered) {
    // Try to reconnect
    const db = await getDB();
    return db !== null;
  }
  return false;
}

/**
 * Close the database connection
 */
export function closeDB(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
    storageState.dbInstance = null;
  }
}

/**
 * Reset storage state (useful for testing or manual recovery)
 */
export function resetStorageState(): void {
  closeDB();
  storageState.useLocalStorageFallback = false;
  storageState.lastFallbackTime = null;
  storageState.recoveryAttempts = 0;
}

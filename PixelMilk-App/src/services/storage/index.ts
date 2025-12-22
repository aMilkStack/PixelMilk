// Database
export {
  getDB,
  isUsingFallback,
  closeDB,
  getStorageBackendInfo,
  forceRecoveryAttempt,
  resetStorageState,
} from './db';

// Asset operations
export {
  saveAsset,
  getAsset,
  getAllAssets,
  getAssetsByType,
  getRecentAssets,
  deleteAsset,
  updateAsset,
  generateAssetId,
} from './assets';

// Settings operations
export {
  getApiKey,
  setApiKey,
  clearApiKey,
  getSetting,
  setSetting,
  getDefaultStyleParams,
} from './settings';

// Palette operations
export {
  parseHexFile,
  loadPaletteFromFile,
  getAllPalettes,
  savePalette,
  deletePalette,
  getPalette,
  importPaletteFiles,
  getAllPalettesWithBuiltins,
  BUILT_IN_PALETTES,
} from './palettes';

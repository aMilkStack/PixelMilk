import React, { useState, useEffect, useCallback } from 'react';
import { DescriptionInput } from './DescriptionInput';
import { StyleSelector } from './StyleSelector';
import { IdentityCard } from './IdentityCard';
import { GenerateControls } from './GenerateControls';
import { PaletteDisplay } from './PaletteDisplay';
import { PalettePlaylist } from './PalettePlaylist';
import { SpriteCanvas } from '../canvas';
import { Button } from '../shared/Button';
import { useAppStore, useCanvasStore, useCharacterStore } from '../../stores';
import {
  generateCharacterIdentity,
  generateSprite,
  generateRotatedSprite,
  optimizePrompt,
  generateSegmentationMask,
} from '../../services/gemini';
import type { ReferenceImage } from '../../services/gemini';
import { saveAsset, generateAssetId, getAssetsByType } from '../../services/storage';
import { pngToPixelArray, removeCheckerboardBackground, flipSpriteHorizontally, parseSegmentationMask, DEFAULT_CHROMA_KEY, type ParsedMask } from '../../utils/imageUtils';
import { renderPixelDataToDataUrl, validateAndSnapPixelData, renderPixelDataToBase64 } from '../../utils/paletteGovernor';
import { getLospecColors, getChromaKeyWithDistance } from '../../data/lospecPalettes';
import type { Asset, Direction, SpriteData } from '../../types';

const colors = {
  bgPrimary: '#021a1a',
  bgSecondary: '#0d2b2b',
  mint: '#8bd0ba',
  cream: '#d8c8b8',
};

// Direction picker component
interface DirectionPickerProps {
  currentDirection: Direction;
  spritesMap: Map<Direction, SpriteData>;
  onDirectionChange: (direction: Direction) => void;
  disabled?: boolean;
}

const DirectionPicker: React.FC<DirectionPickerProps> = ({
  currentDirection,
  spritesMap,
  onDirectionChange,
  disabled = false,
}) => {
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
  };

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    gap: '4px',
  };

  const buttonStyle = (dir: Direction): React.CSSProperties => {
    const isSelected = dir === currentDirection;
    const hasSprite = spritesMap.has(dir);

    return {
      width: '36px',
      height: '36px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'monospace',
      fontSize: '12px',
      fontWeight: 'bold',
      letterSpacing: '0.05em',
      border: `2px solid ${isSelected ? colors.mint : colors.mint + '40'}`,
      backgroundColor: isSelected ? colors.mint + '20' : 'transparent',
      color: isSelected ? colors.mint : colors.cream,
      cursor: disabled ? 'not-allowed' : 'var(--cursor-pointer)',
      opacity: disabled ? 0.5 : 1,
      transition: 'all 0.15s ease',
      position: 'relative',
    };
  };

  const indicatorStyle = (hasSprite: boolean): React.CSSProperties => ({
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: hasSprite ? colors.mint : colors.cream + '30',
    position: 'absolute',
    bottom: '3px',
    left: '50%',
    transform: 'translateX(-50%)',
  });

  const renderButton = (dir: Direction) => {
    const hasSprite = spritesMap.has(dir);
    return (
      <button
        key={dir}
        style={buttonStyle(dir)}
        onClick={() => onDirectionChange(dir)}
        disabled={disabled}
        title={`${dir} - ${hasSprite ? 'Sprite generated' : 'No sprite yet'}`}
      >
        {dir}
        <span style={indicatorStyle(hasSprite)} />
      </button>
    );
  };

  // Layout: N on top, E-W in middle, S on bottom (compass-like)
  return (
    <div style={containerStyle}>
      <div style={rowStyle}>
        {renderButton('N')}
      </div>
      <div style={rowStyle}>
        {renderButton('W')}
        <div style={{ width: '36px', height: '36px' }} /> {/* Empty center */}
        {renderButton('E')}
      </div>
      <div style={rowStyle}>
        {renderButton('S')}
      </div>
    </div>
  );
};

// Character Library Browser Modal
interface CharacterLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCharacter: (asset: Asset) => void;
}

const CharacterLibraryModal: React.FC<CharacterLibraryModalProps> = ({
  isOpen,
  onClose,
  onSelectCharacter,
}) => {
  const [characters, setCharacters] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadCharacters = useCallback(async () => {
    setIsLoading(true);
    try {
      const assets = await getAssetsByType('character');
      // Sort by most recent first
      assets.sort((a, b) => b.createdAt - a.createdAt);
      setCharacters(assets);
    } catch (err) {
      console.error('Failed to load characters:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadCharacters();
    }
  }, [isOpen, loadCharacters]);

  if (!isOpen) return null;

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  };

  const modalStyle: React.CSSProperties = {
    backgroundColor: colors.bgSecondary,
    border: `2px solid ${colors.mint}`,
    padding: '24px',
    maxWidth: '500px',
    width: '90%',
    maxHeight: '70vh',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  const titleStyle: React.CSSProperties = {
    fontFamily: 'monospace',
    fontSize: '14px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '0.15em',
    color: colors.mint,
    margin: 0,
  };

  const listStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    overflowY: 'auto',
    maxHeight: '400px',
    paddingRight: '8px',
  };

  const emptyStyle: React.CSSProperties = {
    textAlign: 'center',
    padding: '32px',
    fontFamily: 'monospace',
    fontSize: '13px',
    color: colors.cream + '80',
  };

  const loadingStyle: React.CSSProperties = {
    textAlign: 'center',
    padding: '32px',
    fontFamily: 'monospace',
    fontSize: '13px',
    color: colors.mint,
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <h3 style={titleStyle}>Load from Library</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>

        <div style={listStyle}>
          {isLoading ? (
            <div style={loadingStyle}>Loading characters...</div>
          ) : characters.length === 0 ? (
            <div style={emptyStyle}>
              No saved characters yet.
              <br />
              Generate a character and save it to see it here.
            </div>
          ) : (
            characters.map((character) => (
              <CharacterListItem
                key={character.id}
                character={character}
                onSelect={() => {
                  onSelectCharacter(character);
                  onClose();
                }}
                formatDate={formatDate}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// Separate component to handle hover state
interface CharacterListItemProps {
  character: Asset;
  onSelect: () => void;
  formatDate: (timestamp: number) => string;
}

const CharacterListItem: React.FC<CharacterListItemProps> = ({
  character,
  onSelect,
  formatDate,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);

  // Generate thumbnail from first sprite if available
  useEffect(() => {
    let isMounted = true;

    const generateThumbnail = async () => {
      if (character.sprites && character.sprites.length > 0) {
        try {
          const firstSprite = character.sprites[0];
          const url = await renderPixelDataToDataUrl(firstSprite);
          // Only update state if component is still mounted
          if (isMounted) {
            setThumbnailUrl(url);
          }
        } catch {
          // Ignore thumbnail generation errors
        }
      }
    };
    generateThumbnail();

    return () => {
      isMounted = false;
    };
  }, [character.sprites]);

  const itemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    backgroundColor: isHovered ? colors.mint + '10' : colors.bgPrimary,
    border: `1px solid ${isHovered ? colors.mint : colors.mint + '40'}`,
    cursor: 'var(--cursor-pointer)',
    transition: 'all 0.15s ease',
  };

  const thumbnailStyle: React.CSSProperties = {
    width: '48px',
    height: '48px',
    backgroundColor: colors.bgSecondary,
    border: `1px solid ${colors.mint}30`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'hidden',
  };

  const thumbnailImgStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    imageRendering: 'pixelated',
  };

  const itemInfoStyle: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
  };

  const itemNameStyle: React.CSSProperties = {
    fontFamily: 'monospace',
    fontSize: '13px',
    fontWeight: 'bold',
    color: colors.cream,
    marginBottom: '4px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  const itemDateStyle: React.CSSProperties = {
    fontFamily: 'monospace',
    fontSize: '11px',
    color: colors.cream + '80',
  };

  const spriteBadgeStyle: React.CSSProperties = {
    fontFamily: 'monospace',
    fontSize: '10px',
    color: colors.mint,
    backgroundColor: colors.mint + '20',
    padding: '2px 6px',
    marginLeft: '8px',
  };

  const spriteCount = character.sprites?.length ?? 0;

  return (
    <div
      style={itemStyle}
      onClick={onSelect}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={thumbnailStyle}>
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt={character.name} style={thumbnailImgStyle} />
        ) : (
          <span style={{ color: colors.cream + '40', fontSize: '10px' }}>No sprite</span>
        )}
      </div>
      <div style={itemInfoStyle}>
        <div style={itemNameStyle}>
          {character.name}
          {spriteCount > 0 && (
            <span style={spriteBadgeStyle}>
              {spriteCount} sprite{spriteCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div style={itemDateStyle}>Created {formatDate(character.createdAt)}</div>
      </div>
    </div>
  );
};

type BackgroundType = 'transparent' | 'white' | 'black';

const getIsMobile = () => typeof window !== 'undefined' && window.innerWidth < 768;

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(getIsMobile);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
};

type SaveStatus = 'idle' | 'saving' | 'success' | 'error';
type FailedGeneration = 'identity' | 'sprite' | null;

// Cardinal directions in generation order (South first, then rotate clockwise)
// Only generate 3 directions - W is flipped from E (NotebookLM: "Symmetry Shortcut")
const GENERATED_DIRECTIONS: Direction[] = ['S', 'E', 'N'];
// All 4 directions for UI display
const CARDINAL_DIRECTIONS: Direction[] = ['S', 'E', 'N', 'W'];
// Delay between auto-generating each direction (ms) to avoid rate limiting
const DIRECTION_GENERATION_DELAY = 1500;

/**
 * Handles API errors from Gemini SDK with structured error property checking.
 * Updates app state appropriately based on error type.
 */
interface ApiErrorHandlerParams {
  err: unknown;
  fallbackMessage: string;
  setError: (error: string | null) => void;
  setApiKeyStatus: (status: 'invalid' | 'valid' | 'unknown' | 'error') => void;
  openApiKeyModal: () => void;
}

function handleApiError({
  err,
  fallbackMessage,
  setError,
  setApiKeyStatus,
  openApiKeyModal,
}: ApiErrorHandlerParams): void {
  const error = err as { status?: number; code?: string; message?: string };
  const status = error.status;
  const code = error.code;
  const errorMessage = error.message ?? (err instanceof Error ? err.message : fallbackMessage);

  // Check for auth errors via status code or error code
  if (status === 401 || status === 403 || code === 'UNAUTHENTICATED' || code === 'PERMISSION_DENIED') {
    setApiKeyStatus('invalid');
    openApiKeyModal();
    setError('Invalid API key. Please check your key and try again.');
  } else if (status === 429 || code === 'RESOURCE_EXHAUSTED') {
    setError('Rate limited. Please wait a moment and try again.');
  } else if (status === 400 || code === 'INVALID_ARGUMENT') {
    setError('Invalid request. Please try a different description.');
  } else if (status === 503 || code === 'UNAVAILABLE') {
    setError('Service temporarily unavailable. Please try again later.');
  } else {
    setError(errorMessage);
  }
}

export const CharacterTab: React.FC = () => {
  const isMobile = useIsMobile();
  const [background, setBackground] = useState<BackgroundType>('transparent');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastFailedGeneration, setLastFailedGeneration] = useState<FailedGeneration>(null);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [generatingDirection, setGeneratingDirection] = useState<Direction | null>(null);
  const [autoGenerationProgress, setAutoGenerationProgress] = useState<string | null>(null);
  // Prompt Optimizer state
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizedPrompt, setOptimizedPrompt] = useState<string | null>(null);
  const [optimizeExplanation, setOptimizeExplanation] = useState<string | null>(null);

  const { apiKey, openApiKeyModal, setApiKeyStatus } = useAppStore();
  const { zoom, setZoom } = useCanvasStore();

  const {
    description,
    styleParams,
    currentIdentity,
    currentSprites,
    lockedPalette,
    currentDirection,
    isGeneratingIdentity,
    isGeneratingSprite,
    error,
    hasActiveSession,
    setDescription,
    setStyleParams,
    setIdentity,
    addSprite,
    lockPalette,
    setCurrentDirection,
    setGeneratingIdentity,
    setGeneratingSprite,
    setError,
    clearCharacter,
    loadCharacter,
    setHasActiveSession,
  } = useCharacterStore();

  const identity = currentIdentity;
  const backgroundColors: Record<BackgroundType, string | null> = {
    transparent: null,
    white: '#ffffff',
    black: '#000000',
  };
  const exportBackground = backgroundColors[background];

  // Get the current sprite (South facing for now)
  const currentSprite =
    currentSprites.get(currentDirection) ??
    currentSprites.get('S') ??
    null;

  // Check if description is valid
  const isDescriptionValid = description.length >= 10 && description.length <= 2000;

  // Handle Prompt Optimization (Prompt Wand)
  const handleOptimizePrompt = async () => {
    if (!apiKey) {
      openApiKeyModal();
      return;
    }

    if (!isDescriptionValid) {
      setError('Please enter a valid description (10-2000 characters) to optimize');
      return;
    }

    setError(null);
    setIsOptimizing(true);
    setOptimizedPrompt(null);
    setOptimizeExplanation(null);

    try {
      const result = await optimizePrompt(description, styleParams.canvasSize);
      setOptimizedPrompt(result.optimizedPrompt);
      setOptimizeExplanation(result.explanation);
    } catch (err) {
      handleApiError({
        err,
        fallbackMessage: 'Failed to optimize prompt',
        setError,
        setApiKeyStatus,
        openApiKeyModal,
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  // Accept optimized prompt - replaces user description with optimized version
  const handleAcceptOptimizedPrompt = () => {
    if (optimizedPrompt) {
      setDescription(optimizedPrompt);
      setOptimizedPrompt(null);
      setOptimizeExplanation(null);
    }
  };

  // Dismiss optimized prompt suggestion
  const handleDismissOptimizedPrompt = () => {
    setOptimizedPrompt(null);
    setOptimizeExplanation(null);
  };

  // Handle Generate Identity
  const handleGenerateIdentity = async () => {
    if (!apiKey) {
      openApiKeyModal();
      return;
    }

    if (!isDescriptionValid) {
      setError('Please enter a valid description (10-2000 characters)');
      return;
    }

    setError(null);
    setGeneratingIdentity(true);

    try {
      const newIdentity = await generateCharacterIdentity(description, styleParams);
      setIdentity(newIdentity);
      setLastFailedGeneration(null);
    } catch (err) {
      setLastFailedGeneration('identity');
      handleApiError({
        err,
        fallbackMessage: 'Failed to generate identity',
        setError,
        setApiKeyStatus,
        openApiKeyModal,
      });
    } finally {
      setGeneratingIdentity(false);
    }
  };

  // Helper: Generate a single direction sprite
  // Returns the locked palette (only set on first sprite)
  const generateSingleDirection = async (
    direction: Direction,
    existingSprites: Map<Direction, SpriteData>,
    currentLockedPalette: string[] | null
  ): Promise<{ sprite: SpriteData; palette: string[] }> => {
    if (!identity) throw new Error('No identity');

    const size = identity.styleParameters.canvasSize;
    const paletteMode = styleParams.paletteMode;
    const paletteColors = paletteMode && paletteMode !== 'auto' ? getLospecColors(paletteMode) : undefined;
    const effectivePalette = currentLockedPalette ?? paletteColors ?? undefined;

    // Get palette-specific chromaKey and tolerance for background removal
    let chromaKey = DEFAULT_CHROMA_KEY;
    let chromaTolerance: number | undefined;
    if (paletteMode && paletteMode !== 'auto') {
      const chromaData = getChromaKeyWithDistance(paletteMode);
      if (chromaData) {
        chromaKey = chromaData.chromaKey;
        // Use half the distance as tolerance - safe margin against eating sprite colours
        chromaTolerance = chromaData.distance / 2;
        console.log(`[CharacterTab] Using chromaKey ${chromaKey} with tolerance ${chromaTolerance.toFixed(1)} for palette ${paletteMode}`);
      }
    }

    let rawImageBase64: string;

    if (existingSprites.size === 0) {
      // First sprite - use generateSprite (creates new session)
      rawImageBase64 = await generateSprite(identity, direction, 'final', undefined, chromaKey);
      setHasActiveSession(true);
    } else {
      // Subsequent sprites - use reference stacking for consistency
      const referenceImages: ReferenceImage[] = [];

      for (const [dir, sprite] of existingSprites.entries()) {
        try {
          const base64Data = await renderPixelDataToBase64(sprite, '#FFFFFF');
          referenceImages.push({ direction: dir, base64Data });
        } catch (refErr) {
          console.warn(`Failed to render ${dir} sprite for reference:`, refErr);
        }
      }

      if (referenceImages.length === 0) {
        throw new Error('Failed to prepare reference images');
      }

      rawImageBase64 = await generateRotatedSprite(
        identity,
        direction,
        referenceImages,
        'final',
        undefined,
        chromaKey
      );
    }

    // Post-process: remove checkerboard "transparency" pattern
    const imageBase64 = await removeCheckerboardBackground(rawImageBase64);

    // Generate segmentation mask for dual-check background removal
    // This prevents removing white highlights the AI knows are part of the character
    // CRITICAL: The mask is now parsed at ORIGINAL resolution, then scaled with
    // nearest-neighbor in pngToPixelArray to prevent interpolation blur
    let segmentationMask: ParsedMask | undefined;
    try {
      console.log('[CharacterTab] Generating segmentation mask...');
      const { maskData } = await generateSegmentationMask(imageBase64);
      segmentationMask = await parseSegmentationMask(maskData);
      console.log(`[CharacterTab] Segmentation mask parsed at ${segmentationMask.width}x${segmentationMask.height}`);
    } catch (maskError) {
      // Fall back to color-only extraction if mask generation fails
      console.warn('[CharacterTab] Segmentation mask failed, using color-only extraction:', maskError);
    }

    const { pixels, palette } = await pngToPixelArray(imageBase64, size, size, chromaKey, chromaTolerance, segmentationMask);
    const pixelData = validateAndSnapPixelData(
      {
        name: identity.name,
        width: size,
        height: size,
        palette,
        pixels,
      },
      effectivePalette
    );

    const sprite: SpriteData = {
      id: `sprite-${direction}-${Date.now()}`,
      direction,
      createdAt: Date.now(),
      ...pixelData,
    };

    // Determine which palette to lock
    const paletteToLock = paletteColors && paletteColors.length > 0
      ? paletteColors
      : pixelData.palette;

    return { sprite, palette: paletteToLock };
  };

  // Handle Generate Sprite - auto-generates all 4 cardinal directions
  const handleGenerateSprite = async () => {
    if (!apiKey) {
      openApiKeyModal();
      return;
    }

    if (!identity) {
      setError('Please generate an identity first');
      return;
    }

    // If we already have sprites, just generate the current direction
    if (currentSprites.size > 0) {
      setError(null);
      setGeneratingSprite(true);
      setGeneratingDirection(currentDirection);
      setAutoGenerationProgress(`Generating ${currentDirection}...`);

      try {
        const { sprite, palette } = await generateSingleDirection(
          currentDirection,
          currentSprites,
          lockedPalette
        );
        addSprite(currentDirection, sprite);
        setLastFailedGeneration(null);
      } catch (err) {
        setLastFailedGeneration('sprite');
        handleApiError({
          err,
          fallbackMessage: `Failed to generate ${currentDirection} sprite`,
          setError,
          setApiKeyStatus,
          openApiKeyModal,
        });
      } finally {
        setGeneratingSprite(false);
        setGeneratingDirection(null);
        setAutoGenerationProgress(null);
      }
      return;
    }

    // First time - auto-generate all 4 cardinal directions
    setError(null);
    setGeneratingSprite(true);

    // Build sprites map locally to track progress
    const newSprites = new Map<Direction, SpriteData>();
    let currentPalette: string[] | null = null;

    try {
      // Generate only 3 directions (S, E, N) - W is flipped from E
      for (let i = 0; i < GENERATED_DIRECTIONS.length; i++) {
        const direction = GENERATED_DIRECTIONS[i];

        // Update progress (show 4 total since we'll flip E→W)
        setGeneratingDirection(direction);
        setAutoGenerationProgress(`Generating ${direction} (${i + 1}/4)...`);
        setCurrentDirection(direction);

        // Add delay between generations to avoid rate limiting (skip first)
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, DIRECTION_GENERATION_DELAY));
        }

        const { sprite, palette } = await generateSingleDirection(
          direction,
          newSprites,
          currentPalette
        );

        // Lock palette after first sprite
        if (i === 0 && !lockedPalette) {
          lockPalette(palette);
          currentPalette = palette;
        }

        newSprites.set(direction, sprite);
        addSprite(direction, sprite);
      }

      // Flip E→W (NotebookLM: "Symmetry Shortcut" saves an API call)
      const eastSprite = newSprites.get('E');
      if (eastSprite) {
        setAutoGenerationProgress('Flipping E→W (4/4)...');
        setGeneratingDirection('W');
        setCurrentDirection('W');

        const westSprite = flipSpriteHorizontally(eastSprite, 'W');
        newSprites.set('W', westSprite);
        addSprite('W', westSprite);
      }

      setLastFailedGeneration(null);
      setAutoGenerationProgress('All directions complete!');

      // Auto-dismiss success message
      setTimeout(() => setAutoGenerationProgress(null), 2000);

    } catch (err) {
      setLastFailedGeneration('sprite');
      handleApiError({
        err,
        fallbackMessage: 'Failed to generate sprites',
        setError,
        setApiKeyStatus,
        openApiKeyModal,
      });
    } finally {
      setGeneratingSprite(false);
      setGeneratingDirection(null);
    }
  };

  // Handle Save to Library
  const handleSaveToLibrary = async () => {
    if (!identity || currentSprites.size === 0) {
      setError('Nothing to save. Generate identity and sprite first.');
      return;
    }

    setSaveStatus('saving');

    try {
      await saveAsset({
        id: generateAssetId(),
        type: 'character',
        name: identity.name,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        identity,
        sprites: Array.from(currentSprites.values()),
      });
      setError(null);
      setSaveStatus('success');
      // Auto-dismiss success message after 2 seconds
      setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);
    } catch (err) {
      setError('Failed to save to library');
      setSaveStatus('error');
    }
  };

  // Handle Load from Library
  const handleLoadFromLibrary = (asset: Asset) => {
    loadCharacter(asset);
    setError(null);
    setSaveStatus('idle');
    setLastFailedGeneration(null);
  };

  // Handle Retry for failed generations
  const handleRetry = () => {
    if (lastFailedGeneration === 'identity') {
      handleGenerateIdentity();
    } else if (lastFailedGeneration === 'sprite') {
      handleGenerateSprite();
    }
  };

  // Handle Clear
  const handleClear = () => {
    clearCharacter();
  };

  const handleDownloadSprite = async () => {
    if (!currentSprite) return;
    const dataUrl = await renderPixelDataToDataUrl(currentSprite, exportBackground ?? undefined);
    if (!dataUrl) return;

    const link = document.createElement('a');
    const direction = currentSprite.direction ?? currentDirection;
    link.download = `sprite-${direction}-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  };

  const handleZoomIn = () => setZoom(zoom + 0.5);
  const handleZoomOut = () => setZoom(zoom - 0.5);
  const handleZoomReset = () => setZoom(1);

  // Styles
  const containerStyle: React.CSSProperties = {
    display: isMobile ? 'flex' : 'grid',
    flexDirection: isMobile ? 'column' : undefined,
    gridTemplateColumns: isMobile ? undefined : 'minmax(280px, 360px) 1fr minmax(280px, 360px)',
    gap: '24px',
    height: '100%',
    width: '100%',
  };

  const leftColumnStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    minWidth: isMobile ? 'auto' : '280px',
  };

  const centerColumnStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    minWidth: 0,
  };

  const rightColumnStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    minWidth: isMobile ? 'auto' : '260px',
  };

  const sectionStyle: React.CSSProperties = {
    padding: '16px',
    backgroundColor: colors.bgSecondary,
    border: `1px solid ${colors.mint}40`,
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontFamily: 'monospace',
    fontSize: '11px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '0.15em',
    color: colors.cream,
    marginBottom: '12px',
  };

  const canvasWrapperStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    minHeight: isMobile ? '320px' : '420px',
  };

  const controlsStackStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  };

  const zoomControlsStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontFamily: 'monospace',
    fontSize: '12px',
    color: colors.cream,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
  };

  const zoomValueStyle: React.CSSProperties = {
    minWidth: '48px',
    textAlign: 'center',
    fontFamily: 'monospace',
    fontSize: '12px',
    color: colors.mint,
  };

  const backgroundControlsStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    fontFamily: 'monospace',
    fontSize: '12px',
    color: colors.cream,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
  };

  const backgroundButtonsStyle: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  };

  const zoomLabel = Number.isInteger(zoom) ? `${zoom}x` : `${zoom.toFixed(1)}x`;

  return (
    <div style={containerStyle}>
      {/* Character Library Modal */}
      <CharacterLibraryModal
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        onSelectCharacter={handleLoadFromLibrary}
      />

      {/* Left Column - Input & Controls */}
      <div style={leftColumnStyle}>
        {/* Description Input */}
        <div style={sectionStyle}>
          <DescriptionInput
            value={description}
            onChange={setDescription}
            disabled={isGeneratingIdentity || isGeneratingSprite}
            onEnhance={handleOptimizePrompt}
            isEnhancing={isOptimizing}
          />
          {/* Optimized Prompt Preview - shown when enhancement is available */}
          {optimizedPrompt && (
            <div style={{
              marginTop: '16px',
              padding: '12px',
              backgroundColor: colors.bgPrimary,
              border: `2px solid ${colors.mint}40`,
            }}>
              <div style={{
                fontFamily: 'monospace',
                fontSize: '11px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: colors.mint,
                marginBottom: '12px',
              }}>
                Enhanced Description
              </div>
              <div style={{
                fontFamily: 'monospace',
                fontSize: '13px',
                lineHeight: '1.6',
                color: colors.cream,
                maxHeight: '180px',
                overflowY: 'auto',
                marginBottom: '12px',
                padding: '8px',
                backgroundColor: colors.bgSecondary,
                border: `1px solid ${colors.mint}20`,
              }}>
                {optimizedPrompt}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleAcceptOptimizedPrompt}
                >
                  Accept
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDismissOptimizedPrompt}
                >
                  Dismiss
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Palette Playlist - Music player for palette selection */}
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>Palette Selection</div>
          <PalettePlaylist
            selectedPaletteId={styleParams.paletteMode === 'auto' ? null : styleParams.paletteMode}
            onSelect={(paletteId) => setStyleParams({ paletteMode: paletteId })}
            disabled={isGeneratingIdentity || isGeneratingSprite}
            defaultCompact={true}
          />
        </div>

        {/* Style Selector */}
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>Style Options</div>
          <StyleSelector
            value={styleParams}
            onChange={setStyleParams}
            disabled={isGeneratingIdentity || isGeneratingSprite}
          />
        </div>

        {/* Generate Controls */}
        <div style={sectionStyle}>
          <GenerateControls
            hasIdentity={identity !== null}
            hasSprite={currentSprites.size > 0}
            isGeneratingIdentity={isGeneratingIdentity}
            isGeneratingSprite={isGeneratingSprite}
            error={error}
            onGenerateIdentity={handleGenerateIdentity}
            onGenerateSprite={handleGenerateSprite}
            onSaveToLibrary={handleSaveToLibrary}
            onLoadFromLibrary={() => setIsLibraryOpen(true)}
            onClear={handleClear}
            disabled={!isDescriptionValid}
            saveStatus={saveStatus}
            lastFailedGeneration={lastFailedGeneration}
            onRetry={handleRetry}
          />
        </div>
      </div>

      {/* Center Column - Canvas */}
      <div style={centerColumnStyle}>
        {/* Sprite Canvas */}
        <div style={sectionStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={sectionTitleStyle}>Sprite Canvas</div>
            {autoGenerationProgress && (
              <span style={{
                fontFamily: 'monospace',
                fontSize: '12px',
                color: colors.mint,
                animation: 'terminal-blink 1s step-end infinite',
              }}>
                {autoGenerationProgress}
              </span>
            )}
          </div>
          <div style={canvasWrapperStyle}>
            <SpriteCanvas sprite={currentSprite} showGrid background={background} isLoading={isGeneratingSprite} />
            <div style={controlsStackStyle}>
              {/* Direction Picker and Zoom/Download row */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                {/* Direction Picker */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '12px', color: colors.cream, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    Direction
                  </span>
                  <DirectionPicker
                    currentDirection={currentDirection}
                    spritesMap={currentSprites}
                    onDirectionChange={setCurrentDirection}
                    disabled={isGeneratingSprite}
                  />
                </div>

                {/* Zoom and Download controls */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-end' }}>
                  <div style={zoomControlsStyle}>
                    <span>Zoom</span>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleZoomOut}
                      disabled={isGeneratingSprite}
                    >
                      -
                    </Button>
                    <span style={zoomValueStyle}>{zoomLabel}</span>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleZoomIn}
                      disabled={isGeneratingSprite}
                    >
                      +
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleZoomReset}
                      disabled={isGeneratingSprite}
                    >
                      Reset
                    </Button>
                  </div>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleDownloadSprite}
                    disabled={!currentSprite || isGeneratingSprite}
                  >
                    Download PNG
                  </Button>
                </div>
              </div>

              <div style={backgroundControlsStyle}>
                <span>Display Background</span>
                <div style={backgroundButtonsStyle}>
                  <Button
                    variant={background === 'transparent' ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setBackground('transparent')}
                    disabled={isGeneratingSprite}
                  >
                    Transparent
                  </Button>
                  <Button
                    variant={background === 'white' ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setBackground('white')}
                    disabled={isGeneratingSprite}
                  >
                    White
                  </Button>
                  <Button
                    variant={background === 'black' ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setBackground('black')}
                    disabled={isGeneratingSprite}
                  >
                    Black
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Palette Display */}
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>Locked Palette</div>
          <PaletteDisplay />
        </div>
      </div>

      {/* Right Column - Identity */}
      <div style={rightColumnStyle}>
        <IdentityCard
          identity={identity}
          isLoading={isGeneratingIdentity}
          lockedPalette={
            // Show palette colors immediately when selected, or locked palette after sprite gen
            lockedPalette ??
            (styleParams.paletteMode && styleParams.paletteMode !== 'auto'
              ? getLospecColors(styleParams.paletteMode) ?? null
              : null)
          }
        />
      </div>
    </div>
  );
};

export default CharacterTab;

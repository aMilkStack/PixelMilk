import React, { useState, useEffect, useCallback } from 'react';
import { DescriptionInput } from './DescriptionInput';
import { StyleSelector } from './StyleSelector';
import { IdentityCard } from './IdentityCard';
import { GenerateControls } from './GenerateControls';
import { PaletteDisplay } from './PaletteDisplay';
import { SpriteCanvas } from '../canvas';
import { Button } from '../shared/Button';
import { useAppStore, useCanvasStore, useCharacterStore } from '../../stores';
import { generateCharacterIdentity, generateSprite } from '../../services/gemini';
import { saveAsset, generateAssetId, getAssetsByType } from '../../services/storage';
import { pngToPixelArray, removeCheckerboardBackground } from '../../utils/imageUtils';
import { renderPixelDataToDataUrl, validateAndSnapPixelData } from '../../utils/paletteGovernor';
import { getLospecColors } from '../../data/lospecPalettes';
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
      cursor: disabled ? 'not-allowed' : 'pointer',
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
    cursor: 'pointer',
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

  // Handle Generate Sprite
  const handleGenerateSprite = async () => {
    if (!apiKey) {
      openApiKeyModal();
      return;
    }

    if (!identity) {
      setError('Please generate an identity first');
      return;
    }

    setError(null);
    setGeneratingSprite(true);

    try {
      const size = identity.styleParameters.canvasSize;

      // Check if a lospec palette is selected (use current styleParams, not identity's frozen copy)
      const paletteMode = styleParams.paletteMode;
      const lospecColors = paletteMode.startsWith('lospec_') ? getLospecColors(paletteMode) : undefined;
      const effectivePalette = lockedPalette ?? lospecColors ?? undefined;

      // DON'T pass palette to Gemini - it causes it to dither the background with palette colors
      // Instead: generate freely, then snap to palette in post-processing
      const rawImageBase64 = await generateSprite(identity, currentDirection, 'final');

      // Post-process: remove any checkerboard "transparency" pattern Gemini may have drawn
      const imageBase64 = await removeCheckerboardBackground(rawImageBase64);

      const { pixels, palette } = await pngToPixelArray(imageBase64, size, size);
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
        id: `sprite-${Date.now()}`,
        direction: currentDirection,
        createdAt: Date.now(),
        ...pixelData,
      };

      addSprite(currentDirection, sprite);
      setLastFailedGeneration(null);
      // Lock palette if not already locked
      if (!lockedPalette) {
        if (lospecColors && lospecColors.length > 0) {
          lockPalette(lospecColors);  // Lock the Lospec palette
        } else {
          lockPalette(pixelData.palette);  // Lock auto-extracted palette
        }
      }
    } catch (err) {
      setLastFailedGeneration('sprite');
      handleApiError({
        err,
        fallbackMessage: 'Failed to generate sprite',
        setError,
        setApiKeyStatus,
        openApiKeyModal,
      });
    } finally {
      setGeneratingSprite(false);
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
          <div style={sectionTitleStyle}>Sprite Canvas</div>
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
                <span>Background</span>
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
        <IdentityCard identity={identity} isLoading={isGeneratingIdentity} />
      </div>
    </div>
  );
};

export default CharacterTab;

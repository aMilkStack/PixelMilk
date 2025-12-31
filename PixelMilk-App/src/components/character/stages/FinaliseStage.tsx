import React, { useState } from 'react';
import { Direction, SpriteData, Asset } from '../../../types';
import { useCharacterStore } from '../../../stores';
import { useCharacterStageStore } from '../../../stores/characterStageStore';
import { saveAsset, generateAssetId } from '../../../services/storage/assets';
import { PxPalette, PxUser, PxTag, PxDownload, PxSave, PxCheck, PxAlert, PxEdit } from '../../shared/PixelIcon';
import { getPaletteColors } from '../../../data/palettes';
import { downloadSpriteSheet } from '../../../utils/imageUtils';

const colors = {
  bgPrimary: '#021a1a',
  bgSecondary: '#0d2b2b',
  mint: '#8bd0ba',
  mintMuted: '#8bd0ba40',
  coral: '#f04e4e',
  coralMuted: '#f04e4e40',
  cream: '#d8c8b8',
};

// Direction display order for the 2x2 grid
const DIRECTION_ORDER: Direction[] = ['N', 'E', 'S', 'W'];
const DIRECTION_LABELS: Record<Direction, string> = {
  N: 'North',
  E: 'East',
  S: 'South',
  W: 'West',
  NE: 'NE',
  NW: 'NW',
  SE: 'SE',
  SW: 'SW',
};

type SaveStatus = 'idle' | 'saving' | 'success' | 'error';

interface FinaliseStageProps {
  onCreateNew: () => void;
  onViewLibrary: () => void;
}

export const FinaliseStage: React.FC<FinaliseStageProps> = ({
  onCreateNew,
  onViewLibrary,
}) => {
  const {
    currentIdentity,
    currentSprites,
    lockedPalette,
    styleParams,
    clearCharacter,
  } = useCharacterStore();
  const { goToStage, resetStages, isTransitioning } = useCharacterStageStore();

  const [editingName, setEditingName] = useState(false);
  const [characterName, setCharacterName] = useState(currentIdentity?.name || 'Unnamed Character');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Get all sprites as array
  const sprites = DIRECTION_ORDER.map(dir => currentSprites.get(dir)).filter(Boolean) as SpriteData[];
  const hasAllDirections = sprites.length === 4;

  // Get palette colours for display
  const selectedPaletteColors = styleParams.paletteMode
    ? getPaletteColors(styleParams.paletteMode)
    : null;

  const paletteColors = lockedPalette && lockedPalette.length > 0
    ? lockedPalette.slice(0, 16)
    : selectedPaletteColors && selectedPaletteColors.length > 0
    ? selectedPaletteColors.slice(0, 16)
    : currentIdentity?.colourPalette
    ? Object.values(currentIdentity.colourPalette).filter(Boolean).slice(0, 16)
    : [];

  // Handle save to library
  const handleSave = async () => {
    if (!currentIdentity || sprites.length === 0) return;

    setSaveStatus('saving');
    setErrorMessage(null);

    try {
      const asset: Asset = {
        id: generateAssetId(),
        type: 'character',
        name: characterName,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        identity: {
          ...currentIdentity,
          name: characterName,
          updatedAt: Date.now(),
        },
        sprites: sprites,
        thumbnail: sprites[0]?.pixels ? createThumbnail(sprites[0]) : undefined,
      };

      await saveAsset(asset);
      setSaveStatus('success');
    } catch (error) {
      console.error('[FinaliseStage] Failed to save asset:', error);
      setSaveStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save character');
    }
  };

  // Create a simple thumbnail from the first sprite
  const createThumbnail = (sprite: SpriteData): string | undefined => {
    if (!sprite.pixels || sprite.pixels.length === 0) return undefined;

    const canvas = document.createElement('canvas');
    canvas.width = sprite.width;
    canvas.height = sprite.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    // Draw pixels
    for (let i = 0; i < sprite.pixels.length; i++) {
      const x = i % sprite.width;
      const y = Math.floor(i / sprite.width);
      const color = sprite.pixels[i];
      if (color && color !== 'transparent') {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, 1, 1);
      }
    }

    return canvas.toDataURL('image/png');
  };

  // Export all sprites as a sprite sheet (using shared utility)
  const handleExportAll = () => {
    if (!hasAllDirections) return;
    downloadSpriteSheet(currentSprites, characterName, '2x2', null);
  };

  // Handle back to canvas
  const handleBack = () => {
    goToStage('canvas');
  };

  // Handle create new after successful save
  const handleCreateNew = () => {
    clearCharacter();
    resetStages();
    onCreateNew();
  };

  // Styles
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    width: '100%',
    maxWidth: '700px',
    position: 'relative',
  };

  const panelStyle: React.CSSProperties = {
    backgroundColor: colors.bgSecondary,
    border: `1px solid ${colors.mintMuted}`,
    padding: '32px',
    position: 'relative',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '24px',
  };

  const titleStyle: React.CSSProperties = {
    fontFamily: 'FaytePixel, sans-serif',
    fontSize: '62px',
    fontWeight: 700,
    color: colors.mint,
    letterSpacing: '0.02em',
  };

  const subtitleStyle: React.CSSProperties = {
    fontFamily: 'monospace',
    fontSize: '14px',
    color: colors.cream,
    opacity: 0.7,
    lineHeight: 1.5,
  };

  const stepIndicatorStyle: React.CSSProperties = {
    fontFamily: 'monospace',
    fontSize: '11px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '0.15em',
    color: colors.coral,
    marginBottom: '4px',
  };

  const spriteGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '8px',
    marginBottom: '24px',
  };

  const spriteCellStyle: React.CSSProperties = {
    backgroundColor: colors.bgPrimary,
    border: `1px solid ${colors.mintMuted}`,
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  };

  const spriteCanvasStyle: React.CSSProperties = {
    imageRendering: 'pixelated',
    width: '96px',
    height: '96px',
    backgroundColor: 'transparent',
  };

  const directionLabelStyle: React.CSSProperties = {
    fontFamily: 'monospace',
    fontSize: '10px',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: colors.cream,
    opacity: 0.7,
  };

  const sectionLabelStyle: React.CSSProperties = {
    fontFamily: 'monospace',
    fontSize: '10px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '0.15em',
    color: colors.cream,
    opacity: 0.6,
    marginBottom: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  };

  const nameContainerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '20px',
  };

  const nameDisplayStyle: React.CSSProperties = {
    fontFamily: 'FaytePixel, sans-serif',
    fontSize: '24px',
    fontWeight: 700,
    color: colors.mint,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  };

  const nameInputStyle: React.CSSProperties = {
    fontFamily: 'FaytePixel, sans-serif',
    fontSize: '24px',
    fontWeight: 700,
    color: colors.mint,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    backgroundColor: colors.bgPrimary,
    border: `2px solid ${colors.coral}`,
    padding: '8px 12px',
    outline: 'none',
    width: '100%',
  };

  const editButtonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '28px',
    height: '28px',
    backgroundColor: 'transparent',
    border: `1px solid ${colors.mintMuted}`,
    color: colors.cream,
    cursor: 'var(--cursor-pointer)',
    transition: 'all 0.15s ease',
  };

  const paletteSwatchStyle = (color: string): React.CSSProperties => ({
    width: '24px',
    height: '24px',
    backgroundColor: color,
    border: `1px solid ${colors.cream}30`,
  });

  const featureTagStyle: React.CSSProperties = {
    display: 'inline-block',
    padding: '4px 10px',
    fontFamily: 'monospace',
    fontSize: '10px',
    backgroundColor: `${colors.mint}15`,
    border: `1px solid ${colors.mint}40`,
    color: colors.mint,
  };

  const buttonRowStyle: React.CSSProperties = {
    display: 'flex',
    gap: '12px',
    width: '100%',
  };

  const backButtonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '16px 24px',
    fontFamily: 'monospace',
    fontSize: '14px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '0.15em',
    backgroundColor: 'transparent',
    border: `2px solid ${colors.mintMuted}`,
    color: colors.cream,
    cursor: isTransitioning ? 'not-allowed' : 'var(--cursor-pointer)',
    opacity: isTransitioning ? 0.6 : 1,
    transition: 'all 0.2s ease',
  };

  const exportButtonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '16px 24px',
    fontFamily: 'monospace',
    fontSize: '14px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '0.15em',
    backgroundColor: 'transparent',
    border: `2px solid ${colors.mint}60`,
    color: colors.mint,
    cursor: sprites.length === 0 ? 'not-allowed' : 'var(--cursor-pointer)',
    opacity: sprites.length === 0 ? 0.5 : 1,
    transition: 'all 0.2s ease',
  };

  const saveButtonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    flex: 1,
    padding: '16px 32px',
    fontFamily: 'monospace',
    fontSize: '14px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '0.15em',
    backgroundColor: saveStatus === 'success' ? colors.mint : saveStatus === 'error' ? colors.coralMuted : colors.coral,
    border: `2px solid ${saveStatus === 'success' ? colors.mint : saveStatus === 'error' ? colors.coralMuted : colors.coral}`,
    color: saveStatus === 'success' || saveStatus === 'error' ? colors.bgPrimary : colors.bgPrimary,
    cursor: saveStatus === 'saving' || saveStatus === 'success' ? 'not-allowed' : 'var(--cursor-pointer)',
    opacity: saveStatus === 'saving' ? 0.6 : 1,
    transition: 'all 0.2s ease',
  };

  const successActionsStyle: React.CSSProperties = {
    display: 'flex',
    gap: '12px',
    width: '100%',
    marginTop: '12px',
  };

  const successButtonStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '14px 24px',
    fontFamily: 'monospace',
    fontSize: '13px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    backgroundColor: 'transparent',
    border: `2px solid ${colors.mint}`,
    color: colors.mint,
    cursor: 'var(--cursor-pointer)',
    transition: 'all 0.2s ease',
  };

  // Corner bracket CSS
  const cornerBracketCSS = `
    .finalise-panel::before,
    .finalise-panel::after,
    .finalise-panel .corner-bl,
    .finalise-panel .corner-tr {
      content: '';
      position: absolute;
      width: 16px;
      height: 16px;
      border-color: ${colors.coral};
      border-style: solid;
      pointer-events: none;
    }
    .finalise-panel::before {
      top: -1px;
      left: -1px;
      border-width: 3px 0 0 3px;
    }
    .finalise-panel::after {
      bottom: -1px;
      right: -1px;
      border-width: 0 3px 3px 0;
    }
    .finalise-panel .corner-tr {
      top: -1px;
      right: -1px;
      border-width: 3px 3px 0 0;
    }
    .finalise-panel .corner-bl {
      bottom: -1px;
      left: -1px;
      border-width: 0 0 3px 3px;
    }
  `;

  // Render sprite canvas for a direction
  const renderSpriteCanvas = (direction: Direction) => {
    const sprite = currentSprites.get(direction);
    if (!sprite?.pixels) {
      return (
        <div style={{
          ...spriteCanvasStyle,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: `1px dashed ${colors.mintMuted}`,
          color: colors.cream,
          opacity: 0.3,
          fontFamily: 'monospace',
          fontSize: '10px',
        }}>
          No Sprite
        </div>
      );
    }

    // Create data URL from pixels
    const canvas = document.createElement('canvas');
    canvas.width = sprite.width;
    canvas.height = sprite.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    for (let i = 0; i < sprite.pixels.length; i++) {
      const x = i % sprite.width;
      const y = Math.floor(i / sprite.width);
      const color = sprite.pixels[i];
      if (color && color !== 'transparent') {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, 1, 1);
      }
    }

    return (
      <img
        src={canvas.toDataURL('image/png')}
        alt={`${direction} sprite`}
        style={spriteCanvasStyle}
      />
    );
  };

  return (
    <>
      <style>{cornerBracketCSS}</style>
      <div style={containerStyle}>
        <div className="finalise-panel" style={panelStyle}>
          {/* Corner bracket elements */}
          <span className="corner-tr" />
          <span className="corner-bl" />

          {/* Header */}
          <div style={headerStyle}>
            <span style={stepIndicatorStyle}>Step 05</span>
            <h2 style={titleStyle}>Finalise</h2>
            <p style={subtitleStyle}>
              {saveStatus === 'success'
                ? 'Character saved successfully! Create a new character or view your library.'
                : 'Review your character and save to library. You can edit the name before saving.'}
            </p>
          </div>

          {/* Sprite Grid 2x2 */}
          <div style={spriteGridStyle}>
            {DIRECTION_ORDER.map((dir) => (
              <div key={dir} style={spriteCellStyle}>
                {renderSpriteCanvas(dir)}
                <span style={directionLabelStyle}>{DIRECTION_LABELS[dir]}</span>
              </div>
            ))}
          </div>

          {/* Character Name (Editable) */}
          <div style={nameContainerStyle}>
            {editingName ? (
              <input
                type="text"
                value={characterName}
                onChange={(e) => setCharacterName(e.target.value)}
                onBlur={() => setEditingName(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setEditingName(false);
                  if (e.key === 'Escape') {
                    setCharacterName(currentIdentity?.name || 'Unnamed Character');
                    setEditingName(false);
                  }
                }}
                autoFocus
                style={nameInputStyle}
              />
            ) : (
              <>
                <h3 style={nameDisplayStyle}>{characterName}</h3>
                <button
                  style={editButtonStyle}
                  onClick={() => setEditingName(true)}
                  title="Edit name"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = `${colors.mint}20`;
                    e.currentTarget.style.borderColor = colors.mint;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = colors.mintMuted;
                  }}
                >
                  <PxEdit size={14} />
                </button>
              </>
            )}
          </div>

          {/* Palette Preview */}
          {paletteColors.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <div style={sectionLabelStyle}>
                <PxPalette size={12} />
                <span>{lockedPalette ? 'Locked Palette' : 'Colour Palette'}</span>
              </div>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {paletteColors.map((color, index) => (
                  <div
                    key={index}
                    style={paletteSwatchStyle(color as string)}
                    title={color as string}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Identity Summary */}
          {currentIdentity && (
            <div style={{ marginBottom: '16px' }}>
              <div style={sectionLabelStyle}>
                <PxUser size={12} />
                <span>Physical Traits</span>
              </div>
              <div style={{
                fontFamily: 'monospace',
                fontSize: '12px',
                color: colors.cream,
                opacity: 0.8,
                lineHeight: 1.5,
              }}>
                {currentIdentity.physicalDescription.bodyType} / {currentIdentity.physicalDescription.heightStyle} / {currentIdentity.physicalDescription.silhouette}
              </div>
            </div>
          )}

          {/* Distinctive Features */}
          {currentIdentity?.distinctiveFeatures && currentIdentity.distinctiveFeatures.length > 0 && (
            <div>
              <div style={sectionLabelStyle}>
                <PxTag size={12} />
                <span>Distinctive Features</span>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {currentIdentity.distinctiveFeatures.slice(0, 5).map((feature, index) => (
                  <span key={index} style={featureTagStyle}>
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Error Message */}
          {saveStatus === 'error' && errorMessage && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginTop: '16px',
              padding: '12px',
              backgroundColor: `${colors.coral}20`,
              border: `1px solid ${colors.coral}40`,
              color: colors.coral,
              fontFamily: 'monospace',
              fontSize: '12px',
            }}>
              <PxAlert size={16} />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {saveStatus === 'success' ? (
          <div style={successActionsStyle}>
            <button
              style={successButtonStyle}
              onClick={handleCreateNew}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = `${colors.mint}20`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              Create New
            </button>
            <button
              style={{
                ...successButtonStyle,
                backgroundColor: colors.mint,
                color: colors.bgPrimary,
              }}
              onClick={onViewLibrary}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#9fe0ca';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = colors.mint;
              }}
            >
              View in Library
            </button>
          </div>
        ) : (
          <div style={buttonRowStyle}>
            <button
              style={backButtonStyle}
              onClick={handleBack}
              disabled={isTransitioning || saveStatus === 'saving'}
              onMouseEnter={(e) => {
                if (!isTransitioning && saveStatus !== 'saving') {
                  e.currentTarget.style.backgroundColor = `${colors.mint}15`;
                  e.currentTarget.style.borderColor = colors.mint;
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = colors.mintMuted;
              }}
            >
              <span style={{ fontSize: '16px' }}>{'<'}</span>
              <span>Back</span>
            </button>

            <button
              style={exportButtonStyle}
              onClick={handleExportAll}
              disabled={sprites.length === 0}
              onMouseEnter={(e) => {
                if (sprites.length > 0) {
                  e.currentTarget.style.backgroundColor = `${colors.mint}20`;
                  e.currentTarget.style.borderColor = colors.mint;
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = `${colors.mint}60`;
              }}
            >
              <PxDownload size={16} />
              <span>Export</span>
            </button>

            <button
              style={saveButtonStyle}
              onClick={handleSave}
              disabled={saveStatus === 'saving' || !currentIdentity || sprites.length === 0}
              onMouseEnter={(e) => {
                if (saveStatus !== 'saving' && currentIdentity && sprites.length > 0) {
                  e.currentTarget.style.backgroundColor = '#ff6b6b';
                  e.currentTarget.style.borderColor = '#ff6b6b';
                }
              }}
              onMouseLeave={(e) => {
                if (saveStatus !== 'saving' && currentIdentity && sprites.length > 0) {
                  e.currentTarget.style.backgroundColor = colors.coral;
                  e.currentTarget.style.borderColor = colors.coral;
                }
              }}
            >
              {saveStatus === 'saving' ? (
                <>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <PxSave size={16} />
                  <span>Save to Library</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default FinaliseStage;

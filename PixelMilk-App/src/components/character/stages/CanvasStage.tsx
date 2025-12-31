import React, { useState, useCallback } from 'react';
import { Direction, SpriteData, CharacterIdentity } from '../../../types';
import { useCharacterStore } from '../../../stores';
import { useCharacterStageStore } from '../../../stores/characterStageStore';
import { SpriteCanvas, CanvasEditor, ResizeModal } from '../../canvas';
import {
  PxDownload,
  PxGrid,
  PxInfo,
  PxPalette,
  PxUser,
  PxTag,
  PxChevronDown,
  PxChevronUp,
  PxEdit,
  PxEye,
  PxClose,
  PxCheckDouble,
  PxZap,
  PxLayout,
  PxScale,
} from '../../shared/PixelIcon';
import { getPaletteColors } from '../../../data/palettes';
import { applyHotspotEdit } from '../../../services/gemini/editing';
import { downloadSpriteSheet, type SpriteSheetLayout } from '../../../utils/imageUtils';
import type { CanvasSize, ResizeMode } from '../../../utils/spriteResize';

const colors = {
  bgPrimary: '#021a1a',
  bgSecondary: '#0d2b2b',
  bgTertiary: '#152f2f',
  mint: '#8bd0ba',
  mintMuted: '#8bd0ba40',
  coral: '#f04e4e',
  coralMuted: '#f04e4e40',
  cream: '#d8c8b8',
};

type BackgroundType = 'transparent' | 'white' | 'black';
type GenerationMode = 'current' | 'all';

// Direction rotation order (clockwise)
const DIRECTION_ORDER: Direction[] = ['N', 'E', 'S', 'W'];

interface CanvasStageProps {
  onGenerateSprite: () => Promise<void>;
  onDownloadSprite: () => void;
  onSpriteChange: (sprite: SpriteData) => void;
  isGenerating: boolean;
  generatingDirection?: Direction | null;
  autoGenerationProgress?: string | null;
  generationMode: GenerationMode;
  onGenerationModeChange: (mode: GenerationMode) => void;
}

// Full identity panel content component (matches IdentityStage's IdentityContent)
interface IdentityPanelContentProps {
  identity: CharacterIdentity;
  lockedPalette: string[] | null;
  styleParams: { paletteMode: string };
  notesExpanded: boolean;
  setNotesExpanded: (expanded: boolean) => void;
}

const IdentityPanelContent: React.FC<IdentityPanelContentProps> = ({
  identity,
  lockedPalette,
  styleParams,
  notesExpanded,
  setNotesExpanded,
}) => {
  const sectionLabelStyle: React.CSSProperties = {
    fontFamily: 'monospace',
    fontSize: '9px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    color: colors.cream,
    opacity: 0.6,
    marginBottom: '6px',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
  };

  const nameStyle: React.CSSProperties = {
    fontFamily: 'FaytePixel, sans-serif',
    fontSize: '18px',
    fontWeight: 700,
    color: colors.mint,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '14px',
  };

  const paletteSwatchStyle = (color: string): React.CSSProperties => ({
    width: '20px',
    height: '20px',
    backgroundColor: color,
    border: `1px solid ${colors.cream}30`,
  });

  const physicalGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '1px',
    backgroundColor: colors.mintMuted,
    border: `1px solid ${colors.mintMuted}`,
  };

  const physicalCellStyle: React.CSSProperties = {
    backgroundColor: colors.bgPrimary,
    padding: '8px',
  };

  const physicalLabelStyle: React.CSSProperties = {
    fontFamily: 'monospace',
    fontSize: '8px',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: colors.mint,
    opacity: 0.7,
    marginBottom: '2px',
  };

  const physicalValueStyle: React.CSSProperties = {
    fontFamily: 'monospace',
    fontSize: '10px',
    color: colors.cream,
  };

  const featureTagStyle: React.CSSProperties = {
    display: 'inline-block',
    padding: '4px 8px',
    fontFamily: 'monospace',
    fontSize: '9px',
    backgroundColor: `${colors.mint}15`,
    border: `1px solid ${colors.mint}40`,
    color: colors.mint,
  };

  const { name, colourPalette, physicalDescription, distinctiveFeatures, angleNotes } = identity;

  // Show locked palette if available, otherwise selected Lospec palette, otherwise semantic colors
  const selectedPaletteColors = styleParams.paletteMode
    ? getPaletteColors(styleParams.paletteMode)
    : null;

  const paletteColors = lockedPalette && lockedPalette.length > 0
    ? lockedPalette.slice(0, 12)
    : selectedPaletteColors && selectedPaletteColors.length > 0
    ? selectedPaletteColors.slice(0, 12)
    : Object.entries(colourPalette || {})
        .filter(([_, value]) => value)
        .map(([_, value]) => value as string);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Character Name */}
      <h3 style={nameStyle}>{name}</h3>

      {/* Color Palette */}
      <div>
        <div style={sectionLabelStyle}>
          <PxPalette size={10} />
          <span>{lockedPalette ? 'Locked Palette' : 'Colour Palette'}</span>
        </div>
        <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
          {paletteColors.map((color, index) => (
            <div
              key={index}
              style={paletteSwatchStyle(color)}
              title={color}
            />
          ))}
        </div>
      </div>

      {/* Physical Description */}
      <div>
        <div style={sectionLabelStyle}>
          <PxUser size={10} />
          <span>Physical Description</span>
        </div>
        <div style={physicalGridStyle}>
          <div style={physicalCellStyle}>
            <div style={physicalLabelStyle}>Body</div>
            <div style={physicalValueStyle}>{physicalDescription.bodyType}</div>
          </div>
          <div style={physicalCellStyle}>
            <div style={physicalLabelStyle}>Height</div>
            <div style={physicalValueStyle}>{physicalDescription.heightStyle}</div>
          </div>
          <div style={physicalCellStyle}>
            <div style={physicalLabelStyle}>Silhouette</div>
            <div style={physicalValueStyle}>{physicalDescription.silhouette}</div>
          </div>
        </div>
      </div>

      {/* Distinctive Features */}
      {distinctiveFeatures && distinctiveFeatures.length > 0 && (
        <div>
          <div style={sectionLabelStyle}>
            <PxTag size={10} />
            <span>Distinctive Features</span>
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {distinctiveFeatures.map((feature, index) => (
              <span key={index} style={featureTagStyle}>
                {feature}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Angle Notes (Collapsible) */}
      {angleNotes && Object.keys(angleNotes).length > 0 && (
        <div style={{ borderTop: `1px solid ${colors.mintMuted}`, paddingTop: '12px' }}>
          <button
            onClick={() => setNotesExpanded(!notesExpanded)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'var(--cursor-pointer)',
              ...sectionLabelStyle,
              marginBottom: notesExpanded ? '10px' : 0,
            }}
          >
            <span>Angle-Specific Notes</span>
            {notesExpanded ? <PxChevronUp size={12} /> : <PxChevronDown size={12} />}
          </button>
          {notesExpanded && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {(['S', 'N', 'E', 'W'] as const).map((direction) => {
                const note = angleNotes[direction];
                if (!note) return null;
                return (
                  <div
                    key={direction}
                    style={{
                      borderLeft: `2px solid ${colors.mint}60`,
                      paddingLeft: '10px',
                      paddingTop: '3px',
                      paddingBottom: '3px',
                    }}
                  >
                    <div style={{ ...physicalLabelStyle, marginBottom: '1px' }}>{direction}</div>
                    <div style={{ fontFamily: 'monospace', fontSize: '9px', color: colors.cream, opacity: 0.8, lineHeight: 1.3 }}>
                      {note}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Toolbar icon button component
interface ToolbarButtonProps {
  active?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  disabled?: boolean;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({ active, onClick, title, children, disabled }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '28px',
        height: '28px',
        backgroundColor: active ? `${colors.mint}20` : hovered ? `${colors.mint}10` : 'transparent',
        border: active ? `2px solid ${colors.mint}` : `1px solid ${colors.mint}60`,
        color: active ? colors.mint : colors.cream,
        cursor: disabled ? 'not-allowed' : 'var(--cursor-pointer)',
        opacity: disabled ? 0.4 : 1,
        transition: 'all 0.15s ease',
      }}
    >
      {children}
    </button>
  );
};

// Background swatch button for toolbar - compact square icons
interface BackgroundSwatchProps {
  type: BackgroundType;
  active: boolean;
  onClick: () => void;
}

const BackgroundSwatch: React.FC<BackgroundSwatchProps> = ({ type, active, onClick }) => {
  const [hovered, setHovered] = useState(false);

  // Visual representation of each background type
  const getSwatchContent = () => {
    if (type === 'transparent') {
      // Checkerboard pattern - 4x4 grid for compact icon
      return (
        <div style={{
          width: '16px',
          height: '16px',
          background: `repeating-conic-gradient(#808080 0% 25%, #c0c0c0 0% 50%) 50% / 8px 8px`,
        }} />
      );
    }
    // Solid color squares
    return (
      <div style={{
        width: '16px',
        height: '16px',
        backgroundColor: type === 'white' ? '#ffffff' : '#000000',
        border: type === 'black' ? `1px solid ${colors.mint}50` : 'none',
      }} />
    );
  };

  return (
    <button
      onClick={onClick}
      title={`${type.charAt(0).toUpperCase() + type.slice(1)} background`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '28px',
        height: '28px',
        backgroundColor: active ? `${colors.mint}20` : hovered ? `${colors.mint}10` : 'transparent',
        border: active ? `2px solid ${colors.mint}` : `1px solid ${colors.mint}60`,
        cursor: 'var(--cursor-pointer)',
        transition: 'all 0.15s ease',
        padding: 0,
      }}
    >
      {getSwatchContent()}
    </button>
  );
};

export const CanvasStage: React.FC<CanvasStageProps> = ({
  onGenerateSprite,
  onDownloadSprite,
  onSpriteChange,
  isGenerating,
  generatingDirection,
  autoGenerationProgress,
  generationMode,
  onGenerationModeChange,
}) => {
  const {
    currentIdentity,
    currentSprites,
    currentDirection,
    setCurrentDirection,
    lockedPalette,
    styleParams,
    resizeSprites,
  } = useCharacterStore();
  const { goToStage } = useCharacterStageStore();

  const [background, setBackground] = useState<BackgroundType>('transparent');
  const [showGrid, setShowGrid] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showIdentityPanel, setShowIdentityPanel] = useState(false);
  const [notesExpanded, setNotesExpanded] = useState(false);
  const [spriteSheetLayout, setSpriteSheetLayout] = useState<SpriteSheetLayout>('2x2');

  // Request Changes state
  const [showChangesInput, setShowChangesInput] = useState(false);
  const [changesInstruction, setChangesInstruction] = useState('');
  const [isApplyingChanges, setIsApplyingChanges] = useState(false);
  const [changesError, setChangesError] = useState<string | null>(null);

  // Resize modal state
  const [showResizeModal, setShowResizeModal] = useState(false);

  const currentSprite = currentSprites.get(currentDirection) || null;
  const hasAnySprites = currentSprites.size > 0;
  const hasAllDirections = DIRECTION_ORDER.every(dir => currentSprites.has(dir));

  // Rotate direction
  const rotateDirection = (delta: number) => {
    const currentIndex = DIRECTION_ORDER.indexOf(currentDirection);
    const newIndex = (currentIndex + delta + DIRECTION_ORDER.length) % DIRECTION_ORDER.length;
    setCurrentDirection(DIRECTION_ORDER[newIndex]);
  };

  // Check if direction has sprite
  const hasSprite = (dir: Direction) => currentSprites.has(dir);

  // Handle sprite changes from editor
  const handleSpriteChange = useCallback((sprite: SpriteData) => {
    onSpriteChange(sprite);
  }, [onSpriteChange]);

  // Exit edit mode when sprite changes
  React.useEffect(() => {
    setIsEditMode(false);
  }, [currentSprite?.id]);

  // Handle sprite sheet export
  const handleExportSpriteSheet = useCallback(() => {
    if (!hasAllDirections || !currentIdentity) return;

    // Get background color based on current selection
    const bgColor = background === 'transparent' ? null : background === 'white' ? '#ffffff' : '#000000';

    const success = downloadSpriteSheet(
      currentSprites,
      currentIdentity.name,
      spriteSheetLayout,
      bgColor
    );

    if (!success) {
      console.error('[CanvasStage] Failed to export sprite sheet');
    }
  }, [hasAllDirections, currentIdentity, currentSprites, spriteSheetLayout, background]);

  // Handle Request Changes submission
  const handleApplyChanges = useCallback(async () => {
    if (!currentSprite || !changesInstruction.trim() || !lockedPalette) {
      return;
    }

    setIsApplyingChanges(true);
    setChangesError(null);

    try {
      // Use full sprite as hotspot (center point, max radius to cover entire sprite)
      const centerX = Math.floor(currentSprite.width / 2);
      const centerY = Math.floor(currentSprite.height / 2);
      const maxRadius = Math.max(currentSprite.width, currentSprite.height);

      const newPixels = await applyHotspotEdit({
        sprite: currentSprite,
        hotspotX: centerX,
        hotspotY: centerY,
        hotspotRadius: maxRadius,
        instruction: changesInstruction,
        lockedPalette,
      });

      // Update sprite with new pixels
      const updatedSprite: SpriteData = {
        ...currentSprite,
        pixels: newPixels,
      };

      onSpriteChange(updatedSprite);
      setChangesInstruction('');
      setShowChangesInput(false);
    } catch (err) {
      setChangesError(err instanceof Error ? err.message : 'Failed to apply changes');
    } finally {
      setIsApplyingChanges(false);
    }
  }, [currentSprite, changesInstruction, lockedPalette, onSpriteChange]);

  // Handle canvas resize
  const handleResize = useCallback((newSize: CanvasSize, mode: ResizeMode) => {
    resizeSprites(newSize, mode);
  }, [resizeSprites]);

  // Get current canvas size from sprite or styleParams
  const currentCanvasSize = currentSprite?.width ?? styleParams.canvasSize;

  // === STYLES ===

  // Main container - full height flex column
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: '100%',
    backgroundColor: colors.bgPrimary,
    position: 'relative',
  };

  // Header bar
  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    borderBottom: `1px solid ${colors.mintMuted}`,
    backgroundColor: colors.bgSecondary,
    flexShrink: 0,
    position: 'relative',
  };

  const headerSideStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    minWidth: '120px',
  };

  const headerCenterStyle: React.CSSProperties = {
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0px',
  };

  const backButtonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 10px',
    fontFamily: 'monospace',
    fontSize: '11px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    backgroundColor: 'transparent',
    border: `1px solid ${colors.mintMuted}`,
    color: colors.cream,
    cursor: 'var(--cursor-pointer)',
    transition: 'all 0.15s ease',
  };

  const titleStyle: React.CSSProperties = {
    fontFamily: 'FaytePixel, sans-serif',
    fontSize: '42px',
    fontWeight: 700,
    color: colors.mint,
    letterSpacing: '0.02em',
    lineHeight: 1,
  };

  const characterNameStyle: React.CSSProperties = {
    fontFamily: 'monospace',
    fontSize: '10px',
    color: colors.cream,
    opacity: 0.5,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  };

  // Main content area - flex row with toolbar, canvas, and optional panel
  const mainAreaStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'row',
    overflow: 'hidden',
    position: 'relative',
    minHeight: 0,
  };

  // Left toolbar
  const toolbarStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    padding: '12px 8px',
    backgroundColor: colors.bgSecondary,
    borderRight: `1px solid ${colors.mintMuted}`,
    flexShrink: 0,
  };

  const toolbarSectionStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  };

  const toolbarDividerStyle: React.CSSProperties = {
    height: '1px',
    backgroundColor: colors.mintMuted,
    margin: '8px 0',
  };

  // Canvas area - fills remaining space
  const canvasAreaStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    padding: '16px',
  };

  // Direction picker - floating over canvas (top-left)
  const directionPickerStyle: React.CSSProperties = {
    position: 'absolute',
    top: '16px',
    left: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    zIndex: 10,
  };

  const rotateButtonStyle = (disabled: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '28px',
    height: '28px',
    fontFamily: 'monospace',
    fontSize: '14px',
    fontWeight: 'bold',
    backgroundColor: colors.bgSecondary,
    border: `1px solid ${colors.mint}60`,
    color: colors.mint,
    cursor: disabled ? 'not-allowed' : 'var(--cursor-pointer)',
    opacity: disabled ? 0.4 : 1,
    transition: 'all 0.15s ease',
  });

  const directionDisplayStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    fontFamily: 'monospace',
    fontSize: '12px',
    fontWeight: 'bold',
    backgroundColor: colors.bgSecondary,
    border: `1px solid ${colors.coral}`,
    color: colors.coral,
  };

  const directionIndicatorStyle: React.CSSProperties = {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: hasSprite(currentDirection) ? colors.mint : colors.cream + '40',
  };

  // Sprite indicators - floating below direction picker
  const spriteIndicatorsStyle: React.CSSProperties = {
    position: 'absolute',
    top: '52px',
    left: '16px',
    display: 'flex',
    gap: '4px',
    zIndex: 10,
  };

  // Right panel (identity info)
  const identityPanelStyle: React.CSSProperties = {
    width: '260px',
    maxHeight: '100%',
    overflow: 'auto',
    backgroundColor: colors.bgSecondary,
    borderLeft: `1px solid ${colors.mintMuted}`,
    padding: '16px',
    flexShrink: 0,
  };

  const identityHeaderStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
    paddingBottom: '8px',
    borderBottom: `1px solid ${colors.mintMuted}`,
  };

  // Bottom bar
  const bottomBarStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '16px',
    padding: '12px 16px',
    borderTop: `1px solid ${colors.mintMuted}`,
    backgroundColor: colors.bgSecondary,
    flexShrink: 0,
  };

  const modeButtonStyle = (isActive: boolean): React.CSSProperties => ({
    padding: '6px 12px',
    fontFamily: 'monospace',
    fontSize: '10px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    backgroundColor: isActive ? `${colors.mint}20` : 'transparent',
    border: `1px solid ${isActive ? colors.mint : colors.mintMuted}`,
    color: isActive ? colors.mint : colors.cream,
    cursor: isGenerating ? 'not-allowed' : 'var(--cursor-pointer)',
    opacity: isGenerating ? 0.5 : 1,
    transition: 'all 0.15s ease',
  });

  const generateButtonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '10px 20px',
    fontFamily: 'monospace',
    fontSize: '12px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    backgroundColor: isGenerating ? colors.coralMuted : colors.coral,
    border: `2px solid ${isGenerating ? colors.coralMuted : colors.coral}`,
    color: colors.bgPrimary,
    cursor: isGenerating ? 'not-allowed' : 'var(--cursor-pointer)',
    transition: 'all 0.15s ease',
  };

  const downloadButtonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '10px 16px',
    fontFamily: 'monospace',
    fontSize: '11px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    backgroundColor: 'transparent',
    border: `1px solid ${colors.mint}`,
    color: colors.mint,
    cursor: currentSprite ? 'var(--cursor-pointer)' : 'not-allowed',
    opacity: currentSprite ? 1 : 0.4,
    transition: 'all 0.15s ease',
  };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div style={headerSideStyle}>
          <button
            style={backButtonStyle}
            onClick={() => goToStage('identity')}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = `${colors.mint}15`;
              e.currentTarget.style.borderColor = colors.mint;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = colors.mintMuted;
            }}
          >
            <span>{'<'}</span>
            <span>Back</span>
          </button>
        </div>

        <div style={headerCenterStyle}>
          <h2 style={titleStyle}>Canvas</h2>
          {currentIdentity && (
            <span style={characterNameStyle}>{currentIdentity.name}</span>
          )}
        </div>

        <div style={{ ...headerSideStyle, justifyContent: 'flex-end' }}>
          {/* Placeholder for right-side header items if needed */}
        </div>
      </div>

      {/* Main Content Area */}
      <div style={mainAreaStyle}>
        {/* Left Toolbar */}
        <div style={toolbarStyle}>
          {/* View Controls Section */}
          <div style={toolbarSectionStyle}>
            <ToolbarButton
              active={showGrid}
              onClick={() => setShowGrid(!showGrid)}
              title="Toggle grid"
            >
              <PxGrid size={16} />
            </ToolbarButton>
          </div>

          <div style={toolbarDividerStyle} />

          {/* Background Section */}
          <div style={toolbarSectionStyle}>
            <BackgroundSwatch
              type="transparent"
              active={background === 'transparent'}
              onClick={() => setBackground('transparent')}
            />
            <BackgroundSwatch
              type="white"
              active={background === 'white'}
              onClick={() => setBackground('white')}
            />
            <BackgroundSwatch
              type="black"
              active={background === 'black'}
              onClick={() => setBackground('black')}
            />
          </div>

          <div style={toolbarDividerStyle} />

          {/* Edit Mode Section */}
          <div style={toolbarSectionStyle}>
            <ToolbarButton
              active={isEditMode}
              onClick={() => currentSprite && !isGenerating && setIsEditMode(!isEditMode)}
              title={isEditMode ? 'Exit edit mode' : 'Enter edit mode'}
              disabled={!currentSprite || isGenerating}
            >
              {isEditMode ? <PxEye size={16} /> : <PxEdit size={16} />}
            </ToolbarButton>
          </div>

          <div style={toolbarDividerStyle} />

          {/* Resize Section */}
          <div style={toolbarSectionStyle}>
            <ToolbarButton
              active={false}
              onClick={() => setShowResizeModal(true)}
              title={`Resize canvas (${currentCanvasSize}px)`}
              disabled={!hasAnySprites || isGenerating}
            >
              <PxScale size={16} />
            </ToolbarButton>
            {/* Size indicator below resize button */}
            {hasAnySprites && (
              <div
                style={{
                  fontFamily: 'monospace',
                  fontSize: '9px',
                  color: colors.mint,
                  textAlign: 'center',
                  opacity: 0.8,
                }}
              >
                {currentCanvasSize}px
              </div>
            )}
          </div>

          <div style={toolbarDividerStyle} />

          {/* Identity Panel Toggle */}
          <div style={toolbarSectionStyle}>
            <ToolbarButton
              active={showIdentityPanel}
              onClick={() => setShowIdentityPanel(!showIdentityPanel)}
              title="Toggle identity panel"
            >
              <PxInfo size={16} />
            </ToolbarButton>
          </div>
        </div>

        {/* Canvas Area */}
        <div style={canvasAreaStyle}>
          {/* Floating Direction Picker */}
          <div style={directionPickerStyle}>
            <button
              style={rotateButtonStyle(isGenerating)}
              onClick={() => rotateDirection(-1)}
              disabled={isGenerating}
              title="Previous direction"
              onMouseEnter={(e) => {
                if (!isGenerating) {
                  e.currentTarget.style.backgroundColor = `${colors.mint}20`;
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = colors.bgSecondary;
              }}
            >
              {'<'}
            </button>

            <div style={directionDisplayStyle}>
              <span>{currentDirection}</span>
              <div style={directionIndicatorStyle} title={hasSprite(currentDirection) ? 'Has sprite' : 'No sprite'} />
            </div>

            <button
              style={rotateButtonStyle(isGenerating)}
              onClick={() => rotateDirection(1)}
              disabled={isGenerating}
              title="Next direction"
              onMouseEnter={(e) => {
                if (!isGenerating) {
                  e.currentTarget.style.backgroundColor = `${colors.mint}20`;
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = colors.bgSecondary;
              }}
            >
              {'>'}
            </button>
          </div>

          {/* Floating Sprite Indicators */}
          <div style={spriteIndicatorsStyle}>
            {DIRECTION_ORDER.map((dir) => (
              <button
                key={dir}
                onClick={() => setCurrentDirection(dir)}
                style={{
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'monospace',
                  fontSize: '9px',
                  fontWeight: 'bold',
                  backgroundColor: dir === currentDirection ? colors.coral : colors.bgSecondary,
                  border: `1px solid ${dir === currentDirection ? colors.coral : hasSprite(dir) ? colors.mint : colors.mintMuted}`,
                  color: dir === currentDirection ? colors.bgPrimary : hasSprite(dir) ? colors.mint : colors.cream + '60',
                  cursor: 'var(--cursor-pointer)',
                  transition: 'all 0.15s ease',
                }}
                title={`${dir}${hasSprite(dir) ? ' (has sprite)' : ''}`}
              >
                {dir}
              </button>
            ))}
          </div>

          {/* Canvas */}
          {isEditMode && currentSprite ? (
            <CanvasEditor
              sprite={currentSprite}
              lockedPalette={lockedPalette ?? []}
              onSpriteChange={handleSpriteChange}
            />
          ) : (
            <SpriteCanvas
              sprite={currentSprite}
              showGrid={showGrid}
              background={background}
              isLoading={isGenerating && generatingDirection === currentDirection}
            />
          )}
        </div>

        {/* Right Panel (Identity Info) - Collapsible */}
        {showIdentityPanel && currentIdentity && (
          <div style={identityPanelStyle}>
            <div style={identityHeaderStyle}>
              <span style={{ fontFamily: 'monospace', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: colors.mint }}>
                Identity
              </span>
              <button
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '20px',
                  height: '20px',
                  background: 'none',
                  border: `1px solid ${colors.mintMuted}`,
                  color: colors.cream,
                  cursor: 'var(--cursor-pointer)',
                  fontSize: '12px',
                }}
                onClick={() => setShowIdentityPanel(false)}
              >
                <PxClose size={12} />
              </button>
            </div>
            <IdentityPanelContent
              identity={currentIdentity}
              lockedPalette={lockedPalette}
              styleParams={styleParams}
              notesExpanded={notesExpanded}
              setNotesExpanded={setNotesExpanded}
            />
          </div>
        )}
      </div>

      {/* Bottom Bar */}
      <div style={bottomBarStyle}>
        {/* Generation Mode Toggle */}
        <div style={{ display: 'flex', gap: '2px' }}>
          <button
            style={modeButtonStyle(generationMode === 'current')}
            onClick={() => onGenerationModeChange('current')}
            disabled={isGenerating}
            title="Generate only the current direction"
          >
            Current
          </button>
          <button
            style={modeButtonStyle(generationMode === 'all')}
            onClick={() => onGenerationModeChange('all')}
            disabled={isGenerating}
            title="Generate all 4 directions"
          >
            All 4
          </button>
        </div>

        {/* Generate Button */}
        <button
          style={generateButtonStyle}
          onClick={onGenerateSprite}
          disabled={isGenerating}
          onMouseEnter={(e) => {
            if (!isGenerating) {
              e.currentTarget.style.backgroundColor = '#ff6b6b';
              e.currentTarget.style.borderColor = '#ff6b6b';
            }
          }}
          onMouseLeave={(e) => {
            if (!isGenerating) {
              e.currentTarget.style.backgroundColor = colors.coral;
              e.currentTarget.style.borderColor = colors.coral;
            }
          }}
        >
          {isGenerating
            ? (autoGenerationProgress || 'Generating...')
            : hasAnySprites
              ? (generationMode === 'all' ? 'Regenerate All' : 'Regenerate')
              : (generationMode === 'all' ? 'Generate All 4' : 'Generate Sprite')
          }
        </button>

        {/* Request Changes Button & Input */}
        {currentSprite && !isGenerating && (
          showChangesInput ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="text"
                value={changesInstruction}
                onChange={(e) => setChangesInstruction(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && changesInstruction.trim()) {
                    handleApplyChanges();
                  } else if (e.key === 'Escape') {
                    setShowChangesInput(false);
                    setChangesInstruction('');
                    setChangesError(null);
                  }
                }}
                placeholder="Describe changes..."
                disabled={isApplyingChanges}
                autoFocus
                style={{
                  width: '200px',
                  padding: '8px 12px',
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  backgroundColor: colors.bgPrimary,
                  border: `1px solid ${changesError ? colors.coral : colors.mint}`,
                  color: colors.cream,
                  outline: 'none',
                }}
              />
              <button
                onClick={handleApplyChanges}
                disabled={isApplyingChanges || !changesInstruction.trim()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  backgroundColor: isApplyingChanges ? colors.mintMuted : colors.mint,
                  border: `1px solid ${colors.mint}`,
                  color: colors.bgPrimary,
                  cursor: isApplyingChanges || !changesInstruction.trim() ? 'not-allowed' : 'var(--cursor-pointer)',
                  opacity: isApplyingChanges || !changesInstruction.trim() ? 0.6 : 1,
                  transition: 'all 0.15s ease',
                }}
              >
                {isApplyingChanges ? 'Applying...' : 'Apply'}
              </button>
              <button
                onClick={() => {
                  setShowChangesInput(false);
                  setChangesInstruction('');
                  setChangesError(null);
                }}
                disabled={isApplyingChanges}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '28px',
                  height: '28px',
                  backgroundColor: 'transparent',
                  border: `1px solid ${colors.mintMuted}`,
                  color: colors.cream,
                  cursor: isApplyingChanges ? 'not-allowed' : 'var(--cursor-pointer)',
                  opacity: isApplyingChanges ? 0.5 : 1,
                  transition: 'all 0.15s ease',
                }}
                title="Cancel"
              >
                <PxClose size={12} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowChangesInput(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '10px 16px',
                fontFamily: 'monospace',
                fontSize: '11px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                backgroundColor: 'transparent',
                border: `1px solid ${colors.mint}`,
                color: colors.mint,
                cursor: 'var(--cursor-pointer)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = `${colors.mint}15`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              title="Request changes to current sprite"
            >
              <PxZap size={14} />
              <span>Request Changes</span>
            </button>
          )
        )}

        {/* Download Button */}
        <button
          style={downloadButtonStyle}
          onClick={onDownloadSprite}
          disabled={!currentSprite}
          onMouseEnter={(e) => {
            if (currentSprite) {
              e.currentTarget.style.backgroundColor = `${colors.mint}15`;
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <PxDownload size={14} />
          <span>Download</span>
        </button>

        {/* Export Sprite Sheet - appears when all 4 directions have sprites */}
        {hasAllDirections && !isGenerating && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
            {/* Layout Toggle */}
            <button
              onClick={() => setSpriteSheetLayout(spriteSheetLayout === '2x2' ? '1x4' : '2x2')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '10px 8px',
                fontFamily: 'monospace',
                fontSize: '10px',
                fontWeight: 'bold',
                backgroundColor: 'transparent',
                border: `1px solid ${colors.mint}`,
                borderRight: 'none',
                color: colors.mint,
                cursor: 'var(--cursor-pointer)',
                transition: 'all 0.15s ease',
              }}
              title={`Layout: ${spriteSheetLayout} (click to toggle)`}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = `${colors.mint}15`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {spriteSheetLayout}
            </button>
            {/* Export Button */}
            <button
              onClick={handleExportSpriteSheet}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '10px 16px',
                fontFamily: 'monospace',
                fontSize: '11px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                backgroundColor: 'transparent',
                border: `1px solid ${colors.mint}`,
                color: colors.mint,
                cursor: 'var(--cursor-pointer)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = `${colors.mint}15`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              title="Export all 4 directions as a single sprite sheet"
            >
              <PxLayout size={14} />
              <span>Sprite Sheet</span>
            </button>
          </div>
        )}

        {/* Finalise Button - appears when all 4 directions have sprites */}
        {hasAllDirections && !isGenerating && (
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              fontFamily: 'monospace',
              fontSize: '12px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              backgroundColor: colors.coral,
              border: `1px solid ${colors.coral}`,
              color: colors.bgPrimary,
              cursor: 'var(--cursor-pointer)',
              transition: 'all 0.15s ease',
            }}
            onClick={() => goToStage('finalise')}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#ff6b6b';
              e.currentTarget.style.borderColor = '#ff6b6b';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = colors.coral;
              e.currentTarget.style.borderColor = colors.coral;
            }}
          >
            <PxCheckDouble size={14} />
            <span>Finalise</span>
          </button>
        )}
      </div>

      {/* Resize Modal */}
      {showResizeModal && (
        <ResizeModal
          currentSize={currentCanvasSize}
          onResize={handleResize}
          onClose={() => setShowResizeModal(false)}
        />
      )}
    </div>
  );
};

export default CanvasStage;

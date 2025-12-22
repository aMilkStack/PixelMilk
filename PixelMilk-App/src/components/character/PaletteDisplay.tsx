import React from 'react';
import { Lock, Palette, Unlock } from 'lucide-react';
import { useCharacterStore, useCanvasStore } from '../../stores';
import { getLospecColors, getLospecPalette } from '../../data/lospecPalettes';

const colors = {
  bgPrimary: '#021a1a',
  bgSecondary: '#0d2b2b',
  mint: '#8bd0ba',
  cream: '#d8c8b8',
};

export const PaletteDisplay: React.FC = () => {
  const { lockedPalette, styleParams, unlockPalette } = useCharacterStore();
  const { selectedColor, setSelectedColor } = useCanvasStore();

  // Derive effective palette: locked takes precedence, then Lospec preset
  const isLospecMode = styleParams.paletteMode.startsWith('lospec_');
  const lospecColors = isLospecMode ? getLospecColors(styleParams.paletteMode) : undefined;
  const lospecPalette = isLospecMode ? getLospecPalette(styleParams.paletteMode) : undefined;
  const effectivePalette = lockedPalette ?? lospecColors;
  const isLocked = lockedPalette !== null && lockedPalette.length > 0;
  const isLospecPreset = !isLocked && lospecColors && lospecColors.length > 0;

  if (!effectivePalette || effectivePalette.length === 0) {
    return (
      <div
        style={{
          fontFamily: 'monospace',
          fontSize: '12px',
          color: colors.cream,
          opacity: 0.6,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
        }}
      >
        No palette selected
      </div>
    );
  }

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontFamily: 'monospace',
    fontSize: '12px',
    color: colors.cream,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
  };

  const labelStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const countStyle: React.CSSProperties = {
    color: colors.mint,
    fontWeight: 'bold',
  };

  // U8: Unlock button style
  const unlockButtonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
    height: '24px',
    padding: 0,
    border: `1px solid ${colors.mint}40`,
    backgroundColor: 'transparent',
    color: colors.cream,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  };

  const swatchGridStyle: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  };

  const swatchStyle = (color: string): React.CSSProperties => ({
    width: '28px',
    height: '28px',
    backgroundColor: color,
    border: selectedColor === color ? `2px solid ${colors.mint}` : `1px solid ${colors.cream}40`,
    cursor: 'pointer',
    outline: 'none',
    padding: 0,
  });

  // Determine label text based on palette type
  const paletteLabel = isLocked
    ? 'Locked Palette'
    : isLospecPreset && lospecPalette
      ? `Preset: ${lospecPalette.name}`
      : 'Active Palette';

  const PaletteIcon = isLocked ? Lock : Palette;

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <div style={labelStyle}>
          <PaletteIcon size={12} />
          <span>{paletteLabel}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* U8: Unlock palette button - only show when palette is locked */}
          {isLocked && (
            <button
              type="button"
              style={unlockButtonStyle}
              onClick={unlockPalette}
              title="Unlock palette to allow regeneration with different colors"
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = colors.mint;
                e.currentTarget.style.color = colors.mint;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = `${colors.mint}40`;
                e.currentTarget.style.color = colors.cream;
              }}
            >
              <Unlock size={14} />
            </button>
          )}
          <span style={countStyle}>{effectivePalette.length}</span>
        </div>
      </div>

      <div style={swatchGridStyle}>
        {effectivePalette.map((color) => (
          <button
            key={color}
            type="button"
            style={swatchStyle(color)}
            onClick={() => setSelectedColor(color)}
            title={color}
          />
        ))}
      </div>
    </div>
  );
};

export default PaletteDisplay;

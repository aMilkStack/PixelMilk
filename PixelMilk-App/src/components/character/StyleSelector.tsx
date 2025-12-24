import React, { useState, useMemo } from 'react';
import { Select, type SelectOption } from '../shared/Select';
import type { StyleParameters } from '../../types';
import { LOSPEC_PALETTES, getLospecColors } from '../../data/lospecPalettes';

export interface StyleSelectorProps {
  value: StyleParameters;
  onChange: (params: Partial<StyleParameters>) => void;
  disabled?: boolean;
}

// Canvas size options - 128/256 active, smaller sizes coming soon
const canvasSizeOptions: SelectOption[] = [
  { value: '128', label: '128x128' },
  { value: '256', label: '256x256' },
  { value: '16', label: '16x16 (Coming Soon)', disabled: true },
  { value: '32', label: '32x32 (Coming Soon)', disabled: true },
  { value: '64', label: '64x64 (Coming Soon)', disabled: true },
];

// Outline style options
const outlineStyleOptions: SelectOption[] = [
  { value: 'black', label: 'Black Outline' },
  { value: 'colored', label: 'Colored Outline' },
  { value: 'selective', label: 'Selective Outline' },
  { value: 'lineless', label: 'Lineless' },
];

// Shading style options
const shadingStyleOptions: SelectOption[] = [
  { value: 'flat', label: 'Flat' },
  { value: 'basic', label: 'Basic' },
  { value: 'detailed', label: 'Detailed' },
];

// Detail level options
const detailLevelOptions: SelectOption[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

// View type options (palette mode is built dynamically from lospec palettes)

const viewTypeOptions: SelectOption[] = [
  { value: 'standard', label: 'Standard' },
  { value: 'isometric', label: 'Isometric' },
];

export const StyleSelector: React.FC<StyleSelectorProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const [advancedOpen, setAdvancedOpen] = useState(false);

  // Build palette options from lospec palettes
  const paletteModeOptions: SelectOption[] = useMemo(() => {
    const baseOptions: SelectOption[] = [
      { value: 'auto', label: 'Auto (AI Chooses)' },
    ];

    // Add lospec palettes with color count
    const lospecOptions = LOSPEC_PALETTES.map(palette => ({
      value: palette.id,
      label: `${palette.name} (${palette.colors.length})`,
    }));

    return [...baseOptions, ...lospecOptions];
  }, []);

  // Styles
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-md)',
    width: '100%',
  };

  const sectionStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-sm)',
  };

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 'var(--space-md)',
  };

  const mobileGridStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-md)',
  };

  const advancedToggleStyle: React.CSSProperties = {
    background: 'transparent',
    border: `2px solid var(--color-border)`,
    color: 'var(--color-text-primary)',
    padding: 'var(--space-sm) var(--space-md)',
    fontFamily: 'var(--font-mono)',
    fontSize: 'var(--font-size-sm)',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '0.15em',
    cursor: disabled ? 'not-allowed' : 'var(--cursor-pointer)',
    transition: 'all var(--transition-fast)',
    opacity: disabled ? 0.5 : 1,
    borderRadius: 'var(--border-radius)', // 0px - terminal aesthetic
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    ...(advancedOpen && {
      borderColor: 'var(--color-text-primary)',
      boxShadow: 'var(--shadow-glow)',
    }),
  };

  const advancedContentStyle: React.CSSProperties = {
    display: advancedOpen ? 'flex' : 'none',
    flexDirection: 'column',
    gap: 'var(--space-md)',
    paddingTop: 'var(--space-sm)',
    borderTop: `1px solid var(--color-border)`,
    marginTop: 'var(--space-sm)',
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: 'var(--font-size-sm)',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '0.15em',
    color: 'var(--color-text-secondary)',
    marginBottom: 'var(--space-xs)',
  };

  const palettePreviewContainerStyle: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '2px',
    marginTop: 'var(--space-xs)',
    padding: 'var(--space-xs)',
    background: 'var(--color-bg-secondary)',
    border: '1px solid var(--color-border)',
  };

  const paletteSwatchStyle: React.CSSProperties = {
    width: '16px',
    height: '16px',
    flexShrink: 0,
  };

  // Get colors for the selected Lospec palette
  const selectedPaletteColors = useMemo(() => {
    if (value.paletteMode.startsWith('lospec_')) {
      return getLospecColors(value.paletteMode);
    }
    return undefined;
  }, [value.paletteMode]);

  // Use media query for mobile detection
  const [isMobile, setIsMobile] = useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div style={containerStyle}>
      {/* Canvas Size */}
      <div style={sectionStyle}>
        <Select
          label="Canvas Size"
          options={canvasSizeOptions}
          value={String(value.canvasSize)}
          onChange={(e) => onChange({ canvasSize: Number(e.target.value) as 16 | 32 | 64 | 128 | 256 })}
          disabled={disabled}
        />
      </div>

      {/* Main Style Options */}
      <div style={isMobile ? mobileGridStyle : gridStyle}>
        <Select
          label="Outline Style"
          options={outlineStyleOptions}
          value={value.outlineStyle}
          onChange={(e) => onChange({
            outlineStyle: e.target.value as StyleParameters['outlineStyle']
          })}
          disabled={disabled}
        />

        <Select
          label="Shading Style"
          options={shadingStyleOptions}
          value={value.shadingStyle}
          onChange={(e) => onChange({
            shadingStyle: e.target.value as StyleParameters['shadingStyle']
          })}
          disabled={disabled}
        />
      </div>

      {/* Detail Level */}
      <div style={sectionStyle}>
        <Select
          label="Detail Level"
          options={detailLevelOptions}
          value={value.detailLevel}
          onChange={(e) => onChange({
            detailLevel: e.target.value as StyleParameters['detailLevel']
          })}
          disabled={disabled}
        />
      </div>

      {/* Advanced Options Toggle */}
      <button
        type="button"
        style={advancedToggleStyle}
        onClick={() => setAdvancedOpen(!advancedOpen)}
        disabled={disabled}
        onMouseEnter={(e) => {
          if (!disabled) {
            e.currentTarget.style.borderColor = 'var(--color-text-primary)';
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled && !advancedOpen) {
            e.currentTarget.style.borderColor = 'var(--color-border)';
          }
        }}
      >
        <span>Advanced Options</span>
        <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>
          {advancedOpen ? '[-]' : '[+]'}
        </span>
      </button>

      {/* Advanced Options Content */}
      <div style={advancedContentStyle}>
        <div style={sectionTitleStyle}>Advanced Settings</div>

        <div style={isMobile ? mobileGridStyle : gridStyle}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <Select
              label="Palette Mode"
              options={paletteModeOptions}
              value={value.paletteMode}
              onChange={(e) => onChange({
                paletteMode: e.target.value as StyleParameters['paletteMode']
              })}
              disabled={disabled}
            />
            {/* Lospec Palette Color Preview */}
            {selectedPaletteColors && selectedPaletteColors.length > 0 && (
              <div style={palettePreviewContainerStyle}>
                {selectedPaletteColors.map((color, index) => (
                  <div
                    key={`${color}-${index}`}
                    style={{
                      ...paletteSwatchStyle,
                      backgroundColor: color,
                    }}
                    title={color}
                  />
                ))}
              </div>
            )}
          </div>

          <Select
            label="View Type"
            options={viewTypeOptions}
            value={value.viewType}
            onChange={(e) => onChange({
              viewType: e.target.value as StyleParameters['viewType']
            })}
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
};

export default StyleSelector;

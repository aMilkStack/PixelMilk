import React, { useState } from 'react';
import { Select, type SelectOption } from '../shared/Select';
import type { StyleParameters } from '../../types';

export interface StyleSelectorProps {
  value: StyleParameters;
  onChange: (params: Partial<StyleParameters>) => void;
  disabled?: boolean;
}

// Canvas size options - 128/256 active, smaller sizes coming soon
const canvasSizeOptions: SelectOption[] = [
  { value: '128', label: '128x128 (Gameplay)' },
  { value: '256', label: '256x256 (Portraits)' },
  { value: '64', label: '64x64', disabled: true, badge: 'SOON' },
  { value: '32', label: '32x32', disabled: true, badge: 'SOON' },
  { value: '16', label: '16x16', disabled: true, badge: 'SOON' },
];

// Outline style options
const outlineStyleOptions: SelectOption[] = [
  { value: 'single_color_black', label: 'Single Color Black' },
  { value: 'single_color_outline', label: 'Single Color Outline' },
  { value: 'selective_outline', label: 'Selective Outline' },
  { value: 'lineless', label: 'Lineless' },
];

// Shading style options
const shadingStyleOptions: SelectOption[] = [
  { value: 'flat', label: 'Flat' },
  { value: 'basic', label: 'Basic' },
  { value: 'medium', label: 'Medium' },
  { value: 'detailed', label: 'Detailed' },
  { value: 'highly_detailed', label: 'Highly Detailed' },
];

// Detail level options
const detailLevelOptions: SelectOption[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'highly_detailed', label: 'Highly Detailed' },
];

// Advanced options (palette mode and view type)
const paletteModeOptions: SelectOption[] = [
  { value: 'auto', label: 'Auto' },
  { value: 'nes', label: 'NES' },
  { value: 'gameboy', label: 'Game Boy' },
  { value: 'pico8', label: 'PICO-8' },
];

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
    cursor: disabled ? 'not-allowed' : 'pointer',
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
          <Select
            label="Palette Mode"
            options={paletteModeOptions}
            value={value.paletteMode}
            onChange={(e) => onChange({
              paletteMode: e.target.value as StyleParameters['paletteMode']
            })}
            disabled={disabled}
          />

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

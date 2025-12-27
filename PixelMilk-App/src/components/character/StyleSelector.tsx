import React, { useState, useMemo, useCallback } from 'react';
import { Select, type SelectOption } from '../shared/Select';
import type { StyleParameters } from '../../types';
import {
  LOSPEC_PALETTES,
  getLospecColors,
  getLospecPalettesByCategory,
  type PaletteCategory,
  type ExtendedPalette,
} from '../../data/lospecPalettes';

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

const viewTypeOptions: SelectOption[] = [
  { value: 'standard', label: 'Standard' },
  { value: 'isometric', label: 'Isometric' },
];

// Category configuration with colour ranges
const CATEGORY_CONFIG: Record<PaletteCategory, { label: string; range: string }> = {
  Micro: { label: 'Micro', range: '2-7' },
  Limited: { label: 'Limited', range: '8-15' },
  Extended: { label: 'Extended', range: '16-28' },
  Full: { label: 'Full', range: '32-256' },
};

// Curated tag groups for the UI (ordered by relevance)
const TAG_GROUPS = {
  temperature: ['warm', 'cool', 'mixed'],
  intensity: ['vibrant', 'muted', 'balanced'],
  mood: ['dark', 'light', 'high-contrast'],
  style: ['retro', 'cyberpunk', 'fantasy', 'horror', 'sci-fi'],
};

// Terminal aesthetic colors
const colors = {
  bgPrimary: '#021a1a',
  bgSecondary: '#0d2b2b',
  bgTertiary: '#153535',
  mint: '#8bd0ba',
  mintDim: '#5a9a88',
  cream: '#d8c8b8',
  danger: '#f04e4e',
};

export const StyleSelector: React.FC<StyleSelectorProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [palettePickerOpen, setPalettePickerOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<PaletteCategory | 'all'>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter palettes based on category, tags, and search
  const filteredPalettes = useMemo(() => {
    let palettes: ExtendedPalette[] = selectedCategory === 'all'
      ? LOSPEC_PALETTES
      : getLospecPalettesByCategory(selectedCategory);

    // Filter by selected tags (AND logic)
    if (selectedTags.length > 0) {
      palettes = palettes.filter(p =>
        selectedTags.every(tag => p.tags?.includes(tag))
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      palettes = palettes.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.tags?.some(t => t.toLowerCase().includes(query))
      );
    }

    return palettes;
  }, [selectedCategory, selectedTags, searchQuery]);

  // Get the currently selected palette
  const selectedPalette = useMemo(() => {
    return LOSPEC_PALETTES.find(p => p.id === value.paletteMode);
  }, [value.paletteMode]);

  // Get colors for the selected palette
  const selectedPaletteColors = useMemo(() => {
    if (value.paletteMode && value.paletteMode !== 'auto') {
      return getLospecColors(value.paletteMode);
    }
    return undefined;
  }, [value.paletteMode]);

  // Toggle tag selection
  const toggleTag = useCallback((tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  }, []);

  // Select a palette
  const selectPalette = useCallback((paletteId: string) => {
    onChange({ paletteMode: paletteId });
    setPalettePickerOpen(false);
  }, [onChange]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSelectedCategory('all');
    setSelectedTags([]);
    setSearchQuery('');
  }, []);

  // Use media query for mobile detection
  const [isMobile, setIsMobile] = useState(false);
  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // ============================================
  // Styles
  // ============================================

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
    borderRadius: 0,
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

  // Palette picker styles
  const paletteButtonStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '12px',
    background: colors.bgSecondary,
    border: `2px solid ${colors.mint}`,
    borderRadius: 0,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    width: '100%',
  };

  const palettePickerOverlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.8)',
    zIndex: 1000,
    display: palettePickerOpen ? 'flex' : 'none',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  };

  const palettePickerModalStyle: React.CSSProperties = {
    background: colors.bgPrimary,
    border: `2px solid ${colors.mint}`,
    borderRadius: 0,
    maxWidth: '900px',
    width: '100%',
    maxHeight: '85vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  };

  const palettePickerHeaderStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: `1px solid ${colors.mint}`,
    flexShrink: 0,
  };

  const palettePickerBodyStyle: React.CSSProperties = {
    flex: 1,
    overflow: 'auto',
    display: 'flex',
    flexDirection: 'column',
  };

  const searchInputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    background: colors.bgSecondary,
    border: `2px solid ${colors.mintDim}`,
    borderRadius: 0,
    color: colors.mint,
    fontFamily: 'monospace',
    fontSize: '14px',
    outline: 'none',
  };

  const categoryTabsStyle: React.CSSProperties = {
    display: 'flex',
    gap: '0',
    borderBottom: `1px solid ${colors.mintDim}`,
    flexShrink: 0,
    flexWrap: 'wrap',
  };

  const categoryTabStyle = (isActive: boolean): React.CSSProperties => ({
    padding: '10px 16px',
    background: isActive ? colors.bgTertiary : 'transparent',
    border: 'none',
    borderBottom: isActive ? `2px solid ${colors.mint}` : '2px solid transparent',
    color: isActive ? colors.mint : colors.mintDim,
    fontFamily: 'monospace',
    fontSize: '12px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  });

  const tagChipStyle = (isActive: boolean): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 10px',
    background: isActive ? colors.mint : colors.bgSecondary,
    border: `1px solid ${isActive ? colors.mint : colors.mintDim}`,
    borderRadius: 0,
    color: isActive ? colors.bgPrimary : colors.mintDim,
    fontFamily: 'monospace',
    fontSize: '11px',
    fontWeight: isActive ? 'bold' : 'normal',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    textTransform: 'lowercase',
  });

  const paletteGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '12px',
    padding: '16px 20px',
  };

  const paletteCardStyle = (isSelected: boolean): React.CSSProperties => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '12px',
    background: isSelected ? colors.bgTertiary : colors.bgSecondary,
    border: `2px solid ${isSelected ? colors.mint : colors.mintDim}`,
    borderRadius: 0,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  });

  const paletteNameStyle: React.CSSProperties = {
    fontFamily: 'monospace',
    fontSize: '13px',
    fontWeight: 'bold',
    color: colors.cream,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  const paletteSwatchContainerStyle: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '2px',
  };

  const paletteSwatchStyle = (color: string): React.CSSProperties => ({
    width: '14px',
    height: '14px',
    backgroundColor: color,
    flexShrink: 0,
  });

  const closeButtonStyle: React.CSSProperties = {
    background: 'transparent',
    border: `2px solid ${colors.mintDim}`,
    borderRadius: 0,
    color: colors.mint,
    fontFamily: 'monospace',
    fontSize: '14px',
    fontWeight: 'bold',
    padding: '6px 12px',
    cursor: 'pointer',
  };

  const filterSectionStyle: React.CSSProperties = {
    padding: '12px 20px',
    borderBottom: `1px solid ${colors.mintDim}`,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    flexShrink: 0,
  };

  const tagGroupStyle: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    alignItems: 'center',
  };

  const tagGroupLabelStyle: React.CSSProperties = {
    fontFamily: 'monospace',
    fontSize: '10px',
    color: colors.mintDim,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    marginRight: '8px',
    minWidth: '70px',
  };

  const resultCountStyle: React.CSSProperties = {
    fontFamily: 'monospace',
    fontSize: '12px',
    color: colors.mintDim,
    padding: '8px 20px',
    borderBottom: `1px solid ${colors.mintDim}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexShrink: 0,
  };

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
          {/* Palette Picker Button */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{
              fontFamily: 'monospace',
              fontSize: '12px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              color: colors.cream,
            }}>
              Palette Mode
            </label>
            <button
              type="button"
              style={paletteButtonStyle}
              onClick={() => !disabled && setPalettePickerOpen(true)}
              disabled={disabled}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <span style={{
                  fontFamily: 'monospace',
                  fontSize: '14px',
                  color: colors.mint,
                }}>
                  {value.paletteMode === 'auto'
                    ? 'Auto (AI Chooses)'
                    : selectedPalette
                      ? `${selectedPalette.name} (${selectedPalette.colourCount})`
                      : value.paletteMode
                  }
                </span>
                <span style={{
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  color: colors.mintDim,
                }}>
                  [...]
                </span>
              </div>
              {/* Palette Preview */}
              {selectedPaletteColors && selectedPaletteColors.length > 0 && (
                <div style={paletteSwatchContainerStyle}>
                  {selectedPaletteColors.slice(0, 16).map((color, index) => (
                    <div
                      key={`${color}-${index}`}
                      style={paletteSwatchStyle(color)}
                      title={color}
                    />
                  ))}
                  {selectedPaletteColors.length > 16 && (
                    <span style={{
                      fontFamily: 'monospace',
                      fontSize: '10px',
                      color: colors.mintDim,
                      marginLeft: '4px',
                      alignSelf: 'center',
                    }}>
                      +{selectedPaletteColors.length - 16}
                    </span>
                  )}
                </div>
              )}
            </button>
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

      {/* Palette Picker Modal */}
      <div
        style={palettePickerOverlayStyle}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setPalettePickerOpen(false);
          }
        }}
      >
        <div style={palettePickerModalStyle}>
          {/* Header */}
          <div style={palettePickerHeaderStyle}>
            <div style={{
              fontFamily: 'monospace',
              fontSize: '16px',
              fontWeight: 'bold',
              color: colors.mint,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}>
              Select Palette
              <span style={{
                fontSize: '12px',
                color: colors.mintDim,
                marginLeft: '12px',
                fontWeight: 'normal',
              }}>
                {LOSPEC_PALETTES.length} palettes
              </span>
            </div>
            <button
              type="button"
              style={closeButtonStyle}
              onClick={() => setPalettePickerOpen(false)}
            >
              [X] Close
            </button>
          </div>

          {/* Body */}
          <div style={palettePickerBodyStyle}>
            {/* Search */}
            <div style={{ padding: '16px 20px 12px', flexShrink: 0 }}>
              <input
                type="text"
                placeholder="Search palettes by name or tag..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={searchInputStyle}
              />
            </div>

            {/* Category Tabs */}
            <div style={categoryTabsStyle}>
              <button
                type="button"
                style={categoryTabStyle(selectedCategory === 'all')}
                onClick={() => setSelectedCategory('all')}
              >
                All ({LOSPEC_PALETTES.length})
              </button>
              {(Object.keys(CATEGORY_CONFIG) as PaletteCategory[]).map(cat => (
                <button
                  key={cat}
                  type="button"
                  style={categoryTabStyle(selectedCategory === cat)}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {CATEGORY_CONFIG[cat].label} ({CATEGORY_CONFIG[cat].range})
                </button>
              ))}
            </div>

            {/* Tag Filters */}
            <div style={filterSectionStyle}>
              {Object.entries(TAG_GROUPS).map(([groupName, tags]) => (
                <div key={groupName} style={tagGroupStyle}>
                  <span style={tagGroupLabelStyle}>{groupName}:</span>
                  {tags.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      style={tagChipStyle(selectedTags.includes(tag))}
                      onClick={() => toggleTag(tag)}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              ))}
            </div>

            {/* Result Count & Clear Filters */}
            <div style={resultCountStyle}>
              <span>
                {filteredPalettes.length} palette{filteredPalettes.length !== 1 ? 's' : ''} found
              </span>
              {(selectedTags.length > 0 || searchQuery || selectedCategory !== 'all') && (
                <button
                  type="button"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: colors.mint,
                    fontFamily: 'monospace',
                    fontSize: '11px',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                  onClick={clearFilters}
                >
                  Clear Filters
                </button>
              )}
            </div>

            {/* Auto Option */}
            <div style={{ padding: '12px 20px 0', flexShrink: 0 }}>
              <button
                type="button"
                style={paletteCardStyle(value.paletteMode === 'auto')}
                onClick={() => selectPalette('auto')}
              >
                <div style={paletteNameStyle}>
                  <span>Auto (AI Chooses)</span>
                  {value.paletteMode === 'auto' && (
                    <span style={{ color: colors.mint }}>[*]</span>
                  )}
                </div>
                <div style={{
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  color: colors.mintDim,
                }}>
                  Let the AI select an appropriate palette for your character
                </div>
              </button>
            </div>

            {/* Palette Grid - Grouped by Category when viewing All */}
            {selectedCategory === 'all' ? (
              // Grouped view by folder structure
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {(Object.keys(CATEGORY_CONFIG) as PaletteCategory[]).map(category => {
                  const categoryPalettes = filteredPalettes.filter(p => p.category === category);
                  if (categoryPalettes.length === 0) return null;
                  return (
                    <div key={category} style={{ marginBottom: '16px' }}>
                      {/* Category Header */}
                      <div style={{
                        padding: '12px 20px 8px',
                        background: colors.bgTertiary,
                        borderBottom: `1px solid ${colors.mintDim}`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        position: 'sticky',
                        top: 0,
                        zIndex: 1,
                      }}>
                        <span style={{
                          fontFamily: 'monospace',
                          fontSize: '13px',
                          fontWeight: 'bold',
                          color: colors.mint,
                          textTransform: 'uppercase',
                          letterSpacing: '0.1em',
                        }}>
                          {CATEGORY_CONFIG[category].label}
                        </span>
                        <span style={{
                          fontFamily: 'monospace',
                          fontSize: '11px',
                          color: colors.mintDim,
                          background: colors.bgPrimary,
                          padding: '2px 8px',
                        }}>
                          {CATEGORY_CONFIG[category].range} colours · {categoryPalettes.length} palettes
                        </span>
                      </div>
                      {/* Category Palettes */}
                      <div style={paletteGridStyle}>
                        {categoryPalettes.map(palette => (
                          <button
                            key={palette.id}
                            type="button"
                            style={paletteCardStyle(value.paletteMode === palette.id)}
                            onClick={() => selectPalette(palette.id)}
                            onMouseEnter={(e) => {
                              if (value.paletteMode !== palette.id) {
                                e.currentTarget.style.borderColor = colors.mint;
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (value.paletteMode !== palette.id) {
                                e.currentTarget.style.borderColor = colors.mintDim;
                              }
                            }}
                          >
                            <div style={paletteNameStyle}>
                              <span>{palette.name}</span>
                              <span style={{
                                fontSize: '11px',
                                color: colors.mintDim,
                                fontWeight: 'normal',
                              }}>
                                {palette.colourCount}
                              </span>
                            </div>
                            <div style={paletteSwatchContainerStyle}>
                              {palette.colors.slice(0, 12).map((color, index) => (
                                <div
                                  key={`${palette.id}-${color}-${index}`}
                                  style={paletteSwatchStyle(color)}
                                />
                              ))}
                              {palette.colors.length > 12 && (
                                <span style={{
                                  fontFamily: 'monospace',
                                  fontSize: '9px',
                                  color: colors.mintDim,
                                  marginLeft: '2px',
                                  alignSelf: 'center',
                                }}>
                                  +{palette.colors.length - 12}
                                </span>
                              )}
                            </div>
                            {palette.tags && palette.tags.length > 0 && (
                              <div style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '4px',
                                marginTop: '4px',
                              }}>
                                {palette.tags.slice(0, 4).map(tag => (
                                  <span
                                    key={tag}
                                    style={{
                                      fontFamily: 'monospace',
                                      fontSize: '9px',
                                      color: colors.mintDim,
                                      background: colors.bgPrimary,
                                      padding: '2px 5px',
                                    }}
                                  >
                                    {tag}
                                  </span>
                                ))}
                                {palette.tags.length > 4 && (
                                  <span style={{
                                    fontFamily: 'monospace',
                                    fontSize: '9px',
                                    color: colors.mintDim,
                                  }}>
                                    +{palette.tags.length - 4}
                                  </span>
                                )}
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              // Flat grid for single category
              <div style={paletteGridStyle}>
                {filteredPalettes.map(palette => (
                <button
                  key={palette.id}
                  type="button"
                  style={paletteCardStyle(value.paletteMode === palette.id)}
                  onClick={() => selectPalette(palette.id)}
                  onMouseEnter={(e) => {
                    if (value.paletteMode !== palette.id) {
                      e.currentTarget.style.borderColor = colors.mint;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (value.paletteMode !== palette.id) {
                      e.currentTarget.style.borderColor = colors.mintDim;
                    }
                  }}
                >
                  <div style={paletteNameStyle}>
                    <span>{palette.name}</span>
                    <span style={{
                      fontSize: '11px',
                      color: colors.mintDim,
                      fontWeight: 'normal',
                    }}>
                      {palette.colourCount}
                    </span>
                  </div>
                  <div style={paletteSwatchContainerStyle}>
                    {palette.colors.slice(0, 12).map((color, index) => (
                      <div
                        key={`${palette.id}-${color}-${index}`}
                        style={paletteSwatchStyle(color)}
                      />
                    ))}
                    {palette.colors.length > 12 && (
                      <span style={{
                        fontFamily: 'monospace',
                        fontSize: '9px',
                        color: colors.mintDim,
                        marginLeft: '2px',
                        alignSelf: 'center',
                      }}>
                        +{palette.colors.length - 12}
                      </span>
                    )}
                  </div>
                  {palette.tags && palette.tags.length > 0 && (
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '4px',
                      marginTop: '4px',
                    }}>
                      {palette.tags.slice(0, 4).map(tag => (
                        <span
                          key={tag}
                          style={{
                            fontFamily: 'monospace',
                            fontSize: '9px',
                            color: colors.mintDim,
                            background: colors.bgPrimary,
                            padding: '2px 5px',
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                      {palette.tags.length > 4 && (
                        <span style={{
                          fontFamily: 'monospace',
                          fontSize: '9px',
                          color: colors.mintDim,
                        }}>
                          +{palette.tags.length - 4}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              ))}
              </div>
            )}

            {/* Empty State */}
            {filteredPalettes.length === 0 && (
              <div style={{
                padding: '40px 20px',
                textAlign: 'center',
                fontFamily: 'monospace',
                color: colors.mintDim,
              }}>
                No palettes match your filters.
                <br />
                <button
                  type="button"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: colors.mint,
                    fontFamily: 'monospace',
                    fontSize: '14px',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    marginTop: '8px',
                  }}
                  onClick={clearFilters}
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StyleSelector;

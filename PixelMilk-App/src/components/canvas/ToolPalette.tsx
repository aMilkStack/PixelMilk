import React, { useState } from 'react';
import { useCanvasStore } from '../../stores';
import { SHORTCUT_LABELS } from '../../hooks/useKeyboard';
import { PxPalette, PxCursor, PxMove, PxPencil, PxEraser, PxDrop, PxPipette, PxZap } from '../shared/PixelIcon';
import type { ToolMode } from '../../types';

const colors = {
  bgPrimary: '#021a1a',
  bgSecondary: '#0d2b2b',
  mint: '#8bd0ba',
  cream: '#d8c8b8',
  red: '#f04e4e',
};

interface ToolConfig {
  id: ToolMode;
  label: string;
  shortcut: string;
  Icon: React.FC<{ size?: number }>;
}

const tools: ToolConfig[] = [
  { id: 'select', label: 'Select', shortcut: SHORTCUT_LABELS.select, Icon: PxCursor },
  { id: 'pan', label: 'Pan', shortcut: SHORTCUT_LABELS.pan, Icon: PxMove },
  { id: 'draw', label: 'Draw', shortcut: SHORTCUT_LABELS.draw, Icon: PxPencil },
  { id: 'erase', label: 'Erase', shortcut: SHORTCUT_LABELS.erase, Icon: PxEraser },
  { id: 'fill', label: 'Fill', shortcut: SHORTCUT_LABELS.fill, Icon: PxDrop },
  { id: 'eyedropper', label: 'Pick', shortcut: SHORTCUT_LABELS.eyedropper, Icon: PxPipette },
  { id: 'hotspot', label: 'AI Edit', shortcut: SHORTCUT_LABELS.hotspot, Icon: PxZap },
];

interface ToolPaletteProps {
  lockedPalette?: string[];
}

export const ToolPalette: React.FC<ToolPaletteProps> = ({ lockedPalette = [] }) => {
  const { tool, setTool, brushSize, setBrushSize, selectedColor, setSelectedColor } = useCanvasStore();
  const [showPalettePopup, setShowPalettePopup] = useState(false);

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    padding: '8px',
    backgroundColor: colors.bgSecondary,
    border: `1px solid ${colors.mint}40`,
  };

  const toolButtonStyle = (isActive: boolean): React.CSSProperties => ({
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'monospace',
    fontSize: '16px',
    border: `2px solid ${isActive ? colors.mint : colors.mint + '40'}`,
    backgroundColor: isActive ? colors.mint + '30' : 'transparent',
    color: isActive ? colors.mint : colors.cream,
    cursor: 'var(--cursor-pointer)',
    transition: 'all 0.15s ease',
  });

  const dividerStyle: React.CSSProperties = {
    height: '1px',
    backgroundColor: colors.mint + '30',
    margin: '4px 0',
  };

  const brushSizeStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    padding: '4px 0',
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: 'monospace',
    fontSize: '10px',
    color: colors.cream + '80',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    textAlign: 'center',
  };

  const colorSwatchStyle: React.CSSProperties = {
    width: '36px',
    height: '36px',
    backgroundColor: selectedColor,
    border: `2px solid ${colors.mint}`,
    cursor: 'var(--cursor-pointer)',
    position: 'relative',
  };

  const paletteButtonStyle: React.CSSProperties = {
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: `2px solid ${colors.mint}40`,
    backgroundColor: 'transparent',
    color: colors.cream,
    cursor: 'var(--cursor-pointer)',
  };

  const palettePopupStyle: React.CSSProperties = {
    position: 'absolute',
    left: '44px',
    top: 0,
    backgroundColor: colors.bgSecondary,
    border: `1px solid ${colors.mint}40`,
    padding: '8px',
    zIndex: 100,
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 24px)',
    gap: '4px',
    maxHeight: '200px',
    overflowY: 'auto',
  };

  const paletteSwatchStyle = (colour: string, isSelected: boolean): React.CSSProperties => ({
    width: '24px',
    height: '24px',
    backgroundColor: colour,
    border: isSelected ? `2px solid ${colors.mint}` : `1px solid ${colors.mint}40`,
    cursor: 'var(--cursor-pointer)',
  });

  // Custom square slider styles injected via style tag
  const sliderCSS = `
    .square-slider {
      -webkit-appearance: none;
      appearance: none;
      width: 100%;
      height: 4px;
      background: ${colors.mint}40;
      outline: none;
      border: none;
      border-radius: 0;
    }
    .square-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 12px;
      height: 12px;
      background: ${colors.mint};
      cursor: var(--cursor-pointer);
      border: none;
      border-radius: 0;
    }
    .square-slider::-moz-range-thumb {
      width: 12px;
      height: 12px;
      background: ${colors.mint};
      cursor: var(--cursor-pointer);
      border: none;
      border-radius: 0;
    }
  `;

  const showBrushSize = tool === 'draw' || tool === 'erase';

  return (
    <div style={containerStyle}>
      <style>{sliderCSS}</style>
      {tools.map((t) => {
        const isActive = tool === t.id;
        const IconComponent = t.Icon;
        return (
          <button
            key={t.id}
            style={toolButtonStyle(isActive)}
            onClick={() => setTool(t.id)}
            title={`${t.label} (${t.shortcut})`}
          >
            <IconComponent size={18} />
          </button>
        );
      })}

      <div style={dividerStyle} />

      {/* Palette section */}
      <div style={{ position: 'relative' }}>
        {/* Current colour swatch */}
        <div
          style={colorSwatchStyle}
          title={`Selected: ${selectedColor}`}
        />

        {/* Palette toggle button */}
        <button
          style={paletteButtonStyle}
          onClick={() => setShowPalettePopup(!showPalettePopup)}
          title="Select from palette (1-9 for quick select)"
        >
          <PxPalette size={16} />
        </button>

        {/* Palette popup */}
        {showPalettePopup && lockedPalette.length > 0 && (
          <div style={palettePopupStyle}>
            {lockedPalette.map((colour, index) => {
              const shortcutKey = index < 9 ? `${index + 1}` : undefined;
              return (
                <div
                  key={`${colour}-${index}`}
                  style={paletteSwatchStyle(colour, colour.toLowerCase() === selectedColor.toLowerCase())}
                  title={shortcutKey ? `${colour} (${shortcutKey})` : colour}
                  onClick={() => {
                    setSelectedColor(colour);
                    setShowPalettePopup(false);
                  }}
                />
              );
            })}
          </div>
        )}

        {/* No palette message */}
        {showPalettePopup && lockedPalette.length === 0 && (
          <div style={{ ...palettePopupStyle, gridTemplateColumns: '1fr', minWidth: '120px' }}>
            <span style={{ color: colors.cream, fontSize: '11px', fontFamily: 'monospace' }}>
              No palette locked
            </span>
          </div>
        )}
      </div>

      {showBrushSize && (
        <>
          <div style={dividerStyle} />
          <div style={brushSizeStyle}>
            <span style={labelStyle}>Size: {brushSize}</span>
            <input
              type="range"
              min="1"
              max="8"
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="square-slider"
            />
          </div>
        </>
      )}
    </div>
  );
};

export default ToolPalette;

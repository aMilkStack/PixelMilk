import React from 'react';
import { useCanvasStore } from '../../stores';
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
  icon: string;
}

const tools: ToolConfig[] = [
  { id: 'select', label: 'Select', shortcut: 'V', icon: '⌖' },
  { id: 'pan', label: 'Pan', shortcut: 'Space', icon: '⊕' },
  { id: 'draw', label: 'Draw', shortcut: 'D', icon: '✎' },
  { id: 'erase', label: 'Erase', shortcut: 'E', icon: '␡' },
  { id: 'fill', label: 'Fill', shortcut: 'F', icon: '▧' },
  { id: 'eyedropper', label: 'Pick', shortcut: 'I', icon: '◉' },
  { id: 'hotspot', label: 'AI Edit', shortcut: 'H', icon: '✦' },
];

export const ToolPalette: React.FC = () => {
  const { tool, setTool, brushSize, setBrushSize, selectedColor, setSelectedColor } = useCanvasStore();

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
  };

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
        return (
          <button
            key={t.id}
            style={toolButtonStyle(isActive)}
            onClick={() => setTool(t.id)}
            title={`${t.label} (${t.shortcut})`}
          >
            {t.icon}
          </button>
        );
      })}

      <div style={dividerStyle} />

      {/* Color swatch */}
      <div
        style={colorSwatchStyle}
        title="Selected Color"
        onClick={() => {
          // Simple color picker - could be enhanced
          const input = document.createElement('input');
          input.type = 'color';
          input.value = selectedColor;
          input.addEventListener('input', (e) => {
            setSelectedColor((e.target as HTMLInputElement).value);
          });
          input.click();
        }}
      />

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

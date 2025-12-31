/**
 * MobileToolbar - Bottom toolbar for mobile canvas editing
 *
 * Provides touch-friendly access to canvas tools on mobile devices.
 * Uses a horizontal layout at the bottom of the screen.
 */

import React, { useState } from 'react';
import { useCanvasStore } from '../../stores';
import { PxCursor, PxMove, PxPencil, PxEraser, PxDrop, PxPipette, PxZap, PxUndo, PxReload } from '../shared/PixelIcon';
import type { ToolMode } from '../../types';

const colors = {
  bgPrimary: '#021a1a',
  bgSecondary: '#0d2b2b',
  mint: '#8bd0ba',
  mintMuted: '#8bd0ba40',
  cream: '#d8c8b8',
  coral: '#f04e4e',
};

// Touch-friendly size (44px minimum per Apple HIG)
const TAP_TARGET = 44;

interface ToolConfig {
  id: ToolMode;
  label: string;
  Icon: React.FC<{ size?: number }>;
}

const tools: ToolConfig[] = [
  { id: 'select', label: 'Select', Icon: PxCursor },
  { id: 'pan', label: 'Pan', Icon: PxMove },
  { id: 'draw', label: 'Draw', Icon: PxPencil },
  { id: 'erase', label: 'Erase', Icon: PxEraser },
  { id: 'fill', label: 'Fill', Icon: PxDrop },
  { id: 'eyedropper', label: 'Pick', Icon: PxPipette },
  { id: 'hotspot', label: 'AI', Icon: PxZap },
];

export interface MobileToolbarProps {
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

export const MobileToolbar: React.FC<MobileToolbarProps> = ({
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
}) => {
  const { tool, setTool, brushSize, setBrushSize, selectedColor, setSelectedColor } = useCanvasStore();
  const [showBrushSlider, setShowBrushSlider] = useState(false);

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.bgSecondary,
    borderTop: `1px solid ${colors.mintMuted}`,
    zIndex: 100,
    paddingBottom: 'env(safe-area-inset-bottom, 0px)', // iOS safe area
  };

  const toolRowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: '8px 4px',
    gap: '4px',
  };

  const toolButtonStyle = (isActive: boolean): React.CSSProperties => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: TAP_TARGET,
    height: TAP_TARGET,
    minWidth: TAP_TARGET,
    minHeight: TAP_TARGET,
    fontFamily: 'monospace',
    fontSize: '18px',
    border: `2px solid ${isActive ? colors.mint : colors.mintMuted}`,
    backgroundColor: isActive ? `${colors.mint}30` : 'transparent',
    color: isActive ? colors.mint : colors.cream,
    cursor: 'pointer',
    WebkitTapHighlightColor: 'transparent',
    touchAction: 'manipulation',
  });

  const labelStyle: React.CSSProperties = {
    fontSize: '8px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginTop: '2px',
  };

  const actionButtonStyle = (enabled: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: TAP_TARGET,
    height: TAP_TARGET,
    minWidth: TAP_TARGET,
    minHeight: TAP_TARGET,
    fontFamily: 'monospace',
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    border: `1px solid ${colors.mintMuted}`,
    backgroundColor: 'transparent',
    color: enabled ? colors.mint : `${colors.mint}40`,
    opacity: enabled ? 1 : 0.5,
    cursor: enabled ? 'pointer' : 'not-allowed',
    WebkitTapHighlightColor: 'transparent',
    touchAction: 'manipulation',
  });

  const colorSwatchStyle: React.CSSProperties = {
    width: TAP_TARGET - 8,
    height: TAP_TARGET - 8,
    backgroundColor: selectedColor,
    border: `2px solid ${colors.mint}`,
    cursor: 'pointer',
  };

  const brushSliderContainerStyle: React.CSSProperties = {
    display: showBrushSlider ? 'flex' : 'none',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    padding: '12px 16px',
    borderTop: `1px solid ${colors.mintMuted}`,
    backgroundColor: colors.bgPrimary,
  };

  const showBrushSize = tool === 'draw' || tool === 'erase';

  const handleColorPick = () => {
    const input = document.createElement('input');
    input.type = 'color';
    input.value = selectedColor;
    input.addEventListener('input', (e) => {
      setSelectedColor((e.target as HTMLInputElement).value);
    });
    input.click();
  };

  return (
    <div style={containerStyle}>
      {/* Brush size slider - shown when draw/erase tool selected */}
      {showBrushSize && (
        <div style={brushSliderContainerStyle}>
          <span style={{
            fontFamily: 'monospace',
            fontSize: '10px',
            color: colors.cream,
            textTransform: 'uppercase',
          }}>
            Size: {brushSize}
          </span>
          <input
            type="range"
            min="1"
            max="8"
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            style={{
              flex: 1,
              maxWidth: '200px',
              height: '24px',
              WebkitAppearance: 'none',
              appearance: 'none',
              background: colors.mintMuted,
              outline: 'none',
            }}
          />
        </div>
      )}

      {/* Tool row */}
      <div style={toolRowStyle}>
        {/* Undo/Redo */}
        <button
          style={actionButtonStyle(canUndo)}
          onClick={onUndo}
          disabled={!canUndo}
          aria-label="Undo"
        >
          <PxUndo size={18} />
        </button>

        {/* Tools */}
        {tools.map((t) => {
          const IconComponent = t.Icon;
          return (
            <button
              key={t.id}
              style={toolButtonStyle(tool === t.id)}
              onClick={() => {
                setTool(t.id);
                if ((t.id === 'draw' || t.id === 'erase') && !showBrushSlider) {
                  setShowBrushSlider(true);
                } else if (t.id !== 'draw' && t.id !== 'erase') {
                  setShowBrushSlider(false);
                }
              }}
              aria-label={t.label}
              aria-pressed={tool === t.id}
            >
              <IconComponent size={18} />
              <span style={labelStyle}>{t.label}</span>
            </button>
          );
        })}

        {/* Color swatch */}
        <div
          style={colorSwatchStyle}
          onClick={handleColorPick}
          role="button"
          aria-label="Select color"
          tabIndex={0}
        />

        {/* Redo */}
        <button
          style={actionButtonStyle(canRedo)}
          onClick={onRedo}
          disabled={!canRedo}
          aria-label="Redo"
        >
          <PxReload size={18} />
        </button>
      </div>
    </div>
  );
};

export default MobileToolbar;

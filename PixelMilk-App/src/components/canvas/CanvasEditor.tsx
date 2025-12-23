import React, { useCallback, useEffect, useState } from 'react';
import { InteractiveCanvas } from './InteractiveCanvas';
import { ToolPalette } from './ToolPalette';
import { ZoomControls } from './ZoomControls';
import { HotspotEditModal } from './HotspotEditModal';
import { useHistory } from '../../hooks';
import { useKeyboard, EDITOR_SHORTCUTS } from '../../hooks/useKeyboard';
import { useCanvasStore } from '../../stores';
import { applyHotspotEdit } from '../../services/gemini';
import type { SpriteData } from '../../types';

const colors = {
  bgSecondary: '#0d2b2b',
  mint: '#8bd0ba',
};

interface CanvasEditorProps {
  sprite: SpriteData | null;
  lockedPalette: string[];
  onSpriteChange?: (updatedSprite: SpriteData) => void;
}

export const CanvasEditor: React.FC<CanvasEditorProps> = ({
  sprite,
  lockedPalette,
  onSpriteChange,
}) => {
  const [showHotspotModal, setShowHotspotModal] = useState(false);
  const [isApplyingEdit, setIsApplyingEdit] = useState(false);

  const {
    setZoom,
    zoom,
    setTool,
    tool,
    hotspotX,
    hotspotY,
    hotspotRadius,
    clearHotspot,
  } = useCanvasStore();

  // History for undo/redo
  const {
    state: pixels,
    push: pushHistory,
    undo,
    redo,
    reset: resetHistory,
    canUndo,
    canRedo,
  } = useHistory<string[]>(sprite?.pixels ?? []);

  // Sync history when sprite changes
  useEffect(() => {
    if (sprite) {
      resetHistory([...sprite.pixels]);
    }
  }, [sprite?.id, resetHistory]);

  // Handle pixels changed from canvas
  const handlePixelsChange = useCallback(
    (newPixels: string[]) => {
      pushHistory(newPixels);
      if (sprite && onSpriteChange) {
        onSpriteChange({
          ...sprite,
          pixels: newPixels,
        });
      }
    },
    [pushHistory, sprite, onSpriteChange]
  );

  // Handle hotspot selection
  const handleHotspotSelect = useCallback(
    (x: number, y: number, radius: number) => {
      if (tool === 'hotspot') {
        setShowHotspotModal(true);
      }
    },
    [tool]
  );

  // Handle AI hotspot edit
  const handleHotspotEdit = useCallback(
    async (instruction: string) => {
      if (!sprite || hotspotX === null || hotspotY === null) return;

      setIsApplyingEdit(true);

      try {
        const newPixels = await applyHotspotEdit({
          sprite: { ...sprite, pixels },
          hotspotX,
          hotspotY,
          hotspotRadius,
          instruction,
          lockedPalette,
        });

        pushHistory(newPixels);
        if (onSpriteChange) {
          onSpriteChange({
            ...sprite,
            pixels: newPixels,
          });
        }
      } finally {
        setIsApplyingEdit(false);
      }
    },
    [sprite, pixels, hotspotX, hotspotY, hotspotRadius, lockedPalette, pushHistory, onSpriteChange]
  );

  // Keyboard shortcuts
  useKeyboard({
    [EDITOR_SHORTCUTS.UNDO]: () => {
      if (canUndo) {
        undo();
        if (sprite && onSpriteChange) {
          // Note: pixels state will update on next render
        }
      }
    },
    [EDITOR_SHORTCUTS.REDO]: () => {
      if (canRedo) {
        redo();
      }
    },
    [EDITOR_SHORTCUTS.REDO_ALT]: () => {
      if (canRedo) {
        redo();
      }
    },
    [EDITOR_SHORTCUTS.DRAW]: () => setTool('draw'),
    [EDITOR_SHORTCUTS.ERASE]: () => setTool('erase'),
    [EDITOR_SHORTCUTS.FILL]: () => setTool('fill'),
    [EDITOR_SHORTCUTS.EYEDROPPER]: () => setTool('eyedropper'),
    [EDITOR_SHORTCUTS.SELECT]: () => setTool('select'),
    [EDITOR_SHORTCUTS.HOTSPOT]: () => setTool('hotspot'),
    [EDITOR_SHORTCUTS.ZOOM_IN]: () => setZoom(Math.min(32, zoom * 1.5)),
    [EDITOR_SHORTCUTS.ZOOM_OUT]: () => setZoom(Math.max(0.5, zoom / 1.5)),
    [EDITOR_SHORTCUTS.ZOOM_RESET]: () => setZoom(1),
  });

  // Sync undo results back to sprite
  useEffect(() => {
    if (sprite && onSpriteChange && pixels !== sprite.pixels) {
      onSpriteChange({
        ...sprite,
        pixels,
      });
    }
  }, [pixels, sprite, onSpriteChange]);

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    gap: '12px',
    height: '100%',
  };

  const canvasAreaStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    minWidth: 0,
  };

  const controlsRowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  };

  const undoRedoStyle: React.CSSProperties = {
    display: 'flex',
    gap: '8px',
  };

  const buttonStyle = (enabled: boolean): React.CSSProperties => ({
    padding: '6px 12px',
    fontFamily: 'monospace',
    fontSize: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    border: `1px solid ${colors.mint}40`,
    backgroundColor: 'transparent',
    color: enabled ? colors.mint : colors.mint + '40',
    cursor: enabled ? 'pointer' : 'not-allowed',
    opacity: enabled ? 1 : 0.5,
  });

  const modifiedSprite = sprite
    ? { ...sprite, pixels }
    : null;

  return (
    <div style={containerStyle}>
      {/* Tool Palette */}
      <ToolPalette />

      {/* Canvas Area */}
      <div style={canvasAreaStyle}>
        {/* Top Controls */}
        <div style={controlsRowStyle}>
          <ZoomControls />
          <div style={undoRedoStyle}>
            <button
              style={buttonStyle(canUndo)}
              onClick={undo}
              disabled={!canUndo}
              title="Undo (Ctrl+Z)"
            >
              Undo
            </button>
            <button
              style={buttonStyle(canRedo)}
              onClick={redo}
              disabled={!canRedo}
              title="Redo (Ctrl+Y)"
            >
              Redo
            </button>
          </div>
        </div>

        {/* Interactive Canvas - needs flex-grow to fill remaining space */}
        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <InteractiveCanvas
            sprite={modifiedSprite}
            onPixelsChange={handlePixelsChange}
            onHotspotSelect={handleHotspotSelect}
            showGrid
          />
        </div>
      </div>

      {/* Hotspot Edit Modal */}
      {showHotspotModal && (
        <HotspotEditModal
          onEdit={handleHotspotEdit}
          onClose={() => {
            setShowHotspotModal(false);
            clearHotspot();
          }}
        />
      )}
    </div>
  );
};

export default CanvasEditor;

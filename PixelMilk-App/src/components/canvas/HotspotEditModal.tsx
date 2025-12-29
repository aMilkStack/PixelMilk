import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { useCanvasStore } from '../../stores';

const colors = {
  bgPrimary: '#021a1a',
  bgSecondary: '#0d2b2b',
  mint: '#8bd0ba',
  cream: '#d8c8b8',
  red: '#f04e4e',
};

interface HotspotEditModalProps {
  onEdit: (instruction: string) => Promise<void>;
  onClose: () => void;
}

export const HotspotEditModal: React.FC<HotspotEditModalProps> = ({ onEdit, onClose }) => {
  const [instruction, setInstruction] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const {
    hotspotX,
    hotspotY,
    hotspotRadius,
    hotspotScreenX,
    hotspotScreenY,
    setHotspotRadius,
    clearHotspot,
  } = useCanvasStore();

  // Position state for viewport-aware positioning
  const [position, setPosition] = useState({ left: 0, top: 0 });

  // Calculate position when screen coords change
  useEffect(() => {
    const popup = popupRef.current;
    if (!popup) return;

    const POPUP_WIDTH = 320;
    const POPUP_HEIGHT = 280;
    const OFFSET = 16; // Gap between hotspot and popup

    let left = hotspotScreenX + OFFSET;
    let top = hotspotScreenY;

    // Viewport boundary checks
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // If popup would go off right edge, show it on the left of the hotspot
    if (left + POPUP_WIDTH > viewportWidth - 16) {
      left = hotspotScreenX - POPUP_WIDTH - OFFSET;
    }

    // If popup would go off bottom, move it up
    if (top + POPUP_HEIGHT > viewportHeight - 16) {
      top = viewportHeight - POPUP_HEIGHT - 16;
    }

    // Ensure it doesn't go off top or left
    left = Math.max(16, left);
    top = Math.max(16, top);

    setPosition({ left, top });
  }, [hotspotScreenX, hotspotScreenY]);

  // Focus input on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      const input = popupRef.current?.querySelector('input');
      input?.focus();
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async () => {
    if (!instruction.trim()) {
      setError('Please enter an instruction');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await onEdit(instruction);
      setInstruction('');
      clearHotspot();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply edit');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    clearHotspot();
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      handleClose();
    }
  };

  const popupStyle: React.CSSProperties = {
    position: 'fixed',
    left: position.left,
    top: position.top,
    backgroundColor: colors.bgSecondary,
    border: `2px solid ${colors.mint}`,
    padding: '16px',
    width: '320px',
    zIndex: 1000,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
  };

  const titleStyle: React.CSSProperties = {
    fontFamily: 'monospace',
    fontSize: '12px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '0.15em',
    color: colors.mint,
    marginBottom: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  };

  const infoStyle: React.CSSProperties = {
    fontFamily: 'monospace',
    fontSize: '11px',
    color: colors.cream + '80',
    marginBottom: '12px',
  };

  const sliderContainerStyle: React.CSSProperties = {
    marginBottom: '12px',
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: 'monospace',
    fontSize: '10px',
    color: colors.cream,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    marginBottom: '6px',
    display: 'block',
  };

  const sliderStyle: React.CSSProperties = {
    width: '100%',
    accentColor: colors.mint,
  };

  const buttonRowStyle: React.CSSProperties = {
    display: 'flex',
    gap: '8px',
    justifyContent: 'flex-end',
    marginTop: '12px',
  };

  const errorStyle: React.CSSProperties = {
    fontFamily: 'monospace',
    fontSize: '11px',
    color: colors.red,
    marginTop: '8px',
  };

  const closeButtonStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    color: colors.cream + '80',
    cursor: 'var(--cursor-pointer)',
    fontFamily: 'monospace',
    fontSize: '16px',
    padding: '0',
    lineHeight: 1,
  };

  return (
    <div ref={popupRef} style={popupStyle}>
      <div style={titleStyle}>
        <span>Hotspot Edit</span>
        <button style={closeButtonStyle} onClick={handleClose} title="Close">
          ✕
        </button>
      </div>

      <div style={infoStyle}>
        Area: ({hotspotX}, {hotspotY}) · {hotspotRadius}px radius
      </div>

      <div style={sliderContainerStyle}>
        <label style={labelStyle}>Radius: {hotspotRadius}px</label>
        <input
          type="range"
          min="1"
          max="16"
          value={hotspotRadius}
          onChange={(e) => setHotspotRadius(Number(e.target.value))}
          style={sliderStyle}
        />
      </div>

      <Input
        label="What should change?"
        value={instruction}
        onChange={(e) => setInstruction(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="e.g., make this golden, add a scar"
        disabled={isLoading}
      />

      {error && <div style={errorStyle}>! {error}</div>}

      <div style={buttonRowStyle}>
        <Button variant="ghost" size="sm" onClick={handleClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleSubmit} disabled={isLoading || !instruction.trim()}>
          {isLoading ? 'Applying...' : 'Apply'}
        </Button>
      </div>
    </div>
  );
};

export default HotspotEditModal;

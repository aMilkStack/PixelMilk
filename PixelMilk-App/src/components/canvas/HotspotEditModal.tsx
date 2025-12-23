import React, { useState } from 'react';
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

  const { hotspotX, hotspotY, hotspotRadius, setHotspotRadius, clearHotspot } = useCanvasStore();

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

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(2, 26, 26, 0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  };

  const modalStyle: React.CSSProperties = {
    backgroundColor: colors.bgSecondary,
    border: `2px solid ${colors.mint}`,
    padding: '24px',
    width: '100%',
    maxWidth: '400px',
    margin: '16px',
  };

  const titleStyle: React.CSSProperties = {
    fontFamily: 'monospace',
    fontSize: '14px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '0.15em',
    color: colors.mint,
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const infoStyle: React.CSSProperties = {
    fontFamily: 'monospace',
    fontSize: '12px',
    color: colors.cream + '80',
    marginBottom: '16px',
  };

  const sliderContainerStyle: React.CSSProperties = {
    marginBottom: '16px',
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: 'monospace',
    fontSize: '11px',
    color: colors.cream,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    marginBottom: '8px',
    display: 'block',
  };

  const sliderStyle: React.CSSProperties = {
    width: '100%',
    accentColor: colors.mint,
  };

  const buttonRowStyle: React.CSSProperties = {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    marginTop: '20px',
  };

  const errorStyle: React.CSSProperties = {
    fontFamily: 'monospace',
    fontSize: '12px',
    color: colors.red,
    marginTop: '12px',
  };

  return (
    <div style={overlayStyle} onClick={handleClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={titleStyle}>
          <span>AI Hotspot Edit</span>
        </div>

        <div style={infoStyle}>
          Selected area: ({hotspotX}, {hotspotY}) with radius {hotspotRadius}px
        </div>

        <div style={sliderContainerStyle}>
          <label style={labelStyle}>Edit Radius: {hotspotRadius}px</label>
          <input
            type="range"
            min="1"
            max="8"
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
          placeholder="e.g., make this part golden, add a scar, remove the hat"
          disabled={isLoading}
        />

        {error && <div style={errorStyle}>! {error}</div>}

        <div style={buttonRowStyle}>
          <Button variant="ghost" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || !instruction.trim()}>
            {isLoading ? 'Applying...' : 'Apply Edit'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default HotspotEditModal;

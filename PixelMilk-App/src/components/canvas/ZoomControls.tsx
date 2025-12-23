import React from 'react';
import { Button } from '../shared/Button';
import { useCanvasStore } from '../../stores';

const colors = {
  bgSecondary: '#0d2b2b',
  mint: '#8bd0ba',
  cream: '#d8c8b8',
};

const ZOOM_LEVELS = [0.5, 1, 2, 4, 8, 16, 32];

export const ZoomControls: React.FC = () => {
  const { zoom, setZoom } = useCanvasStore();

  const handleZoomIn = () => {
    const currentIndex = ZOOM_LEVELS.findIndex((z) => z >= zoom);
    const nextIndex = Math.min(currentIndex + 1, ZOOM_LEVELS.length - 1);
    setZoom(ZOOM_LEVELS[nextIndex]);
  };

  const handleZoomOut = () => {
    const currentIndex = ZOOM_LEVELS.findIndex((z) => z >= zoom);
    const prevIndex = Math.max(currentIndex - 1, 0);
    setZoom(ZOOM_LEVELS[prevIndex]);
  };

  const handleReset = () => {
    setZoom(1);
  };

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    backgroundColor: colors.bgSecondary,
    border: `1px solid ${colors.mint}40`,
  };

  const zoomTextStyle: React.CSSProperties = {
    minWidth: '50px',
    textAlign: 'center',
    fontFamily: 'monospace',
    fontSize: '12px',
    color: colors.mint,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: 'monospace',
    fontSize: '11px',
    color: colors.cream,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
  };

  const zoomLabel = Number.isInteger(zoom) ? `${zoom}x` : `${zoom.toFixed(1)}x`;

  return (
    <div style={containerStyle}>
      <span style={labelStyle}>Zoom</span>
      <Button variant="secondary" size="sm" onClick={handleZoomOut} title="Zoom Out (-)">
        -
      </Button>
      <span style={zoomTextStyle}>{zoomLabel}</span>
      <Button variant="secondary" size="sm" onClick={handleZoomIn} title="Zoom In (=)">
        +
      </Button>
      <Button variant="ghost" size="sm" onClick={handleReset} title="Reset Zoom (0)">
        Reset
      </Button>
    </div>
  );
};

export default ZoomControls;

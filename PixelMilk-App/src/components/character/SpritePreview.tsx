import React, { useEffect, useRef, useState } from 'react';
import { Button } from '../shared/Button';
import type { PixelData } from '../../types';

export interface SpritePreviewProps {
  pixelData: PixelData | null;
  isLoading?: boolean;
  zoom?: number;
  onZoomChange?: (zoom: number) => void;
}

type BackgroundType = 'checkered' | 'white' | 'black';

const ZOOM_LEVELS = [1, 2, 4, 8];

// Terminal aesthetic colors
const colors = {
  bgPrimary: '#021a1a',
  bgSecondary: '#0d2b2b',
  mint: '#8bd0ba',
  cream: '#d8c8b8',
};

export const SpritePreview: React.FC<SpritePreviewProps> = ({
  pixelData,
  isLoading = false,
  zoom: controlledZoom,
  onZoomChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [internalZoom, setInternalZoom] = useState(4);
  const [background, setBackground] = useState<BackgroundType>('checkered');

  // Use controlled zoom if provided, otherwise use internal state
  const currentZoom = controlledZoom !== undefined ? controlledZoom : internalZoom;

  const handleZoomChange = (newZoom: number) => {
    if (onZoomChange) {
      onZoomChange(newZoom);
    } else {
      setInternalZoom(newZoom);
    }
  };

  // Render pixel data to canvas
  useEffect(() => {
    if (!pixelData || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const { width, height, pixels } = pixelData;

    // Set canvas size to actual pixel dimensions
    canvas.width = width;
    canvas.height = height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw background if not checkered (checkered is handled by CSS)
    if (background === 'white') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
    } else if (background === 'black') {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);
    }

    // Draw pixels row by row (top-left to bottom-right)
    for (let i = 0; i < pixels.length; i++) {
      const pixel = pixels[i];

      // Skip transparent pixels
      if (pixel === 'transparent' || pixel === '') continue;

      const x = i % width;
      const y = Math.floor(i / width);

      ctx.fillStyle = pixel;
      ctx.fillRect(x, y, 1, 1);
    }
  }, [pixelData, background]);

  // Download canvas as PNG
  const handleDownload = () => {
    if (!canvasRef.current || !pixelData) return;

    const canvas = canvasRef.current;
    const link = document.createElement('a');
    link.download = `${pixelData.name || 'sprite'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // Calculate display dimensions
  const displayWidth = pixelData ? pixelData.width * currentZoom : 0;
  const displayHeight = pixelData ? pixelData.height * currentZoom : 0;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        padding: '16px',
        backgroundColor: colors.bgSecondary,
        border: `2px solid ${colors.mint}`,
        fontFamily: 'monospace',
      }}
    >
      {/* Canvas Container */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '200px',
          backgroundColor: colors.bgPrimary,
          border: `1px solid ${colors.bgSecondary}`,
          padding: '16px',
        }}
      >
        {isLoading && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: 'rgba(2, 26, 26, 0.9)',
              zIndex: 10,
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  border: `4px solid ${colors.bgSecondary}`,
                  borderTop: `4px solid ${colors.mint}`,
                  animation: 'spin 1s linear infinite',
                }}
              />
              <span
                style={{
                  color: colors.mint,
                  fontSize: '14px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                }}
              >
                Generating...
              </span>
            </div>
          </div>
        )}

        {!pixelData && !isLoading && (
          <div
            style={{
              color: colors.cream,
              fontSize: '14px',
              textAlign: 'center',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              opacity: 0.5,
            }}
          >
            No sprite data
          </div>
        )}

        {pixelData && (
          <div
            style={{
              position: 'relative',
              backgroundImage:
                background === 'checkered'
                  ? `linear-gradient(45deg, #1a1a1a 25%, transparent 25%),
                     linear-gradient(-45deg, #1a1a1a 25%, transparent 25%),
                     linear-gradient(45deg, transparent 75%, #1a1a1a 75%),
                     linear-gradient(-45deg, transparent 75%, #1a1a1a 75%)`
                  : 'none',
              backgroundSize: background === 'checkered' ? '20px 20px' : 'auto',
              backgroundPosition:
                background === 'checkered' ? '0 0, 0 10px, 10px -10px, -10px 0px' : '0 0',
              backgroundColor:
                background === 'white'
                  ? '#ffffff'
                  : background === 'black'
                  ? '#000000'
                  : 'transparent',
            }}
          >
            <canvas
              ref={canvasRef}
              style={{
                imageRendering: 'pixelated',
                width: `${displayWidth}px`,
                height: `${displayHeight}px`,
                display: 'block',
              }}
            />
          </div>
        )}
      </div>

      {/* Controls */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {/* Zoom Controls */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <label
            style={{
              color: colors.mint,
              fontSize: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            Zoom
          </label>
          <div
            style={{
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap',
            }}
          >
            {ZOOM_LEVELS.map((level) => (
              <Button
                key={level}
                variant={currentZoom === level ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => handleZoomChange(level)}
                disabled={isLoading}
              >
                {level}x
              </Button>
            ))}
          </div>
        </div>

        {/* Background Controls */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <label
            style={{
              color: colors.mint,
              fontSize: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            Background
          </label>
          <div
            style={{
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap',
            }}
          >
            <Button
              variant={background === 'checkered' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setBackground('checkered')}
              disabled={isLoading}
            >
              Checkered
            </Button>
            <Button
              variant={background === 'white' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setBackground('white')}
              disabled={isLoading}
            >
              White
            </Button>
            <Button
              variant={background === 'black' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setBackground('black')}
              disabled={isLoading}
            >
              Black
            </Button>
          </div>
        </div>

        {/* Download Button */}
        <Button
          variant="primary"
          size="md"
          onClick={handleDownload}
          disabled={!pixelData || isLoading}
          style={{ width: '100%', marginTop: '8px' }}
        >
          Download PNG
        </Button>
      </div>

      {/* CSS Animation for spinner */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default SpritePreview;

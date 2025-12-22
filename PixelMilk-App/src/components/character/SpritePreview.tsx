import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '../shared/Button';
import type { SpriteData } from '../../types';
import { renderPixelDataToDataUrl } from '../../utils/paletteGovernor';

export interface SpritePreviewProps {
  sprite: SpriteData | null;
  isLoading?: boolean;
  zoom?: number;
  onZoomChange?: (zoom: number) => void;
}

type BackgroundType = 'checkered' | 'white' | 'black';

const ZOOM_LEVELS = [1, 2, 4, 8];

// Fun loading messages for pixel art generation
const LOADING_MESSAGES = [
  'Pixelating...',
  'Marioifying...',
  'Byte me!',
  'Counting pixels... 1... 2...',
  'Where was I?',
  'Sharpening edges...',
  'Removing anti-alias...',
  'Adding nostalgia...',
  'Crunching bits...',
  'Summoning sprites...',
  'Consulting the pixel gods...',
  'Brewing 8-bit magic...',
  'Dithering intensifies...',
  'Loading palette...',
  'Retro-fying...',
  'Channeling the 90s...',
  'Pixel perfect...',
  'Almost there...',
  'Placing pixels carefully...',
  'One pixel at a time...',
];

// Terminal aesthetic colors
const colors = {
  bgPrimary: '#021a1a',
  bgSecondary: '#0d2b2b',
  mint: '#8bd0ba',
  cream: '#d8c8b8',
};

export const SpritePreview: React.FC<SpritePreviewProps> = ({
  sprite,
  isLoading = false,
  zoom: controlledZoom,
  onZoomChange,
}) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const [internalZoom, setInternalZoom] = useState(4);
  const [background, setBackground] = useState<BackgroundType>('checkered');
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0]);
  const [pixelCount, setPixelCount] = useState(0);

  // Rotate through loading messages
  useEffect(() => {
    if (!isLoading) {
      setPixelCount(0);
      return;
    }

    // Change message every 2 seconds
    const messageInterval = setInterval(() => {
      setLoadingMessage(LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)]);
    }, 2000);

    // Animate pixel counter
    const pixelInterval = setInterval(() => {
      setPixelCount(prev => (prev + Math.floor(Math.random() * 50) + 10) % 16384);
    }, 100);

    return () => {
      clearInterval(messageInterval);
      clearInterval(pixelInterval);
    };
  }, [isLoading]);

  // Use controlled zoom if provided, otherwise use internal state
  const currentZoom = controlledZoom !== undefined ? controlledZoom : internalZoom;

  const handleZoomChange = (newZoom: number) => {
    if (onZoomChange) {
      onZoomChange(newZoom);
    } else {
      setInternalZoom(newZoom);
    }
  };

  // Download image as PNG
  const handleDownload = () => {
    if (!previewUrl) return;

    const link = document.createElement('a');
    link.download = `sprite-${sprite?.direction ?? 'S'}-${Date.now()}.png`;
    link.href = previewUrl;
    link.click();
  };

  // Calculate display dimensions
  const width = sprite?.width || 128;
  const height = sprite?.height || 128;
  const displayWidth = width * currentZoom;
  const displayHeight = height * currentZoom;

  // Build preview URL from pixel data
  useEffect(() => {
    let cancelled = false;

    if (!sprite) {
      setPreviewUrl('');
      return () => {
        cancelled = true;
      };
    }

    renderPixelDataToDataUrl(sprite).then((url) => {
      if (!cancelled) {
        setPreviewUrl(url);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [sprite]);

  const hasImage = !!previewUrl;

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
      {/* Image Container */}
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
          overflow: 'auto',
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
              backgroundColor: 'rgba(2, 26, 26, 0.95)',
              zIndex: 10,
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px',
                padding: '24px',
              }}
            >
              {/* Pixel art style loading animation */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 12px)',
                  gap: '4px',
                }}
              >
                {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div
                    key={i}
                    style={{
                      width: '12px',
                      height: '12px',
                      backgroundColor: colors.mint,
                      opacity: 0.3,
                      animation: `pixelPulse 1.5s ease-in-out infinite`,
                      animationDelay: `${i * 0.1}s`,
                    }}
                  />
                ))}
              </div>

              {/* Fun rotating message */}
              <span
                style={{
                  color: colors.mint,
                  fontSize: '16px',
                  fontFamily: 'monospace',
                  letterSpacing: '0.05em',
                  textAlign: 'center',
                  minHeight: '24px',
                }}
              >
                {loadingMessage}
              </span>

              {/* Pixel counter */}
              <span
                style={{
                  color: colors.cream,
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  opacity: 0.6,
                }}
              >
                [{pixelCount.toString().padStart(5, '0')}] pixels processed
              </span>
            </div>
          </div>
        )}

        {!hasImage && !isLoading && (
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

        {hasImage && (
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
            <img
              ref={imgRef}
              src={previewUrl}
              alt="Generated sprite"
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
          disabled={!hasImage || isLoading}
          style={{ width: '100%', marginTop: '8px' }}
        >
          Download PNG
        </Button>
      </div>

      {/* CSS Animations */}
      <style>
        {`
          @keyframes pixelPulse {
            0%, 100% { opacity: 0.2; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.1); }
          }
        `}
      </style>
    </div>
  );
};

export default SpritePreview;

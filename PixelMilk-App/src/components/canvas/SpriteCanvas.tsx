import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { SpriteData } from '../../types';
import { useCanvasStore } from '../../stores';

export interface SpriteCanvasProps {
  sprite: SpriteData | null;
  showGrid?: boolean;
  background?: 'transparent' | 'white' | 'black';
  interactive?: boolean;
  isLoading?: boolean;
  onPixelClick?: (x: number, y: number) => void;
}

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

const colors = {
  bgPrimary: '#021a1a',
  // Use off-white/off-black so sprite pixels with pure white/black remain visible
  white: '#FAFAFA',
  black: '#0A0A0A',
  checkerLight: '#043636',
  checkerDark: '#032828',
  grid: 'rgba(139, 208, 186, 0.2)',
  text: '#8bd0ba',
};

const CANVAS_SIZE = 512;

const getMetrics = (
  canvas: HTMLCanvasElement,
  sprite: SpriteData,
  zoom: number,
  panX: number,
  panY: number
) => {
  const basePixelSize = Math.floor(
    Math.min(canvas.width / sprite.width, canvas.height / sprite.height)
  );
  const pixelSize = Math.max(1, Math.floor(basePixelSize * zoom));
  const widthPx = sprite.width * pixelSize;
  const heightPx = sprite.height * pixelSize;
  const offsetX = Math.floor((canvas.width - widthPx) / 2 + panX);
  const offsetY = Math.floor((canvas.height - heightPx) / 2 + panY);

  return { pixelSize, widthPx, heightPx, offsetX, offsetY };
};

export const SpriteCanvas: React.FC<SpriteCanvasProps> = ({
  sprite,
  showGrid = true,
  background = 'transparent',
  interactive = false,
  isLoading = false,
  onPixelClick,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { zoom, panX, panY } = useCanvasStore();
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

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = colors.bgPrimary;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (!sprite) {
      ctx.fillStyle = colors.text;
      ctx.font = '14px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('No sprite loaded', canvas.width / 2, canvas.height / 2);
      return;
    }

    const { pixelSize, widthPx, heightPx, offsetX, offsetY } = getMetrics(
      canvas,
      sprite,
      zoom,
      panX,
      panY
    );

    const backgroundColor =
      background === 'white'
        ? colors.white
        : background === 'black'
        ? colors.black
        : null;

    if (backgroundColor) {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(offsetX, offsetY, widthPx, heightPx);
    } else {
      // Checkerboard background for transparency
      for (let y = 0; y < sprite.height; y++) {
        for (let x = 0; x < sprite.width; x++) {
          const isLight = (x + y) % 2 === 0;
          ctx.fillStyle = isLight ? colors.checkerLight : colors.checkerDark;
          ctx.fillRect(
            offsetX + x * pixelSize,
            offsetY + y * pixelSize,
            pixelSize,
            pixelSize
          );
        }
      }
    }

    // Draw pixels
    for (let y = 0; y < sprite.height; y++) {
      for (let x = 0; x < sprite.width; x++) {
        const index = y * sprite.width + x;
        const color = sprite.pixels[index];
        if (!color || color === 'transparent') continue;
        ctx.fillStyle = color;
        ctx.fillRect(
          offsetX + x * pixelSize,
          offsetY + y * pixelSize,
          pixelSize,
          pixelSize
        );
      }
    }

    // Draw grid if zoomed enough
    if (showGrid && pixelSize >= 6) {
      ctx.strokeStyle = colors.grid;
      ctx.lineWidth = 1;

      for (let x = 0; x <= sprite.width; x++) {
        ctx.beginPath();
        ctx.moveTo(offsetX + x * pixelSize, offsetY);
        ctx.lineTo(offsetX + x * pixelSize, offsetY + heightPx);
        ctx.stroke();
      }

      for (let y = 0; y <= sprite.height; y++) {
        ctx.beginPath();
        ctx.moveTo(offsetX, offsetY + y * pixelSize);
        ctx.lineTo(offsetX + widthPx, offsetY + y * pixelSize);
        ctx.stroke();
      }
    }
  }, [sprite, zoom, panX, panY, showGrid, background]);

  useEffect(() => {
    draw();
  }, [draw]);

  const handleClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!interactive || !sprite || !onPixelClick) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    const { pixelSize, offsetX, offsetY } = getMetrics(
      canvas,
      sprite,
      zoom,
      panX,
      panY
    );

    const pixelX = Math.floor((clickX - offsetX) / pixelSize);
    const pixelY = Math.floor((clickY - offsetY) / pixelSize);

    if (
      pixelX >= 0 &&
      pixelX < sprite.width &&
      pixelY >= 0 &&
      pixelY < sprite.height
    ) {
      onPixelClick(pixelX, pixelY);
    }
  };

  const containerStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgPrimary,
    border: `1px solid ${colors.checkerLight}`,
    position: 'relative',
  };

  const loadingOverlayStyle: React.CSSProperties = {
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
  };

  const loadingContentStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
    padding: '24px',
  };

  const pixelGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 12px)',
    gap: '4px',
  };

  const messageStyle: React.CSSProperties = {
    color: colors.text,
    fontSize: '16px',
    fontFamily: 'monospace',
    letterSpacing: '0.05em',
    textAlign: 'center',
    minHeight: '24px',
  };

  const counterStyle: React.CSSProperties = {
    color: '#d8c8b8',
    fontSize: '12px',
    fontFamily: 'monospace',
    opacity: 0.6,
  };

  return (
    <div style={containerStyle}>
      {isLoading && (
        <div style={loadingOverlayStyle}>
          <div style={loadingContentStyle}>
            {/* Pixel art style loading animation */}
            <div style={pixelGridStyle}>
              {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div
                  key={i}
                  style={{
                    width: '12px',
                    height: '12px',
                    backgroundColor: colors.text,
                    opacity: 0.3,
                    animation: 'pixelPulse 1.5s ease-in-out infinite',
                    animationDelay: `${i * 0.1}s`,
                  }}
                />
              ))}
            </div>

            {/* Fun rotating message */}
            <span style={messageStyle}>{loadingMessage}</span>

            {/* Pixel counter */}
            <span style={counterStyle}>
              [{pixelCount.toString().padStart(5, '0')}] pixels processed
            </span>
          </div>
        </div>
      )}

      <canvas
        ref={canvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        onClick={handleClick}
        style={{
          cursor: interactive ? 'var(--cursor-crosshair)' : 'var(--cursor-default)',
          imageRendering: 'pixelated',
        }}
      />

      {/* CSS Animation */}
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

export default SpriteCanvas;

import React, { useRef, useEffect, useCallback, useState } from 'react';
import type { SpriteData } from '../../types';
import { useCanvasStore } from '../../stores';

const colors = {
  bgPrimary: '#021a1a',
  checkerLight: '#043636',
  checkerDark: '#032828',
  grid: 'rgba(139, 208, 186, 0.2)',
  text: '#8bd0ba',
  hotspot: '#f04e4e',
};

interface InteractiveCanvasProps {
  sprite: SpriteData | null;
  onPixelsChange?: (pixels: string[]) => void;
  onHotspotSelect?: (x: number, y: number, radius: number) => void;
  showGrid?: boolean;
}

// Flood fill helper
function floodFill(
  pixels: string[],
  width: number,
  height: number,
  startX: number,
  startY: number,
  targetColour: string,
  fillColour: string
): string[] {
  if (targetColour === fillColour) return pixels;

  const result = [...pixels];
  const stack: [number, number][] = [[startX, startY]];
  const visited = new Set<string>();

  while (stack.length > 0) {
    const [x, y] = stack.pop()!;
    const key = `${x},${y}`;

    if (visited.has(key)) continue;
    if (x < 0 || x >= width || y < 0 || y >= height) continue;

    const index = y * width + x;
    if (result[index] !== targetColour) continue;

    visited.add(key);
    result[index] = fillColour;

    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }

  return result;
}

export const InteractiveCanvas: React.FC<InteractiveCanvasProps> = ({
  sprite,
  onPixelsChange,
  onHotspotSelect,
  showGrid = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [localPixels, setLocalPixels] = useState<string[]>([]);

  const {
    zoom,
    panX,
    panY,
    tool,
    brushSize,
    selectedColor,
    hotspotX,
    hotspotY,
    hotspotRadius,
    isDrawing,
    setIsDrawing,
    setHotspot,
    setSelectedColor,
  } = useCanvasStore();

  const CANVAS_SIZE = 640;

  // Sync local pixels with sprite
  useEffect(() => {
    if (sprite) {
      setLocalPixels([...sprite.pixels]);
    } else {
      setLocalPixels([]);
    }
  }, [sprite]);

  // Calculate metrics
  const getMetrics = useCallback(() => {
    if (!sprite) return null;
    const basePixelSize = Math.floor(
      Math.min(CANVAS_SIZE / sprite.width, CANVAS_SIZE / sprite.height)
    );
    const pixelSize = Math.max(1, Math.floor(basePixelSize * zoom));
    const widthPx = sprite.width * pixelSize;
    const heightPx = sprite.height * pixelSize;
    const offsetX = Math.floor((CANVAS_SIZE - widthPx) / 2 + panX);
    const offsetY = Math.floor((CANVAS_SIZE - heightPx) / 2 + panY);
    return { pixelSize, widthPx, heightPx, offsetX, offsetY };
  }, [sprite, zoom, panX, panY]);

  // Convert screen coords to pixel coords
  const screenToPixel = useCallback(
    (screenX: number, screenY: number) => {
      const canvas = canvasRef.current;
      if (!canvas || !sprite) return null;

      const rect = canvas.getBoundingClientRect();
      const canvasX = screenX - rect.left;
      const canvasY = screenY - rect.top;

      const metrics = getMetrics();
      if (!metrics) return null;

      const { pixelSize, offsetX, offsetY } = metrics;

      const pixelX = Math.floor((canvasX - offsetX) / pixelSize);
      const pixelY = Math.floor((canvasY - offsetY) / pixelSize);

      if (pixelX >= 0 && pixelX < sprite.width && pixelY >= 0 && pixelY < sprite.height) {
        return { x: pixelX, y: pixelY };
      }
      return null;
    },
    [sprite, getMetrics]
  );

  // Set pixel colour with brush size
  const setPixel = useCallback(
    (x: number, y: number, colour: string) => {
      if (!sprite) return;

      setLocalPixels((prev) => {
        const newPixels = [...prev];
        const half = Math.floor(brushSize / 2);

        for (let dy = -half; dy <= half; dy++) {
          for (let dx = -half; dx <= half; dx++) {
            const px = x + dx;
            const py = y + dy;

            if (px >= 0 && px < sprite.width && py >= 0 && py < sprite.height) {
              const index = py * sprite.width + px;
              newPixels[index] = colour;
            }
          }
        }

        return newPixels;
      });
    },
    [sprite, brushSize]
  );

  // Mouse handlers
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const pixel = screenToPixel(e.clientX, e.clientY);
      if (!pixel || !sprite) return;

      if (tool === 'draw') {
        setIsDrawing(true);
        setPixel(pixel.x, pixel.y, selectedColor);
      } else if (tool === 'erase') {
        setIsDrawing(true);
        setPixel(pixel.x, pixel.y, 'transparent');
      } else if (tool === 'eyedropper') {
        const index = pixel.y * sprite.width + pixel.x;
        const colour = localPixels[index];
        if (colour && colour !== 'transparent') {
          setSelectedColor(colour);
        }
      } else if (tool === 'hotspot') {
        setHotspot(pixel.x, pixel.y);
        onHotspotSelect?.(pixel.x, pixel.y, hotspotRadius);
      } else if (tool === 'fill') {
        const targetColour = localPixels[pixel.y * sprite.width + pixel.x] || 'transparent';
        const filled = floodFill(
          localPixels,
          sprite.width,
          sprite.height,
          pixel.x,
          pixel.y,
          targetColour,
          selectedColor
        );
        setLocalPixels(filled);
        onPixelsChange?.(filled);
      }
    },
    [
      tool,
      screenToPixel,
      setPixel,
      selectedColor,
      localPixels,
      sprite,
      hotspotRadius,
      onHotspotSelect,
      onPixelsChange,
      setHotspot,
      setIsDrawing,
      setSelectedColor,
    ]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDrawing) return;

      const pixel = screenToPixel(e.clientX, e.clientY);
      if (!pixel) return;

      if (tool === 'draw') {
        setPixel(pixel.x, pixel.y, selectedColor);
      } else if (tool === 'erase') {
        setPixel(pixel.x, pixel.y, 'transparent');
      }
    },
    [isDrawing, tool, screenToPixel, setPixel, selectedColor]
  );

  const handleMouseUp = useCallback(() => {
    if (isDrawing) {
      setIsDrawing(false);
      onPixelsChange?.(localPixels);
    }
  }, [isDrawing, localPixels, onPixelsChange, setIsDrawing]);

  // Wheel zoom
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -1 : 1;
      const newZoom = Math.max(0.5, Math.min(32, zoom * (1 + delta * 0.15)));
      useCanvasStore.getState().setZoom(newZoom);
    },
    [zoom]
  );

  // Draw canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = colors.bgPrimary;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (!sprite || localPixels.length === 0) {
      ctx.fillStyle = colors.text;
      ctx.font = '14px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('No sprite loaded', canvas.width / 2, canvas.height / 2);
      return;
    }

    const metrics = getMetrics();
    if (!metrics) return;

    const { pixelSize, widthPx, heightPx, offsetX, offsetY } = metrics;

    // Draw transparency checkerboard
    for (let y = 0; y < sprite.height; y++) {
      for (let x = 0; x < sprite.width; x++) {
        const isLight = (x + y) % 2 === 0;
        ctx.fillStyle = isLight ? colors.checkerLight : colors.checkerDark;
        ctx.fillRect(offsetX + x * pixelSize, offsetY + y * pixelSize, pixelSize, pixelSize);
      }
    }

    // Draw pixels
    for (let y = 0; y < sprite.height; y++) {
      for (let x = 0; x < sprite.width; x++) {
        const colour = localPixels[y * sprite.width + x];
        if (colour && colour !== 'transparent') {
          ctx.fillStyle = colour;
          ctx.fillRect(offsetX + x * pixelSize, offsetY + y * pixelSize, pixelSize, pixelSize);
        }
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

    // Draw hotspot highlight
    if (hotspotX !== null && hotspotY !== null) {
      ctx.strokeStyle = colors.hotspot;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);

      const half = Math.floor(hotspotRadius / 2);
      const hx = offsetX + (hotspotX - half) * pixelSize;
      const hy = offsetY + (hotspotY - half) * pixelSize;
      const hw = hotspotRadius * pixelSize;

      ctx.strokeRect(hx, hy, hw, hw);
      ctx.setLineDash([]);
    }
  }, [sprite, localPixels, getMetrics, showGrid, hotspotX, hotspotY, hotspotRadius]);

  useEffect(() => {
    draw();
  }, [draw]);

  const getCursor = () => {
    switch (tool) {
      case 'draw':
      case 'erase':
      case 'fill':
      case 'eyedropper':
        return 'crosshair';
      case 'hotspot':
        return 'pointer';
      default:
        return 'default';
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
  };

  return (
    <div style={containerStyle}>
      <canvas
        ref={canvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{
          cursor: getCursor(),
          imageRendering: 'pixelated',
        }}
      />
    </div>
  );
};

export default InteractiveCanvas;

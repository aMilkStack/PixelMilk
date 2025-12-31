import React, { useState } from 'react';
import { CANVAS_SIZES, type CanvasSize, type ResizeMode } from '../../utils/spriteResize';
import { PxScale, PxClose } from '../shared/PixelIcon';

const colors = {
  bgPrimary: '#021a1a',
  bgSecondary: '#0d2b2b',
  bgTertiary: '#152f2f',
  mint: '#8bd0ba',
  mintMuted: '#8bd0ba40',
  coral: '#f04e4e',
  cream: '#d8c8b8',
};

interface ResizeModalProps {
  currentSize: number;
  onResize: (newSize: CanvasSize, mode: ResizeMode) => void;
  onClose: () => void;
}

export const ResizeModal: React.FC<ResizeModalProps> = ({
  currentSize,
  onResize,
  onClose,
}) => {
  const [selectedSize, setSelectedSize] = useState<CanvasSize>(
    CANVAS_SIZES.includes(currentSize as CanvasSize)
      ? (currentSize as CanvasSize)
      : 64
  );
  const [mode, setMode] = useState<ResizeMode>('scale');

  const handleResize = () => {
    if (selectedSize !== currentSize) {
      onResize(selectedSize, mode);
    }
    onClose();
  };

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  };

  const modalStyle: React.CSSProperties = {
    backgroundColor: colors.bgSecondary,
    border: `2px solid ${colors.mint}`,
    padding: '24px',
    minWidth: '320px',
    maxWidth: '400px',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    paddingBottom: '12px',
    borderBottom: `1px solid ${colors.mintMuted}`,
  };

  const titleStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontFamily: 'FaytePixel, sans-serif',
    fontSize: '24px',
    color: colors.mint,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  };

  const closeButtonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '28px',
    height: '28px',
    background: 'none',
    border: `1px solid ${colors.mintMuted}`,
    color: colors.cream,
    cursor: 'var(--cursor-pointer)',
    transition: 'all 0.15s ease',
  };

  const sectionStyle: React.CSSProperties = {
    marginBottom: '20px',
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: 'monospace',
    fontSize: '11px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: colors.cream,
    marginBottom: '10px',
    display: 'block',
  };

  const currentSizeStyle: React.CSSProperties = {
    fontFamily: 'monospace',
    fontSize: '12px',
    color: colors.mint,
    marginBottom: '16px',
    padding: '8px 12px',
    backgroundColor: colors.bgPrimary,
    border: `1px solid ${colors.mintMuted}`,
  };

  const sizeGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '6px',
  };

  const sizeButtonStyle = (isSelected: boolean, isCurrent: boolean): React.CSSProperties => ({
    padding: '10px 0',
    fontFamily: 'monospace',
    fontSize: '12px',
    fontWeight: 'bold',
    textAlign: 'center',
    backgroundColor: isSelected ? `${colors.mint}30` : 'transparent',
    border: `2px solid ${isSelected ? colors.mint : isCurrent ? colors.coral : colors.mintMuted}`,
    color: isSelected ? colors.mint : isCurrent ? colors.coral : colors.cream,
    cursor: 'var(--cursor-pointer)',
    transition: 'all 0.15s ease',
    position: 'relative',
  });

  const modeButtonsStyle: React.CSSProperties = {
    display: 'flex',
    gap: '8px',
  };

  const modeButtonStyle = (isSelected: boolean): React.CSSProperties => ({
    flex: 1,
    padding: '12px 16px',
    fontFamily: 'monospace',
    fontSize: '11px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    backgroundColor: isSelected ? `${colors.mint}20` : 'transparent',
    border: `2px solid ${isSelected ? colors.mint : colors.mintMuted}`,
    color: isSelected ? colors.mint : colors.cream,
    cursor: 'var(--cursor-pointer)',
    transition: 'all 0.15s ease',
    textAlign: 'center',
  });

  const modeDescStyle: React.CSSProperties = {
    fontFamily: 'monospace',
    fontSize: '10px',
    color: colors.cream,
    opacity: 0.7,
    marginTop: '8px',
    lineHeight: 1.4,
  };

  const footerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '24px',
    paddingTop: '16px',
    borderTop: `1px solid ${colors.mintMuted}`,
  };

  const cancelButtonStyle: React.CSSProperties = {
    padding: '10px 20px',
    fontFamily: 'monospace',
    fontSize: '11px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    backgroundColor: 'transparent',
    border: `1px solid ${colors.mintMuted}`,
    color: colors.cream,
    cursor: 'var(--cursor-pointer)',
    transition: 'all 0.15s ease',
  };

  const applyButtonStyle: React.CSSProperties = {
    padding: '10px 24px',
    fontFamily: 'monospace',
    fontSize: '11px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    backgroundColor: selectedSize !== currentSize ? colors.coral : colors.bgTertiary,
    border: `2px solid ${selectedSize !== currentSize ? colors.coral : colors.mintMuted}`,
    color: selectedSize !== currentSize ? colors.bgPrimary : colors.cream,
    cursor: selectedSize !== currentSize ? 'var(--cursor-pointer)' : 'not-allowed',
    opacity: selectedSize !== currentSize ? 1 : 0.5,
    transition: 'all 0.15s ease',
  };

  const isGrowing = selectedSize > currentSize;
  const isShrinking = selectedSize < currentSize;

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={headerStyle}>
          <div style={titleStyle}>
            <PxScale size={20} />
            <span>Resize Canvas</span>
          </div>
          <button
            style={closeButtonStyle}
            onClick={onClose}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = `${colors.mint}20`;
              e.currentTarget.style.borderColor = colors.mint;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = colors.mintMuted;
            }}
          >
            <PxClose size={14} />
          </button>
        </div>

        {/* Current Size */}
        <div style={currentSizeStyle}>
          Current size: <strong>{currentSize}x{currentSize}</strong> pixels
        </div>

        {/* Size Selection */}
        <div style={sectionStyle}>
          <label style={labelStyle}>New Size</label>
          <div style={sizeGridStyle}>
            {CANVAS_SIZES.map((size) => (
              <button
                key={size}
                style={sizeButtonStyle(size === selectedSize, size === currentSize)}
                onClick={() => setSelectedSize(size)}
                onMouseEnter={(e) => {
                  if (size !== selectedSize) {
                    e.currentTarget.style.backgroundColor = `${colors.mint}15`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (size !== selectedSize) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* Resize Mode */}
        {selectedSize !== currentSize && (
          <div style={sectionStyle}>
            <label style={labelStyle}>Resize Mode</label>
            <div style={modeButtonsStyle}>
              <button
                style={modeButtonStyle(mode === 'scale')}
                onClick={() => setMode('scale')}
              >
                Scale
              </button>
              <button
                style={modeButtonStyle(mode === 'crop-pad')}
                onClick={() => setMode('crop-pad')}
              >
                {isShrinking ? 'Crop' : 'Pad'}
              </button>
            </div>
            <p style={modeDescStyle}>
              {mode === 'scale' ? (
                <>
                  <strong>Scale:</strong> Resize the sprite proportionally using nearest-neighbour scaling.
                  {isShrinking && ' Some detail may be lost when shrinking.'}
                  {isGrowing && ' Pixels will be duplicated when growing.'}
                </>
              ) : (
                <>
                  <strong>{isShrinking ? 'Crop' : 'Pad'}:</strong>{' '}
                  {isShrinking
                    ? 'Cut away the edges of the sprite, keeping the centre.'
                    : 'Add transparent padding around the sprite.'}
                </>
              )}
            </p>
          </div>
        )}

        {/* Footer */}
        <div style={footerStyle}>
          <button
            style={cancelButtonStyle}
            onClick={onClose}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = `${colors.mint}10`;
              e.currentTarget.style.borderColor = colors.mint;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = colors.mintMuted;
            }}
          >
            Cancel
          </button>
          <button
            style={applyButtonStyle}
            onClick={handleResize}
            disabled={selectedSize === currentSize}
            onMouseEnter={(e) => {
              if (selectedSize !== currentSize) {
                e.currentTarget.style.backgroundColor = '#ff6b6b';
                e.currentTarget.style.borderColor = '#ff6b6b';
              }
            }}
            onMouseLeave={(e) => {
              if (selectedSize !== currentSize) {
                e.currentTarget.style.backgroundColor = colors.coral;
                e.currentTarget.style.borderColor = colors.coral;
              }
            }}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResizeModal;

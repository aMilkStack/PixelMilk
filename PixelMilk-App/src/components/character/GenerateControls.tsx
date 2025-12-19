import React from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '../shared/Button';

interface GenerateControlsProps {
  hasIdentity: boolean;
  hasSprite: boolean;
  isGeneratingIdentity: boolean;
  isGeneratingSprite: boolean;
  error: string | null;
  onGenerateIdentity: () => void;
  onGenerateSprite: () => void;
  onSaveToLibrary: () => void;
  onClear: () => void;
  disabled?: boolean;
}

const colors = {
  bgPrimary: '#021a1a',
  bgSecondary: '#0d2b2b',
  mint: '#8bd0ba',
  cream: '#d8c8b8',
  error: '#f04e4e',
};

export const GenerateControls: React.FC<GenerateControlsProps> = ({
  hasIdentity,
  hasSprite,
  isGeneratingIdentity,
  isGeneratingSprite,
  error,
  onGenerateIdentity,
  onGenerateSprite,
  onSaveToLibrary,
  onClear,
  disabled = false,
}) => {
  const isAnyGenerating = isGeneratingIdentity || isGeneratingSprite;

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    width: '100%',
  };

  const buttonRowStyle: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  };

  const buttonContentStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const spinnerStyle: React.CSSProperties = {
    animation: 'spin 1s linear infinite',
  };

  const errorStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    padding: '12px',
    backgroundColor: colors.error + '15',
    border: `2px solid ${colors.error}`,
    fontFamily: 'monospace',
    fontSize: '13px',
    color: colors.error,
  };

  const errorIconStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '20px',
    height: '20px',
    backgroundColor: colors.error,
    color: colors.bgPrimary,
    fontWeight: 'bold',
    fontSize: '14px',
    flexShrink: 0,
  };

  return (
    <div style={containerStyle}>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div style={buttonRowStyle}>
        {/* Generate Identity */}
        <Button
          variant="primary"
          onClick={onGenerateIdentity}
          disabled={disabled || isAnyGenerating}
        >
          <span style={buttonContentStyle}>
            {isGeneratingIdentity && <Loader2 size={16} style={spinnerStyle} />}
            Generate Identity
          </span>
        </Button>

        {/* Generate Sprite */}
        <Button
          variant="primary"
          onClick={onGenerateSprite}
          disabled={!hasIdentity || disabled || isAnyGenerating}
        >
          <span style={buttonContentStyle}>
            {isGeneratingSprite && <Loader2 size={16} style={spinnerStyle} />}
            Generate Sprite
          </span>
        </Button>

        {/* Save to Library */}
        <Button
          variant="secondary"
          onClick={onSaveToLibrary}
          disabled={!hasSprite || disabled || isAnyGenerating}
        >
          Save to Library
        </Button>

        {/* Clear */}
        <Button
          variant="ghost"
          onClick={onClear}
          disabled={isAnyGenerating}
        >
          Clear
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <div style={errorStyle} role="alert">
          <span style={errorIconStyle}>!</span>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default GenerateControls;

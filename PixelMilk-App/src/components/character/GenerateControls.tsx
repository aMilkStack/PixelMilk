import React from 'react';
import { Loader2, RotateCcw, Check } from 'lucide-react';
import { Button } from '../shared/Button';

type SaveStatus = 'idle' | 'saving' | 'success' | 'error';
type FailedGeneration = 'identity' | 'sprite' | null;

interface GenerateControlsProps {
  hasIdentity: boolean;
  hasSprite: boolean;
  isGeneratingIdentity: boolean;
  isGeneratingSprite: boolean;
  error: string | null;
  onGenerateIdentity: () => void;
  onGenerateSprite: () => void;
  onSaveToLibrary: () => void;
  onLoadFromLibrary: () => void;
  onClear: () => void;
  disabled?: boolean;
  saveStatus?: SaveStatus;
  lastFailedGeneration?: FailedGeneration;
  onRetry?: () => void;
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
  onLoadFromLibrary,
  onClear,
  disabled = false,
  saveStatus = 'idle',
  lastFailedGeneration = null,
  onRetry,
}) => {
  const isAnyGenerating = isGeneratingIdentity || isGeneratingSprite;
  const isSaving = saveStatus === 'saving';
  const showSuccess = saveStatus === 'success';
  const canRetry = error && lastFailedGeneration && onRetry && !isAnyGenerating;

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

  const errorContentStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    flex: 1,
  };

  const errorRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
  };

  const successStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px',
    backgroundColor: colors.mint + '15',
    border: `2px solid ${colors.mint}`,
    fontFamily: 'monospace',
    fontSize: '13px',
    color: colors.mint,
  };

  const successIconStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '20px',
    height: '20px',
    backgroundColor: colors.mint,
    color: colors.bgPrimary,
    borderRadius: '50%',
    flexShrink: 0,
  };

  const retryLabelStyle: React.CSSProperties = {
    fontSize: '11px',
    color: colors.cream,
    opacity: 0.7,
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
          disabled={!hasSprite || disabled || isAnyGenerating || isSaving}
        >
          <span style={buttonContentStyle}>
            {isSaving && <Loader2 size={16} style={spinnerStyle} />}
            {isSaving ? 'Saving...' : 'Save to Library'}
          </span>
        </Button>

        {/* Load from Library */}
        <Button
          variant="secondary"
          onClick={onLoadFromLibrary}
          disabled={isAnyGenerating || isSaving}
        >
          Load from Library
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

      {/* Success Display */}
      {showSuccess && (
        <div style={successStyle} role="status">
          <span style={successIconStyle}>
            <Check size={14} strokeWidth={3} />
          </span>
          <span>Saved to library successfully!</span>
        </div>
      )}

      {/* Error Display with Retry */}
      {error && !showSuccess && (
        <div style={errorStyle} role="alert">
          <span style={errorIconStyle}>!</span>
          <div style={errorContentStyle}>
            <div style={errorRowStyle}>
              <span>{error}</span>
              {canRetry && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRetry}
                >
                  <span style={buttonContentStyle}>
                    <RotateCcw size={14} />
                    Retry {lastFailedGeneration === 'identity' ? 'Identity' : 'Sprite'}
                  </span>
                </Button>
              )}
            </div>
            {canRetry && (
              <span style={retryLabelStyle}>
                Click retry to attempt {lastFailedGeneration} generation again
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GenerateControls;

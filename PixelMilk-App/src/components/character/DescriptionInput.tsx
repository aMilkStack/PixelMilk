import React, { useState, useEffect, useMemo } from 'react';
import { PxZap, PxLoader } from '../shared/PixelIcon';
import { checkForbiddenWords, formatForbiddenWordWarning } from '../../utils/forbiddenWords';

interface DescriptionInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
  onEnhance?: () => void;
  isEnhancing?: boolean;
  /** Callback when forbidden word validation changes */
  onForbiddenWordsChange?: (hasForbidden: boolean) => void;
}

const MIN_CHARS = 10;
const MAX_CHARS = 2000;

const colors = {
  bgPrimary: '#021a1a',
  bgSecondary: '#0d2b2b',
  mint: '#8bd0ba',
  cream: '#d8c8b8',
  error: '#f04e4e',
  warning: '#ffa500',
  forbidden: '#ff6b9d', // Pink/magenta for forbidden words
};

export const DescriptionInput: React.FC<DescriptionInputProps> = ({
  value,
  onChange,
  disabled = false,
  error,
  onEnhance,
  isEnhancing = false,
  onForbiddenWordsChange,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [internalError, setInternalError] = useState<string>('');

  const characterCount = value.length;
  const isOverLimit = characterCount > MAX_CHARS;
  const isUnderLimit = characterCount > 0 && characterCount < MIN_CHARS;

  // Check for forbidden words in real-time
  const forbiddenResult = useMemo(() => checkForbiddenWords(value), [value]);
  const forbiddenWarning = useMemo(
    () => formatForbiddenWordWarning(forbiddenResult),
    [forbiddenResult]
  );

  // Notify parent of forbidden word status changes
  useEffect(() => {
    onForbiddenWordsChange?.(forbiddenResult.hasForbiddenWords);
  }, [forbiddenResult.hasForbiddenWords, onForbiddenWordsChange]);

  useEffect(() => {
    if (value.length === 0) {
      setInternalError('');
    } else if (isUnderLimit) {
      setInternalError(`Minimum ${MIN_CHARS} characters required`);
    } else if (isOverLimit) {
      setInternalError(`Maximum ${MAX_CHARS} characters exceeded`);
    } else {
      setInternalError('');
    }
  }, [value, isUnderLimit, isOverLimit]);

  const displayError = error || internalError;

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    width: '100%',
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: 'monospace',
    fontSize: '12px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '0.15em',
    color: colors.cream,
  };

  const textareaStyle: React.CSSProperties = {
    width: '100%',
    minHeight: '150px',
    padding: '12px',
    fontFamily: 'monospace',
    fontSize: '14px',
    lineHeight: '1.6',
    color: disabled ? colors.cream + '80' : colors.mint,
    backgroundColor: colors.bgSecondary,
    border: `2px solid ${displayError ? colors.error : isFocused ? colors.mint : colors.mint + '60'}`,
    borderRadius: 0,
    outline: 'none',
    resize: 'vertical',
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
    opacity: disabled ? 0.6 : 1,
    cursor: disabled ? 'not-allowed' : 'var(--cursor-text)',
    boxShadow: isFocused && !disabled
      ? `0 0 0 2px ${colors.mint}40, 0 0 12px ${colors.mint}30`
      : 'none',
  };

  const counterStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontFamily: 'monospace',
    fontSize: '12px',
    color: isOverLimit
      ? colors.error
      : isUnderLimit && characterCount > 0
      ? colors.warning
      : colors.cream + '80',
  };

  const errorStyle: React.CSSProperties = {
    fontFamily: 'monospace',
    fontSize: '12px',
    color: colors.error,
  };

  const canEnhance = onEnhance && characterCount >= MIN_CHARS && characterCount <= MAX_CHARS && !disabled && !isEnhancing;

  const textareaWrapperStyle: React.CSSProperties = {
    position: 'relative',
  };

  const wandButtonStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: '8px',
    right: '8px',
    width: '28px',
    height: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: canEnhance ? colors.mint + '20' : 'transparent',
    border: `1px solid ${canEnhance ? colors.mint + '60' : colors.mint + '30'}`,
    color: canEnhance ? colors.mint : colors.cream + '40',
    cursor: canEnhance ? 'var(--cursor-pointer)' : 'not-allowed',
    transition: 'all 0.15s ease',
    opacity: onEnhance ? 1 : 0,
  };

  const handleWandClick = () => {
    if (canEnhance && onEnhance) {
      onEnhance();
    }
  };

  return (
    <div style={containerStyle}>
      <label style={labelStyle} htmlFor="character-description">
        Character Description
      </label>

      <div style={textareaWrapperStyle}>
        <textarea
          id="character-description"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled || isEnhancing}
          placeholder="A weathered forest guardian who protects ancient groves. Their bark-like skin is mottled green and brown, with glowing amber eyes. Mushrooms grow along their shoulders, and they carry a gnarled staff wrapped in vines..."
          style={textareaStyle}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          aria-invalid={!!displayError}
          aria-describedby={displayError ? 'description-error' : 'description-counter'}
        />
        {onEnhance && (
          <button
            type="button"
            style={wandButtonStyle}
            onClick={handleWandClick}
            disabled={!canEnhance}
            title={canEnhance ? 'Enhance prompt with AI' : 'Enter valid description to enhance'}
            aria-label="Enhance prompt"
          >
            {isEnhancing ? (
              <PxLoader size={14} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <PxZap size={14} />
            )}
          </button>
        )}
      </div>

      <div style={counterStyle}>
        <span id="description-counter">
          {characterCount} / {MAX_CHARS}
        </span>
        {characterCount > 0 && characterCount < MIN_CHARS && (
          <span>{MIN_CHARS - characterCount} more needed</span>
        )}
      </div>

      {displayError && (
        <div id="description-error" style={errorStyle} role="alert">
          {displayError}
        </div>
      )}

      {/* Forbidden words warning - shown separately from errors */}
      {forbiddenWarning && !displayError && (
        <div
          id="forbidden-warning"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 12px',
            backgroundColor: colors.forbidden + '15',
            border: `1px solid ${colors.forbidden}40`,
            fontFamily: 'monospace',
            fontSize: '12px',
            color: colors.forbidden,
          }}
          role="alert"
        >
          <span style={{ fontSize: '14px' }}>!</span>
          <span>{forbiddenWarning}</span>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default DescriptionInput;

import React, { useState, useEffect } from 'react';

interface DescriptionInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
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
};

export const DescriptionInput: React.FC<DescriptionInputProps> = ({
  value,
  onChange,
  disabled = false,
  error,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [internalError, setInternalError] = useState<string>('');

  const characterCount = value.length;
  const isOverLimit = characterCount > MAX_CHARS;
  const isUnderLimit = characterCount > 0 && characterCount < MIN_CHARS;

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
    cursor: disabled ? 'not-allowed' : 'text',
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

  return (
    <div style={containerStyle}>
      <label style={labelStyle} htmlFor="character-description">
        Character Description
      </label>

      <textarea
        id="character-description"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="A brave knight with silver armor and a red cape, wielding a glowing sword..."
        style={textareaStyle}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        aria-invalid={!!displayError}
        aria-describedby={displayError ? 'description-error' : 'description-counter'}
      />

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
    </div>
  );
};

export default DescriptionInput;

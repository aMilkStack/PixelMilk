import React, { type InputHTMLAttributes, type ChangeEvent } from 'react';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'className'> {
  label?: string;
  error?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  disabled?: boolean;
  className?: string;
}

// Terminal aesthetic color palette
const colors = {
  bgPrimary: '#021a1a',
  bgSecondary: '#0d2b2b',
  mint: '#8bd0ba',
  cream: '#d8c8b8',
  danger: '#f04e4e',
};

export const Input: React.FC<InputProps> = ({
  label,
  error,
  placeholder,
  value,
  onChange,
  type = 'text',
  disabled = false,
  className = '',
  ...rest
}) => {
  const [isFocused, setIsFocused] = React.useState(false);

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
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

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    backgroundColor: colors.bgSecondary,
    color: colors.mint,
    border: `2px solid ${error ? colors.danger : colors.mint}`,
    borderRadius: 0, // NO border-radius - terminal aesthetic
    fontFamily: 'monospace',
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.15s ease',
    opacity: disabled ? 0.5 : 1,
    cursor: disabled ? 'not-allowed' : 'var(--cursor-text)',
    boxShadow: isFocused && !disabled
      ? `0 0 0 2px ${error ? colors.danger : colors.mint}40, 0 0 12px ${error ? colors.danger : colors.mint}30`
      : 'none',
  };

  const errorStyle: React.CSSProperties = {
    fontFamily: 'monospace',
    fontSize: '11px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: colors.danger,
    marginTop: '2px',
  };

  const placeholderStyle = `
    .terminal-input::placeholder {
      color: ${colors.mint}60;
      font-style: italic;
    }
  `;

  return (
    <div style={containerStyle} className={className}>
      <style>{placeholderStyle}</style>

      {label && (
        <label style={labelStyle}>
          {label}
        </label>
      )}

      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className="terminal-input"
        style={inputStyle}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        {...rest}
      />

      {error && (
        <span style={errorStyle}>
          {error}
        </span>
      )}
    </div>
  );
};

export default Input;

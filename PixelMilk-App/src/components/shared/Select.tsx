import React, { type SelectHTMLAttributes, type ChangeEvent } from 'react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange' | 'className'> {
  label?: string;
  options: SelectOption[];
  value?: string;
  onChange?: (e: ChangeEvent<HTMLSelectElement>) => void;
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

export const Select: React.FC<SelectProps> = ({
  label,
  options,
  value,
  onChange,
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

  const selectWrapperStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
  };

  const selectStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 36px 10px 12px',
    backgroundColor: colors.bgSecondary,
    color: colors.mint,
    border: `2px solid ${colors.mint}`,
    borderRadius: 0, // NO border-radius - terminal aesthetic
    fontFamily: 'monospace',
    fontSize: '14px',
    outline: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.15s ease',
    opacity: disabled ? 0.5 : 1,
    appearance: 'none',
    WebkitAppearance: 'none',
    MozAppearance: 'none',
    boxShadow: isFocused && !disabled
      ? `0 0 0 2px ${colors.mint}40, 0 0 12px ${colors.mint}30`
      : 'none',
  };

  // Custom arrow indicator (terminal style)
  const arrowStyle: React.CSSProperties = {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    pointerEvents: 'none',
    color: colors.mint,
    fontFamily: 'monospace',
    fontSize: '12px',
    fontWeight: 'bold',
    opacity: disabled ? 0.5 : 1,
  };

  // Style for the options - injected via style tag
  // Override Chrome's default blue highlight with terminal mint color
  const optionStyles = `
    .terminal-select option {
      background-color: ${colors.bgSecondary};
      color: ${colors.mint};
      padding: 8px;
      font-family: monospace;
    }
    .terminal-select option:hover,
    .terminal-select option:focus,
    .terminal-select option:checked {
      background-color: ${colors.mint};
      color: ${colors.bgPrimary};
    }
    /* Override Chrome/browser default blue highlight */
    .terminal-select:focus {
      outline: none;
      border-color: ${colors.mint};
    }
    .terminal-select::selection,
    .terminal-select option::selection {
      background-color: ${colors.mint};
      color: ${colors.bgPrimary};
    }
    .terminal-select::-moz-focus-inner {
      border: 0;
    }
    /* Chrome autofill override */
    .terminal-select:-webkit-autofill,
    .terminal-select:-webkit-autofill:hover,
    .terminal-select:-webkit-autofill:focus {
      -webkit-text-fill-color: ${colors.mint};
      -webkit-box-shadow: 0 0 0px 1000px ${colors.bgSecondary} inset;
      transition: background-color 5000s ease-in-out 0s;
    }
  `;

  return (
    <div style={containerStyle} className={className}>
      <style>{optionStyles}</style>

      {label && (
        <label style={labelStyle}>
          {label}
        </label>
      )}

      <div style={selectWrapperStyle}>
        <select
          value={value}
          onChange={onChange}
          disabled={disabled}
          className="terminal-select"
          style={selectStyle}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...rest}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>

        <span style={arrowStyle}>
          [v]
        </span>
      </div>
    </div>
  );
};

export default Select;

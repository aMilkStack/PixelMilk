import React, { type ButtonHTMLAttributes, type ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  onClick?: () => void;
  children: ReactNode;
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

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    backgroundColor: colors.mint,
    color: colors.bgPrimary,
    border: `2px solid ${colors.mint}`,
  },
  secondary: {
    backgroundColor: 'transparent',
    color: colors.mint,
    border: `2px solid ${colors.mint}`,
  },
  danger: {
    backgroundColor: colors.danger,
    color: colors.bgPrimary,
    border: `2px solid ${colors.danger}`,
  },
  ghost: {
    backgroundColor: 'transparent',
    color: colors.cream,
    border: '2px solid transparent',
  },
};

const variantHoverStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    backgroundColor: colors.bgPrimary,
    color: colors.mint,
    boxShadow: `4px 4px 0px ${colors.mint}`,
  },
  secondary: {
    backgroundColor: colors.mint,
    color: colors.bgPrimary,
    boxShadow: `4px 4px 0px ${colors.bgSecondary}`,
  },
  danger: {
    backgroundColor: colors.bgPrimary,
    color: colors.danger,
    boxShadow: `4px 4px 0px ${colors.danger}`,
  },
  ghost: {
    backgroundColor: colors.bgSecondary,
    color: colors.mint,
  },
};

const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
  sm: {
    padding: '4px 12px',
    fontSize: '12px',
  },
  md: {
    padding: '8px 20px',
    fontSize: '14px',
  },
  lg: {
    padding: '12px 28px',
    fontSize: '16px',
  },
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
  children,
  className = '',
  ...rest
}) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const [isActive, setIsActive] = React.useState(false);

  const baseStyle: React.CSSProperties = {
    borderRadius: 0, // NO border-radius - terminal aesthetic
    fontFamily: 'monospace',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.15s ease',
    opacity: disabled ? 0.5 : 1,
    outline: 'none',
    ...sizeStyles[size],
    ...variantStyles[variant],
  };

  const hoverStyle: React.CSSProperties = isHovered && !disabled
    ? variantHoverStyles[variant]
    : {};

  const activeStyle: React.CSSProperties = isActive && !disabled
    ? {
        transform: 'translate(2px, 2px)',
        boxShadow: 'none',
      }
    : {};

  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={className}
      style={{
        ...baseStyle,
        ...hoverStyle,
        ...activeStyle,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsActive(false);
      }}
      onMouseDown={() => setIsActive(true)}
      onMouseUp={() => setIsActive(false)}
      {...rest}
    >
      {children}
    </button>
  );
};

export default Button;

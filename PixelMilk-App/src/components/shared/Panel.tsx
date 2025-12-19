import React, { type ReactNode } from 'react';

export interface PanelProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

// Terminal aesthetic color palette
const colors = {
  bgPrimary: '#021a1a',
  bgSecondary: '#0d2b2b',
  mint: '#8bd0ba',
  cream: '#d8c8b8',
};

export const Panel: React.FC<PanelProps> = ({
  title,
  children,
  className = '',
}) => {
  const containerStyle: React.CSSProperties = {
    backgroundColor: colors.bgSecondary,
    border: `2px solid ${colors.mint}`,
    borderRadius: 0, // NO border-radius - terminal aesthetic
    boxShadow: `4px 4px 0px ${colors.bgPrimary}`,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  };

  const headerStyle: React.CSSProperties = {
    backgroundColor: colors.mint,
    color: colors.bgPrimary,
    padding: '8px 12px',
    fontFamily: 'monospace',
    fontSize: '12px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '0.15em',
    borderBottom: `2px solid ${colors.mint}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  };

  const contentStyle: React.CSSProperties = {
    padding: '16px',
    flex: 1,
    overflow: 'auto',
  };

  // Decorative terminal element for header
  const decoratorStyle: React.CSSProperties = {
    display: 'flex',
    gap: '4px',
  };

  const dotStyle: React.CSSProperties = {
    width: '8px',
    height: '8px',
    backgroundColor: colors.bgPrimary,
    border: 'none',
  };

  return (
    <div style={containerStyle} className={className}>
      {title && (
        <div style={headerStyle}>
          <span>{title}</span>
          <div style={decoratorStyle}>
            <span style={dotStyle} />
            <span style={dotStyle} />
            <span style={dotStyle} />
          </div>
        </div>
      )}
      <div style={contentStyle}>
        {children}
      </div>
    </div>
  );
};

export default Panel;

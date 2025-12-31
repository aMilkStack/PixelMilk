/**
 * CollapsiblePanel - Mobile-friendly collapsible section
 *
 * Used on mobile to collapse panels that would otherwise clutter the UI.
 */

import React, { useState } from 'react';
import { PxChevronDown } from './PixelIcon';

const colors = {
  bgSecondary: '#0d2b2b',
  mint: '#8bd0ba',
  mintMuted: '#8bd0ba40',
  cream: '#d8c8b8',
};

// Touch-friendly tap target
const TAP_TARGET = 44;

export interface CollapsiblePanelProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  icon?: React.ReactNode;
}

export const CollapsiblePanel: React.FC<CollapsiblePanelProps> = ({
  title,
  children,
  defaultOpen = false,
  icon,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: TAP_TARGET,
    padding: '8px 12px',
    backgroundColor: colors.bgSecondary,
    border: `1px solid ${colors.mintMuted}`,
    borderBottom: isOpen ? 'none' : `1px solid ${colors.mintMuted}`,
    cursor: 'pointer',
    WebkitTapHighlightColor: 'transparent',
    touchAction: 'manipulation',
    userSelect: 'none',
  };

  const titleStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontFamily: 'monospace',
    fontSize: '11px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: colors.mint,
  };

  const chevronStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: colors.cream,
    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
    transition: 'transform 0.2s ease',
  };

  const contentStyle: React.CSSProperties = {
    display: isOpen ? 'block' : 'none',
    padding: '12px',
    backgroundColor: colors.bgSecondary,
    border: `1px solid ${colors.mintMuted}`,
    borderTop: 'none',
  };

  return (
    <div>
      <div
        style={headerStyle}
        onClick={() => setIsOpen(!isOpen)}
        role="button"
        aria-expanded={isOpen}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
      >
        <span style={titleStyle}>
          {icon}
          {title}
        </span>
        <span style={chevronStyle}><PxChevronDown size={14} /></span>
      </div>
      <div style={contentStyle}>
        {children}
      </div>
    </div>
  );
};

export default CollapsiblePanel;

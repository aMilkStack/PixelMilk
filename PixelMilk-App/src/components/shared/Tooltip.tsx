import React, { useState, useRef, useEffect, type ReactNode } from 'react';

export interface TooltipProps {
  content: string;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}

/**
 * Tooltip Component - Terminal Aesthetic
 * Shows tooltip text on hover with pixel-art styling
 */
export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  delay = 200,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<number | null>(null);

  const showTooltip = () => {
    timeoutRef.current = window.setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsVisible(false);
  };

  useEffect(() => {
    if (isVisible && triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();

      let top = 0;
      let left = 0;
      const offset = 8;

      switch (position) {
        case 'top':
          top = triggerRect.top - tooltipRect.height - offset;
          left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
          break;
        case 'bottom':
          top = triggerRect.bottom + offset;
          left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
          break;
        case 'left':
          top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
          left = triggerRect.left - tooltipRect.width - offset;
          break;
        case 'right':
          top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
          left = triggerRect.right + offset;
          break;
      }

      // Keep tooltip within viewport
      const padding = 8;
      left = Math.max(padding, Math.min(left, window.innerWidth - tooltipRect.width - padding));
      top = Math.max(padding, Math.min(top, window.innerHeight - tooltipRect.height - padding));

      setCoords({ top, left });
    }
  }, [isVisible, position]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const tooltipStyles: React.CSSProperties = {
    position: 'fixed',
    top: coords.top,
    left: coords.left,
    zIndex: 'var(--z-tooltip, 400)' as unknown as number,
    padding: 'var(--space-xs) var(--space-sm)',
    backgroundColor: 'var(--color-bg-secondary)',
    color: 'var(--color-text-primary)',
    border: '1px solid var(--color-border)',
    fontFamily: 'var(--font-mono)',
    fontSize: 'var(--font-size-sm)',
    whiteSpace: 'nowrap',
    pointerEvents: 'none',
    opacity: isVisible ? 1 : 0,
    visibility: isVisible ? 'visible' : 'hidden',
    transition: 'opacity 150ms ease',
    boxShadow: '2px 2px 0px var(--color-border)',
    // Terminal aesthetic - no rounded corners
    borderRadius: 0,
  };

  const triggerStyles: React.CSSProperties = {
    display: 'inline-flex',
    cursor: 'inherit',
  };

  return (
    <>
      <span
        ref={triggerRef}
        style={triggerStyles}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
      >
        {children}
      </span>
      <div ref={tooltipRef} style={tooltipStyles} role="tooltip" aria-hidden={!isVisible}>
        {content}
      </div>
    </>
  );
};

export default Tooltip;

import { useEffect, useCallback } from 'react';

type KeyHandler = () => void;

interface KeyBindings {
  [key: string]: KeyHandler;
}

export function useKeyboard(bindings: KeyBindings, enabled = true) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // Build key string
      const parts: string[] = [];
      if (e.ctrlKey || e.metaKey) parts.push('ctrl');
      if (e.shiftKey) parts.push('shift');
      if (e.altKey) parts.push('alt');
      parts.push(e.key.toLowerCase());

      const keyString = parts.join('+');

      const handler = bindings[keyString];
      if (handler) {
        e.preventDefault();
        handler();
      }
    },
    [bindings, enabled]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

// Common shortcuts for pixel editing
export const EDITOR_SHORTCUTS = {
  UNDO: 'ctrl+z',
  REDO: 'ctrl+shift+z',
  REDO_ALT: 'ctrl+y',
  DRAW: 'd',
  ERASE: 'e',
  FILL: 'f',
  EYEDROPPER: 'i',
  SELECT: 'v',
  HOTSPOT: 'h',
  ZOOM_IN: '=',
  ZOOM_OUT: '-',
  ZOOM_RESET: '0',
} as const;

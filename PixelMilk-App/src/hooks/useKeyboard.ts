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
  UNDO_SIMPLE: 'z',
  REDO: 'ctrl+shift+z',
  REDO_ALT: 'ctrl+y',
  DRAW: 'b',
  DRAW_ALT: 'd',
  ERASE: 'e',
  FILL: 'g',
  FILL_ALT: 'f',
  EYEDROPPER: 'i',
  SELECT: 'v',
  HOTSPOT: 'h',
  PAN: ' ',
  ZOOM_IN: '=',
  ZOOM_IN_ALT: '+',
  ZOOM_OUT: '-',
  ZOOM_RESET: '0',
  // Quick palette selection (1-9)
  PALETTE_1: '1',
  PALETTE_2: '2',
  PALETTE_3: '3',
  PALETTE_4: '4',
  PALETTE_5: '5',
  PALETTE_6: '6',
  PALETTE_7: '7',
  PALETTE_8: '8',
  PALETTE_9: '9',
} as const;

// Human-readable shortcut labels for tooltips
export const SHORTCUT_LABELS = {
  draw: 'B',
  erase: 'E',
  fill: 'G',
  eyedropper: 'I',
  select: 'V',
  hotspot: 'H',
  pan: 'Space',
  undo: 'Z / Ctrl+Z',
  redo: 'Ctrl+Y',
  zoomIn: '+ / =',
  zoomOut: '-',
  zoomReset: '0',
} as const;

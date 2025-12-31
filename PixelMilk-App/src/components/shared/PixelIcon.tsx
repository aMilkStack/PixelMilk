/**
 * PixelIcon - Pixelarticons wrapper component
 *
 * Provides a Lucide-like API for pixelarticons SVGs.
 * Icons are embedded inline to avoid build complexity.
 *
 * Usage:
 *   import { PixelIcon } from '../shared/PixelIcon';
 *   <PixelIcon name="grid" size={16} />
 *
 * Icon mapping (Lucide -> Pixelarticons):
 *   - Grid -> grid
 *   - Download -> download
 *   - Info -> info-box
 *   - User -> user
 *   - Palette -> colors-swatch
 *   - Tag -> label
 *   - ChevronDown -> chevron-down
 *   - ChevronUp -> chevron-up
 *   - Play -> play
 *   - Pause -> pause
 *   - SkipBack -> prev
 *   - SkipForward -> next
 *   - Shuffle -> shuffle
 *   - Volume2 -> volume
 *   - VolumeX -> volume-x
 *   - X -> close
 *   - Music -> music
 *   - Lock -> lock
 *   - Unlock -> lock-open
 *   - Settings -> sliders
 *   - Loader2 -> loader
 *   - RotateCcw -> undo
 *   - RefreshCw -> reload
 *   - Check -> check
 *   - CheckCircle -> check-double
 *   - AlertCircle -> alert
 *   - AlertTriangle -> warning-box
 *   - Wand2 -> zap
 *   - Edit3/Edit2 -> edit
 *   - Eye -> eye
 *   - Save -> save
 *   - Box -> archive
 *   - Layers -> layout
 *   - Combine -> group
 *   - Library -> book
 *   - Grid3X3 -> add-grid
 */

import React from 'react';

export type PixelIconName =
  | 'grid'
  | 'download'
  | 'info-box'
  | 'user'
  | 'colors-swatch'
  | 'label'
  | 'chevron-down'
  | 'chevron-up'
  | 'play'
  | 'pause'
  | 'prev'
  | 'next'
  | 'shuffle'
  | 'volume'
  | 'volume-x'
  | 'close'
  | 'music'
  | 'lock'
  | 'lock-open'
  | 'sliders'
  | 'loader'
  | 'undo'
  | 'reload'
  | 'check'
  | 'check-double'
  | 'alert'
  | 'warning-box'
  | 'zap'
  | 'edit'
  | 'eye'
  | 'save'
  | 'archive'
  | 'layout'
  | 'group'
  | 'book'
  | 'add-grid'
  | 'key'
  | 'scale'
  | 'scale-down'
  | 'drag'
  | 'menu'
  | 'cursor'
  | 'move'
  | 'pencil'
  | 'drop'
  | 'pipette'
  | 'eraser';

export interface PixelIconProps {
  name: PixelIconName;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

// SVG path data extracted from pixelarticons package
const iconPaths: Record<PixelIconName, string> = {
  'grid': 'M2 2h20v20H2V2zm2 2v4h4V4H4zm6 0v4h4V4h-4zm6 0v4h4V4h-4zm4 6h-4v4h4v-4zm0 6h-4v4h4v-4zm-6 4v-4h-4v4h4zm-6 0v-4H4v4h4zm-4-6h4v-4H4v4zm6-4v4h4v-4h-4z',
  'download': 'M13 17V3h-2v10H9v-2H7v2h2v2h2v2h2zm8 2v-4h-2v4H5v-4H3v6h18v-2zm-8-6v2h2v-2h2v-2h-2v2h-2z',
  'info-box': 'M3 3h2v18H3V3zm16 0H5v2h14v14H5v2h16V3h-2zm-8 6h2V7h-2v2zm2 8h-2v-6h2v6z',
  'user': 'M15 2H9v2H7v6h2V4h6V2zm0 8H9v2h6v-2zm0-6h2v6h-2V4zM4 16h2v-2h12v2H6v4h12v-4h2v6H4v-6z',
  'colors-swatch': 'M14 2h8v20H12V2h2zm6 2h-6v16h6V4zM10 20H4v-6h6v-2H6v-2H4V8h2V6h2V4h2V2H8v2H6v2H4v2H2v2h2v2H2v10h8v-2zm8-4h-2v2h2v-2z',
  'label': 'M12 2H2v10h2v2h2v2h2v2h2v2h2v2h2v-2h2v-2h2v-2h2v-2h2v-2h-2v-2h-2V8h-2V6h-2V4h-2V2zm0 2v2h2v2h2v2h2v2h2v2h-2v2h-2v2h-2v2h-2v-2h-2v-2H8v-2H6v-2H4V4h8zM6 6h2v2H6V6z',
  'chevron-down': 'M7 8H5v2h2v2h2v2h2v2h2v-2h2v-2h2v-2h2V8h-2v2h-2v2h-2v2h-2v-2H9v-2H7V8z',
  'chevron-up': 'M7 16h2v-2h2v-2h2v-2h2v2h2v2h2v2h2v-2h-2v-2h-2v-2h-2V8h-2v2H9v2H7v2H5v2h2z',
  'play': 'M10 20H8V4h2v2h2v3h2v2h2v2h-2v2h-2v3h-2v2z',
  'pause': 'M10 4H5v16h5V4zm9 0h-5v16h5V4z',
  'prev': 'M6 4h2v16H6V4zm12 0h-2v2h-2v3h-2v2h-2v2h2v3h2v2h2v2h2V4z',
  'next': 'M6 4h2v2h2v2h2v2h2v4h-2v2h-2v2H8v2H6V4zm12 0h-2v16h2V4z',
  'shuffle': 'M18 5h-2v2h2v2h-6v2h-2v6H2v2h8v-2h2v-6h6v2h-2v2h2v-2h2v-2h2V9h-2V7h-2V5zM2 9h6v2H2V9zm20 10v-2h-8v2h8z',
  'volume': 'M15 2h2v20h-2v-2h-2v-2h2V6h-2V4h2V2zm-4 6V6h2v2h-2zm-2 2h2V8H7v8h4v2h2v-2h-2v-2H9v-4z',
  'volume-x': 'M13 2h-2v2H9v2H7v2H3v8h4v2h2v2h2v2h2V2zM9 18v-2H7v-2H5v-4h2V8h2V6h2v12H9zm10-6.777h-2v-2h-2v2h2v2h-2v2h2v-2h2v2h2v-2h-2v-2zm0 0h2v-2h-2v2z',
  'close': 'M5 5h2v2H5V5zm4 4H7V7h2v2zm2 2H9V9h2v2zm2 0h-2v2H9v2H7v2H5v2h2v-2h2v-2h2v-2h2v2h2v2h2v2h2v-2h-2v-2h-2v-2h-2v-2zm2-2v2h-2V9h2zm2-2v2h-2V7h2zm0 0V5h2v2h-2z',
  'music': 'M8 4h12v16h-8v-8h6V8h-8v12H2v-8h6V4zm0 10H4v4h4v-4zm10 0h-4v4h4v-4z',
  'lock': 'M15 2H9v2H7v4H4v14h16V8h-3V4h-2V2zm0 2v4H9V4h6zm-6 6h9v10H6V10h3zm4 3h-2v4h2v-4z',
  'lock-open': 'M15 2H9v2H7v2h2V4h6v4H4v14h16V8h-3V4h-2V2zm0 8h3v10H6V10h9zm-2 3h-2v4h2v-4z',
  'sliders': 'M17 4h2v10h-2V4zm0 12h-2v2h2v2h2v-2h2v-2h-4zm-4-6h-2v10h2V10zm-8 2H3v2h2v6h2v-6h2v-2H5zm8-8h-2v2H9v2h6V6h-2V4zM5 4h2v6H5V4z',
  'loader': 'M13 2h-2v6h2V2zm0 14h-2v6h2v-6zm9-5v2h-6v-2h6zM8 13v-2H2v2h6zm7-6h2v2h-2V7zm4-2h-2v2h2V5zM9 7H7v2h2V7zM5 5h2v2H5V5zm10 12h2v2h2v-2h-2v-2h-2v2zm-8 0v-2h2v2H7v2H5v-2h2z',
  'undo': 'M8 4h2v2H8V4zm10 6V8H8V6H6v2H4v2h2v2h2v2h2v-2H8v-2h10zm0 8v-8h2v8h-2zm0 0v2h-6v-2h6z',
  'reload': 'M16 2h-2v2h2v2H4v2H2v5h2V8h12v2h-2v2h2v-2h2V8h2V6h-2V4h-2V2zM6 20h2v2h2v-2H8v-2h12v-2h2v-5h-2v5H8v-2h2v-2H8v2H6v2H4v2h2v2z',
  'check': 'M18 6h2v2h-2V6zm-2 4V8h2v2h-2zm-2 2v-2h2v2h-2zm-2 2h2v-2h-2v2zm-2 2h2v-2h-2v2zm-2 0v2h2v-2H8zm-2-2h2v2H6v-2zm0 0H4v-2h2v2z',
  'check-double': 'M15 6h2v2h-2V6zm-2 4V8h2v2h-2zm-2 2v-2h2v2h-2zm-2 2v-2h2v2H9zm-2 2v-2h2v2H7zm-2 0h2v2H5v-2zm-2-2h2v2H3v-2zm0 0H1v-2h2v2zm8 2h2v2h-2v-2zm4-2v2h-2v-2h2zm2-2v2h-2v-2h2zm2-2v2h-2v-2h2zm2-2h-2v2h2V8zm0 0h2V6h-2v2z',
  'alert': 'M13 1h-2v2H9v2H7v2H5v2H3v2H1v2h2v2h2v2h2v2h2v2h2v2h2v-2h2v-2h2v-2h2v-2h2v-2h2v-2h-2V9h-2V7h-2V5h-2V3h-2V1zm0 2v2h2v2h2v2h2v2h2v2h-2v2h-2v2h-2v2h-2v2h-2v-2H9v-2H7v-2H5v-2H3v-2h2V9h2V7h2V5h2V3h2zm0 4h-2v6h2V7zm0 8h-2v2h2v-2z',
  'warning-box': 'M3 3h16v2H5v14h14v2H3V3zm18 0h-2v18h2V3zM11 15h2v2h-2v-2zm2-8h-2v6h2V7z',
  'zap': 'M12 1h2v8h8v4h-2v-2h-8V5h-2V3h2V1zM8 7V5h2v2H8zM6 9V7h2v2H6zm-2 2V9h2v2H4zm10 8v2h-2v2h-2v-8H2v-4h2v2h8v6h2zm2-2v2h-2v-2h2zm2-2v2h-2v-2h2zm0 0h2v-2h-2v2z',
  'edit': 'M18 2h-2v2h-2v2h-2v2h-2v2H8v2H6v2H4v2H2v6h6v-2h2v-2h2v-2h2v-2h2v-2h2v-2h2V8h2V6h-2V4h-2V2zm0 8h-2v2h-2v2h-2v2h-2v2H8v-2H6v-2h2v-2h2v-2h2V8h2V6h2v2h2v2zM6 16H4v4h4v-2H6v-2z',
  'eye': 'M8 6h8v2H8V6zm-4 4V8h4v2H4zm-2 2v-2h2v2H2zm0 2v-2H0v2h2zm2 2H2v-2h2v2zm4 2H4v-2h4v2zm8 0v2H8v-2h8zm4-2v2h-4v-2h4zm2-2v2h-2v-2h2zm0-2h2v2h-2v-2zm-2-2h2v2h-2v-2zm0 0V8h-4v2h4zm-10 1h4v4h-4v-4z',
  'save': 'M4 2h14v2H4v16h2v-6h12v6h2V6h2v16H2V2h2zm4 18h8v-4H8v4zM20 6h-2V4h2v2zM6 6h9v4H6V6z',
  'archive': 'M22 4H2v6h2v10h16V10h2V4zM6 10h12v8H6v-8zm14-4v2H4V6h16zm-5 6H9v2h6v-2z',
  'layout': 'M2 5h20v14H2V5zm2 2v4h16V7H4zm16 6H10v4h10v-4zM8 17v-4H4v4h4z',
  'group': 'M3 3h18v18H3V3zm2 2v14h14V5H5zm2 2h4v4H7V7zm6 0h4v4h-4V7zm-6 6h4v4H7v-4zm6 0h4v4h-4v-4z',
  'book': 'M8 2h12v20H4V2h4zm4 8h-2v2H8V4H6v16h12V4h-4v8h-2v-2z',
  'add-grid': 'M3 3h8v8H3V3zm6 6V5H5v4h4zm9 4h-2v3h-3v2h3v3h2v-3h3v-2h-3v-3zM15 3h6v8h-8V3h2zm4 6V5h-4v4h4zM5 13h6v8H3v-8h2zm4 6v-4H5v4h4z',
  'key': 'M14 2h-4v2h4V2zm4 4V4h-4v2h4zm2 6V6h-2v6h2zm-2 4v-4h-2v2h-2v2h4zm-4 2v-2h-2v-2H8v-2H4v8h8v-2h2zm-4 0H6v-4h4v4z',
  'scale': 'M4 4h6v2H6v4H4V4zm10 0h6v6h-2V6h-4V4zM6 14v4h4v2H4v-6h2zm14 0v6h-6v-2h4v-4h2z',
  'scale-down': 'M4 4h2v4h4v2H4V4zm10 6V8h4V6h-6v4h2zm-4 4v6h6v-2h-4v-4h-2zm10 0h-2v4h-4v2h6v-6z',
  'drag': 'M11 2h2v4h-2V2zm0 16h2v4h-2v-4zm0-8h2v4h-2v-4zM5 2h2v4H5V2zm0 16h2v4H5v-4zm0-8h2v4H5v-4zm12-8h2v4h-2V2zm0 16h2v4h-2v-4zm0-8h2v4h-2v-4z',
  'menu': 'M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h16v2H4v-2z',
  'cursor': 'M10 2v2H8v2H6v2H4v2h2v2h2v6h2v-4h2v4h2v-2h-2v-4h4v-2h-4V8h6V6h-2V4h-2V2h-4z',
  'move': 'M11 2h2v3h3v2h-3v3h3v2h-3v3h3v2h-3v3h-2v-3H8v-2h3v-3H8v-2h3V7H8V5h3V2zm-6 9H2v2h3v-2zm17 0h-3v2h3v-2z',
  'pencil': 'M18 2h-2v2h-2v2h-2v2h-2v2H8v2H6v2H4v2H2v4h4v-2h2v-2h2v-2h2v-2h2v-2h2V8h2V6h2V4h-2V2zM4 18v-2h2v2H4z',
  'drop': 'M13 2h-2v2H9v2H7v2H5v4h2v2h2v2h2v2h2v-2h2v-2h2v-2h2V8h-2V6h-2V4h-2V2z',
  'pipette': 'M17 2h-2v2h-2v2h-2v2h2V6h2V4h2v2h2v2h-2v2h-2v2h-2v2H9v2H7v2H5v2H3v2h2v-2h2v-2h2v-2h2v-2h2v-2h2v-2h2V8h2V6h-2V4h-2V2z',
  'eraser': 'M14 4h-2v2h-2v2H8v2H6v2H4v2H2v2h2v2h6v-2h2v-2h2v-2h2v-2h2V8h-2V6h-2V4zm-4 12H6v-2h2v-2h2v2h2v2h-2z',
};

export const PixelIcon: React.FC<PixelIconProps> = ({
  name,
  size = 24,
  className,
  style,
}) => {
  const path = iconPaths[name];

  if (!path) {
    console.warn(`PixelIcon: Unknown icon name "${name}"`);
    return null;
  }

  return (
    <svg
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      style={style}
    >
      <path d={path} fill="currentColor" />
    </svg>
  );
};

// Convenience wrapper components that match Lucide naming
// These provide drop-in replacements for Lucide icons

interface IconComponentProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

// Direct pixelarticons names
export const PxGrid: React.FC<IconComponentProps> = (props) => <PixelIcon name="grid" {...props} />;
export const PxDownload: React.FC<IconComponentProps> = (props) => <PixelIcon name="download" {...props} />;
export const PxInfo: React.FC<IconComponentProps> = (props) => <PixelIcon name="info-box" {...props} />;
export const PxUser: React.FC<IconComponentProps> = (props) => <PixelIcon name="user" {...props} />;
export const PxPalette: React.FC<IconComponentProps> = (props) => <PixelIcon name="colors-swatch" {...props} />;
export const PxTag: React.FC<IconComponentProps> = (props) => <PixelIcon name="label" {...props} />;
export const PxChevronDown: React.FC<IconComponentProps> = (props) => <PixelIcon name="chevron-down" {...props} />;
export const PxChevronUp: React.FC<IconComponentProps> = (props) => <PixelIcon name="chevron-up" {...props} />;
export const PxPlay: React.FC<IconComponentProps> = (props) => <PixelIcon name="play" {...props} />;
export const PxPause: React.FC<IconComponentProps> = (props) => <PixelIcon name="pause" {...props} />;
export const PxPrev: React.FC<IconComponentProps> = (props) => <PixelIcon name="prev" {...props} />;
export const PxNext: React.FC<IconComponentProps> = (props) => <PixelIcon name="next" {...props} />;
export const PxShuffle: React.FC<IconComponentProps> = (props) => <PixelIcon name="shuffle" {...props} />;
export const PxVolume: React.FC<IconComponentProps> = (props) => <PixelIcon name="volume" {...props} />;
export const PxVolumeX: React.FC<IconComponentProps> = (props) => <PixelIcon name="volume-x" {...props} />;
export const PxClose: React.FC<IconComponentProps> = (props) => <PixelIcon name="close" {...props} />;
export const PxMusic: React.FC<IconComponentProps> = (props) => <PixelIcon name="music" {...props} />;
export const PxLock: React.FC<IconComponentProps> = (props) => <PixelIcon name="lock" {...props} />;
export const PxUnlock: React.FC<IconComponentProps> = (props) => <PixelIcon name="lock-open" {...props} />;
export const PxSettings: React.FC<IconComponentProps> = (props) => <PixelIcon name="sliders" {...props} />;
export const PxLoader: React.FC<IconComponentProps> = (props) => <PixelIcon name="loader" {...props} />;
export const PxUndo: React.FC<IconComponentProps> = (props) => <PixelIcon name="undo" {...props} />;
export const PxReload: React.FC<IconComponentProps> = (props) => <PixelIcon name="reload" {...props} />;
export const PxCheck: React.FC<IconComponentProps> = (props) => <PixelIcon name="check" {...props} />;
export const PxCheckDouble: React.FC<IconComponentProps> = (props) => <PixelIcon name="check-double" {...props} />;
export const PxAlert: React.FC<IconComponentProps> = (props) => <PixelIcon name="alert" {...props} />;
export const PxWarning: React.FC<IconComponentProps> = (props) => <PixelIcon name="warning-box" {...props} />;
export const PxZap: React.FC<IconComponentProps> = (props) => <PixelIcon name="zap" {...props} />;
export const PxEdit: React.FC<IconComponentProps> = (props) => <PixelIcon name="edit" {...props} />;
export const PxEye: React.FC<IconComponentProps> = (props) => <PixelIcon name="eye" {...props} />;
export const PxSave: React.FC<IconComponentProps> = (props) => <PixelIcon name="save" {...props} />;
export const PxArchive: React.FC<IconComponentProps> = (props) => <PixelIcon name="archive" {...props} />;
export const PxLayout: React.FC<IconComponentProps> = (props) => <PixelIcon name="layout" {...props} />;
export const PxGroup: React.FC<IconComponentProps> = (props) => <PixelIcon name="group" {...props} />;
export const PxBook: React.FC<IconComponentProps> = (props) => <PixelIcon name="book" {...props} />;
export const PxAddGrid: React.FC<IconComponentProps> = (props) => <PixelIcon name="add-grid" {...props} />;
export const PxKey: React.FC<IconComponentProps> = (props) => <PixelIcon name="key" {...props} />;
export const PxScale: React.FC<IconComponentProps> = (props) => <PixelIcon name="scale" {...props} />;
export const PxScaleDown: React.FC<IconComponentProps> = (props) => <PixelIcon name="scale-down" {...props} />;
export const PxDrag: React.FC<IconComponentProps> = (props) => <PixelIcon name="drag" {...props} />;
export const PxMenu: React.FC<IconComponentProps> = (props) => <PixelIcon name="menu" {...props} />;
export const PxCursor: React.FC<IconComponentProps> = (props) => <PixelIcon name="cursor" {...props} />;
export const PxMove: React.FC<IconComponentProps> = (props) => <PixelIcon name="move" {...props} />;
export const PxPencil: React.FC<IconComponentProps> = (props) => <PixelIcon name="pencil" {...props} />;
export const PxDrop: React.FC<IconComponentProps> = (props) => <PixelIcon name="drop" {...props} />;
export const PxPipette: React.FC<IconComponentProps> = (props) => <PixelIcon name="pipette" {...props} />;
export const PxEraser: React.FC<IconComponentProps> = (props) => <PixelIcon name="eraser" {...props} />;

export default PixelIcon;

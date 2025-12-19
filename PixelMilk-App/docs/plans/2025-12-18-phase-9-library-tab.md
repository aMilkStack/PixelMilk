# Phase 9: Library Tab

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Asset management with search, filtering, tagging, and bulk export.

**Architecture:** Library tab showing all stored assets with grid view, filters, and export modal.

**Prerequisites:** Phase 8 complete

---

## Core Concepts

### Asset Organisation
Assets organised by:
- Type (Character, Tile, Object, Texture)
- Tags (user-defined)
- Date created/modified
- Name search

### Bulk Operations
Select multiple assets for:
- Bulk export
- Bulk delete
- Bulk tag assignment
- Style transfer (apply one asset's palette to others)

### Export Formats
Export individual or bulk:
- PNG (with transparency)
- Sprite sheet (configurable layout)
- Asset bundle (ZIP with metadata)
- Game engine format (Godot, Unity, RPG Maker)

---

## Tasks Overview

### Task 9.1: Create Library Store
```typescript
interface LibraryState {
  assets: Asset[];
  selectedIds: Set<string>;
  filterType: AssetType | 'all';
  filterTags: string[];
  searchQuery: string;
  sortBy: 'name' | 'created' | 'updated' | 'type';
  sortOrder: 'asc' | 'desc';
  viewMode: 'grid' | 'list';
  
  loadAssets: () => Promise<void>;
  selectAsset: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  deleteSelected: () => Promise<void>;
  tagSelected: (tag: string) => Promise<void>;
}
```

### Task 9.2: Create Asset Grid Component
```tsx
// Thumbnail grid with selection
interface AssetGridProps {
  assets: Asset[];
  selectedIds: Set<string>;
  onSelect: (id: string, multi: boolean) => void;
  onDoubleClick: (id: string) => void;
}
```

### Task 9.3: Create Filter Panel Component
```tsx
// Type filter, tag filter, search box
interface FilterPanelProps {
  filterType: AssetType | 'all';
  filterTags: string[];
  searchQuery: string;
  availableTags: string[];
  onFilterChange: (filters: FilterState) => void;
}
```

### Task 9.4: Create Asset Detail Modal
Shows full asset details when double-clicked:
- Large preview
- All sprites (if multi-direction)
- Identity document (if character)
- Edit tags
- Delete button
- Export button

### Task 9.5: Create Export Modal
```tsx
interface ExportModalProps {
  assets: Asset[];
  onExport: (options: ExportOptions) => void;
  onClose: () => void;
}

interface ExportOptions {
  format: 'png' | 'sheet' | 'bundle' | 'godot' | 'unity';
  layout?: 'horizontal' | 'grid';
  includeMetadata: boolean;
  scale: 1 | 2 | 4;
}
```

### Task 9.6: Create Bulk Actions Bar
Appears when assets selected:
```
┌─────────────────────────────────────────────────────────────┐
│ 5 assets selected    [Export] [Tag] [Delete] [Clear]        │
└─────────────────────────────────────────────────────────────┘
```

### Task 9.7: Create Library Tab Layout
```
┌─────────────────────────────────────────────────────────────┐
│ [Search 🔍] [Type ▾] [Tags ▾] [Sort ▾] [View: Grid/List]    │
├─────────────────────────────────────────────────────────────┤
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐           │
│ │     │ │     │ │     │ │     │ │     │ │     │           │
│ │ 🧙  │ │ 🗡️  │ │ 🌳  │ │ 🧱  │ │ 🔮  │ │ 🏠  │           │
│ │     │ │     │ │     │ │     │ │     │ │     │           │
│ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘           │
│ Knight   Sword   Tree    Stone   Potion  House             │
│                                                             │
│ ┌─────┐ ┌─────┐ ┌─────┐ ...                                │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ [Bulk Actions Bar - when selected]                          │
└─────────────────────────────────────────────────────────────┘
```

---

## Export Implementation

### PNG Export
```typescript
function exportAsPng(sprite: SpriteData, scale: number): Blob {
  const canvas = document.createElement('canvas');
  canvas.width = sprite.width * scale;
  canvas.height = sprite.height * scale;
  const ctx = canvas.getContext('2d')!;
  
  // Disable smoothing for crisp pixels
  ctx.imageSmoothingEnabled = false;
  
  // Draw pixels at scale
  sprite.pixels.forEach((colour, i) => {
    if (colour !== 'transparent') {
      const x = (i % sprite.width) * scale;
      const y = Math.floor(i / sprite.width) * scale;
      ctx.fillStyle = colour;
      ctx.fillRect(x, y, scale, scale);
    }
  });
  
  return new Promise((resolve) => {
    canvas.toBlob(resolve, 'image/png');
  });
}
```

### Bundle Export (ZIP)
Uses JSZip library:
```typescript
async function exportAsBundle(assets: Asset[]): Promise<Blob> {
  const zip = new JSZip();
  
  for (const asset of assets) {
    const folder = zip.folder(asset.name);
    
    // Add each sprite
    for (const sprite of asset.sprites) {
      const png = await exportAsPng(sprite, 1);
      folder.file(`${sprite.direction || 'main'}.png`, png);
    }
    
    // Add metadata
    if (asset.identity) {
      folder.file('identity.json', JSON.stringify(asset.identity, null, 2));
    }
  }
  
  return zip.generateAsync({ type: 'blob' });
}
```

---

## Phase 9 Complete

Deliverables:
- ✅ Library store with filtering/sorting
- ✅ Asset grid with selection
- ✅ Filter panel
- ✅ Asset detail modal
- ✅ Export modal with format options
- ✅ Bulk actions bar
- ✅ PNG, sprite sheet, bundle, and game engine exports

**Next Phase:** AI Guidance System

# Character Tab UX Redesign

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the Character tab from a cluttered, confusing interface into a premium, linear workflow that assembles itself as the user progresses.

**Architecture:** Page-by-page wizard flow where each stage is centered, then slots into final position. Canvas workspace is fully flexible with movable/minimizable panels.

**Tech Stack:** React, Zustand, CSS transitions for assembly animations, existing component library

**Design References:** Hearts Pub design system (see `Archives/PixelMilk-Archive/Legacy/Inspiration/`)

---

## Core UX Principles

1. **Function first, charm after** - Premium and endearing, not cliche gamification
2. **Progressive assembly** - Interface builds itself as user progresses
3. **User controls workspace** - Movable, minimizable panels on canvas page
4. **Show controls when relevant** - No premature UI elements
5. **Two-level navigation** - Top nav (asset types) separate from inner breadcrumb (workflow stages)

---

## Navigation Structure

### Top Nav (Always Accessible)
```
CHARACTER | TILE | OBJECT | TEXTURE | COMPOSE | LIBRARY
```
- Different asset types/modes
- User can click Library at any point
- Unchanged from current

### Inner Breadcrumb (Within Character Tab)
```
Configure → Describe → Identity → Canvas
```
- Linear progression within character creation
- Stages unlock as completed
- Can jump back to completed stages
- Visual indicator of current stage (red/coral highlight)

---

## The Assembly Flow

### Stage 1: Configure (Centered)
**Content:**
- Canvas size (32, 64, 128, 256)
- Outline style (black, colored, selective, lineless)
- Shading style (flat, basic, detailed)
- Detail level (low, medium, high)
- View type (standard, isometric)
- Palette selection

**Behaviour:**
- Appears centered on page, full focus
- "Next" button (red CTA) to proceed
- On complete: slides/slots to the LEFT

### Stage 2: Describe (Centered)
**Content:**
- Character description textarea
- Reference image upload (optional)
- "Optimize" button (uses style context from Stage 1)
- Character counter

**Behaviour:**
- Appears centered after Configure slots away
- Prompt optimization incorporates style settings (no more "128x128 in prompt but 256 selected" mismatch)
- "Generate Identity" button (red CTA)
- On complete: slots to the LEFT (below/tabbed with Configure)

### Stage 3: Identity (Centered)
**Content:**
- Generated identity card (full size, hero treatment)
- Physical description, colour palette, distinctive features
- "Regenerate" option if not happy
- "Generate Sprite" button (red CTA)

**Behaviour:**
- Appears centered, shows generation loading state
- On complete: slots to INFO BUTTON (top-right corner)
- Canvas page loads, sprite generation begins automatically

### Stage 4: Canvas (Full Page)
**Content:**
- Full-page canvas as hero element
- All controls appear contextually (see Workspace Layout below)

**Behaviour:**
- Canvas takes 100% of available space by default
- User can customize workspace layout

---

## Canvas Workspace Layout

### Canvas (Hero)
- Full page by default
- Zoom controls (compact, corner position)
- Direction indicator with rotate buttons: `[<] S [>]`
- Background toggle only appears AFTER sprite exists

### Identity Panel
- **Trigger:** Info button in top-right corner
- **Behaviour:** Slides out as overlay from right
- **Dismissal:** Click button again, click outside, or Escape
- NOT a permanent panel - on-demand reference

### Request Changes Chat
- **Default:** Docked to left side
- **Movable:** Can dock to left, right, or bottom
- **Minimizable:** Collapse to just an icon/tab
- **Result:** User can have 100% canvas if desired

### Tools Palette (Edit Mode)
- **Style:** Photoshop-style floating palette
- **Behaviour:** Appears when entering edit mode
- **Draggable:** Position anywhere on canvas
- **Dockable:** Can snap to edges

### Controls Visibility
- Direction rotate buttons: Only after sprite exists
- Background toggle: Only after sprite exists
- Download button: Only after sprite exists
- Edit mode toggle: Only after sprite exists

---

## Visual Design System

### Colour Hierarchy
| Colour | Hex | Usage |
|--------|-----|-------|
| Red/Coral | `#f04e4e` | CTAs, selected states, active elements |
| Mint | `#8bd0ba` | Base UI, text, borders, default states |
| Beige | `#d8c8b8` | Secondary text, labels, subtle accents |
| Dark Green | `#021a1a` | Primary background |
| Mid Green | `#0d2b2b` | Panel backgrounds |
| Light Green | `#043636` | Borders, dividers |

### Panel Framing
- **Active/focused panel:** Corner bracket framing
  ```
  +-              -+

     Panel Content

  +-              -+
  ```
- **Inactive panels:** Simple 1px borders

### Typography
- **Headings:** Playfair Display (serif)
- **Body/UI:** VT323 monospace
- **Uppercase labels** with letter-spacing for section headers

### Buttons
- **Primary CTA:** Red background, dark text
- **Secondary:** Mint border, transparent background
- **Ghost:** No border, mint text

### Animation Principles
- Smooth CSS transitions for assembly (300-400ms)
- Subtle easing (ease-out for slots)
- No bouncy/playful animations - premium and clean
- Loading states: pixel grid pulse + rotating messages (existing style)

---

## Direction Controls

### Current (Remove)
```
    [N]
[W]     [E]
    [S]
```
Creates dead space, spatial layout unnecessary.

### New Design
```
[<]  S  [>]
```
- Current direction displayed in center
- Left arrow: rotate counter-clockwise (S → E → N → W)
- Right arrow: rotate clockwise (S → W → N → E)
- Compact, inline, no wasted space

---

## Palette Player (Decoupled)

### Current Problem
- Player only plays selected palette
- Choosing from player changes working palette
- Can't browse while keeping selection

### New Behaviour
- **Standalone jukebox:** Browse and play ANY palette
- **Selection is separate:** Clicking play doesn't change working palette
- **Explicit selection:** Separate "Use this palette" action
- **Position:** Floating mini-player, can minimize

---

## Save System

### Available Throughout
- Save should be accessible at ANY stage, not just end
- Save options:
  - **Save prompt/description** - Reusable text
  - **Save style preset** - Configuration settings
  - **Save to library** - Complete or partial asset

### Quick Save
- Keyboard shortcut (Ctrl+S)
- Auto-saves work-in-progress to local storage

---

## Fixes Addressed

1. **Style before description** - No more prompt saying "128x128" when user selected 256
2. **No premature controls** - Canvas controls only appear after sprite exists
3. **Clear workflow** - Linear stages, one focus at a time
4. **Flexible workspace** - User controls panel positions
5. **Direction picker** - Compact rotate buttons, no dead space
6. **Palette player** - Decoupled from selection, true jukebox
7. **Save anywhere** - Not locked to end of workflow
8. **Red accent usage** - CTAs and selected states, not forgotten
9. **Panel focus** - Corner brackets indicate active panel

---

## Implementation Priority

### Phase 1: Core Flow
1. Stage breadcrumb navigation component
2. Configure page
3. Describe page
4. Identity page
5. Basic assembly animations

### Phase 2: Canvas Workspace
1. Full-page canvas layout
2. Movable/minimizable chat dock
3. Slide-out identity panel
4. Floating tools palette

### Phase 3: Visual Polish
1. Red accent throughout CTAs/selected
2. Corner bracket framing
3. Direction rotate buttons
4. Assembly animations refinement

### Phase 4: Flexibility
1. Save system (prompts, presets, assets)
2. Palette player decoupling
3. Workspace layout persistence

---

## Success Criteria

- New user can understand workflow without explanation
- "How do I use this?" question eliminated
- Canvas workspace feels premium and flexible
- Red accent creates clear visual hierarchy
- No dead space, no premature controls
- Worth the price tag

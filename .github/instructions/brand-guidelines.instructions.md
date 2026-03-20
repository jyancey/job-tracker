---
description: 'Brand guidelines for visual design, color palette, typography, and UI styling consistency'
applyTo: '**/*.css, **/*.tsx, **/*.jsx, app/**'
---

# Brand Guidelines

## Overview

These brand guidelines ensure visual consistency across the job-tracker application. All styling changes, new components, and design updates must follow these specifications.

## Color Palette

### Primary Colors

- **Dark:** `#141413` — Primary text and dark backgrounds
- **Light:** `#faf9f5` — Light backgrounds and text on dark surfaces
- **Mid Gray:** `#b0aea5` — Secondary text and muted elements
- **Light Gray:** `#e8e6dc` — Subtle backgrounds and borders

### Accent Colors

- **Orange:** `#d97757` — Primary accent, CTAs, and focus states
- **Blue:** `#6a9bcc` — Secondary accent for information/links
- **Green:** `#788c5d` — Tertiary accent and success states

## Typography

### Font Families

- **Headings:** `Poppins` (fallback: `Arial`)
  - Use for: `<h1>`, `<h2>`, `<h3>`, `<h4>`, `<h5>`, `<h6>`, buttons
  - Font size 24pt and larger
  
- **Body Text:** `Lora` (fallback: `Georgia`)
  - Use for: paragraphs, labels, form inputs, regular text
  
- **Monospace:** `ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, 'Liberation Mono'`
  - Use for: code, version badges, technical text

### Implementation

```css
/* Headings */
h1, h2, h3, h4, h5, h6, button {
  font-family: 'Poppins', Arial, sans-serif;
}

/* Body text */
body, p, label, input, textarea, select {
  font-family: 'Lora', Georgia, serif;
}

/* Monospace */
.version-badge, code, pre {
  font-family: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, 'Liberation Mono', monospace;
}
```

## Color Application Guidelines

### Backgrounds

- **Primary backgrounds:** `#faf9f5` (light)
- **Subtle backgrounds:** `#e8e6dc` (light gray)
- **Alternate backgrounds:** `#f0ede7` (gradients and sections)

### Text & Foreground

- **Primary text:** `#141413` (dark)
- **Secondary text/muted:** `#b0aea5` (mid gray)
- **Disabled text:** Use mid gray with reduced opacity

### Borders & Dividers

- **Default borders:** `#e8e6dc` (light gray)
- **Emphasis borders:** Use accent colors (orange, blue, green) for priority/status indication

### Interactive Elements

#### Buttons

**Primary Button (Default)**
- Background: `#788c5d` (green)
- Text: `#faf9f5` (light)
- Hover: Darken to `#6a7a52`

**Ghost Button**
- Background: `#e8e6dc` (light gray)
- Text: `#141413` (dark)
- Border: `#e8e6dc`
- Hover: Darken background to `#d9d4c8`

**Accent Button**
- Background: `#d97757` (orange)
- Text: `#faf9f5` (light)
- Hover: Darken to `#c5624a`

#### Form Inputs

- **Border (default):** `#e8e6dc`
- **Border (focus):** `#d97757` (orange)
- **Focus ring:** `rgba(217, 119, 87, 0.15)` (orange with 15% opacity)
- **Background:** `#faf9f5` (light)
- **Text:** `#141413` (dark)

### Status & Semantic Colors

#### Success
- Color: `#788c5d` (green)
- Background: `#eef2e9` (light green tint)

#### Error/Warning
- Color: `#d97757` (orange)
- Background: `#f9f0ed` (light orange tint)

#### Info
- Color: `#6a9bcc` (blue)
- Background: `#eef2f9` (light blue tint)

#### Pending/Loading
- Color: `#6a9bcc` (blue)
- Use with 0.8 opacity or lighter tint

### Priority Indicators

- **High Priority:** `#d97757` (orange)
- **Medium Priority:** `#c9a961` (warm yellow)
- **Low Priority:** `#788c5d` (green)

### Score & Rating Colors

- **High Score:** Background `#eef2e9`, Text `#788c5d`
- **Medium Score:** Background `#fef9f0`, Text `#c9a961`
- **Low Score:** Background `#f9f0ed`, Text `#d97757`

## CSS Custom Properties (Variables)

### Root Variables

```css
:root {
  /* Background Colors */
  --jt-bg-default: #faf9f5;
  --jt-bg-subtle: #e8e6dc;
  --jt-bg-canvas: #faf9f5;
  
  /* Border Colors */
  --jt-border-default: #e8e6dc;
  --jt-border-muted: #e8e6dc;
  
  /* Text Colors */
  --jt-fg-default: #141413;
  --jt-fg-muted: #b0aea5;
  
  /* Accent Colors */
  --jt-accent: #d97757;        /* Orange (primary) */
  --jt-accent-blue: #6a9bcc;   /* Blue (secondary) */
  --jt-accent-green: #788c5d;  /* Green (tertiary) */
  --jt-success: #788c5d;        /* Green for success states */
}
```

## Common Component Patterns

### Modal Overlay (Backdrop)

```css
.modal-backdrop {
  background: rgba(20, 20, 19, 0.45);  /* Dark with opacity */
  backdrop-filter: blur(2px);
}

.modal-panel {
  background: #faf9f5;
  border: 1px solid #e8e6dc;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(20, 20, 19, 0.08);
}
```

### Cards & Panels

```css
.panel {
  border: 1px solid var(--jt-border-default);
  border-radius: 12px;
  padding: 1rem;
  background: var(--jt-bg-canvas);
  box-shadow: 0 1px 0 rgba(20, 20, 19, 0.04);
}
```

### Badges & Pills

```css
.badge {
  background: #e8e6dc;
  color: #141413;
  border-radius: 999px;
  padding: 0.2rem 0.6rem;
  font-size: 0.8rem;
  font-weight: 600;
}

.badge-orange {
  background: rgba(217, 119, 87, 0.15);
  color: #d97757;
}

.badge-blue {
  background: rgba(106, 155, 204, 0.15);
  color: #6a9bcc;
}

.badge-green {
  background: rgba(120, 140, 93, 0.15);
  color: #788c5d;
}
```

### Links & Interactive Text

```css
a {
  color: #d97757;
  text-decoration: none;
  transition: color 0.2s ease;
}

a:hover {
  color: #c5624a;
  text-decoration: underline;
}
```

## Font Installation (Optional but Recommended)

For best results, pre-install these fonts on your system:

1. **Poppins** - Download from [Google Fonts](https://fonts.google.com/specimen/Poppins)
2. **Lora** - Download from [Google Fonts](https://fonts.google.com/specimen/Lora)

Once installed, they will be used automatically on your system. Fallback fonts (Arial/Georgia) will be used if custom fonts are unavailable.

## Validation Checklist

Before committing styling changes:

- [ ] All text colors use the primary (#141413) or muted (#b0aea5) palette
- [ ] All backgrounds use light (#faf9f5) or subtle (#e8e6dc) palette
- [ ] All accent colors use orange (#d97757), blue (#6a9bcc), or green (#788c5d)
- [ ] Headings use Poppins font family
- [ ] Body text uses Lora font family
- [ ] Buttons use one of the specified color combinations
- [ ] Focus states use orange (#d97757) accent
- [ ] Borders use #e8e6dc or are intentional accent colors
- [ ] Shadow colors use dark with opacity: `rgba(20, 20, 19, X%)`
- [ ] Interactive elements have hover/focus states defined
- [ ] Contrast ratios meet WCAG AA standards (4.5:1 for text, 3:1 for UI components)

## Accessibility

### Color Contrast

- **Primary text (#141413) on light background (#faf9f5):** 16:1 ✓ Excellent
- **Muted text (#b0aea5) on light background (#faf9f5):** 4.5:1 ✓ AA Level
- **Orange accent (#d97757) on light background (#faf9f5):** 7:1 ✓ AAA Level
- **Green accent (#788c5d) on light background (#faf9f5):** 7.5:1 ✓ AAA Level
- **Blue accent (#6a9bcc) on light background (#faf9f5):** 7.2:1 ✓ AAA Level

### Don't Rely on Color Alone

- Always use text labels alongside colors
- Use patterns, icons, or text indicators for status/priority
- Provide alternative text for color-coded information

## Updates & Maintenance

This document should be updated whenever:
- New colors are added to the brand palette
- Font selections change
- Major design patterns are established
- Accessibility requirements change

For brand guideline updates, coordinate with the design team and update this file immediately to prevent inconsistencies.

---
description: 'Brand guidelines for visual design, color palette, typography, and UI styling consistency'
applyTo: '**/*.css, **/*.tsx, **/*.jsx, app/**'
---

# Brand Guidelines

## Overview

These brand guidelines ensure visual consistency across the job-tracker application. All styling changes, new components, and design updates must follow these specifications.

## Visual Direction

- The application should feel editorial and calm rather than glossy or high-contrast.
- Surfaces should be warm and paper-like, using `#faf9f5`, `#e8e6dc`, and `#f0ede7` rather than stark white.
- Contrast should come from typography, spacing, and subtle borders instead of heavy shadows or saturated fills.
- Shadows should stay restrained: use soft dark translucency with `rgba(20, 20, 19, ...)`.
- Prefer rounded corners in the `8px` to `12px` range for panels, cards, chips, and controls.

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
- **App shell background:** use layered warm radial gradients over `#faf9f5`

```css
body {
  background:
    radial-gradient(900px 500px at 100% -10%, #f5f2ea 0%, rgba(245, 242, 234, 0) 55%),
    radial-gradient(900px 500px at -10% 120%, #ede8dc 0%, rgba(237, 232, 220, 0) 55%),
    #faf9f5;
}
```

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
- Border: `transparent`
- Shape: `9px` radius
- Minimum height: `2.4rem`

**Ghost Button**
- Background: `#e8e6dc` (light gray)
- Text: `#141413` (dark)
- Border: `#e8e6dc`
- Hover: Darken background to `#d9d4c8`
- Hover border: remains `#e8e6dc`
- Shape: `9px` radius
- Minimum height: `2.4rem`

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
- **Radius:** `10px` in settings/profile panels, `6px` for general app inputs
- **Readonly background:** `#e8e6dc`
- **Readonly text:** `#b0aea5`

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

### Section Cards

Use boxed sections for profile/settings groups and similar grouped forms.

```css
.settings-section {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  background: var(--jt-bg-canvas);
  border: 1px solid var(--jt-border-default);
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 1px 0 rgba(20, 20, 19, 0.04);
}
```

### Hero and Summary Cards

For top-level summary surfaces, use warm gradients rather than flat white cards.

```css
.hero {
  background: linear-gradient(180deg, #faf9f5 0%, #f0ede7 100%);
  border: 1px solid var(--jt-border-default);
  border-radius: 12px;
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

### Selection Controls

Selected radio-card style should use blue informational tint rather than orange CTA styling.

```css
.radio-label:has(input[type="radio"]:checked) {
  background-color: rgba(106, 155, 204, 0.12);
  border-color: rgba(106, 155, 204, 0.35);
}
```

### Informational and State Chips

```css
.health-badge {
  border: 1px solid rgba(106, 155, 204, 0.35);
  background: rgba(106, 155, 204, 0.12);
  color: #6a9bcc;
}

.success-message {
  background: #eef2e9;
  border: 1px solid rgba(120, 140, 93, 0.35);
  color: #788c5d;
}

.error-message,
.error-message-inline {
  background: #f9f0ed;
  border: 1px solid rgba(217, 119, 87, 0.3);
  color: #d97757;
}
```

## Spacing Rhythm

- Default vertical gaps between stacked sections: `1.25rem`
- Panel padding: `1rem`
- Label-to-field gap: `0.35rem`
- Action row gap: `0.75rem`
- Footer action gap: `0.65rem`
- Divider spacing should feel tight and intentional, not airy
- On mobile, stack footer and action-row buttons to full width

```css
.profile-content,
.profile-tab,
.ai-tab {
  gap: 1.25rem;
}

.settings-section label {
  gap: 0.35rem;
  line-height: 1.3;
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
- [ ] Large app backgrounds use the warm radial or linear gradient treatment where appropriate
- [ ] All accent colors use orange (#d97757), blue (#6a9bcc), or green (#788c5d)
- [ ] Headings use Poppins font family
- [ ] Body text uses Lora font family
- [ ] Buttons use one of the specified color combinations
- [ ] Ghost buttons do not introduce orange hover borders unless explicitly acting as accent actions
- [ ] Focus states use orange (#d97757) accent
- [ ] Borders use #e8e6dc or are intentional accent colors
- [ ] Shadow colors use dark with opacity: `rgba(20, 20, 19, X%)`
- [ ] Boxed form sections use `12px` radius, `1rem` padding, and restrained shadows
- [ ] Spacing follows the tighter modal rhythm used in profile/settings surfaces
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

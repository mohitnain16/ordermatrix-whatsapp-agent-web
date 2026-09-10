# Ordermatrix Design System — MASTER

> **LOGIC:** When building a specific page, first check `design-system/ordermatrix/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.
>
> **CROSS-CHECKED AGAINST:** minimalist-ui protocol + high-end-visual-design protocol.
> Generated tokens that were decorative, trending, or violated either protocol have been
> overridden here. Do not re-introduce glassmorphism, transform hovers, or heavy shadows.

---

**Project:** Ordermatrix (shared across: Ordermatrix Core, Whatsapp Agent, Chalti OMS, Chalti Storefront)
**Style Direction:** Clean Minimal B2B SaaS — Linear / Stripe / Notion aesthetic
**Generated base:** 2026-09-10 | **Audited & overridden:** 2026-09-10
**Category:** B2B SaaS Dashboard — order management, revenue data, merchant-facing
**Design Dials:** Variance 3/10 (Centered / Minimal) | Density 7/10 (Standard)

---

## 1. Color Palette

### Semantic roles

| Role | Hex | CSS Variable | Contrast on bg |
|------|-----|--------------|---------------|
| Background | `#F8F9FB` | `--color-bg` | — |
| Surface (card) | `#FFFFFF` | `--color-surface` | — |
| Surface-2 (alt row/section) | `#F1F4F9` | `--color-surface-2` | — |
| Surface-3 (hovered row, tooltip bg) | `#E8EDF5` | `--color-surface-3` | — |
| Text primary | `#0F172A` | `--color-text` | 17.9:1 on bg ✅ |
| Text secondary | `#475569` | `--color-text-2` | 6.8:1 on bg ✅ |
| Text muted | `#94A3B8` | `--color-text-3` | 3.5:1 on bg (use at ≥14px, non-critical labels only) |
| Border | `#E2E8F0` | `--color-border` | — |
| Border-strong | `#CBD5E1` | `--color-border-2` | — (hover/focus context) |
| **Primary (action)** | `#2563EB` | `--color-primary` | 5.1:1 white on blue ✅ |
| On Primary | `#FFFFFF` | `--color-on-primary` | — |
| Primary hover | `#1D4ED8` | `--color-primary-hover` | — |
| Primary soft | `#EFF6FF` | `--color-primary-soft` | — |
| **Brand accent** (Ordermatrix identity) | `#E8593A` | `--color-accent` | used as foreground on light bg only |
| Accent soft | `#FEF0EC` | `--color-accent-soft` | — |
| **Destructive** | `#DC2626` | `--color-destructive` | 5.2:1 on white ✅ |
| Destructive soft | `#FEF2F2` | `--color-destructive-soft` | — |
| On Destructive | `#FFFFFF` | `--color-on-destructive` | — |
| **Success** | `#16A34A` | `--color-success` | 5.5:1 on white ✅ |
| Success soft | `#F0FDF4` | `--color-success-soft` | — |
| **Warning** | `#D97706` | `--color-warning` | 4.6:1 on white ✅ |
| Warning soft | `#FFFBEB` | `--color-warning-soft` | — |
| Focus ring | `#2563EB` | `--color-ring` | — |

**Color usage rules:**
- `--color-primary` (#2563EB) — all interactive elements: buttons, links, active nav, checkboxes, progress
- `--color-accent` (#E8593A) — brand identity only: logo, key brand moments, product-category badges. **Never** use as a button fill or anywhere text must sit on top of it as a background (fails WCAG at small sizes)
- `--color-text-3` — decorative labels, placeholder text, timestamps only — never for essential information

---

## 2. Typography

### Font stack

| Role | Family | Fallback |
|------|--------|---------|
| UI / Body | `'Plus Jakarta Sans'` | `'Helvetica Neue', system-ui, sans-serif` |
| Monospace (numbers, codes, phone, IDs) | `'Geist Mono'` | `'SF Mono', 'Fira Code', monospace` |

**No separate heading font.** Use Plus Jakarta Sans at higher weights (600–700) and tighter tracking for headings — same family, different treatment. This is the Linear/Stripe approach.

### CSS import

```css
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap');
/* Geist Mono — load from CDN or self-host */
@import url('https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500&display=swap');
```

### Type scale (base 14px — dashboard standard)

| Token | Size | Weight | Line-height | Usage |
|-------|------|--------|-------------|-------|
| `--text-xs` | 11px | 500–600 | 1.4 | Labels, caps, badge text |
| `--text-sm` | 12px | 400–500 | 1.5 | Secondary body, timestamps |
| `--text-base` | 14px | 400 | 1.6 | Primary body, form inputs |
| `--text-md` | 16px | 500–600 | 1.4 | Subheadings, card titles |
| `--text-lg` | 18px | 600 | 1.3 | Page section headings |
| `--text-xl` | 22px | 700 | 1.2 | Page titles |
| `--text-2xl` | 28px | 700 | 1.1 | Hero numbers / KPIs |

**Letter-spacing:**
- Labels/caps (11–12px): `letter-spacing: 0.05em`
- Headings (18px+): `letter-spacing: -0.01em` to `-0.02em`
- Body: `0` (default)

---

## 3. Spacing Scale (Density 7/10 — Standard)

| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | `4px` | Icon gap, tight inline |
| `--space-2` | `8px` | Between related elements |
| `--space-3` | `12px` | Compact padding (table cells, compact form fields) |
| `--space-4` | `16px` | Standard padding (cards, inputs) |
| `--space-5` | `20px` | Section internal padding |
| `--space-6` | `24px` | Section gaps |
| `--space-8` | `32px` | Between major sections |
| `--space-12` | `48px` | Page-level vertical rhythm |

---

## 4. Elevation (Shadows)

**Rule from minimalist-ui:** Shadows must be ultra-diffuse, opacity strictly <0.08. No Tailwind default heavy shadows.

| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-xs` | `0 1px 2px rgba(15, 23, 42, 0.04)` | Subtle lift — buttons, tags |
| `--shadow-sm` | `0 1px 4px rgba(15, 23, 42, 0.05)` | Cards on hover |
| `--shadow-md` | `0 2px 10px rgba(15, 23, 42, 0.06)` | Dropdowns, popovers |
| `--shadow-lg` | `0 4px 20px rgba(15, 23, 42, 0.08)` | Modals, slide-out panels |

**Default state:** cards use `border: 1px solid var(--color-border)` only — no shadow. Shadow appears on hover or for floating elements (dropdown, modal). This is the Linear/Notion approach.

---

## 5. Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | `4px` | Tags, badges, small buttons |
| `--radius` | `6px` | Standard — inputs, buttons |
| `--radius-md` | `8px` | Cards, panels |
| `--radius-lg` | `12px` | Modals, large cards |
| `--radius-xl` | `16px` | Sheet-level containers |

---

## 6. Component Specs

### Buttons

```css
/* Primary — action colour */
.btn-primary {
  background: var(--color-primary);   /* #2563EB */
  color: var(--color-on-primary);     /* #FFFFFF — 5.1:1 ✅ */
  padding: 8px 16px;
  border-radius: var(--radius);       /* 6px */
  font-size: 13px;
  font-weight: 600;
  border: 1px solid transparent;
  cursor: pointer;
  transition: background 150ms ease, opacity 150ms ease;
}
.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-hover); /* #1D4ED8 — NO transform */
}
.btn-primary:active:not(:disabled) {
  transform: scale(0.98); /* subtle press — no layout shift */
}
.btn-primary:focus-visible {
  outline: 2px solid var(--color-ring);
  outline-offset: 2px;
}

/* Ghost / Secondary */
.btn-ghost {
  background: transparent;
  color: var(--color-text-2);
  border: 1px solid var(--color-border);
  padding: 7px 14px;
  border-radius: var(--radius);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 150ms ease, border-color 150ms ease, color 150ms ease;
}
.btn-ghost:hover:not(:disabled) {
  background: var(--color-surface-2);
  border-color: var(--color-border-2);
  color: var(--color-text);
}

/* Destructive */
.btn-destructive {
  background: var(--color-destructive-soft);
  color: var(--color-destructive);
  border: 1px solid rgba(220, 38, 38, 0.2);
  padding: 7px 14px;
  border-radius: var(--radius);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 150ms ease;
}
.btn-destructive:hover:not(:disabled) {
  background: rgba(220, 38, 38, 0.15);
}
```

### Cards

```css
/* Default state: border only, no shadow */
.card {
  background: var(--color-surface);   /* #FFFFFF */
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);    /* 8px */
  padding: 16px;
  transition: border-color 150ms ease, box-shadow 150ms ease;
}
/* Hover: shadow + stronger border. NO translateY. */
.card:hover {
  border-color: var(--color-border-2);
  box-shadow: var(--shadow-sm);
}
```

### Inputs

```css
.input {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);       /* 6px */
  padding: 7px 10px;
  font-size: 14px;
  color: var(--color-text);
  font-family: inherit;
  width: 100%;
  outline: none;
  transition: border-color 150ms ease, box-shadow 150ms ease;
}
.input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}
.input::placeholder {
  color: var(--color-text-3);
}
```

### Modals / Overlays

```css
/* NO backdrop-filter. NO blur. */
.modal-overlay {
  background: rgba(15, 23, 42, 0.45); /* dark translucent, no blur */
  position: fixed;
  inset: 0;
}
.modal {
  background: var(--color-surface);   /* solid white, not glass */
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);    /* 12px */
  padding: 24px;
  box-shadow: var(--shadow-lg);       /* max 0.08 opacity */
  max-width: 500px;
  width: 90%;
}
```

### Badges / Tags

```css
.badge {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  padding: 2px 8px;
  border-radius: var(--radius-sm);   /* 4px — NOT pill for status badges */
  white-space: nowrap;
}
/* Semantic variants use soft colour pairs: */
.badge-primary    { background: var(--color-primary-soft); color: var(--color-primary); }
.badge-success    { background: var(--color-success-soft); color: var(--color-success); }
.badge-warning    { background: var(--color-warning-soft); color: var(--color-warning); }
.badge-danger     { background: var(--color-destructive-soft); color: var(--color-destructive); }
.badge-neutral    { background: var(--color-surface-2); color: var(--color-text-2); border: 1px solid var(--color-border); }
```

### Navigation (sidebar)

```css
.nav-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: var(--radius);
  color: var(--color-text-2);
  font-size: 13px;
  font-weight: 500;
  text-decoration: none;
  transition: background 120ms ease, color 120ms ease;
}
.nav-item:hover {
  background: var(--color-surface-2);
  color: var(--color-text);
}
.nav-item.active {
  background: var(--color-primary-soft);
  color: var(--color-primary);
  font-weight: 600;
}
```

### Focus Ring (global)

```css
:focus-visible {
  outline: 2px solid var(--color-ring); /* #2563EB */
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}
```

---

## 7. Motion

**Rule:** Dashboard-appropriate, not decorative. Use only `opacity` and `background/border-color` on hover. `transform: scale(0.98)` on `:active` only (press feedback). No `translateY` hover lifts.

| Context | Duration | Easing |
|---------|----------|--------|
| Hover (bg, border, color) | 120–150ms | `ease` |
| Modal / panel enter | 200–250ms | `cubic-bezier(0.16, 1, 0.3, 1)` |
| Modal / panel exit | 150–180ms | `ease-in` |
| List item stagger | 40ms per item | `ease` |
| Skeleton shimmer | 1.6s loop | `cubic-bezier(0.4, 0, 0.6, 1)` |

```css
/* prefers-reduced-motion — always include */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 8. Iconography

- **Library:** Phosphor Icons (already used across all Ordermatrix repos)
- **Weight:** `regular` for inactive states, `fill` for active/selected states
- **Size:** 16px standard UI, 18px when paired with text, 20px for section-level icons
- **Color:** Inherit from text (`currentColor`) — no decorative coloured icon backgrounds
- **Do NOT:** Add a coloured rounded-square bg behind icons. Use plain icons in context colour only.

---

## 9. Anti-Patterns — DO NOT USE

**Effects:**
- ❌ `backdrop-filter: blur(...)` — no glassmorphism, ever
- ❌ Neon glows, glow box-shadows, coloured outer glow
- ❌ Shadow opacity >0.08 (no Tailwind `shadow-md`/`shadow-lg`/`shadow-xl` defaults)
- ❌ `transform: translateY` or `scale` on `:hover` — layout-shifting hover forbidden
- ❌ Gradient backgrounds on surfaces or cards
- ❌ Dark mode as default — dashboard is light-first

**Typography:**
- ❌ Fonts: Inter, Roboto, Arial, Open Sans, Helvetica
- ❌ Body text below 12px
- ❌ Gray-on-gray text with <4.5:1 contrast

**Colour:**
- ❌ `--color-accent` (#E8593A) as a button fill or surface on which text must sit
- ❌ White text on `--color-accent` (fails WCAG at 3.4:1)
- ❌ Raw hex values in component CSS — always use design tokens

**Icons & Assets:**
- ❌ Emojis as icons
- ❌ Mixing icon libraries (Lucide + Heroicons + Phosphor in same product)
- ❌ Decorative coloured icon-background circles/squares

**Interaction:**
- ❌ Instant state changes (0ms) — always 120ms+ transition
- ❌ Focus ring removed without replacement

---

## 10. Pre-Delivery Checklist

Before shipping any UI:

- [ ] All text meets 4.5:1 contrast on its background
- [ ] `--color-accent` (#E8593A) is never used as a button background with overlaid text
- [ ] All interactive elements have `:focus-visible` rings (2px solid primary blue)
- [ ] All `outline: none` on inputs have replacement focus border + glow ring
- [ ] `cursor: pointer` on all clickable elements
- [ ] Hover states use only background/border/color transitions — no translateY
- [ ] No `backdrop-filter` or `blur` anywhere
- [ ] Shadows max at `rgba(15,23,42,0.08)`
- [ ] `prefers-reduced-motion` block present in global CSS
- [ ] Scroll-padding-top set for topbar height (WCAG 2.2 AA focus-not-obscured)
- [ ] All icons from Phosphor Icons library
- [ ] Page renders correctly at 375px, 768px, 1024px, 1440px
- [ ] No horizontal scroll on mobile

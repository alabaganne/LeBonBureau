# Design System — LeBonBureau

The visual and component language of the LeBonBureau storefront: an editorial,
warm-neutral e-commerce experience for ergonomic desks. This document is the
single source of truth for tokens, typography, components, and the conventions
that keep the UI consistent.

> **One rule above all:** never hardcode a colour, radius, shadow, or button
> style. Reference a CSS variable (token) and reach for an existing component
> before writing new markup.

---

## 1. Design principles

1. **White canvas, warm neutrals, one accent.** The page is mostly white and
   sand. A single deep-forest green (`--green`) carries every call to action,
   active state, and brand accent. Colour is a signal, not decoration.
2. **Editorial typography.** A serif display face (Fraunces) for headings paired
   with a tight grotesque (Inter Tight) for everything else. Headlines are large
   and confident; body copy is calm and readable.
3. **Soft, physical surfaces.** Generous radii (`14–22px`), barely-there borders
   (`--line`), and layered shadows give cards a light, liftable feel.
4. **Conversion without noise.** Trust signals, stock urgency, and the
   cash-on-delivery promise are surfaced where they matter (product, cart,
   checkout) but never clutter the canvas.
5. **One component, many uses.** Buttons, icons, cards, heroes, and chrome are
   each a single React component. Visual changes happen in one place.

---

## 2. Design tokens

All tokens live in [`app/globals.css`](app/globals.css) under `:root`. Use the
variable, never the literal value.

### Colour

| Token | Value | Use |
| --- | --- | --- |
| `--ink` | `#1b1b16` | Primary text, dark buttons, footer background |
| `--ink-soft` | `#55534a` | Secondary text, body copy |
| `--ink-faint` | `#8c8a80` | Captions, meta, disabled/struck-through |
| `--paper` | `#ffffff` | Page background |
| `--sand` | `#f6f4ee` | Section fills, cards, inputs-on-fill |
| `--sand-deep` | `#efece4` | Image placeholders, thumbnails |
| `--line` | `#e7e3d9` | Borders, dividers, hairlines |
| `--green` | `#1f5d4c` | **The accent** — CTAs, active states, brand dot |
| `--green-deep` | `#163f34` | Hover for green, text on soft-green |
| `--green-soft` | `#e7efe9` | Tinted backgrounds, focus rings, badges |
| `--clay` | `#c9603f` | Promo / sale / error signal only |

### Elevation, radius, layout

| Token | Value | Use |
| --- | --- | --- |
| `--shadow-card` | layered soft | Resting cards, floating chips |
| `--shadow-lift` | layered deeper | Hover / active elevation, toast |
| `--radius` | `14px` | Default cards, inputs, feature tiles |
| `--radius-lg` | `22px` | Hero visual, summary cards, large panels |
| `--maxw` | `1240px` | Page content width (via `.wrap`) |

### Typography tokens

| Token | Value |
| --- | --- |
| `--serif` | `"Fraunces", Georgia, serif` |
| `--sans` | `"Inter Tight", system-ui, sans-serif` |

---

## 3. Typography

Headings (`h1–h3`) default to the serif at weight 500 with tight letter-spacing.
Body is 17px Inter Tight at 1.55 line-height. Use the helper classes rather than
re-declaring sizes:

| Class | Purpose | Size |
| --- | --- | --- |
| `.display` | Hero headline | `clamp(40px, 6vw, 78px)` |
| `.section-title` | Section heading | `clamp(28px, 3.4vw, 44px)` |
| `.eyebrow` | Uppercase kicker above a title | `12px`, tracked |
| `.eyebrow.on-green` | Eyebrow on a green band | light variant |

Headings are fluid (`clamp`) so they scale with the viewport without breakpoints.

---

## 4. Layout primitives

| Class | Role |
| --- | --- |
| `.wrap` | Centered max-width container with responsive side padding. **Every** full-width section's inner content sits in a `.wrap`. |
| `.shop-grid` | Two-column shop layout (content + sticky summary), collapses to one column ≤ 980px. |
| `.checkout-grid` | Form + sticky order summary. |
| `.doc-grid` | Sticky side-nav + prose body (legal / delivery pages). |
| `.prose` | Readable 70ch text column for long-form content. |
| `.summary` | Sticky order-summary card, shared by cart & checkout. |
| `.form-card` | White bordered card wrapping a form step. |

Breakpoints used across the app: **980px** (shop/checkout collapse), **960px**
(hero/product), **860px** (nav links hide, footer reflows), **560/720px**
(single-column, mobile buy-bar appears).

---

## 5. Components

Reusable UI lives in [`components/`](components). Pages compose these — they do
**not** re-implement chrome, buttons, or icons.

### Chrome (shared on every storefront page)

| Component | File | Notes |
| --- | --- | --- |
| `SiteHeader` | `components/SiteHeader.tsx` | Sticky nav, brand, live cart counter (`useCart`). Client component. |
| `SiteFooter` | `components/SiteFooter.tsx` | Four-column footer + social + legal. Static / server-safe. |

Both are mounted once in [`app/(storefront)/layout.tsx`](app/(storefront)/layout.tsx).
The global 404 (`app/not-found.tsx`) mounts them directly because it sits outside
the route group.

### `Button` — the one button

[`components/Button.tsx`](components/Button.tsx) is the **only** way to render a
button or button-styled link. It renders a Next `<Link>` when `href` is set,
otherwise a native `<button>`, and forwards all native props (`onClick`, `type`,
`disabled`, `style`, …).

```tsx
<Button href="/checkout" variant="primary" size="lg" block>Passer la commande</Button>
<Button variant="ghost" size="lg" onClick={onAddToCart}>Ajouter au panier</Button>
<Button variant="light" href="/#catalogue">Choisir mon bureau</Button>
```

| Prop | Values | Default |
| --- | --- | --- |
| `variant` | `primary` (green) · `dark` (ink) · `ghost` (outline) · `light` (white, for green bands) | `primary` |
| `size` | `md` · `lg` | `md` |
| `block` | full-width | `false` |
| `href` | renders a `<Link>` instead of `<button>` | — |

> Do **not** write `className="btn btn-primary"` in markup. The `.btn*` CSS
> classes exist only to back this component. Adding a button style = adding a
> `variant` here plus a `.btn-<variant>` rule in `globals.css`.

### `Icons` — the icon set

[`components/Icons.tsx`](components/Icons.tsx) exports every SVG as a named React
component (Feather-style line icons + brand glyphs). All accept `size` and pass
through `<svg>` props (`strokeWidth`, `className`, …). **Never** paste inline
`<svg>` into a page — import the icon (e.g. `CartIcon`, `CheckBigIcon`,
`TruckIcon`, `ChevronDownIcon`).

### Product & content components

| Component | File | Used by |
| --- | --- | --- |
| `ProductCard` | `components/ProductCard.tsx` | Landing catalogue + "Vous aimerez aussi" grid |
| `ProductBuyBox` | `components/ProductBuyBox.tsx` | Product detail — gallery, options, add-to-cart, inline express (COD) order, sticky mobile bar. Client island. |
| `PageHero` | `components/PageHero.tsx` | FAQ / delivery / legal page headers (`eyebrow`, `title`, body, `updated`) |

### Landing sections

The landing page ([`app/(storefront)/page.tsx`](app/(storefront)/page.tsx)) is a
thin composition of section components in [`components/sections/`](components/sections):
`Hero`, `TrustBar`, `Listing` (filterable catalogue), `GreenBand`, `ErgoSteps`,
`ContactSection`. Each owns one band of the page and its own copy/data constants.

---

## 6. Patterns & conventions

- **Money** is always formatted through `formatDT()` (`lib/data.ts`) — never
  string-concatenate a price.
- **Images** go through the `img` / `productImg` / `photoImg` helpers
  (`lib/data.ts`) so dimensions and sources stay consistent.
- **Forms** use the shared `.field` / `.field-grid` / `.field-prefix` /
  `.radio-card` classes. Required fields mark errors by setting
  `borderColor: var(--clay)`; the Tunisian phone prefix uses `.field-prefix`.
- **Toasts** are triggered via `useToast()` (`lib/toast.tsx`); never build a
  bespoke notification.
- **Cart state** is read/written only through `useCart()` (`lib/cart.tsx`).
- **Server vs client.** Keep components server-rendered by default; add
  `"use client"` only for interactivity (cart counter, filters, forms, buy box).
  Storefront pages fetch from Medusa with `export const dynamic = "force-dynamic"`.

---

## 7. Extending the system

1. **New button look** → add a `variant` to `Button.tsx` + a `.btn-<name>` rule
   in `globals.css`. Never inline button styles.
2. **New icon** → add a named export to `Icons.tsx` using the `Line` helper.
3. **New colour/spacing** → add a token to `:root` first, then reference it.
4. **New repeated block** → extract a component into `components/` (or a landing
   band into `components/sections/`) before copying markup a second time.
5. **New page header** → reuse `PageHero`; new content page → reuse `.prose` /
   `.doc-grid`.

Keeping these five habits is what keeps the storefront feeling like one product
instead of a dozen pages.

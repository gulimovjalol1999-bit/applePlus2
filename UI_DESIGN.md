# Apple Plus — UI Design System

> Apple-inspired premium e-commerce frontend.  
> Stack: **Next.js 14 · Tailwind CSS · shadcn/ui**  
> Date: 2026-06-04

---

## 1. Design Philosophy

| Principle | Application |
|-----------|-------------|
| **Clarity** | Every element serves a purpose. Zero decorative noise. |
| **Depth** | Layered surfaces, subtle shadows, purposeful elevation. |
| **Deference** | UI steps back; product imagery and content lead. |
| **Continuity** | Transitions feel physical — nothing pops in or cuts out. |

---

## 2. Design Tokens

### 2.1 Color Palette

```css
/* styles/globals.css */
:root {
  /* Brand */
  --color-accent:        #0071e3;   /* Apple blue */
  --color-accent-hover:  #0077ed;
  --color-accent-dark:   #2997ff;   /* Blue shifts lighter in dark mode */

  /* Neutrals — Light */
  --color-bg:            #ffffff;
  --color-bg-secondary:  #f5f5f7;   /* Apple's off-white */
  --color-bg-tertiary:   #e8e8ed;
  --color-surface:       #ffffff;
  --color-surface-raised:#fbfbfd;
  --color-border:        #d2d2d7;
  --color-border-subtle: #e8e8ed;

  /* Text */
  --color-text-primary:  #1d1d1f;   /* Apple's near-black */
  --color-text-secondary:#6e6e73;
  --color-text-tertiary: #a1a1a6;
  --color-text-inverse:  #f5f5f7;

  /* Semantic */
  --color-success:       #34c759;
  --color-warning:       #ff9f0a;
  --color-error:         #ff3b30;
  --color-info:          #32ade6;

  /* Gradients */
  --gradient-hero:       linear-gradient(180deg, #1d1d1f 0%, #2c2c2e 100%);
  --gradient-card:       linear-gradient(135deg, #ffffff 0%, #f5f5f7 100%);

  /* Shadows */
  --shadow-sm:   0 1px 3px rgba(0,0,0,.06), 0 1px 2px rgba(0,0,0,.04);
  --shadow-md:   0 4px 16px rgba(0,0,0,.08), 0 2px 6px rgba(0,0,0,.04);
  --shadow-lg:   0 8px 40px rgba(0,0,0,.12), 0 4px 16px rgba(0,0,0,.06);
  --shadow-xl:   0 20px 60px rgba(0,0,0,.16), 0 8px 24px rgba(0,0,0,.08);
  --shadow-card: 0 2px 12px rgba(0,0,0,.08);
}

.dark {
  --color-accent:        #2997ff;
  --color-bg:            #000000;
  --color-bg-secondary:  #1c1c1e;
  --color-bg-tertiary:   #2c2c2e;
  --color-surface:       #1c1c1e;
  --color-surface-raised:#2c2c2e;
  --color-border:        #3a3a3c;
  --color-border-subtle: #2c2c2e;
  --color-text-primary:  #f5f5f7;
  --color-text-secondary:#ababaf;
  --color-text-tertiary: #636366;
  --shadow-sm:   0 1px 3px rgba(0,0,0,.3);
  --shadow-md:   0 4px 16px rgba(0,0,0,.4);
  --shadow-lg:   0 8px 40px rgba(0,0,0,.5);
}
```

### 2.2 Typography

```css
/* Font stack: system UI first, fallback to Inter */
--font-display: "SF Pro Display", "Inter Display", system-ui, sans-serif;
--font-text:    "SF Pro Text", "Inter", system-ui, sans-serif;
--font-mono:    "SF Mono", "Fira Code", ui-monospace, monospace;
```

| Token | Size | Weight | Line Height | Use |
|-------|------|--------|-------------|-----|
| `display-xl` | 80px / 5rem | 700 | 1.05 | Hero headings |
| `display-lg` | 56px / 3.5rem | 700 | 1.07 | Section heroes |
| `display-md` | 40px / 2.5rem | 600 | 1.1 | Page titles |
| `headline` | 28px / 1.75rem | 600 | 1.2 | Card titles |
| `title` | 20px / 1.25rem | 600 | 1.3 | Sub-section titles |
| `body-lg` | 17px / 1.0625rem | 400 | 1.6 | Lead paragraphs |
| `body` | 15px / 0.9375rem | 400 | 1.5 | Default body |
| `caption` | 13px / 0.8125rem | 400 | 1.4 | Captions, labels |
| `micro` | 11px / 0.6875rem | 500 | 1.3 | Badges, tags |

### 2.3 Spacing Scale

```js
// tailwind.config.ts — extends default spacing
spacing: {
  px: '1px', 0: '0', 0.5: '2px', 1: '4px', 1.5: '6px',
  2: '8px', 2.5: '10px', 3: '12px', 3.5: '14px', 4: '16px',
  5: '20px', 6: '24px', 7: '28px', 8: '32px', 9: '36px',
  10: '40px', 12: '48px', 14: '56px', 16: '64px', 18: '72px',
  20: '80px', 24: '96px', 28: '112px', 32: '128px',
}
```

### 2.4 Border Radius

| Token | Value | Use |
|-------|-------|-----|
| `rounded-sm` | 4px | Tags, micro-chips |
| `rounded` | 8px | Inputs, small buttons |
| `rounded-md` | 12px | Cards, modals |
| `rounded-lg` | 16px | Section containers |
| `rounded-xl` | 20px | Hero cards |
| `rounded-2xl` | 24px | Feature panels |
| `rounded-full` | 9999px | Pills, avatars |

### 2.5 Motion

```js
// tailwind.config.ts — keyframes
animation: {
  'fade-in':      'fadeIn 0.4s cubic-bezier(0.25, 0.1, 0.25, 1)',
  'slide-up':     'slideUp 0.5s cubic-bezier(0.25, 0.1, 0.25, 1)',
  'slide-in-r':   'slideInRight 0.35s cubic-bezier(0.25, 0.1, 0.25, 1)',
  'scale-in':     'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
  'shimmer':      'shimmer 1.8s infinite',
}
```

| Context | Duration | Easing |
|---------|----------|--------|
| Micro (hover, focus) | 150ms | `ease-out` |
| Short (dropdown, tooltip) | 200ms | `ease-in-out` |
| Medium (modal, drawer) | 350ms | `cubic-bezier(0.25, 0.1, 0.25, 1)` |
| Long (page transition) | 500ms | `cubic-bezier(0.25, 0.1, 0.25, 1)` |

---

## 3. Global Layout

### 3.1 Breakpoints

| Name | Width | Layout |
|------|-------|--------|
| `xs` | < 390px | 1 column, compact nav |
| `sm` | 390–767px | 1–2 columns, mobile nav |
| `md` | 768–1023px | 2–3 columns, tablet nav |
| `lg` | 1024–1279px | 3–4 columns, desktop nav |
| `xl` | 1280–1535px | Full desktop |
| `2xl` | ≥ 1536px | Max-width constrained |

### 3.2 Content Container

```tsx
// Max content width: 1400px, centered with horizontal padding
<div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-10 xl:px-16">
```

### 3.3 Grid System

```
Mobile (< 768px):   4-column grid, 16px gutters
Tablet (768–1023):  8-column grid, 20px gutters
Desktop (≥ 1024):  12-column grid, 24px gutters
```

---

## 4. Navigation

### 4.1 Top Header (Desktop)

```
┌─────────────────────────────────────────────────────────────────┐
│ [Apple Plus Logo]    iPhone  Mac  iPad  Watch  TV  Accessories  │
│                                          [🔍 Search] [♡] [🛒2] [👤] │
└─────────────────────────────────────────────────────────────────┘
```

**Specs:**
- Height: 52px (collapsed), 64px (default)
- Background: `rgba(255,255,255,0.85)` with `backdrop-blur-xl`
- Sticky with smooth shadow on scroll
- Logo: wordmark SVG, 20px height
- Nav links: 15px, weight 400, `text-[#1d1d1f]`, hover underline 2px
- Mega-menu on hover with 300ms delay (prevents accidental trigger)
- Dark mode: `rgba(29,29,31,0.85)` background

**Mega-Menu Layout (example: iPhone category):**
```
┌─────────────────────────────────────────────────────────┐
│ iPhone                                                   │
│ ─────────────────────────────────────────────────────── │
│  [iPhone 16 Pro]  [iPhone 16]  [iPhone 15]  [Compare]   │
│   img + name      img + name   img + name    →           │
│                                                          │
│  Shop iPhone     Trade In     iPhone Financing           │
└─────────────────────────────────────────────────────────┘
```

### 4.2 Mobile Header (< 768px)

```
┌─────────────────────────────┐
│ [≡]  Apple Plus  [🔍] [🛒2] │
└─────────────────────────────┘
```

**Mobile Drawer Menu:**
- Full-screen slide-in from left
- `w-full max-w-[320px]`
- Categories as accordion items
- Bottom: Sign In / Account links

### 4.3 Announcement Bar

```
┌─────────────────────────────────────────────────────────┐
│  Free delivery on orders over $50. Shop now →           │
└─────────────────────────────────────────────────────────┘
```
- Height: 40px
- Background: `#1d1d1f` (light) / `#0071e3` (promotional)
- Dismissible via `×`

---

## 5. Homepage

### 5.1 Hero Banner

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│                      [Full-bleed image]                          │
│                                                                  │
│              iPhone 16 Pro                                       │
│         Hello, Apple Intelligence.                               │
│                                                                  │
│          [From $999]  [Learn more →]  [Buy →]                    │
│                                                                  │
│                   ● ○ ○ ○ ○                                      │
└─────────────────────────────────────────────────────────────────┘
```

**Specs:**
- Full viewport height (100vh) on desktop, 70vh on mobile
- Auto-playing carousel, 5s interval, pause on hover
- Dark overlay gradient: `linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)`
- Heading: `display-xl`, white, centered or left-aligned based on slide
- Sub-headline: `body-lg`, `text-white/80`
- Two CTAs: primary filled button + ghost button
- Dot pagination: 8px circles, `bg-white/50` inactive, `bg-white` active
- Swipe gesture support on mobile

**Hero Card Variant (split layout):**
```
┌──────────────────────────┬──────────────────────────┐
│   [Product Image]        │  Product Name            │
│                          │  Tagline                 │
│                          │  Starting from $XXX      │
│                          │  [Learn more] [Buy]      │
└──────────────────────────┴──────────────────────────┘
```

### 5.2 Category Cards

```
┌──────┬──────┬──────┬──────┬──────┬──────┐
│  📱  │  💻  │  ⌚  │  🎧  │  📺  │  🎮  │
│iPhone│  Mac │Watch │AirPods│ TV  │Access│
└──────┴──────┴──────┴──────┴──────┴──────┘
```

**Specs:**
- 6 cards on desktop (2xl:grid-cols-6), 3 on tablet, 2 on mobile (scroll)
- Card size: 160×160px desktop, 120×120px mobile
- Background: `bg-[#f5f5f7]` → on hover: `bg-[#e8e8ed]`, `scale-105`, `shadow-md`
- Category icon: 64px, product hero shot rendered at 2×
- Name: `caption`, `font-medium`, centered below icon
- Horizontal scroll on mobile with `snap-x snap-mandatory`

### 5.3 Popular Products Grid

```
Section Header:
  Popular Right Now                    [View all →]

┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  [Image]     │  │  [Image]     │  │  [Image]     │  │  [Image]     │
│              │  │              │  │              │  │              │
│  iPhone 16   │  │  MacBook Air │  │  AirPods Pro │  │  Apple Watch │
│  From $999   │  │  From $1099  │  │  $249        │  │  From $399   │
│  ★★★★★ (2.4k)│  │  ★★★★½ (1.1k)│  │  ★★★★★ (5.6k)│  │  ★★★★☆ (890) │
│  [Add to Cart│  │  [Add to Cart│  │  [Add to Cart│  │  [Add to Cart│
└──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
```

**Product Card Specs:**
- `rounded-2xl bg-[#f5f5f7]` container
- Image: 240px height, `object-fit: contain`, white/gray bg
- Padding: 20px
- Product name: `title` weight 500
- Price: `body-lg` weight 600, accent color for "From"
- Rating: star icons 14px + count in `text-tertiary caption`
- Wishlist icon (heart): top-right corner, appears on card hover
- "Add to Cart" button: full width, `variant="default"`, shows on hover (desktop)
- Hover state: `shadow-lg scale-[1.02]` transition

### 5.4 Discounts / Sale Section

```
┌─────────────────────────────────────────────────────────────────┐
│  🔥 Limited-Time Deals                                           │
│  ──────────────────────────────────────────────────────         │
│  Ends in: [02] : [14] : [38] : [55]                             │
│           hrs    min   sec                                       │
│                                                                  │
│  [← scroll →]                                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │ -20%     │  │ -15%     │  │ -30%     │  │ -25%     │        │
│  │[Img]     │  │[Img]     │  │[Img]     │  │[Img]     │        │
│  │MacBook   │  │iPhone 15 │  │AirPods   │  │iPad Air  │        │
│  │~~$1299~~ │  │~~$799~~  │  │~~$249~~  │  │~~$599~~  │        │
│  │$1039     │  │$679      │  │$174      │  │$449      │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

**Specs:**
- Background: `bg-gradient-to-br from-[#1d1d1f] to-[#2c2c2e]` (inverted section)
- Section title: white, `display-md`
- Countdown timer: monospace font, digit flip animation
- Discount badge: `bg-[#ff3b30] text-white rounded-full px-2 py-0.5 text-xs font-bold`
- Old price: `line-through text-tertiary`
- New price: `text-[#ff3b30] font-bold`
- Horizontal scroll container with drag-scroll JS

### 5.5 Brand Showcase

```
  Our Brands

  [Apple] [Samsung] [Sony] [Bose] [DJI] [Beats] [JBL] [Logitech]
```

**Specs:**
- Grayscale logos by default, full color on hover
- Logo row: infinite marquee scroll animation on mobile
- Desktop: static 8-column grid with opacity 0.5 → 1 on hover
- Each logo: 120×48px container, `object-fit: contain`

### 5.6 Search Bar

**Inline Search (homepage hero):**
```
┌─────────────────────────────────────────────────┐
│ 🔍  Search for products, brands, or categories  │
└─────────────────────────────────────────────────┘
```

**Full-Screen Search Modal (on icon click):**
```
┌──── ✕ ───────────────────────────────────────────┐
│                                                   │
│  ┌────────────────────────────────────────────┐  │
│  │ 🔍  iPhone 16 Pro                      ✕  │  │
│  └────────────────────────────────────────────┘  │
│                                                   │
│  Quick Suggestions                                │
│  iPhone 16 Pro Max          →                     │
│  MacBook Air M3              →                     │
│  AirPods Pro 2               →                     │
│                                                   │
│  Recent Searches                                  │
│  [Samsung S24] [MacBook] [× Clear]                │
│                                                   │
│  ┌──────┐  ┌──────┐  ┌──────┐                    │
│  │[Img] │  │[Img] │  │[Img] │  Results preview   │
│  │ $999 │  │$1099 │  │ $249 │                    │
│  └──────┘  └──────┘  └──────┘                    │
└───────────────────────────────────────────────────┘
```
- Opens as overlay with `backdrop-blur-xl bg-black/30`
- Input auto-focused
- Debounced 300ms API call
- Live results appear below input
- `Cmd+K` keyboard shortcut to open

---

## 6. Catalog Page

### 6.1 Page Layout

```
Breadcrumbs: Home > Products > MacBook

┌───────────────┬────────────────────────────────────────┐
│               │  Sort: [Most Popular ▾]  View: [⊞][☰]  │
│  FILTERS      │  244 products                          │
│               │                                        │
│  Category     │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ │
│  ○ iPhone     │  │[Card]│ │[Card]│ │[Card]│ │[Card]│ │
│  ● MacBook    │  └──────┘ └──────┘ └──────┘ └──────┘ │
│  ○ iPad       │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ │
│               │  │[Card]│ │[Card]│ │[Card]│ │[Card]│ │
│  Brand        │  └──────┘ └──────┘ └──────┘ └──────┘ │
│  □ Apple      │                                        │
│  □ Samsung    │  [← 1 2 3 ... 12 →]                   │
│               │                                        │
│  Price Range  │                                        │
│  $0 ─●──── $5000│                                      │
│               │                                        │
│  Rating       │                                        │
│  ★★★★☆ & up   │                                        │
│               │                                        │
│  In Stock     │                                        │
│  [● toggle]   │                                        │
└───────────────┴────────────────────────────────────────┘
```

**Filter Panel Specs:**
- Width: 260px, sticky `top-[72px]`
- Background: `bg-white` / `bg-[#1c1c1e]` dark
- Section headers: `caption font-semibold uppercase tracking-wider text-tertiary`
- Collapsible sections (chevron icon, smooth accordion)
- Price slider: custom dual-handle range, accent color track
- Active filters shown as chips above product grid
- "Clear all filters" link

**Sorting Dropdown:**
```
Most Popular
Newest Arrivals
Price: Low to High
Price: High to Low
Rating: Highest
Most Reviewed
```

**Product Grid:**
- Desktop: 4 columns (`grid-cols-4`)
- Tablet: 3 columns (`grid-cols-3`)
- Mobile: 2 columns (`grid-cols-2`) or 1 column list view

**Mobile Filters:**
- "Filter & Sort" sticky button at bottom
- Opens bottom drawer (`Sheet` from shadcn)
- Full-screen with close button

---

## 7. Product Detail Page

### 7.1 Gallery + Config Block

```
┌──────────────────────────────────────┬──────────────────────────┐
│                                      │  iPhone 16 Pro           │
│       [Main Product Image]           │  ──────────────────────  │
│            1200×900px                │  From $999               │
│                                      │  ★★★★★ 4.8 (2,413 ratings)│
│  [thumb1] [thumb2] [thumb3] [thumb4] │                          │
│                                      │  Color                   │
│                                      │  ● Black Titanium        │
│                                      │  ○ White Titanium        │
│                                      │  ○ Natural Titanium      │
│                                      │  ○ Desert Titanium       │
│                                      │                          │
│                                      │  Storage                 │
│                                      │  [128GB] [256GB✓] [512GB]│
│                                      │  [1TB]                   │
│                                      │                          │
│                                      │  Qty: [−] 1 [+]          │
│                                      │                          │
│                                      │  [Add to Cart       ]    │
│                                      │  [Buy Now           ]    │
│                                      │                          │
│                                      │  ♡ Add to Wishlist       │
│                                      │  ⊕ Add to Compare        │
│                                      │                          │
│                                      │  🚚 Free delivery        │
│                                      │  ↩ 30-day returns        │
│                                      │  🛡 2-year warranty      │
└──────────────────────────────────────┴──────────────────────────┘
```

**Gallery Specs:**
- Left column: `w-full lg:w-[55%]` sticky on scroll
- Main image: `aspect-square`, zoom on hover (CSS transform + clip)
- Thumbnail strip: 80×80px, `rounded-lg`, `border-2 border-transparent`, selected: `border-accent`
- Pinch-to-zoom on mobile
- Image counter: `3 / 8` overlay on mobile

**Config Block Specs:**
- Right column: `w-full lg:w-[45%]`, `pl-0 lg:pl-12`
- Color swatches: 36px circles with border on hover/selected
- Storage: `rounded-lg border` pills, selected: `bg-accent text-white border-accent`
- "Add to Cart": `h-14 rounded-full bg-accent text-white font-semibold text-base hover:bg-accent-hover`
- "Buy Now": same height, `border-2 border-accent text-accent`

### 7.2 Specifications Section

```
┌─────────────────────────────────────────────────────────────────┐
│  Specifications                                                  │
│  ────────────────────────────────────────────────────────────── │
│  Display         6.3-inch Super Retina XDR OLED                 │
│  Chip            A18 Pro                                        │
│  Camera          48MP Main + 48MP Ultra Wide + 12MP Telephoto   │
│  Battery         Up to 33 hours video playback                  │
│  Storage         128GB / 256GB / 512GB / 1TB                    │
│  OS              iOS 18                                         │
│  Dimensions      71.5 × 156.9 × 8.25 mm                        │
│  Weight          227g                                           │
│                                                                  │
│                              [Show all specs ↓]                  │
└─────────────────────────────────────────────────────────────────┘
```
- Alternating row bg: `bg-white / bg-[#f5f5f7]`
- Collapsible: first 8 rows visible, "Show all" reveals rest
- Key: `text-tertiary caption`, Value: `body font-medium`

### 7.3 Reviews Section

```
┌─────────────────────────────────────────────────────────────────┐
│  Customer Reviews                                                │
│                                                                  │
│     4.8  ★★★★★        ★★★★★  68%                                │
│   out of 5           ★★★★☆  21%                                │
│  2,413 ratings       ★★★☆☆   7%                                │
│                       ★★☆☆☆   3%                                │
│                       ★☆☆☆☆   1%                                │
│                                                                  │
│  [Most Helpful ▾]     [Write a Review]                          │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  ★★★★★  "Best iPhone Ever"          John D.  — Mar 2025    │ │
│  │  Verified Purchase                                          │ │
│  │  Incredibly fast, camera is outstanding...                  │ │
│  │  [👍 142 helpful]  [Report]                                 │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 7.4 Similar Products

- Horizontally scrollable row of `ProductCard` components
- "You May Also Like" heading
- 5 cards visible on desktop (peek 6th), 2 on mobile

---

## 8. Comparison Page

```
┌─────────────────────────────────────────────────────────────────┐
│  Compare Products                                    [+ Add]    │
│                                                                  │
│                 iPhone 16 Pro    iPhone 16       iPhone 15 Pro  │
│                 ┌───────────┐   ┌───────────┐   ┌───────────┐  │
│                 │   [Img]   │   │   [Img]   │   │   [Img]   │  │
│                 │  $999     │   │  $799     │   │  $799     │  │
│                 │[Add to Cart│   [Add to Cart│   [Add to Cart│  │
│                 │  [× Remove]│   [× Remove] │   [× Remove] │  │
│                 └───────────┘   └───────────┘   └───────────┘  │
│                                                                  │
│  Display        6.3" OLED       6.1" OLED       6.1" OLED      │
│  Chip           A18 Pro         A18             A17 Pro         │
│  RAM            8GB             8GB             8GB             │
│  Camera         48MP Pro        48MP            48MP Pro        │
│  Battery        33h             22h             23h             │
│  5G             ✓               ✓               ✓               │
│  Face ID        ✓               ✓               ✓               │
│  ProMotion      ✓               ✗               ✓               │
└─────────────────────────────────────────────────────────────────┘
```

**Specs:**
- Sticky column headers as user scrolls rows
- Diff highlighting: superior value gets `text-accent font-semibold`
- Max 4 products (shadcn Alert if >4 attempt)
- Empty slot: dashed border `+` to add product
- Persisted in `localStorage`

---

## 9. Wishlist Page

```
┌─────────────────────────────────────────────────────────────────┐
│  My Wishlist (12 items)                     [Share] [Move all → Cart]│
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ [Img] MacBook Pro 16" M4   $2499   In Stock   [Add to Cart] [×] │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ [Img] AirPods Max          $549    In Stock   [Add to Cart] [×] │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ [Img] iPad Pro 13"         $1099   Out of Stock [Notify Me][×] │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```
- List layout on desktop, 2-column grid on mobile
- Out-of-stock items: image grayscale, "Notify Me" email button
- Price drop indicator: `↓ Price dropped $50` badge in green

---

## 10. Cart

### 10.1 Cart Drawer (slide-in)

```
          ┌──────────────────────────────┐
          │  Shopping Cart (3)         ✕ │
          ├──────────────────────────────┤
          │ [Img] iPhone 16 Pro 256GB    │
          │       Black Titanium   $1099 │
          │       [−] 1 [+]    [Remove]  │
          ├──────────────────────────────┤
          │ [Img] AirPods Pro (USB-C)    │
          │       White            $249  │
          │       [−] 1 [+]    [Remove]  │
          ├──────────────────────────────┤
          │ Promo Code                   │
          │ [─────────────────] [Apply]  │
          ├──────────────────────────────┤
          │ Subtotal          $1,348.00  │
          │ Shipping          FREE       │
          │ Discount          −$100.00   │
          │ ─────────────────────────── │
          │ Total             $1,248.00  │
          │                             │
          │  [Proceed to Checkout     ] │
          └──────────────────────────────┘
```

### 10.2 Full Cart Page

- Mirrors drawer contents at larger scale
- Product thumbnails: 100×100px
- Quantity stepper with real-time subtotal update
- "Save for Later" moves to wishlist
- Order summary sticky on right column (desktop)
- "Customers also bought" recommendation strip at bottom

---

## 11. Checkout

### 11.1 Step Indicator

```
  ① Contact  ──  ② Shipping  ──  ③ Payment  ──  ④ Review
```
- `progress-steps` component: filled circles with connecting line
- Completed: `bg-accent` with checkmark icon
- Active: `bg-accent` pulsing outline
- Remaining: `bg-border`

### 11.2 Step 1 — Contact

```
┌──────────────────────────────────────┬──────────────────┐
│                                      │  Order Summary   │
│  Contact Information                 │                  │
│  First name       Last name          │  iPhone 16 Pro   │
│  [─────────────] [─────────────]     │  $1,099          │
│                                      │                  │
│  Email                               │  AirPods Pro     │
│  [─────────────────────────────]     │  $249            │
│                                      │                  │
│  Phone                               │  ──────────────  │
│  [─────────────────────────────]     │  Subtotal $1,348 │
│                                      │  Shipping  FREE  │
│  ☑ Sign in for faster checkout       │  Total  $1,348   │
│                                      │                  │
│  [Continue to Shipping →]            │                  │
└──────────────────────────────────────┴──────────────────┘
```

### 11.3 Step 2 — Shipping

- Saved addresses as selectable cards
- "Add new address" expands form
- Shipping method selection: Standard (Free), Express ($9.99), Same-day ($19.99)

### 11.4 Step 3 — Payment

- Credit card form with live card preview graphic
- Apple Pay / Google Pay buttons (prominent, above card form)
- Stripe Elements integration
- Promo code field

### 11.5 Step 4 — Review & Place Order

- Read-only summary of all steps
- "Place Order" button: large, full-width on mobile
- Trust badges: SSL, secure checkout, money-back guarantee

### 11.6 Confirmation Page

```
┌─────────────────────────────────────────────────────────────────┐
│                          ✓                                       │
│                  Order Confirmed!                                │
│             Order #APL-2026-039871                               │
│                                                                  │
│  A confirmation email has been sent to you@email.com            │
│                                                                  │
│  Estimated Delivery: June 7–9, 2026                             │
│                                                                  │
│  [Track Order]  [Continue Shopping]                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 12. Admin Dashboard

### 12.1 Sidebar

```
┌────────────────────┐
│  Apple Plus Admin  │
│  ───────────────   │
│  ⊞ Dashboard       │
│  📦 Products       │
│  📋 Orders         │
│  👥 Users          │
│  🏷 Categories     │
│  🏪 Brands         │
│  🎟 Coupons        │
│  🚚 Shipping       │
│  📊 Analytics      │
│  ⚙ Settings        │
│  ───────────────   │
│  [Avatar] Admin    │
│  Sign out          │
└────────────────────┘
```
- Width: 240px collapsed to 64px (icon-only)
- `bg-[#1d1d1f]` always (dark surface)
- Active item: `bg-white/10 rounded-lg`
- Hover: `bg-white/5`

### 12.2 Dashboard Overview

```
┌──────────────────────────────────────────────────────────────────┐
│  Good morning, Admin  •  June 4, 2026                            │
│                                                                  │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌─────────┐ │
│  │ Revenue      │ │ Orders       │ │ Customers    │ │Products │ │
│  │ $128,400     │ │ 1,284        │ │ 8,421        │ │ 342     │ │
│  │ ↑ 12.3%      │ │ ↑ 8.1%       │ │ ↑ 22.4%      │ ↓ 2.1%   │ │
│  └──────────────┘ └──────────────┘ └──────────────┘ └─────────┘ │
│                                                                  │
│  ┌──────────────────────────────────┐ ┌───────────────────────┐ │
│  │  Revenue Chart (30 days)         │ │  Top Products         │ │
│  │  [Line chart]                    │ │  1. iPhone 16 Pro 312 │ │
│  │                                  │ │  2. MacBook Air   189 │ │
│  └──────────────────────────────────┘ │  3. AirPods Pro   145 │ │
│                                       └───────────────────────┘ │
│  Recent Orders                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ #39871  John D.  iPhone 16 Pro  $1,099  Shipped  Jun 4     │ │
│  │ #39870  Jane S.  MacBook Air    $1,099  Processing Jun 4   │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

**Stats Card Specs:**
- `bg-[#1c1c1e]` surface on dark sidebar layout, or `bg-white` on light
- Metric: `display-md font-bold`
- Delta: green `↑` / red `↓` with percentage

### 12.3 Products Table

- Columns: Image | Name | SKU | Category | Price | Stock | Status | Actions
- Inline status toggle (Active/Draft/Archived) via `Select`
- Row actions: Edit, Duplicate, Delete (with confirm dialog)
- Bulk select + bulk delete/publish
- Column sorting, search input above table
- Pagination: 20/50/100 rows per page

---

## 13. Responsive Design

### 13.1 Mobile (< 768px)

**Navigation:** Bottom tab bar replaces desktop header for key actions:
```
┌─────────────────────────────────────────┐
│                                         │
│           [page content]                │
│                                         │
├─────────────────────────────────────────┤
│  🏠 Home  🔍 Search  ♡ Wishlist  🛒 Cart  👤 Account │
└─────────────────────────────────────────┘
```

**Adjustments:**
- Single column layouts throughout
- Full-width buttons
- Bottom sheets instead of modals/dropdowns
- Swipe gestures (cart drawer, image gallery, product tabs)
- 44px minimum touch targets
- Reduced font sizes: `display-xl` → `display-lg` on hero
- Hero height: `70vh`
- Product grid: 2 columns, reduced card padding

### 13.2 Tablet (768–1023px)

**Navigation:** Condensed top bar + hamburger for full menu

**Adjustments:**
- Product grid: 3 columns
- Filter panel: overlay drawer (not inline)
- Checkout: single column
- Cart: full page (no drawer)
- Product detail: stacked (image above, config below)
- Admin: collapsed sidebar (icon-only by default)

---

## 14. Dark Mode

### 14.1 Strategy

- System preference detection via `prefers-color-scheme` (default)
- Manual toggle stored in `localStorage` + `cookie` (for SSR)
- `next-themes` provider wrapping `<html>` element
- CSS variables approach: single set of variables, overridden under `.dark`
- No JavaScript flicker: class applied on `<html>` before paint

### 14.2 Surface Hierarchy (Dark)

| Level | Color | Use |
|-------|-------|-----|
| Base | `#000000` | Page background |
| Elevated 1 | `#1c1c1e` | Cards, panels |
| Elevated 2 | `#2c2c2e` | Dropdowns, tooltips |
| Elevated 3 | `#3a3a3c` | Nested elements |
| Border | `#3a3a3c` | Dividers, outlines |

### 14.3 Color Shift Rules

| Element | Light | Dark |
|---------|-------|------|
| Accent blue | `#0071e3` | `#2997ff` (lighter for contrast) |
| Success green | `#34c759` | `#32d74b` |
| Error red | `#ff3b30` | `#ff453a` |
| Images | Normal | Slightly dimmed `brightness-90` |
| Shadows | `rgba(0,0,0,0.08)` | Removed (dark surfaces don't need them) |

### 14.4 Toggle Component

```tsx
// components/shared/ThemeToggle.tsx
// Sun icon → Moon icon with rotate animation
// Placed in header right section and account settings
```

---

## 15. Empty & Loading States

### Skeleton Loading
```tsx
// All product cards show animated shimmer skeleton on load
<div className="animate-pulse">
  <div className="bg-[#e8e8ed] dark:bg-[#2c2c2e] rounded-2xl aspect-square" />
  <div className="mt-3 h-4 bg-[#e8e8ed] dark:bg-[#2c2c2e] rounded w-3/4" />
  <div className="mt-2 h-4 bg-[#e8e8ed] dark:bg-[#2c2c2e] rounded w-1/2" />
</div>
```

### Empty States
Each empty state: centered illustration + heading + subtext + CTA button
- Empty cart: shopping bag illustration
- Empty wishlist: heart illustration  
- No search results: magnifying glass + "Try different keywords"
- No orders: box illustration + "Start Shopping" button

---

## 16. Accessibility

- WCAG 2.1 AA compliance
- Focus rings: `focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2`
- Skip-to-content link at top of every page
- All images: meaningful `alt` text
- Form inputs: always paired with visible `<label>`
- Color contrast: all text meets 4.5:1 ratio
- Keyboard navigable: all interactive elements reachable by Tab
- ARIA roles for custom components (slider, tabs, combobox)
- Reduced motion: `@media (prefers-reduced-motion)` disables animations

# Design System & UI/UX (نظام التصميم والواجهات)

This document outlines the visual identity, styling rules, and interactive elements of the project. A premium, modern, and dynamic aesthetic is a core requirement.

## 1. Typography (الخطوط)
- **Primary Font (Arabic):** `Tajawal` (Google Fonts). Chosen for its high legibility on screens, modern look, and suitability for official/professional Saudi platforms (similar to the highly requested 'Thamaniya' font).
- **Secondary Font (English/Numbers):** `Inter` (Google Fonts). Clean, geometric, and perfectly readable for data, charts, and dashboards.
- **Hierarchy:**
  - `h1`: 2.5rem - 4.5rem (Bold 800) - Used for Hero sections.
  - `h2`: 2rem - 2.5rem (Bold 700) - Section titles.
  - `body`: 1rem (Regular 400) - General text.

## 2. Color Palette (لوحة الألوان)
The application uses a modern **Dark Theme** by default to exude a premium, analytics-focused feel.

| Token Name | Hex Value | Usage |
| :--- | :--- | :--- |
| `--color-bg-main` | `#0f172a` (Slate 900) | Main background color. Deep and easy on the eyes. |
| `--color-bg-card` | `#1e293b` (Slate 800) | Background for property cards, charts, and panels. |
| `--color-accent-primary` | `#c9a84c` (Gold) | Primary brand color. Conveys luxury, real estate, and trust. |
| `--color-accent-secondary`| `#10b981` (Emerald) | Used for positive stats, "For Rent" badges, and Park overlays. |
| `--color-accent-danger` | `#ef4444` (Red) | Used for Hospital overlays or negative trends. |
| `--color-text-primary` | `#f8fafc` (Slate 50) | Main heading and paragraph text. |
| `--color-text-secondary`| `#94a3b8` (Slate 400) | Subtitles, muted text, and metadata. |
| `--color-border` | `rgba(255,255,255,0.1)` | Subtle borders dividing sections and cards. |

## 3. UI Skills & Interactive Effects (التفاعلات الحركية)
To ensure the website feels "alive" and interactive (as requested by the user), the following UI skills must be implemented globally:

1. **Scroll Reveal (`[data-reveal]`):** Elements fade in and translate slightly upward as they enter the viewport.
2. **Card Lift (`.card-lift`):** Hovering over property/neighborhood cards causes a smooth lift (`transform: translateY(-5px)`) and a subtle glowing shadow.
3. **Ripple Effect (`.btn-interactive`):** Clicking any primary button triggers a material-design ripple effect emanating from the cursor click point.
4. **Number Counters (`[data-count]`):** Statistics in the Hero section animate from 0 to their target value on page load.
5. **Tooltips (`[data-tooltip]`):** Custom styled tooltips appear when hovering over icons or buttons, replacing default browser titles.
6. **Floating Labels (`.floating-label-group`):** Input fields in search forms have labels that float elegantly when focused or filled.
7. **Skeleton Loaders (`[data-skeleton]`):** Before data is fetched via AJAX, a shimmering skeleton block is shown to improve perceived performance.
8. **Tilt Effect:** Used selectively on premium property image galleries for a 3D depth effect.

## 4. Icons
- **Library:** Font Awesome 6 (Free).
- **Usage:** Icons must be used generously in navigation menus, buttons, and property feature lists (bed, bath, area) to improve scannability.

## 5. CSS Architecture
- **Vanilla CSS:** No Tailwind or Bootstrap.
- **CSS Variables:** All colors, spacing, and typography are defined in `:root` for easy theming (Dark/Light mode toggling).
- **Flexbox/Grid:** Modern layout techniques strictly adhered to for responsive design.

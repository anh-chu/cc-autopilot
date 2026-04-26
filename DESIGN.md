# CCMC Redesign: Design System & Token Registry

## 1. Philosophy

Mistral UI warm, European. Sunset vibes, not sterile blue tech. Every surface glows. Backgrounds fade cream to amber. Shadows carry golden undertones. Signature orange (`#fa520f`) burns like signal fire.

Maximalist warmth, minimalist structure. Huge display headlines. Aggressive negative tracking. Typography uses Arial at extreme sizes. Raw, unadorned voice. "We build frontier AI," no decoration needed.

Complete commitment to warm temperature. Gradient system: yellow (`#ffd900`) to burnt orange. Warm amber-tinted blacks for shadow. Dramatic landscape photography. Less tech company, more European luxury brand.

## 2. Token Registry

### Color
| Role | Variable | Light Value | Dark Value | Notes |
|---|---|---|---|---|
| Page Bg | `--background` | `#fffaeb` | `#1f1916` | Foundation canvas |
| Surface | `--card` | `#fffaeb` | `#2a2218` | Base surface |
| Popover | `--popover` | `#ffffff` | `#322820` | Floating surfaces |
| Text Base | `--foreground` | `#1f1f1f` | `#fffaeb` | Primary text |
| Text Muted | `--muted-foreground` | `hsl(0, 0%, 24%)` | `hsl(35, 18%, 60%)` | Secondary text |
| Border | `--border` | `hsl(40, 30%, 88%)` | `hsl(28, 18%, 22%)` | Structural dividers |
| Input Border| `--input` | `hsl(40, 25%, 80%)` | `hsl(28, 15%, 20%)` | Form borders |
| Primary Action| `--primary` | `#1f1f1f` | `#fa520f` | Main CTA bg |
| Primary Text| `--primary-foreground`| `#ffffff` | `#ffffff` | Main CTA text |
| Accent | `--accent` | `#fa520f` | `#fa520f` | Brand focus / active states |
| Destructive | `--destructive` | `#dc2626` | `#ef4444` | Danger actions |

#### Soft Semantic Tokens
Pre-mixed solid tints for state highlights, icon halos, status blocks, drag-over indicators. **Always solid hex values — never opacity-derived.** Use these instead of `bg-{color}/N`.

| Role | Variable | Tailwind | Light Value | Dark Value | Use For |
|---|---|---|---|---|---|
| Accent Soft | `--accent-soft` | `bg-accent-soft` | `#fde9d4` | `#3a2818` | Active state, icon halos, daemon-running highlights |
| Primary Soft | `--primary-soft` | `bg-primary-soft` | `#ececec` | `#3a2818` | Drag-over zones, board drop targets, primary halos |
| Destructive Soft| `--destructive-soft`| `bg-destructive-soft`| `#fbe7e7` | `#3a2424` | Error blocks, error message boxes, DO status pills |
| Warning Soft | `--warning-soft` | `bg-warning-soft` | `#fff3d6` | `#3d3320` | Warning panels, scheduled-status indicators |

### Typography
- **Family**: `Arial, ui-sans-serif, system-ui`
- **Weight**: `400` globally. Hierarchy from size, not weight.
- **Scale**:
  - `text-display`: 82px / 1.00 / -2.05px tracking
  - `text-section`: 56px / 0.95 / tight tracking
  - `text-lg` (CardTitle/DialogTitle): 1.125rem / 1.20 / tight tracking
  - `text-sm` (Body): 0.875rem / 1.50 / normal
  - `text-xs` (Badge/Tip): 0.75rem / 1.50 / uppercase + wider tracking

### Spacing (8pt Base)
Strict 8pt scale for layout. 4pt for micro-adjustments.
- Micro: `p-0.5` (2px), `p-1` (4px)
- Tight: `p-2` (8px), `gap-2`
- Base: `p-4` (16px), `gap-4`
- Wide: `p-6` (24px) (Dialogs/Cards)
- Layout: `gap-8` (32px), `py-12` (48px)

### Radius
Near-zero rule. Architectural geometry.
- Base: `--radius: 0.125rem` (2px). Use `rounded-sm`.
- Card/Containers: `rounded-none`.
- Pills/Avatars: `rounded-full`.
- **Exception**: Nothing else. Kill `rounded-md`, `rounded-lg` (Audit 03-spacing: 15+ violations).

### Elevation
Map shadow + border + ring to semantic tiers.
| Tier | Name | Light Spec | Dark Spec | Usage |
|---|---|---|---|---|
| `e-0` | Flat | `border shadow-none` | `border shadow-none` | Standard blocks |
| `e-1` | Input | `border-input shadow-sm` | `border-input shadow-sm` | Inputs, Select |
| `e-2` | Card | `border-0 shadow-golden` | `border-0 shadow-golden` | Cards, elevated containers |
| `e-3` | Dropdown| `border shadow-golden` | `border shadow-golden` | Dropdown menus |
| `e-4` | Dialog | `border shadow-golden` | `border shadow-golden` | Dialogs |
| `e-5` | Toast | `border-primary shadow-golden`| `border-primary shadow-golden`| High-priority alerts |

*Note: `shadow-golden` in light is rgba(127,99,21,x) multi-layer. Dark is dark drop-shadow only.*

### Motion
Semantic states tied to durations. All `ease-out`.
- `fast`: `duration-100` (Hover color shifts, focus rings)
- `base`: `duration-150` (Popover zoom/slide, dialog entrance)
- `slow`: `duration-300` (Card entrance, complex transitions)

### State Tokens
Consistent interactive feedback.
- **Hover**: `hover:bg-accent hover:text-accent-foreground` OR `hover:opacity-90`.
- **Focus**: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`. Form inputs use `ring-1`.
- **Disabled**: `disabled:opacity-50 disabled:pointer-events-none`.
- **Active**: Inherits hover + `scale-[0.98]` micro-transform.

### Z-Index
No arbitrary values.
- `z-10`: Sticky headers.
- `z-30`: Sidebar (`app-sidebar`).
- `z-40`: Modal backdrop (`DialogOverlay`).
- `z-50`: Floats (`Dropdown`, `Popover`).

### Iconography
- **Library**: Lucide React.
- **Size**:
  - `size-3` (12px): Micro badges.
  - `size-4` (16px): Default. Buttons, inputs.
  - `size-5` (20px): Section headers.
- **Stroke**: Always `2`.
- **Color**: Inherits text. Exceptions: Status icons.

---

## 3. Component Contract

| Primitive | Allowed Variants | Tokens / Spec | Forbidden |
|---|---|---|---|
| **Button** | `default`, `destructive`, `outline`, `secondary`, `ghost`, `link` | `rounded-sm`. Focus: `ring-1 ring-ring`. Disabled: `opacity-50` (Standardize from 60%). | Custom colors inline. `rounded-md`. |
| **Badge** | `default`, `secondary`, `destructive`, `outline`, `accent` | `rounded-sm px-2.5 py-0.5 text-xs`. Focus: `ring-2 ring-ring ring-offset-2`. | Inconsistent padding. |
| **Input / Textarea** | N/A | `rounded-sm border-input shadow-sm`. Focus: `ring-1 ring-ring`. Disabled: `opacity-50`. | Custom borders. Hover backgrounds. |
| **Select** | N/A | Trigger: `shadow-sm ring-1`. Content: `shadow-golden`. | Custom dropdown arrows. |
| **Card** | N/A | `rounded-none border-0 shadow-golden`. Subcomponents: `CardHeader p-6`. | Border. CardTitle not inheriting `text-lg`. |
| **Dialog** | N/A | `max-w-lg p-6 shadow-golden rounded-sm`. Overlay `z-40 backdrop-blur-sm`. | Arbitrary width `w-[500px]`. |
| **Popover / Dropdown**| N/A | `shadow-golden z-50 p-4 border bg-popover`. | Missing animate-in/out. |
| **Tooltip** | N/A | `bg-primary text-primary-foreground`. No shadow. | Using `bg-popover`. |
| **Switch** | N/A | `shadow-xs`. Focus: `ring-2 ring-ring ring-offset-2`. | Raw outline. |
| **Checkbox** | N/A | Must match Switch focus spec. | Custom SVG overriding primitive. |
| **Tabs** | N/A | Trigger focus: `ring-2 ring-ring ring-offset-2`. Active: `shadow`. | Focus without offset. |

---

## 4. Page-Level Patterns

- **Page Header**: `div` containing `text-section` or `text-subheading-lg` + `text-muted-foreground` subtitle.
- **Danger Zone**: `Card` with `border-destructive/40` and `CardTitle text-destructive`.
- **Empty State**: `rounded-sm bg-muted p-3`. Lucide icon `size-5` + text.
- **Loading Skeleton**: `animate-pulse rounded-sm bg-muted`. No raw gray colors.
- **Command Bar**: Sticky `z-40`, `bg-background/80 backdrop-blur-md`.
- **Sidebar**: `z-30`. Uses semantic `bg-sidebar-background`.
- **Container**: Use `container mx-auto max-w-screen-lg`. No hardcoded `max-w-[1400px]`.

---

## 5. Usage Rules

- Primary action → `variant=default`.
- Destructive → `variant=destructive`.
- Tertiary/List item action → `variant=ghost`.
- Focus state → MUST use `--ring`. Never override ring color.
- Backgrounds → Use `--card` or `--background`. Never use `bg-mistral-orange/10` directly.

---

## 6. Dark Mode Rules

- **Strict Parity**: Every `--color` in `:root` MUST exist in `.dark`.
- **No Hardcoding**: No `bg-mistral-orange` without `dark:` override.
- **Shadows**: `.dark .shadow-golden` drops golden rgba. Pure black depth-shadows only. Prevent muddy halos.
- **Luminance**: Status colors (`text-amber-500`) check for dark mode contrast or rely on `--status-warning`.

---

## 7. Migration Map (Audit Violations)

| Component / Pattern | Audit Source | Violation | Fix / Target Token |
|---|---|---|---|
| Dialog | 03-spacing | Hardcoded `max-w-md` vs `max-w-sm` | Unify to responsive classes `sm:max-w-sm md:max-w-md lg:max-w-lg`. |
| Card Padding | 03-spacing | Dialog `p-6` vs internal `p-4` | Unify all dialogs/cards to `p-6`. |
| Button Disabled | 06-components | `opacity-60` vs form `opacity-50` | Align to `opacity-50`. |
| CardTitle Size | 06-components | No explicit size. DialogTitle uses `text-lg`. | Update `CardTitle` to `text-lg`. |
| Focus Rings | 05-elevation | Badge/Tab uses `ring-offset-2`, Input `ring-1` | Standardize offset. Input/Select `ring-1`, Interactive `ring-2`. |
| Capture Button | 20-dark | `bg-mistral-orange` in brain-dump (bug) | Add `dark:bg-mistral-orange/85`. |
| Radii | 03-spacing | 15+ `rounded-md`, `rounded-lg` uses | Sweep. Replace with `rounded-sm`. |
| Magic Widths | 03-spacing | 3x `max-w-[1400px]` in Tasks | Replace with `max-w-screen-lg`. |

---

## 8. Anti-Patterns

- **NO** `rounded-md` or `rounded-lg`. System is sharp (`rounded-sm` or `rounded-none`).
- **NO** `border` on `Card`. Cards rely on `shadow-golden` for separation.
- **NO** hardcoded `text-red-500` for errors. Use `text-destructive`.
- **NO** `bg-white` or `bg-black`. Use `bg-background` or `bg-primary`.
- **NO** hardcoded arbitrary margins like `-mx-2` to cheat alignment. Fix padding root cause.
- **NO** form inputs floating with `shadow-md`. Inputs use `shadow-sm` and `border-input`.
- **NO** static opacity on container backgrounds. Cards, panels, boxes, pills, halos must be **solid**. No `bg-card/50`, `bg-muted/30`, `bg-accent/10` on rectangles.
  - Translucent surface = drop-shadow bleed-through bug + ambiguous tonal hierarchy.
  - Use solid `bg-card`, `bg-muted`, or the `-soft` semantic tokens (`bg-accent-soft`, `bg-destructive-soft`, etc.) for state tints.
  - **Allowed translucency**: `hover:bg-*` overlays, `bg-background/80 backdrop-blur` sticky headers, modal backdrop (`bg-black/50`), 1–2px decorative dots/dividers, progress-bar fills.
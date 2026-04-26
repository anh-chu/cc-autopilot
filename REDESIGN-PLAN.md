# Redesign Implementation Plan: Mistral-Inspired Warm/Amber Design System

## Scope

**Covers:** Full visual redesign of every frontend surface — design tokens, CSS variables, all 20 shadcn/ui primitives, layout shell, sidebar, command bar, breadcrumbs, all 30+ feature components, all 20 page routes, loading/error states.

**Does NOT cover:** Backend API changes, data model changes, new features, routing changes, business logic. All component APIs (props, exports, names) stay identical. Functionality unchanged.

---

## Approach

Redesign follows a token-first, bottom-up strategy:

1. Replace all CSS custom properties and Tailwind theme tokens in two files (globals.css + tailwind.config.ts)
2. Restyle shadcn/ui primitives to match DESIGN.md (near-zero radii, warm shadows, weight 400, Arial)
3. Update layout shells, nav, command bar
4. Sweep page-level components for hardcoded colors, wrong font weights, wrong radii

**Why bottom-up:** Changing tokens first means 60-70% of the visual shift happens automatically through CSS variable propagation. Primitive restyles cascade into every consumer. Page-level work becomes mostly cleanup.

**Alternative rejected:** Top-down (page-by-page) would cause massive duplication since every page uses the same primitives. Token-first is strictly better.

**Dark mode decision:** DESIGN.md describes a warm-only palette. The current app has a full dark mode (navy blue). Options:
- (A) Remove dark mode entirely — matches DESIGN.md literally
- (B) Create a warm dark mode (dark amber/brown tones instead of navy) — preserves user preference
- (C) Keep dark mode as-is — creates visual disconnect

**Recommendation: Option B** — create warm dark mode using Mistral Black (#1f1f1f) as base, warm browns for surfaces, amber for accents. This preserves ThemeProvider/ThemeToggle functionality while staying in the warm color universe. Flag this as an open question for user confirmation.

---

## Constraints

1. All component exports, prop interfaces, and import paths MUST remain identical
2. `cn()` utility from `/home/sil/ccmc-redesign/src/lib/utils.ts` is the standard class merge — continue using it
3. sonner Toaster in layout.tsx uses `border-border bg-card text-card-foreground` — will inherit token changes automatically
4. Eisenhower quadrant colors (--quadrant-do/schedule/delegate/eliminate) and status colors (--status-*) must remain semantically distinct even in warm palette
5. Chart colors (--chart-1 through --chart-5) need warm-spectrum alternatives
6. `next-themes` with `attribute="class"` and `.dark` class selector must be preserved
7. Inter font import in layout.tsx must be replaced with Arial stack

---

## Phases

### Phase 1: Design Tokens (Foundation) — SEQUENTIAL, blocks all other phases

#### Step 1.1: CSS Custom Properties
- **File:** `/home/sil/ccmc-redesign/src/app/globals.css`
- **Change:** Replace ALL `:root` and `.dark` CSS variable values. Specific mappings:

  **:root (light mode):**
  ```
  --background: #fffaeb (Warm Ivory)
  --foreground: #1f1f1f (Mistral Black)
  --card: #fffaeb (Warm Ivory)
  --card-foreground: #1f1f1f
  --popover: #ffffff (Pure White — popovers need max contrast)
  --popover-foreground: #1f1f1f
  --primary: #1f1f1f (Mistral Black — primary buttons are dark)
  --primary-foreground: #ffffff
  --secondary: #fff0c2 (Cream — secondary buttons)
  --secondary-foreground: #1f1f1f
  --muted: #fff0c2 (Cream)
  --muted-foreground: hsl(0, 0%, 24%) (Black Tint from DESIGN.md)
  --accent: #fa520f (Mistral Orange)
  --accent-foreground: #ffffff
  --destructive: #dc2626 (keep red, but warm-tinted)
  --destructive-foreground: #ffffff
  --border: hsl(40, 30%, 88%) (warm-tinted border, not cool gray)
  --input: hsl(240, 5.9%, 90%) (DESIGN.md specifies this exact cool border for inputs)
  --ring: #fa520f (Mistral Orange for focus rings)
  --radius: 0.125rem (near-zero — DESIGN.md says sharp corners)

  --chart-1: #fa520f (Mistral Orange)
  --chart-2: #ffa110 (Sunshine 700)
  --chart-3: #ffb83e (Sunshine 500)
  --chart-4: #ffd06a (Sunshine 300)
  --chart-5: #1f1f1f (Mistral Black)

  --sidebar-background: #fff0c2 (Cream)
  --sidebar-foreground: #1f1f1f
  --sidebar-primary: #fa520f (Mistral Orange)
  --sidebar-primary-foreground: #ffffff
  --sidebar-accent: #fffaeb (Warm Ivory)
  --sidebar-accent-foreground: #1f1f1f
  --sidebar-border: hsl(40, 30%, 85%)
  --sidebar-ring: #fa520f

  --quadrant-do: #fa520f (Mistral Orange — urgent+important)
  --quadrant-schedule: #ffa110 (Sunshine 700 — important, not urgent)
  --quadrant-delegate: #ffb83e (Sunshine 500 — urgent, not important)
  --quadrant-eliminate: hsl(30, 10%, 60%) (warm gray — neither)

  --status-not-started: hsl(30, 10%, 55%) (warm neutral)
  --status-in-progress: #ffa110 (Sunshine 700)
  --status-done: #22c55e (keep green — universal "done" signal)

  --success: #22c55e (green — keep universal)
  --warning: #ffa110 (Sunshine 700)
  --info: #fa520f (Mistral Orange)
  ```

  **.dark (warm dark mode):**
  ```
  --background: #1f1f1f (Mistral Black)
  --foreground: #fffaeb (Warm Ivory)
  --card: #2a2520 (warm dark brown)
  --card-foreground: #fffaeb
  --popover: #322c25 (slightly elevated warm dark)
  --popover-foreground: #fffaeb
  --primary: #fa520f (Mistral Orange)
  --primary-foreground: #ffffff
  --secondary: #3d342a (dark warm brown)
  --secondary-foreground: #fffaeb
  --muted: #332d25 (dark warm)
  --muted-foreground: hsl(35, 15%, 55%) (warm mid-gray)
  --accent: #fa520f
  --accent-foreground: #ffffff
  --destructive: #ef4444
  --destructive-foreground: #ffffff
  --border: hsl(30, 15%, 22%) (warm dark border)
  --input: hsl(30, 12%, 20%)
  --ring: #fa520f
  (chart, sidebar, quadrant, status: warm-shifted dark equivalents)
  ```

  **Also update:**
  - Scrollbar colors to warm tones
  - `.skip-to-content` background to use `var(--primary)`
  - Remove any oklch references — convert all to hex or hsl for consistency with DESIGN.md spec

- **Acceptance:** `npm run build` passes. All CSS variables resolve. Light mode background is #fffaeb. Dark mode background is #1f1f1f. No oklch values remain in globals.css.

#### Step 1.2: Tailwind Config
- **File:** `/home/sil/ccmc-redesign/tailwind.config.ts`
- **Change:**
  - Set `--radius` base to `0.125rem` (2px) — near-zero per DESIGN.md
  - Add custom colors for direct use:
    ```
    mistral: {
      orange: '#fa520f',
      flame: '#fb6424',
      black: '#1f1f1f',
    },
    sunshine: {
      900: '#ff8a00',
      700: '#ffa110',
      500: '#ffb83e',
      300: '#ffd06a',
    },
    cream: '#fff0c2',
    ivory: '#fffaeb',
    'block-gold': '#ffe295',
    'bright-yellow': '#ffd900',
    ```
  - Add golden shadow utility:
    ```
    boxShadow: {
      golden: '-8px 16px 39px rgba(127, 99, 21, 0.12), -33px 64px 72px rgba(127, 99, 21, 0.1), -73px 144px 97px rgba(127, 99, 21, 0.06), -130px 256px 115px rgba(127, 99, 21, 0.02), -203px 400px 126px rgba(127, 99, 21, 0)',
    },
    ```
  - Add font family:
    ```
    fontFamily: {
      sans: ['Arial', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
    },
    ```
  - Add typography scale utilities for display text:
    ```
    fontSize: {
      'display': ['5.125rem', { lineHeight: '1', letterSpacing: '-2.05px' }],
      'section': ['3.5rem', { lineHeight: '0.95' }],
      'subheading-lg': ['3rem', { lineHeight: '0.95' }],
      'subheading': ['2rem', { lineHeight: '1.15' }],
      'card-title': ['1.875rem', { lineHeight: '1.2' }],
      'feature': ['1.5rem', { lineHeight: '1.33' }],
    },
    ```
- **Acceptance:** Tailwind classes `bg-mistral-orange`, `shadow-golden`, `text-display`, `font-sans` all resolve. Border-radius `rounded-sm` = 0px, `rounded-md` = 0.0625rem, `rounded-lg` = 0.125rem (all near-zero).

#### Step 1.3: Layout Font Swap
- **File:** `/home/sil/ccmc-redesign/src/app/layout.tsx`
- **Change:**
  - Remove `import { Inter } from "next/font/google"` and the `inter` variable
  - Remove `${inter.className}` from body className
  - Body className becomes: `"font-sans antialiased"` (picks up Arial from Tailwind config)
- **Acceptance:** Page renders with Arial font stack. No Inter font loaded in network tab.

---

### Phase 2: Primitive Components (ui/*) — PARALLELIZABLE after Phase 1

Each task below is independent. All reference files under `/home/sil/ccmc-redesign/src/components/ui/`.

#### Step 2.1: Button
- **File:** `/home/sil/ccmc-redesign/src/components/ui/button.tsx`
- **Change:**
  - Base class: replace `rounded-md` with `rounded-sm`, replace `font-medium` with `font-normal`, add `uppercase` for DESIGN.md formality
  - Variant `default`: keep `bg-primary text-primary-foreground` (now resolves to Mistral Black + white)
  - Variant `destructive`: unchanged (inherits warm destructive from tokens)
  - Variant `outline`: change to `border border-border bg-cream text-foreground` — cream surface button from DESIGN.md
  - Variant `secondary`: keep `bg-secondary text-secondary-foreground` (now cream)
  - Variant `ghost`: change to `bg-black/[0.04] text-foreground opacity-80 hover:opacity-100` — DESIGN.md ghost spec
  - Variant `link`: change to `text-foreground underline-offset-4 hover:underline` — text/underline from DESIGN.md (not primary colored)
  - Size `default`: change to `h-10 px-3 py-3` (12px padding per DESIGN.md)
  - Size adjustments: all sizes replace `rounded-md` with `rounded-sm`
- **Acceptance:** Default button renders as dark (#1f1f1f) background, white text, sharp corners, uppercase label, weight 400.

#### Step 2.2: Badge
- **File:** `/home/sil/ccmc-redesign/src/components/ui/badge.tsx`
- **Change:**
  - Base: replace `rounded-md` with `rounded-sm`, replace `font-semibold` with `font-normal`
  - Variant `default`: inherits primary (Mistral Black bg)
  - Variant `secondary`: inherits secondary (Cream bg)
  - Add variant `accent`: `border-transparent bg-mistral-orange text-white` for orange badges
- **Acceptance:** Badges have sharp corners, normal weight text.

#### Step 2.3: Card
- **File:** `/home/sil/ccmc-redesign/src/components/ui/card.tsx`
- **Change:**
  - Card base: replace `rounded-xl` with `rounded-none` (sharp architectural corners), replace `shadow-sm` with `shadow-golden` for golden shadow, remove `border` (DESIGN.md: containers defined by background color, minimal borders)
  - CardTitle: replace `font-semibold` with `font-normal text-subheading` or just `font-normal` — hierarchy from size not weight
- **Acceptance:** Cards render with warm golden multi-layer shadow, no border-radius, no visible border.

#### Step 2.4: Input
- **File:** `/home/sil/ccmc-redesign/src/components/ui/input.tsx`
- **Change:** replace `rounded-md` with `rounded-sm`
- **Acceptance:** Inputs have near-zero border-radius.

#### Step 2.5: Dialog
- **File:** `/home/sil/ccmc-redesign/src/components/ui/dialog.tsx`
- **Change:**
  - DialogOverlay: replace `bg-black/60` with `bg-mistral-black/60`
  - DialogContent: replace `rounded-xl` with `rounded-sm`, replace `shadow-xl` with `shadow-golden`
  - DialogTitle: replace `font-semibold` with `font-normal`
- **Acceptance:** Dialog modal has sharp corners, golden shadow.

#### Step 2.6: Tabs
- **File:** `/home/sil/ccmc-redesign/src/components/ui/tabs.tsx`
- **Change:**
  - TabsList: replace `rounded-lg` with `rounded-sm`, change `bg-muted` (now Cream)
  - TabsTrigger: replace `rounded-md` with `rounded-sm`, replace `font-medium` with `font-normal uppercase text-xs tracking-wider`
- **Acceptance:** Tabs have sharp corners, uppercase labels.

#### Step 2.7: Select
- **File:** `/home/sil/ccmc-redesign/src/components/ui/select.tsx`
- **Change:**
  - SelectTrigger: replace `rounded-md` with `rounded-sm`
  - SelectContent: replace `rounded-lg` with `rounded-sm`, replace `shadow-xl` with `shadow-golden`
  - SelectItem: replace `rounded-md` with `rounded-sm`
- **Acceptance:** Select dropdowns have sharp corners, golden shadow.

#### Step 2.8: Tooltip
- **File:** `/home/sil/ccmc-redesign/src/components/ui/tooltip.tsx`
- **Change:** Replace any `rounded-*` with `rounded-sm`
- **Acceptance:** Sharp tooltip corners.

#### Step 2.9: Popover
- **File:** `/home/sil/ccmc-redesign/src/components/ui/popover.tsx`
- **Change:** Replace `rounded-*` with `rounded-sm`, replace shadow with `shadow-golden`
- **Acceptance:** Sharp popover corners.

#### Step 2.10: Dropdown Menu
- **File:** `/home/sil/ccmc-redesign/src/components/ui/dropdown-menu.tsx`
- **Change:** Replace all `rounded-*` with `rounded-sm`, replace shadows with `shadow-golden`
- **Acceptance:** Dropdown renders with sharp corners.

#### Step 2.11: Context Menu
- **File:** `/home/sil/ccmc-redesign/src/components/ui/context-menu.tsx`
- **Change:** Same pattern as dropdown-menu — sharp corners, golden shadow.
- **Acceptance:** Context menu sharp corners.

#### Step 2.12: Command
- **File:** `/home/sil/ccmc-redesign/src/components/ui/command.tsx`
- **Change:** Replace `rounded-*` with `rounded-sm`, update shadow.
- **Acceptance:** Command palette sharp corners.

#### Step 2.13: Collapsible, Label, Scroll Area, Separator, Skeleton, Switch, Textarea, Tip
- **Files:** All remaining in `/home/sil/ccmc-redesign/src/components/ui/`
- **Change per file:**
  - Replace any `rounded-*` variants with `rounded-sm` or `rounded-none`
  - Replace any `font-semibold`/`font-medium` with `font-normal`
  - Skeleton: replace `rounded-md` with `rounded-sm`
  - Switch: sharp corners, accent color for checked state
  - Textarea: `rounded-sm`
- **Acceptance:** Every UI primitive uses near-zero radius and weight 400.

---

### Phase 3: Layout Shells & Navigation — PARALLELIZABLE after Phase 1

#### Step 3.1: Layout Shell
- **File:** `/home/sil/ccmc-redesign/src/components/layout-shell.tsx`
- **Change:**
  - Offline banner: replace `rounded-md` with `rounded-sm`
  - All layout classes inherit from tokens (bg-background etc) — will auto-update
  - Verify no hardcoded colors
- **Acceptance:** Layout renders with warm ivory background. Offline banner has sharp corners.

#### Step 3.2: App Sidebar
- **File:** `/home/sil/ccmc-redesign/src/components/app-sidebar.tsx`
- **Change:**
  - NavLink: replace `rounded-lg` with `rounded-sm`
  - Section labels already use `uppercase tracking-wider` — keep
  - Replace `font-semibold` with `font-normal` in section headers and nav labels
  - All `bg-sidebar-*` classes will inherit warm tokens automatically
  - Mobile sidebar: replace `shadow-2xl` with `shadow-golden`
- **Acceptance:** Sidebar renders on Cream (#fff0c2) background. Nav items have sharp corners. No bold/semibold text.

#### Step 3.3: Command Bar
- **File:** `/home/sil/ccmc-redesign/src/components/command-bar.tsx`
- **Change:**
  - Container input area: replace `rounded-lg` with `rounded-sm`
  - Suggestion dropdown: replace `rounded-lg` with `rounded-sm`, `shadow-lg` with `shadow-golden`
  - Task results dropdown: same treatment
  - `hover:text-amber-500` on lightbulb icon — replace with `hover:text-mistral-orange`
  - Header: `bg-background/80 backdrop-blur-md` will auto-update to warm ivory
- **Acceptance:** Command bar has sharp corners, golden shadows on dropdowns, warm background.

#### Step 3.4: Breadcrumb Nav
- **File:** `/home/sil/ccmc-redesign/src/components/breadcrumb-nav.tsx`
- **Change:**
  - Replace `font-medium` with `font-normal` on active breadcrumb
  - Colors inherit from tokens automatically
- **Acceptance:** Breadcrumbs render in Mistral Black text, no bold weight.

#### Step 3.5: Theme Provider & Toggle
- **Files:**
  - `/home/sil/ccmc-redesign/src/components/theme-provider.tsx`
  - `/home/sil/ccmc-redesign/src/components/theme-toggle.tsx`
- **Change:**
  - ThemeProvider: keep as-is (next-themes with class attribute)
  - ThemeToggle: keep functionality, update only if any hardcoded colors
- **Acceptance:** Theme toggle switches between warm light and warm dark modes.

#### Step 3.6: Sidebar Footer
- **File:** `/home/sil/ccmc-redesign/src/components/sidebar-footer.tsx`
- **Change:**
  - Replace `rounded-md` with `rounded-sm`
  - Replace `font-semibold`/`font-medium` with `font-normal`
  - Replace `text-red-500/60 hover:text-red-400 hover:bg-red-500/10` with warm destructive colors
- **Acceptance:** Footer renders with sharp corners, weight 400.

#### Step 3.7: Workspace Switcher
- **File:** `/home/sil/ccmc-redesign/src/components/workspace-switcher.tsx`
- **Change:**
  - Replace hardcoded color palette (`#6366f1`, `#f59e0b`, `#10b981`, `#f43f5e`, `#0ea5e9`, `#8b5cf6`) with warm-spectrum colors:
    ```
    { label: "Orange", value: "#fa520f" },
    { label: "Amber", value: "#ffa110" },
    { label: "Gold", value: "#ffd900" },
    { label: "Flame", value: "#fb6424" },
    { label: "Sunshine", value: "#ffb83e" },
    { label: "Black", value: "#1f1f1f" },
    ```
  - Default color: `#fa520f` instead of `#6366f1`
- **Acceptance:** Workspace color picker only shows warm-spectrum colors. No blue/green/purple options.

---

### Phase 4: Page-Level Components & Screens — PARALLELIZABLE after Phases 1-2

#### Step 4.1: Dashboard Page
- **File:** `/home/sil/ccmc-redesign/src/app/page.tsx`
- **Change:**
  - Replace all `font-bold`/`font-semibold` with `font-normal`
  - Welcome screen icon container: replace `rounded-2xl` with `rounded-sm`
  - Welcome cards: replace `bg-blue-500/10`, `text-blue-500`, `bg-green-500/10`, `text-green-500`, `bg-purple-500/10`, `text-purple-500` with warm equivalents (use `bg-mistral-orange/10`, `text-mistral-orange`, `bg-sunshine-700/10`, `text-sunshine-700`, etc.)
  - Automation card: replace `border-green-500/20 bg-green-500/5` with `bg-sunshine-700/10 border-sunshine-700/20` when running; status dot replace `bg-green-500` with `bg-sunshine-700`
  - Attention card: replace `border-yellow-500/20 bg-yellow-500/5` with `border-mistral-orange/20 bg-mistral-orange/5`; heading `text-yellow-500` → `text-mistral-orange`
  - Crew status indicators: `bg-red-500` → `bg-destructive`, `bg-amber-500` → `bg-sunshine-700`, `bg-blue-500` → `bg-mistral-orange`
  - Replace `rounded-lg` with `rounded-sm` throughout
  - Replace `rounded-full` on status dots — keep (dots are semantic, radius OK)
- **Acceptance:** Dashboard renders with zero cool colors. All cards warm ivory/cream. All text weight 400.

#### Step 4.2: Project Dialog
- **File:** `/home/sil/ccmc-redesign/src/components/project-dialog.tsx`
- **Change:**
  - Replace hardcoded color array (`#6366f1`, `#8b5cf6`, `#ec4899`, `#f43f5e`, `#f97316`, `#eab308`, `#22c55e`, `#06b6d4`) with warm spectrum:
    ```
    "#fa520f", "#fb6424", "#ff8105", "#ffa110", "#ffb83e", "#ffd06a", "#ffd900", "#1f1f1f"
    ```
- **Acceptance:** Project color picker shows only warm colors.

#### Step 4.3: Settings Page
- **File:** `/home/sil/ccmc-redesign/src/app/settings/page.tsx`
- **Change:**
  - Replace hardcoded accent color array (lines 23-32) with warm spectrum (same as Step 4.2)
  - Default color: `#fa520f` instead of `#6366f1`
- **Acceptance:** Settings accent picker shows warm colors only.

#### Step 4.4: Global Error & Not Found
- **Files:**
  - `/home/sil/ccmc-redesign/src/app/global-error.tsx`
  - `/home/sil/ccmc-redesign/src/app/not-found.tsx`
  - `/home/sil/ccmc-redesign/src/app/error.tsx`
- **Change:**
  - global-error.tsx: replace hardcoded `backgroundColor: "#0a0a0a"` with `#1f1f1f`, `color: "#fafafa"` with `#fffaeb`, `stroke="#ef4444"` with `stroke="#fa520f"`
  - not-found: replace `font-semibold` with `font-normal`
  - error.tsx: check for hardcoded colors, replace
- **Acceptance:** Error pages use Mistral Black background, warm ivory text.

#### Step 4.5: Task Card
- **File:** `/home/sil/ccmc-redesign/src/components/task-card.tsx`
- **Change:**
  - Replace `rounded-lg` with `rounded-sm`
  - Progress bar: replace `bg-green-500/70` with `bg-sunshine-700`, `via-green-500/20` shimmer with `via-sunshine-700/20`
  - Keep `rounded-full` on status dots and avatar circles (semantic shapes)
  - Replace `font-medium`/`font-semibold` with `font-normal`
- **Acceptance:** Task cards have sharp corners, warm progress bar colors.

#### Step 4.6: Eisenhower Summary
- **File:** `/home/sil/ccmc-redesign/src/components/eisenhower-summary.tsx`
- **Change:**
  - Replace `rounded-lg` with `rounded-sm`
  - Replace `font-bold`/`font-semibold` with `font-normal`
  - Quadrant colors inherit from tokens (--quadrant-*) — auto-updated
- **Acceptance:** Matrix renders with warm quadrant colors, sharp corners.

#### Step 4.7: Empty State & Error State
- **Files:**
  - `/home/sil/ccmc-redesign/src/components/empty-state.tsx`
  - `/home/sil/ccmc-redesign/src/components/error-state.tsx`
- **Change:**
  - empty-state: replace `rounded-full` on icon container with `rounded-sm`
  - error-state: check for hardcoded colors
- **Acceptance:** Consistent sharp geometry on empty/error states.

#### Step 4.8: Search Dialog
- **File:** `/home/sil/ccmc-redesign/src/components/search-dialog.tsx`
- **Change:**
  - Replace `bg-amber-500/20 text-amber-400` with `bg-mistral-orange/20 text-mistral-orange`
  - Replace all `rounded` with `rounded-sm`
  - Replace `font-medium` with `font-normal`
- **Acceptance:** Search results use warm accent colors.

#### Step 4.9: Agent Console
- **File:** `/home/sil/ccmc-redesign/src/components/agent-console.tsx`
- **Change:**
  - Replace `rounded-lg` with `rounded-sm`
  - Replace `font-medium` with `font-normal`
- **Acceptance:** Console has sharp corners.

#### Step 4.10: Remaining Feature Components (batch)
- **Files:** All remaining in `/home/sil/ccmc-redesign/src/components/`:
  - `agent-form.tsx`, `board-view.tsx`, `confirm-dialog.tsx`, `create-task-dialog.tsx`,
    `decision-dialog.tsx`, `markdown-content.tsx`, `mention-textarea.tsx`,
    `mission-progress.tsx`, `project-card-large.tsx`, `project-detail-page.tsx`,
    `run-button.tsx`, `skill-form.tsx`, `task-form.tsx`, `skeletons.tsx`
- **Change per file:**
  - Replace `rounded-lg`/`rounded-xl`/`rounded-2xl` with `rounded-sm`
  - Replace `font-bold`/`font-semibold`/`font-medium` with `font-normal` (except `font-mono`)
  - Replace any hardcoded cool colors (blue/purple/indigo) with warm equivalents
  - Keep `rounded-full` ONLY on: status dots, avatars, progress bar tracks
- **Acceptance:** No cool colors visible. All corners sharp. All text weight 400.

#### Step 4.11: Remaining Page Routes (batch)
- **Files:** All page.tsx under `/home/sil/ccmc-redesign/src/app/`:
  - `activity/page.tsx`, `autopilot/page.tsx`, `brain-dump/page.tsx`,
    `crew/page.tsx`, `crew/[id]/page.tsx`, `crew/[id]/edit/page.tsx`, `crew/new/page.tsx`,
    `documents/page.tsx`, `initiatives/page.tsx`, `initiatives/[id]/page.tsx`,
    `logs/page.tsx`, `priority-matrix/page.tsx`,
    `projects/page.tsx`, `projects/[id]/page.tsx`,
    `settings/page.tsx` (beyond color picker fix in 4.3),
    `skills/page.tsx`, `skills/[id]/page.tsx`, `skills/new/page.tsx`,
    `tasks/[id]/page.tsx`
  - Also: `loading.tsx`
- **Change per file:**
  - Replace `font-bold`/`font-semibold` with `font-normal`
  - Replace `rounded-lg`/`rounded-xl` with `rounded-sm`
  - Replace any hardcoded Tailwind colors (`text-blue-*`, `text-green-*`, `bg-indigo-*`, etc.) with warm equivalents using the custom palette
  - Autopilot page has heavy green usage (running states) — replace with sunshine-700 amber
  - Replace `shadow-lg`/`shadow-xl` with `shadow-golden` where cards are elevated
- **Acceptance:** Every page renders in warm palette. No blue/purple/indigo/cool-green visible anywhere.

---

### Phase 5: Review & Polish — SEQUENTIAL after Phase 4

#### Step 5.1: Visual Audit
- **Scope:** Load every route in browser, screenshot, verify against DESIGN.md
- **Checklist:**
  - [ ] Background is #fffaeb (Warm Ivory), never pure white
  - [ ] All text is weight 400, no bold anywhere
  - [ ] All corners near-zero (except status dots/avatars)
  - [ ] Golden multi-layer shadows on elevated cards
  - [ ] Mistral Black (#1f1f1f) for all text, never pure #000
  - [ ] No cool colors (blue/purple/green as accent) visible
  - [ ] Dark mode uses warm dark palette, not navy
  - [ ] Focus rings use Mistral Orange
  - [ ] Scrollbars warm-tinted
- **Agent type:** general-purpose (reviewer)
- **Acceptance:** All checklist items pass.

#### Step 5.2: Hardcoded Color Sweep
- **Scope:** `grep -r` for any remaining:
  - `#[0-9a-fA-F]{6}` in src/ that isn't in a warm range
  - `oklch(` references (should all be removed)
  - Tailwind classes: `text-blue-`, `bg-blue-`, `text-indigo-`, `bg-purple-`, `text-green-` (except success)
  - Inline `style=` with color values
- **Acceptance:** Zero cool-color references outside of universally-understood semantic colors (green for "success/done").

#### Step 5.3: Build Verification
- **Command:** `npm run build && npm run lint`
- **Acceptance:** Clean build, no lint errors, no type errors.

---

## Risks

1. **Dark mode (HIGH):** DESIGN.md has no dark mode spec. Warm dark palette is extrapolated, not specified. May need designer review. Mitigation: implement warm dark as best-guess, flag for iteration.

2. **Semantic color loss (MEDIUM):** Replacing ALL colors with warm tones may reduce distinguishability of status indicators (e.g., quadrant colors all become amber shades). Mitigation: keep green for "done/success", use saturation/lightness differences within warm spectrum for other states.

3. **Font weight regression (MEDIUM):** ~30+ files use font-bold/semibold/medium. Mass replacement to font-normal may reduce readability in dense data views (task lists, tables). Mitigation: allow `font-medium` (500) as a fallback if 400 proves too light in data-dense contexts.

4. **Hardcoded colors outside src/ (LOW):** Some colors may be in config files, SVGs, or public assets not scanned. Mitigation: Phase 5 sweep.

5. **Third-party component styles (LOW):** sonner toaster, Radix primitives may have internal styles that don't respect CSS variables. Mitigation: test each primitive after Phase 2.

6. **Golden shadow performance (LOW):** 5-layer box-shadow may cause paint performance issues on mobile with many cards. Mitigation: consider reducing to 3 layers on mobile via media query if profiling shows issues.

---

## Open Questions (Need User Decision)

1. **Dark mode strategy:** Keep warm dark mode (recommended)? Remove entirely? Keep navy?
2. **Font weight strictness:** Pure 400 everywhere per DESIGN.md, or allow 500 for data-dense views?
3. **Success color:** Keep universal green (#22c55e) for done/success, or shift to warm green?
4. **Display typography usage:** Should any existing headings use the 82px display size, or save that for a future marketing/hero page?
5. **Gradient block identity:** Should the Mistral gradient block (yellow→orange row) be added to the sidebar header or command bar as a brand element?

---

## Critical Files for Implementation

1. `/home/sil/ccmc-redesign/src/app/globals.css` — ALL CSS variables live here. Single most impactful file. Every token change cascades everywhere.
2. `/home/sil/ccmc-redesign/tailwind.config.ts` — Custom colors, shadows, fonts, radii. Second most impactful.
3. `/home/sil/ccmc-redesign/src/components/ui/button.tsx` — Most-used primitive. Defines variant system. Template for all other ui/* changes.
4. `/home/sil/ccmc-redesign/src/components/ui/card.tsx` — Golden shadow and sharp corners. Most visible change.
5. `/home/sil/ccmc-redesign/src/app/page.tsx` — Dashboard is first screen users see. Heaviest concentration of hardcoded cool colors.

---

## Task Dependency Graph

```
Phase 1 (sequential):
  1.1 globals.css ─┬─→ 1.2 tailwind.config.ts ─→ 1.3 layout font swap
                   │
Phase 2 (parallel, after 1.1+1.2):
  ├── 2.1 button
  ├── 2.2 badge
  ├── 2.3 card
  ├── 2.4 input
  ├── 2.5 dialog
  ├── 2.6 tabs
  ├── 2.7 select
  ├── 2.8 tooltip
  ├── 2.9 popover
  ├── 2.10 dropdown-menu
  ├── 2.11 context-menu
  ├── 2.12 command
  └── 2.13 remaining ui/*

Phase 3 (parallel, after 1.1+1.2):
  ├── 3.1 layout-shell
  ├── 3.2 app-sidebar
  ├── 3.3 command-bar
  ├── 3.4 breadcrumb-nav
  ├── 3.5 theme provider/toggle
  ├── 3.6 sidebar-footer
  └── 3.7 workspace-switcher

Phase 4 (parallel, after Phase 1+2):
  ├── 4.1 dashboard page
  ├── 4.2 project-dialog
  ├── 4.3 settings page
  ├── 4.4 error pages
  ├── 4.5 task-card
  ├── 4.6 eisenhower-summary
  ├── 4.7 empty/error state
  ├── 4.8 search-dialog
  ├── 4.9 agent-console
  ├── 4.10 remaining components (batch)
  └── 4.11 remaining pages (batch)

Phase 5 (sequential, after Phase 4):
  5.1 visual audit → 5.2 hardcoded sweep → 5.3 build verification
```

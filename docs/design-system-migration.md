# Design System Migration Plan

Prioritized, executable plan. Close audit gaps. Enforce CCMC-Redesign DESIGN.md.

## Phase 1: Token Foundations
**Goal**: Fix corrupt CSS vars, establish elevations, dark mode parity root.
**Files**: ~2 (`globals.css`, `tailwind.config.ts`)
**Risk**: High (Global CSS)
**Parallelizable**: No

### Actions
1. **State tokens** (new). Add to `globals.css` `:root` and `.dark`:
   - `--state-disabled-opacity: 0.5;`
   - `--state-hover-overlay-light: rgba(0,0,0,0.05);` / dark `rgba(255,255,255,0.10);`
   - `--ring-width-input: 1px;` / `--ring-width-interactive: 2px;`
2. **Motion tokens** (new). Add `--motion-fast: 100ms; --motion-base: 150ms; --motion-slow: 300ms;` plus matching `theme.extend.transitionDuration` in `tailwind.config.ts`.
3. **Z-index tokens** (new). Add `--z-sticky: 10; --z-sidebar: 30; --z-overlay: 40; --z-float: 50;`.
4. **Elevation tiers** (new). `theme.extend.boxShadow` keys: `e-0`, `e-1`, `e-2`, `e-3`, `e-4`, `e-5` mapping to existing `shadow-golden` + variants. Document `.dark .shadow-golden` override carry-over.
5. **Typography variables**. Confirm `Arial` stack in `tailwind.config.ts` `theme.extend.fontFamily`.
6. **Confirm radius**. `--radius: 0.125rem` already in `:root`.

## Phase 2: Primitive Normalization
**Goal**: Align primitives to DESIGN.md component contracts.
**Files**: ~10 (`src/components/ui/*.tsx`)
**Risk**: Medium
**Parallelizable**: Yes

### Actions
1. **Button (`button.tsx`)** (Audit 06-components):
   - Change `disabled:opacity-60` to `disabled:opacity-50`.
   - Purge `rounded-md`. Enforce `rounded-sm`.
2. **Card (`card.tsx`)** (Audit 06-components):
   - Update `CardTitle` className: add `text-lg`. Match `DialogTitle`.
   - Export missing `CardFooter`.
3. **Badge (`badge.tsx`)** (Audit 05-elevation):
   - Standardize focus ring. Use `ring-offset-2` to match interactive elements.
   - Enforce padding: `px-2.5 py-0.5`.
4. **Dialog (`dialog.tsx`)** (Audit 03-spacing):
   - Standardize max widths. Replace hardcoded dialog limits with `sm:max-w-sm md:max-w-md lg:max-w-lg`.
   - Enforce `p-6` across content.

## Phase 3: Page-Level Cleanup
**Goal**: Eradicate arbitrary values, negative margins, hardcoded widths.
**Files**: ~15 (`src/app/**/*.tsx`)
**Risk**: Low
**Parallelizable**: Yes

### Actions
1. **Magic Widths** (Audit 03-spacing). Find `max-w-[1400px]` in `tasks/[id]/page.tsx`. Replace with `max-w-screen-lg`.
2. **Arbitrary Heights** (Audit 03-spacing). Sweep `h-[300px]`, `max-h-[420px]` in logs. Move to responsive `h-full` or `vh`.
3. **Negative Margins** (Audit 03-spacing). Fix `-mx-1` button hacks in task forms. Fix padding hierarchy instead.
4. **Border Radius**. Search `src/` for `rounded-md` and `rounded-lg`. Replace with `rounded-sm`.

## Phase 4: Dark Mode Parity Fixes
**Goal**: Close 70% gap in dark mode coverage (Audit 20-dark).
**Files**: ~8
**Risk**: Low
**Parallelizable**: Yes

### Actions
1. **Capture Button (`src/app/brain-dump/page.tsx`)**:
   - Fix `bg-mistral-orange` -> `bg-mistral-orange dark:bg-mistral-orange/85`.
2. **Status Indicators**:
   - Audit `text-amber-500`, `text-sunshine-700` usages (Logs, Activity, Tasks).
   - Migrate to `--status-warning` semantic tokens or add `dark:` variants.
3. **Error Colors**:
   - Replace raw `text-red-500` with `text-destructive`.
4. **Corrupt Variables**:
   - Fix `$T` template artifacts in `markdown-content.tsx` and `app-sidebar.tsx`.

## Phase 5: Documentation & Registry
**Goal**: Future-proof token system for type-safe consumption.
**Files**: ~1 (`src/lib/design-tokens.ts`)
**Risk**: Zero
**Parallelizable**: Yes

### Actions
1. **Create Token Export**: Build TS module exporting exact hex values and breakpoints for JS-space usage.
2. **Pattern Wrappers**: Scaffold missing primitives found in audit: `<PageHeader>`, `<DangerZoneCard>`.
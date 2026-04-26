# CCMC Redesign: Design Consistency Audit
**Date:** 2026-04-26
**Scope:** `/home/sil/ccmc-redesign/src/*`

## 1. Elevation & Shadows (Severity: P1)
**Issue:** Usage of standard Tailwind shadows (`shadow-md`, `shadow-lg`, `shadow-xs`) conflicts with the custom `e-1` to `e-5` golden shadow scale.
**Violations:**
- `/home/sil/ccmc-redesign/src/components/ui/switch.tsx:15` (`shadow-xs` on base)
- `/home/sil/ccmc-redesign/src/components/ui/switch.tsx:22` (`shadow-lg` on thumb)
- `/home/sil/ccmc-redesign/src/components/task-card.tsx:134,135` (`hover:shadow-md`, `shadow-lg` on drag)
- `/home/sil/ccmc-redesign/src/components/task-card.tsx:146` (`shadow-md`)
- `/home/sil/ccmc-redesign/src/components/eisenhower-summary.tsx:57` (`hover:shadow-lg`)
- `/home/sil/ccmc-redesign/src/app/page.tsx:412` (`hover:shadow-lg`)
**Recommendation:** Replace all standard shadows with `shadow-e-1` to `shadow-e-5` tokens. Switch thumb should likely be `shadow-e-1` or `shadow-e-2`.

## 2. Color Tokens & Broken Variables (Severity: P0)
**Issue:** Reference to undefined `mistral-black` color token, causing transparent backgrounds and default text colors. Missing dark mode overrides on hardcoded colors.
**Violations:**
- `/home/sil/ccmc-redesign/src/components/ui/button.tsx:12` (`dark:text-mistral-black` on default variant)
- `/home/sil/ccmc-redesign/src/components/ui/badge.tsx:9,11` (`dark:text-mistral-black` on default/destructive)
- `/home/sil/ccmc-redesign/src/components/ui/dialog.tsx:20` (`bg-mistral-black/60` on overlay)
- `/home/sil/ccmc-redesign/src/components/ui/badge.tsx:15` (`bg-mistral-orange` with no `dark:` override)
**Recommendation:** Remove `mistral-black` references. Use `--primary-foreground` for button/badge text. Change Dialog overlay to `bg-black/50`. Add `dark:bg-mistral-orange/85` to badge accent.

## 3. Form & Interactive States (Severity: P1)
**Issue:** Inconsistent focus rings. `DESIGN.md` requires removing offsets to standard `ring-2` (or `ring-1` for inputs).
**Violations:**
- `/home/sil/ccmc-redesign/src/components/ui/tabs.tsx:31,46` (`ring-offset-background`)
- `/home/sil/ccmc-redesign/src/components/ui/switch.tsx:15` (`focus-visible:ring-offset-2 focus-visible:ring-offset-background`)
- `/home/sil/ccmc-redesign/src/components/ui/dialog.tsx:43` (`ring-offset-background`)
- `/home/sil/ccmc-redesign/src/components/ui/select.tsx:19` (`ring-offset-background`)
- `/home/sil/ccmc-redesign/src/components/ui/badge.tsx:6` (`focus:ring-offset-2`)
**Recommendation:** Strip `ring-offset-*` utilities. Rely purely on `focus-visible:ring-1` or `focus-visible:ring-2`.

## 4. Typography Scale (Severity: P2)
**Issue:** Hardcoded `text-2xl` used instead of semantic `text-display` or `text-section` headers.
**Violations:**
- `/home/sil/ccmc-redesign/src/app/logs/page.tsx:279` (`text-2xl font-normal tracking-tight`)
- `/home/sil/ccmc-redesign/src/app/page.tsx:328` (`text-2xl font-normal`)
- `/home/sil/ccmc-redesign/src/app/autopilot/page.tsx` (multiple `text-2xl font-normal`)
**Recommendation:** Implement `text-section` utility in Tailwind and replace `text-2xl` on page headers.

## 5. Spacing & Card Padding (Severity: P2)
**Issue:** Widespread overriding of the `p-6` Card padding mandate.
**Violations:**
- `/home/sil/ccmc-redesign/src/app/brain-dump/page.tsx:219` (`CardContent className="p-4"`)
- `/home/sil/ccmc-redesign/src/app/page.tsx:340,357,371` (`p-4`)
- `/home/sil/ccmc-redesign/src/app/crew/[id]/page.tsx:305,313,321` (`p-4`)
**Recommendation:** Remove `p-4` overrides from `<CardContent>` to let default `p-6` apply.

## 6. Iconography Scale (Severity: P2)
**Issue:** Incorrect sizing on empty state and action icons. Spec requires `size-5` (20px) for empty states and section headers.
**Violations:**
- `/home/sil/ccmc-redesign/src/app/not-found.tsx:9` (`h-6 w-6`)
- `/home/sil/ccmc-redesign/src/app/error.tsx:55` (`h-6 w-6`)
- `/home/sil/ccmc-redesign/src/app/skills/page.tsx:29` (`h-6 w-6`)
**Recommendation:** Convert `h-6 w-6` to `size-5` (`h-5 w-5`) in empty states.

## 7. Z-Index and Modal Backdrops (Severity: P2)
**Issue:** Dialog overlay uses incorrect z-index vs the semantic spec (`z-40` requested).
**Violations:**
- `/home/sil/ccmc-redesign/src/components/ui/dialog.tsx:20` (`z-50`)
**Recommendation:** Change `DialogOverlay` to `z-40`. (Keep `DialogContent` at `z-50`).

## 8. Lists & Translucency (Severity: P2)
**Issue:** Use of static or generic translucent backgrounds instead of `-soft` or standard `accent` states.
**Violations:**
- `/home/sil/ccmc-redesign/src/app/autopilot/page.tsx:425` (`hover:bg-muted/30` on list item)
**Recommendation:** Use `hover:bg-accent` or a dedicated semantic token instead of raw muted overlays.

## Clean Areas (Pass)
- **Border Radius:** 100% compliant. No `rounded-md`, `lg`, `xl` found.
- **Card Primitives:** Properly implemented `shadow-golden` base.
- **Font:** Arial/sans base correctly setup.

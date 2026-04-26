/**
 * Design token registry.
 * Source of truth: src/app/globals.css (:root and .dark).
 * Use these for JS-space color access (charts, canvas, dynamic gradients).
 * For CSS/JSX, prefer Tailwind classes that bind to CSS vars.
 */

export const palette = {
	mistral: {
		orange: "#fa520f",
		flame: "#fb6424",
		black: "#1f1f1f",
	},
	sunshine: {
		300: "#ffd06a",
		500: "#ffb83e",
		700: "#ffa110",
		900: "#ff8a00",
	},
	cream: "#fff0c2",
	ivory: "#fffaeb",
	blockGold: "#ffe295",
	brightYellow: "#ffd900",
} as const;

export const motion = {
	fast: 100,
	base: 150,
	slow: 300,
	easing: "cubic-bezier(0, 0, 0.2, 1)",
} as const;

export const elevation = {
	e0: "none",
	e1: "shadow-e-1",
	e2: "shadow-e-2",
	e3: "shadow-e-3",
	e4: "shadow-e-4",
	e5: "shadow-e-5",
} as const;

export const zLayers = {
	sticky: 10,
	sidebar: 30,
	overlay: 40,
	float: 50,
} as const;

export type Palette = typeof palette;
export type Motion = typeof motion;
export type Elevation = typeof elevation;
export type ZLayers = typeof zLayers;
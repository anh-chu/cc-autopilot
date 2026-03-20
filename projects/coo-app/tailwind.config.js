/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        coo: {
          // Light mode (base/default)
          bg: "#FFF8F0",
          surface: "#FFFFFF",
          "surface-elevated": "#FFFFFF",
          divider: "#E8E4DF",
          "text-primary": "#1A2E30",
          "text-secondary": "#5A6B6D",
          "text-tertiary": "#8A9A9C",
          // Dark mode (used with dark: prefix)
          "bg-dark": "#0D2B2E",
          "surface-dark": "#162F32",
          "surface-elevated-dark": "#1D3A3E",
          "divider-dark": "#243F42",
          "text-primary-dark": "#E8E4DF",
          "text-secondary-dark": "#9BAFB3",
          "text-tertiary-dark": "#6B8B8F",
          // Static accent colors (same in both themes)
          primary: "#7BAE8E",
          "primary-pressed": "#5E9474",
          secondary: "#F4A88C",
          neutral: "#E8E4DF",
          // Functional / status
          fed: "#5CB07A",
          approaching: "#E8A545",
          overdue: "#E07A6B",
          info: "#6BA3C7",
          error: "#D4685A",
          // Feeding type colors
          breast: "#7BAE8E",
          bottle: "#6BA3C7",
          solid: "#F4A88C",
          pump: "#A89BC7",
        },
      },
      fontFamily: {
        display: ["Inter_700Bold", "System"],
        "heading-semi": ["Inter_600SemiBold", "System"],
        body: ["Inter_400Regular", "System"],
        "caption-medium": ["Inter_500Medium", "System"],
      },
      fontSize: {
        display: ["32px", { lineHeight: "40px", letterSpacing: "-0.5px" }],
        "heading-lg": ["24px", { lineHeight: "32px", letterSpacing: "-0.3px" }],
        "heading-md": ["20px", { lineHeight: "28px", letterSpacing: "-0.2px" }],
        "body-lg": ["18px", { lineHeight: "26px" }],
        body: ["16px", { lineHeight: "24px" }],
        caption: ["14px", { lineHeight: "20px", letterSpacing: "0.1px" }],
        "caption-sm": ["12px", { lineHeight: "16px", letterSpacing: "0.2px" }],
        timer: ["48px", { lineHeight: "56px", letterSpacing: "-1px" }],
        meter: ["28px", { lineHeight: "36px", letterSpacing: "-0.3px" }],
      },
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "24px",
      },
      spacing: {
        xs: "4px",
        sm: "8px",
        md: "12px",
        base: "16px",
        lg: "24px",
        xl: "32px",
        "2xl": "48px",
      },
    },
  },
  plugins: [],
};

import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Surfaces
        surface: "#060e20",
        "surface-dim": "#060e20",
        "surface-bright": "#1f2b49",
        "surface-container-lowest": "#000000",
        "surface-container-low": "#091328",
        "surface-container": "#0f1930",
        "surface-container-high": "#141f38",
        "surface-container-highest": "#192540",
        "surface-variant": "#192540",
        "surface-tint": "#3bbffa",

        // Text
        "on-surface": "#dee5ff",
        "on-surface-variant": "#a3aac4",
        "on-background": "#dee5ff",

        // Accent
        primary: "#3bbffa",
        "primary-dim": "#05a9e3",
        "primary-fixed": "#2db7f2",
        "primary-container": "#22b1ec",
        "on-primary": "#00374d",
        "on-primary-container": "#002b3d",
        secondary: "#ac8aff",
        "secondary-dim": "#8455ef",
        "secondary-container": "#5516be",
        "on-secondary": "#280067",
        tertiary: "#9bffce",
        "tertiary-dim": "#58e7ab",
        "tertiary-container": "#69f6b8",
        "on-tertiary": "#006443",

        // Status
        error: "#ff716c",
        "error-dim": "#d7383b",
        "error-container": "#9f0519",

        // Outline
        outline: "#6d758c",
        "outline-variant": "#40485d",

        background: "#060e20",
      },
      fontFamily: {
        headline: ["var(--font-space-grotesk)", "Space Grotesk", "sans-serif"],
        body: ["var(--font-inter)", "Inter", "sans-serif"],
        label: ["var(--font-inter)", "Inter", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.125rem",
        lg: "0.5rem",
        xl: "0.75rem",
        "2xl": "1rem",
      },
      backdropBlur: {
        glass: "12px",
      },
      animation: {
        ticker: "ticker 40s linear infinite",
      },
      keyframes: {
        ticker: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
      },
      boxShadow: {
        ambient: "0 0 30px rgba(172, 138, 255, 0.05)",
        "glow-primary": "0 0 24px rgba(59, 191, 250, 0.25)",
        "glow-tertiary": "0 0 24px rgba(155, 255, 206, 0.25)",
      },
    },
  },
  plugins: [],
};
export default config;

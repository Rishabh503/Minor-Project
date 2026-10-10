import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: {
          DEFAULT: "var(--color-canvas, #FBF8F3)",
          subtle: "var(--color-canvas-subtle, #F4EFE6)",
          muted: "var(--color-canvas-muted, #ECE5DA)",
        },
        surface: {
          DEFAULT: "var(--color-surface, #FFFFFF)",
          raised: "var(--color-surface-raised, #FAF7F2)",
          border: "var(--color-surface-border, #E6DEC8)",
        },
        editorial: {
          900: "#08131D",
          800: "#0C1E32",
          700: "#142F4C",
          600: "#1D4167",
          500: "#2B5684",
          100: "#E6EDF5",
          50: "#F1F5F9",
        },
        coral: {
          600: "#CE452A",
          500: "#E85D42",
          400: "#F07E69",
          100: "#FDEEE9",
          50: "#FFF6F4",
        },
        brand: {
          primary: "var(--color-brand-primary, #0C1E32)",
          primaryHover: "var(--color-brand-primary-hover, #142F4C)",
          accent: "var(--color-brand-accent, #E85D42)",
          accentHover: "var(--color-brand-accent-hover, #CE452A)",
          text: "var(--color-text-main, #141A21)",
          muted: "var(--color-text-muted, #5A6675)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "-apple-system", "sans-serif"],
        heading: ["var(--font-heading)", "Georgia", "serif"],
      },
      boxShadow: {
        warm: "0 1px 3px 0 rgba(28, 25, 23, 0.04), 0 1px 2px -1px rgba(28, 25, 23, 0.04)",
        "warm-md": "0 4px 6px -1px rgba(28, 25, 23, 0.06), 0 2px 4px -2px rgba(28, 25, 23, 0.04)",
        "warm-lg": "0 10px 15px -3px rgba(28, 25, 23, 0.08), 0 4px 6px -4px rgba(28, 25, 23, 0.04)",
      },
    },
  },
  plugins: [],
};

export default config;

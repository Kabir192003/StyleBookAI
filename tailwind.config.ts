import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Landing-page scene palette — see docs/PRODUCT_AND_UX.md and the
        // living-background system in components/motion/SceneBackground.
        sb: {
          ivory: "#FBF6EC",
          paper: "#F3ECDD",
          aubergine: "#2B1830",
          ink: "#150F1C",
          violet: "#7C3AED",
          cobalt: "#2A4CE0",
          coral: "#FF6B57",
          peach: "#FFB086",
          mint: "#7FE0C0",
          butter: "#F6D658",
          lilac: "#C9A9E8",
        },
        // App-shell brand tokens — the same luxe-editorial family the
        // landing page defines in app/styles/landing/globals.css (Silk /
        // Pearl / Onyx / Velvet / Champagne / Oxblood), reused here more
        // quietly per docs/PRODUCT_AND_UX.md §4: restrained neutral chrome
        // so product colors stay the thing that pops, one accent used
        // sparingly, light AND dark mode both fully supported. Every value
        // below is a CSS var (see app/globals.css) so `dark:` variants are
        // rarely needed — toggling the `.dark` class on <html> is enough.
        silk: "var(--silk)",
        pearl: "var(--pearl)",
        marble: "var(--marble)",
        onyx: "var(--onyx)",
        champagne: "var(--champagne)",
        bronze: "var(--bronze)",
        app: {
          bg: "var(--app-bg)",
          surface: "var(--app-surface)",
          "surface-hover": "var(--app-surface-hover)",
          border: "var(--app-border)",
          "border-strong": "var(--app-border-strong)",
          text: "var(--app-text)",
          "text-secondary": "var(--app-text-secondary)",
          "text-muted": "var(--app-text-muted)",
          heading: "var(--app-heading)",
          accent: "var(--app-accent)",
          "accent-hover": "var(--app-accent-hover)",
          "accent-soft": "var(--app-accent-soft)",
          danger: "var(--app-danger)",
          "danger-soft": "var(--app-danger-soft)",
          success: "var(--app-success)",
          "cover-bg": "var(--app-cover-bg)",
          "cover-text": "var(--app-cover-text)",
          "cover-text-muted": "var(--app-cover-text-muted)",
          "cover-border": "var(--app-cover-border)",
        },
      },
      fontFamily: {
        "geometric-sans": ["var(--font-geometric-sans)"],
        "editorial-serif": ["var(--font-editorial-serif)"],
        grotesk: ["var(--font-grotesk)"],
        "humanist-sans": ["var(--font-humanist-sans)"],
        "expressive-display": ["var(--font-expressive-display)"],
        mono: ["var(--font-mono-plex)", "ui-monospace", "monospace"],
      },
      backgroundImage: {
        "gold-foil": "var(--app-gold-gradient)",
      },
    },
  },
  plugins: [],
};

export default config;

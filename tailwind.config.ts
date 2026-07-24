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
        // App-shell brand tokens — matched against
        // docs/StyleBook-Design-System.pdf v1.0, not just the landing
        // page's own CSS. See app/globals.css for the full rationale;
        // every value here is a CSS var so `dark:` variants are rarely
        // needed — toggling `.dark` on <html> is enough.
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
          "text-faint": "var(--app-text-faint)",
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
          "glass-primary": "var(--app-glass-primary-bg)",
          "glass-ghost": "var(--app-glass-ghost-bg)",
          "glass-panel": "var(--app-glass-panel-bg)",
        },
      },
      fontFamily: {
        "geometric-sans": ["var(--font-geometric-sans)"],
        "editorial-serif": ["var(--font-editorial-serif)"],
        grotesk: ["var(--font-grotesk)"],
        "humanist-sans": ["var(--font-humanist-sans)"],
        "expressive-display": ["var(--font-expressive-display)"],
        "mono-plex": ["var(--font-mono-plex)"],
        "technical-sans": ["var(--font-technical-sans)"],
        mono: ["var(--font-mono-plex)", "ui-monospace", "monospace"],
      },
      backgroundImage: {
        "gold-foil": "var(--app-gold-gradient)",
      },
      boxShadow: {
        "app-sm": "var(--shadow-sm)",
        "app-md": "var(--shadow-md)",
        "app-lg": "var(--shadow-lg)",
        "app-xl": "var(--shadow-xl)",
      },
      borderColor: {
        "glass-primary": "var(--app-glass-primary-border)",
        "glass-ghost": "var(--app-glass-ghost-border)",
        "glass-panel": "var(--app-glass-panel-border)",
      },
    },
  },
  plugins: [],
};

export default config;

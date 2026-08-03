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
    },
  },
  plugins: [],
};

export default config;

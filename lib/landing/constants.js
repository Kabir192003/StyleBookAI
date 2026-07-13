// ═══════════════════════════════════════════
// Constants & Data
// ═══════════════════════════════════════════

// Browser window positions for the Hero
export const HERO_WINDOWS = [
  {
    id: 'google-fonts',
    title: 'Google Fonts',
    url: 'fonts.google.com',
    style: { top: '8%', left: '5%', width: 280, rotate: -3 },
    floatClass: 'browser-window--float-1',
  },
  {
    id: 'coolors',
    title: 'Coolors',
    url: 'coolors.co/palette',
    style: { top: '12%', right: '8%', width: 260, rotate: 2 },
    floatClass: 'browser-window--float-2',
  },
  {
    id: 'type-scale',
    title: 'Type Scale',
    url: 'typescale.com',
    style: { bottom: '15%', left: '10%', width: 240, rotate: 1.5 },
    floatClass: 'browser-window--float-3',
  },
  {
    id: 'wcag-checker',
    title: 'WCAG Checker',
    url: 'webaim.org/contrast',
    style: { bottom: '18%', right: '5%', width: 250, rotate: -1.5 },
    floatClass: 'browser-window--float-4',
  },
  {
    id: 'brand-guidelines',
    title: 'Brand Guide',
    url: 'brand-guidelines.pdf',
    style: { top: '6%', left: '50%', width: 230, rotate: 0.5, transform: 'translateX(-50%)' },
    floatClass: 'browser-window--float-5',
  },
];

// Toast messages for chaos scene
export const CHAOS_TOASTS = [
  { text: 'Copied #4F46E5', type: 'copy' },
  { text: 'Searching fonts...', type: 'search' },
  { text: 'Checking contrast...', type: 'check' },
  { text: 'Opening theme...', type: 'open' },
  { text: 'Switching tabs...', type: 'switch' },
  { text: 'Copied rgb(34, 197, 94)', type: 'copy' },
  { text: 'Loading type scale...', type: 'search' },
  { text: 'WCAG AA: Pass', type: 'check' },
  { text: 'Downloading PDF...', type: 'open' },
  { text: 'Tab 14 of 23', type: 'switch' },
  { text: 'Copied --spacing-4', type: 'copy' },
  { text: 'Ratio: 4.5:1', type: 'check' },
];

// Workspace modules
export const WORKSPACE_MODULES = [
  { id: 'colors', name: 'Colour Library', desc: 'Thousands of curated palettes', icon: '🎨', angle: -60, distance: 280 },
  { id: 'typography', name: 'Typography', desc: 'Premium font specimens', icon: '✏️', angle: 0, distance: 300 },
  { id: 'themes', name: 'Themes', desc: 'Complete design systems', icon: '🎭', angle: 60, distance: 280 },
  { id: 'a11y', name: 'Accessibility', desc: 'WCAG compliance tools', icon: '♿', angle: 120, distance: 290 },
  { id: 'typescale', name: 'Type Scale', desc: 'Harmonious sizing', icon: '📐', angle: 180, distance: 270 },
  { id: 'ai', name: 'AI Studio', desc: 'Intelligent generation', icon: '✨', angle: -120, distance: 290 },
  { id: 'export', name: 'Export', desc: 'Production-ready output', icon: '📦', angle: -180, distance: 260 },
];

// AI reasoning lines
export const AI_REASONING = [
  'Starting with trust. Gen Z responds to soft, muted palettes that avoid corporate sterility.',
  'Selecting a geometric sans-serif with subtle warmth — approachable but not childish.',
  'Building a type scale with generous line-height for calm readability.',
  'Adding airy spacing tokens — premium brands breathe.',
  'Soft shadows with large blur for depth without weight.',
  'Rounded corners at 12px — friendly, modern, not bubbly.',
];

// AI-generated design tokens
export const AI_COLORS = [
  '#E8D5C4', '#C4A882', '#8B7355', '#5C4E3C', '#2C2520',
  '#D4A574', '#F5EDE4', '#A0C4B8',
];

// Interactive color palettes — muted luxe set; every accent carries white
// text at AA on the preview components.
export const INTERACTIVE_PALETTES = [
  { name: 'Velvet',     h: 227, s: 41, l: 27 },
  { name: 'Champagne',  h: 37,  s: 48, l: 42 },
  { name: 'Terracotta', h: 18,  s: 55, l: 42 },
  { name: 'Forest',     h: 152, s: 32, l: 28 },
  { name: 'Plum',       h: 322, s: 32, l: 33 },
  { name: 'Ocean',      h: 202, s: 60, l: 32 },
  { name: 'Slate',      h: 215, s: 18, l: 38 },
  { name: 'Onyx',       h: 240, s: 12, l: 13 },
];

// Interactive fonts — real families loaded via next/font (lib/landing/fonts.ts)
export const INTERACTIVE_FONTS = [
  { name: 'Inter', family: 'var(--font-humanist-sans), sans-serif', sample: 'Humanist & neutral' },
  { name: 'Sora', family: 'var(--font-geometric-sans), sans-serif', sample: 'Geometric & modern' },
  { name: 'Fraunces', family: 'var(--font-editorial-serif), serif', sample: 'Editorial & warm' },
  { name: 'Plex Mono', family: 'var(--font-mono-plex), monospace', sample: 'Technical & precise' },
];

// Explore section — curated palettes by style
export const EXPLORE_CATEGORIES = [
  {
    name: 'Minimal',
    swatches: ['#FAFAFA', '#E5E5E5', '#A3A3A3', '#525252', '#171717', '#F5F5F4', '#0A0A0A'],
    font: 'Inter',
  },
  {
    name: 'Luxury',
    swatches: ['#FDF6E3', '#D4AF37', '#B8860B', '#1C1C1E', '#2C2C2E', '#8B7355', '#F5E6D3'],
    font: 'Playfair Display',
  },
  {
    name: 'Editorial',
    swatches: ['#FFFFFF', '#000000', '#FF0000', '#1A1A1A', '#F5F5F5', '#333333', '#E5E5E5'],
    font: 'Playfair Display',
  },
  {
    name: 'Playful',
    swatches: ['#FFE4E6', '#FCD34D', '#34D399', '#60A5FA', '#A78BFA', '#FB923C', '#F472B6'],
    font: 'Outfit',
  },
  {
    name: 'Tech',
    swatches: ['#0F172A', '#1E293B', '#3B82F6', '#6366F1', '#8B5CF6', '#0EA5E9', '#22D3EE'],
    font: 'Inter',
  },
  {
    name: 'Earthy',
    swatches: ['#F5F0EB', '#D4A373', '#A98467', '#6B4423', '#BC6C25', '#606C38', '#283618'],
    font: 'Inter',
  },
];

// Export formats
export const EXPORT_FORMATS = [
  { id: 'css', name: 'CSS Variables', desc: 'Native custom properties', iconType: 'css' },
  { id: 'json', name: 'JSON Tokens', desc: 'Design Token Format', iconType: 'json' },
  { id: 'tailwind', name: 'Tailwind Config', desc: 'theme.extend ready', iconType: 'tailwind' },
  { id: 'figma', name: 'Figma Tokens', desc: 'Tokens Studio format', iconType: 'figma' },
  { id: 'react', name: 'React Theme', desc: 'ThemeProvider object', iconType: 'react' },
  { id: 'flutter', name: 'Flutter Theme', desc: 'ThemeData class', iconType: 'flutter' },
  { id: 'swift', name: 'SwiftUI Theme', desc: 'Color & Font assets', iconType: 'swift' },
];

/**
 * Component markup for the Studio Live Preview (components/studio/LivePreviewSection.tsx).
 * Every block is plain HTML styled entirely with `var(--...)` references into
 * the same CSS the Export drawer's "CSS" tab produces (lib/studio/exportCode.ts)
 * — no hardcoded colors, fonts, spacing, radius, or shadow values here. Each
 * `var(--ds-x, var(--color-y))` chain falls back to the base 5-token palette
 * when a full AI-generated design system (and its per-component --ds-* vars)
 * isn't present, so the preview still renders for a manual (non-AI) build.
 *
 * This list is intentionally the whole surface: to support a new component,
 * add an entry here (and, if it's a new token type, a case to
 * `componentEntries` in exportCode.ts) — nothing else needs to change.
 */

export type LivePreviewBlock = {
  id: string;
  label: string;
  html: string;
};

// A block's arranged position/size in the Studio live-preview canvas —
// order in the array is display order (reordered via drag), `width: null`
// means full-width (the default), and hidden blocks stay in the array
// (visible: false) rather than being removed, so toggling is reversible.
export type PreviewLayoutItem = { id: string; visible: boolean; width: number | null };

export function defaultPreviewLayout(): PreviewLayoutItem[] {
  return LIVE_PREVIEW_BLOCKS.map((b) => ({ id: b.id, visible: true, width: null }));
}

export const LIVE_PREVIEW_BLOCKS: LivePreviewBlock[] = [
  {
    id: "navigation",
    label: "Navigation",
    html: `
<div>
  <div class="lp-block-label">Navigation</div>
  <nav style="display:flex;align-items:center;justify-content:space-between;padding:var(--space-3, 14px) var(--space-4, 20px);border-radius:var(--radius, 10px);background:var(--ds-navigation-bg, var(--color-surface));color:var(--ds-navigation-text, var(--color-ink));border:1px solid var(--ds-navigation-border, var(--color-muted));font-family:var(--font-body, sans-serif);">
    <span style="font-family:var(--font-display, serif);font-weight:700;font-size:16px;">Brand</span>
    <div style="display:flex;gap:var(--space-3, 18px);font-size:13px;opacity:0.75;">
      <span>Product</span>
      <span>Docs</span>
      <span>About</span>
    </div>
  </nav>
</div>`,
  },
  {
    id: "typography",
    label: "Typography",
    html: `
<div>
  <div class="lp-block-label">Typography</div>
  <div style="display:flex;flex-direction:column;gap:var(--space-2, 10px);">
    <div style="font-family:var(--font-display, serif);font-weight:700;font-size:clamp(28px,4vw,42px);line-height:1.05;letter-spacing:-0.02em;color:var(--ds-color-text, var(--color-ink));">Display heading</div>
    <div style="font-family:var(--font-display, serif);font-weight:600;font-size:22px;letter-spacing:-0.01em;color:var(--ds-color-text, var(--color-ink));">Section heading</div>
    <p style="font-family:var(--font-body, sans-serif);font-size:14px;line-height:1.6;margin:0;color:var(--ds-color-text-muted, var(--color-muted));">Body copy set in the paired body font, using the muted text color role from the generated design system.</p>
  </div>
</div>`,
  },
  {
    id: "buttonPrimary",
    label: "Primary Button",
    html: `
<div>
  <div class="lp-block-label">Primary Button</div>
  <button style="font-family:var(--font-body, sans-serif);font-weight:600;font-size:14px;padding:12px 24px;border-radius:var(--radius, 10px);background:var(--ds-button-bg, var(--color-accent));color:var(--ds-button-text, var(--color-surface));border:1px solid var(--ds-button-border, transparent);cursor:pointer;">Primary action</button>
</div>`,
  },
  {
    id: "buttonSecondary",
    label: "Secondary Button",
    html: `
<div>
  <div class="lp-block-label">Secondary Button</div>
  <button style="font-family:var(--font-body, sans-serif);font-weight:600;font-size:14px;padding:12px 24px;border-radius:var(--radius, 10px);background:var(--ds-buttonSecondary-bg, transparent);color:var(--ds-buttonSecondary-text, var(--color-ink));border:1px solid var(--ds-buttonSecondary-border, var(--color-ink));cursor:pointer;">Secondary</button>
</div>`,
  },
  {
    id: "input",
    label: "Input Field",
    html: `
<div>
  <div class="lp-block-label">Input Field</div>
  <div style="max-width:280px;">
    <label style="display:block;font-size:11px;opacity:0.6;margin-bottom:6px;color:var(--ds-color-text, var(--color-ink));font-family:var(--font-body, sans-serif);">Label</label>
    <input placeholder="Placeholder text" style="width:100%;font-family:var(--font-body, sans-serif);font-size:13px;padding:10px 12px;border-radius:var(--radius, 10px);background:var(--ds-input-bg, var(--color-surface));color:var(--ds-input-text, var(--color-ink));border:1px solid var(--ds-input-border, var(--color-muted));" />
  </div>
</div>`,
  },
  {
    id: "dropdown",
    label: "Dropdown",
    html: `
<div>
  <div class="lp-block-label">Dropdown</div>
  <div style="max-width:280px;">
    <label style="display:block;font-size:11px;opacity:0.6;margin-bottom:6px;color:var(--ds-color-text, var(--color-ink));font-family:var(--font-body, sans-serif);">Label</label>
    <div style="display:flex;align-items:center;justify-content:space-between;font-family:var(--font-body, sans-serif);font-size:13px;padding:10px 12px;border-radius:var(--radius, 10px);background:var(--ds-dropdown-bg, var(--color-surface));color:var(--ds-dropdown-text, var(--color-ink));border:1px solid var(--ds-dropdown-border, var(--color-muted));">
      <span>Select an option</span>
      <span aria-hidden="true">⌄</span>
    </div>
  </div>
</div>`,
  },
  {
    id: "card",
    label: "Card",
    html: `
<div>
  <div class="lp-block-label">Card</div>
  <div style="max-width:280px;overflow:hidden;border-radius:var(--radius, 10px);background:var(--ds-card-bg, var(--color-surface));color:var(--ds-card-text, var(--color-ink));border:1px solid var(--ds-card-border, var(--color-muted));">
    <div style="height:70px;background:color-mix(in srgb, var(--ds-card-text, var(--color-ink)) 8%, transparent);"></div>
    <div style="padding:14px;display:flex;flex-direction:column;gap:8px;font-family:var(--font-body, sans-serif);">
      <div style="height:8px;width:70%;border-radius:99px;background:color-mix(in srgb, var(--ds-card-text, var(--color-ink)) 35%, transparent);"></div>
      <div style="height:8px;width:45%;border-radius:99px;background:color-mix(in srgb, var(--ds-card-text, var(--color-ink)) 20%, transparent);"></div>
    </div>
  </div>
</div>`,
  },
  {
    id: "badge",
    label: "Badge",
    html: `
<div>
  <div class="lp-block-label">Badge</div>
  <span style="display:inline-flex;align-items:center;font-family:var(--font-body, sans-serif);font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:0.04em;padding:6px 12px;border-radius:999px;background:var(--ds-badge-bg, var(--color-accent));color:var(--ds-badge-text, var(--color-surface));border:1px solid var(--ds-badge-border, transparent);">Badge</span>
</div>`,
  },
  {
    id: "alert",
    label: "Alert",
    html: `
<div>
  <div class="lp-block-label">Alert</div>
  <div style="font-family:var(--font-body, sans-serif);font-size:13px;line-height:1.6;padding:14px 16px;border-radius:var(--radius, 10px);background:var(--ds-alert-bg, color-mix(in srgb, var(--color-support) 14%, var(--color-surface)));color:var(--ds-alert-text, var(--color-ink));border:1px solid var(--ds-alert-border, var(--color-support));">Something needs your attention.</div>
</div>`,
  },
  {
    id: "table",
    label: "Table",
    html: `
<div>
  <div class="lp-block-label">Table</div>
  <div style="max-width:360px;overflow:hidden;border-radius:var(--radius, 10px);border:1px solid var(--ds-table-border, var(--color-muted));font-family:var(--font-body, sans-serif);">
    <div style="display:grid;grid-template-columns:repeat(3,1fr);font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;background:color-mix(in srgb, var(--ds-table-text, var(--color-ink)) 8%, var(--ds-table-bg, var(--color-surface)));color:var(--ds-table-text, var(--color-ink));">
      <div style="padding:8px 10px;">Name</div>
      <div style="padding:8px 10px;">Status</div>
      <div style="padding:8px 10px;">Date</div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);font-size:12px;background:var(--ds-table-bg, var(--color-surface));color:var(--ds-table-text, var(--color-ink));">
      <div style="padding:8px 10px;opacity:0.85;">Item</div>
      <div style="padding:8px 10px;opacity:0.85;">Active</div>
      <div style="padding:8px 10px;opacity:0.85;">Today</div>
    </div>
  </div>
</div>`,
  },
];

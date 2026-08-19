// The pages rasterized into the PDF style-guide export (lib/export/pdfStyleGuide.ts),
// rendered off-screen at a fixed print-page size (US Letter @ 96dpi =
// 816x1056px) so html-to-image has a stable, known-size DOM node per page.
// Each top-level <section data-style-guide-page> becomes one PDF page, in
// order. Deliberately plain inline-styled markup, not the app's Tailwind
// chrome, since this is a printable document with its own typographic system.
import { StudioExportTokens } from "@/lib/studio/exportCode";
import { SEMANTIC_TYPE_ROLES, TYPE_SCALE_KEYS, shadowOverflowPx } from "@/lib/export/designTokens";
import { getContrastRatio } from "@/lib/colors/colorUtils";

const PAGE_WIDTH = 816;
const PAGE_HEIGHT = 1056;
const MARGIN = 64;
// The footer sits absolutely at bottom: MARGIN, so flowed content has to
// stop short of it or the last block runs under the page number.
const FOOTER_RESERVE = 40;

function onColor(hex: string): string {
  return getContrastRatio(hex, "#FFFFFF") >= getContrastRatio(hex, "#111111") ? "#FFFFFF" : "#111111";
}

function Page({ children }: { children: React.ReactNode }) {
  return (
    <section
      data-style-guide-page
      style={{
        width: PAGE_WIDTH,
        height: PAGE_HEIGHT,
        padding: MARGIN,
        paddingBottom: MARGIN + FOOTER_RESERVE,
        backgroundColor: "#ffffff",
        color: "#171310",
        fontFamily: "system-ui, -apple-system, sans-serif",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {children}
    </section>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "#8A8477", marginBottom: 10 }}>
      {children}
    </div>
  );
}

function PageFooter({ label, index }: { label: string; index: number }) {
  return (
    <div
      style={{
        position: "absolute",
        bottom: MARGIN,
        left: MARGIN,
        right: MARGIN,
        display: "flex",
        justifyContent: "space-between",
        fontSize: 10,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: "#B5AE9E",
      }}
    >
      <span>{label}</span>
      <span>{String(index).padStart(2, "0")}</span>
    </div>
  );
}

function CoverPage({ s }: { s: StudioExportTokens }) {
  const swatches = [s.light.accent, s.light.support, s.light.surface, s.light.ink, s.light.muted];
  return (
    <Page>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <Eyebrow>StyleBook — Style Guide</Eyebrow>
        <div style={{ fontFamily: `'${s.headFont}', serif`, fontWeight: 700, fontSize: 64, lineHeight: 1.02, letterSpacing: "-0.02em" }}>
          {s.name}
        </div>
        <div style={{ marginTop: 14, fontSize: 14, color: "#6E675C" }}>
          {new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
        </div>
      </div>
      <div style={{ display: "flex", height: 72, borderRadius: 12, overflow: "hidden" }}>
        {swatches.map((hex, i) => (
          <div key={i} style={{ flex: 1, backgroundColor: hex }} />
        ))}
      </div>
      <PageFooter label={s.name} index={1} />
    </Page>
  );
}

function PaletteRow({ title, tokens }: { title: string; tokens: StudioExportTokens["light"] }) {
  const entries: Array<[string, string]> = [
    ["Accent", tokens.accent],
    ["Support", tokens.support],
    ["Surface", tokens.surface],
    ["Ink", tokens.ink],
    ["Muted", tokens.muted],
  ];
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: "#3C3830" }}>{title}</div>
      <div style={{ display: "flex", gap: 10 }}>
        {entries.map(([label, hex]) => (
          <div key={label} style={{ flex: 1 }}>
            <div
              style={{
                height: 88,
                borderRadius: 10,
                backgroundColor: hex,
                border: "1px solid rgba(0,0,0,0.08)",
                display: "flex",
                alignItems: "flex-end",
                padding: 10,
                boxSizing: "border-box",
              }}
            >
              <span style={{ fontSize: 10, letterSpacing: "0.06em", color: onColor(hex) }}>{hex.toUpperCase()}</span>
            </div>
            <div style={{ marginTop: 6, fontSize: 11, color: "#6E675C" }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ColorsPage({ s }: { s: StudioExportTokens }) {
  return (
    <Page>
      <Eyebrow>Colors</Eyebrow>
      <div style={{ fontFamily: `'${s.headFont}', serif`, fontWeight: 700, fontSize: 28, marginBottom: 28 }}>
        Palette
      </div>
      <PaletteRow title="Light" tokens={s.light} />
      <PaletteRow title="Dark" tokens={s.dark} />
      <PageFooter label={s.name} index={2} />
    </Page>
  );
}

/**
 * The actual pixel numbers behind the type samples, not just what the faces
 * look like — a developer handed the PDF needs something to build with. Both
 * the semantic mapping and the ladder come from lib/export/designTokens.ts,
 * the same source the CSS/DTCG/markdown exports use, so the PDF can't
 * disagree with the token files shipped next to it.
 */
function TypeScaleBlock({ s }: { s: StudioExportTokens }) {
  const scale = s.typeScale!;
  const semantic = SEMANTIC_TYPE_ROLES.filter(({ role }) => ["h1", "h2", "body", "caption"].includes(role));

  return (
    <div>
      <div style={{ fontSize: 11, color: "#8A8477", marginBottom: 10 }}>
        Type scale — base {scale.baseSize}px, {scale.ratioName} ({scale.ratio})
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        {semantic.map(({ role, size }) => (
          <div
            key={role}
            style={{
              flex: 1,
              border: "1px solid rgba(0,0,0,0.08)",
              borderRadius: 10,
              padding: "10px 12px",
              boxSizing: "border-box",
            }}
          >
            <div style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "#8A8477" }}>
              {role}
            </div>
            <div style={{ marginTop: 4, fontSize: 20, color: "#171310" }}>{Math.round(scale.sizes[size])}px</div>
            <div style={{ marginTop: 2, fontSize: 10, color: "#B5AE9E" }}>{size}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 24px" }}>
        {TYPE_SCALE_KEYS.map((key) => (
          <div key={key} style={{ width: 140, display: "flex", justifyContent: "space-between", fontSize: 11 }}>
            <span style={{ color: "#8A8477" }}>{key}</span>
            <span style={{ color: "#3C3830" }}>{Math.round(scale.sizes[key])}px</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TypographyPage({ s }: { s: StudioExportTokens }) {
  return (
    <Page>
      <Eyebrow>Typography</Eyebrow>
      <div style={{ fontFamily: `'${s.headFont}', serif`, fontWeight: 700, fontSize: 28, marginBottom: 28 }}>
        Type system
      </div>

      <div style={{ marginBottom: 36 }}>
        <div style={{ fontSize: 11, color: "#8A8477", marginBottom: 8 }}>Display — {s.headFont}</div>
        <div style={{ fontFamily: `'${s.headFont}', serif`, fontWeight: 700, fontSize: 56, lineHeight: 1.05 }}>
          Aa Bb Cc
        </div>
        <div style={{ fontFamily: `'${s.headFont}', serif`, fontSize: 20, marginTop: 8, color: "#3C3830" }}>
          The quick brown fox jumps over the lazy dog.
        </div>
      </div>

      <div style={{ marginBottom: 36 }}>
        <div style={{ fontSize: 11, color: "#8A8477", marginBottom: 8 }}>Body — {s.bodyFont}</div>
        <div style={{ fontFamily: `'${s.bodyFont}', sans-serif`, fontSize: 15, lineHeight: 1.7, color: "#3C3830", maxWidth: 560 }}>
          Every element in this system — palette, type, spacing, shape — is generated from a single
          brand description and stays consistent wherever it&rsquo;s used. This paragraph is set in the
          body typeface at its intended reading size.
        </div>
      </div>

      {s.accentFont && (
        <div style={{ marginBottom: 36 }}>
          <div style={{ fontSize: 11, color: "#8A8477", marginBottom: 8 }}>Accent — {s.accentFont}</div>
          <div style={{ fontFamily: `'${s.accentFont}', sans-serif`, fontSize: 26 }}>Aa Bb Cc 123</div>
        </div>
      )}

      {s.typeScale && <TypeScaleBlock s={s} />}
      <PageFooter label={s.name} index={3} />
    </Page>
  );
}

/**
 * Shadow swatches, each sitting inside a cell padded by the shadow's own
 * measured reach — a "dramatic" shadow's blur/offset can paint well outside
 * its own swatch box, and without this padding that spill gets clipped by
 * the page's overflow:hidden when html-to-image rasterizes it. The padding
 * is derived from the shadow values, not hard-coded, so a bigger blur in a
 * future scale can't silently reintroduce the clip. One shared inset across
 * all three cells keeps them on a common baseline.
 */
function ShadowRow({ s }: { s: StudioExportTokens }) {
  const levels = s.shadows?.levels ?? [];
  const reach = Math.max(0, ...levels.map((level) => shadowOverflowPx(level.value)));
  // +6px of breathing room, capped so an absurd generated shadow can't push the row off the page.
  const inset = Math.min(56, Math.ceil(reach) + 6);

  return (
    <div>
      <div style={{ fontSize: 11, color: "#8A8477", marginBottom: 10 }}>Shadows</div>
      <div
        style={{
          display: "flex",
          gap: 12,
          // The tinted panel is what the shadows are cast onto, so "contained" is visible, not just implied.
          backgroundColor: "#FAF8F4",
          border: "1px solid rgba(0,0,0,0.05)",
          borderRadius: 12,
          padding: 12,
          boxSizing: "border-box",
        }}
      >
        {levels.map((level) => (
          <div
            key={level.name}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: inset,
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: 10,
                backgroundColor: "#ffffff",
                border: "1px solid rgba(0,0,0,0.06)",
                boxShadow: level.value,
              }}
            />
            <div style={{ marginTop: 12, fontSize: 11, color: "#6E675C", textTransform: "capitalize" }}>
              {level.name}
              {level.name === s.shadows?.recommended ? " ✓" : ""}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TokensPage({ s }: { s: StudioExportTokens }) {
  const maxStep = s.spacing ? Math.max(...s.spacing.steps) : 0;
  return (
    <Page>
      <Eyebrow>Shape &amp; Spacing</Eyebrow>
      <div style={{ fontFamily: `'${s.headFont}', serif`, fontWeight: 700, fontSize: 28, marginBottom: 28 }}>
        Tokens
      </div>

      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 11, color: "#8A8477", marginBottom: 10 }}>Corner radius</div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: s.radius,
              backgroundColor: s.light.accent,
            }}
          />
          <span style={{ fontSize: 13, color: "#3C3830" }}>{s.radius}px</span>
        </div>
      </div>

      {s.spacing && (
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 11, color: "#8A8477", marginBottom: 10 }}>
            Spacing — base {s.spacing.base}px
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {s.spacing.steps.map((step, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    height: 10,
                    width: Math.max(4, (step / maxStep) * 340),
                    backgroundColor: s.light.support,
                    borderRadius: 3,
                  }}
                />
                <span style={{ fontSize: 11, color: "#8A8477" }}>{step}px</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {s.shadows && <ShadowRow s={s} />}
      <PageFooter label={s.name} index={4} />
    </Page>
  );
}

export function StyleGuidePdfPages({ tokens }: { tokens: StudioExportTokens }) {
  return (
    <div>
      <CoverPage s={tokens} />
      <ColorsPage s={tokens} />
      <TypographyPage s={tokens} />
      <TokensPage s={tokens} />
    </div>
  );
}

export const STYLE_GUIDE_PAGE_SIZE = { width: PAGE_WIDTH, height: PAGE_HEIGHT };

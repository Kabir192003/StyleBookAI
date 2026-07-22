/**
 * Live mock preview on the AI results screen — branches its layout/copy by
 * `result.context` (classified by the model, see lib/ai/prompt.ts) so an
 * e-commerce brief gets product-ish elements, a government brief reads
 * formally, etc. Every variant still derives all colors/fonts from the same
 * resolved tokens passed in — only the layout and copy change per context,
 * not how tokens are resolved.
 */
import { AIGeneratedProject } from "@/types/ai";

type Tokens = {
  result: AIGeneratedProject;
  surface: string;
  ink: string;
  accent: string;
  support: string;
  onAccent: string;
};

function Header({ result, ink, accent, onAccent, ctaLabel }: Tokens & { ctaLabel: string }) {
  return (
    <div
      className="flex items-center justify-between px-[18px] py-3.5"
      style={{ borderBottom: `1px solid color-mix(in srgb, ${ink} 10%, transparent)` }}
    >
      <span style={{ fontFamily: `'${result.fonts.primary.family}', serif`, fontWeight: 700, fontSize: 17 }}>
        {result.name}
      </span>
      <span
        className="rounded-[10px] px-[15px] py-2 text-xs font-semibold"
        style={{ backgroundColor: accent, color: onAccent, fontFamily: `'${result.fonts.secondary.family}', sans-serif` }}
      >
        {ctaLabel}
      </span>
    </div>
  );
}

function SaasBody({ result, surface, ink, accent, support, onAccent }: Tokens) {
  return (
    <div className="flex flex-col gap-3.5 px-[22px] py-[26px]">
      <span
        className="self-start rounded-full px-[11px] py-[5px] text-[10px] uppercase tracking-[0.14em]"
        style={{
          fontFamily: `'${result.fonts.secondary.family}', sans-serif`,
          color: support,
          border: `1px solid color-mix(in srgb, ${support} 45%, transparent)`,
        }}
      >
        Live preview
      </span>
      <div style={{ fontFamily: `'${result.fonts.primary.family}', serif`, fontWeight: 700, fontSize: 34, lineHeight: 1.02, letterSpacing: "-0.02em" }}>
        Your brand, <span style={{ color: accent }}>instantly</span> dressed.
      </div>
      <p style={{ fontFamily: `'${result.fonts.secondary.family}', sans-serif`, fontSize: 14, lineHeight: 1.6, margin: 0, color: `color-mix(in srgb, ${ink} 68%, transparent)` }}>
        Every element here is painted with the tokens generated from your prompt.
      </p>
      <div className="mt-0.5 flex gap-2.5">
        <span
          className="rounded-[10px] px-5 py-[11px] text-[13px] font-semibold"
          style={{ backgroundColor: accent, color: onAccent, fontFamily: `'${result.fonts.secondary.family}', sans-serif` }}
        >
          Primary
        </span>
        <span
          className="rounded-[10px] px-[18px] py-2.5 text-[13px]"
          style={{ border: `1px solid color-mix(in srgb, ${ink} 28%, transparent)`, color: ink, fontFamily: `'${result.fonts.secondary.family}', sans-serif` }}
        >
          Ghost
        </span>
      </div>
      <div className="mt-1.5 grid grid-cols-2 gap-2.5">
        {["Fast setup", "On brand"].map((label, i) => (
          <div
            key={label}
            className="rounded-[10px] p-3.5"
            style={{ backgroundColor: `color-mix(in srgb, ${ink} 5%, ${surface})`, border: `1px solid color-mix(in srgb, ${ink} 9%, transparent)` }}
          >
            <div
              className="h-[26px] w-[26px] rounded-md"
              style={{ backgroundColor: `color-mix(in srgb, ${i === 0 ? accent : support} ${i === 0 ? 18 : 26}%, transparent)` }}
            />
            <div className="mt-2.5 text-sm font-semibold" style={{ fontFamily: `'${result.fonts.primary.family}', serif` }}>
              {label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EcommerceBody({ result, surface, ink, accent, support, onAccent }: Tokens) {
  const products = [
    { name: "Everyday tote", price: "$68" },
    { name: "Studio candle", price: "$24" },
  ];
  return (
    <div className="flex flex-col gap-3.5 px-[22px] py-[26px]">
      <div style={{ fontFamily: `'${result.fonts.primary.family}', serif`, fontWeight: 700, fontSize: 26, lineHeight: 1.05 }}>
        New arrivals
      </div>
      <p style={{ fontFamily: `'${result.fonts.secondary.family}', sans-serif`, fontSize: 13, margin: 0, color: `color-mix(in srgb, ${ink} 68%, transparent)` }}>
        A shopfront styled entirely from your generated tokens.
      </p>
      <div className="mt-1 grid grid-cols-2 gap-2.5">
        {products.map((p, i) => (
          <div
            key={p.name}
            className="rounded-[10px] p-3"
            style={{ backgroundColor: `color-mix(in srgb, ${ink} 5%, ${surface})`, border: `1px solid color-mix(in srgb, ${ink} 9%, transparent)` }}
          >
            <div
              className="h-[64px] w-full rounded-md"
              style={{ backgroundColor: `color-mix(in srgb, ${i === 0 ? accent : support} 22%, transparent)` }}
            />
            <div className="mt-2 text-[13px] font-semibold" style={{ fontFamily: `'${result.fonts.primary.family}', serif` }}>
              {p.name}
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-[12px]" style={{ color: `color-mix(in srgb, ${ink} 68%, transparent)` }}>
                {p.price}
              </span>
              <span
                className="rounded-full px-2.5 py-1 text-[10px] font-semibold"
                style={{ backgroundColor: accent, color: onAccent, fontFamily: `'${result.fonts.secondary.family}', sans-serif` }}
              >
                Add to cart
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function GovernmentBody({ result, ink, accent }: Tokens) {
  const services = ["Renew a licence", "Pay a fine", "Book an appointment"];
  return (
    <div className="flex flex-col gap-3 px-[22px] py-[26px]">
      <div
        style={{
          fontFamily: `'${result.fonts.primary.family}', serif`,
          fontWeight: 700,
          fontSize: 22,
          color: ink,
        }}
      >
        Official information portal
      </div>
      <p style={{ fontFamily: `'${result.fonts.secondary.family}', sans-serif`, fontSize: 13, margin: 0, color: `color-mix(in srgb, ${ink} 70%, transparent)` }}>
        Find services, forms, and guidance below.
      </p>
      <div style={{ borderTop: `1px solid color-mix(in srgb, ${ink} 20%, transparent)` }} className="mt-1 pt-3">
        <div className="flex flex-col divide-y" style={{ borderColor: `color-mix(in srgb, ${ink} 10%, transparent)` }}>
          {services.map((s) => (
            <div key={s} className="flex items-center justify-between py-2 text-[13px]" style={{ color: ink }}>
              <span style={{ fontFamily: `'${result.fonts.secondary.family}', sans-serif` }}>{s}</span>
              <span style={{ color: accent }}>→</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EditorialBody({ result, ink, accent }: Tokens) {
  return (
    <div className="flex flex-col gap-3.5 px-[22px] py-[26px]">
      <span
        className="text-[10px] uppercase tracking-[0.18em]"
        style={{ fontFamily: `'${result.fonts.secondary.family}', sans-serif`, color: `color-mix(in srgb, ${ink} 55%, transparent)` }}
      >
        Field notes · 6 min read
      </span>
      <div style={{ fontFamily: `'${result.fonts.primary.family}', serif`, fontWeight: 700, fontSize: 30, lineHeight: 1.08, letterSpacing: "-0.01em" }}>
        On building something worth reading.
      </div>
      <div
        className="pl-3 text-[14px] italic leading-relaxed"
        style={{ borderLeft: `2px solid ${accent}`, color: `color-mix(in srgb, ${ink} 75%, transparent)`, fontFamily: `'${result.fonts.secondary.family}', sans-serif` }}
      >
        "Every layout here is painted with the tokens generated from your prompt."
      </div>
      <span
        className="mt-1 self-start text-[13px] font-semibold"
        style={{ color: accent, fontFamily: `'${result.fonts.secondary.family}', sans-serif` }}
      >
        Read more →
      </span>
    </div>
  );
}

export function LivePreviewMock(props: Tokens) {
  const { result, surface, ink } = props;
  const context = result.context ?? "generic";
  const ctaLabel = context === "ecommerce" ? "Cart (2)" : context === "government" ? "Search" : "Sign up";

  let body = <SaasBody {...props} />;
  if (context === "ecommerce") body = <EcommerceBody {...props} />;
  else if (context === "government") body = <GovernmentBody {...props} />;
  else if (context === "editorial") body = <EditorialBody {...props} />;

  return (
    <div
      className={`overflow-hidden border border-white/[0.12] ${context === "government" ? "rounded-md" : "rounded-2xl"}`}
      style={{ backgroundColor: surface, color: ink }}
    >
      <Header {...props} ctaLabel={ctaLabel} />
      {body}
    </div>
  );
}

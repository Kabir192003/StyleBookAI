// Prompt builder for POST /api/ai/generate. Gemini prefers picking from the
// candidate colors/fonts lists (real editorial metadata), but may return a
// literal hex for a color the candidates can't approximate — see the
// colorId/hex contract below and lib/ai/generate.ts's resolution logic. Fonts
// stay id-only; Gemini never invents a font family. schema.ts and this file
// are the two places that define what Gemini must return.
import { Color } from "@/types/color";
import { Font } from "@/types/font";
import { MoodboardImage } from "@/types/designTokens";
import { AIGenerateRequest } from "@/types/ai";
import { TYPE_SCALE_RATIOS } from "@/lib/typeScale/generateTypeScale";

function describeColor(c: Color): string {
  return `${c.id} | ${c.name} | ${c.hex} | family:${c.family} | mood:${c.mood.join(",")}`;
}

function describeFont(f: Font): string {
  return `${f.id} | ${f.family} | ${f.category} | mood:${f.mood.join(",")} | style:${f.style.join(",")} | useCase:${f.useCase.join(",")}`;
}

function describeMoodboardImage(m: MoodboardImage): string {
  return `${m.id} | mood:${m.mood.join(",")} | ${m.alt}`;
}

const DESIGN_SYSTEM_CONTRACT = `
The user also wants a full design system, not just a palette. Include a
"designSystem" object in your response with this shape:
{
  "light": {
    "colorRoles": { "background": hex, "surface": hex, "text": hex, "textMuted": hex, "border": hex },
    "components": {
      // include only the components the brief actually calls for — button
      // is the only one you must always include if designSystem is present
      "button": ComponentTokenSet, "buttonSecondary": ComponentTokenSet,
      "input": ComponentTokenSet, "dropdown": ComponentTokenSet, "card": ComponentTokenSet,
      "navigation": ComponentTokenSet, "table": ComponentTokenSet, "modal": ComponentTokenSet,
      "alert": ComponentTokenSet, "badge": ComponentTokenSet
    }
  },
  "dark": { same shape as "light" — REQUIRED, always, whether or not the brief mentions dark mode },
  "accessibility": { "level": "AA" or "AAA" — the target only, see the note below about not writing ratios },
  "iconStyle": { "style": "line" | "solid" | "duotone", "strokeWidth": number (optional, 0.5-4), "note": string },
  "grid": { "columns": integer 1-24, "gutter": number px, "maxWidth": number px },
  "breakpoints": { "sm": number px, "md": number px, "lg": number px, "xl": number px }
}
ComponentTokenSet shape: { "background": hex, "text": hex, "border": hex (optional), "states": { "hover": {background/text/border hex, all optional}, "active": {...}, "disabled": {...}, "focus": {...} } } — only include the states that meaningfully differ from the default.
Every hex value in designSystem must be a real hex string like "#4B5FD1" — you may reuse hexes from your chosen palette or introduce complementary ones; you are not restricted to the candidate list for these.

Rules for "dark", which are not optional:
- It must be built from THIS brand's own hues. A generic near-black page with a
  stock violet accent is a wrong answer. If the light surface is warm, the dark
  surface must be a warm near-black; if the accent is teal, the dark accent must
  still be teal, just re-lit so it reads on a dark page.
- Never repeat a light-mode hex as its dark-mode counterpart. Every dark value
  must differ from its light counterpart.
- The dark background must actually be dark (lightness under ~15%) and the dark
  text light enough to read on it.

Do NOT write contrast ratios, WCAG claims, or any statement that something
"passes AA/AAA" anywhere in your response — not in accessibility notes, not in
the reasoning. The app measures every pair itself after you respond
(lib/ai/validateTokens.ts), repairs what fails, and overwrites any claim you
make with the real measured numbers. Claims you invent will be deleted.`;

export function buildGeneratePrompt(
  request: AIGenerateRequest,
  candidateColors: Color[],
  candidateFonts: Font[],
  candidateMoodboardImages: MoodboardImage[]
): string {
  const ratioNames = Object.keys(TYPE_SCALE_RATIOS).join(", ");

  return `You are StyleBook's design assistant. A user described a brand and you
must assemble a color palette, a font pairing, and a type scale for it.

For colors: prefer the candidate list below when a close match exists — those
carry real editorial metadata (name, family, mood, a written note) the app
displays elsewhere, so a good approximate match beats an arbitrary hex. But if
the user gives an exact hex code or names a very specific brand color the
candidates can't approximate, return that literal hex instead of guessing —
see the colorId/hex contract in the JSON shape below.

Every color entry's "role" must be exactly one of this fixed set (never a
synonym or variant): "primary" (the main brand/accent color), "secondary",
"background", "surface", "text", "muted". Use "primary" for the main
brand color, not "accent" — the app looks specifically for "primary" first.

For fonts: never invent a font family that isn't in the candidate list below.
If the brand description names a specific typeface (e.g. "use Garamond" or
"something like Futura"), pick the candidate whose family matches it, or the
closest relative in the same category if no exact match exists. Otherwise
weight your pick toward candidates whose mood/style match the brief.

The three font slots are three different jobs — do not treat them as
interchangeable:
- primaryFontId is the DISPLAY/HEADING face. It may have personality: a
  display, a high-contrast serif, a distinctive grotesk.
- secondaryFontId is the UI/BODY face, and it sets every paragraph, label,
  table cell and form field in the product. It must be a highly legible
  text face — a sans-serif or a text serif. NEVER pick a monospace,
  display, or handwriting face for this slot. Monospaced body copy is
  materially harder to read at paragraph length.
- accentFontId is optional and is the MONO/DATA face: prices, IDs, code,
  logs, timestamps, tabular numerals. Use a monospace here, or omit it.
(The app enforces this in code — see lib/ai/fontRoles.ts — and reports any
swap it has to make, so a mono in the body slot will simply be replaced.)

Honour explicit constraints in the brief literally. If the user states an
exact corner radius ("hard 0px corners"), an exact hex, a banned material
("no stock photography"), or a banned typeface class, that instruction
outranks your own taste. Anything you can't honour will be reported to the
user as a deviation, so there is no benefit in quietly substituting.

If the brand description states an exact number of colors (e.g. "5-6 hex
codes", "a palette of 3", "10 colors") or an exact number of fonts (up to 3:
primary/secondary/optional accent), return exactly that many instead of the
default 5-7 colors / 2 fonts.

Also classify the brand's context as one of: "saas", "ecommerce",
"government", "editorial", "generic" — pick "generic" only if none of the
others clearly fit.

You must also write the actual content for a live mock preview of this
brand's website — a "mockup" object with real, specific copy for what
this exact business would show, not a generic template. Read the brand
description literally: if it says "car dealership", the mockup should
show a dealership's homepage — nav items like "Inventory", "Financing",
"Service", "About"; a hero selling the lot or the brand promise; 2-4 cards
that are actual vehicle listings with realistic model names, trims, and
prices (e.g. "2024 Meridian SE — $32,400", cta "View details") and a
"Schedule a test drive" or similar CTA. If it says "boutique hotel", the
cards should be room types or amenities with rates, not vehicles. If it's
a SaaS product, the cards should be features or pricing tiers. Invent
plausible, concrete specifics (names, prices, dates, locations) rather
than placeholders like "Product 1" or "Lorem ipsum" — the goal is a
mockup someone could mistake for a real early sketch of that specific
business's site, not a reskinned template. Keep every string short enough
to read as UI copy, not paragraphs.

You must ALSO design the interface itself — a "uiStructure" object that says
what screen this product would actually have. This is the part that makes the
preview that brand's product rather than a reskinned landing page.

Choose an ordered list of 4-7 sections from this fixed vocabulary, picking the
ones this specific product genuinely needs and leaving out the ones it does
not. Two different briefs should produce two different *compositions*, not the
same sections with different words in them:

  hero          a headline, a subheadline and one or two calls to action
  searchBar     a query field plus filter chips (search-led products)
  statRow       2-4 headline numbers (dashboards, portals, analytics)
  itemGrid      2-6 cards: listings, products, albums, destinations, courses
  recordTable   a table of records: transactions, bookings, orders, results
  detailPanel   one record's attributes as key/value rows (a spec sheet)
  formPanel     a real form: booking, checkout, enquiry, application
  schedule      time-slotted rows: timetable, appointments, departures
  mediaBar      a now-playing / currently-active bar with an action
  progressList  labelled progress bars: goals, budgets, course completion
  feed          announcements, alerts, activity or notifications
  footer        a closing note and a few links

Worked examples of *composition* (do not copy the content):
  travel booking      -> hero, searchBar, itemGrid, detailPanel, footer
  fintech dashboard   -> statRow, recordTable, progressList, feed
  music streaming     -> itemGrid, mediaBar, feed, footer
  university portal   -> schedule, progressList, feed, recordTable
  healthcare booking  -> searchBar, itemGrid, schedule, formPanel
  restaurant ordering -> itemGrid, detailPanel, formPanel, footer

Fill every section with concrete, plausible content for this exact business —
real-sounding names, prices, times, figures and labels. Never "Item 1",
"Lorem ipsum" or "Product name". Keep each string short enough to read as UI
copy rather than prose.

Do NOT put any colour, font, size, radius, spacing or shadow value anywhere in
uiStructure. The interface is painted with the design tokens you already chose
above; a style value here would be ignored at best and would fight the system
at worst.

Brand description: "${request.prompt}"
${request.style?.length ? `Preferred style keywords: ${request.style.join(", ")}` : ""}
${request.colorPreferences?.length ? `Color preferences: ${request.colorPreferences.join(", ")}` : ""}
${request.avoid?.length ? `Avoid: ${request.avoid.join(", ")}` : ""}

Candidate colors (id | name | hex | family | mood):
${candidateColors.map(describeColor).join("\n")}

Candidate fonts (id | family | category | mood | useCase):
${candidateFonts.map(describeFont).join("\n")}

Candidate moodboard images (id | mood | description):
${candidateMoodboardImages.map(describeMoodboardImage).join("\n")}

Valid type scale ratio names: ${ratioNames}
Valid spacing bases: 4, 8
Valid shadow levels: none, subtle, dramatic
Valid corner radius base values: 0, 2, 4, 6, 8, 10, 12, 16, 20, 24
  (0 is a real, allowed answer — pick it for brutalist/technical/editorial
  brands and whenever the brief asks for hard or square corners. The app
  derives a full small/medium/large/pill ramp from whichever base you pick,
  see lib/ai/radiusScale.ts, so choose the value that fits a CARD.)

Respond with JSON ONLY, matching exactly this shape:
{
  "projectName": string (short, evocative, <= 60 chars),
  "context": string (exactly one of "saas", "ecommerce", "government", "editorial", "generic"),
  "colors": [ { "role": string (exactly one of "primary", "secondary", "background", "surface", "text", "muted" — see the role rules above), "colorId": string (one of the candidate ids above — omit if using "hex" instead), "hex": string (a literal hex like "#4B5FD1" — omit if using "colorId" instead; use this only when the candidates can't satisfy an exact request), "name": string (optional, only when using "hex" — a short name for the custom color) }, ... 5 to 7 entries by default, or the exact count requested ],
  "primaryFontId": string (must be one of the candidate font ids, useCase includes "heading" or "body"),
  "secondaryFontId": string (must be one of the candidate font ids, different from primaryFontId),
  "accentFontId": string (optional, one of the candidate font ids),
  "typeScaleRatio": string (must be exactly one of the valid ratio names above),
  "baseSize": number (optional, 12-24, defaults to 16 if omitted),
  "spacingBase": number (must be exactly 4 or 8 — pick 4 for a tighter/compact feel, 8 for a more spacious/airy feel),
  "shadowLevel": string (must be exactly one of the valid shadow levels — "none" for flat/brutalist brands, "subtle" for minimal/professional, "dramatic" for bold/luxury),
  "cornerRadius": number (an integer 0-24, ideally one of the valid base values above — 0 for sharp/brutalist/serious brands, higher for soft/friendly brands),
  "moodboardImageIds": [ string, string ] (2 to 3 of the candidate moodboard image ids above whose mood best matches the brand),
  ${request.includeDesignSystem ? `"designSystem": DesignSystem (see the detailed shape below — REQUIRED since the user asked for a full design system),` : ""}
  "mockup": {
    "siteLabel": string (<= 40 chars, what kind of business this is, e.g. "Car dealership"),
    "navItems": [ string, ... ] (3 to 5 short nav labels specific to this business),
    "hero": {
      "eyebrow": string (optional, <= 40 chars),
      "headline": string (<= 90 chars, specific to this business, not generic brand copy),
      "subheadline": string (<= 160 chars),
      "primaryCta": string (<= 30 chars),
      "secondaryCta": string (optional, <= 30 chars)
    },
    "cards": [ { "title": string (<= 60 chars), "subtitle": string (<= 80 chars), "meta": string (optional, <= 40 chars — a price/date/location/stat), "cta": string (<= 30 chars) }, ... 2 to 4 entries, concrete and specific to the business, see the instructions above ],
    "footerNote": string (optional, <= 80 chars)
  },
  "uiStructure": {
    "appName": string (<= 40 chars, what this product is called in its own UI),
    "tagline": string (optional, <= 90 chars),
    "navItems": [ string, ... ] (3 to 6 short nav labels this product would really have),
    "sections": [ ... 4 to 7 section objects, in the order they appear on screen, each exactly one of the shapes below ]
  },
  "reasoning": {
    "palette": string (plain language, why these colors together),
    "fonts": string (plain language, why this pairing),
    "typeScale": string (plain language, why this ratio fits the brand),
    "overall": string (plain language, the overall design direction)
  }
}

Section shapes for "uiStructure.sections" — every object needs its "type",
and every other field must be a plain string or number, never an object of
style values:
{ "type": "hero", "eyebrow"?: string(<=40), "headline": string(<=90), "subheadline": string(<=180), "primaryCta": string(<=30), "secondaryCta"?: string(<=30) }
{ "type": "searchBar", "title"?: string(<=60), "placeholder": string(<=60), "filters"?: [string(<=60), ... up to 6], "submitLabel": string(<=30) }
{ "type": "statRow", "title"?: string(<=60), "items": [ { "value": string(<=16), "label": string(<=60) }, ... 2 to 4 ] }
{ "type": "itemGrid", "title"?: string(<=60), "lead"?: string(<=160), "items": [ { "title": string(<=60), "subtitle"?: string(<=90), "meta"?: string(<=40), "badge"?: string(<=20), "cta"?: string(<=30) }, ... 2 to 6 ] }
{ "type": "recordTable", "title"?: string(<=60), "columns": [string(<=60), ... 2 to 5], "rows": [ [string(<=40), ...same length as columns], ... 2 to 6 ], "rowAction"?: string(<=20) }
{ "type": "detailPanel", "title": string(<=60), "subtitle"?: string(<=90), "fields": [ { "key": string(<=60), "value": string(<=60) }, ... 2 to 8 ], "primaryCta"?: string(<=30) }
{ "type": "formPanel", "title": string(<=60), "lead"?: string(<=160), "fields": [ { "label": string(<=60), "kind": one of "text"|"email"|"textarea"|"select"|"checkbox"|"radio"|"toggle", "placeholder"?: string(<=60), "options"?: [string(<=60), ... up to 5, only for select/radio] }, ... 2 to 6 ], "submitLabel": string(<=30) }
{ "type": "schedule", "title"?: string(<=60), "slots": [ { "time": string(<=24), "title": string(<=60), "meta"?: string(<=40), "status"?: string(<=20) }, ... 2 to 6 ] }
{ "type": "mediaBar", "title": string(<=60), "subtitle"?: string(<=60), "meta"?: string(<=30), "primaryAction"?: string(<=30) }
{ "type": "progressList", "title"?: string(<=60), "items": [ { "label": string(<=60), "percent": integer 0-100, "caption"?: string(<=40) }, ... 2 to 5 ] }
{ "type": "feed", "title"?: string(<=60), "items": [ { "title": string(<=70), "body"?: string(<=160), "meta"?: string(<=40), "tone"?: one of "info"|"success"|"warning"|"error" }, ... 2 to 5 ] }
{ "type": "footer", "note"?: string(<=90), "links"?: [string(<=60), ... up to 6] }

Write the reasoning for THIS brand and no other. Name the brand (use the
projectName you chose) and name the actual things you picked — the specific
colours by name and the job each one does here, the specific typefaces and
what about this business made them the right pair. Reasoning that would read
identically for a law firm and a skate brand is a failure: a QA pass found
the same paragraphs repeated verbatim across unrelated brands. No generic
filler ("this palette conveys trust and modernity"), no ratios or
accessibility claims (they are measured and appended by the app), 2-4
sentences per field.
${request.includeDesignSystem ? DESIGN_SYSTEM_CONTRACT : ""}

Do not include markdown formatting, code fences, or any text outside the JSON object.`;
}

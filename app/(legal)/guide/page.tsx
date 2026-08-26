import { LegalPage } from "@/components/legal/LegalPage";
import Link from "next/link";

export const metadata = {
  title: "Guide — StyleBook",
};

const SECTIONS = [
  { id: "colours", label: "Colours" },
  { id: "fonts", label: "Fonts" },
  { id: "themes", label: "Themes" },
  { id: "preview-lab", label: "Preview Lab" },
  { id: "studio", label: "Studio" },
  { id: "ai", label: "AI Generate" },
  { id: "tokens", label: "Tokens" },
  { id: "exports", label: "Exports" },
  { id: "figma", label: "Figma" },
  { id: "accounts", label: "Accounts & projects" },
  { id: "accessibility", label: "Accessibility" },
];

export default function GuidePage() {
  return (
    <LegalPage
      eyebrow="Help"
      title="How to use StyleBook"
      updated="18 August 2026"
      wide
      intro="A section-by-section walkthrough of everything in the app — what each part is for, how to actually use it, and how the pieces connect to each other. Jump to any section below, or just read straight through."
      afterIntro={
        <nav aria-label="Guide sections" className="mt-8 flex flex-wrap gap-2 lg:mt-0 lg:flex-col lg:items-start lg:gap-1.5">
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="rounded-full border border-black/[0.14] px-3.5 py-1.5 font-mono-plex text-[10.5px] uppercase tracking-[0.12em] !text-[#211E18] !no-underline transition-colors hover:bg-[#211E18] hover:!text-[#F2EBE0]"
            >
              {s.label}
            </a>
          ))}
        </nav>
      }
    >
      <h2 id="colours">Colours</h2>
      <p>
        <Link href="/browse/colors">Browse → Colours</Link> is the full colour library: a filterable grid of
        swatches you can search by name or hex, and narrow down by family, mood, style, or collection.
      </p>
      <p>Click into any colour to see its detail view:</p>
      <ul>
        <li>Its RGB and HSL values alongside the hex code, for whichever format you need.</li>
        <li>
          A real contrast check against pure white and pure black, so you can tell at a glance whether it
          works as text on a light surface, a dark surface, or both.
        </li>
        <li>
          A short editorial note — what the colour evokes, where it tends to work well, and what to watch out
          for. It’s written once per colour and shows up everywhere that colour appears (browse grid, Preview
          Lab, Studio), behind the small “i” icon on the swatch.
        </li>
      </ul>
      <p>Click the star on any swatch to favorite it — favorites are saved to your account and show up on your dashboard.</p>

      <h2 id="fonts">Fonts</h2>
      <p>
        <Link href="/browse/fonts">Browse → Fonts</Link> works the same way, rendered in each font’s own
        typeface so you’re never reading a font’s name in a system font. Filter by category (serif, sans,
        display, mono, handwriting), mood, or use-case, and edit the live preview text on any card to see how
        that specific font handles your own words — a heading, a sentence, whatever you’re actually going to
        use it for.
      </p>
      <p>Each font card also suggests pairings — fonts from the library that tend to work well alongside it, if you’re picking a heading/body combination and want a sensible starting point.</p>

      <h2 id="themes">Themes</h2>
      <p>
        <Link href="/browse/themes">Browse → Themes</Link> is a curated gallery of complete looks — a colour
        palette, a font pairing, and a type scale, bundled together and judged as a system rather than as
        separate pieces. Filter by category: minimal, bold, luxury, playful, earthy, tech, elegant, retro,
        neon, coastal, editorial, or brutalist.
      </p>
      <p>
        Open any theme’s detail page and you’ll see it rendered on a small live mockup — a card, a button, a
        heading, body text — so you’re judging it the way it’ll actually be used, not as an isolated swatch
        list. From there you can send it straight into Studio to keep building on it.
      </p>

      <h2 id="preview-lab">Preview Lab</h2>
      <p>
        The Preview Lab (at <code>/studio/compare</code>, and embedded inside Studio too) is where you check
        whether colours and fonts actually work together, before committing to them. It’s three connected
        views you switch between with tabs, all sharing the same selection:
      </p>
      <ul>
        <li>
          <strong>Side-by-side swatches</strong> — drag colours into a row and reorder them. Every adjacent
          pair shows a live contrast badge (WCAG AA/AAA pass or fail), so problem combinations are obvious
          immediately, not something you discover later.
        </li>
        <li>
          <strong>Mood mockup</strong> — the same colours applied to a small fixed layout — a card with a
          heading, a paragraph, a button, an input — so you see them as backgrounds, text, and accents, which
          is how they’ll actually be used.
        </li>
        <li>
          <strong>Font-on-colour</strong> — pick a heading font and a body font and see them rendered directly
          on that mockup, at real type sizes, on the real background colour. This is the step that answers
          “does this font actually go with this colour” — something no swatch grid or font card can show on
          its own.
        </li>
      </ul>
      <p>Your selection persists as you flip between the three tabs, and “Send to Studio” carries whatever you’ve got into a new or existing project.</p>

      <h2 id="studio">Studio</h2>
      <p>
        Studio (at <code>/studio</code>) is where a project actually gets assembled and edited, by hand or
        starting from an AI-generated result. It’s one live canvas showing a realistic product page — not a
        sheet of isolated component swatches — built from the same components your export ultimately uses.
      </p>
      <h3>Building a palette</h3>
      <p>
        Pick colours and assign each one a role — primary, secondary, accent, background, surface, text, and
        muted text. The canvas updates live as you change roles, so you always see the palette in context
        rather than as a flat list.
      </p>
      <h3>Type</h3>
      <p>
        Choose a heading font and a body font, then set the type scale: a base size plus a named ratio (Golden
        Ratio, Perfect Fourth, and others) that generates every heading and body size from those two numbers,
        so your headings and body copy stay in proportion instead of being picked one at a time by eye.
      </p>
      <h3>Click-to-edit</h3>
      <p>
        Click almost anything on the canvas — a button, a card, an input, a badge, a table, the navigation —
        and an inspector opens for exactly that component. Changes apply live to every instance of that
        component on the canvas, and where a control shares its styling with a related element (for example,
        the primary button’s colour also drives the outline and ghost button variants), the inspector says so
        directly, rather than leaving it to be discovered by trial and error.
      </p>
      <p>
        You can also preview a component’s hover, active, disabled, or focus state without needing to
        actually hover or click it — useful for checking a state you’ve customised without hunting for the
        right element to trigger it on.
      </p>
      <h3>Showcase vs. generated content</h3>
      <p>
        Studio can show either a fixed showcase page (a realistic layout covering every component type) or,
        after an AI Generate result, the actual page structure the AI chose for your brand. Both render
        inside the same canvas with the same styling system, so switching between them never changes how a
        component looks — only what content it’s showing.
      </p>

      <h2 id="ai">AI Generate</h2>
      <p>
        AI Generate (at <code>/studio/ai</code>) is a text box: describe your brand, its audience, and its
        mood, and Gemini returns a complete starting point — a palette, a font pairing, and a type scale —
        along with a written explanation of why each choice was made. That reasoning is shown prominently on
        the result screen, not tucked away, because it’s meant to build trust in the result, not just decorate
        it.
      </p>
      <p>
        If the first result isn’t quite right, you don’t have to start over — regenerate with specific
        feedback (“more muted,” “less corporate,” “warmer”) and it adjusts from there. Once you’re happy with
        a direction, open it straight into Studio to fine-tune manually, assign roles, or adjust the type
        scale by hand.
      </p>
      <p>Read the <Link href="/ai-disclaimer">AI Disclaimer</Link> for what to double-check before treating a generated result as final.</p>

      <h2 id="tokens">Tokens</h2>
      <p>
        Everything you build in Studio — every colour role, font, type-scale step, spacing value, radius, and
        shadow — is a <strong>design token</strong>: a named value rather than a one-off number, so the same
        decision is reused consistently everywhere it applies instead of being redefined in twenty different
        places. That’s what makes exporting possible at all: the export formats below are just that same
        token set, written out in the shape a particular tool or codebase expects.
      </p>
      <p>
        Both light and dark variants are generated for every project, so a token like “surface” or
        “text-muted” resolves to the right value automatically depending on which theme is active — you edit
        the role once, not each mode separately.
      </p>

      <h2 id="exports">Exports</h2>
      <p>
        From any project’s export drawer, every token set can be copied or downloaded in nine formats, grouped
        by what you’re exporting for:
      </p>
      <h3>Design tools</h3>
      <ul>
        <li><strong>Figma</strong> — Tokens Studio token sets, with light and dark wired up as swappable themes.</li>
        <li><strong>Design Tokens</strong> — the W3C DTCG standard format, importable via Figma’s Tokens Studio or Design Tokens plugin.</li>
        <li><strong>Style Guide</strong> — a Markdown document of every token in the system, ready to drop into a README or a client handoff.</li>
      </ul>
      <h3>Web</h3>
      <ul>
        <li><strong>CSS</strong> — custom properties for <code>:root</code>, with a <code>[data-theme=“dark”]</code> override block.</li>
        <li><strong>Tailwind</strong> — a drop-in <code>tailwind.config.js</code> with your colours, fonts, type scale, spacing, shadows, and breakpoints.</li>
        <li><strong>React</strong> — a typed theme object for styled-components, Emotion, or plain props.</li>
      </ul>
      <h3>Native apps</h3>
      <ul>
        <li><strong>SwiftUI</strong> — colour, font-size, spacing, and radius constants for an iOS target.</li>
        <li><strong>Flutter</strong> — <code>AppColors</code> / <code>AppTheme</code> with light and dark <code>ThemeData</code>.</li>
      </ul>
      <h3>Data</h3>
      <ul>
        <li><strong>JSON</strong> — a human-readable dump of the whole system. Not meant to be imported anywhere — this is the one for reading, not tooling.</li>
      </ul>
      <p>There’s also a one-click <strong>PDF</strong> style guide from the export drawer — a clean, logo-less layout of your palette and type system, useful for sharing outside the app entirely.</p>

      <h2 id="figma">Exporting real components to Figma</h2>
      <p>
        Beyond token files, StyleBook can export the actual Studio canvas — real, editable Figma frames bound
        to Figma Variables, not just a token file you have to reconnect by hand. This uses a small StyleBook
        Figma plugin:
      </p>
      <ol>
        <li>In the export drawer’s Figma tab, click “Figma Components ↗” and choose whether to include the current canvas, the full component library, or both.</li>
        <li>Click generate — this produces a one-time code, valid for 30 minutes.</li>
        <li>In Figma, install the StyleBook Import plugin and run it, then paste that code in when it asks.</li>
        <li>The plugin builds real Figma frames — buttons, cards, inputs, and the rest — as fully editable components with their hover, active, disabled, and focus variants intact.</li>
      </ol>
      <p>
        Separately, the “Design Tokens” or “Figma” export tabs give you a plain token file for the Tokens
        Studio plugin, if all you want is the variables rather than built frames — see the in-app hints on
        each tab for exactly which file does what.
      </p>

      <h2 id="accounts">Accounts &amp; projects</h2>
      <p>
        Signing in (just a username and password — see the <Link href="/privacy">Privacy Policy</Link> for
        why that’s all it asks for) lets you save projects and favorites to your account instead of losing
        them when you close the tab.
      </p>
      <p>
        Your <Link href="/dashboard">Dashboard</Link> lists every saved project with a thumbnail — click in to
        keep editing, right where you left off. From <Link href="/account">Account settings</Link> you can
        also permanently delete your account, which removes every saved project and favorite along with it.
      </p>

      <h2 id="accessibility">Accessibility</h2>
      <p>
        The essentials — labels, alt text, semantic landmarks, keyboard operability, skip-to-content — are on
        for everyone, everywhere in the app, with no toggle required. Beyond that, <Link href="/account">
        Account settings</Link> has a set of opt-in visual preferences (high contrast, larger text, underlined
        links, reduced transparency, reduced motion) for anyone who wants the interface to look different from
        the app’s default design. These are stored only in your browser, apply instantly, and don’t require an
        account.
      </p>
    </LegalPage>
  );
}

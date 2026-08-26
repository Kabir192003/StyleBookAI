import { LegalPage } from "@/components/legal/LegalPage";

export const metadata = {
  title: "AI Disclaimer — StyleBook",
};

export default function AiDisclaimerPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      currentHref="/ai-disclaimer"
      title="AI Disclaimer"
      updated="18 August 2026"
      intro="AI Generate is a genuinely useful starting point, not an authority. This page is the honest version of that — what the AI feature does, where it can go wrong, and what to double-check before you ship anything it produces."
    >
      <h2>AI can make mistakes</h2>
      <p>
        <strong>AI Generate</strong> (at <code>/studio/ai</code>) sends the brand description you type to
        Google’s Gemini API, which returns a palette, a font pairing, a type scale, and a short written
        explanation of why it chose them. Like any language model, Gemini can misread your prompt, invent a
        plausible-sounding but wrong justification, suggest a font pairing that doesn’t actually pair well,
        or return a colour combination that reads fine to the model but fails real contrast requirements in
        practice. Treat every generated result as a strong first draft, not a finished, verified system.
      </p>

      <h2>What we do to catch obvious problems</h2>
      <p>
        The result screen shows a live contrast check on the generated colours, and every colour/font page
        across the app carries a genuine WCAG contrast readout — not a canned or hardcoded number, but a
        real calculation against the actual colours in front of you. That check will flag pairings that fail
        AA or AAA. It won’t catch everything: contrast is one axis of “accessible,” not the whole picture,
        and a pairing can pass a contrast ratio while still being a poor real-world choice for a specific
        audience or use case.
      </p>

      <h2>What’s worth double-checking yourself</h2>
      <ul>
        <li>
          <strong>Contrast in context.</strong> A pairing that passes in isolation can still read poorly at
          small sizes, on a busy background, or for someone with low vision — check it in your actual layout,
          not just the badge.
        </li>
        <li>
          <strong>Font licensing.</strong> AI Generate picks fonts from StyleBook’s library, but it’s worth
          confirming the specific license terms of a font before shipping it in a commercial product.
        </li>
        <li>
          <strong>The written reasoning.</strong> The “why we chose this” explanation is generated fresh for
          your prompt and is meant to build trust and intuition — it’s commentary from the model, not a cited
          design-research source. Read it as a rationale, not as fact.
        </li>
        <li>
          <strong>Brand and cultural fit.</strong> Gemini has no knowledge of your specific brand guidelines,
          market, or audience beyond what you typed — a result that’s technically well-formed can still be
          the wrong call for your actual brand.
        </li>
      </ul>

      <h2>Not professional advice</h2>
      <p>
        AI Generate (and StyleBook generally) doesn’t provide professional design, legal, or accessibility-
        compliance advice. If your project has a hard accessibility requirement (WCAG conformance for a
        government or enterprise contract, for example), verify it against the official standard directly or
        with a qualified reviewer — don’t treat a passing badge in this app as a compliance certificate.
      </p>

      <h2>Regenerating</h2>
      <p>
        If a result isn’t right, regenerating with more specific feedback (“more muted,” “less corporate”)
        usually gets you closer faster than starting over from scratch — and every generated result can be
        opened straight into Studio for manual fine-tuning once you’re happy with the direction.
      </p>

      <p className="mt-8 text-sm text-[#6E675C]">
        See also the <a href="/privacy">Privacy Policy</a> for what happens to the prompt text you type, and
        the <a href="/guide#ai">in-app guide</a> for how to get the most out of AI Generate.
      </p>
    </LegalPage>
  );
}

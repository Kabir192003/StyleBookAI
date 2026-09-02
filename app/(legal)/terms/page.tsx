import { LegalPage } from "@/components/legal/LegalPage";

export const metadata = {
  title: "Terms of Use — StyleBook",
};

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      currentHref="/terms"
      title="Terms of Use"
      updated="18 August 2026"
      intro="Plain-language terms for using StyleBook — a colour, font, and design-system tool. By creating an account or using the site, you’re agreeing to the terms below."
    >
      <h2>The app, as it stands today</h2>
      <p>
        Every feature in StyleBook — browsing colours, fonts, and themes, the Preview Lab, Studio, AI
        Generate, and every export format — is free to use. There’s no paid plan, no credit card, and no
        feature gated behind billing right now. If that ever changes, it will change for future use, not by
        retroactively locking anything you’ve already built or exported.
      </p>

      <h2>Your account</h2>
      <ul>
        <li>You’re responsible for keeping your username and password to yourself and for what happens under your account.</li>
        <li>Accounts are self-service — sign up with just a username and password, no verification step.</li>
        <li>
          You can delete your account at any time from <a href="/account">Account settings</a>. This is
          permanent and removes your saved projects and favorites along with it.
        </li>
        <li>We may suspend or remove accounts used to abuse the service (attacking the site, scraping at scale, or similar) — ordinary use is never at risk of this.</li>
      </ul>

      <h2>What you build here is yours</h2>
      <p>
        Any project, palette, font pairing, or type scale you create or generate — whether assembled by hand
        in Studio or produced by AI Generate — is yours to use however you like: personal projects, client
        work, commercial products, no attribution required. Exported CSS, Tailwind config, tokens, SCSS,
        JSON, style guides, and Figma files are yours the moment you download or export them.
      </p>
      <p>
        The curated colour, font, and theme <em>library</em> itself — the browsable catalogue, its editorial
        notes, and the app’s own design — remains StyleBook’s. Using an item from the library inside your own
        project is exactly what it’s there for; republishing the library itself as a competing product isn’t.
      </p>
      <p>
        Font files are subject to each individual typeface’s own license (most of the library draws from
        open-source font catalogues) — StyleBook helps you discover and pair fonts, it doesn’t relicense
        them.
      </p>

      <h2>AI-generated content</h2>
      <p>
        AI Generate uses Google’s Gemini models to produce a palette, font pairing, type scale, and written
        reasoning from your prompt. See the <a href="/ai-disclaimer">AI Disclaimer</a> for what that means in
        practice — in short, review anything AI Generate produces before you rely on it, the same way you’d
        review any first draft.
      </p>

      <h2>Acceptable use</h2>
      <p>Don’t use StyleBook to:</p>
      <ul>
        <li>Attempt to breach, disrupt, or overload the service (including automated scraping beyond normal browsing).</li>
        <li>Attempt to access another account or data that isn’t yours.</li>
        <li>Use the AI Generate prompt to produce content that’s unlawful, hateful, or otherwise abusive.</li>
        <li>Republish the browsable library (colours, fonts, themes, and their editorial notes) as a standalone competing product.</li>
      </ul>

      <h2>No warranty</h2>
      <p>
        StyleBook is provided “as is.” We work to keep colour data, contrast calculations, and exports
        accurate, but we don’t guarantee the service will be uninterrupted, error-free, or fit for any
        particular purpose — including that a given palette will meet a specific accessibility standard in
        every context it’s used. Always spot-check anything accessibility- or compliance-critical yourself.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        To the fullest extent the law allows, StyleBook isn’t liable for indirect, incidental, or
        consequential damages arising from your use of the service, including reliance on AI-generated
        output or exported design tokens.
      </p>

      <h2>Changes</h2>
      <p>
        These terms may be updated as the product changes. Continuing to use StyleBook after an update means
        you accept the revised terms; the “Last updated” date above always reflects the current version.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about these terms can go to <a href="mailto:stylebook.ai@gmail.com">stylebook.ai@gmail.com</a>.
      </p>
    </LegalPage>
  );
}

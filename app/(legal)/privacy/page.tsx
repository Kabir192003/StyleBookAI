import { LegalPage } from "@/components/legal/LegalPage";

export const metadata = {
  title: "Privacy Policy — StyleBook",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Privacy Policy"
      updated="18 August 2026"
      intro="StyleBook is built to need as little about you as possible. There’s no email address on file, no analytics script, and no ad tracking anywhere in the app — this page describes, plainly, the small amount of data the product actually touches and why."
    >
      <h2>The short version</h2>
      <p>
        Creating an account only ever asks for a username and a password. We don’t collect your email, your
        name, your location, or any other identifying detail — because we never ask for them. Since nothing
        personally identifying is required to sign up, your username and password can be <strong>any format
        and any length</strong>: there’s no minimum length, no required character mix, and no real-world
        identity check behind them. Pick anything you’ll remember.
      </p>

      <h2>What we store</h2>
      <p>An account on StyleBook has exactly four kinds of data behind it, all in one Postgres database:</p>
      <ul>
        <li>
          <strong>Your account</strong> — a username, a bcrypt hash of your password (never the password
          itself, and never logged anywhere in plain text), and the date you signed up.
        </li>
        <li>
          <strong>Your projects</strong> — the design systems you build or generate and choose to save:
          palette, fonts, type scale, and (if you used AI Generate) the prompt you typed and the reasoning
          Gemini returned.
        </li>
        <li>
          <strong>Your favorites</strong> — which colors, fonts, or themes from the library you’ve starred.
        </li>
        <li>
          <strong>Figma export codes</strong> — a short-lived, random one-time code created only when you
          click “Export to Figma.” It holds the design tokens for one export, isn’t linked to your account
          in the database, expires automatically after 30 minutes, and is deleted the moment the Figma
          plugin redeems it.
        </li>
      </ul>
      <p>That’s the entire list. Nothing else about you is recorded, inferred, or purchased from anywhere else.</p>

      <h2>Cookies</h2>
      <p>
        StyleBook sets exactly one cookie — <code>stylebook_session</code> — an <code>httpOnly</code>, signed
        token that keeps you signed in for 30 days. It’s strictly necessary for the sign-in feature to work
        at all; it’s not used for tracking, isn’t shared with anyone, and there’s nothing else riding along
        with it. Signed-out visitors get no cookie of any kind.
      </p>

      <h2>Analytics and tracking</h2>
      <p>
        There is no analytics platform, ad pixel, or third-party tracking script anywhere in StyleBook — not
        Google Analytics, not a heatmap tool, nothing. We don’t know what pages you visited before this one,
        and we don’t build a profile of how you use the app.
      </p>

      <h2>Who else sees your data</h2>
      <p>Two infrastructure providers are involved in running StyleBook, and neither sees more than they need to do their one job:</p>
      <ul>
        <li>
          <strong>Supabase</strong> hosts the Postgres database described above — your account, projects, and
          favorites live there, encrypted at rest by Supabase’s own infrastructure.
        </li>
        <li>
          <strong>Google (Gemini API)</strong> only comes into play if you use <strong>AI Generate</strong>.
          The brand description you type is sent to Google’s Gemini API to produce a palette, font pairing,
          and type scale — that’s the only feature that sends anything you type to a third party, and it only
          happens when you actively click generate.
        </li>
      </ul>
      <p>We don’t sell data, share it with advertisers, or use it for anything beyond making the product work.</p>

      <h2>Deleting your data</h2>
      <p>
        You’re in full control of this yourself — no support ticket required. From <a href="/account">Account
        settings</a>, “Delete account” permanently removes your user record and, with it, every project and
        favorite tied to it. There’s no recovery window and no soft-delete: once it’s gone, it’s gone from our
        database immediately.
      </p>

      <h2>Accessibility preferences</h2>
      <p>
        The visual accessibility settings in <a href="/account">Account settings</a> (high contrast, larger
        text, and similar) are stored only in your browser’s <code>localStorage</code> — they never touch our
        server or database at all, and they don’t transfer between devices.
      </p>

      <h2>Children’s privacy</h2>
      <p>StyleBook isn’t directed at children and isn’t knowingly used to collect data from anyone under 13.</p>

      <h2>Changes to this policy</h2>
      <p>
        If what StyleBook collects ever changes, this page will change with it and the “Last updated” date
        above will move. There’s no mailing list to notify, since we don’t collect the email address that
        would require.
      </p>

      <h2>Questions</h2>
      <p>
        For anything not covered here, reach out at <a href="mailto:kabiroscope@gmail.com">kabiroscope@gmail.com</a>.
      </p>
    </LegalPage>
  );
}

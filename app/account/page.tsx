/**
 * /account — account settings preview
 *
 * Owner: Amna
 *
 * Auth (Clerk) was removed — see CLAUDE.md — so there's no real signed-in
 * user or stored preferences yet. This is a styled, non-functional preview
 * of the eventual page: every field is disabled and the banner up top says
 * so explicitly. When the username/password login lands, wire these up for
 * real (profile fields to the user record, preferences to a per-user
 * settings row) and remove the `disabled` props + banner.
 */
const inputClasses =
  "w-full cursor-not-allowed rounded-lg border border-black/20 bg-white px-[13px] py-[11px] text-sm text-[#211E18] opacity-60";

function ToggleGroup({ options, active }: { options: string[]; active: string }) {
  return (
    <div className="flex gap-2">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          disabled
          className={`flex-1 cursor-not-allowed rounded-lg border py-[9px] font-mono-plex text-[10px] uppercase tracking-[0.14em] opacity-60 ${
            o === active ? "border-[#211E18] bg-[#211E18] text-[#F2EBE0]" : "border-black/[0.16] bg-white text-[#6E675C]"
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-black/[0.12] bg-[#F2EBE0] p-6">
      <div className="font-mono-plex text-[10px] uppercase tracking-[0.2em] text-[#8A8477]">{title}</div>
      <div className="mt-4 flex flex-col gap-4">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-mono-plex text-[9px] uppercase tracking-[0.16em] text-[#B4AD9E]">{label}</span>
      {children}
    </label>
  );
}

export default function AccountPage() {
  return (
    <main className="min-h-[calc(100vh-56px)] bg-[#EDE6DA] px-6 py-10 sm:px-12">
      <div className="mx-auto max-w-[720px]">
        <div className="font-mono-plex text-[10px] uppercase tracking-[0.22em] text-[#8A8477]">Account · Vol. 01</div>
        <h1 className="mt-2 font-editorial-serif text-[34px] font-normal leading-[1.02] tracking-[-0.02em] text-[#211E18]">
          Your account.
        </h1>

        <div className="mt-4 rounded-xl border border-black/[0.14] bg-white/60 px-4 py-3 text-sm text-[#6E675C]">
          Preview only — account settings aren&apos;t wired up yet, since sign-in
          isn&apos;t built. This is what&apos;s coming with the username/password login;
          every field below is disabled for now.
        </div>

        <div className="mt-6 flex flex-col gap-5">
          <Section title="Profile">
            <div className="flex items-center gap-4">
              <div className="grid h-16 w-16 flex-none place-items-center rounded-full border border-black/[0.16] bg-white font-editorial-serif text-2xl text-[#8A8477] opacity-60">
                ?
              </div>
              <button
                type="button"
                disabled
                className="cursor-not-allowed rounded-full border border-black/20 bg-white px-5 py-2 text-sm text-[#6E675C] opacity-60"
              >
                Change photo
              </button>
            </div>
            <Field label="Name">
              <input disabled placeholder="Your name" className={inputClasses} />
            </Field>
            <Field label="Email">
              <input disabled placeholder="you@example.com" className={inputClasses} />
            </Field>
          </Section>

          <Section title="Plan">
            <div className="flex items-center justify-between rounded-lg border border-black/[0.14] bg-white/60 px-4 py-3">
              <div>
                <div className="text-sm font-semibold text-[#211E18]">Free</div>
                <div className="mt-0.5 text-xs text-[#8A8477]">Everything is free while StyleBook is in v1.</div>
              </div>
              <span className="rounded-full bg-[#222D52]/10 px-3 py-1 font-mono-plex text-[10px] uppercase tracking-[0.12em] text-[#222D52]">
                Active
              </span>
            </div>
          </Section>

          <Section title="Preferences">
            <Field label="Theme">
              <ToggleGroup options={["Light", "Dark"]} active="Light" />
            </Field>
            <Field label="Type scale unit">
              <ToggleGroup options={["px", "rem"]} active="px" />
            </Field>
            <Field label="Default export format">
              <select disabled className={inputClasses}>
                <option>CSS variables</option>
              </select>
            </Field>
          </Section>

          <Section title="Danger zone">
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled
                className="cursor-not-allowed rounded-full border border-black/20 bg-white px-6 py-2.5 text-sm text-[#6E675C] opacity-60"
              >
                Sign out
              </button>
              <button
                type="button"
                disabled
                className="cursor-not-allowed rounded-full border border-[#B3261E]/30 bg-white px-6 py-2.5 text-sm text-[#B3261E] opacity-60"
              >
                Delete account
              </button>
            </div>
          </Section>
        </div>
      </div>
    </main>
  );
}

/**
 * The type hierarchy, rendered at the real sizes the system exports.
 *
 * Every specimen resolves `--text-*` and `--pgc-font-*`, so moving the base
 * size or the ratio in the sidebar moves this immediately — that live
 * response is the whole reason the hierarchy is shown as prose rather than as
 * a table of numbers. The sizes are printed alongside anyway, because "how
 * big is h2 actually" is the question a developer asks next.
 */
"use client";

import { GroupShell, Specimen } from "./primitives";

/** Mirrors SEMANTIC_TYPE_ROLES in lib/export/designTokens.ts — same six roles,
 *  same order. The class carries the size/weight/face; this list only labels
 *  them, so the two cannot drift into disagreeing about what an h2 is. */
const ROLES = [
  { className: "pg-display", label: "Display", token: "--text-display" },
  { className: "pg-h1", label: "Heading 1", token: "--text-h1" },
  { className: "pg-h2", label: "Heading 2", token: "--text-h2" },
  { className: "pg-h3", label: "Heading 3", token: "--text-h3" },
] as const;

const SAMPLE: Record<string, string> = {
  "pg-display": "Design that ships",
  "pg-h1": "Everything in one system",
  "pg-h2": "Built from real components",
  "pg-h3": "Tokens, not screenshots",
};

export function TypographyGroup() {
  return (
    <GroupShell>
      <Specimen label="Hierarchy">
        <div className="pg-stack" style={{ gap: "var(--space-3, 16px)" }}>
          {ROLES.map((role) => (
            <div key={role.className}>
              <p className="pg-caption" style={{ marginBottom: 4 }}>
                {role.label} · {role.token}
              </p>
              {/* Real heading elements, not styled divs — the inspector
                  selects on class, but a screen reader and the export's
                  own semantics both depend on the tag being right. */}
              {role.className === "pg-display" ? (
                <p className={role.className}>{SAMPLE[role.className]}</p>
              ) : role.className === "pg-h1" ? (
                <h1 className={role.className}>{SAMPLE[role.className]}</h1>
              ) : role.className === "pg-h2" ? (
                <h2 className={role.className}>{SAMPLE[role.className]}</h2>
              ) : (
                <h3 className={role.className}>{SAMPLE[role.className]}</h3>
              )}
            </div>
          ))}
        </div>
      </Specimen>

      <Specimen label="Body & caption">
        <div className="pg-prose pg-stack" style={{ gap: "var(--space-2, 10px)" }}>
          <p className="pg-body">
            Body copy set at the scale&rsquo;s base size. A paragraph is where a typeface either earns its place or
            gives itself away — the counters, the rhythm and the way it handles a long line all show up here and
            nowhere else in a specimen sheet.
          </p>
          <p className="pg-body pg-body--muted">
            The muted variant carries secondary prose: helper text, descriptions, and anything that should recede
            without dropping below a readable contrast ratio.
          </p>
          <p className="pg-caption">Caption · metadata, timestamps and table footnotes</p>
        </div>
      </Specimen>
    </GroupShell>
  );
}

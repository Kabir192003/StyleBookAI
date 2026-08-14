/**
 * Tables and record lists — the shapes every data-heavy product is mostly
 * made of, and the ones a palette fails at first. A design system that looks
 * fine on buttons and falls apart across forty rows of tabular numbers has
 * not been tested; this is where that shows up.
 *
 * The table consumes `--ds-table-*` (see styles.ts), so it is one of the
 * component types the inspector can edit directly.
 */
"use client";

import { GroupShell, Specimen } from "./primitives";

const ROWS = [
  { ref: "INV-2041", name: "Northwind Studio", status: "Paid", statusClass: "pg-badge--success", amount: "£2,480.00" },
  { ref: "INV-2040", name: "Harbour & Co.", status: "Pending", statusClass: "pg-badge--warning", amount: "£860.00" },
  { ref: "INV-2039", name: "Fieldnotes Press", status: "Overdue", statusClass: "pg-badge--error", amount: "£1,145.50" },
  { ref: "INV-2038", name: "Meridian Labs", status: "Paid", statusClass: "pg-badge--success", amount: "£310.00" },
];

const DETAILS = [
  ["Reference", "INV-2041"],
  ["Issued", "18 February 2026"],
  ["Due", "18 March 2026"],
  ["Payment terms", "Net 30"],
  ["Total", "£2,480.00"],
];

export function DataDisplayGroup() {
  return (
    <GroupShell>
      <Specimen label="Table">
        <div className="pg-table-wrap">
          <table className="pg-table">
            <thead>
              <tr>
                <th scope="col">Reference</th>
                <th scope="col">Account</th>
                <th scope="col">Status</th>
                <th scope="col" className="pg-table__num">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr key={row.ref}>
                  <td>{row.ref}</td>
                  <td>{row.name}</td>
                  <td>
                    <span className={`pg-badge ${row.statusClass}`}>{row.status}</span>
                  </td>
                  <td className="pg-table__num">{row.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Specimen>

      <Specimen label="Record detail">
        <div className="pg-card">
          <dl className="pg-deflist">
            {DETAILS.map(([key, value]) => (
              <div key={key} className="pg-deflist__row">
                <dt className="pg-deflist__key">{key}</dt>
                <dd className="pg-deflist__val">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Specimen>
    </GroupShell>
  );
}

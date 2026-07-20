"use client";

import { ArrowUpDown } from "lucide-react";

export type SortOption = { value: string; label: string };

type SortDropdownProps = {
  value: string;
  onChange: (value: string) => void;
  options: SortOption[];
};

export function SortDropdown({ value, onChange, options }: SortDropdownProps) {
  return (
    <div className="relative w-full sm:w-[180px]">
      <ArrowUpDown className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-neutral-200 bg-white py-2 pl-8 pr-3 text-sm text-neutral-900 outline-none focus:border-neutral-400"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

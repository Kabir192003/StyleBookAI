"use client";

type FilterDropdownProps = {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  allLabel?: string;
  className?: string;
};

export function FilterDropdown({
  value,
  onChange,
  options,
  allLabel = "All",
  className,
}: FilterDropdownProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={
        className ??
        "w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-400 sm:w-[180px]"
      }
    >
      <option value="__all__">{allLabel}</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}

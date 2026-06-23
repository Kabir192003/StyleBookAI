/**
 * Button — shared primitive used across the app instead of raw <button>
 * tags. Keep this dependency-free (no Radix needed for v1) but consistent.
 *
 * Owner: Amna
 *
 * TODO (Amna): variants (primary/secondary/ghost/destructive), sizes (sm/md/lg),
 * loading state with spinner, asChild-style polymorphism if needed later.
 */
import { ButtonHTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={clsx(
          "rounded-md px-4 py-2 text-sm transition-colors disabled:opacity-40",
          variant === "primary" && "bg-black text-white hover:bg-neutral-800",
          variant === "secondary" && "border hover:bg-neutral-50",
          variant === "ghost" && "hover:bg-neutral-100",
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

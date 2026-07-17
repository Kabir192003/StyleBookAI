/**
 * Button — shared primitive used across the app instead of raw <button>
 * tags. Dependency-free (class-variance-authority is already installed
 * for this exact use, no Radix needed for v1).
 *
 * Owner: Amna
 *
 * Variants follow the app-shell tokens in app/globals.css (--app-accent
 * etc.) so this component tracks light/dark automatically — see
 * docs/PRODUCT_AND_UX.md §4. `foil` (Kabir's own --gradient-gold, reused
 * verbatim) is the main primary-action style — gold as an *object*, per
 * his own rule in landing globals.css ("gold TEXT on silk fails
 * readability"); text on top of it stays dark ink, never gold. `accent`
 * (oxblood) is for secondary emphasis — links, focus rings, quieter CTAs.
 */
import { ButtonHTMLAttributes, forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { clsx } from "clsx";

const button = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg font-semibold " +
    "transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50 " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-accent focus-visible:ring-offset-2 focus-visible:ring-offset-app-bg",
  {
    variants: {
      variant: {
        primary:
          "bg-app-text text-app-bg hover:opacity-90",
        foil:
          "bg-gold-foil text-onyx border border-black/10 shadow-sm hover:brightness-105",
        accent:
          "bg-app-accent text-pearl hover:bg-app-accent-hover",
        secondary:
          "border border-app-border-strong bg-app-surface text-app-text hover:bg-app-surface-hover",
        ghost: "text-app-text-secondary hover:bg-app-surface-hover hover:text-app-text",
        destructive:
          "bg-app-danger-soft text-app-danger border border-app-danger/30 hover:bg-app-danger hover:text-pearl",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-[15px]",
      },
    },
    defaultVariants: {
      variant: "foil",
      size: "md",
    },
  }
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof button> & {
    loading?: boolean;
  };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, loading = false, disabled, children, ...props },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={clsx(button({ variant, size }), className)}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

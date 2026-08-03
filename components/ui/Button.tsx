/**
 * Button — shared primitive used across the dashboard/account/pricing
 * pages instead of raw <button> tags.
 *
 * Owner: Amna (styling adapted to the site's cream/ink/navy editorial
 * system — see CLAUDE.md — instead of the separate glass/dark design
 * system this was originally built against, to stay visually consistent
 * with Studio/browse/SiteHeader).
 */
import { ButtonHTMLAttributes, forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { clsx } from "clsx";

const button = cva(
  "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-200 " +
    "hover:-translate-y-[2px] active:translate-y-0 active:scale-[0.98] " +
    "disabled:pointer-events-none disabled:opacity-50 disabled:hover:translate-y-0",
  {
    variants: {
      variant: {
        primary: "border border-transparent bg-[#222D52] text-[#F2EBE0]",
        ghost: "border border-black/20 bg-white text-[#211E18]",
        destructive: "border border-[#B3261E]/30 bg-white text-[#B3261E]",
      },
      size: {
        sm: "h-8 px-4 text-xs",
        md: "h-10 px-5 text-sm",
        lg: "h-12 px-7 text-[15px]",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export const buttonVariants = button;

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

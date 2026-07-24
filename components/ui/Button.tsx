/**
 * Button — shared primitive used across the app instead of raw <button>
 * tags.
 *
 * Owner: Amna
 *
 * Built against docs/StyleBook-Design-System.pdf §06 "Buttons — liquid
 * glass": two variants only, both translucent with backdrop blur and an
 * inset top highlight — "No solid-fill, no gradient-fill buttons — glass
 * is the house material." `destructive` is the one narrow exception
 * (danger needs a distinct, unambiguous signal), kept in the same glass
 * family rather than a flat fill.
 *
 * - primary: rgba(28,38,72,.82) — one per view, the single most important
 *   action
 * - ghost: rgba(253,253,251,.42) — secondary action, always paired with
 *   primary
 *
 * Both: radius-full, sheen sweep on hover (.glass-sheen, see
 * app/globals.css), lift -3px on hover, scale(.98) + translateY(-1px) on
 * press.
 */
import { ButtonHTMLAttributes, forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { clsx } from "clsx";

const button = cva(
  "glass-sheen inline-flex items-center justify-center gap-2 rounded-full font-medium " +
    "backdrop-blur-md transition-all duration-200 " +
    "hover:-translate-y-[3px] active:translate-y-[-1px] active:scale-[0.98] " +
    "disabled:pointer-events-none disabled:opacity-50 disabled:hover:translate-y-0",
  {
    variants: {
      variant: {
        primary:
          "border border-glass-primary bg-glass-primary text-[#F7F3EA] shadow-app-md hover:shadow-app-xl",
        ghost:
          "border border-glass-ghost bg-glass-ghost text-app-heading shadow-app-sm hover:shadow-app-md",
        destructive:
          "border border-app-danger/30 bg-app-danger-soft/80 text-app-danger shadow-app-sm hover:shadow-app-md hover:bg-app-danger/90 hover:text-[#F7F3EA] hover:border-transparent",
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

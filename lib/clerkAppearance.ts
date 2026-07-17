/**
 * Shared Clerk `appearance` config — used by <SignIn />, <SignUp />, and
 * <UserProfile /> so Clerk's prebuilt UI matches the app-shell brand
 * tokens (app/globals.css) instead of Clerk's default theme. Referencing
 * the CSS custom properties directly (rather than hardcoded hex) means
 * this stays correct in dark mode with zero extra work.
 *
 * Owner: Amna
 */
export const clerkAppearance = {
  variables: {
    colorPrimary: "var(--app-accent)",
    colorText: "var(--app-text)",
    colorTextSecondary: "var(--app-text-secondary)",
    colorBackground: "var(--app-surface)",
    colorInputBackground: "var(--app-bg)",
    colorInputText: "var(--app-text)",
    colorDanger: "var(--app-danger)",
    colorSuccess: "var(--app-success)",
    borderRadius: "0.625rem",
    fontFamily: "var(--font-humanist-sans)",
  },
  elements: {
    card: "shadow-none border border-app-border bg-app-surface",
    headerTitle: "font-editorial-serif text-app-heading",
    formButtonPrimary:
      "bg-app-accent hover:bg-app-accent-hover text-pearl normal-case shadow-none",
    footerActionLink: "text-app-accent hover:text-app-accent-hover",
    socialButtonsBlockButton: "border-app-border",
    dividerLine: "bg-app-border",
    dividerText: "text-app-text-muted",
  },
};

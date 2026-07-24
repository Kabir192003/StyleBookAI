/**
 * Shared Clerk `appearance` config — used by <SignIn />, <SignUp />, and
 * <UserProfile /> so Clerk's prebuilt UI matches the app-shell brand
 * tokens (app/globals.css) instead of Clerk's default theme.
 *
 * Owner: Amna
 */
export const clerkAppearance = {
  variables: {
    colorPrimary: "var(--app-heading)",
    colorText: "var(--app-text)",
    colorTextSecondary: "var(--app-text-secondary)",
    colorBackground: "var(--app-surface)",
    colorInputBackground: "var(--app-bg)",
    colorInputText: "var(--app-text)",
    colorDanger: "var(--app-danger)",
    colorSuccess: "var(--app-success)",
    borderRadius: "9999px",
    fontFamily: "var(--font-humanist-sans)",
  },
  elements: {
    card: "shadow-none border-none bg-transparent",
    headerTitle: "font-geometric-sans text-app-heading",
    formButtonPrimary:
      "glass-sheen border border-glass-primary bg-glass-primary text-[#F7F3EA] hover:-translate-y-[2px] normal-case shadow-app-sm",
    footerActionLink: "text-app-accent hover:text-app-accent-hover",
    socialButtonsBlockButton: "border-app-border-strong rounded-full",
    formFieldInput: "border-app-border-strong rounded-lg",
    dividerLine: "bg-app-border-strong",
    dividerText: "text-app-text-muted",
  },
};

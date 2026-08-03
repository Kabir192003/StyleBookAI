/**
 * Client-side auth state — who's signed in, if anyone. Not persisted
 * (the real session lives in the httpOnly cookie); this store just
 * caches the /api/auth/me response for the current page load so every
 * component that needs to know "am I signed in" doesn't each fetch it
 * separately. Call `fetchUser()` once near the root (SiteHeader does
 * this) and read `user`/`status` everywhere else.
 */
import { create } from "zustand";

export type AuthUser = { id: string; username: string; createdAt: string };

type AuthState = {
  user: AuthUser | null;
  status: "loading" | "ready";
  fetchUser: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  status: "loading",
  async fetchUser() {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      set({ user: data.user, status: "ready" });
    } catch {
      set({ user: null, status: "ready" });
    }
  },
  setUser(user) {
    set({ user, status: "ready" });
  },
  async logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    set({ user: null, status: "ready" });
  },
}));

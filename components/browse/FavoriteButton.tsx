// Heart toggle used on color/font/theme tiles. Lazy-loads the user's
// favorites set on first mount (guarded by favoritesStore's `loaded`
// flag) instead of every browse page fetching up front. Signed-out clicks
// go to /sign-in rather than failing silently — favoriting needs an
// account, browsing doesn't. Also watches `sessionExpired` (set when a
// toggle 401s mid-visit) to clear the stale user and redirect, instead of
// leaving the heart looking "saved" when it silently wasn't.
"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Heart } from "lucide-react";
import { useAuthStore, useFavoritesStore } from "@/store";
import type { FavoriteType } from "@/store/favoritesStore";

export function FavoriteButton({
  type,
  id,
  className = "",
  style,
}: {
  type: FavoriteType;
  id: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const authStatus = useAuthStore((s) => s.status);
  const setUser = useAuthStore((s) => s.setUser);
  const loaded = useFavoritesStore((s) => s.loaded);
  const load = useFavoritesStore((s) => s.load);
  const toggle = useFavoritesStore((s) => s.toggle);
  const favorited = useFavoritesStore((s) => s.isFavorited(type, id));
  const sessionExpired = useFavoritesStore((s) => s.sessionExpired);
  const acknowledgeSessionExpired = useFavoritesStore((s) => s.acknowledgeSessionExpired);

  useEffect(() => {
    if (user && !loaded) load();
  }, [user, loaded, load]);

  useEffect(() => {
    if (!sessionExpired) return;
    acknowledgeSessionExpired();
    setUser(null);
    router.push(`/sign-in?reason=session-expired&from=${encodeURIComponent(pathname)}`);
  }, [sessionExpired, acknowledgeSessionExpired, setUser, router, pathname]);

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (authStatus === "loading") return;
    if (!user) {
      router.push(`/sign-in?reason=favorites&from=${encodeURIComponent(pathname)}`);
      return;
    }
    toggle(type, id);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={favorited}
      aria-label={favorited ? `Remove from favorites` : `Save to favorites`}
      className={`inline-flex h-7 w-7 items-center justify-center rounded-full transition-colors ${className}`}
      style={style}
    >
      <Heart
        className="h-4 w-4 transition-colors"
        fill={favorited ? "currentColor" : "none"}
        aria-hidden="true"
      />
    </button>
  );
}

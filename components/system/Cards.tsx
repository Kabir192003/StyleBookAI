/**
 * Cards — the surfaces that decide whether a palette actually works, because
 * they are the only specimens that force `surface`, `border`, `text`,
 * `text-muted` and `accent` to sit inside one box at the same time. A palette
 * whose card looks flat here will look flat in the product.
 *
 * Content is written, not lorem ipsum, on purpose (docs/DESIGN_PLAYGROUND.md:
 * "look like a real product surface"). Real sentence lengths are what expose a
 * body font with poor rhythm or a text/muted pair with too little separation —
 * repeated placeholder words hide both.
 *
 * The product and article cards are interactive containers, so they are real
 * `<a>` elements: `.pg-card--interactive` gives them hover lift *and* a
 * `:focus-visible` ring, and a div with an onClick would have neither keyboard
 * reachability nor that ring. The `href="#"` is inert-by-intent — these are
 * specimens on a canvas, not navigation.
 */
"use client";

import { useState } from "react";
import { Image as ImageIcon, MessageSquare, ShoppingBag, Star } from "lucide-react";

export function FollowButton() {
  const [following, setFollowing] = useState(false);
  return (
    <button
      type="button"
      className={following ? "pg-btn pg-btn--outline pg-btn--sm" : "pg-btn pg-btn--primary pg-btn--sm"}
      aria-pressed={following}
      onClick={() => setFollowing((v) => !v)}
    >
      {following ? "Following" : "Follow"}
    </button>
  );
}

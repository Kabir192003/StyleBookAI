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
 * `.pg-card--interactive` (styles.ts) exists for a card that genuinely is a
 * real `<a>`/`<button>` — it gives hover lift and a `:focus-visible` ring,
 * consuming the same --ds-card-* tokens the card's own colours do. Nothing
 * in the current showcase/generated canvas content applies it (every
 * rendered card is a plain, non-actionable `.pg-card`) — a div styled to
 * look clickable with no real click target is worse than one that looks
 * static, so don't add the class back onto a container with nothing to
 * click just to "use" it. It stays wired and correct for whichever card
 * genuinely needs it.
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

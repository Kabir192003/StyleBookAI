// Cards are the only specimens that force surface/border/text/text-muted/
// accent into one box together — a palette whose card looks flat here will
// look flat in the product. Content is written, not lorem ipsum, on purpose:
// real sentence lengths expose a body font with poor rhythm or a text/muted
// pair with too little separation, which repeated placeholder words hide.
//
// .pg-card--interactive (styles.ts) is for a card that's a real <a>/<button>.
// Nothing in the current showcase/generated content uses it — every rendered
// card is a plain, non-actionable .pg-card — but don't add the class onto a
// container with nothing to click just to "use" it; a div styled clickable
// with no real target is worse than one that looks static. It stays wired
// and correct for whichever card genuinely needs it.
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

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
import { GroupShell, Specimen } from "./primitives";

function FollowButton() {
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

export function CardsGroup() {
  return (
    <GroupShell>
      <Specimen label="Basic">
        <article className="pg-card" style={{ maxWidth: 340 }}>
          <div className="pg-card__body">
            <h3 className="pg-card__title">Weekly digest</h3>
            <p className="pg-card__text">
              Four new palettes and two type pairings were added to your workspace this week. Nothing needs your
              approval.
            </p>
          </div>
          <div className="pg-card__footer">
            <span className="pg-badge pg-badge--soft">6 updates</span>
            <button type="button" className="pg-btn pg-btn--ghost pg-btn--sm">
              Review
            </button>
          </div>
        </article>
      </Specimen>

      <Specimen label="Product">
        <div className="pg-grid">
          <a className="pg-card pg-card--interactive" href="#">
            <div className="pg-card__media">
              <ShoppingBag size={34} strokeWidth={1.25} aria-hidden="true" />
            </div>
            <div className="pg-card__body">
              <span className="pg-card__eyebrow">Ceramics</span>
              <h3 className="pg-card__title">Ridged stoneware mug</h3>
              <div className="pg-row" style={{ gap: 6 }}>
                <span className="pg-rating" aria-hidden="true">
                  <Star size={12} fill="currentColor" />
                  <Star size={12} fill="currentColor" />
                  <Star size={12} fill="currentColor" />
                  <Star size={12} fill="currentColor" />
                  <Star size={12} />
                </span>
                <span className="pg-hint">4.2 · 118 reviews</span>
              </div>
            </div>
            <div className="pg-card__footer">
              <span className="pg-row" style={{ gap: 8 }}>
                <span className="pg-card__price">£28</span>
                <span className="pg-card__strike">£34</span>
              </span>
              {/* Not a nested <button> — a button inside an anchor is invalid
                  HTML and the browser will re-parent it out of the card. The
                  CTA is styled text that the whole card's link already
                  activates. */}
              <span className="pg-btn pg-btn--primary pg-btn--sm" aria-hidden="true">
                Add to bag
              </span>
            </div>
          </a>

          <article className="pg-card">
            <div className="pg-card__media">
              <ImageIcon size={34} strokeWidth={1.25} aria-hidden="true" />
            </div>
            <div className="pg-card__body">
              <span className="pg-card__eyebrow">Out of stock</span>
              <h3 className="pg-card__title">Linen apron, sand</h3>
              <p className="pg-card__text">Back in stock mid-March. We’ll email you the moment it lands.</p>
            </div>
            <div className="pg-card__footer">
              <span className="pg-card__price">£46</span>
              <button type="button" className="pg-btn pg-btn--outline pg-btn--sm">
                Notify me
              </button>
            </div>
          </article>
        </div>
      </Specimen>

      <Specimen label="Profile">
        <article className="pg-card" style={{ maxWidth: 340 }}>
          <div className="pg-card__body" style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            <span className="pg-avatar-wrap">
              <span className="pg-avatar pg-avatar--lg pg-avatar--accent" aria-hidden="true">
                MO
              </span>
              <span className="pg-avatar__status" aria-hidden="true" />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 className="pg-card__title" style={{ fontSize: "var(--text-base, 16px)" }}>
                Mariam Okonjo
              </h3>
              <p className="pg-hint">Principal designer · Lagos</p>
            </div>
            <FollowButton />
          </div>
          <div className="pg-card__footer">
            <span className="pg-hint">Online now · 24 shared systems</span>
            <span className="pg-hint" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <MessageSquare size={13} aria-hidden="true" />9
            </span>
          </div>
        </article>
      </Specimen>

      <Specimen label="Article">
        <a className="pg-card pg-card--interactive" href="#" style={{ maxWidth: 460 }}>
          <div className="pg-card__body">
            <span className="pg-card__eyebrow">Field notes</span>
            <h3 className="pg-card__title" style={{ fontSize: "var(--text-xl, 22px)" }}>
              Why your neutrals are doing more work than your brand colour
            </h3>
            <p className="pg-card__text">
              Teams spend weeks arguing about the accent and ten minutes picking the greys around it. That ratio is
              backwards — here is a way to choose neutrals that survives a dark mode.
            </p>
            <div className="pg-card__meta">
              <span className="pg-avatar pg-avatar--sm" aria-hidden="true">
                JL
              </span>
              <span>Jonah Lindqvist</span>
              <span className="pg-card__dot" aria-hidden="true" />
              <span>7 min read</span>
              <span className="pg-card__dot" aria-hidden="true" />
              <time dateTime="2026-02-18">18 Feb</time>
            </div>
          </div>
        </a>
      </Specimen>
    </GroupShell>
  );
}

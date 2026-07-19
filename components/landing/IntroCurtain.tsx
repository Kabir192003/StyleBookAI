"use client";

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { prefersReducedMotion } from '@/lib/landing/motion';

export const INTRO_DONE_EVENT = 'sb:intro:done';
const SEEN_KEY = 'sb-intro-seen';

const SWATCHES = ['#222D52', '#D2B68A', '#9A4030', '#E8E4E0', '#16192A'];

/**
 * First-visit arrival: a silk curtain with the wordmark and a swatch bar
 * that fills, then lifts to reveal the hero (which waits for the
 * INTRO_DONE_EVENT before playing its own cascade). Session-gated and
 * skipped entirely under reduced motion.
 */
export default function IntroCurtain() {
  const rootRef = useRef(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const finish = () => {
      try { sessionStorage.setItem(SEEN_KEY, '1'); } catch {}
      document.documentElement.classList.remove('intro-active');
      window.dispatchEvent(new Event(INTRO_DONE_EVENT));
      setDone(true);
    };

    let seen = false;
    try { seen = sessionStorage.getItem(SEEN_KEY) === '1'; } catch {}

    if (seen || prefersReducedMotion()) {
      // No class was set, so the hero plays immediately; just get out of the way.
      setDone(true);
      return;
    }

    document.documentElement.classList.add('intro-active');

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: 'power3.out' },
        onComplete: finish,
      });

      tl.fromTo('.intro__dot',
        { scale: 0 },
        { scale: 1, duration: 0.45, ease: 'back.out(2.2)' },
        0.1
      )
        .fromTo('.intro__word',
          { yPercent: 115 },
          { yPercent: 0, duration: 0.65 },
          0.22
        )
        .fromTo('.intro__swatch',
          { scaleY: 0 },
          { scaleY: 1, duration: 0.4, stagger: 0.055, ease: 'power2.out' },
          0.42
        )
        .to(root, {
          yPercent: -100,
          duration: 0.85,
          ease: 'power4.inOut',
        }, 1.25);
    }, root);

    return () => {
      ctx.revert();
      document.documentElement.classList.remove('intro-active');
    };
  }, []);

  if (done) return null;

  return (
    <div ref={rootRef} className="intro" aria-hidden="true">
      <div className="intro__mark">
        <img className="intro__dot" src="/brand/stylebook-logo.svg" alt="" width={40} height={40} />
        <span className="intro__word-mask">
          <span className="intro__word">StyleBook</span>
        </span>
      </div>
      <div className="intro__swatches">
        {SWATCHES.map((c) => (
          <span key={c} className="intro__swatch" style={{ background: c }} />
        ))}
      </div>
    </div>
  );
}

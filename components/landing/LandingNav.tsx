"use client";

import { useEffect, useRef } from 'react';
import { prefersReducedMotion } from '@/lib/landing/motion';

/**
 * Minimal fixed nav: wordmark, three product links, one CTA, and a hairline
 * scroll-progress bar (the page hides the native scrollbar, so this is the
 * user's only sense of depth on a very long scroll).
 */
export default function LandingNav() {
  const navRef = useRef<HTMLElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const nav = navRef.current;
    const progress = progressRef.current;
    if (!nav || !progress) return;

    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const p = max > 0 ? window.scrollY / max : 0;
        progress.style.transform = `scaleX(${p})`;
        nav.classList.toggle('is-scrolled', window.scrollY > 24);
      });
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <header
      ref={navRef}
      className={`landing-nav ${prefersReducedMotion() ? '' : 'landing-nav--enter'}`}
    >
      <div className="landing-nav__inner">
        <a className="landing-nav__brand" href="/" aria-label="StyleBook home">
          <img
            className="landing-nav__brand-mark"
            src="/brand/stylebook-logo.svg"
            alt=""
            aria-hidden="true"
            width={30}
            height={30}
          />
          StyleBook
        </a>

        <nav className="landing-nav__links" aria-label="Primary">
          <a href="/browse/colors">Colours</a>
          <a href="/browse/fonts">Fonts</a>
          <a href="/browse/themes">Themes</a>
          <a href="/studio">Studio</a>
        </nav>

        <a className="landing-nav__cta" href="/studio/ai">
          Generate with AI
        </a>
      </div>
      <div className="landing-nav__progress" aria-hidden="true">
        <div ref={progressRef} className="landing-nav__progress-fill" />
      </div>
    </header>
  );
}

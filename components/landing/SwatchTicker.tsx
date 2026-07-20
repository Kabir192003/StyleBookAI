"use client";

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { prefersReducedMotion } from '@/lib/landing/motion';

// Hex codes and type personalities — the library's raw material as a ticker
const TOKENS = [
  { text: '#264653', kind: 'hex' },
  { text: 'Sora', kind: 'font font-geometric-sans' },
  { text: '#2A9D8F', kind: 'hex' },
  { text: 'Fraunces', kind: 'font font-editorial-serif' },
  { text: '#E9C46A', kind: 'hex' },
  { text: 'Archivo', kind: 'font font-grotesk' },
  { text: '#E76F51', kind: 'hex' },
  { text: 'Unbounded', kind: 'font font-expressive-display' },
  { text: '#222D52', kind: 'hex' },
  { text: 'Inter', kind: 'font font-humanist-sans' },
  { text: '#D2B68A', kind: 'hex' },
  { text: 'Plex Mono', kind: 'font' },
];

/**
 * Velocity-reactive marquee: drifts on its own, accelerates and skews with
 * scroll, and reverses direction with it — the library rushing past on the
 * way into the colour wall.
 */
export default function SwatchTicker() {
  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const track = trackRef.current;
    if (!root || !track || prefersReducedMotion()) return;

    let x = 0;
    let vel = 0;
    let dir = 1;
    let lastY = window.scrollY;
    let half = track.scrollWidth / 2;

    const onResize = () => { half = track.scrollWidth / 2; };
    window.addEventListener('resize', onResize);

    const skewTo = gsap.quickTo(track, 'skewX', { duration: 0.4, ease: 'power2.out' });

    const tick = (_t: number, deltaMS: number) => {
      const dt = deltaMS / 1000;
      const scrollDelta = window.scrollY - lastY;
      lastY = window.scrollY;

      // Smoothed scroll velocity (px/frame) drives speed, direction and skew
      vel += (scrollDelta - vel) * 0.12;
      if (Math.abs(vel) > 0.5) dir = vel > 0 ? 1 : -1;

      const speed = 55 + Math.min(Math.abs(vel) * 16, 700);
      x -= speed * dt * dir;

      // Wrap seamlessly across the duplicated half
      if (x <= -half) x += half;
      if (x > 0) x -= half;

      gsap.set(track, { x });
      skewTo(gsap.utils.clamp(-6, 6, -vel * 0.12));
    };

    gsap.ticker.add(tick);

    return () => {
      gsap.ticker.remove(tick);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  const row = [...TOKENS, ...TOKENS];

  return (
    <section ref={rootRef} className="ticker" aria-label="Colours and typefaces from the library">
      <div ref={trackRef} className="ticker__track">
        {[0, 1].map((half) => (
          <div className="ticker__half" key={half} aria-hidden={half === 1}>
            {row.map((token, i) => (
              <span key={`${half}-${i}`} className="ticker__item">
                <span className={`ticker__token ticker__token--${token.kind.split(' ')[0]} ${token.kind.split(' ').slice(1).join(' ')}`}>
                  {token.text}
                </span>
                <span className="ticker__sep" aria-hidden="true">·</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

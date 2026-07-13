"use client";

import { useEffect, useState } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion } from '@/lib/landing/motion';

// Curated chapter stops (not every section — the story beats)
const STOPS = [
  { id: 'hero', label: 'Start' },
  { id: 'chaos', label: 'The problem' },
  { id: 'unification', label: 'One place' },
  { id: 'ai-thinking', label: 'AI generate' },
  { id: 'interactive', label: 'Make it yours' },
  { id: 'explore', label: 'The wall' },
  { id: 'studio', label: 'The studio' },
  { id: 'cta', label: 'Begin' },
];

// Every section mapped to an atmosphere so the ambient light re-tints
// as the story moves (see body[data-tint] rules in globals.css).
const TINTS = {
  hero: 'warm', chaos: 'warm',
  unification: 'gold', workspace: 'gold',
  'ai-thinking': 'sand', editorial: 'sand',
  interactive: 'cool', explore: 'cool',
  typography: 'ink', studio: 'ink',
  accessibility: 'warm', export: 'gold', cta: 'sand',
};

/**
 * Right-edge chapter rail: tracks the active scene, jumps on click, and
 * drives the page's ambient tint. Desktop only (hidden via CSS below 1024).
 */
export default function SceneRail() {
  const [active, setActive] = useState('hero');

  useEffect(() => {
    const triggers = [];

    document.querySelectorAll('main section[id]').forEach((el) => {
      const tint = TINTS[el.id];
      const isStop = STOPS.some((s) => s.id === el.id);

      triggers.push(ScrollTrigger.create({
        trigger: el,
        start: 'top 55%',
        onEnter: () => {
          if (isStop) setActive(el.id);
          if (tint) document.body.dataset.tint = tint;
        },
        onEnterBack: () => {
          if (isStop) setActive(el.id);
          if (tint) document.body.dataset.tint = tint;
        },
      }));
    });

    return () => {
      triggers.forEach((t) => t.kill());
      delete document.body.dataset.tint;
    };
  }, []);

  const jump = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const lenis = window.__lenis;
    if (lenis && !prefersReducedMotion()) {
      lenis.scrollTo(el, { duration: 1.6 });
    } else {
      el.scrollIntoView({ behavior: 'auto', block: 'start' });
    }
  };

  return (
    <nav className="scene-rail" aria-label="Page chapters">
      {STOPS.map((stop) => (
        <button
          key={stop.id}
          type="button"
          className={`scene-rail__stop ${active === stop.id ? 'is-active' : ''}`}
          onClick={() => jump(stop.id)}
          aria-label={`Go to ${stop.label}`}
          aria-current={active === stop.id ? 'true' : undefined}
        >
          <span className="scene-rail__label">{stop.label}</span>
          <span className="scene-rail__dot" aria-hidden="true" />
        </button>
      ))}
    </nav>
  );
}

"use client";

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Braces,
  FileJson2,
  Wind,
  Figma,
  Atom,
  Layers,
  Bird,
} from 'lucide-react';
import { EXPORT_FORMATS } from '@/lib/landing/constants';
import { prefersReducedMotion } from '@/lib/landing/motion';

const EXPORT_ICONS = {
  css: Braces,
  json: FileJson2,
  tailwind: Wind,
  figma: Figma,
  react: Atom,
  flutter: Layers,
  swift: Bird,
};

function ExportIcon({ type }: { type: keyof typeof EXPORT_ICONS }) {
  const Icon = EXPORT_ICONS[type] || Braces;
  return <Icon size={18} strokeWidth={2} aria-hidden="true" />;
}

export default function ScrollExport() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const pin = section.querySelector('.export__pin');
    const header = section.querySelector('.export__header');
    const tokenDot = section.querySelector('.export__token-dot');
    const render = section.querySelector('.export__render');
    const cards = section.querySelectorAll('.export-card');

    if (prefersReducedMotion()) {
      section.style.height = 'auto';
      gsap.set([header, render], { opacity: 1, y: 0 });
      gsap.set(cards, { opacity: 1, y: 0, scale: 1 });
      return;
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: 'bottom bottom',
          pin: pin,
          scrub: 1.1,
        },
      });

      // Phase 1: Token dot appears (compression)
      tl.to(tokenDot, {
        opacity: 1,
        scale: 1.5,
        duration: 0.1,
        ease: 'back.out(2)',
      }, 0);

      tl.to(tokenDot, {
        scale: 0.8,
        duration: 0.08,
      }, 0.12);

      // Phase 2: Header
      tl.to(header, { opacity: 1, y: 0, duration: 0.1 }, 0.15);

      // Phase 3: Token dot hands off to the product shot
      tl.to(tokenDot, { opacity: 0, scale: 0, duration: 0.08 }, 0.24);

      tl.fromTo(render,
        { opacity: 0, y: 34, scale: 0.965 },
        { opacity: 1, y: 0, scale: 1, duration: 0.14, ease: 'power3.out' },
        0.26
      );

      // Phase 4: Format cards fan out over the render's lower edge
      cards.forEach((card, i) => {
        tl.to(card, {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.08,
          ease: 'back.out(1.3)',
        }, 0.4 + i * 0.04);

        // Shimmer effect
        tl.call(() => card.classList.add('shimmer'), [], 0.45 + i * 0.04);
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="export" id="export">
      <div className="export__pin">
        <div className="export__container">
          <div className="export__token-dot" />

          <div className="export__header" style={{ transform: 'translateY(20px)' }}>
            <p className="scene-eyebrow">Production ready</p>
            <h2>Export everywhere.</h2>
            <p>From design to production in one click.</p>
          </div>

          <div className="export__render">
            <img
              src="/landing/export-render.jpg"
              alt="StyleBook export screen — design tokens, Figma library, style guide and web preview files"
              loading="lazy"
            />
          </div>

          <div className="export__cards">
            {EXPORT_FORMATS.map((format) => (
              <div key={format.id} className="export-card">
                <div className={`export-card__icon export-card__icon--${format.iconType}`}>
                  <ExportIcon type={format.iconType as keyof typeof EXPORT_ICONS} />
                </div>
                <div className="export-card__info">
                  <div className="export-card__name">{format.name}</div>
                  <div className="export-card__desc">{format.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

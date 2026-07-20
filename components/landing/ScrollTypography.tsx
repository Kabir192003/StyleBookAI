"use client";

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion } from '@/lib/landing/motion';

// The four voices the headline speaks in — all really loaded via next/font.
const PERSONALITIES = [
  { label: 'Sora — Geometric', family: 'var(--font-geometric-sans), sans-serif', style: 'normal', weight: 700, spacing: '-0.03em' },
  { label: 'Fraunces — Editorial', family: 'var(--font-editorial-serif), serif', style: 'italic', weight: 500, spacing: '-0.015em' },
  { label: 'Archivo — Grotesk', family: 'var(--font-grotesk), sans-serif', style: 'normal', weight: 700, spacing: '-0.02em' },
  { label: 'Unbounded — Expressive', family: 'var(--font-expressive-display), sans-serif', style: 'normal', weight: 700, spacing: '-0.01em' },
];

const FRAGMENTS = [
  { text: 'Aa', className: 'font-geometric-sans', top: '70%', left: '15%', size: '4rem', opacity: 0.2 },
  { text: '&', className: 'font-editorial-serif', top: '80%', left: '30%', size: '6rem', opacity: 0.1 },
  { text: '0123', className: 'font-grotesk', top: '65%', right: '25%', size: '3rem', opacity: 0.3 },
  { text: 'Rr', className: 'font-expressive-display', top: '75%', right: '15%', size: '5rem', opacity: 0.15 },
];

export default function ScrollTypography() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const pin = section.querySelector('.typography__pin');
    const headline = section.querySelector('.typography__headline');
    const fragments = section.querySelectorAll('.typography__fragment');
    const labels = section.querySelectorAll('.typography__label span');

    const applyPersonality = (p: (typeof PERSONALITIES)[number]) => {
      gsap.set(headline, {
        fontFamily: p.family,
        fontStyle: p.style,
        fontWeight: p.weight,
        letterSpacing: p.spacing,
      });
    };

    if (prefersReducedMotion()) {
      section.style.height = 'auto';
      applyPersonality(PERSONALITIES[0]);
      gsap.set(labels[0], { opacity: 1 });
      return;
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: 'bottom bottom',
          pin: pin,
          scrub: 1,
        },
      });

      // Each personality holds a quarter of the scroll range. A tiny scale
      // "breath" marks each hand-off; the caption crossfades with it.
      PERSONALITIES.forEach((p, i) => {
        const at = i * 1;
        if (i === 0) {
          tl.set(headline, {
            fontFamily: p.family,
            fontStyle: p.style,
            fontWeight: p.weight,
            letterSpacing: p.spacing,
          }, at);
          tl.to(labels[i], { opacity: 1, duration: 0.25 }, at);
        } else {
          tl.to(headline, { scale: 0.985, duration: 0.12, ease: 'power1.in' }, at - 0.12);
          tl.set(headline, {
            fontFamily: p.family,
            fontStyle: p.style,
            fontWeight: p.weight,
            letterSpacing: p.spacing,
          }, at);
          tl.to(headline, { scale: 1, duration: 0.16, ease: 'power2.out' }, at);
          tl.to(labels[i - 1], { opacity: 0, duration: 0.18 }, at - 0.12);
          tl.to(labels[i], { opacity: 1, duration: 0.25 }, at + 0.02);
        }
      });

      // Fragments drift upward through the whole scene
      fragments.forEach((frag, i) => {
        tl.to(frag, {
          y: -120 - i * 45,
          x: (i % 2 === 0 ? 1 : -1) * (40 + i * 22),
          rotate: (i % 2 === 0 ? 1 : -1) * (10 + i * 6),
          scale: 1.35,
          opacity: 0.55,
          duration: PERSONALITIES.length,
          ease: 'none',
        }, 0);
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="typography" id="typography">
      <div className="typography__pin">
        {FRAGMENTS.map((f) => (
          <div
            key={f.text}
            aria-hidden="true"
            className={`typography__fragment ${f.className}`}
            style={{
              top: f.top,
              left: f.left,
              right: f.right,
              fontSize: f.size,
              opacity: f.opacity,
            }}
          >
            {f.text}
          </div>
        ))}

        <div className="typography__stage">
          <h2 className="typography__headline">
            Style changes<br />everything.
          </h2>

          <div className="typography__label" aria-hidden="true">
            {PERSONALITIES.map((p) => (
              <span key={p.label}>{p.label}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

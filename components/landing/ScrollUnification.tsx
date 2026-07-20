"use client";

import { useEffect, useMemo, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion, seededRandom } from '@/lib/landing/motion';

export default function ScrollUnification() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const pin = section.querySelector('.unification__pin');
    const windows = section.querySelectorAll('.unification__window');
    const sphere = section.querySelector('.unification__sphere');
    const logo = section.querySelector('.unification__logo');
    const headline = section.querySelector('.unification__headline');

    if (prefersReducedMotion()) {
      // Final frame: the sprawl is gone, one glowing core + wordmark remain.
      section.style.height = 'auto';
      gsap.set(windows, { opacity: 0 });
      gsap.set(sphere, { opacity: 0.2, scale: 1.5 });
      gsap.set([logo, headline], { opacity: 1 });
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

      // Phase 1: Windows converge to center (0 → 40%), trailing slightly
      windows.forEach((win, i) => {
        tl.to(win, {
          x: 0,
          y: 0,
          scale: 0.1,
          opacity: 0.3,
          rotation: 0,
          duration: 0.35,
          ease: 'power2.inOut',
        }, i * 0.012);
      });

      // Phase 2: Windows fully disappear, sphere appears (30% → 50%)
      tl.to(windows, { opacity: 0, duration: 0.1 }, 0.3);

      tl.to(sphere, {
        opacity: 1,
        scale: 1,
        duration: 0.2,
        ease: 'back.out(1.4)',
      }, 0.35);

      // Phase 3: Sphere pulses, logo appears (50% → 70%)
      tl.to(sphere, {
        scale: 1.1,
        duration: 0.1,
        ease: 'power1.inOut',
        yoyo: true,
        repeat: 1,
      }, 0.55);

      tl.to(logo, {
        opacity: 1,
        y: 0,
        duration: 0.15,
        ease: 'power2.out',
      }, 0.6);

      // Phase 4: Sphere fades, headline appears (70% → 100%)
      tl.to(sphere, {
        opacity: 0.2,
        scale: 1.5,
        duration: 0.2,
      }, 0.75);

      tl.to(headline, {
        opacity: 1,
        y: 0,
        duration: 0.15,
        ease: 'power2.out',
      }, 0.8);
    }, section);

    return () => ctx.revert();
  }, []);

  // Scattered windows that converge — seeded and memoised so server/client
  // markup matches and re-renders don't reshuffle the ring.
  const scatteredWindows = useMemo(() => {
    const rand = seededRandom(21);
    return Array.from({ length: 8 }, (_, i) => {
      const angle = (i / 8) * Math.PI * 2;
      const radius = 300 + rand() * 100;
      return {
        id: i,
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        rot: (rand() - 0.5) * 30,
        w: 100 + rand() * 80,
      };
    });
  }, []);

  return (
    <section ref={sectionRef} className="unification" id="unification">
      <div className="unification__pin">
        <div className="unification__windows">
          {scatteredWindows.map((win) => (
            <div
              key={win.id}
              className="unification__window glass-panel"
              style={{
                left: '50%',
                top: '50%',
                width: win.w,
                transform: `translate(-50%, -50%) translate(${win.x}px, ${win.y}px) rotate(${win.rot}deg)`,
                opacity: 0.6,
              }}
            >
              <div className="browser-window__chrome" style={{ padding: '6px 8px' }}>
                <span className="browser-window__dot browser-window__dot--red" style={{ width: 6, height: 6 }} />
                <span className="browser-window__dot browser-window__dot--yellow" style={{ width: 6, height: 6 }} />
                <span className="browser-window__dot browser-window__dot--green" style={{ width: 6, height: 6 }} />
              </div>
              <div style={{ height: 40, background: 'rgba(0,0,0,0.02)' }} />
            </div>
          ))}
        </div>

        <div className="unification__sphere" />

        <div className="unification__logo" style={{ transform: 'translate(-50%, -50%) translateY(10px)' }}>
          <h2>StyleBook</h2>
        </div>

        <div className="unification__headline" style={{ transform: 'translate(-50%, -50%) translateY(10px)', marginTop: 100 }}>
          <p>One place for <em className="serif-accent">every</em> design decision.</p>
        </div>
      </div>
    </section>
  );
}

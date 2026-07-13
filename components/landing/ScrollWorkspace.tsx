"use client";

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Palette,
  Type,
  SwatchBook,
  Accessibility,
  Ruler,
  Sparkles,
  Package,
} from 'lucide-react';
import { WORKSPACE_MODULES } from '@/lib/landing/constants';
import { prefersReducedMotion } from '@/lib/landing/motion';

const MODULE_ICONS = {
  colors: Palette,
  typography: Type,
  themes: SwatchBook,
  a11y: Accessibility,
  typescale: Ruler,
  ai: Sparkles,
  export: Package,
};

export default function ScrollWorkspace() {
  const sectionRef = useRef(null);

  // Module positions on the 800×800 stage
  const containerSize = 800;
  const centerX = containerSize / 2;
  const centerY = containerSize / 2;

  useEffect(() => {
    const section = sectionRef.current;
    const pin = section.querySelector('.workspace__pin');
    const center = section.querySelector('.workspace__center');
    const modules = section.querySelectorAll('.workspace__module');
    const lines = section.querySelectorAll('.workspace__lines line');
    const header = section.querySelector('.workspace__header');

    if (prefersReducedMotion()) {
      section.style.height = 'auto';
      gsap.set([center, header, ...modules], { opacity: 1, scale: 1 });
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

      // Phase 0: Header
      tl.to(header, { opacity: 1, y: 0, duration: 0.1 }, 0);

      // Phase 1: Central core appears
      tl.to(center, {
        opacity: 1,
        scale: 1,
        duration: 0.15,
        ease: 'back.out(1.4)',
      }, 0.02);

      // Phase 2: Modules genuinely expand outward from the core
      modules.forEach((mod, i) => {
        const tx = parseFloat(mod.dataset.tx);
        const ty = parseFloat(mod.dataset.ty);
        tl.fromTo(mod,
          { x: centerX - tx, y: centerY - ty, scale: 0.2, opacity: 0 },
          {
            x: 0,
            y: 0,
            scale: 1,
            opacity: 1,
            duration: 0.14,
            ease: 'power3.out',
          }, 0.12 + i * 0.045);
      });

      // Phase 3: Connection lines draw in
      lines.forEach((line, i) => {
        const length = line.getTotalLength ? line.getTotalLength() : 300;
        gsap.set(line, { strokeDasharray: length, strokeDashoffset: length });
        tl.to(line, {
          strokeDashoffset: 0,
          duration: 0.12,
          ease: 'power1.inOut',
        }, 0.22 + i * 0.03);
      });

      // Phase 4: Gentle settle for depth
      tl.to(section.querySelector('.workspace__container'), {
        scale: 0.96,
        duration: 0.2,
      }, 0.75);
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="workspace" id="workspace">
      <div className="workspace__pin">
        <div className="workspace__header">
          <p className="scene-eyebrow">One workspace</p>
          <h2>Everything, connected.</h2>
        </div>

        <div className="workspace__stage">
          <div className="workspace__container">
            <div className="workspace__center">
              <img
                className="workspace__center-logo"
                src="/brand/stylebook-logo.svg"
                alt="StyleBook"
              />
            </div>

            {/* SVG connection lines */}
            <svg className="workspace__lines" viewBox={`0 0 ${containerSize} ${containerSize}`} aria-hidden="true">
              {WORKSPACE_MODULES.map((mod) => {
                const rad = (mod.angle * Math.PI) / 180;
                const tx = centerX + Math.cos(rad) * mod.distance;
                const ty = centerY + Math.sin(rad) * mod.distance;
                return (
                  <line
                    key={mod.id}
                    x1={centerX}
                    y1={centerY}
                    x2={tx}
                    y2={ty}
                  />
                );
              })}
            </svg>

            {/* Module cards */}
            {WORKSPACE_MODULES.map((mod) => {
              const rad = (mod.angle * Math.PI) / 180;
              const tx = centerX + Math.cos(rad) * mod.distance;
              const ty = centerY + Math.sin(rad) * mod.distance;
              const Icon = MODULE_ICONS[mod.id];

              return (
                <div
                  key={mod.id}
                  className="workspace__module glass-panel"
                  style={{ left: tx, top: ty }}
                  data-tx={tx}
                  data-ty={ty}
                >
                  <div className={`workspace__module-icon workspace__module-icon--${mod.id}`}>
                    {Icon && <Icon size={17} strokeWidth={2} aria-hidden="true" />}
                  </div>
                  <div className="workspace__module-name">{mod.name}</div>
                  <div className="workspace__module-desc">{mod.desc}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

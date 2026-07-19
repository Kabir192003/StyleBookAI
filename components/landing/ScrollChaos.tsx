"use client";

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CHAOS_TOASTS } from '@/lib/landing/constants';
import { prefersReducedMotion, seededRandom } from '@/lib/landing/motion';

// Seeded so server and client render the exact same "random" scatter —
// Math.random() here caused hydration mismatches.
function generateChaosWindows(count) {
  const tools = ['Google Fonts', 'Coolors', 'Type Scale', 'WCAG Check', 'Brand PDF', 'Figma', 'Dribbble', 'Pen & Paper', 'Notion', 'Color Hunt', 'Adobe XD', 'Sketch'];
  const urls = ['fonts.google.com', 'coolors.co', 'typescale.com', 'webaim.org', 'brand.pdf', 'figma.com', 'dribbble.com', 'notes.app', 'notion.so', 'colorhunt.co', 'adobe.com', 'sketch.com'];
  const rand = seededRandom(7);
  const wins = [];
  for (let i = 0; i < count; i++) {
    const idx = i % tools.length;
    wins.push({
      id: i,
      title: tools[idx],
      url: urls[idx],
      x: rand() * 80 + 5,
      y: rand() * 70 + 5,
      w: 160 + rand() * 120,
      rot: (rand() - 0.5) * 12,
      scale: 0.6 + rand() * 0.4,
      lines: 2 + Math.floor(rand() * 2),
    });
  }
  return wins;
}

const CHAOS_WINDOWS = generateChaosWindows(20);

// SVG cursor arrow
function CursorSVG() {
  return (
    <svg className="chaos__cursor" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 3l14 8.5L12 14l-2 7L5 3z" fill="#111" stroke="#fff" strokeWidth="1"/>
    </svg>
  );
}

export default function ScrollChaos() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;
    const pin = section.querySelector('.chaos__pin');
    const windows = section.querySelectorAll('.chaos__window');
    const cursor = section.querySelector('.chaos__cursor');
    const toasts = section.querySelectorAll('.chaos__toast');
    const message = section.querySelector('.chaos__message h2');

    if (prefersReducedMotion()) {
      // Final frame of the scene: dimmed tool sprawl behind the message.
      section.style.height = 'auto';
      windows.forEach((win) => {
        gsap.set(win, {
          opacity: 0.12,
          scale: parseFloat(win.dataset.scale) || 0.8,
          rotation: parseFloat(win.dataset.rot) || 0,
        });
      });
      gsap.set(message, { opacity: 1 });
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

      // Phase 1: Windows pile up chaotically (0 → 50%)
      windows.forEach((win, i) => {
        const delay = i * 0.02;
        tl.fromTo(win,
          { opacity: 0, scale: 0.5, rotation: (Math.random() - 0.5) * 20 },
          { opacity: 1, scale: parseFloat(win.dataset.scale) || 0.8, rotation: parseFloat(win.dataset.rot) || 0, duration: 0.15 },
          delay
        );
      });

      // Fake cursor darting around — transforms only, no layout writes
      const w = () => pin.clientWidth;
      const h = () => pin.clientHeight;

      tl.set(cursor, { x: w() * 0.45, y: h() * 0.45 }, 0);
      tl.to(cursor, { opacity: 1, duration: 0.05 }, 0.1);

      const cursorPositions = [
        [0.2, 0.3], [0.7, 0.2], [0.4, 0.6], [0.8, 0.5],
        [0.15, 0.75], [0.6, 0.4], [0.3, 0.15], [0.75, 0.7],
      ];

      cursorPositions.forEach(([px, py], i) => {
        tl.to(cursor, {
          x: () => w() * px,
          y: () => h() * py,
          duration: 0.06,
          ease: 'power2.inOut',
        }, 0.15 + i * 0.07);
      });

      // Toasts appearing
      toasts.forEach((toast, i) => {
        const startTime = 0.1 + i * 0.06;
        tl.fromTo(toast,
          { opacity: 0, y: 10, scale: 0.8 },
          { opacity: 1, y: 0, scale: 1, duration: 0.05 },
          startTime
        );
        tl.to(toast, { opacity: 0, y: -10, duration: 0.05 }, startTime + 0.12);
      });

      // Phase 2: Chaos acceleration — windows jostle
      tl.to(windows, {
        x: () => `+=${(Math.random() - 0.5) * 40}`,
        y: () => `+=${(Math.random() - 0.5) * 30}`,
        rotation: () => `+=${(Math.random() - 0.5) * 8}`,
        duration: 0.15,
        stagger: 0.01,
      }, 0.6);

      // Phase 3: FREEZE — everything recedes, the message lands (75% → 100%)
      tl.to(windows, { opacity: 0.12, duration: 0.1 }, 0.75);
      tl.to(cursor, { opacity: 0, duration: 0.05 }, 0.75);
      tl.to(toasts, { opacity: 0, duration: 0.05 }, 0.75);

      tl.fromTo(message,
        { opacity: 0, scale: 0.94, filter: 'blur(6px)' },
        { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.15, ease: 'power2.out' },
        0.82
      );
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="chaos" id="chaos">
      <div className="chaos__pin">
        <div className="chaos__windows" aria-hidden="true">
          {CHAOS_WINDOWS.map((win) => (
            <div
              key={win.id}
              className="chaos__window"
              style={{
                left: `${win.x}%`,
                top: `${win.y}%`,
                width: win.w,
              }}
              data-scale={win.scale}
              data-rot={win.rot}
            >
              <div className="browser-window__chrome">
                <span className="browser-window__dot browser-window__dot--red" />
                <span className="browser-window__dot browser-window__dot--yellow" />
                <span className="browser-window__dot browser-window__dot--green" />
                <span className="browser-window__url">{win.url}</span>
              </div>
              <div className="browser-window__body">
                <span className="chaos__window-title">{win.title}</span>
                <span className="chaos__skeleton" style={{ width: '82%' }} />
                <span className="chaos__skeleton" style={{ width: '58%' }} />
                {win.lines > 2 && <span className="chaos__skeleton" style={{ width: '70%' }} />}
              </div>
            </div>
          ))}
        </div>

        <CursorSVG />

        <div className="chaos__toasts" aria-hidden="true">
          {CHAOS_TOASTS.map((toast, i) => (
            <div
              key={i}
              className={`chaos__toast chaos__toast--${toast.type}`}
              style={{
                left: `${15 + (i % 4) * 20}%`,
                top: `${10 + (i % 3) * 30}%`,
              }}
            >
              {toast.text}
            </div>
          ))}
        </div>

        <div className="chaos__message">
          <h2>There has to be <span className="serif-accent gradient-text gradient-text--warm">a better way</span>.</h2>
        </div>
      </div>
    </section>
  );
}

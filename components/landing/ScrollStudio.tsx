"use client";

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion } from '@/lib/landing/motion';

// The featured board is the real product shot — manual curation — with the
// abstract artboards orbiting it on the canvas.
const ARTBOARDS = [
  { id: 'curation', label: 'Manual Curation — Studio', x: 480, y: 280, w: 640, h: 430, type: 'feature' },
  { id: 'desktop', label: 'Desktop UI', x: 40, y: 90, w: 400, h: 264, type: 'desktop' },
  { id: 'mobile', label: 'Mobile App', x: 1180, y: 80, w: 180, h: 320, type: 'mobile' },
  { id: 'dashboard', label: 'Dashboard', x: 1170, y: 470, w: 380, h: 260, type: 'dashboard' },
  { id: 'landing', label: 'Landing Page', x: 60, y: 430, w: 340, h: 220, type: 'desktop' },
  { id: 'card', label: 'Business Card', x: 190, y: 710, w: 240, h: 140, type: 'card' },
  { id: 'social', label: 'Social Post', x: 900, y: 770, w: 200, h: 200, type: 'social' },
];

function DesktopMockup() {
  return (
    <div className="mockup-desktop">
      <div className="mockup-nav">
        <div className="mockup-nav__logo" />
        <div className="mockup-nav__items">
          <div className="mockup-nav__item" />
          <div className="mockup-nav__item" />
          <div className="mockup-nav__item" />
        </div>
      </div>
      <div className="mockup-hero-block">
        <div className="mockup-hero-block__title" />
        <div className="mockup-hero-block__subtitle" />
        <div className="mockup-hero-block__btn" />
      </div>
      <div className="mockup-grid">
        <div className="mockup-grid__card" />
        <div className="mockup-grid__card" />
        <div className="mockup-grid__card" />
      </div>
    </div>
  );
}

function MobileMockup() {
  return (
    <div className="mockup-mobile">
      <div className="mockup-mobile__status">
        <span>9:41</span>
        <span>●●●</span>
      </div>
      <div className="mockup-mobile__header" />
      <div className="mockup-mobile__list">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="mockup-mobile__list-item">
            <div className="mockup-mobile__list-avatar" />
            <div className="mockup-mobile__list-text" />
          </div>
        ))}
      </div>
    </div>
  );
}

function DashboardMockup() {
  return (
    <div className="mockup-dashboard">
      <div className="mockup-stats">
        <div className="mockup-stat">
          <div className="mockup-stat__value">2.4k</div>
          <div className="mockup-stat__label">Users</div>
        </div>
        <div className="mockup-stat">
          <div className="mockup-stat__value">89%</div>
          <div className="mockup-stat__label">Score</div>
        </div>
        <div className="mockup-stat">
          <div className="mockup-stat__value">$12k</div>
          <div className="mockup-stat__label">Revenue</div>
        </div>
      </div>
      <div className="mockup-chart-area" />
    </div>
  );
}

function CardMockup() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: 8 }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent)' }} />
      <div style={{ width: '70%', height: 6, borderRadius: 3, background: 'rgba(0,0,0,0.12)' }} />
      <div style={{ width: '50%', height: 4, borderRadius: 2, background: 'rgba(0,0,0,0.06)' }} />
    </div>
  );
}

function SocialMockup() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ width: '100%', height: 100, borderRadius: 6, background: 'linear-gradient(135deg, var(--accent), hsl(280, 70%, 60%))' }} />
      <div style={{ width: '80%', height: 6, borderRadius: 3, background: 'rgba(0,0,0,0.1)' }} />
      <div style={{ width: '60%', height: 4, borderRadius: 2, background: 'rgba(0,0,0,0.05)' }} />
    </div>
  );
}

function FeatureMockup() {
  return (
    <img
      src="/landing/studio-render.jpg"
      alt="StyleBook Studio — the manual curation interface with palette, shades and live preview"
      loading="lazy"
      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
    />
  );
}

const MOCKUP_MAP = {
  feature: FeatureMockup,
  desktop: DesktopMockup,
  mobile: MobileMockup,
  dashboard: DashboardMockup,
  card: CardMockup,
  social: SocialMockup,
};

export default function ScrollStudio() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;
    const pin = section.querySelector('.studio__pin');
    const header = section.querySelector('.studio__header');
    const canvas = section.querySelector('.studio__canvas');
    const artboards = section.querySelectorAll('.studio__artboard');
    const tokenSource = section.querySelector('.studio__token-source');
    const lines = section.querySelectorAll('.studio__connections line');

    if (prefersReducedMotion()) {
      section.style.height = 'auto';
      gsap.set([header, tokenSource, ...artboards], { opacity: 1, y: 0 });
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

      // Header
      tl.to(header, { opacity: 1, y: 0, duration: 0.1 }, 0);

      // Token source appears
      tl.to(tokenSource, { opacity: 1, duration: 0.08 }, 0.05);

      // Artboards appear with stagger
      artboards.forEach((board, i) => {
        tl.to(board, {
          opacity: 1,
          y: 0,
          duration: 0.1,
          ease: 'back.out(1.2)',
        }, 0.1 + i * 0.04);
      });

      // Connection lines
      lines.forEach((line, i) => {
        const length = line.getTotalLength ? line.getTotalLength() : 400;
        gsap.set(line, { strokeDasharray: length, strokeDashoffset: length });
        tl.to(line, {
          strokeDashoffset: 0,
          duration: 0.1,
        }, 0.2 + i * 0.03);
      });

      // Canvas slowly pans
      tl.to(canvas, {
        x: -200,
        y: -100,
        duration: 0.4,
        ease: 'power1.inOut',
      }, 0.4);
    }, section);

    return () => ctx.revert();
  }, []);

  // Connection lines radiate from behind the featured board
  const canvasCenter = { x: 800, y: 495 };

  return (
    <section ref={sectionRef} className="studio" id="studio">
      <div className="studio__pin">
        <div className="studio__header" style={{ transform: 'translateY(15px)' }}>
          <p className="scene-eyebrow">The studio</p>
          <h2>Your complete studio.</h2>
          <p>Every product, one design system.</p>
        </div>

        <div className="studio__stage">
        <div className="studio__canvas">
          {/* Token source */}
          <div
            className="studio__token-source"
            style={{ left: canvasCenter.x, top: canvasCenter.y, transform: 'translate(-50%, -50%)' }}
          />

          {/* Connection lines */}
          <svg className="studio__connections" viewBox="0 0 1600 1000">
            {ARTBOARDS.map((board) => (
              <line
                key={board.id}
                x1={canvasCenter.x}
                y1={canvasCenter.y}
                x2={board.x + board.w / 2}
                y2={board.y + board.h / 2}
              />
            ))}
          </svg>

          {/* Artboards */}
          {ARTBOARDS.map((board) => {
            const Mockup = MOCKUP_MAP[board.type];
            return (
              <div
                key={board.id}
                className={`studio__artboard ${board.type === 'feature' ? 'studio__artboard--feature' : ''}`}
                style={{
                  left: board.x,
                  top: board.y,
                  width: board.w,
                  height: board.h,
                  transform: 'translateY(20px)',
                }}
              >
                <div className="studio__artboard-label">{board.label}</div>
                <div className="studio__artboard-body">
                  <Mockup />
                </div>
              </div>
            );
          })}
        </div>
        </div>
      </div>
    </section>
  );
}

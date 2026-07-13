"use client";

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion } from '@/lib/landing/motion';

// Color blindness CSS filter matrices
const VISION_MODES = [
  { name: 'Normal Vision', filter: 'none' },
  { name: 'Deuteranopia', filter: 'url(#deuteranopia)' },
  { name: 'Protanopia', filter: 'url(#protanopia)' },
  { name: 'Tritanopia', filter: 'url(#tritanopia)' },
];

export default function ScrollAccessibility() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;
    const pin = section.querySelector('.accessibility__pin');
    const header = section.querySelector('.accessibility__header');
    const demo = section.querySelector('.a11y-demo');
    const card = section.querySelector('.a11y-demo__card');
    const info = section.querySelector('.a11y-info');
    const visionLabel = section.querySelector('.a11y-vision-label');
    const ratioEl = section.querySelector('.a11y-info__ratio');
    const avatar = section.querySelector('.a11y-demo__sample-avatar');
    const sampleBtn = section.querySelector('.a11y-demo__sample-btn');
    const body = section.querySelector('.a11y-demo__sample-body');
    const title = section.querySelector('.a11y-demo__sample-title');
    const subtitle = section.querySelector('.a11y-demo__sample-subtitle');

    if (prefersReducedMotion()) {
      section.style.height = 'auto';
      gsap.set([header, demo, info, visionLabel], { opacity: 1, y: 0 });
      // Show the "after" state: high-contrast values a design tool would ship
      gsap.set([avatar, sampleBtn], { background: '#1A1A1A', color: '#FFFFFF' });
      gsap.set(title, { color: '#000000' });
      gsap.set(subtitle, { color: '#333333' });
      gsap.set(body, { color: '#222222' });
      if (ratioEl) ratioEl.textContent = '12.6:1';
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

    // Phase 1: Elements appear
    tl.to(header, { opacity: 1, y: 0, duration: 0.1 }, 0);
    tl.to(demo, { opacity: 1, y: 0, duration: 0.1 }, 0.05);
    tl.to(info, { opacity: 1, duration: 0.08 }, 0.1);
    tl.to(visionLabel, { opacity: 1, duration: 0.05 }, 0.12);

    // Phase 2: Contrast enhancement — colors shift to higher contrast
    tl.to(avatar, {
      background: '#1A1A1A',
      color: '#FFFFFF',
      duration: 0.15,
    }, 0.2);

    tl.to(sampleBtn, {
      background: '#1A1A1A',
      color: '#FFFFFF',
      duration: 0.15,
    }, 0.2);

    tl.to(title, { color: '#000000', duration: 0.15 }, 0.2);
    tl.to(subtitle, { color: '#333333', duration: 0.15 }, 0.2);
    tl.to(body, { color: '#222222', duration: 0.15 }, 0.2);

    // Animate ratio number
    const ratioObj = { val: 4.5 };
    tl.to(ratioObj, {
      val: 12.6,
      duration: 0.15,
      onUpdate: () => {
        if (ratioEl) ratioEl.textContent = ratioObj.val.toFixed(1) + ':1';
      },
    }, 0.2);

    // Phase 3: Color blindness simulation — cycle through filters
    const visionLabelSpan = visionLabel?.querySelector('span');

    tl.to(card, { filter: 'grayscale(50%) sepia(30%)', duration: 0.1 }, 0.45);
    tl.call(() => { if (visionLabelSpan) visionLabelSpan.textContent = 'Deuteranopia'; }, [], 0.45);

    tl.to(card, { filter: 'grayscale(60%) hue-rotate(-20deg)', duration: 0.1 }, 0.55);
    tl.call(() => { if (visionLabelSpan) visionLabelSpan.textContent = 'Protanopia'; }, [], 0.55);

    tl.to(card, { filter: 'grayscale(40%) sepia(40%) hue-rotate(40deg)', duration: 0.1 }, 0.65);
    tl.call(() => { if (visionLabelSpan) visionLabelSpan.textContent = 'Tritanopia'; }, [], 0.65);

    // Phase 4: Back to normal + text size increase
    tl.to(card, { filter: 'none', duration: 0.1 }, 0.78);
    tl.call(() => { if (visionLabelSpan) visionLabelSpan.textContent = 'Normal Vision'; }, [], 0.78);

    tl.to(body, { fontSize: '1.05rem', lineHeight: '1.9', duration: 0.12 }, 0.82);
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="accessibility" id="accessibility">
      <div className="accessibility__pin">
        <div className="accessibility__container">
          <div className="accessibility__header" style={{ transform: 'translateY(20px)' }}>
            <p className="scene-eyebrow">Inclusive by default</p>
            <h2>Accessibility, built in.</h2>
            <p>Don't just check compliance — see it.</p>
          </div>

          <div className="a11y-demo" style={{ transform: 'translateY(20px)' }}>
            <div className="a11y-demo__card">
              <div className="a11y-demo__sample-header">
                <div
                  className="a11y-demo__sample-avatar"
                  style={{ background: '#38477C', color: '#fff' }}
                >
                  S
                </div>
                <div>
                  <div className="a11y-demo__sample-title" style={{ color: '#333' }}>
                    Sarah Chen
                  </div>
                  <div className="a11y-demo__sample-subtitle" style={{ color: '#888' }}>
                    Product Designer
                  </div>
                </div>
              </div>
              <div className="a11y-demo__sample-body" style={{ color: '#666' }}>
                Great design systems make accessibility effortless. When contrast ratios, colour blindness
                support, and readable typography are built into the foundation, every product ships inclusive by default.
              </div>
              <span
                className="a11y-demo__sample-btn"
                style={{ background: '#38477C', color: '#fff' }}
              >
                View Profile
              </span>
            </div>
          </div>

          <div className="a11y-info">
            <div className="a11y-info__item">
              <span className="a11y-info__ratio">4.5:1</span>
              <span className="a11y-info__label">Contrast Ratio</span>
            </div>
            <div className="a11y-info__item">
              <span className="a11y-badge a11y-badge--pass">✓ Pass</span>
              <span className="a11y-info__label">WCAG 2.1</span>
            </div>
            <div className="a11y-info__item">
              <span className="a11y-badge a11y-badge--aa">AA</span>
              <span className="a11y-info__label">Level</span>
            </div>
            <div className="a11y-info__item">
              <span className="a11y-badge a11y-badge--aaa">AAA</span>
              <span className="a11y-info__label">Large Text</span>
            </div>
          </div>

          <div className="a11y-vision-label">
            <span>Normal Vision</span>
          </div>
        </div>
      </div>
    </section>
  );
}

"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { INTERACTIVE_PALETTES, INTERACTIVE_FONTS } from '@/lib/landing/constants';
import { prefersReducedMotion } from '@/lib/landing/motion';

export default function ScrollInteractive() {
  const sectionRef = useRef<HTMLElement>(null);
  const [activePalette, setActivePalette] = useState(0);
  const [activeFont, setActiveFont] = useState(0);
  const [spacing, setSpacing] = useState(10);
  const [radius, setRadius] = useState(12);
  const [shadow, setShadow] = useState(1); // 0=none, 1=subtle, 2=dramatic
  const [hasInteracted, setHasInteracted] = useState(false);

  const palette = INTERACTIVE_PALETTES[activePalette];
  const font = INTERACTIVE_FONTS[activeFont];

  const shadowValues = [
    'none',
    '0 2px 8px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)',
    '0 8px 30px rgba(0,0,0,0.12), 0 4px 10px rgba(0,0,0,0.06)',
  ];

  const previewStyle = {
    '--preview-accent': `hsl(${palette.h}, ${palette.s}%, ${palette.l}%)`,
    '--preview-accent-h': palette.h,
    '--preview-accent-light': `hsl(${palette.h}, ${palette.s}%, 92%)`,
    '--preview-accent-dark': `hsl(${palette.h}, ${palette.s}%, 35%)`,
    '--preview-font': font.family,
    '--preview-spacing': `${spacing}px`,
    '--preview-radius': `${radius}px`,
    '--preview-shadow': shadowValues[shadow],
  } as React.CSSProperties;

  const handleInteraction = useCallback(() => {
    if (!hasInteracted) setHasInteracted(true);
  }, [hasInteracted]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const headline = section.querySelector('.interactive__headline');
    const layout = section.querySelector('.interactive__layout');

    if (prefersReducedMotion()) {
      gsap.set([headline, layout], { opacity: 1, y: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top 60%',
          end: 'top 20%',
          scrub: 0.85,
        },
      });

      tl.fromTo(headline, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.5 }, 0);
      tl.fromTo(layout, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.5 }, 0.2);
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="interactive" id="interactive">
      <div className="interactive__headline">
        <p className="scene-eyebrow">Live tokens</p>
        <h2>Now make it yours.</h2>
        <p>Drag, click, and explore — watch everything update live.</p>
      </div>

      <div className="interactive__layout" style={previewStyle}>
        {/* ── Controls Panel ──────────── */}
        <div className="interactive__controls">

          {/* Color Palette */}
          <div className="control-group">
            <div className="control-group__label">Accent Colour</div>
            <div className="control-colors">
              {INTERACTIVE_PALETTES.map((p, i) => (
                <motion.button
                  key={p.name}
                  drag
                  dragSnapToOrigin
                  whileDrag={{ scale: 1.2, zIndex: 10, boxShadow: '0 15px 30px rgba(0,0,0,0.15)' }}
                  dragElastic={0.2}
                  dragTransition={{ bounceStiffness: 600, bounceDamping: 20 }}
                  className={`control-color ${i === activePalette ? 'active' : ''}`}
                  style={{ background: `hsl(${p.h}, ${p.s}%, ${p.l}%)`, cursor: 'grab' }}
                  onDragStart={() => document.body.style.cursor = 'grabbing'}
                  onDragEnd={() => document.body.style.cursor = ''}
                  onClick={() => { setActivePalette(i); handleInteraction(); }}
                  aria-label={`Select ${p.name} palette`}
                  title={p.name}
                  data-cursor-interactive="true"
                  data-cursor-color={`hsl(${p.h}, ${p.s}%, ${p.l}%)`}
                  data-cursor-label="DRAG"
                />
              ))}
            </div>
          </div>

          {/* Font Selector */}
          <div className="control-group">
            <div className="control-group__label">Typography</div>
            <div className="control-fonts">
              {INTERACTIVE_FONTS.map((f, i) => (
                <motion.button
                  key={f.name}
                  drag
                  dragSnapToOrigin
                  whileDrag={{ scale: 1.05, zIndex: 10, boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}
                  dragElastic={0.2}
                  dragTransition={{ bounceStiffness: 600, bounceDamping: 20 }}
                  className={`control-font ${i === activeFont ? 'active' : ''}`}
                  onClick={() => { setActiveFont(i); handleInteraction(); }}
                  style={{ cursor: 'grab' }}
                  onDragStart={() => document.body.style.cursor = 'grabbing'}
                  onDragEnd={() => document.body.style.cursor = ''}
                  data-cursor-interactive="true"
                  data-cursor-label="DRAG"
                >
                  <span className="control-font__name" style={{ fontFamily: f.family }}>{f.name}</span>
                  <span className="control-font__sample" style={{ fontFamily: f.family }}>{f.sample}</span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Spacing Slider */}
          <div className="control-group">
            <div className="control-group__label">Spacing</div>
            <div className="control-slider">
              <div className="control-slider__header">
                <span className="control-slider__value">{spacing}px</span>
              </div>
              <input
                type="range"
                min="4"
                max="20"
                value={spacing}
                onChange={(e) => { setSpacing(Number(e.target.value)); handleInteraction(); }}
                aria-label="Spacing"
              />
            </div>
          </div>

          {/* Radius Slider */}
          <div className="control-group">
            <div className="control-group__label">Corner Radius</div>
            <div className="control-slider">
              <div className="control-slider__header">
                <span className="control-slider__value">{radius}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="28"
                value={radius}
                onChange={(e) => { setRadius(Number(e.target.value)); handleInteraction(); }}
                aria-label="Border radius"
              />
            </div>
          </div>

          {/* Shadow Toggle */}
          <div className="control-group">
            <div className="control-group__label">Shadow</div>
            <div className="control-shadows">
              {['None', 'Subtle', 'Dramatic'].map((label, i) => (
                <button
                  key={label}
                  className={`control-shadow ${i === shadow ? 'active' : ''}`}
                  onClick={() => { setShadow(i); handleInteraction(); }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Live Preview Grid ──────── */}
        <div className="interactive__preview">
          {/* Buttons */}
          <div className="preview-component">
            <div className="preview-btn">
              <span className="preview-btn__primary">Get Started</span>
              <span className="preview-btn__secondary">Learn More</span>
            </div>
          </div>

          {/* Input */}
          <div className="preview-component">
            <div className="preview-input">
              <span className="preview-input__label">Email address</span>
              <div className="preview-input__field">hello@stylebook.design</div>
            </div>
          </div>

          {/* Card */}
          <div className="preview-component">
            <div className="preview-card">
              <div className="preview-card__image" />
              <div className="preview-card__title">Design Tokens</div>
              <div className="preview-card__desc">Production-ready values for every platform.</div>
            </div>
          </div>

          {/* Badges */}
          <div className="preview-component">
            <div className="preview-badges">
              <span className="preview-badge preview-badge--filled">New</span>
              <span className="preview-badge preview-badge--outline">Beta</span>
              <span className="preview-badge preview-badge--soft">Popular</span>
            </div>
          </div>

          {/* Nav */}
          <div className="preview-component" style={{ gridColumn: 'span 2' }}>
            <div className="preview-nav">
              <span className="preview-nav__brand">StyleBook</span>
              <div className="preview-nav__links">
                <span className="preview-nav__link">Features</span>
                <span className="preview-nav__link">Pricing</span>
                <span className="preview-nav__link">Docs</span>
              </div>
              <span className="preview-nav__cta">Sign Up</span>
            </div>
          </div>

          {/* Chart */}
          <div className="preview-component">
            <div className="preview-chart">
              {[45, 70, 35, 85, 50, 65, 40, 90].map((h, i) => (
                <div key={i} className="preview-chart__bar" style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>

          {/* Progress */}
          <div className="preview-component">
            <div className="preview-progress">
              <div className="preview-progress__label">
                <span>Design Tokens</span>
                <span>72%</span>
              </div>
              <div className="preview-progress__track">
                <div className="preview-progress__fill" style={{ width: '72%' }} />
              </div>
              <div className="preview-progress__label">
                <span>Components</span>
                <span>48%</span>
              </div>
              <div className="preview-progress__track">
                <div className="preview-progress__fill" style={{ width: '48%' }} />
              </div>
            </div>
          </div>

          {/* Avatar */}
          <div className="preview-component" style={{ gridColumn: 'span 2' }}>
            <div className="preview-avatar">
              <div className="preview-avatar__circle">SK</div>
              <div className="preview-avatar__info">
                <span className="preview-avatar__name">Sarah Kim</span>
                <span className="preview-avatar__role">Lead Designer</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback message */}
      <div className={`interactive__feedback ${hasInteracted ? 'visible' : ''}`}>
        <p>One change. <em className="serif-accent">Everywhere.</em></p>
      </div>
    </section>
  );
}

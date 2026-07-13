"use client";

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { AI_REASONING, AI_COLORS } from '@/lib/landing/constants';
import { prefersReducedMotion } from '@/lib/landing/motion';

export default function ScrollAI() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;
    const pin = section.querySelector('.ai-thinking__pin');
    const prompt = section.querySelector('.ai-thinking__prompt');
    const btn = section.querySelector('.ai-thinking__generate-btn');
    const reasoning = section.querySelector('.ai-thinking__reasoning');
    const words = section.querySelectorAll('.ai-thinking__reasoning-text .word');
    const tokensWrap = section.querySelector('.ai-thinking__tokens');
    const tokenGroups = section.querySelectorAll('.ai-token-group');
    const colorDots = section.querySelectorAll('.ai-token-color');
    const spacingBars = section.querySelectorAll('.ai-token-spacing__bar');

    if (prefersReducedMotion()) {
      section.style.height = 'auto';
      gsap.set([prompt, btn, reasoning, tokensWrap, ...tokenGroups], { opacity: 1, y: 0 });
      gsap.set(words, { opacity: 1 });
      gsap.set(colorDots, { scale: 1 });
      gsap.set(spacingBars, { scaleX: 1 });
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

    // Phase 1: Prompt appears (0 → 15%)
    tl.to(prompt, { opacity: 1, y: 0, duration: 0.1, ease: 'power2.out' }, 0);
    tl.to(btn, { opacity: 1, duration: 0.05 }, 0.08);

    // Phase 2: Reasoning appears word by word (15% → 45%)
    tl.to(reasoning, { opacity: 1, duration: 0.05 }, 0.15);

    words.forEach((word, i) => {
      tl.to(word, {
        opacity: 1,
        duration: 0.008,
      }, 0.18 + i * 0.004);
    });

    // Phase 3: Tokens appear (45% → 90%)
    tl.to(tokensWrap, { opacity: 1, duration: 0.05 }, 0.48);

    tokenGroups.forEach((group, i) => {
      tl.to(group, {
        opacity: 1,
        y: 0,
        duration: 0.08,
        ease: 'back.out(1.2)',
      }, 0.5 + i * 0.05);
    });

    // Color dots pop in
    colorDots.forEach((dot, i) => {
      tl.to(dot, {
        scale: 1,
        duration: 0.05,
        ease: 'back.out(2)',
        onComplete: () => dot.classList.add('visible'),
      }, 0.55 + i * 0.02);
    });

    // Spacing bars grow
    spacingBars.forEach((bar, i) => {
      tl.to(bar, {
        scaleX: 1,
        duration: 0.06,
        ease: 'power2.out',
        onComplete: () => bar.classList.add('visible'),
      }, 0.7 + i * 0.03);
    });
    }, section);

    return () => ctx.revert();
  }, []);

  // Split reasoning text into words for animation
  const allWords = AI_REASONING.join(' ').split(' ');

  return (
    <section ref={sectionRef} className="ai-thinking" id="ai-thinking">
      <div className="ai-thinking__pin">
        <div className="ai-thinking__container">

          {/* Prompt */}
          <div className="ai-thinking__prompt" style={{ transform: 'translateY(20px)' }}>
            <div className="ai-thinking__prompt-label">Describe your brand</div>
            <div className="ai-thinking__prompt-text">
              Luxury skincare brand for Gen Z that feels calm, premium and trustworthy.
              <span className="ai-cursor" />
            </div>
            <button className="ai-thinking__generate-btn">
              <span className="spark">✦</span> Generate Design System
            </button>
          </div>

          {/* Reasoning */}
          <div className="ai-thinking__reasoning">
            <div className="ai-thinking__reasoning-title">AI Reasoning</div>
            <div className="ai-thinking__reasoning-text">
              {allWords.map((word, i) => (
                <span key={i} className="word">{word} </span>
              ))}
            </div>
          </div>

          {/* Generated Tokens */}
          <div className="ai-thinking__tokens">
            {/* Colors */}
            <div className="ai-token-group glass-panel">
              <div className="ai-token-group__label">Colours</div>
              <div className="ai-token-colors">
                {AI_COLORS.map((color, i) => (
                  <div key={i} className="ai-token-color" style={{ background: color }} />
                ))}
              </div>
            </div>

            {/* Typography */}
            <div className="ai-token-group glass-panel">
              <div className="ai-token-group__label">Typography</div>
              <div className="ai-token-font">
                <div className="ai-token-font__heading" style={{ fontFamily: 'var(--font-display)' }}>
                  Display Heading
                </div>
                <div className="ai-token-font__body">
                  Body text with comfortable reading rhythm
                </div>
              </div>
            </div>

            {/* Moodboard */}
            <div className="ai-token-group glass-panel">
              <div className="ai-token-group__label">Moodboard</div>
              <div className="ai-token-mood" aria-hidden="true">
                <img src="/landing/mood-warm.jpg" alt="" loading="lazy" />
                <img src="/landing/mood-pearl.jpg" alt="" loading="lazy" />
                <img src="/landing/mood-blush.jpg" alt="" loading="lazy" />
              </div>
            </div>

            {/* Type Scale */}
            <div className="ai-token-group glass-panel">
              <div className="ai-token-group__label">Type Scale</div>
              <div className="ai-token-scale">
                {[
                  { size: 28, label: '2rem' },
                  { size: 22, label: '1.5rem' },
                  { size: 18, label: '1.25rem' },
                  { size: 16, label: '1rem' },
                  { size: 14, label: '0.875rem' },
                  { size: 12, label: '0.75rem' },
                ].map((s, i) => (
                  <div key={i} className="ai-token-scale__row">
                    <span className="ai-token-scale__size" style={{ fontSize: s.size }}>Aa</span>
                    <span className="ai-token-scale__label">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Spacing */}
            <div className="ai-token-group glass-panel">
              <div className="ai-token-group__label">Spacing</div>
              <div className="ai-token-spacing">
                {[20, 35, 55, 75, 100].map((w, i) => (
                  <div key={i} className="ai-token-spacing__bar" style={{ width: `${w}%` }} />
                ))}
              </div>
            </div>

            {/* Shadows */}
            <div className="ai-token-group glass-panel">
              <div className="ai-token-group__label">Shadows</div>
              <div style={{ display: 'flex', gap: 12 }}>
                {[
                  '0 1px 3px rgba(0,0,0,0.06)',
                  '0 4px 12px rgba(0,0,0,0.08)',
                  '0 12px 40px rgba(0,0,0,0.12)',
                ].map((shadow, i) => (
                  <div
                    key={i}
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 10,
                      background: '#fff',
                      boxShadow: shadow,
                      border: '1px solid rgba(0,0,0,0.04)',
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Radius */}
            <div className="ai-token-group glass-panel">
              <div className="ai-token-group__label">Corner Radius</div>
              <div style={{ display: 'flex', gap: 10 }}>
                {[4, 8, 12, 20].map((r) => (
                  <div
                    key={r}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: r,
                      background: 'rgba(34,45,82,0.08)',
                      border: '1.5px solid rgba(34,45,82,0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 10,
                      color: '#222D52',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {r}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

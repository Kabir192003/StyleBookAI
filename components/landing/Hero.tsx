"use client";

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight } from 'lucide-react';
import { HERO_WINDOWS } from '@/lib/landing/constants';
import { typePersonalities } from '@/lib/landing/fonts';
import { prefersReducedMotion } from '@/lib/landing/motion';
import { MagneticButton } from '@/components/motion/MagneticButton';
import { INTRO_DONE_EVENT } from '@/components/landing/IntroCurtain';

function BrowserChrome({ url }: { url: string }) {
  return (
    <div className="browser-window__chrome glass-panel" style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
      <span className="browser-window__dot browser-window__dot--red" />
      <span className="browser-window__dot browser-window__dot--yellow" />
      <span className="browser-window__dot browser-window__dot--green" />
      <span className="browser-window__url">{url}</span>
    </div>
  );
}

function GoogleFontsMockup() {
  return (
    <div className="tool-mockup tool-fonts">
      {[
        { name: 'Sora', className: 'font-geometric-sans' },
        { name: 'Fraunces', className: 'font-editorial-serif' },
        { name: 'Archivo', className: 'font-grotesk' },
        { name: 'Inter', className: 'font-humanist-sans' },
      ].map((font) => (
        <div key={font.name} className="font-row">
          <span className="font-name">{font.name}</span>
          <span className={`font-sample ${font.className}`}>Aa Bb Cc</span>
        </div>
      ))}
    </div>
  );
}

function CoolorsMockup() {
  const colors = ['#264653', '#2A9D8F', '#E9C46A', '#F4A261', '#E76F51'];
  return (
    <div className="tool-colors">
      {colors.map((color) => (
        <div key={color} className="tool-colors__swatch" style={{ background: color }}>
          <span>{color}</span>
        </div>
      ))}
    </div>
  );
}

function TypeScaleMockup() {
  const sizes = [
    { label: 'H1', size: 20, text: 'Heading One' },
    { label: 'H2', size: 16, text: 'Heading Two' },
    { label: 'H3', size: 14, text: 'Heading Three' },
    { label: 'P', size: 11, text: 'Body text paragraph' },
    { label: 'SM', size: 9, text: 'Small caption text' },
  ];
  return (
    <div className="tool-typescale">
      {sizes.map((s) => (
        <div key={s.label} className="tool-typescale__row">
          <span className="tool-typescale__label">{s.label}</span>
          <span className="tool-typescale__sample" style={{ fontSize: s.size }}>{s.text}</span>
        </div>
      ))}
    </div>
  );
}

function WCAGMockup() {
  return (
    <div className="tool-wcag">
      <div className="tool-wcag__pair">
        <div className="tool-wcag__preview" style={{ background: '#1A1A1A', color: '#FFFFFF' }}>Aa</div>
        <span className="tool-wcag__ratio">15.3:1</span>
        <span className="tool-wcag__badge tool-wcag__badge--pass">AAA</span>
      </div>
      <div className="tool-wcag__pair">
        <div className="tool-wcag__preview" style={{ background: '#6366F1', color: '#FFFFFF' }}>Aa</div>
        <span className="tool-wcag__ratio">4.6:1</span>
        <span className="tool-wcag__badge tool-wcag__badge--pass">AA</span>
      </div>
      <div className="tool-wcag__pair">
        <div className="tool-wcag__preview" style={{ background: '#FDE68A', color: '#FFFFFF' }}>Aa</div>
        <span className="tool-wcag__ratio">1.2:1</span>
        <span className="tool-wcag__badge tool-wcag__badge--fail">Fail</span>
      </div>
    </div>
  );
}

function BrandGuideMockup() {
  return (
    <div className="tool-brand">
      <div className="tool-brand__header">
        <div className="tool-brand__logo" />
        <span className="tool-brand__name">Acme Corp</span>
      </div>
      <span className="tool-brand__section">Primary Colors</span>
      <div className="tool-brand__colors">
        {['#222D52', '#8C6A2F', '#D2B68A', '#B4622D', '#E8E4E0'].map((c) => (
          <div key={c} className="tool-brand__dot" style={{ background: c }} />
        ))}
      </div>
      <span className="tool-brand__section">Typography</span>
      <div style={{ fontSize: 11, color: '#555' }}>Heading: Sora · Body: Inter</div>
    </div>
  );
}

const MOCKUP_MAP: Record<string, () => JSX.Element> = {
  'google-fonts': GoogleFontsMockup,
  'coolors': CoolorsMockup,
  'type-scale': TypeScaleMockup,
  'wcag-checker': WCAGMockup,
  'brand-guidelines': BrandGuideMockup,
};

// Sculptural CSS objects floating in the hero atmosphere
function Premium3DObjects() {
  return (
    <div className="hero__3d-objects" aria-hidden="true">
      <div className="obj-3d obj-sphere" data-speed="0.8"></div>
      <div className="obj-3d obj-cursor" data-speed="1.2">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4.5 3L20 11L12.5 13.5L10 21L4.5 3Z" fill="url(#cursor-grad)" filter="drop-shadow(0 10px 15px rgba(0,0,0,0.15))"/>
          <defs>
            <linearGradient id="cursor-grad" x1="4.5" y1="3" x2="20" y2="21" gradientUnits="userSpaceOnUse">
              <stop stopColor="#F8F9FA"/>
              <stop offset="1" stopColor="#E2E8F0"/>
            </linearGradient>
          </defs>
        </svg>
      </div>
      <div className="obj-3d obj-letter-a" data-speed="0.5">A</div>
      <div className="obj-3d obj-droplet" data-speed="1.5"></div>
      <div className="obj-3d obj-cube" data-speed="0.9"></div>
    </div>
  );
}

const MORPH_WORD = 'five different tools?';

/**
 * The morph phrase cycles through the real loaded type personalities.
 * All variants are stacked in one inline-grid cell so the container is
 * always sized to the widest — the headline never reflows mid-morph.
 */
function MorphingText() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % typePersonalities.length);
    }, 2600);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="hero__morph" aria-label={MORPH_WORD}>
      {typePersonalities.map((p, i) => (
        <span
          key={p.label}
          aria-hidden="true"
          className={`hero__morph-item ${p.className} ${i === index ? 'is-active' : ''}`}
        >
          {MORPH_WORD}
        </span>
      ))}
    </span>
  );
}

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const windows = section.querySelectorAll<HTMLElement>('.browser-window');
    const eyebrow = section.querySelector('.hero__eyebrow');
    const headline = section.querySelector('.hero__headline');
    const subtext = section.querySelector('.hero__subtext');
    const ctas = section.querySelector('.hero__ctas');
    const cue = section.querySelector('.hero__scroll-cue');
    const content = section.querySelector('.hero__content');
    const objects = section.querySelectorAll<HTMLElement>('.obj-3d');

    if (prefersReducedMotion()) {
      gsap.set([eyebrow, headline, subtext, ctas, cue, ...windows], { opacity: 1 });
      return;
    }

    let startEntrance: (() => void) | undefined;
    const ctx = gsap.context(() => {
      // Entrance — waits for the intro curtain on first visit
      const tl = gsap.timeline({ paused: true, defaults: { ease: 'power3.out' } });

      tl.fromTo(eyebrow,
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.7, delay: 0.15 }
      )
        .fromTo(headline,
          { opacity: 0, y: 28, filter: 'blur(10px)' },
          { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.1, clearProps: 'filter' },
          '-=0.45'
        )
        .fromTo(subtext, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.8 }, '-=0.65')
        .fromTo(ctas, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.7 }, '-=0.55')
        .fromTo(cue, { opacity: 0 }, { opacity: 1, duration: 0.6 }, '-=0.2');

      windows.forEach((win, i) => {
        tl.fromTo(win,
          { opacity: 0, scale: 0.92, y: 16 },
          { opacity: 1, scale: 1, y: 0, duration: 0.9 },
          0.45 + i * 0.12
        );
      });

      startEntrance = () => tl.play();
      if (document.documentElement.classList.contains('intro-active')) {
        window.addEventListener(INTRO_DONE_EVENT, startEntrance, { once: true });
      } else {
        tl.play();
      }

      // Depth handoff into the next scene
      gsap.to(content, {
        y: -48,
        opacity: 0.45,
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: 'bottom 55%',
          scrub: true,
        },
      });

      // The rendered room recedes slightly slower than the page — set depth
      gsap.to('.hero__backdrop', {
        yPercent: 10,
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      });

      gsap.to(cue, {
        opacity: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=220',
          scrub: true,
        },
      });
    }, section);

    // Pointer parallax — quickTo reuses one tween per property instead of
    // allocating a new tween on every mousemove. The floating windows also
    // tilt in 3D against the pointer for set depth.
    let removeMove: (() => void) | undefined;
    if (!window.matchMedia('(hover: none)').matches) {
      const setters = Array.from(objects).map((obj) => ({
        x: gsap.quickTo(obj, 'x', { duration: 0.9, ease: 'power3.out' }),
        y: gsap.quickTo(obj, 'y', { duration: 0.9, ease: 'power3.out' }),
        speed: parseFloat(obj.getAttribute('data-speed') || '1'),
      }));

      gsap.set(windows, { transformPerspective: 750 });
      const tilters = Array.from(windows).map((win) => ({
        rx: gsap.quickTo(win, 'rotationX', { duration: 1.1, ease: 'power3.out' }),
        ry: gsap.quickTo(win, 'rotationY', { duration: 1.1, ease: 'power3.out' }),
      }));

      const onMouseMove = (e: MouseEvent) => {
        const nx = (e.clientX / window.innerWidth - 0.5) * 2;
        const ny = (e.clientY / window.innerHeight - 0.5) * 2;
        setters.forEach((s) => {
          s.x(nx * 26 * s.speed);
          s.y(ny * 26 * s.speed);
        });
        tilters.forEach((t) => {
          t.ry(nx * 5);
          t.rx(-ny * 4);
        });
      };

      window.addEventListener('mousemove', onMouseMove, { passive: true });
      removeMove = () => window.removeEventListener('mousemove', onMouseMove);
    }

    return () => {
      if (startEntrance) window.removeEventListener(INTRO_DONE_EVENT, startEntrance);
      ctx.revert();
      removeMove?.();
    };
  }, []);

  return (
    <section ref={sectionRef} className="hero" id="hero">
      <img
        className="hero__backdrop"
        src="/landing/podium.jpg"
        alt=""
        aria-hidden="true"
      />
      <div className="hero__veil" aria-hidden="true" />

      <div className="hero__windows">
        <Premium3DObjects />
        {HERO_WINDOWS.map((win: any) => {
          const Mockup = MOCKUP_MAP[win.id];
          const posStyle: React.CSSProperties = {};
          if (win.style.top) posStyle.top = win.style.top;
          if (win.style.bottom) posStyle.bottom = win.style.bottom;
          if (win.style.left) posStyle.left = win.style.left;
          if (win.style.right) posStyle.right = win.style.right;
          posStyle.width = win.style.width;
          posStyle.transform = `${win.style.transform || ''} rotate(${win.style.rotate}deg)`.trim();

          return (
            <div key={win.id} className="browser-window glass-panel" style={posStyle}>
              <div className={win.floatClass}>
                <BrowserChrome url={win.url} />
                <div className="browser-window__body">
                  <Mockup />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="hero__content">
        <p className="scene-eyebrow hero__eyebrow">Colour · Type · Theme — unified</p>
        <h1 className="hero__headline">
          Why does one design system
          <br />
          require <MorphingText />
        </h1>
        <p className="hero__subtext">
          Colours, fonts, themes, accessibility, AI —<br />
          one creative workspace.
        </p>
        <div className="hero__ctas">
          <MagneticButton>
            <a className="magnetic-btn magnetic-btn--primary" href="/studio/ai">
              Try AI generation
              <ArrowRight className="magnetic-btn__arrow" size={17} strokeWidth={2.25} aria-hidden="true" />
            </a>
          </MagneticButton>
          <MagneticButton>
            <a className="magnetic-btn magnetic-btn--ghost" href="/browse/colors">
              Browse the library
            </a>
          </MagneticButton>
        </div>
      </div>

      <div className="hero__scroll-cue" aria-hidden="true">
        <span className="hero__scroll-cue-line" />
        <span className="hero__scroll-cue-text">Scroll</span>
      </div>
    </section>
  );
}

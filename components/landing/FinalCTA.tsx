"use client";

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight } from 'lucide-react';
import { prefersReducedMotion } from '@/lib/landing/motion';
import { MagneticButton } from '@/components/motion/MagneticButton';

const FOOTER_LINKS = [
  { label: 'Colours', href: '/browse/colors' },
  { label: 'Fonts', href: '/browse/fonts' },
  { label: 'Themes', href: '/browse/themes' },
  { label: 'Studio', href: '/studio' },
  { label: 'AI Generate', href: '/studio/ai' },
];

export default function FinalCTA() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;
    const video = section.querySelector('.final-cta__video');
    const logo = section.querySelector('.final-cta__logo');
    const headline = section.querySelector('.final-cta__headline');
    const subheadline = section.querySelector('.final-cta__subheadline');
    const buttons = section.querySelector('.final-cta__buttons');
    const footer = section.querySelector('.final-cta__footer');

    if (prefersReducedMotion()) {
      video?.pause();
      gsap.set([logo, headline, subheadline, buttons, footer], { opacity: 1, y: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top 70%',
          end: 'top 20%',
          scrub: 0.85,
        },
      });

      tl.fromTo(logo, { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }, 0.05);
      tl.fromTo(headline, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }, 0.15);
      tl.fromTo(subheadline, { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }, 0.25);
      tl.fromTo(buttons, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }, 0.35);
      tl.fromTo(footer, { opacity: 0 }, { opacity: 1, duration: 0.2 }, 0.45);

      // Run the loop only while the section is on screen
      ScrollTrigger.create({
        trigger: section,
        start: 'top bottom',
        end: 'bottom top',
        onEnter: () => video?.play().catch(() => {}),
        onEnterBack: () => video?.play().catch(() => {}),
        onLeave: () => video?.pause(),
        onLeaveBack: () => video?.pause(),
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="final-cta" id="cta">
      <div className="final-cta__body">
        <div className="final-cta__media" aria-hidden="true">
          <video
            className="final-cta__video"
            src="/landing/loop-orb.mp4"
            poster="/landing/loop-orb-poster.jpg"
            muted
            loop
            playsInline
            preload="metadata"
          />
          <div className="final-cta__veil" />
        </div>

        <div className="final-cta__content">
          <div className="final-cta__logo">StyleBook</div>

          <h2 className="final-cta__headline">
            Stop collecting design tools.
          </h2>

          <p className="final-cta__subheadline">
            Start <em>designing</em>.
          </p>

          <div className="final-cta__buttons">
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
      </div>

      <footer className="final-cta__footer">
        <div className="final-cta__footer-inner">
          <div className="final-cta__footer-brand">
            <span className="final-cta__footer-mark">StyleBook</span>
            <span className="final-cta__footer-tag">Design decisions, unified.</span>
          </div>

          <nav className="final-cta__footer-links" aria-label="Footer">
            {FOOTER_LINKS.map((link) => (
              <a key={link.href} href={link.href}>{link.label}</a>
            ))}
          </nav>

          <span className="final-cta__footer-copy">© 2026 StyleBook</span>
        </div>
      </footer>
    </section>
  );
}

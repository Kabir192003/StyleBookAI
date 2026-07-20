"use client";

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion } from '@/lib/landing/motion';

/**
 * The single cinematic moment of the page: one full-width photograph whose
 * palette *is* the site's palette — velvet dusk over champagne light.
 * Photo: Unsplash (free license), served locally from /public/landing.
 */
export default function EditorialBreak() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const img = section.querySelector('.editorial__img');
    const content = section.querySelector('.editorial__content');

    if (prefersReducedMotion()) {
      gsap.set(content, { opacity: 1, y: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      // The frame itself rises into place as it approaches
      gsap.fromTo('.editorial__frame',
        { y: 56, scale: 0.97 },
        {
          y: 0,
          scale: 1,
          duration: 1.05,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 80%',
          },
        }
      );

      // Slow drift through the frame while it crosses the viewport
      gsap.fromTo(img,
        { yPercent: -7 },
        {
          yPercent: 7,
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
        }
      );

      gsap.fromTo(content,
        { opacity: 0, y: 28 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 55%',
          },
        }
      );
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="editorial" aria-label="A StyleBook theme in the wild">
      <div className="editorial__frame">
        <img
          className="editorial__img"
          src="/landing/editorial-dusk.jpg"
          alt="Modern house at dusk — a deep velvet sky over warm champagne interior light"
          loading="lazy"
        />
        <div className="editorial__scrim" aria-hidden="true" />
        <figure className="editorial__content">
          <p className="scene-eyebrow editorial__eyebrow">The feeling</p>
          <blockquote>
            <p className="editorial__quote">
              Taste isn&apos;t a mood.
              <br />
              It&apos;s a <em className="serif-accent">system</em>.
            </p>
          </blockquote>
          <figcaption className="editorial__caption">
            Velvet #222D52 · Champagne #D2B68A — a StyleBook theme, in the wild
          </figcaption>
        </figure>
      </div>
    </section>
  );
}

"use client";

import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

import CustomCursor from '@/components/landing/CustomCursor';
import IntroCurtain, { INTRO_DONE_EVENT } from '@/components/landing/IntroCurtain';
import SceneRail from '@/components/landing/SceneRail';
import SwatchTicker from '@/components/landing/SwatchTicker';
import Hero from '@/components/landing/Hero';
import ScrollChaos from '@/components/landing/ScrollChaos';
import ScrollUnification from '@/components/landing/ScrollUnification';
import ScrollWorkspace from '@/components/landing/ScrollWorkspace';
import ScrollAI from '@/components/landing/ScrollAI';
import EditorialBreak from '@/components/landing/EditorialBreak';
import ScrollInteractive from '@/components/landing/ScrollInteractive';
import ScrollExplore from '@/components/landing/ScrollExplore';
import ScrollTypography from '@/components/landing/ScrollTypography';
import ScrollStudio from '@/components/landing/ScrollStudio';
import ScrollAccessibility from '@/components/landing/ScrollAccessibility';
import ScrollExport from '@/components/landing/ScrollExport';
import FinalCTA from '@/components/landing/FinalCTA';
import { prefersReducedMotion } from '@/lib/landing/motion';

import '@/app/styles/landing/globals.css';
import '@/app/styles/landing/intro.css';
import '@/app/styles/landing/rail.css';
import '@/app/styles/landing/ticker.css';
import '@/app/styles/landing/cursor.css';
import '@/app/styles/landing/hero.css';
import '@/app/styles/landing/chaos.css';
import '@/app/styles/landing/unification.css';
import '@/app/styles/landing/workspace.css';
import '@/app/styles/landing/ai-thinking.css';
import '@/app/styles/landing/editorial.css';
import '@/app/styles/landing/interactive.css';
import '@/app/styles/landing/explore.css';
import '@/app/styles/landing/typography.css';
import '@/app/styles/landing/studio.css';
import '@/app/styles/landing/accessibility.css';
import '@/app/styles/landing/export.css';
import '@/app/styles/landing/cta.css';

// Register at module scope: child section effects run before this component's
// effect, and they call ScrollTrigger.create() — it must be registered first.
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function Home() {
  useEffect(() => {
    document.body.classList.add('landing');

    // The browser's async scroll restore fights the scroll choreography
    // (pins + smooth scroll) after reload — always start scenes from where
    // the user actually is, never a restored offset.
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }

    // Reduced motion: native scrolling, no smoothing, no scroll-driven
    // choreography. Scene components snap themselves to final states.
    if (prefersReducedMotion()) {
      return () => document.body.classList.remove('landing');
    }

    const lenis = new Lenis({
      lerp: 0.075,
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.4,
    });

    if (process.env.NODE_ENV !== 'production') {
      // Dev-only handle for tooling (e.g. scripted scroll during visual QA).
      (window as any).__lenis = lenis;
    }

    lenis.on('scroll', ScrollTrigger.update);

    const update = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);

    // Every pinned scene's start/end is computed from document layout at
    // mount time. Images and the editorial video load asynchronously below
    // their reserved space (or, before the aspect-ratio fix, without any
    // reserved space at all) — any late layout shift leaves ScrollTrigger's
    // cached pin coordinates stale for everything further down the page,
    // which is exactly why the last few sections (studio/export/final-cta)
    // were the ones that felt broken. Refresh once everything has actually
    // settled: fonts swapped in, every image decoded, every video's layout
    // metadata read.
    const media = Array.from(
      document.querySelectorAll<HTMLImageElement | HTMLVideoElement>('main img, main video')
    );
    const pending = media.filter((el) =>
      el instanceof HTMLImageElement ? !el.complete : el.readyState < 1
    );

    let refreshTimeout: ReturnType<typeof setTimeout> | undefined;
    const scheduleRefresh = () => {
      clearTimeout(refreshTimeout);
      refreshTimeout = setTimeout(() => ScrollTrigger.refresh(), 50);
    };

    pending.forEach((el) => {
      const event = el instanceof HTMLImageElement ? 'load' : 'loadedmetadata';
      el.addEventListener(event, scheduleRefresh, { once: true });
    });
    document.fonts?.ready?.then(scheduleRefresh);
    window.addEventListener('load', scheduleRefresh);
    scheduleRefresh();

    // Hold the page still while the intro curtain plays
    if (document.documentElement.classList.contains('intro-active')) {
      lenis.stop();
      window.addEventListener(INTRO_DONE_EVENT, () => lenis.start(), { once: true });
    }

    return () => {
      document.body.classList.remove('landing');
      gsap.ticker.remove(update);
      window.removeEventListener('load', scheduleRefresh);
      clearTimeout(refreshTimeout);
      lenis.destroy();
    };
  }, []);

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <IntroCurtain />
      <div className="premium-grid" aria-hidden="true" />
      <div className="noise-overlay" aria-hidden="true" />
      <CustomCursor />
      <SceneRail />

      {/* Global background atmosphere */}
      <div
        className="fixed inset-0 pointer-events-none overflow-hidden"
        style={{ zIndex: -1 }}
        aria-hidden="true"
      >
        <div className="ambient-orb ambient-orb--1" />
        <div className="ambient-orb ambient-orb--2" />
        <div className="ambient-orb ambient-orb--3" />
      </div>

      <main id="main">
        <Hero />
        <ScrollChaos />
        <ScrollUnification />
        <ScrollWorkspace />
        <ScrollAI />
        <EditorialBreak />
        <ScrollInteractive />
        <SwatchTicker />
        <ScrollExplore />
        <ScrollTypography />
        <ScrollStudio />
        <ScrollAccessibility />
        <ScrollExport />
        <FinalCTA />
      </main>
    </>
  );
}

"use client";

import { useEffect, useRef, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import chroma from 'chroma-js';
import { prefersReducedMotion, seededRandom } from '@/lib/landing/motion';

// The full spectrum — the wall is the one place the library shows its whole
// range, floating loose on the silk page until scroll calls it to order.
function generateColors(count) {
  const rand = seededRandom(93);
  // Unique values only: swatch identity doubles as the React key so the
  // hue-sort can FLIP-animate each tile to its new position.
  const colors = new Set();
  while (colors.size < count) {
    const hue = Math.floor(rand() * 360);
    const sat = 48 + Math.floor(rand() * 42);
    const light = 38 + Math.floor(rand() * 42);
    colors.add(`hsl(${hue}, ${sat}%, ${light}%)`);
  }
  return [...colors];
}

// Scattered "paint chips on the desk" offsets for the unsorted state
function generateScatter(count) {
  const rand = seededRandom(29);
  return Array.from({ length: count }, () => ({
    x: (rand() - 0.5) * 96,
    y: (rand() - 0.5) * 72,
    rotate: (rand() - 0.5) * 26,
  }));
}

export default function ScrollExplore() {
  const sectionRef = useRef(null);
  const [colors, setColors] = useState([]);
  const [isSorted, setIsSorted] = useState(false);
  const [copied, setCopied] = useState(null);

  useEffect(() => {
    const compact = window.matchMedia('(max-width: 768px)').matches;
    setColors(generateColors(compact ? 96 : 144));
  }, []);

  const sortedColors = useMemo(() => {
    return [...colors].sort((a, b) => {
      const getHue = (hsl) => parseInt(hsl.match(/\d+/)[0], 10);
      return getHue(a) - getHue(b);
    });
  }, [colors]);

  useEffect(() => {
    const section = sectionRef.current;

    if (prefersReducedMotion()) {
      setIsSorted(true);
      return;
    }

    const ctx = gsap.context(() => {
      // The gallery panel rises into place as it approaches
      gsap.fromTo('.explore__container',
        { y: 60, scale: 0.965 },
        {
          y: 0,
          scale: 1,
          duration: 1.05,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 78%',
          },
        }
      );

      ScrollTrigger.create({
        trigger: section,
        start: 'top 30%',
        onEnter: () => setIsSorted(true),
        onLeaveBack: () => setIsSorted(false),
      });
    }, section);

    return () => ctx.revert();
  }, []);

  const copyColor = (color, i) => {
    const hex = chroma(color).hex().toUpperCase();
    navigator.clipboard?.writeText(hex).catch(() => {});
    setCopied({ index: i, hex });
    setTimeout(() => setCopied(null), 1200);
  };

  const displayColors = isSorted ? sortedColors : colors;

  return (
    <section ref={sectionRef} className="explore" id="explore">
      <div className="explore__container">
        <div className="explore__header">
          <p className="scene-eyebrow explore__eyebrow">The library</p>
          <h2>The <em className="serif-accent explore__accent">colour</em> wall.</h2>
          <p className="explore__sub">
            The house register — every shade finds its order as you arrive.
          </p>
          <p className="explore__status" aria-live="polite">
            {isSorted ? 'Sorted by hue' : 'Unsorted'}
          </p>
        </div>

        <motion.div className="explore__wall">
          {displayColors.map((color, i) => (
            <motion.button
              key={color}
              layout
              type="button"
              className="explore__swatch-btn"
              initial={{ scale: 0, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{
                type: 'spring',
                stiffness: 260,
                damping: 22,
                delay: Math.min(i * 0.006, 0.7),
              }}
              whileHover={{ scale: 1.14, zIndex: 10 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => copyColor(color, i)}
              aria-label={`Copy ${chroma(color).hex().toUpperCase()}`}
              data-cursor-interactive="true"
              data-cursor-color={color}
              data-cursor-label="COPY"
              style={{ background: color }}
            >
              {copied?.index === i && (
                <span className="explore__copied">{copied.hex}</span>
              )}
            </motion.button>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

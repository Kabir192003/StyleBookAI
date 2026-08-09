/**
 * The landing page — "watch a page come to life." Styled to match
 * Landing.dc.html pulled from claude.ai/design (project "Website redesign
 * request"): the page itself starts deliberately undesigned (grey, Times
 * New Roman, no radius) and a five-act scroll narrative morphs it — via
 * CSS custom properties on the root element — into StyleBook's real
 * cream/ink/navy/Fraunces system, ending on a live "Aurelia" mockup site
 * dressed in four different theme editions.
 *
 * Ported from the design's vanilla-JS/GSAP implementation into React,
 * reusing this app's existing gsap + ScrollTrigger + Lenis stack (already
 * a dependency, already used the same way by the previous landing page).
 * Two of the original's purely decorative touches were intentionally
 * dropped rather than ported: the canvas mouse-paint trail in the hero,
 * and a scroll-velocity skew on the closing marquee — both add real
 * implementation risk for effects nobody would notice missing.
 */
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { prefersReducedMotion } from "@/lib/landing/motion";
import { GoogleFontsLoader } from "@/components/fonts/GoogleFontsLoader";
import { LandingGeneratePanel } from "@/components/landing/LandingGeneratePanel";
import { useAIResultStore } from "@/store";
import { paletteFromAIColors } from "@/lib/studio/paletteFromAIColors";
import {
  DEFAULT_LANDING_PROMPT,
  FALLBACK_PREVIEW,
  FALLBACK_STUDIO_PALETTE,
  LandingPreview,
  STARTER_PREVIEW,
} from "@/lib/landing/aiPreview";
import { AIGeneratedProject } from "@/types/ai";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const UGLY: Record<string, string> = {
  "--bg": "#ECEBE7",
  "--ink": "#3A3A3A",
  "--acc": "#8A8A8A",
  "--acc2": "#6B6B6B",
  "--mut": "#8B8B86",
  "--panel": "#E4E3DF",
  "--edge": "rgba(0,0,0,0.18)",
  "--rad": "0px",
  "--fd": "'Times New Roman',serif",
  "--fb": "Arial,sans-serif",
};

const FINAL_COLOR: Record<string, string> = {
  "--bg": "#F2EBE0",
  "--ink": "#211E18",
  "--acc": "#C36B3E",
  "--acc2": "#222D52",
  "--mut": "#6E675C",
  "--panel": "#F7F0E1",
  "--edge": "rgba(33,30,24,0.14)",
};

const SWATCHES = [
  { hex: "#C36B3E", name: "Terracotta", text: "#FBF3E8" },
  { hex: "#E4C15A", name: "Honey", text: "#3A3006" },
  { hex: "#D2B68A", name: "Champagne", text: "#3A2E17" },
  { hex: "#1F5C41", name: "Emerald", text: "#EAF2EC" },
  { hex: "#178C88", name: "Teal", text: "#E8F4F3" },
  { hex: "#6FB0DE", name: "Sky", text: "#0C2233" },
  { hex: "#2455C6", name: "Cobalt", text: "#E9EEFB" },
  { hex: "#222D52", name: "Navy", text: "#F2EBE0" },
  { hex: "#7A3B86", name: "Plum", text: "#F4EAF6" },
  { hex: "#CF4E86", name: "Rose", text: "#FBEAF1" },
];

const TYPE_STEPS = [
  { fd: "'Times New Roman',serif", fb: "Arial,sans-serif", label: "Times New Roman — browser default" },
  { fd: "'Courier New',monospace", fb: "Arial,sans-serif", label: "Courier New — typewriter" },
  { fd: "var(--font-technical-sans),sans-serif", fb: "Arial,sans-serif", label: "Space Grotesk — technical" },
  { fd: "var(--font-geometric-sans),sans-serif", fb: "Arial,sans-serif", label: "Sora — geometric" },
  { fd: "var(--font-editorial-serif),serif", fb: "var(--font-grotesk),sans-serif", label: "Fraunces — editorial ✓" },
];

const EDITIONS = [
  {
    label: "Edition 01",
    name: "Velvet Dusk",
    desc: "Candlelit navy and champagne — for brands that speak softly and carry taste.",
    bg: "#222D52",
    ink: "#F2EBE0",
    eyebrow: "#D2B68A",
    dots: ["#222D52", "#D2B68A", "#F2EBE0", "#8A93B8"],
    fonts: "Fraunces · Archivo",
    card: { bg: "#F2EBE0", ink: "#211E18", accent: "#222D52", onAccent: "#F2EBE0", head: "'Fraunces',serif", italic: "#9A7B4F" },
  },
  {
    label: "Edition 02",
    name: "Terracotta Study",
    desc: "Sun-baked clay and honey — warm, handmade, generous with texture.",
    bg: "#F7F0E1",
    ink: "#211E18",
    eyebrow: "#C36B3E",
    dots: ["#C36B3E", "#E4C15A", "#FBF3E8", "#211E18"],
    fonts: "Sora · Archivo",
    card: { bg: "#FBF6EC", ink: "#211E18", accent: "#C36B3E", onAccent: "#FBF8F2", head: "'Sora',sans-serif", italic: "#C36B3E" },
  },
  {
    label: "Edition 03",
    name: "Botanical",
    desc: "Greenhouse greens and lime light — fresh, organic, quietly optimistic.",
    bg: "#EAF2EA",
    ink: "#14301F",
    eyebrow: "#1F5C41",
    dots: ["#1F5C41", "#A6C24E", "#DDE3DC", "#14301F"],
    fonts: "Space Grotesk · Archivo",
    card: { bg: "#F7FAF5", ink: "#14301F", accent: "#1F5C41", onAccent: "#EAF2EC", head: "'Space Grotesk',sans-serif", italic: "#1F5C41" },
  },
  {
    label: "Edition 04",
    name: "Porcelain",
    desc: "Glazed white and washed sky — minimal, precise, gallery-quiet.",
    bg: "#F4F1EA",
    ink: "#2E3440",
    eyebrow: "#5D87B0",
    dots: ["#6FB0DE", "#F4F1EA", "#C9D4DE", "#2E3440"],
    fonts: "Archivo · Plex Mono",
    card: { bg: "#FCFBF7", ink: "#2E3440", accent: "#6FB0DE", onAccent: "#0C2233", head: "'Archivo',sans-serif", italic: "#5D87B0" },
  },
];

const DOORS = [
  {
    href: "/browse/colors",
    mode: "Mode 01 — browse",
    title: "The Library",
    body: "Thousands of curated shades, specimens and themes — pick what's already right.",
    cta: "Browse →",
    highlight: false,
  },
  {
    href: "/studio",
    mode: "Mode 02 — build",
    title: "The Studio",
    body: "Assemble every token by hand — colour, scale, spacing, shadow. Maximum control, zero guesswork.",
    cta: "Open the Studio →",
    highlight: true,
  },
  {
    href: "/studio/ai",
    mode: "Mode 03 — generate",
    title: "The AI Atelier",
    body: "One sentence in, a full system out — palette, type and tokens in a single pass.",
    cta: "Generate →",
    highlight: false,
  },
];

const EXPORT_FORMATS = ["{ } CSS Variables", "[ ] JSON Tokens", "~/ Tailwind", "◇ Figma Tokens", "⚛ React", "◆ Flutter", "SwiftUI", "↓ Style Guide"];

// The AI generator (S6, the navy panel, now also the top-of-page hero)
// is a real, working generator — POSTs to the same /api/ai/generate
// route as /studio/ai — not a static mockup. State lives here (shared by
// both render sites, see components/landing/LandingGeneratePanel.tsx);
// LandingPreview normalizes a real AIGeneratedProject and the two static
// fallbacks (pre-interaction, and "the live call failed") into one shape.

export function LandingExperience() {
  const rootRef = useRef<HTMLDivElement>(null);
  const loaderRef = useRef<HTMLDivElement>(null);
  const hudTokRef = useRef<HTMLSpanElement>(null);
  const hudActRef = useRef<HTMLSpanElement>(null);
  const toastRef = useRef<HTMLDivElement>(null);
  const cursorDotRef = useRef<HTMLDivElement>(null);
  const cursorRingRef = useRef<HTMLDivElement>(null);
  const railFillRef = useRef<HTMLSpanElement>(null);
  const typeLabelRef = useRef<HTMLDivElement>(null);
  const underlineRef = useRef<SVGPathElement>(null);
  const edTrackRef = useRef<HTMLDivElement>(null);
  const edFillRef = useRef<HTMLSpanElement>(null);
  const edNumRef = useRef<HTMLSpanElement>(null);

  const router = useRouter();
  const stageAIResult = useAIResultStore((s) => s.setResult);
  const [landingPrompt, setLandingPrompt] = useState(DEFAULT_LANDING_PROMPT);
  const [landingStatus, setLandingStatus] = useState<"idle" | "loading" | "done">("idle");
  const [landingProject, setLandingProject] = useState<AIGeneratedProject | null>(null);
  const [landingFellBack, setLandingFellBack] = useState(false);

  async function handleLandingGenerate() {
    const trimmed = landingPrompt.trim();
    if (!trimmed || landingStatus === "loading") return;
    setLandingStatus("loading");
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: trimmed }),
      });
      if (!res.ok) throw new Error("generation failed");
      const data = await res.json();
      setLandingProject(data.project as AIGeneratedProject);
      setLandingFellBack(false);
    } catch {
      // Network failure, timeout, cold-start, rate limit — whatever it is,
      // the visitor sees a graceful example instead of an error state.
      setLandingProject(null);
      setLandingFellBack(true);
    } finally {
      setLandingStatus("done");
      // Content height just changed (result cards, maybe the fallback
      // note) — keep downstream ScrollTrigger positions (Colophon's
      // reveal) accurate.
      ScrollTrigger.refresh();
    }
  }

  function openLandingResultInStudio() {
    if (!landingProject) {
      router.push("/studio/ai");
      return;
    }
    stageAIResult(landingPrompt, false, landingProject);
    const palette = paletteFromAIColors(landingProject.colors, FALLBACK_STUDIO_PALETTE);
    const params = new URLSearchParams({
      from: "ai",
      name: landingProject.name,
      accent: palette.accent,
      support: palette.support,
      surface: palette.surface,
      ink: palette.ink,
      muted: palette.muted,
      head: landingProject.fonts.primary.family,
      body: landingProject.fonts.secondary.family,
    });
    router.push(`/studio?${params.toString()}`);
  }

  const landingPalette = landingProject ? paletteFromAIColors(landingProject.colors, FALLBACK_STUDIO_PALETTE) : null;
  const landingPreview: LandingPreview = landingProject
    ? {
        name: landingProject.name,
        swatches: landingProject.colors.slice(0, 5).map((c) => c.hex),
        fontFamily: `'${landingProject.fonts.primary.family}',${landingProject.fonts.primary.category === "serif" ? "serif" : "sans-serif"}`,
        fontLabel: `${landingProject.fonts.primary.family} · display`,
        contrastFg: landingPalette!.ink,
        contrastBg: landingPalette!.surface,
        contrastLabel: `radius ${landingProject.cornerRadius?.recommended ?? 12}px · space ${landingProject.spacing?.base ?? 8}px`,
      }
    : landingFellBack
    ? FALLBACK_PREVIEW
    : STARTER_PREVIEW;

  useEffect(() => {
    document.body.classList.add("landing-exp");
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";

    const root = rootRef.current;
    if (!root) return;

    const setVars = (vars: Record<string, string>) => {
      for (const k in vars) root.style.setProperty(k, vars[k]);
    };
    setVars(UGLY);

    const reduced = prefersReducedMotion();

    // Copy-hex toast, wired regardless of motion preference.
    let toastTween: gsap.core.Timeline | undefined;
    const swatchEls = Array.from(root.querySelectorAll<HTMLElement>("[data-sw]"));
    const onSwatchClick = (el: HTMLElement) => () => {
      const hex = el.getAttribute("data-hex") ?? "";
      try {
        navigator.clipboard?.writeText(hex);
      } catch {
        // Clipboard can fail silently — the toast just won't confirm it.
      }
      const toast = toastRef.current;
      if (toast && hex) {
        toast.textContent = `Copied ${hex}`;
        toastTween?.kill();
        toastTween = gsap
          .timeline()
          .to(toast, { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" })
          .to(toast, { opacity: 0, y: 20, duration: 0.4, delay: 1.1, ease: "power2.in" });
      }
    };
    swatchEls.forEach((el) => el.addEventListener("click", onSwatchClick(el)));

    if (reduced) {
      // Reduced motion: skip the choreography, snap straight to the
      // finished, designed state, no pinning.
      const loader = loaderRef.current;
      if (loader) loader.style.display = "none";
      setVars({ ...FINAL_COLOR, "--rad": "14px", "--fd": TYPE_STEPS[4].fd, "--fb": TYPE_STEPS[4].fb });
      if (typeLabelRef.current) typeLabelRef.current.textContent = TYPE_STEPS[4].label;
      if (hudTokRef.current) hudTokRef.current.textContent = "24/24";
      swatchEls.forEach((el, i, arr) => {
        el.style.filter = "none";
        el.style.transform = `rotate(${-70 + i * (140 / (arr.length - 1))}deg)`;
      });
      root.querySelectorAll<HTMLElement>("[data-card]").forEach((el) => {
        el.style.borderRadius = "16px";
        el.style.padding = "26px";
      });
      if (edTrackRef.current) edTrackRef.current.style.flexWrap = "wrap";
      root.querySelectorAll<HTMLElement>("[data-piece]").forEach((el) => {
        el.style.opacity = "1";
        el.style.transform = "none";
      });
      return () => {
        document.body.classList.remove("landing-exp");
        swatchEls.forEach((el) => el.removeEventListener("click", onSwatchClick(el)));
      };
    }

    const lenis = new Lenis({ lerp: 0.075, smoothWheel: true, wheelMultiplier: 1, touchMultiplier: 1.4 });
    if (process.env.NODE_ENV !== "production") {
      (window as unknown as { __lenis?: Lenis }).__lenis = lenis;
    }
    lenis.on("scroll", ScrollTrigger.update);
    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    const ctx = gsap.context(() => {
      // Loader
      gsap
        .timeline()
        .to("[data-loader-bar]", { width: "100%", duration: 1, ease: "power2.inOut" })
        .to("[data-strike]", { scaleX: 1, duration: 0.32, ease: "power3.inOut" }, "-=0.1")
        .to("[data-loader-word]", { yPercent: -130, opacity: 0, duration: 0.5, ease: "power3.in", stagger: 0.06 }, "+=0.12")
        .to("[data-loader]", { yPercent: -100, duration: 0.8, ease: "power4.inOut" }, "-=0.05")
        .set("[data-loader]", { display: "none" });

      gsap.from("[data-hero-line]", { y: 44, opacity: 0, duration: 1, ease: "expo.out", stagger: 0.1, delay: 0.5 });

      const tok = (n: number) => {
        if (hudTokRef.current) hudTokRef.current.textContent = `${n < 10 ? "0" : ""}${n}/24`;
      };

      // ACT I — colour: grey blades fan out and saturate into the real palette.
      const lerpColor = gsap.utils.interpolate(UGLY, FINAL_COLOR);
      let lock1 = false;
      const tl1 = gsap.timeline({
        scrollTrigger: {
          trigger: "[data-act1]",
          start: "top top",
          end: "+=170%",
          pin: true,
          scrub: 1,
          onUpdate: (self) => {
            tok(Math.round(self.progress * 8));
            if (!lock1) {
              const vv = lerpColor(self.progress) as Record<string, string>;
              setVars(vv);
              if (self.progress > 0.999) lock1 = true;
            }
          },
        },
      });
      tl1.from("[data-tok1]", { opacity: 0, x: -14, duration: 0.16, stagger: 0.07 }, 0.2);
      const blades = gsap.utils.toArray<HTMLElement>("[data-sw]");
      const bn = blades.length;
      blades.forEach((b, i) => {
        tl1.fromTo(
          b,
          { rotate: (i - (bn - 1) / 2) * 0.8, filter: "grayscale(1) brightness(1.04)" },
          { rotate: -70 + i * (140 / (bn - 1)), filter: "grayscale(0) brightness(1)", ease: "power2.out", duration: 0.85 },
          0.06 + i * 0.02
        );
      });

      // ACT II — type: font cycles through five faces, sizes stretch into a scale.
      let fontMax = false;
      let fontIdx = -1;
      const setFont = (i: number) => {
        if (fontMax && i < 4) return;
        if (i >= 4) fontMax = true;
        if (fontIdx === i) return;
        fontIdx = i;
        root.style.setProperty("--fd", TYPE_STEPS[i].fd);
        root.style.setProperty("--fb", TYPE_STEPS[i].fb);
        if (typeLabelRef.current) typeLabelRef.current.textContent = TYPE_STEPS[i].label;
      };
      const tl2 = gsap.timeline({
        scrollTrigger: {
          trigger: "[data-act2]",
          start: "top top",
          end: "+=170%",
          pin: true,
          scrub: 1,
          onUpdate: (self) => {
            tok(8 + Math.round(self.progress * 6));
            setFont(Math.min(4, Math.floor(self.progress * 5.4)));
          },
        },
      });
      tl2
        .fromTo("[data-trow-d]", { fontSize: "17px" }, { fontSize: "clamp(44px,5.4vw,84px)", ease: "power1.inOut", duration: 0.8 }, 0.1)
        .fromTo("[data-trow-h]", { fontSize: "17px" }, { fontSize: "clamp(28px,3vw,46px)", ease: "power1.inOut", duration: 0.8 }, 0.14)
        .fromTo("[data-trow-c]", { fontSize: "17px" }, { fontSize: "12px", ease: "power1.inOut", duration: 0.8 }, 0.18)
        .fromTo("[data-typemorph]", { letterSpacing: "0.04em" }, { letterSpacing: "-0.028em", ease: "none", duration: 0.9 }, 0.05)
        .to("[data-basegrid]", { opacity: 1, ease: "none", duration: 0.5 }, 0.25)
        .from("[data-tok2]", { opacity: 0, x: -14, duration: 0.16, stagger: 0.08 }, 0.2);

      // ACT III — rhythm: cramped cards inhale into spaced, rounded, shadowed ones.
      let lock3 = false;
      const tl3 = gsap.timeline({
        scrollTrigger: {
          trigger: "[data-act3]",
          start: "top top",
          end: "+=150%",
          pin: true,
          scrub: 1,
          onUpdate: (self) => {
            tok(14 + Math.round(self.progress * 6));
            if (!lock3) {
              root.style.setProperty("--rad", `${(self.progress * 14).toFixed(1)}px`);
              if (self.progress > 0.999) lock3 = true;
            }
          },
        },
      });
      tl3
        .fromTo("[data-cards]", { gap: "2px" }, { gap: "22px", ease: "power1.inOut", duration: 0.9 }, 0)
        .fromTo(
          "[data-card]",
          { borderRadius: "0px", padding: "12px", boxShadow: "0 0 0 rgba(20,17,12,0)" },
          { borderRadius: "16px", padding: "26px", boxShadow: "0 26px 54px -22px rgba(20,17,12,0.35)", ease: "power1.inOut", duration: 0.9, stagger: 0.06 },
          0
        )
        .to("[data-gridbg]", { opacity: 1, ease: "none", duration: 0.6 }, 0.15)
        .from("[data-tok3]", { opacity: 0, x: -14, duration: 0.16, stagger: 0.08 }, 0.2);

      // ACT IV — bind: scattered pieces of a mock site fly together into one frame.
      const tl4 = gsap.timeline({
        scrollTrigger: {
          trigger: "[data-act4]",
          start: "top top",
          end: "+=190%",
          pin: true,
          scrub: 1,
          onUpdate: (self) => tok(20 + Math.round(self.progress * 4)),
        },
      });
      gsap.utils.toArray<HTMLElement>("[data-piece]").forEach((p, i) => {
        tl4.fromTo(
          p,
          { x: gsap.utils.random(-340, 340), y: gsap.utils.random(-260, 260), rotate: gsap.utils.random(-24, 24), opacity: 0 },
          { x: 0, y: 0, rotate: 0, opacity: 1, ease: "power2.out", duration: 0.6 },
          i * 0.09
        );
      });
      tl4.fromTo("[data-frame]", { scale: 0.92 }, { scale: 1, ease: "power1.inOut", duration: 1.1 }, 0);
      const underline = underlineRef.current;
      if (underline) {
        const len = underline.getTotalLength();
        underline.style.setProperty("stroke-dasharray", String(len));
        underline.style.setProperty("stroke-dashoffset", String(len));
        tl4.to(underline, { strokeDashoffset: 0, duration: 0.3, ease: "power2.out" }, 0.75);
      }

      // ACT V — editions: horizontal pinned scroll through four dressed sites.
      const edTrack = edTrackRef.current;
      if (edTrack) {
        const hted = gsap.to(edTrack, {
          xPercent: -75,
          ease: "none",
          scrollTrigger: {
            trigger: "[data-editions]",
            start: "top top",
            end: "+=300%",
            pin: true,
            scrub: 1,
            onUpdate: (self) => {
              if (edFillRef.current) edFillRef.current.style.width = `${(self.progress * 100).toFixed(1)}%`;
              if (edNumRef.current) edNumRef.current.textContent = `0${Math.min(3, Math.floor(self.progress * 4)) + 1}`;
            },
          },
        });
        gsap.utils.toArray<HTMLElement>("[data-ed-visual]").forEach((v) => {
          gsap.fromTo(
            v,
            { x: 70, rotate: 2 },
            { x: -70, rotate: -2, ease: "none", scrollTrigger: { trigger: v, containerAnimation: hted, start: "left 90%", end: "right 10%", scrub: true } }
          );
        });
      }

      // Reveal-on-scroll groups (Shortcut + Colophon content).
      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
        gsap.from(el, { y: 38, opacity: 0, duration: 0.9, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 87%" } });
      });
      gsap.utils.toArray<HTMLElement>("[data-reveal-group]").forEach((grp) => {
        const items = grp.querySelectorAll<HTMLElement>("[data-reveal-item]");
        gsap.from(items, { y: 40, opacity: 0, duration: 0.85, ease: "power3.out", stagger: 0.09, scrollTrigger: { trigger: grp, start: "top 81%" } });
      });

      // Right-edge progress rail + HUD act label.
      if (railFillRef.current) {
        const rf = railFillRef.current;
        ScrollTrigger.create({
          start: 0,
          end: "max",
          onUpdate: (self) => {
            rf.style.height = `${(self.progress * 100).toFixed(2)}%`;
          },
        });
      }
      // "Welcome" covers the new top-of-page product hero (S0) — every
      // label after it shifts by one now that there's a section before
      // the "Undesigned" story hero; this array is positionally matched
      // against root.querySelectorAll("section") below, so it must have
      // exactly one entry per <section> in the same order.
      const labels = ["Welcome", "Undesigned", "Act I — Colour", "Act II — Type", "Act III — Rhythm", "Act IV — Theme", "Act V — Editions", "Three doors", "Alive"];
      root.querySelectorAll<HTMLElement>("section").forEach((sec, i) => {
        ScrollTrigger.create({
          trigger: sec,
          start: "top 55%",
          end: "bottom 55%",
          onToggle: (self) => {
            if (self.isActive && hudActRef.current) hudActRef.current.textContent = labels[i] ?? "";
          },
        });
      });

      // Cursor (desktop, fine pointer only).
      const cd = cursorDotRef.current;
      const cr = cursorRingRef.current;
      if (cd && cr && window.matchMedia("(pointer:fine)").matches) {
        gsap.set([cd, cr], { opacity: 1 });
        let mx = window.innerWidth / 2;
        let my = window.innerHeight / 2;
        let rx = mx;
        let ry = my;
        let rs = 1;
        let ts = 1;
        const onMove = (e: MouseEvent) => {
          mx = e.clientX;
          my = e.clientY;
          cd.style.left = `${mx}px`;
          cd.style.top = `${my}px`;
        };
        window.addEventListener("mousemove", onMove);
        gsap.ticker.add(() => {
          rx += (mx - rx) * 0.16;
          ry += (my - ry) * 0.16;
          rs += (ts - rs) * 0.2;
          cr.style.left = `${rx}px`;
          cr.style.top = `${ry}px`;
          cr.style.transform = `scale(${rs})`;
        });
        root.querySelectorAll("a,button,[data-sw]").forEach((el) => {
          el.addEventListener("mouseenter", () => {
            ts = 2;
          });
          el.addEventListener("mouseleave", () => {
            ts = 1;
          });
        });
      }

      // Magnetic pill buttons.
      root.querySelectorAll<HTMLElement>("[data-pill]").forEach((el) => {
        el.style.setProperty("will-change", "transform");
        el.addEventListener("mousemove", (e) => {
          const r = el.getBoundingClientRect();
          const me = e as MouseEvent;
          gsap.to(el, { x: (me.clientX - (r.left + r.width / 2)) * 0.3, y: (me.clientY - (r.top + r.height / 2)) * 0.5, duration: 0.4, ease: "power3.out" });
        });
        el.addEventListener("mouseleave", () => {
          gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1,0.4)" });
        });
      });

      // Subtle 3D tilt on the Act IV frame, following the pointer.
      const frame = root.querySelector<HTMLElement>("[data-frame]");
      const act4 = root.querySelector<HTMLElement>("[data-act4]");
      if (frame && act4 && window.matchMedia("(pointer:fine)").matches) {
        const target = frame.parentElement;
        let tx = 0;
        let ty = 0;
        let ttx = 0;
        let tty = 0;
        act4.addEventListener("mousemove", (e) => {
          const r = act4.getBoundingClientRect();
          tx = (((e as MouseEvent).clientX - r.left) / r.width) * 2 * 6 - 6;
          ty = ((((e as MouseEvent).clientY - r.top) / r.height) * 2 - 1) * -4;
        });
        act4.addEventListener("mouseleave", () => {
          tx = 0;
          ty = 0;
        });
        gsap.ticker.add(() => {
          ttx += (tx - ttx) * 0.08;
          tty += (ty - tty) * 0.08;
          if (target) target.style.transform = `perspective(1100px) rotateY(${ttx.toFixed(2)}deg) rotateX(${tty.toFixed(2)}deg)`;
        });
      }

      // Colophon confetti burst, once.
      ScrollTrigger.create({
        trigger: "[data-colophon]",
        start: "top 70%",
        once: true,
        onEnter: () => {
          gsap.fromTo(
            "[data-cel]",
            { opacity: 0, scale: 0, x: 0, y: 0 },
            {
              opacity: 0.85,
              scale: 1,
              x: () => gsap.utils.random(-340, 340),
              y: () => gsap.utils.random(-220, 130),
              rotate: () => gsap.utils.random(-120, 120),
              duration: 1.2,
              ease: "expo.out",
              stagger: 0.025,
            }
          );
          gsap.to("[data-cel]", { opacity: 0.22, duration: 1.4, delay: 1.6 });
        },
      });

      document.querySelectorAll("[data-replay]").forEach((el) => {
        el.addEventListener("click", (e) => {
          e.preventDefault();
          window.scrollTo(0, 0);
          window.location.reload();
        });
      });

      ScrollTrigger.refresh();
    }, root);

    return () => {
      document.body.classList.remove("landing-exp");
      swatchEls.forEach((el) => el.removeEventListener("click", onSwatchClick(el)));
      gsap.ticker.remove(raf);
      lenis.destroy();
      ctx.revert();
    };
  }, []);

  return (
    <div ref={rootRef} className="relative overflow-x-hidden" style={{ fontFamily: "var(--fb)", background: "var(--bg)", color: "var(--ink)" }}>
      <a href="#main" className="sr-only focus:not-sr-only fixed left-3 top-3 z-[300] rounded-full bg-[#211E18] px-4 py-2.5 text-sm font-semibold text-[#F2EBE0]">
        Skip to content
      </a>

      {/* Loader */}
      <div ref={loaderRef} data-loader className="fixed inset-0 z-[200] flex items-center justify-center bg-[#ECEBE7]">
        <div className="text-center">
          <div className="relative overflow-hidden pb-1.5 font-serif text-[clamp(38px,6vw,84px)] leading-none text-[#3A3A3A]" style={{ fontFamily: "'Times New Roman',serif" }}>
            <span data-loader-word className="inline-block">
              undesigned
            </span>
            <span data-loader-word className="inline-block text-[#8A8A8A]">
              .html
            </span>
            <span data-strike className="absolute left-[-2%] top-1/2 h-[7px] w-[104%] origin-left rounded bg-[#C36B3E]" style={{ marginTop: -3, transform: "scaleX(0)" }} />
          </div>
          <div className="mt-4 font-mono-plex text-[11px] uppercase tracking-[0.22em] text-[#8B8B86]">waiting for a design system…</div>
          <div className="mx-auto mt-3.5 h-0.5 w-[220px] overflow-hidden bg-black/[0.14]">
            <span data-loader-bar className="block h-full w-0 bg-[#C36B3E]" />
          </div>
        </div>
      </div>

      {/* Progress rail */}
      <div className="pointer-events-none fixed right-0 top-0 z-[120] h-screen w-[3px]">
        <span ref={railFillRef} className="block w-full" style={{ height: 0, background: "linear-gradient(#C36B3E,#222D52,#D2B68A)" }} />
      </div>

      {/* HUD */}
      <div className="pointer-events-none fixed bottom-5 left-[22px] z-[120] hidden gap-[18px] font-mono-plex text-[10px] uppercase tracking-[0.2em] text-white mix-blend-difference sm:flex">
        <span>
          tokens <span ref={hudTokRef}>00/24</span>
        </span>
        <span ref={hudActRef}>Undesigned</span>
      </div>

      {/* Custom cursor */}
      <div ref={cursorRingRef} className="pointer-events-none fixed left-0 top-0 z-[190] h-[38px] w-[38px] rounded-full border-[1.5px] border-[#F2EBE0] opacity-0 mix-blend-difference" style={{ margin: "-19px 0 0 -19px" }} />
      <div ref={cursorDotRef} className="pointer-events-none fixed left-0 top-0 z-[191] h-2 w-2 rounded-full bg-[#C36B3E] opacity-0" style={{ margin: "-4px 0 0 -4px" }} />

      {/* Toast */}
      <div className="pointer-events-none fixed bottom-[34px] left-1/2 z-[150] -translate-x-1/2">
        <div ref={toastRef} className="rounded-full bg-[#211E18] px-[22px] py-3 font-mono-plex text-xs text-[#F2EBE0] opacity-0 shadow-[0_16px_40px_-12px_rgba(20,17,12,0.5)]" style={{ transform: "translateY(20px)" }}>
          Copied
        </div>
      </div>

      <main id="main">
        {landingProject && <GoogleFontsLoader fonts={[landingProject.fonts.primary]} />}

        {/* S0 — Product hero: what this is, and a working generator, both
            above the fold and above the scroll story. The story below is
            reframed as an optional deep-dive ("see how it's built"), not
            the thing a visitor has to get through first. */}
        <section data-reveal-group className="relative mx-auto flex min-h-[calc(100vh-56px)] max-w-[1040px] flex-col justify-center px-6 py-16 sm:px-12" style={{ background: "#F2EBE0", color: "#211E18" }}>
          <div data-reveal-item className="font-mono-plex text-xs uppercase tracking-[0.28em]" style={{ color: "#C36B3E" }}>
            StyleBook — AI design-system generator
          </div>
          <h1 data-reveal-item className="mt-[18px] max-w-[18ch] font-editorial-serif text-[clamp(38px,5.6vw,72px)] font-normal leading-[1.04] tracking-[-0.01em]">
            Describe your brand.
            <br />
            Get a complete design system.
          </h1>
          <p data-reveal-item className="mt-5 max-w-[54ch] text-[clamp(15px,1.3vw,18px)] leading-relaxed" style={{ color: "#6E675C" }}>
            Palette, typography, spacing and accessibility — generated in seconds, verified for real contrast (not
            just claimed), refined in Studio, exported anywhere.
          </p>

          <div data-reveal-item className="mt-9 max-w-[720px]">
            <LandingGeneratePanel
              theme="light"
              inputId="landing-ai-prompt-hero"
              prompt={landingPrompt}
              onPromptChange={setLandingPrompt}
              status={landingStatus}
              onGenerate={handleLandingGenerate}
              fellBack={landingFellBack}
              hasProject={Boolean(landingProject)}
              preview={landingPreview}
            />
          </div>

          <div data-reveal-item className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
            {landingProject && (
              <button
                type="button"
                onClick={openLandingResultInStudio}
                className="rounded-full px-6 py-3 text-sm font-semibold"
                style={{ background: "#211E18", color: "#F2EBE0" }}
              >
                Open &ldquo;{landingProject.name}&rdquo; in Studio →
              </button>
            )}
            <Link href="/browse/colors" className="text-sm font-semibold" style={{ color: "#211E18" }}>
              Browse the library →
            </Link>
            <Link href="/studio" className="text-sm font-semibold" style={{ color: "#211E18" }}>
              Open the Studio →
            </Link>
          </div>

          <a
            href="#story"
            className="pointer-events-auto absolute bottom-[30px] left-1/2 flex -translate-x-1/2 flex-col items-center gap-2.5 font-mono-plex text-[10px] uppercase tracking-[0.24em]"
            style={{ color: "#8A8477" }}
          >
            <span>See how it&apos;s built</span>
            <span className="sb-hint-el h-[26px] w-px" style={{ background: "#8A8477", animation: "sb-hint 1.8s ease-in-out infinite" }} />
          </a>
        </section>

        {/* S1 — Undesigned hero */}
        <section id="story" className="relative mx-auto flex min-h-[calc(100vh-56px)] max-w-[1160px] flex-col justify-center px-6 pb-[90px] pt-16 sm:px-12">
          <div className="relative z-[2]">
            <div data-hero-line className="mb-[30px] font-mono-plex text-xs uppercase tracking-[0.28em]" style={{ color: "var(--mut)" }}>
              stylebook — watch a page come to life
            </div>
            <h1 className="m-0 max-w-[17ch] text-[clamp(44px,7vw,108px)] font-normal leading-[1.02] tracking-[0.01em]" style={{ fontFamily: "var(--fd)", color: "var(--ink)" }}>
              <span data-hero-line className="block">
                This page has
              </span>
              <span data-hero-line className="block">
                no design system.
              </span>
            </h1>
            <p data-hero-line className="mt-[30px] max-w-[56ch] text-[clamp(16px,1.6vw,20px)] leading-relaxed" style={{ fontFamily: "var(--fb)", color: "var(--mut)" }}>
              No palette. No type scale. No rhythm. Its decisions live where every project&apos;s do — a tab for
              palettes, a tab for fonts, a tab for contrast checks, a brand PDF nobody opens. Scroll — and watch one
              living system replace them all.
            </p>
          </div>

          <div className="sb-float-el pointer-events-none absolute right-[6%] top-[22%] h-[120px] w-[220px] rounded-[var(--rad)] border-[1.5px] border-dashed" style={{ borderColor: "var(--edge)", animation: "sb-float 7s ease-in-out infinite" }}>
            <span className="absolute bottom-2 left-2.5 font-mono-plex text-[9.5px] tracking-[0.1em]" style={{ color: "var(--mut)" }}>
              img · 1200×600 — awaiting art
            </span>
          </div>
          <div className="sb-float-el pointer-events-none absolute bottom-[24%] right-[16%] h-[96px] w-[170px] rounded-[var(--rad)] border-[1.5px] border-dashed" style={{ borderColor: "var(--edge)", animation: "sb-float 8s ease-in-out .5s infinite" }}>
            <span className="absolute bottom-2 left-2.5 font-mono-plex text-[9.5px] tracking-[0.1em]" style={{ color: "var(--mut)" }}>
              card · 4:3 — no tokens yet
            </span>
          </div>
          <div className="sb-float-el pointer-events-none absolute left-[47%] top-[16%] border-b border-dashed pb-0.5 font-mono-plex text-[9.5px] tracking-[0.1em]" style={{ color: "var(--mut)", borderColor: "var(--edge)", animation: "sb-float 6s ease-in-out .8s infinite" }}>
            h1 — size: ??px
          </div>
          <div className="sb-float-el pointer-events-none absolute right-[22%] top-[33%] rounded-full border-[1.5px] border-dashed px-3 py-1.5 font-mono-plex text-[9.5px] tracking-[0.1em]" style={{ color: "var(--mut)", borderColor: "var(--edge)", animation: "sb-float 7.5s ease-in-out .3s infinite" }}>
            colours: tab 3 · fonts: tab 7 · contrast: tab 12
          </div>
          <div className="pointer-events-none absolute bottom-[30px] left-1/2 flex -translate-x-1/2 flex-col items-center gap-2.5 font-mono-plex text-[10px] uppercase tracking-[0.24em]" style={{ color: "var(--mut)" }}>
            <span>scroll to begin</span>
            <span className="sb-hint-el h-[26px] w-px" style={{ background: "var(--mut)", animation: "sb-hint 1.8s ease-in-out infinite" }} />
          </div>
        </section>

        {/* S2 — Act I: Colour */}
        <section data-act1 className="relative flex h-screen items-center justify-center overflow-hidden px-6 pb-[60px] pt-[100px] sm:px-12" style={{ background: "var(--bg)" }}>
          <div className="pointer-events-none absolute right-[3%] top-[5%] select-none text-[clamp(150px,20vw,320px)] leading-[0.8] opacity-55" style={{ fontFamily: "var(--fd)", color: "transparent", WebkitTextStroke: "1.4px var(--edge)" }}>
            01
          </div>
          <div className="grid w-full max-w-[1220px] items-center gap-[5vw] md:grid-cols-[1.1fr_1fr]">
            <div>
              <div className="mb-[18px] font-mono-plex text-[11px] uppercase tracking-[0.26em]" style={{ color: "var(--acc)" }}>
                Act I of V — colour arrives
              </div>
              <h2 className="m-0 text-[clamp(44px,6.4vw,100px)] font-normal leading-[0.98] tracking-[-0.01em]" style={{ fontFamily: "var(--fd)", color: "var(--ink)" }}>
                Colour<em className="not-italic" style={{ color: "var(--acc)" }}>.</em>
              </h2>
              <p className="mt-5 max-w-[40ch] text-[16.5px] leading-relaxed" style={{ fontFamily: "var(--fb)", color: "var(--mut)" }}>
                Greys give way to a hand-curated library of thousands of named, contrast-checked shades — browsed
                like a fan deck at your thumb, not hunted across tabs. Click a blade to copy its hex.
              </p>
              <div className="mt-[30px] flex flex-col gap-2.5 font-mono-plex text-[12.5px]" style={{ color: "var(--mut)" }}>
                <div data-tok1>
                  <span style={{ color: "var(--acc)" }}>✓</span> --color-primary: <span style={{ color: "var(--ink)" }}>#C36B3E</span>
                </div>
                <div data-tok1>
                  <span style={{ color: "var(--acc)" }}>✓</span> --color-ink: <span style={{ color: "var(--ink)" }}>#211E18</span>
                </div>
                <div data-tok1>
                  <span style={{ color: "var(--acc)" }}>✓</span> --color-surface: <span style={{ color: "var(--ink)" }}>#F2EBE0</span>
                </div>
                <div data-tok1>
                  <span style={{ color: "var(--acc)" }}>✓</span> --color-navy: <span style={{ color: "var(--ink)" }}>#222D52</span>
                </div>
                <div data-tok1>
                  <span style={{ color: "var(--acc)" }}>✓</span> 4 more shades bound…
                </div>
              </div>
            </div>
            <div className="relative h-[min(56vh,480px)]">
              <div className="absolute bottom-6 left-1/2 h-0 w-0">
                {SWATCHES.map((s, i) => (
                  <div
                    key={s.hex}
                    data-sw
                    data-hex={s.hex}
                    className="absolute bottom-0 left-[-54px] w-[108px] origin-[50%_116%] cursor-pointer rounded-t-xl rounded-b-lg shadow-[0_16px_34px_-16px_rgba(20,17,12,0.45)]"
                    style={{ height: "min(42vh,350px)", background: s.hex, zIndex: i }}
                  >
                    <div className="absolute inset-x-0 bottom-3 text-center" style={{ color: s.text }}>
                      <div className="text-[13.5px]" style={{ fontFamily: "var(--fd)" }}>
                        {s.name}
                      </div>
                      <div className="font-mono-plex text-[8.5px] tracking-[0.08em] opacity-85">{s.hex}</div>
                    </div>
                  </div>
                ))}
                <div className="absolute -bottom-3 -left-6 z-20 h-12 w-12 rounded-full shadow-[0_6px_16px_-6px_rgba(20,17,12,0.5)]" style={{ background: "var(--ink)" }}>
                  <span className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: "var(--panel)" }} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* S3 — Act II: Type */}
        <section data-act2 className="relative flex h-screen items-center justify-center overflow-hidden px-6 pb-[60px] pt-[100px] sm:px-12" style={{ background: "var(--panel)" }}>
          <div className="pointer-events-none absolute right-[2%] top-1/2 -translate-y-1/2 text-[clamp(220px,30vw,460px)] leading-[0.8] opacity-5" style={{ fontFamily: "var(--fd)", color: "var(--ink)" }}>
            Aa
          </div>
          <div
            data-basegrid
            className="pointer-events-none absolute inset-0 opacity-0"
            style={{ background: "repeating-linear-gradient(to bottom, transparent 0, transparent 27px, rgba(33,30,24,0.07) 27px, rgba(33,30,24,0.07) 28px)" }}
          />
          <div className="pointer-events-none absolute bottom-[5%] left-[3%] select-none text-[clamp(140px,18vw,290px)] leading-[0.8] opacity-55" style={{ fontFamily: "var(--fd)", color: "transparent", WebkitTextStroke: "1.4px var(--edge)" }}>
            02
          </div>
          <div className="relative w-full max-w-[1160px]">
            <div className="mb-[18px] font-mono-plex text-[11px] uppercase tracking-[0.26em]" style={{ color: "var(--acc)" }}>
              Act II of V — type finds its voice
            </div>
            <div className="flex flex-wrap items-baseline justify-between gap-6">
              <h2 className="m-0 text-[clamp(44px,6.4vw,100px)] font-normal leading-[0.98]" style={{ fontFamily: "var(--fd)", color: "var(--ink)" }}>
                Type<em className="not-italic" style={{ color: "var(--acc)" }}>.</em>
              </h2>
              <div ref={typeLabelRef} className="font-mono-plex text-xs uppercase tracking-[0.18em]" style={{ color: "var(--mut)" }}>
                Times New Roman — browser default
              </div>
            </div>
            <div data-typemorph className="mt-11 flex flex-col gap-[18px]" style={{ fontFamily: "var(--fd)", color: "var(--ink)" }}>
              <div data-trow-d className="leading-[1.05]">
                The quick brown fox — display
              </div>
              <div data-trow-h className="leading-[1.15]" style={{ color: "var(--acc2)" }}>
                Voices settle into a scale — heading
              </div>
              <div className="max-w-[64ch] text-[17px] leading-relaxed" style={{ color: "var(--mut)", fontFamily: "var(--fb)" }}>
                Body settles at seventeen pixels with generous leading, tuned for long reading. A modular scale
                binds every size to one ratio — nothing arbitrary survives.
              </div>
              <div data-trow-c className="uppercase tracking-[0.14em]" style={{ color: "var(--mut)", fontFamily: "var(--font-mono-plex),monospace" }}>
                caption · metadata · labels
              </div>
            </div>
            <div className="mt-10 flex flex-wrap gap-[26px] font-mono-plex text-[12.5px]" style={{ color: "var(--mut)" }}>
              <div data-tok2>
                <span style={{ color: "var(--acc)" }}>✓</span> --font-display: <span style={{ color: "var(--ink)" }}>Fraunces</span>
              </div>
              <div data-tok2>
                <span style={{ color: "var(--acc)" }}>✓</span> --font-body: <span style={{ color: "var(--ink)" }}>Archivo</span>
              </div>
              <div data-tok2>
                <span style={{ color: "var(--acc)" }}>✓</span> --scale-ratio: <span style={{ color: "var(--ink)" }}>1.333</span>
              </div>
              <div data-tok2>
                <span style={{ color: "var(--acc)" }}>✓</span> --leading: <span style={{ color: "var(--ink)" }}>1.6</span>
              </div>
            </div>
          </div>
        </section>

        {/* S4 — Act III: Rhythm */}
        <section data-act3 className="relative flex h-screen items-center justify-center overflow-hidden px-6 pb-[60px] pt-[100px] sm:px-12" style={{ background: "var(--bg)" }}>
          <div data-gridbg className="pointer-events-none absolute inset-0 opacity-0" style={{ backgroundImage: "radial-gradient(rgba(33,30,24,0.14) 1px,transparent 1px)", backgroundSize: "24px 24px" }} />
          <div className="pointer-events-none absolute right-[3%] top-[5%] select-none text-[clamp(140px,18vw,290px)] leading-[0.8] opacity-55" style={{ fontFamily: "var(--fd)", color: "transparent", WebkitTextStroke: "1.4px var(--edge)" }}>
            03
          </div>
          <div className="relative w-full max-w-[1160px]">
            <div className="mb-[18px] font-mono-plex text-[11px] uppercase tracking-[0.26em]" style={{ color: "var(--acc)" }}>
              Act III of V — rhythm breathes
            </div>
            <h2 className="mb-10 mt-0 text-[clamp(44px,6.4vw,100px)] font-normal leading-[0.98]" style={{ fontFamily: "var(--fd)", color: "var(--ink)" }}>
              Rhythm<em className="not-italic" style={{ color: "var(--acc)" }}>.</em>
            </h2>
            <div data-cards className="flex items-stretch gap-0.5">
              <div data-card className="flex-1 border" style={{ background: "var(--panel)", borderColor: "var(--edge)" }}>
                <div className="h-11 w-11 rounded-[calc(var(--rad)*0.7)]" style={{ background: "var(--acc)" }} />
                <div className="mt-4 text-xl" style={{ fontFamily: "var(--fd)", color: "var(--ink)" }}>
                  Space breathes
                </div>
                <div className="mt-1.5 text-[13.5px] leading-snug" style={{ fontFamily: "var(--fb)", color: "var(--mut)" }}>
                  Cramped boxes inhale — an 8-point rhythm spaces every element.
                </div>
              </div>
              <div data-card className="flex-1 border" style={{ background: "var(--panel)", borderColor: "var(--edge)" }}>
                <div className="flex gap-2">
                  <span className="h-11 flex-1 rounded-[calc(var(--rad)*0.7)]" style={{ background: "var(--acc2)" }} />
                  <span className="h-11 flex-1 rounded-[calc(var(--rad)*0.7)]" style={{ background: "#D2B68A" }} />
                </div>
                <div className="mt-4 text-xl" style={{ fontFamily: "var(--fd)", color: "var(--ink)" }}>
                  Corners soften
                </div>
                <div className="mt-1.5 text-[13.5px] leading-snug" style={{ fontFamily: "var(--fb)", color: "var(--mut)" }}>
                  Radii round in step — one token, every corner in agreement.
                </div>
              </div>
              <div data-card className="flex-1 border" style={{ background: "var(--panel)", borderColor: "var(--edge)" }}>
                <div className="h-11 w-11 rounded-[calc(var(--rad)*0.7)]" style={{ background: "#1F5C41" }} />
                <div className="mt-4 text-xl" style={{ fontFamily: "var(--fd)", color: "var(--ink)" }}>
                  Depth arrives
                </div>
                <div className="mt-1.5 text-[13.5px] leading-snug" style={{ fontFamily: "var(--fb)", color: "var(--mut)" }}>
                  Shadows bloom soft and wide — weightless, never smudged.
                </div>
              </div>
            </div>
            <div className="mt-10 flex flex-wrap gap-[26px] font-mono-plex text-[12.5px]" style={{ color: "var(--mut)" }}>
              <div data-tok3>
                <span style={{ color: "var(--acc)" }}>✓</span> --radius-md: <span style={{ color: "var(--ink)" }}>14px</span>
              </div>
              <div data-tok3>
                <span style={{ color: "var(--acc)" }}>✓</span> --space-unit: <span style={{ color: "var(--ink)" }}>8px</span>
              </div>
              <div data-tok3>
                <span style={{ color: "var(--acc)" }}>✓</span> --shadow-lg: <span style={{ color: "var(--ink)" }}>soft / wide</span>
              </div>
            </div>
          </div>
        </section>

        {/* S5 — Act IV: Theme bind */}
        <section data-act4 className="relative flex h-screen items-center justify-center overflow-hidden px-6 pb-[60px] pt-[100px] sm:px-12" style={{ background: "var(--panel)" }}>
          <div className="pointer-events-none absolute bottom-[5%] left-[3%] select-none text-[clamp(140px,18vw,290px)] leading-[0.8] opacity-55" style={{ fontFamily: "var(--fd)", color: "transparent", WebkitTextStroke: "1.4px var(--edge)" }}>
            04
          </div>
          <div className="grid w-full max-w-[1240px] items-center gap-[5vw] md:grid-cols-[0.9fr_1.1fr]">
            <div>
              <div className="mb-[18px] font-mono-plex text-[11px] uppercase tracking-[0.26em]" style={{ color: "var(--acc)" }}>
                Act IV of V — everything binds
              </div>
              <h2 className="m-0 text-[clamp(44px,6vw,92px)] font-normal leading-[0.98]" style={{ fontFamily: "var(--fd)", color: "var(--ink)" }}>
                One{" "}
                <span className="relative inline-block">
                  theme
                  <svg width="100%" height="14" viewBox="0 0 200 14" preserveAspectRatio="none" className="absolute -bottom-2 left-0">
                    <path ref={underlineRef} d="M4 9 C 60 13, 140 3, 196 8" stroke="#C36B3E" strokeWidth={5} fill="none" strokeLinecap="round" />
                  </svg>
                </span>
                <em className="not-italic" style={{ color: "var(--acc)" }}>
                  .
                </em>
              </h2>
              <p className="mt-[22px] max-w-[38ch] text-[16.5px] leading-relaxed" style={{ fontFamily: "var(--fb)", color: "var(--mut)" }}>
                Every token binds into a single edition — and a whole product assembles itself from the system.
                Nothing hand-placed. Nothing off-grid.
              </p>
              <div className="mt-7 flex flex-col gap-2.5 font-mono-plex text-[12.5px]" style={{ color: "var(--mut)" }}>
                <div>
                  <span style={{ color: "var(--acc)" }}>✓</span> theme: <span style={{ color: "var(--ink)" }}>Velvet Dusk</span>
                </div>
                <div>
                  <span style={{ color: "var(--acc)" }}>✓</span> 24 tokens bound · 0 overrides
                </div>
              </div>
            </div>
            <div style={{ perspective: "1100px" }}>
              <div data-frame className="overflow-hidden rounded-[18px] border shadow-[0_40px_90px_-40px_rgba(20,17,12,0.45)]" style={{ background: "#FBF6EC", borderColor: "var(--edge)" }}>
                <div className="flex items-center gap-1.5 border-b px-4 py-3" style={{ borderColor: "var(--edge)", background: "#F7F0E1" }}>
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#DDA69B" }} />
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#E4C15A" }} />
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#9DBFA5" }} />
                  <span className="ml-2.5 font-mono-plex text-[10px] tracking-[0.1em]" style={{ color: "#8A8477" }}>
                    aurelia.com — dressed by StyleBook
                  </span>
                </div>
                <div className="p-6">
                  <div data-piece className="flex items-center justify-between">
                    <span className="font-editorial-serif text-[19px] font-semibold" style={{ color: "#211E18" }}>
                      Aurelia
                    </span>
                    <span className="flex gap-3.5 font-mono-plex text-[9.5px] uppercase tracking-[0.14em]" style={{ color: "#8A8477" }}>
                      <span>Shop</span>
                      <span>Story</span>
                      <span>Journal</span>
                    </span>
                    <span className="rounded-xl px-4 py-2 text-xs" style={{ background: "#222D52", color: "#F2EBE0" }}>
                      Sign up
                    </span>
                  </div>
                  <div data-piece className="mt-6 font-editorial-serif text-[clamp(26px,2.6vw,40px)] leading-[1.05] tracking-[-0.02em]" style={{ color: "#211E18" }}>
                    Calm skin,
                    <br />
                    <em className="not-italic" style={{ color: "#C36B3E" }}>
                      quiet confidence
                    </em>
                    .
                  </div>
                  <div data-piece className="mt-[18px] flex gap-3">
                    <span className="rounded-xl px-5 py-2.5 text-[13.5px] font-semibold" style={{ background: "#C36B3E", color: "#FBF8F2" }}>
                      Shop the ritual
                    </span>
                    <span className="rounded-xl border px-4.5 py-2.5 text-[13.5px]" style={{ borderColor: "rgba(33,30,24,0.24)", color: "#211E18" }}>
                      Our story
                    </span>
                  </div>
                  <div className="mt-[22px] grid grid-cols-2 gap-3.5">
                    <div data-piece className="rounded-2xl border p-4" style={{ background: "#F2EBE0", borderColor: "rgba(33,30,24,0.1)" }}>
                      <div className="h-16 rounded-xl" style={{ background: "linear-gradient(140deg,#D2B68A,#C36B3E)" }} />
                      <div className="mt-2.5 font-editorial-serif text-[15px]" style={{ color: "#211E18" }}>
                        The Balm №4
                      </div>
                      <div className="mt-0.5 font-mono-plex text-[10px]" style={{ color: "#8A8477" }}>
                        $48
                      </div>
                    </div>
                    <div data-piece className="rounded-2xl border p-4" style={{ background: "#F2EBE0", borderColor: "rgba(33,30,24,0.1)" }}>
                      <div className="h-16 rounded-xl" style={{ background: "linear-gradient(140deg,#9DB8C9,#222D52)" }} />
                      <div className="mt-2.5 font-editorial-serif text-[15px]" style={{ color: "#211E18" }}>
                        Night Veil
                      </div>
                      <div className="mt-0.5 font-mono-plex text-[10px]" style={{ color: "#8A8477" }}>
                        $62
                      </div>
                    </div>
                  </div>
                  <div data-piece className="mt-5 flex items-center justify-between border-t pt-4 font-mono-plex text-[9.5px] uppercase tracking-[0.12em]" style={{ borderColor: "rgba(33,30,24,0.1)", color: "#8A8477" }}>
                    <span>© Aurelia</span>
                    <span>AA contrast · verified</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* S6 — Act V: Editions (horizontal) */}
        <section data-editions className="relative h-screen overflow-hidden" style={{ background: "var(--bg)" }}>
          <div ref={edTrackRef} className="flex h-full" style={{ width: "400vw" }}>
            {EDITIONS.map((ed) => (
              <div key={ed.name} className="flex h-full items-center justify-center gap-[5vw] px-[6vw] pb-20 pt-[120px]" style={{ flex: "0 0 100vw", background: ed.bg }}>
                <div className="max-w-[400px]" style={{ color: ed.ink }}>
                  <div className="font-mono-plex text-[11px] uppercase tracking-[0.24em]" style={{ color: ed.eyebrow }}>
                    {ed.label}
                  </div>
                  <h3 className="mt-3.5 font-editorial-serif text-[clamp(38px,4.6vw,64px)] font-normal leading-none tracking-[-0.02em]">{ed.name}</h3>
                  <p className="mt-4 max-w-[36ch] text-[15.5px] leading-relaxed" style={{ fontFamily: "var(--font-grotesk),sans-serif", opacity: 0.75 }}>
                    {ed.desc}
                  </p>
                  <div className="mt-[18px] flex gap-2">
                    {ed.dots.map((d, i) => (
                      <span key={i} className="h-[26px] w-[26px] rounded-[7px]" style={{ background: d }} />
                    ))}
                  </div>
                  <div className="mt-3 font-mono-plex text-[10px] uppercase tracking-[0.14em]" style={{ opacity: 0.6 }}>
                    {ed.fonts}
                  </div>
                </div>
                <div data-ed-visual className="w-[min(400px,34vw)] rounded-[18px] p-6 shadow-[0_30px_60px_-28px_rgba(0,0,0,0.5)]" style={{ background: ed.card.bg }}>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold" style={{ fontFamily: ed.card.head, color: ed.card.ink }}>
                      Aurelia
                    </span>
                    <span className="rounded-[11px] px-4 py-2 text-xs" style={{ background: ed.card.accent, color: ed.card.onAccent }}>
                      Sign up
                    </span>
                  </div>
                  <div className="mt-[18px] text-[26px] leading-[1.1]" style={{ fontFamily: ed.card.head, fontWeight: ed.card.head.includes("Fraunces") ? 400 : 600, color: ed.card.ink }}>
                    Calm skin, <span style={{ color: ed.card.italic }}>quiet confidence</span>.
                  </div>
                  <div className="mt-4 flex gap-2.5">
                    <span className="rounded-[11px] px-[18px] py-2.5 text-[13px] font-semibold" style={{ background: ed.card.accent, color: ed.card.onAccent }}>
                      Shop the ritual
                    </span>
                    <span className="rounded-[11px] border px-4 py-[9px] text-[13px]" style={{ borderColor: "rgba(0,0,0,0.24)", color: ed.card.ink }}>
                      Our story
                    </span>
                  </div>
                  <div className="mt-5 flex justify-between text-xs" style={{ color: ed.ink, opacity: 0.7 }}>
                    <span>Tokens applied</span>
                    <span style={{ color: ed.card.italic, fontWeight: 600 }}>24/24</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full" style={{ background: "rgba(0,0,0,0.1)" }}>
                    <span className="block h-full w-full rounded-full" style={{ background: ed.card.italic }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-6 flex items-center justify-center gap-3 font-mono-plex text-[10px] uppercase tracking-[0.2em]" style={{ color: "var(--mut)" }}>
            <span>
              Edition <span ref={edNumRef}>01</span> / 04
            </span>
            <span className="h-1 w-[140px] overflow-hidden rounded-full" style={{ background: "var(--edge)" }}>
              <span ref={edFillRef} className="block h-full" style={{ width: 0, background: "var(--acc)" }} />
            </span>
          </div>
        </section>

        {/* S7 — The shortcut */}
        <section data-ai data-reveal-group className="mx-auto max-w-[1220px] px-6 py-[130px]">
          <div className="relative overflow-hidden rounded-[36px] px-6 py-[90px] sm:px-12" style={{ background: "#222D52", color: "#F2EBE0" }}>
            <div className="pointer-events-none absolute -right-[8%] -top-[16%] h-[60%] w-1/2 rounded-full blur-3xl" style={{ background: "radial-gradient(circle,rgba(210,182,138,0.22),transparent 70%)" }} />
            <div className="relative mx-auto max-w-[980px]">
              <div data-reveal-item className="mb-10 flex flex-wrap items-center gap-6">
                <svg width="88" height="88" viewBox="0 0 100 100" className="sb-float-el block" style={{ animation: "sb-float 5.5s ease-in-out infinite", filter: "drop-shadow(0 12px 18px rgba(0,0,0,0.4))" }}>
                  <path d="M22 90 Q40 80 50 84 T80 88" stroke="#2E7D74" strokeWidth={7} fill="none" strokeLinecap="round" opacity={0.9} />
                  <path d="M40 60 L60 60 L57 79 Q50 86 43 79 Z" fill="#2E7D74" />
                  <rect x="37" y="49" width="26" height="13" rx="3" fill="#D2B68A" />
                  <path d="M37 12 Q50 6 63 12 L60 50 L40 50 Z" fill="#3A4A86" />
                  <circle cx="44" cy="30" r="6" fill="#F7F0E1" />
                  <circle cx="56" cy="30" r="6" fill="#F7F0E1" />
                  <circle cx="45" cy="31" r="3" fill="#211E18" />
                  <circle cx="57" cy="31" r="3" fill="#211E18" />
                  <path d="M45 39 q5 5 10 0" stroke="#211E18" strokeWidth={2.6} fill="none" strokeLinecap="round" />
                </svg>
                <div>
                  <div className="font-mono-plex text-[11px] uppercase tracking-[0.24em]" style={{ color: "#D2B68A" }}>
                    Three ways to build
                  </div>
                  <h2 className="mt-3 font-editorial-serif text-[clamp(34px,4.6vw,64px)] font-normal leading-none tracking-[-0.025em]">
                    Five acts for you.
                    <br />
                    <em className="not-italic" style={{ color: "#D2B68A" }}>
                      Five seconds for AI.
                    </em>
                  </h2>
                  <p className="mt-4 max-w-[44ch] text-[15.5px] leading-relaxed" style={{ color: "rgba(242,235,224,0.72)" }}>
                    Browse when you&apos;re exploring. Build in the Studio when you want every token in your hands.
                    Describe it when you want speed — three doors into the same living system.
                  </p>
                </div>
              </div>

              <div data-reveal-item className="mb-6 grid gap-3.5 sm:grid-cols-3">
                {DOORS.map((d) => (
                  <Link
                    key={d.href}
                    href={d.href}
                    className="block rounded-2xl border p-5"
                    style={{
                      background: d.highlight ? "rgba(210,182,138,0.12)" : "rgba(242,235,224,0.04)",
                      borderColor: d.highlight ? "rgba(210,182,138,0.42)" : "rgba(242,235,224,0.16)",
                      color: "#F2EBE0",
                    }}
                  >
                    <div className="font-mono-plex text-[9.5px] uppercase tracking-[0.18em]" style={{ color: d.highlight ? "#D2B68A" : "rgba(242,235,224,0.5)" }}>
                      {d.mode}
                    </div>
                    <div className="mt-2.5 font-editorial-serif text-xl">{d.title}</div>
                    <p className="mt-2 text-[13px] leading-snug" style={{ color: "rgba(242,235,224,0.7)" }}>
                      {d.body}
                    </p>
                    <div className="mt-3 font-mono-plex text-[10px] tracking-[0.14em]" style={{ color: "#D2B68A" }}>
                      {d.cta}
                    </div>
                  </Link>
                ))}
              </div>

              <LandingGeneratePanel
                theme="dark"
                inputId="landing-ai-prompt-panel"
                prompt={landingPrompt}
                onPromptChange={setLandingPrompt}
                status={landingStatus}
                onGenerate={handleLandingGenerate}
                fellBack={landingFellBack}
                hasProject={Boolean(landingProject)}
                preview={landingPreview}
                dataRevealItem
              />

              <div data-reveal-item className="mt-[26px]">
                <div className="mb-3 font-mono-plex text-[10px] uppercase tracking-[0.18em]" style={{ color: "rgba(242,235,224,0.55)" }}>
                  Then take it anywhere
                </div>
                <div className="flex flex-wrap gap-2">
                  {EXPORT_FORMATS.map((f) => (
                    <span key={f} className="rounded-full border px-3.5 py-[7px] font-mono-plex text-[11px]" style={{ borderColor: "rgba(242,235,224,0.22)", color: "rgba(242,235,224,0.85)" }}>
                      {f}
                    </span>
                  ))}
                </div>
              </div>

              <div data-reveal-item className="mt-[30px] flex flex-wrap gap-3.5">
                {/* Always the same button element (never swapped for a
                    <Link>) so the magnetic [data-pill] mousemove listener
                    attached once at mount keeps working after a live
                    generation changes its label/action. */}
                <button
                  type="button"
                  data-pill
                  onClick={openLandingResultInStudio}
                  className="rounded-full px-[30px] py-4 text-[15.5px] font-semibold"
                  style={{ background: "#F4EEE2", color: "#17141F" }}
                >
                  {landingProject ? `Open "${landingProject.name}" in Studio →` : "Try the AI atelier ✦"}
                </button>
                <Link href="/browse/themes" data-pill className="rounded-full border px-7 py-3.5 text-[15.5px]" style={{ borderColor: "rgba(244,238,226,0.4)", color: "#F4EEE2" }}>
                  Browse ready themes
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* S7 — Colophon */}
        <section data-colophon className="relative mx-auto max-w-[1180px] px-6 pb-[60px] pt-[120px] text-center sm:px-12">
          <div className="pointer-events-none absolute left-1/2 top-[32%] h-0 w-0">
            {["#C36B3E", "#D2B68A", "#222D52", "#1F5C41", "#E4C15A", "#CF4E86", "#6FB0DE", "#C36B3E", "#7A3B86", "#178C88", "#D2B68A", "#2455C6"].map((c, i) => (
              <span key={i} data-cel className="absolute h-3.5 w-3.5 rounded-full opacity-0" style={{ left: -7, top: -7, background: c }} />
            ))}
          </div>
          <div data-reveal>
            <div className="mb-[22px] font-mono-plex text-[11px] uppercase tracking-[0.26em]" style={{ color: "#8A8477" }}>
              24 / 24 tokens bound — fully dressed
            </div>
            <h2 className="m-0 text-balance font-editorial-serif text-[clamp(40px,6.6vw,96px)] font-normal leading-[0.98] tracking-[-0.03em]" style={{ color: "#211E18" }}>
              Every page you ship,
              <br />
              <em className="not-italic" style={{ color: "#C36B3E" }}>
                born designed.
              </em>
            </h2>
            <p className="mx-auto mt-6 max-w-[52ch] text-lg leading-relaxed" style={{ fontFamily: "var(--font-grotesk),sans-serif", color: "#555046" }}>
              Browse it from the library, build it token-by-token in the Studio, or generate it with AI — one
              living system, exported anywhere: CSS variables, JSON tokens, Tailwind, Figma, React, Flutter,
              SwiftUI.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-3.5">
              <Link href="/studio/ai" data-pill className="rounded-full px-8 py-4 text-base font-medium" style={{ background: "#222D52", color: "#F2EBE0" }}>
                Generate with AI ✦
              </Link>
              <Link href="/browse/colors" data-pill className="rounded-full border px-[30px] py-[15px] text-base" style={{ borderColor: "rgba(33,30,24,0.32)", color: "#211E18" }}>
                Browse the library
              </Link>
            </div>
            <div className="mt-7">
              <a href="#" data-replay className="border-b font-mono-plex text-[11px] uppercase tracking-[0.18em]" style={{ color: "#8A8477", borderColor: "rgba(33,30,24,0.25)" }}>
                Watch it come to life again ↺
              </a>
            </div>
          </div>

          <div className="mt-[70px] overflow-hidden border-y py-[22px]" style={{ borderColor: "rgba(33,30,24,0.12)" }}>
            <div className="sb-marquee-track flex w-max whitespace-nowrap font-mono-plex text-[13px] uppercase tracking-[0.14em]" style={{ color: "#8A8477", animation: "sb-marquee 36s linear infinite" }}>
              {[0, 1].map((k) => (
                <span key={k}>
                  CSS Variables&nbsp;·&nbsp;JSON Tokens&nbsp;·&nbsp;Tailwind Config&nbsp;·&nbsp;Figma Tokens&nbsp;·&nbsp;React Theme&nbsp;·&nbsp;Flutter Theme&nbsp;·&nbsp;SwiftUI Theme&nbsp;·&nbsp;Style Guide&nbsp;·&nbsp;
                </span>
              ))}
            </div>
          </div>

          <footer className="flex flex-wrap items-center justify-between gap-4 py-[26px] font-mono-plex text-[10px] uppercase tracking-[0.2em]" style={{ color: "#8A8477" }}>
            <span className="font-editorial-serif text-[17px] normal-case tracking-[-0.01em]" style={{ color: "#211E18" }}>
              StyleBook
            </span>
            <div className="flex gap-[22px]">
              <Link href="/browse/colors" style={{ color: "#8A8477" }}>
                Colours
              </Link>
              <Link href="/browse/fonts" style={{ color: "#8A8477" }}>
                Fonts
              </Link>
              <Link href="/browse/themes" style={{ color: "#8A8477" }}>
                Themes
              </Link>
              <Link href="/studio" style={{ color: "#8A8477" }}>
                Studio
              </Link>
              <Link href="/studio/ai" style={{ color: "#8A8477" }}>
                AI
              </Link>
            </div>
            <span>© {new Date().getFullYear()} StyleBook</span>
          </footer>
        </section>
      </main>
    </div>
  );
}

// Seed data — a small real sample so the app isn't empty before you run
// `npm run transform:colors`, which will overwrite this file with the full
// ~100-colour Tailwind set pulled straight from the tailwindcss package.
import { buildColor } from "@/lib/colors/colorUtils";
import { Color } from "@/types/color";

export const tailwindColors: Color[] = [
  buildColor({ id: "tw-blue-500", name: "Blue 500", hex: "#3b82f6", family: "blue", mood: ["cool"], style: ["modern"], collection: "tailwind", isPro: false, note: "A confident, trustworthy blue — the one that shows up in nearly every fintech and SaaS product for a reason." }),
  buildColor({ id: "tw-blue-700", name: "Blue 700", hex: "#1d4ed8", family: "blue", mood: ["moody", "cool"], style: ["bold"], collection: "tailwind", isPro: false, note: "Deeper and more serious than its 500 sibling — reads as authority rather than approachability." }),
  buildColor({ id: "tw-rose-500", name: "Rose 500", hex: "#f43f5e", family: "pink", mood: ["energetic"], style: ["bold"], collection: "tailwind", isPro: false, note: "Warm enough to feel friendly, sharp enough to demand attention — built for a call-to-action, not a background." }),
  buildColor({ id: "tw-emerald-500", name: "Emerald 500", hex: "#10b981", family: "green", mood: ["calm"], style: ["modern"], collection: "tailwind", isPro: false, note: "Fresh and growth-oriented without tipping into neon — the green of progress bars and 'success' states." }),
  buildColor({ id: "tw-amber-400", name: "Amber 400", hex: "#fbbf24", family: "orange", mood: ["warm", "energetic"], style: ["bold"], collection: "tailwind", isPro: false, note: "Sunlight in a hex code — optimistic and a little playful, best used sparingly as an accent." }),
  buildColor({ id: "tw-violet-600", name: "Violet 600", hex: "#7c3aed", family: "purple", mood: ["luxurious"], style: ["modern"], collection: "tailwind", isPro: true, note: "Sits right at the line between creative and premium — common in tools that want to feel a little more imaginative than corporate." }),
  buildColor({ id: "tw-slate-200", name: "Slate 200", hex: "#e2e8f0", family: "neutral", mood: ["calm"], style: ["minimal", "pastel"], collection: "tailwind", isPro: false, note: "A quiet, cool-toned background — does its best work when it's not the star of the page." }),
  buildColor({ id: "tw-slate-800", name: "Slate 800", hex: "#1e293b", family: "neutral", mood: ["moody"], style: ["bold"], collection: "tailwind", isPro: false, note: "Softer than true black, which is exactly why it's become the default 'dark mode' text and background color everywhere." }),
];

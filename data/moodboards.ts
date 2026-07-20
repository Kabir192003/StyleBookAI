/**
 * Curated moodboard image library for AI Generate.
 *
 * A small starter set using real photography already licensed and shipped
 * with this repo (public/landing/*.jpg — free-license Unsplash photos used
 * elsewhere on the site). Gemini picks 2-3 matching a brand description
 * rather than generating new images, which keeps this free and instant —
 * see docs/CONTEXT.md for why. Expand this list with more real photos
 * (tagged by mood) any time; nothing else needs to change.
 */
import { MoodboardImage } from "@/types/designTokens";

export const moodboardImages: MoodboardImage[] = [
  {
    id: "mb-blush",
    src: "/landing/mood-blush.jpg",
    alt: "Boho living room with blush velvet swivel chairs, tan leather sofa, macrame wall hanging, and a brass chandelier",
    mood: ["playful", "warm", "boho", "feminine", "eclectic"],
  },
  {
    id: "mb-pearl",
    src: "/landing/mood-pearl.jpg",
    alt: "All-white minimalist room with a pale wood table and chair, sheer curtains, and an arc floor lamp",
    mood: ["minimal", "calm", "airy", "neutral", "scandinavian"],
  },
  {
    id: "mb-warm",
    src: "/landing/mood-warm.jpg",
    alt: "Modern living room with a grey sofa, warm wood coffee table, leather ottomans, and a brass arc lamp against tall windows",
    mood: ["warm", "modern", "earthy", "cozy", "natural-light"],
  },
  {
    id: "mb-dusk",
    src: "/landing/editorial-dusk.jpg",
    alt: "Modern architectural house exterior at dusk with dark wood cladding, glass walls, and warm interior lighting",
    mood: ["moody", "dramatic", "architectural", "modern", "sophisticated"],
  },
  {
    id: "mb-preview",
    src: "/landing/preview-room.jpg",
    alt: "Sage green living room with an eclectic gallery wall, beige sectional sofa, and layered natural textures",
    mood: ["eclectic", "earthy", "boho", "layered", "natural"],
  },
];

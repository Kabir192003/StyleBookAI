// Hand-curated moodboard starter set — real, licensed photography shipped
// in public/landing/*.jpg. Same seed+generated pattern as colors and fonts.
import { MoodboardImage } from "@/types/designTokens";

export const moodboardSeed: MoodboardImage[] = [
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

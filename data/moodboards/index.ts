import { MoodboardImage } from "@/types/designTokens";
import { moodboardSeed } from "./seed";
import { unsplashMoodboardImages } from "./unsplash";

// Same pattern as data/colors/index.ts and data/fonts/index.ts.
export const moodboardImages: MoodboardImage[] = [...moodboardSeed, ...unsplashMoodboardImages];

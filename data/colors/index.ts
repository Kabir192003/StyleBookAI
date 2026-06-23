import { Color } from "@/types/color";
import { tailwindColors } from "./tailwind";
import { curatedColors } from "./curated";

// As more collections are added (material, pantone-inspired, seasonal,
// industry), import and spread them here.
export const allColors: Color[] = [...tailwindColors, ...curatedColors];

import { z } from "zod";

export const FavoriteItemSchema = z.object({
  itemType: z.enum(["color", "font", "theme"]),
  itemId: z.string().min(1),
});

/**
 * Assembles the final Figma payload from a live-canvas capture plus the
 * token variables.
 *
 * The page and component geometry come from `captureFromCanvas()` (the real
 * DOM); only `variables` is derived from the token data, because a Figma
 * Variable Collection is a *token* concept with no DOM equivalent — it's
 * what makes the imported file re-themeable rather than a flat snapshot.
 */
import type { StudioExportTokens } from "@/lib/studio/exportCode";
import { serializeVariables } from "./serializeVariables";
import type { CanvasCapture } from "./captureCanvas";
import type { FigmaExportPayload } from "./types";

export function buildFigmaPayload(s: StudioExportTokens, capture: CanvasCapture): FigmaExportPayload {
  return {
    schemaVersion: 2,
    meta: { name: s.name, generatedAt: new Date().toISOString() },
    variables: serializeVariables(s),
    componentLibrary: capture.componentLibrary,
    canvas: capture.canvas,
  };
}

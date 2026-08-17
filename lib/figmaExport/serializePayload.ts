import type { StudioExportTokens } from "@/lib/studio/exportCode";
import { serializeVariables } from "./serializeVariables";
import { serializeComponentLibrary } from "./serializeComponent";
import { serializeShowcaseCanvas } from "./serializeCanvas";
import type { FigmaExportPayload } from "./types";

export type FigmaExportOptions = { componentLibrary: boolean; canvas: boolean };

export function serializeFigmaExport(s: StudioExportTokens, options: FigmaExportOptions): FigmaExportPayload {
  const variables = serializeVariables(s);
  return {
    schemaVersion: 1,
    meta: { name: s.name, generatedAt: new Date().toISOString() },
    variables,
    componentLibrary: options.componentLibrary ? serializeComponentLibrary(s, variables) : undefined,
    canvas: options.canvas ? serializeShowcaseCanvas(s, variables) : undefined,
  };
}

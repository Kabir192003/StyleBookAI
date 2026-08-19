/**
 * Maps between the `projects` table row shape and the `Project` type.
 * `data` JSONB holds everything not already a column — see lib/db/schema.sql.
 *
 * Adding a field to `Project` is a four-place change, not one: `ProjectData`
 * is an explicit `Pick<>` allowlist and both directions copy field by field by
 * name, so a new field that types cleanly still vanishes on save with no
 * error. Update the `Pick<>`, `rowToProject`, `projectInputToRow`, and
 * `mergeProjectData` together.
 */
import { Project } from "@/types/project";
import { ProjectInput } from "@/lib/validation/project";

export type ProjectData = Pick<
  Project,
  | "colors"
  | "fonts"
  | "typeScale"
  | "spacing"
  | "shadows"
  | "cornerRadius"
  | "moodboard"
  | "designSystem"
  | "colorPrimitives"
  | "studioPaletteLinks"
  | "context"
  | "theme"
  | "aiReasoning"
>;

export type ProjectRow = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  data: ProjectData;
  ai_generated: boolean;
  ai_prompt: string | null;
  created_at: string;
  updated_at: string;
};

export function rowToProject(row: ProjectRow, userId: string): Project {
  return {
    id: row.id,
    userId,
    name: row.name,
    description: row.description ?? undefined,
    colors: row.data.colors,
    fonts: row.data.fonts,
    typeScale: row.data.typeScale,
    spacing: row.data.spacing,
    shadows: row.data.shadows,
    cornerRadius: row.data.cornerRadius,
    moodboard: row.data.moodboard,
    designSystem: row.data.designSystem,
    colorPrimitives: row.data.colorPrimitives,
    studioPaletteLinks: row.data.studioPaletteLinks,
    context: row.data.context,
    theme: row.data.theme,
    aiGenerated: row.ai_generated,
    aiPrompt: row.ai_prompt ?? undefined,
    aiReasoning: row.data.aiReasoning,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Folds a partial update (PUT /api/projects/[id]) into an existing row's
// `data`, keeping any key the caller didn't send. Lives here rather than in
// the route so it stays the same by-name allowlist as the two functions
// around it — a route-local shorter list previously dropped
// `colorPrimitives`/`studioPaletteLinks` silently on every update.
export function mergeProjectData(existing: ProjectData, patch: Partial<ProjectInput>): ProjectData {
  return {
    colors: patch.colors ?? existing.colors,
    fonts: patch.fonts ?? existing.fonts,
    typeScale: patch.typeScale ?? existing.typeScale,
    spacing: patch.spacing ?? existing.spacing,
    shadows: patch.shadows ?? existing.shadows,
    cornerRadius: patch.cornerRadius ?? existing.cornerRadius,
    moodboard: patch.moodboard ?? existing.moodboard,
    designSystem: patch.designSystem ?? existing.designSystem,
    colorPrimitives: patch.colorPrimitives ?? existing.colorPrimitives,
    studioPaletteLinks: patch.studioPaletteLinks ?? existing.studioPaletteLinks,
    context: patch.context ?? existing.context,
    theme: patch.theme ?? existing.theme,
    aiReasoning: patch.aiReasoning ?? existing.aiReasoning,
  };
}

export function projectInputToRow(input: ProjectInput) {
  const data: ProjectData = {
    colors: input.colors,
    fonts: input.fonts,
    typeScale: input.typeScale,
    spacing: input.spacing,
    shadows: input.shadows,
    cornerRadius: input.cornerRadius,
    moodboard: input.moodboard,
    designSystem: input.designSystem,
    colorPrimitives: input.colorPrimitives,
    studioPaletteLinks: input.studioPaletteLinks,
    context: input.context,
    theme: input.theme,
    aiReasoning: input.aiReasoning,
  };

  return {
    name: input.name,
    description: input.description ?? null,
    data,
    ai_generated: input.aiGenerated ?? false,
    ai_prompt: input.aiPrompt ?? null,
  };
}

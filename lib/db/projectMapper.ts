/**
 * Maps between the `projects` table row shape and the `Project` type.
 * `data` JSONB holds everything not already a column (colors, fonts,
 * typeScale, theme, aiReasoning) — see lib/db/schema.sql.
 */
import { Project } from "@/types/project";
import { ProjectInput } from "@/lib/validation/project";

type ProjectData = Pick<Project, "colors" | "fonts" | "typeScale" | "theme" | "aiReasoning">;

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

export function rowToProject(row: ProjectRow, clerkUserId: string): Project {
  return {
    id: row.id,
    userId: clerkUserId,
    name: row.name,
    description: row.description ?? undefined,
    colors: row.data.colors,
    fonts: row.data.fonts,
    typeScale: row.data.typeScale,
    theme: row.data.theme,
    aiGenerated: row.ai_generated,
    aiPrompt: row.ai_prompt ?? undefined,
    aiReasoning: row.data.aiReasoning,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function projectInputToRow(input: ProjectInput) {
  const data: ProjectData = {
    colors: input.colors,
    fonts: input.fonts,
    typeScale: input.typeScale,
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

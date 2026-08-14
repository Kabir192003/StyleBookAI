/**
 * /studio/ai — AI Generate
 *
 * Styled to match the AiGenerator.dc.html design pulled from
 * claude.ai/design (project "Website redesign request") — see
 * components/ai/PromptInput.tsx for the full implementation.
 */
import { PromptInput } from "@/components/ai/PromptInput";
import { StudioNav } from "@/components/studio/StudioNav";

export default function AIGeneratePage() {
  return (
    <>
      <StudioNav />
      <PromptInput />
    </>
  );
}

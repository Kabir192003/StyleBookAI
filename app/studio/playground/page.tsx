/**
 * /studio/playground — Design Playground
 *
 * A visual experimentation surface: several experiments side by side, each
 * one a different combination of colours and fonts drawn from the current
 * system, rendered on the same real, interactive components. Full spec and
 * batch plan in docs/DESIGN_PLAYGROUND.md.
 *
 * Nothing here touches the canonical token system — an experiment is an
 * override set, and only P4's explicit "Apply to design system" writes back.
 */
import { PlaygroundCanvas } from "@/components/playground/PlaygroundCanvas";
import { StudioNav } from "@/components/studio/StudioNav";

export default function PlaygroundPage() {
  return (
    <>
      <StudioNav />
      <PlaygroundCanvas />
    </>
  );
}

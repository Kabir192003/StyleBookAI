/**
 * /studio — Manual project builder
 *
 * Styled to match the Studio.dc.html design pulled from claude.ai/design
 * (project "Website redesign request") — see components/studio/StudioBuilder.tsx
 * for the full implementation.
 */
import { Suspense } from "react";
import { StudioBuilder } from "@/components/studio/StudioBuilder";

export default function StudioPage() {
  return (
    <Suspense fallback={null}>
      <StudioBuilder />
    </Suspense>
  );
}

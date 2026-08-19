import { Suspense } from "react";
import { StudioBuilder } from "@/components/studio/StudioBuilder";
import { StudioNav } from "@/components/studio/StudioNav";

export default function StudioPage() {
  return (
    <>
      <StudioNav />
      <Suspense fallback={null}>
        <StudioBuilder />
      </Suspense>
    </>
  );
}

// "Send to Studio" stages the selection via store/studioImportStore.ts and
// navigates to /studio, which consumes it once on mount.
import { PreviewLab } from "@/components/studio/PreviewLab";
import { StudioNav } from "@/components/studio/StudioNav";

export default function ComparePage() {
  return (
    <>
      <StudioNav />
      <main id="main" className="min-h-screen bg-neutral-50 p-8">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-neutral-500">Studio compare</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-neutral-900">Preview Lab</h1>
            <p className="mt-3 text-sm leading-7 text-neutral-600">
              Test palette mood, reorder swatches, and compare type choices in a single place before sending the system into the studio flow.
            </p>
          </div>
          <PreviewLab />
        </div>
      </main>
    </>
  );
}

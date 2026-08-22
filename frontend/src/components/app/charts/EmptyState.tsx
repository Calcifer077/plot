import { FileUp, Plus, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function EmptyState() {
  return (
    <div className="flex min-h-150 w-full">
      {/* Main canvas area */}
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
        <div className="flex size-20 items-center justify-center rounded-2xl bg-primary-container/15">
          <FileUp className="size-9 text-primary" strokeWidth={2} />
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="font-heading text-xl font-semibold text-on-surface">
            No Data to Visualize Yet
          </h2>
          <p className="max-w-md text-base text-on-surface-variant">
            To start building custom charts and deep-diving into your metrics,
            please upload an Excel or CSV file first.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button className="gap-2">
            <Plus className="size-4" />
            Upload Your First File
          </Button>
          <Button variant="outline">Try a Sample Dataset</Button>
        </div>
      </div>

      {/* Right config sidebar */}
      <div className="flex w-72 shrink-0 flex-col items-center justify-center gap-3 border-l border-border px-6 text-center">
        <SlidersHorizontal
          className="size-6 text-on-surface-variant/60"
          strokeWidth={2}
        />
        <p className="text-sm text-on-surface-variant/80">
          Configuration options will appear once data is loaded
        </p>
      </div>
    </div>
  );
}

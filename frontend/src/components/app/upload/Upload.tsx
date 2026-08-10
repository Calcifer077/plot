import { useState } from "react";
import {
  UploadCloud,
  FileSpreadsheet,
  FileText,
  X,
  Check,
  Circle,
  Sheet,
  Braces,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Upload() {
  const [dismissed, setDismissed] = useState(false);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm">
        <span className="text-on-surface-variant">›</span>
        <span className="font-semibold text-foreground">Upload</span>
      </nav>

      {/* Dropzone */}
      <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-outline-variant bg-surface-container-lowest px-8 py-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent">
          <UploadCloud className="h-6 w-6 text-primary" strokeWidth={2} />
        </div>

        <div>
          <p className="font-semibold text-foreground">
            Drag &amp; drop your file here
          </p>
          <p className="mt-1 text-sm text-on-surface-variant">
            Support for large datasets with up to 1M rows
          </p>
        </div>

        <div className="flex w-full max-w-xs items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs uppercase tracking-wide text-on-surface-variant">
            or
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <Button
          className="rounded-lg border-2 border-primary px-5 py-2 text-sm font-semibold text-primary hover:bg-accent"
          variant="outline"
          size="lg"
        >
          Browse Files
        </Button>

        <div className="mt-1 flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
            <FileText className="h-3.5 w-3.5" />
            .xlsx
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
            <Sheet className="h-3.5 w-3.5" />
            .csv
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
            <Braces className="h-3.5 w-3.5" />
            .json
          </span>
        </div>
      </div>

      {/* Active upload card */}
      {!dismissed && (
        <div className="rounded-2xl border border-border bg-surface-container-lowest p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary-container">
              <FileSpreadsheet
                className="h-5 w-5 text-on-secondary-container"
                strokeWidth={2}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">
                orders_2026.xlsx
              </p>
              <p className="text-xs text-on-surface-variant">
                4.4 MB · Preparing analysis
              </p>
            </div>
            <Button
              onClick={() => setDismissed(true)}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-on-surface-variant hover:bg-accent"
              aria-label="Dismiss upload"
              variant="ghost"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-4 flex items-center justify-between text-xs">
            <span className="font-semibold text-primary">65% Processed</span>
            <span className="text-on-surface-variant">
              Approx. 12s remaining
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full w-[65%] rounded-full bg-primary transition-all" />
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3">
            <StepStatus label="Uploaded" state="done" />
            <StepStatus label="Parsing sheets" state="done" />
            <StepStatus label="Profiling columns" state="pending" />
          </div>
        </div>
      )}
    </div>
  );
}

function StepStatus({
  label,
  state,
}: {
  label: string;
  state: "done" | "pending";
}) {
  return (
    <div className="flex items-center gap-2">
      {state === "done" ? (
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
          <Check className="h-3 w-3" strokeWidth={3} />
        </span>
      ) : (
        <Circle
          className="h-5 w-5 shrink-0 text-outline-variant"
          strokeWidth={2}
        />
      )}
      <span
        className={
          state === "done"
            ? "text-xs font-medium text-foreground"
            : "text-xs font-medium text-on-surface-variant"
        }
      >
        {label}
      </span>
    </div>
  );
}

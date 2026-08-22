import { useState, useRef } from "react";
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
import { Spinner } from "@/components/ui/spinner";
import { formatSize, getExtension } from "@/lib/utils";
import { toast } from "sonner";
import fetchWrapper from "@/lib/fetchWrapper";
import { useNavigate } from "@tanstack/react-router";
import useLocalStorage from "@/lib/hooks/useLocalStorage";

type FileStatus = "waiting" | "uploading" | "complete" | "error";

interface UploadFile {
  id: number;
  file: File;
  name: string;
  size: number;
  title: string;
  status: FileStatus;
  error?: string;
}

const MAX_SIZE_MB: number = 50;
const ALLOWED_EXTENSIONS = ["json", "csv"];

export default function Upload() {
  // const [dismissed, setDismissed] = useState(false);
  const [file, setFile] = useState<UploadFile | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [datasetId, setDatasetId] = useLocalStorage(
    "datasetId",
    "no-dataset-id",
  );

  const inputRef = useRef<HTMLInputElement>(null);

  // file info (will only be used when file is present)
  const [fileName, setFileName] = useState<string>("");
  const [fileSize, setFileSize] = useState<string>("");

  const navigate = useNavigate();

  function fileToUploadFile(file: File): UploadFile | null {
    const sizeOfFile = formatSize(file.size);
    const fileExtension = getExtension(file.name);

    setFileName(file.name);
    setFileSize(sizeOfFile);

    if (Number(sizeOfFile.split(" ")[0]) > MAX_SIZE_MB) {
      toast.error(`File size should be less than ${MAX_SIZE_MB} MB`);
      return null;
    }

    if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
      toast.error(`Only ${ALLOWED_EXTENSIONS.join(", ")} are allowed`);
      return null;
    }

    return {
      id: Date.now(),
      file,
      name: file.name,
      size: file.size,
      title: file.name,
      status: "waiting",
    };
  }

  function setSingleFile(newFile: File | null) {
    if (newFile) {
      setFile(fileToUploadFile(newFile));
    } else {
      setFile(null);
    }
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files.length > 0) {
      setSingleFile(e.dataTransfer.files[0]);
    }
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      setSingleFile(e.target.files[0]);
    }

    e.target.value = "";
  }

  function clearFile() {
    setSingleFile(null);
  }

  async function handleUpload(file: UploadFile) {
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("file", file.file);

    try {
      const result = await fetchWrapper<{
        fileName: string;
        content_type: string;
        redis_key: string;
      }>("dataset/upload", { body: formData });

      toast.success("file uploaded successfully.");

      setDatasetId(result.redis_key);

      navigate({
        to: "/data-overview/$datasetId",
        params: { datasetId: result.redis_key },
        search: { page: 1 },
      });
    } catch (err) {
      console.log(err);
      toast.error("Something went wrong while uploading file.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm">
        <span className="text-on-surface-variant">›</span>
        <span className="font-semibold text-foreground">Upload</span>
      </nav>

      {/* Dropzone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex flex-col items-center gap-4 rounded-2xl border-2 px-8 py-12 text-center transition-colors
    ${
      isDragging
        ? "bg-primary-container/10 border-solid border-primary"
        : "bg-surface-container-lowest border-dashed border-outline-variant hover:border-outline"
    }
    `}
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-container/15">
          <UploadCloud className="h-6 w-6 text-primary" strokeWidth={2} />
        </div>

        <div>
          <p className="font-heading font-semibold text-on-surface">
            Drag &amp; drop your file here
          </p>
          <p className="mt-1 text-sm text-on-surface-variant">
            Support for large datasets with up to 1M rows
          </p>
        </div>

        <div className="flex w-full max-w-xs items-center gap-3">
          <div className="h-px flex-1 bg-outline-variant" />
          <span className="text-xs uppercase tracking-wide text-on-surface-variant">
            or
          </span>
          <div className="h-px flex-1 bg-outline-variant" />
        </div>

        <Button
          className="rounded-lg border-2 border-primary px-5 py-2 text-sm font-semibold text-primary hover:bg-primary-container/10"
          variant="outline"
          size="lg"
          onClick={() => inputRef.current?.click()}
        >
          Browse Files
        </Button>

        <input
          ref={inputRef}
          id="file-upload-input"
          type="file"
          accept=".json,.csv"
          className="hidden"
          onChange={handleFileInputChange}
        />

        <div className="mt-1 flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full bg-primary-container/90 px-3 py-1 text-xs font-medium text-on-primary-container">
            <FileText className="h-3.5 w-3.5" />
            .xlsx
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-primary-container/90 px-3 py-1 text-xs font-medium text-on-primary-container">
            <Sheet className="h-3.5 w-3.5" />
            .csv
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-primary-container/90 px-3 py-1 text-xs font-medium text-on-primary-container">
            <Braces className="h-3.5 w-3.5" />
            .json
          </span>
        </div>
      </div>

      {file && (
        <div className="rounded-2xl border border-border bg-surface-container-lowest p-5">
          {/* File identity row */}
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary-container">
              <FileSpreadsheet
                className="h-5 w-5 text-on-secondary-container"
                strokeWidth={2}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">
                {fileName}
              </p>
              <p className="text-xs text-on-surface-variant">{fileSize}</p>
            </div>
            <Button
              onClick={clearFile}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-on-surface-variant hover:bg-accent"
              aria-label="Dismiss upload"
              variant="ghost"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-4 flex items-center justify-end gap-2 border-t border-border pt-4">
            <Button variant="ghost" onClick={clearFile} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              disabled={isSubmitting}
              onClick={() => {
                handleUpload(file);
              }}
            >
              {isSubmitting && <Spinner data-icon="inline-start" />}
              Upload
            </Button>
          </div>

          {/* Progress state — swap the footer above for this once upload starts */}
          {/* <div className="mt-4 flex items-center justify-between text-xs">
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
          </div> */}
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

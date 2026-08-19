import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getExtension(filename: string): string {
  const parts = filename.split(".");
  return parts[parts.length - 1]?.toLowerCase() ?? "";
}

export function formatSize(bytes: number | null): string {
  if (bytes === null) return "0 MB";

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function stripExtension(filename: string): string {
  const parts = filename.split(".");
  if (parts.length <= 1) return filename;
  parts.pop();
  return parts.join(".");
}

import { nanoid } from "nanoid";

import type { BrowserConversionTask, PluginMetadata } from "../conversion/types";

export interface FileRejection {
  file: File;
  reason: "unsupported-extension" | "directory" | "empty" | "unreadable";
}

export interface BrowserTaskCreationResult {
  tasks: BrowserConversionTask[];
  rejections: FileRejection[];
}

export interface DroppedFilesResult {
  files: File[];
  rejections: FileRejection[];
}

export function extensionOf(fileName: string): string {
  const lastSegment = fileName.split(/[\\/]/).pop() ?? fileName;
  const dotIndex = lastSegment.lastIndexOf(".");
  if (dotIndex <= 0 || dotIndex === lastSegment.length - 1) {
    return "";
  }
  return lastSegment.slice(dotIndex + 1).toLowerCase();
}

export function stemOf(fileName: string): string {
  const lastSegment = fileName.split(/[\\/]/).pop() ?? fileName;
  const dotIndex = lastSegment.lastIndexOf(".");
  if (dotIndex <= 0) {
    return lastSegment;
  }
  return lastSegment.slice(0, dotIndex);
}

export function createBrowserConversionTasks(
  files: File[],
  inputPluginInfos: Record<string, PluginMetadata>,
  currentInputFormat: string | null,
): BrowserTaskCreationResult {
  const tasks: BrowserConversionTask[] = [];
  const rejections: FileRejection[] = [];

  for (const file of files) {
    if (file.size === 0) {
      rejections.push({ file, reason: "empty" });
      continue;
    }
    const ext = extensionOf(file.name);
    const detectedInputFormat =
      Object.values(inputPluginInfos).find((info) =>
        info.suffixes.some((suffix) => suffix.toLowerCase() === ext),
      )?.identifier ?? currentInputFormat;

    if (!detectedInputFormat) {
      rejections.push({ file, reason: "unsupported-extension" });
      continue;
    }

    tasks.push({
      id: nanoid(),
      file,
      baseName: file.name,
      outputStem: stemOf(file.name),
      inputFormat: detectedInputFormat,
      running: false,
      success: null,
      error: null,
      warning: null,
    });
  }

  return { tasks, rejections };
}

export async function pickFiles(accept?: string): Promise<File[]> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    if (accept) {
      input.accept = accept;
    }
    input.onchange = () => resolve(Array.from(input.files ?? []));
    input.oncancel = () => resolve([]);
    input.click();
  });
}

export async function normalizeDroppedFiles(
  items: Iterable<DataTransferItem>,
): Promise<DroppedFilesResult> {
  const files: File[] = [];
  const rejections: FileRejection[] = [];

  for (const item of items) {
    if (item.kind !== "file") {
      continue;
    }
    const maybeEntry = "webkitGetAsEntry" in item ? item.webkitGetAsEntry() : null;
    const file = item.getAsFile();
    if (!file) {
      continue;
    }
    if (maybeEntry?.isDirectory) {
      rejections.push({ file, reason: "directory" });
      continue;
    }
    files.push(file);
  }

  return { files, rejections };
}

export function makeUniqueFileName(stem: string, extension: string, usedNames: Set<string>): string {
  const normalizedExtension = extension.startsWith(".") ? extension.slice(1) : extension;
  const suffix = normalizedExtension ? `.${normalizedExtension}` : "";
  let candidate = `${stem}${suffix}`;
  let index = 1;
  while (usedNames.has(candidate)) {
    candidate = `${stem} (${index})${suffix}`;
    index += 1;
  }
  usedNames.add(candidate);
  return candidate;
}

export function triggerDownload(data: BlobPart, fileName: string, mime = "application/octet-stream") {
  const blob = data instanceof Blob ? data : new Blob([data], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = "noopener";
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

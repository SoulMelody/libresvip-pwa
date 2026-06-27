export function stemOf(fileName: string): string {
  const lastSegment = fileName.split(/[\\/]/).pop() ?? fileName;
  const dotIndex = lastSegment.lastIndexOf(".");
  return dotIndex > 0 ? lastSegment.slice(0, dotIndex) : lastSegment;
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

import { describe, expect, it, vi } from "vitest";

import {
  createBrowserConversionTasks,
  extensionOf,
  makeUniqueFileName,
  normalizeDroppedFiles,
} from "./files";
import type { PluginMetadata } from "../conversion/types";

const inputPlugins: Record<string, PluginMetadata> = {
  ust: {
    identifier: "ust",
    category: "input",
    version: "1",
    fileFormat: "UTAU",
    suffixes: ["ust"],
    jsonSchema: {},
    defaultValue: {},
  },
  svip: {
    identifier: "svip",
    category: "input",
    version: "1",
    fileFormat: "SynthV",
    suffixes: ["svip", "svp"],
    jsonSchema: {},
    defaultValue: {},
  },
};

describe("platform file helpers", () => {
  it("extracts lower-case extensions from browser file names", () => {
    expect(extensionOf("Song.Project.SVIP")).toBe("svip");
    expect(extensionOf("README")).toBe("");
  });

  it("creates browser tasks from File objects and reports unsupported files", () => {
    const files = [
      new File(["a"], "demo.svip"),
      new File(["b"], "notes.txt"),
    ];

    const result = createBrowserConversionTasks(files, inputPlugins, null);

    expect(result.tasks).toHaveLength(1);
    expect(result.tasks[0]).toMatchObject({
      baseName: "demo.svip",
      outputStem: "demo",
      inputFormat: "svip",
      file: files[0],
      running: false,
      success: null,
    });
    expect(result.rejections).toEqual([
      { file: files[1], reason: "unsupported-extension" },
    ]);
  });

  it("uses the selected input format when extension detection fails", () => {
    const file = new File(["a"], "project.bin");
    const result = createBrowserConversionTasks([file], inputPlugins, "ust");

    expect(result.tasks).toHaveLength(1);
    expect(result.tasks[0].inputFormat).toBe("ust");
    expect(result.rejections).toEqual([]);
  });

  it("normalizes dropped files and skips directory-like entries", async () => {
    const file = new File(["a"], "song.ust");
    const item = {
      kind: "file",
      getAsFile: vi.fn(() => file),
      webkitGetAsEntry: vi.fn(() => ({ isDirectory: false })),
    } as unknown as DataTransferItem;
    const directory = {
      kind: "file",
      getAsFile: vi.fn(() => new File([], "folder")),
      webkitGetAsEntry: vi.fn(() => ({ isDirectory: true })),
    } as unknown as DataTransferItem;

    const normalized = await normalizeDroppedFiles([item, directory]);

    expect(normalized.files).toEqual([file]);
    expect(normalized.rejections).toHaveLength(1);
    expect(normalized.rejections[0].reason).toBe("directory");
  });

  it("generates unique download file names", () => {
    const used = new Set(["demo.svip", "demo (1).svip"]);

    expect(makeUniqueFileName("demo", "svip", used)).toBe("demo (2).svip");
  });
}
);

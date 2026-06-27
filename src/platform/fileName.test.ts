import { describe, expect, it } from "vitest";

import { makeUniqueFileName, stemOf } from "./fileName";

describe("file name helpers", () => {
  it("extracts stems from path-like file names", () => {
    expect(stemOf("C:/songs/demo.svip")).toBe("demo");
    expect(stemOf("archive.tar.gz")).toBe("archive.tar");
    expect(stemOf("README")).toBe("README");
  });

  it("generates unique names with normalized extensions", () => {
    const used = new Set(["demo.svip", "demo (1).svip"]);

    expect(makeUniqueFileName("demo", ".svip", used)).toBe("demo (2).svip");
    expect(used.has("demo (2).svip")).toBe(true);
  });
});

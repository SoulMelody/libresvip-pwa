import { describe, expect, it } from "vitest";

import { createConversionClient } from "./client";

describe("createConversionClient", () => {
  it("falls back to the mock client when worker support is unavailable", async () => {
    const client = createConversionClient();

    await expect(client.version()).resolves.toBe("mock");
  });
});

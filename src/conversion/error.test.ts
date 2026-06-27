import { describe, expect, it } from "vitest";

import { serializeError } from "./error";

describe("serializeError", () => {
  it("preserves standard Error details", () => {
    const error = new TypeError("bad input");

    expect(serializeError(error)).toMatchObject({
      name: "TypeError",
      message: "bad input",
      stack: expect.any(String),
    });
  });

  it("normalizes error-like objects and primitive values", () => {
    expect(serializeError({ message: "worker failed" })).toEqual({
      name: "Error",
      message: "worker failed",
      stack: undefined,
    });
    expect(serializeError("plain failure")).toEqual({
      name: "Error",
      message: "plain failure",
    });
  });
});

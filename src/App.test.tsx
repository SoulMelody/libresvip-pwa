// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { PluginInfosResponse } from "./conversion/types";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { changeLanguage: vi.fn(), language: "en_US" },
  }),
}));

vi.mock("./store/appStore", () => {
  const pluginInfos: PluginInfosResponse = {
    input: {
      ust: {
        identifier: "ust",
        category: "input",
        version: "1.0.0",
        name: "UTAU",
        fileFormat: "UTAU",
        suffixes: ["ust"],
        jsonSchema: {},
        defaultValue: {},
      },
    },
    output: {
      svip: {
        identifier: "svip",
        category: "output",
        version: "1.0.0",
        name: "SynthV",
        fileFormat: "SynthV",
        suffixes: ["svip"],
        jsonSchema: {},
        defaultValue: {},
      },
    },
    middleware: {},
  };

  return {
    conversionClient: {
      init: vi.fn().mockResolvedValue(undefined),
      version: vi.fn().mockResolvedValue("2.6.3"),
      pluginInfos: vi.fn().mockResolvedValue(pluginInfos),
      convert: vi.fn(),
    },
    useAppStore: () => ({
      actualTheme: "light",
      appVersion: "2.6.3",
      initialized: true,
      initializing: false,
      initError: null,
      language: "en_US",
      setActualTheme: vi.fn(),
      setLanguage: vi.fn(),
      initializeRuntime: vi.fn().mockResolvedValue(undefined),
    }),
  };
});

import App from "./App";

describe("App", () => {
  it("renders the browser conversion workspace and plugin formats", async () => {
    render(<App />);

    expect(screen.getByText("app.title")).toBeInTheDocument();
    expect(screen.getByText("converter.choose_files")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("converter.import_projects")).toBeInTheDocument();
    });
  });

  it("formats non-error rejection values into readable text", async () => {
    const { formatErrorMessage } = await import("./conversion/error");

    expect(formatErrorMessage({ name: "ConversionError", message: "boom" })).toContain(
      "ConversionError: boom",
    );
    expect(formatErrorMessage({ foo: "bar" })).toContain("\"foo\": \"bar\"");
  });
});

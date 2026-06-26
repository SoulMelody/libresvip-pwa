export type PluginCategory = "input" | "output" | "middleware";

export type ConversionMode = "direct" | "split" | "merge";

export type JsonObject = Record<string, unknown>;

export interface PluginMetadata {
  identifier: string;
  category: PluginCategory;
  name?: string;
  version: string;
  description?: string;
  author?: string;
  website?: string;
  fileFormat: string;
  suffixes: string[];
  iconBase64?: string;
  jsonSchema: JsonObject;
  uiSchema?: JsonObject;
  defaultValue: JsonObject;
}

export interface BrowserConversionTask {
  id: string;
  file: File;
  baseName: string;
  outputStem: string;
  inputFormat: string;
  running: boolean;
  success: boolean | null;
  error: string | null;
  warning: string | null;
  output?: BrowserConversionOutput;
}

export interface ConversionTaskInput {
  id: string;
  name: string;
  inputFormat: string;
  file: File;
}

export interface ConversionRequest {
  mode: ConversionMode;
  inputFormat: string;
  outputFormat: string;
  inputOptions: JsonObject;
  outputOptions: JsonObject;
  middlewareOptions: Record<string, JsonObject>;
  tasks: ConversionTaskInput[];
  maxTrackCount?: number;
  language?: string;
}

export interface BrowserConversionOutput {
  taskId: string;
  fileName: string;
  mime: string;
  data: ArrayBuffer;
  warnings: string[];
  url?: string;
}

export interface ConversionResult {
  outputs: BrowserConversionOutput[];
}

export type ConversionEvent =
  | { type: "task-started"; taskId: string }
  | { type: "task-warning"; taskId: string; warning: string }
  | { type: "task-completed"; taskId: string; output: BrowserConversionOutput }
  | { type: "task-failed"; taskId: string; error: SerializedError };

export type ConversionEventHandler = (event: ConversionEvent) => void;

export interface SerializedError {
  name: string;
  message: string;
  stack?: string;
  cause?: unknown;
}

export interface PluginInfosResponse {
  input: Record<string, PluginMetadata>;
  output: Record<string, PluginMetadata>;
  middleware: Record<string, PluginMetadata>;
}

export type WorkerRequest =
  | { id: number; type: "init"; force?: boolean }
  | { id: number; type: "version" }
  | { id: number; type: "pluginInfos"; language?: string }
  | { id: number; type: "convert"; request: WorkerConversionRequest };

export type WorkerRequestPayload = WorkerRequest extends infer T
  ? T extends { id: number }
    ? Omit<T, "id">
    : never
  : never;

export type WorkerConversionRequest = Omit<ConversionRequest, "tasks"> & {
  tasks: Array<{
    id: string;
    name: string;
    inputFormat: string;
    data: ArrayBuffer;
  }>;
};

export type WorkerResponse =
  | { id: number; type: "success"; value: unknown }
  | { id: number; type: "error"; error: SerializedError }
  | { id: number; type: "event"; event: ConversionEvent };

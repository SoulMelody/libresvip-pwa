import type {
  ConversionClient,
} from "./client";
import type {
  BrowserConversionOutput,
  ConversionEventHandler,
  ConversionRequest,
  ConversionResult,
  PluginInfosResponse,
} from "./types";

export class MockConversionClient implements ConversionClient {
  async init(): Promise<void> {
    return undefined;
  }

  async version(): Promise<string> {
    return "mock";
  }

  async pluginInfos(): Promise<PluginInfosResponse> {
    return {
      input: {},
      output: {},
      middleware: {},
    };
  }

  async convert(
    request: ConversionRequest,
    onEvent?: ConversionEventHandler,
  ): Promise<ConversionResult> {
    const outputs: BrowserConversionOutput[] = [];
    for (const task of request.tasks) {
      onEvent?.({ type: "task-started", taskId: task.id });
      onEvent?.({
        type: "task-warning",
        taskId: task.id,
        warning: "mock conversion only",
      });
      const outputName = `${task.name.replace(/\.[^.]*$/, "")}.${request.outputFormat}`;
      const output = {
        taskId: task.id,
        fileName: outputName,
        mime: "application/octet-stream",
        data: new TextEncoder().encode(`mock conversion: ${task.name}`).buffer,
        warnings: ["mock conversion only"],
      };
      outputs.push(output);
      onEvent?.({ type: "task-completed", taskId: task.id, output });
    }
    return { outputs };
  }
}

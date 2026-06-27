import type {
  ConversionEventHandler,
  ConversionRequest,
  ConversionResult,
  PluginInfosResponse,
  SerializedError,
  WorkerRequestPayload,
  WorkerRequest,
  WorkerResponse,
} from "./types";
import { MockConversionClient } from "./mockClient";
import { serializeError } from "./error";

export interface ConversionClient {
  init(options?: { force?: boolean }): Promise<void>;
  version(): Promise<string>;
  pluginInfos(language?: string): Promise<PluginInfosResponse>;
  convert(
    request: ConversionRequest,
    onEvent?: ConversionEventHandler,
  ): Promise<ConversionResult>;
}

interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
  onEvent?: ConversionEventHandler;
  timeoutId: number;
}

const DEFAULT_TIMEOUT_MS = 120_000;

export class PyodideWorkerClient implements ConversionClient {
  private worker: Worker | null = null;
  private nextId = 1;
  private readonly pending = new Map<number, PendingRequest>();
  private initPromise: Promise<void> | null = null;

  async init(options: { force?: boolean } = {}): Promise<void> {
    if (this.initPromise && !options.force) {
      return this.initPromise;
    }
    if (options.force) {
      this.disposeWorker();
    }
    this.ensureWorker();
    this.initPromise = this.send<void>({ type: "init", force: options.force });
    return this.initPromise;
  }

  async version(): Promise<string> {
    return this.send<string>({ type: "version" });
  }

  async pluginInfos(language?: string): Promise<PluginInfosResponse> {
    return this.send<PluginInfosResponse>({ type: "pluginInfos", language });
  }

  async convert(
    request: ConversionRequest,
    onEvent?: ConversionEventHandler,
  ): Promise<ConversionResult> {
    const workerRequest = {
      ...request,
      tasks: await Promise.all(
        request.tasks.map(async (task) => ({
          id: task.id,
          name: task.name,
          inputFormat: task.inputFormat,
          data: await task.file.arrayBuffer(),
        })),
      ),
    };
    const transfer = workerRequest.tasks.map((task) => task.data);
    return this.send<ConversionResult>(
      { type: "convert", request: workerRequest },
      onEvent,
      0,
      transfer,
    );
  }

  private ensureWorker(): Worker {
    if (!this.worker) {
      this.worker = new Worker(new URL("../workers/conversion.worker.ts", import.meta.url), {
        type: "module",
      });
      this.worker.onmessage = (event: MessageEvent<WorkerResponse>) =>
        this.handleMessage(event.data);
      this.worker.onerror = (event) => {
        const error = serializeError(event.error ?? event.message);
        for (const request of this.pending.values()) {
          window.clearTimeout(request.timeoutId);
          request.reject(error);
        }
        this.pending.clear();
      };
    }
    return this.worker;
  }

  private send<T>(
    message: WorkerRequestPayload,
    onEvent?: ConversionEventHandler,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    transfer?: Transferable[],
  ): Promise<T> {
    const worker = this.ensureWorker();
    const id = this.nextId++;
    const payload = { ...message, id } as WorkerRequest;
    return new Promise<T>((resolve, reject) => {
      const timeoutId =
        timeoutMs > 0
          ? window.setTimeout(() => {
              this.pending.delete(id);
              reject({
                name: "TimeoutError",
                message: `Conversion worker request ${message.type} timed out.`,
              } satisfies SerializedError);
            }, timeoutMs)
          : 0;
      this.pending.set(id, {
        resolve: resolve as (value: unknown) => void,
        reject,
        onEvent,
        timeoutId,
      });
      worker.postMessage(payload, transfer ?? []);
    });
  }

  private handleMessage(message: WorkerResponse): void {
    const pending = this.pending.get(message.id);
    if (!pending) {
      return;
    }
    if (message.type === "event") {
      pending.onEvent?.(message.event);
      return;
    }
    this.pending.delete(message.id);
    window.clearTimeout(pending.timeoutId);
    if (message.type === "success") {
      pending.resolve(message.value);
    } else {
      pending.reject(message.error);
    }
  }

  private disposeWorker(): void {
    this.worker?.terminate();
    this.worker = null;
    this.initPromise = null;
    for (const pending of this.pending.values()) {
      window.clearTimeout(pending.timeoutId);
      pending.reject({
        name: "AbortError",
        message: "Conversion worker was restarted.",
      } satisfies SerializedError);
    }
    this.pending.clear();
  }
}

export const createConversionClient = (): ConversionClient =>
  import.meta.env.MODE === "test" ||
  typeof window === "undefined" ||
  typeof Worker === "undefined"
    ? new MockConversionClient()
    : new PyodideWorkerClient();

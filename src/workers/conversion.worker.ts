import libresvipWheel from "../assets/libresvip-2.7.3-py3-none-any.whl";
import pycryptodomexWheel from "../assets/pycryptodomex-3.23.0-cp37-abi3-pyemscripten_2026_0_wasm32.whl";
import wanakanaWheel from "../assets/wanakana_python-1.2.2-py3-none-any.whl";
import type {
  ConversionEvent,
  ConversionResult,
  PluginInfosResponse,
  SerializedError,
  WorkerConversionRequest,
  WorkerRequest,
  WorkerResponse,
} from "../conversion/types";
import { serializeError } from "../conversion/error";
import { makeUniqueFileName, stemOf } from "../platform/fileName";

declare const self: {
  onmessage: ((event: MessageEvent<WorkerRequest>) => void) | null;
  postMessage(message: WorkerResponse, transfer?: Transferable[]): void;
};

interface PyodideApi {
  loadPackage(packages: string | string[]): Promise<void>;
  runPythonAsync<T = unknown>(code: string): Promise<T>;
  FS: {
    mkdirTree(path: string): void;
    writeFile(path: string, data: Uint8Array): void;
    readFile(path: string): Uint8Array;
    readdir(path: string): string[];
    unlink(path: string): void;
    rmdir(path: string): void;
  };
}

interface LoadPyodideOptions {
  indexURL: string;
}

declare global {
  function loadPyodide(options: LoadPyodideOptions): Promise<PyodideApi>;
}

const PYODIDE_INDEX_URL = "https://testingcf.jsdelivr.net/pyodide/v314.0.0/full/";
const PYODIDE_MODULE_URL = `${PYODIDE_INDEX_URL}pyodide.mjs`;
const WORKER_ORIGIN = typeof location !== "undefined" ? location.origin : "http://localhost:5173";
const WHEEL_STAGE_DIR = "/tmp/libresvip-pwa/wheels";
const WHEELS = [
  {
    fileName: "libresvip-2.7.3-py3-none-any.whl",
    url: sameOriginUrl(libresvipWheel, WORKER_ORIGIN),
  },
  {
    fileName: "pycryptodomex-3.23.0-cp37-abi3-pyemscripten_2026_0_wasm32.whl",
    url: sameOriginUrl(pycryptodomexWheel, WORKER_ORIGIN),
  },
  {
    fileName: "wanakana_python-1.2.2-py3-none-any.whl",
    url: sameOriginUrl(wanakanaWheel, WORKER_ORIGIN),
  },
] as const;

let initPromise: Promise<PyodideApi> | null = null;
let initError: SerializedError | null = null;

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  void handleRequest(event.data);
};

async function handleRequest(message: WorkerRequest): Promise<void> {
  try {
    switch (message.type) {
      case "init":
        if (message.force) {
          initPromise = null;
          initError = null;
        }
        await initialize();
        postSuccess(message.id, undefined);
        break;
      case "version":
        postSuccess(message.id, await version());
        break;
      case "pluginInfos":
        postSuccess(message.id, await pluginInfos(message.language ?? "en_US"));
        break;
      case "convert":
        postSuccess(message.id, await convert(message.id, message.request));
        break;
    }
  } catch (error) {
    postError(message.id, error);
  }
}

async function initialize(): Promise<PyodideApi> {
  if (initPromise) {
    return initPromise;
  }
  initPromise = initializePyodide().catch((error) => {
    initError = serializeError(error);
    throw initError;
  });
  return initPromise;
}

async function initializePyodide(): Promise<PyodideApi> {
  const { loadPyodide } = (await import(/* @vite-ignore */ PYODIDE_MODULE_URL)) as {
    loadPyodide: (options: LoadPyodideOptions) => Promise<PyodideApi>;
  };
  const pyodide = await loadPyodide({ indexURL: PYODIDE_INDEX_URL });
  await pyodide.loadPackage(["micropip", "lxml", "ujson"]);
  const wheelUris = await stageWheelAssets(pyodide);
  await pyodide.runPythonAsync(`
import micropip
await micropip.install(${JSON.stringify([...wheelUris, "pyzipper", "yaml-rs"])}, keep_going=True)
`);
  return pyodide;
}

async function version(): Promise<string> {
  const pyodide = await initializedPyodide();
  return pyodide.runPythonAsync<string>(`
import importlib.metadata
importlib.metadata.version("libresvip")
`);
}

async function pluginInfos(language: string): Promise<PluginInfosResponse> {
  const pyodide = await initializedPyodide();
  const raw = await pyodide.runPythonAsync<string>(`
import enum
import gettext
from functools import partial
from typing import get_args, get_type_hints

from libresvip.core.compat import json
from libresvip.extension.base import ReadOnlyConverterMixin, WriteOnlyConverterMixin
from libresvip.extension.manager import get_translation, middleware_manager, plugin_manager
from pydantic._internal._core_utils import CoreSchemaOrField
from pydantic.json_schema import GenerateJsonSchema, JsonSchemaValue
from typing_extensions import override

language = ${JSON.stringify(language)}
translator = get_translation(language)

class GettextGenerateJsonSchema(GenerateJsonSchema):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.translator = translator

    @override
    def generate_inner(self, schema: CoreSchemaOrField) -> JsonSchemaValue:
        json_schema = super().generate_inner(schema)
        if "title" in json_schema:
            json_schema["title"] = self.translator.gettext(json_schema["title"])
        if "description" in json_schema:
            json_schema["description"] = self.translator.gettext(json_schema["description"])
        return json_schema

def option_schema(option_cls):
    json_schema = option_cls.model_json_schema(schema_generator=GettextGenerateJsonSchema)
    json_schema.pop("title", None)
    if "properties" in json_schema:
        json_schema["required"] = list(json_schema["properties"].keys())
    ui_schema = {"ui:submitButtonOptions": {"norender": True}}
    for field_name, field_info in option_cls.model_fields.items():
        annotation = field_info.annotation
        if isinstance(annotation, type) and issubclass(annotation, enum.Enum):
            enum_names = []
            type_hints = get_type_hints(annotation, include_extras=True)
            annotations = None
            if "_value_" in type_hints:
                value_args = get_args(type_hints["_value_"])
                if len(value_args) >= 2:
                    model = value_args[1]
                    if hasattr(model, "model_fields"):
                        annotations = model.model_fields
            if annotations is None:
                continue
            for enum_item in annotation:
                if enum_item.name in annotations:
                    enum_field = annotations[enum_item.name]
                    enum_names.append(translator.gettext(enum_field.title))
            ui_schema[field_name] = {"ui:enumNames": enum_names}
    return json_schema, ui_schema, option_cls().model_dump(mode="json")

def serialize_plugin(identifier, plugin, category):
    if category == "input":
        option_cls = plugin.input_option_cls
    elif category == "output":
        option_cls = plugin.output_option_cls
    else:
        option_cls = plugin.process_option_cls
    json_schema, ui_schema, default_value = option_schema(option_cls)
    info = {
        "identifier": identifier,
        "category": category,
        "name": translator.gettext(plugin.info.name),
        "version": str(plugin.version),
        "description": translator.gettext(plugin.info.description) if plugin.info.description else "",
    "author": translator.gettext(plugin.info.author) if plugin.info.author else "",
    "website": plugin.info.website or "",
    "fileFormat": translator.gettext(plugin.info.file_format) if hasattr(plugin.info, "file_format") else translator.gettext(plugin.info.name),
    "suffixes": list(getattr(plugin.info, "suffixes", None) or [getattr(plugin.info, "suffix", "")]),
    "iconBase64": getattr(plugin.info, "icon_base64", None) or "",
    "jsonSchema": json_schema,
    "uiSchema": ui_schema,
    "defaultValue": default_value,
  }
    return info

plugins = plugin_manager.plugins.get("svs", {})
middlewares = middleware_manager.plugins.get("middleware", {})
payload = {
    "input": {
        identifier: serialize_plugin(identifier, plugin, "input")
        for identifier, plugin in plugins.items()
        if not issubclass(plugin, WriteOnlyConverterMixin)
    },
    "output": {
        identifier: serialize_plugin(identifier, plugin, "output")
        for identifier, plugin in plugins.items()
        if not issubclass(plugin, ReadOnlyConverterMixin)
    },
    "middleware": {
        identifier: serialize_plugin(identifier, plugin, "middleware")
        for identifier, plugin in middlewares.items()
    },
}
json.dumps(payload)
`);
  return JSON.parse(raw) as PluginInfosResponse;
}

async function convert(requestId: number, request: WorkerConversionRequest): Promise<ConversionResult> {
  const pyodide = await initializedPyodide();
  const outputs = [];
  const usedNames = new Set<string>();

  for (const task of request.tasks) {
    postEvent(requestId, { type: "task-started", taskId: task.id });
    const workDir = `/tmp/libresvip-pwa/${task.id}`;
    const inputPath = `${workDir}/${sanitizePathSegment(task.name)}`;
    const outputName = makeUniqueFileName(
      stemOf(task.name),
      request.outputFormat,
      usedNames,
    );
    const outputPath = `${workDir}/${outputName}`;
    try {
      pyodide.FS.mkdirTree(workDir);
      pyodide.FS.writeFile(inputPath, new Uint8Array(task.data));
      const raw = await pyodide.runPythonAsync<string>(`
import traceback
from pathlib import Path

from libresvip.core.compat import json
from libresvip.core.warning_types import CatchWarnings
from libresvip.extension.manager import middleware_manager, plugin_manager

input_format = ${JSON.stringify(task.inputFormat)}
output_format = ${JSON.stringify(request.outputFormat)}
input_path = Path(${JSON.stringify(inputPath)})
output_path = Path(${JSON.stringify(outputPath)})
input_options = json.loads(${pythonJsonLiteral(request.inputOptions)})
output_options = json.loads(${pythonJsonLiteral(request.outputOptions)})
middleware_options = json.loads(${pythonJsonLiteral(request.middlewareOptions)})

try:
    warnings = []
    input_plugin = plugin_manager.plugins.get("svs", {})[input_format]
    output_plugin = plugin_manager.plugins.get("svs", {})[output_format]
    with CatchWarnings() as w:
        project = input_plugin.load(input_path, input_options)
    if w.output:
        warnings.append(w.output)
    for middleware_id, options in middleware_options.items():
        middleware = middleware_manager.plugins.get("middleware", {}).get(middleware_id)
        if middleware:
            with CatchWarnings() as w:
                project = middleware.process(project, options)
            if w.output:
                warnings.append(w.output)
    with CatchWarnings() as w:
        output_plugin.dump(output_path, project, output_options)
    if w.output:
        warnings.append(w.output)
    result = {"ok": True, "warnings": warnings}
except Exception:
    result = {"ok": False, "error": traceback.format_exc()}
json.dumps(result)
`);
      const converted = JSON.parse(raw) as
        | { ok: true; warnings: string[] }
        | { ok: false; error: string };
      if (!converted.ok) {
        postEvent(requestId, {
          type: "task-failed",
          taskId: task.id,
          error: { name: "ConversionError", message: converted.error },
        });
        continue;
      }
      for (const warning of converted.warnings) {
        postEvent(requestId, { type: "task-warning", taskId: task.id, warning });
      }
      const data = pyodide.FS.readFile(outputPath);
      const arrayBuffer = new Uint8Array(data).buffer;
      const output = {
        taskId: task.id,
        fileName: outputName,
        mime: "application/octet-stream",
        data: arrayBuffer,
        warnings: converted.warnings,
      };
      outputs.push(output);
      postEvent(requestId, { type: "task-completed", taskId: task.id, output });
    } catch (error) {
      postEvent(requestId, {
        type: "task-failed",
        taskId: task.id,
        error: serializeError(error),
      });
    } finally {
      cleanup(pyodide, workDir);
    }
  }

  return { outputs };
}

async function initializedPyodide(): Promise<PyodideApi> {
  if (initError) {
    throw initError;
  }
  return initialize();
}

function postSuccess(id: number, value: unknown): void {
  self.postMessage({ id, type: "success", value } satisfies WorkerResponse);
}

function postError(id: number, error: unknown): void {
  self.postMessage({ id, type: "error", error: serializeError(error) } satisfies WorkerResponse);
}

function postEvent(id: number, event: ConversionEvent): void {
  self.postMessage({ id, type: "event", event } satisfies WorkerResponse);
}

function sanitizePathSegment(value: string): string {
  return value.replace(/[\\/:*?"<>|]/g, "_");
}

function cleanup(pyodide: PyodideApi, path: string): void {
  try {
    for (const name of pyodide.FS.readdir(path)) {
      if (name === "." || name === "..") {
        continue;
      }
      const childPath = `${path}/${name}`;
      try {
        pyodide.FS.unlink(childPath);
      } catch {
        cleanup(pyodide, childPath);
      }
    }
    pyodide.FS.rmdir(path);
  } catch {
    // Best-effort MEMFS cleanup must not mask conversion errors.
  }
}

async function stageWheelAssets(pyodide: PyodideApi): Promise<string[]> {
  const wheels = await Promise.all(
    WHEELS.map(async (wheel) => {
      const response = await fetch(wheel.url);
      if (!response.ok) {
        throw new Error(`Failed to fetch wheel ${wheel.fileName}: ${response.status} ${response.statusText}`);
      }
      return {
        fileName: wheel.fileName,
        data: new Uint8Array(await response.arrayBuffer()),
      };
    }),
  );
  pyodide.FS.mkdirTree(WHEEL_STAGE_DIR);
  const wheelUris: string[] = [];
  for (const wheel of wheels) {
    const stagedPath = `${WHEEL_STAGE_DIR}/${wheel.fileName}`;
    pyodide.FS.writeFile(stagedPath, wheel.data);
    wheelUris.push(`emfs:${stagedPath}`);
  }
  return wheelUris;
}

function sameOriginUrl(assetUrl: string, origin: string): string {
  const resolved = new URL(assetUrl, origin);
  return new URL(`${resolved.pathname}${resolved.search}${resolved.hash}`, origin).href;
}

function pythonJsonLiteral(value: unknown): string {
  return JSON.stringify(JSON.stringify(value));
}

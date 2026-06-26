(function(){"use strict";var O="/libresvip-pwa/assets/libresvip-2.7.1-py3-none-any-CJTgqjlR.whl",E="/libresvip-pwa/assets/pycryptodomex-3.23.0-cp37-abi3-pyemscripten_2026_0_wasm32-DwtLqEG0.whl",N="/libresvip-pwa/assets/wanakana_python-1.2.2-py3-none-any-mmo05MrR.whl";function y(t,n,e){const i=t&&t!=="Error"?`${t}: ${n}`:n;return e?`${i}
${e}`:i}function P(t){if(typeof t=="string")return t;if(t instanceof Error)return y(t.name,t.message,t.stack);if(t&&typeof t=="object"){const n=t,e=typeof n.name=="string"?n.name:"Error",i=typeof n.message=="string"?n.message:"",a=typeof n.stack=="string"?n.stack:void 0;if(i)return y(e,i,a);try{return JSON.stringify(t,null,2)}catch{return String(t)}}return String(t)}const w="https://testingcf.jsdelivr.net/pyodide/v314.0.0/full/",F=`${w}pyodide.mjs`,m=typeof location<"u"?location.origin:"http://localhost:5173",v="/tmp/libresvip-pwa/wheels",J=[{fileName:"libresvip-2.7.1-py3-none-any.whl",url:g(O,m)},{fileName:"pycryptodomex-3.23.0-cp37-abi3-pyemscripten_2026_0_wasm32.whl",url:g(E,m)},{fileName:"wanakana_python-1.2.2-py3-none-any.whl",url:g(N,m)}];let s=null,r=null;self.onmessage=t=>{R(t.data)};async function R(t){try{switch(t.type){case"init":t.force&&(s=null,r=null),await k(),p(t.id,void 0);break;case"version":p(t.id,await U());break;case"pluginInfos":p(t.id,await C(t.language??"en_US"));break;case"convert":p(t.id,await I(t.id,t.request));break}}catch(n){z(t.id,n)}}async function k(){return s||(s=W().catch(t=>{throw r=d(t),r}),s)}async function W(){const{loadPyodide:t}=await import(F),n=await t({indexURL:w});await n.loadPackage(["micropip","lxml","ujson"]);const e=await D(n);return await n.runPythonAsync(`
import micropip
await micropip.install(${JSON.stringify([...e,"pyzipper","yaml-rs"])}, keep_going=True)
`),n}async function U(){return(await f()).runPythonAsync(`
import importlib.metadata
importlib.metadata.version("libresvip")
`)}async function C(t){const e=await(await f()).runPythonAsync(`
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

language = ${JSON.stringify(t)}
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
`);return JSON.parse(e)}async function I(t,n){const e=await f(),i=[],a=new Set;for(const o of n.tasks){l(t,{type:"task-started",taskId:o.id});const u=`/tmp/libresvip-pwa/${o.id}`,S=`${u}/${L(o.name)}`,j=A(M(o.name),n.outputFormat,a),$=`${u}/${j}`;try{e.FS.mkdirTree(u),e.FS.writeFile(S,new Uint8Array(o.data));const h=await e.runPythonAsync(`
import traceback
from pathlib import Path

from libresvip.core.compat import json
from libresvip.core.warning_types import CatchWarnings
from libresvip.extension.manager import middleware_manager, plugin_manager

input_format = ${JSON.stringify(o.inputFormat)}
output_format = ${JSON.stringify(n.outputFormat)}
input_path = Path(${JSON.stringify(S)})
output_path = Path(${JSON.stringify($)})
input_options = json.loads(${_(n.inputOptions)})
output_options = json.loads(${_(n.outputOptions)})
middleware_options = json.loads(${_(n.middlewareOptions)})

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
`),c=JSON.parse(h);if(!c.ok){l(t,{type:"task-failed",taskId:o.id,error:{name:"ConversionError",message:c.error}});continue}for(const B of c.warnings)l(t,{type:"task-warning",taskId:o.id,warning:B});const G=e.FS.readFile($),T=new Uint8Array(G).buffer,x={taskId:o.id,fileName:j,mime:"application/octet-stream",data:T,warnings:c.warnings};i.push(x),l(t,{type:"task-completed",taskId:o.id,output:x})}catch(h){l(t,{type:"task-failed",taskId:o.id,error:d(h)})}finally{b(e,u)}}return{outputs:i}}async function f(){if(r)throw r;return k()}function p(t,n){self.postMessage({id:t,type:"success",value:n})}function z(t,n){self.postMessage({id:t,type:"error",error:d(n)})}function l(t,n){self.postMessage({id:t,type:"event",event:n})}function d(t){if(t instanceof Error)return{name:t.name,message:t.message,stack:t.stack};if(t&&typeof t=="object"&&"message"in t){const n=t;return{name:typeof n.name=="string"?n.name:"Error",message:String(n.message),stack:typeof n.stack=="string"?n.stack:void 0}}return{name:"Error",message:P(t)}}function L(t){return t.replace(/[\\/:*?"<>|]/g,"_")}function M(t){const n=t.lastIndexOf(".");return n>0?t.slice(0,n):t}function A(t,n,e){const i=n.startsWith(".")?n:`.${n}`;let a=`${t}${i}`,o=1;for(;e.has(a);)a=`${t} (${o})${i}`,o+=1;return e.add(a),a}function b(t,n){try{for(const e of t.FS.readdir(n)){if(e==="."||e==="..")continue;const i=`${n}/${e}`;try{t.FS.unlink(i)}catch{b(t,i)}}t.FS.rmdir(n)}catch{}}async function D(t){const n=await Promise.all(J.map(async i=>{const a=await fetch(i.url);if(!a.ok)throw new Error(`Failed to fetch wheel ${i.fileName}: ${a.status} ${a.statusText}`);return{fileName:i.fileName,data:new Uint8Array(await a.arrayBuffer())}}));t.FS.mkdirTree(v);const e=[];for(const i of n){const a=`${v}/${i.fileName}`;t.FS.writeFile(a,i.data),e.push(`emfs:${a}`)}return e}function g(t,n){const e=new URL(t,n);return new URL(`${e.pathname}${e.search}${e.hash}`,n).href}function _(t){return JSON.stringify(JSON.stringify(t))}})();

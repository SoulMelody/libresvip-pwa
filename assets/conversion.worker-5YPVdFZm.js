(function(){var e=`/libresvip-pwa/assets/libresvip-2.7.1-py3-none-any-CJTgqjlR.whl`,t=`/libresvip-pwa/assets/pycryptodomex-3.23.0-cp37-abi3-pyemscripten_2026_0_wasm32-Dlgyq3T6.whl`,n=`/libresvip-pwa/assets/wanakana_python-1.2.2-py3-none-any-mmo05MrR.whl`;function r(e,t,n){let r=e&&e!==`Error`?`${e}: ${t}`:t;return n?`${r}\n${n}`:r}function i(e){if(typeof e==`string`)return e;if(e instanceof Error)return r(e.name,e.message,e.stack);if(e&&typeof e==`object`){let t=e,n=typeof t.name==`string`?t.name:`Error`,i=typeof t.message==`string`?t.message:``,a=typeof t.stack==`string`?t.stack:void 0;if(i)return r(n,i,a);try{return JSON.stringify(e,null,2)}catch{return String(e)}}return String(e)}let a=`https://testingcf.jsdelivr.net/pyodide/v314.0.0/full/`,o=`${a}pyodide.mjs`,s=typeof location<`u`?location.origin:`http://localhost:5173`,c=`/tmp/libresvip-pwa/wheels`,l=[{fileName:`libresvip-2.7.1-py3-none-any.whl`,url:O(e,s)},{fileName:`pycryptodomex-3.23.0-cp37-abi3-pyemscripten_2026_0_wasm32.whl`,url:O(t,s)},{fileName:`wanakana_python-1.2.2-py3-none-any.whl`,url:O(n,s)}],u=null,d=null;self.onmessage=e=>{f(e.data)};async function f(e){try{switch(e.type){case`init`:e.force&&(u=null,d=null),await p(),y(e.id,void 0);break;case`version`:y(e.id,await h());break;case`pluginInfos`:y(e.id,await g(e.language??`en_US`));break;case`convert`:y(e.id,await _(e.id,e.request));break}}catch(t){b(e.id,t)}}async function p(){return u||(u=m().catch(e=>{throw d=S(e),d}),u)}async function m(){let{loadPyodide:e}=await import(o),t=await e({indexURL:a});await t.loadPackage([`micropip`,`lxml`,`ujson`]);let n=await D(t);return await t.runPythonAsync(`
import micropip
await micropip.install(${JSON.stringify([...n,`pyzipper`,`yaml-rs`])}, keep_going=True)
`),t}async function h(){return(await v()).runPythonAsync(`
import importlib.metadata
importlib.metadata.version("libresvip")
`)}async function g(e){let t=await(await v()).runPythonAsync(`
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

language = ${JSON.stringify(e)}
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
`);return JSON.parse(t)}async function _(e,t){let n=await v(),r=[],i=new Set;for(let a of t.tasks){x(e,{type:`task-started`,taskId:a.id});let o=`/tmp/libresvip-pwa/${a.id}`,s=`${o}/${C(a.name)}`,c=T(w(a.name),t.outputFormat,i),l=`${o}/${c}`;try{n.FS.mkdirTree(o),n.FS.writeFile(s,new Uint8Array(a.data));let i=await n.runPythonAsync(`
import traceback
from pathlib import Path

from libresvip.core.compat import json
from libresvip.core.warning_types import CatchWarnings
from libresvip.extension.manager import middleware_manager, plugin_manager

input_format = ${JSON.stringify(a.inputFormat)}
output_format = ${JSON.stringify(t.outputFormat)}
input_path = Path(${JSON.stringify(s)})
output_path = Path(${JSON.stringify(l)})
input_options = json.loads(${k(t.inputOptions)})
output_options = json.loads(${k(t.outputOptions)})
middleware_options = json.loads(${k(t.middlewareOptions)})

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
`),u=JSON.parse(i);if(!u.ok){x(e,{type:`task-failed`,taskId:a.id,error:{name:`ConversionError`,message:u.error}});continue}for(let t of u.warnings)x(e,{type:`task-warning`,taskId:a.id,warning:t});let d=n.FS.readFile(l),f=new Uint8Array(d).buffer,p={taskId:a.id,fileName:c,mime:`application/octet-stream`,data:f,warnings:u.warnings};r.push(p),x(e,{type:`task-completed`,taskId:a.id,output:p})}catch(t){x(e,{type:`task-failed`,taskId:a.id,error:S(t)})}finally{E(n,o)}}return{outputs:r}}async function v(){if(d)throw d;return p()}function y(e,t){self.postMessage({id:e,type:`success`,value:t})}function b(e,t){self.postMessage({id:e,type:`error`,error:S(t)})}function x(e,t){self.postMessage({id:e,type:`event`,event:t})}function S(e){if(e instanceof Error)return{name:e.name,message:e.message,stack:e.stack};if(e&&typeof e==`object`&&`message`in e){let t=e;return{name:typeof t.name==`string`?t.name:`Error`,message:String(t.message),stack:typeof t.stack==`string`?t.stack:void 0}}return{name:`Error`,message:i(e)}}function C(e){return e.replace(/[\\/:*?"<>|]/g,`_`)}function w(e){let t=e.lastIndexOf(`.`);return t>0?e.slice(0,t):e}function T(e,t,n){let r=t.startsWith(`.`)?t:`.${t}`,i=`${e}${r}`,a=1;for(;n.has(i);)i=`${e} (${a})${r}`,a+=1;return n.add(i),i}function E(e,t){try{for(let n of e.FS.readdir(t)){if(n===`.`||n===`..`)continue;let r=`${t}/${n}`;try{e.FS.unlink(r)}catch{E(e,r)}}e.FS.rmdir(t)}catch{}}async function D(e){let t=await Promise.all(l.map(async e=>{let t=await fetch(e.url);if(!t.ok)throw Error(`Failed to fetch wheel ${e.fileName}: ${t.status} ${t.statusText}`);return{fileName:e.fileName,data:new Uint8Array(await t.arrayBuffer())}}));e.FS.mkdirTree(c);let n=[];for(let r of t){let t=`${c}/${r.fileName}`;e.FS.writeFile(t,r.data),n.push(`emfs:${t}`)}return n}function O(e,t){let n=new URL(e,t);return new URL(`${n.pathname}${n.search}${n.hash}`,t).href}function k(e){return JSON.stringify(JSON.stringify(e))}})();
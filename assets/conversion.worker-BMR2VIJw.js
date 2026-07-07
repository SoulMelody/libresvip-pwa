(function(){var e=`/libresvip-pwa/assets/libresvip-2.7.3-py3-none-any-DNkyLjHz.whl`,t=`/libresvip-pwa/assets/pycryptodomex-3.23.0-cp37-abi3-pyemscripten_2026_0_wasm32-Dlgyq3T6.whl`,n=`/libresvip-pwa/assets/wanakana_python-1.2.2-py3-none-any-mmo05MrR.whl`;function r(e,t,n){let r=e&&e!==`Error`?`${e}: ${t}`:t;return n?`${r}\n${n}`:r}function i(e){if(typeof e==`string`)return e;if(e instanceof Error)return r(e.name,e.message,e.stack);if(e&&typeof e==`object`){let t=e,n=typeof t.name==`string`?t.name:`Error`,i=typeof t.message==`string`?t.message:``,a=typeof t.stack==`string`?t.stack:void 0;if(i)return r(n,i,a);try{return JSON.stringify(e,null,2)}catch{return String(e)}}return String(e)}function a(e){if(e instanceof Error)return{name:e.name,message:e.message,stack:e.stack};if(e&&typeof e==`object`&&`message`in e){let t=e;return{name:typeof t.name==`string`?t.name:`Error`,message:String(t.message),stack:typeof t.stack==`string`?t.stack:void 0}}return{name:`Error`,message:i(e)}}function o(e){let t=e.split(/[\\/]/).pop()??e,n=t.lastIndexOf(`.`);return n>0?t.slice(0,n):t}function s(e,t,n){let r=t.startsWith(`.`)?t.slice(1):t,i=r?`.${r}`:``,a=`${e}${i}`,o=1;for(;n.has(a);)a=`${e} (${o})${i}`,o+=1;return n.add(a),a}let c=`https://testingcf.jsdelivr.net/pyodide/v314.0.2/full/`,l=`${c}pyodide.mjs`,u=typeof location<`u`?location.origin:`http://localhost:5173`,d=`/tmp/libresvip-pwa/wheels`,f=[{fileName:`libresvip-2.7.3-py3-none-any.whl`,url:O(e,u)},{fileName:`pycryptodomex-3.23.0-cp37-abi3-pyemscripten_2026_0_wasm32.whl`,url:O(t,u)},{fileName:`wanakana_python-1.2.2-py3-none-any.whl`,url:O(n,u)}],p=null,m=null;self.onmessage=e=>{h(e.data)};async function h(e){try{switch(e.type){case`init`:e.force&&(p=null,m=null),await g(),S(e.id,void 0);break;case`version`:S(e.id,await v());break;case`pluginInfos`:S(e.id,await y(e.language??`en_US`));break;case`convert`:S(e.id,await b(e.id,e.request));break}}catch(t){C(e.id,t)}}async function g(){return p||(p=_().catch(e=>{throw m=a(e),m}),p)}async function _(){let{loadPyodide:e}=await import(l),t=await e({indexURL:c});await t.loadPackage([`micropip`,`lxml`,`ujson`]);let n=await D(t);return await t.runPythonAsync(`
import micropip
await micropip.install(${JSON.stringify([...n,`pyzipper`,`yaml-rs`])}, keep_going=True)
`),t}async function v(){return(await x()).runPythonAsync(`
import importlib.metadata
importlib.metadata.version("libresvip")
`)}async function y(e){let t=await(await x()).runPythonAsync(`
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
`);return JSON.parse(t)}async function b(e,t){let n=await x(),r=[],i=new Set;for(let c of t.tasks){w(e,{type:`task-started`,taskId:c.id});let l=`/tmp/libresvip-pwa/${c.id}`,u=`${l}/${T(c.name)}`,d=s(o(c.name),t.outputFormat,i),f=`${l}/${d}`;try{n.FS.mkdirTree(l),n.FS.writeFile(u,new Uint8Array(c.data));let i=await n.runPythonAsync(`
import traceback
from pathlib import Path

from libresvip.core.compat import json
from libresvip.core.warning_types import CatchWarnings
from libresvip.extension.manager import middleware_manager, plugin_manager

input_format = ${JSON.stringify(c.inputFormat)}
output_format = ${JSON.stringify(t.outputFormat)}
input_path = Path(${JSON.stringify(u)})
output_path = Path(${JSON.stringify(f)})
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
`),a=JSON.parse(i);if(!a.ok){w(e,{type:`task-failed`,taskId:c.id,error:{name:`ConversionError`,message:a.error}});continue}for(let t of a.warnings)w(e,{type:`task-warning`,taskId:c.id,warning:t});let o=n.FS.readFile(f),s=new Uint8Array(o).buffer,p={taskId:c.id,fileName:d,mime:`application/octet-stream`,data:s,warnings:a.warnings};r.push(p),w(e,{type:`task-completed`,taskId:c.id,output:p})}catch(t){w(e,{type:`task-failed`,taskId:c.id,error:a(t)})}finally{E(n,l)}}return{outputs:r}}async function x(){if(m)throw m;return g()}function S(e,t){self.postMessage({id:e,type:`success`,value:t})}function C(e,t){self.postMessage({id:e,type:`error`,error:a(t)})}function w(e,t){self.postMessage({id:e,type:`event`,event:t})}function T(e){return e.replace(/[\\/:*?"<>|]/g,`_`)}function E(e,t){try{for(let n of e.FS.readdir(t)){if(n===`.`||n===`..`)continue;let r=`${t}/${n}`;try{e.FS.unlink(r)}catch{E(e,r)}}e.FS.rmdir(t)}catch{}}async function D(e){let t=await Promise.all(f.map(async e=>{let t=await fetch(e.url);if(!t.ok)throw Error(`Failed to fetch wheel ${e.fileName}: ${t.status} ${t.statusText}`);return{fileName:e.fileName,data:new Uint8Array(await t.arrayBuffer())}}));e.FS.mkdirTree(d);let n=[];for(let r of t){let t=`${d}/${r.fileName}`;e.FS.writeFile(t,r.data),n.push(`emfs:${t}`)}return n}function O(e,t){let n=new URL(e,t);return new URL(`${n.pathname}${n.search}${n.hash}`,t).href}function k(e){return JSON.stringify(JSON.stringify(e))}})();
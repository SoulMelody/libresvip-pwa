import { mount } from "@stlite/browser";
import stliteLibWheel from "@stlite/browser/wheels/stlite_lib-0.1.0-py3-none-any.whl";
import streamlitWheel from "@stlite/browser/wheels/streamlit-1.48.0-cp313-none-any.whl";
import libresvipWheel from "./assets/libresvip-1.11.3-py3-none-any.whl";
import constructWheel from "./assets/construct-2.10.68-py3-none-any.whl";
import midofixWheel from "./assets/mido_fix-1.2.12-py2.py3-none-any.whl";
import wanakanaWheel from "./assets/wanakana_python-1.2.2-py3-none-any.whl";

mount(
  {
    entrypoint: "app.py",
    files: {
      "app.py": `import enum
import gettext
import traceback
from typing import get_args, get_type_hints, override

import streamlit as st
import streamlit_antd_components as sac
import streamlit_rjsf as srj
from pydantic._internal._core_utils import CoreSchemaOrField
from pydantic.json_schema import GenerateJsonSchema, JsonSchemaValue
from upath import UPath

from libresvip.extension.manager import get_translation, plugin_manager

st.set_page_config(layout="wide")
language = st.sidebar.selectbox('Language/语言', options=[
    "en_US", "zh_CN", "de_DE"
], format_func=lambda x: {
    "en_US": "English",
    "zh_CN": "简体中文",
    "de_DE": "Deutsch",
}[x])
try:
    localizator = get_translation(language)
    _ = localizator.gettext 
except Exception:
    _ = gettext.gettext


class GettextGenerateJsonSchema(GenerateJsonSchema):
    @override
    def generate_inner(self, schema: CoreSchemaOrField) -> JsonSchemaValue:
        json_schema = super().generate_inner(schema)
        if "title" in json_schema:
            json_schema["title"] = _(json_schema["title"])
        if "description" in json_schema:
            json_schema["description"] = _(json_schema["description"])
        return json_schema


def main():
    step = sac.steps(
        [
            sac.StepsItem(title=_("Import project")),
            sac.StepsItem(title=_("Export format")),
            sac.StepsItem(title=_("Advanced Settings")),
            sac.StepsItem(title=_("Export")),
        ],
        size="sm",
        return_index=True,
    )
    plugin_options = list(plugin_manager.plugin_registry)
    if step == 0:
        col1, col2 = st.columns([0.9, 0.1])
        with col1:
            prev_input_format = st.session_state.get("input_format", None)
            st.session_state["input_format"] = st.selectbox(_("Import format"), options=plugin_options, index=plugin_options.index(prev_input_format) if prev_input_format in plugin_options else 0)
        with col2:
            with st.popover("", icon=":material/info:"):
                st.write("")
        uploaded_file = st.file_uploader(_("Add task"), accept_multiple_files=False)
        if uploaded_file is not None:
            st.session_state["uploaded_content"] = uploaded_file.read()
            st.session_state["uploaded_file_name"] = uploaded_file.name
    elif step == 1:
        col1, col2 = st.columns([0.9, 0.1])
        with col1:
            prev_output_format = st.session_state.get("output_format", None)
            st.session_state["output_format"] = st.selectbox(
                _("Export format"), options=plugin_options,
                index=plugin_options.index(prev_output_format) if prev_output_format in plugin_options else 0
            )
        with col2:
            with st.popover("", icon=":material/info:"):
                st.write("")
    elif step == 2:
        TAB_SELECT = sac.tabs([
            sac.TabsItem(_("Input Options")),
            sac.TabsItem(_("Output Options")),
        ], return_index=True)
        if TAB_SELECT == 0:
            plugin_info = plugin_manager.plugin_registry[st.session_state["input_format"]]
            option_cls = get_type_hints(plugin_info.plugin_object.load)["options"]
            option_json_schema = option_cls.model_json_schema(
                schema_generator=GettextGenerateJsonSchema,
            )
            option_json_schema.pop("title", None)
            option_json_schema["required"] = list(
                option_json_schema["properties"].keys()
            )
            ui_schema = {
                "ui:submitButtonOptions": {
                    "submitText": _("OK"),
                }
            }
            for field_name, field_info in option_cls.model_fields.items():
                if issubclass(field_info.annotation, enum.Enum):
                    type_hints = get_type_hints(field_info.annotation, include_extras=True)
                    annotations = None
                    if "_value_" in type_hints:
                        value_args = get_args(type_hints["_value_"])
                        if len(value_args) >= 2:
                            model = value_args[1]
                            if hasattr(model, "model_fields"):
                                annotations = model.model_fields
                    if annotations is None:
                        continue
                    enum_names = []
                    for enum_item in field_info.annotation:
                        if enum_item.name in annotations:
                            enum_field = annotations[enum_item.name]
                            enum_names.append(_(enum_field.title))
                    option_json_schema["properties"][field_name]["enumNames"] = enum_names
            prev_options = st.session_state.get("input_options", {})
            options = srj.raw_jsonform(
                key="input_options_form",
                schema=option_json_schema,
                user_data=prev_options,
                ui_schema=ui_schema
            )
            if options:
                st.session_state["input_options"] = options
        elif TAB_SELECT == 1:
            plugin_info = plugin_manager.plugin_registry[st.session_state["output_format"]]
            option_cls = get_type_hints(plugin_info.plugin_object.dump)["options"]
            option_json_schema = option_cls.model_json_schema(
                schema_generator=GettextGenerateJsonSchema,
            )
            option_json_schema.pop("title", None)
            option_json_schema["required"] = list(
                option_json_schema["properties"].keys()
            )
            ui_schema = {
                "ui:submitButtonOptions": {
                    "submitText": _("OK"),
                }
            }
            for field_name, field_info in option_cls.model_fields.items():
                if issubclass(field_info.annotation, enum.Enum):
                    type_hints = get_type_hints(field_info.annotation, include_extras=True)
                    annotations = None
                    if "_value_" in type_hints:
                        value_args = get_args(type_hints["_value_"])
                        if len(value_args) >= 2:
                            model = value_args[1]
                            if hasattr(model, "model_fields"):
                                annotations = model.model_fields
                    if annotations is None:
                        continue
                    enum_names = []
                    for enum_item in field_info.annotation:
                        if enum_item.name in annotations:
                            enum_field = annotations[enum_item.name]
                            enum_names.append(_(enum_field.title))
                    option_json_schema["properties"][field_name]["enumNames"] = enum_names
            prev_options = st.session_state.get("output_options", {})
            options = srj.raw_jsonform(
                key="output_options_form",
                schema=option_json_schema,
                user_data=prev_options,
                ui_schema=ui_schema
            )
            if options:
                st.session_state["output_options"] = options
    elif step == 3:
        try:
            input_format = st.session_state["input_format"]
            output_format = st.session_state["output_format"]
            input_option_cls = get_type_hints(plugin_manager.plugin_registry[input_format].plugin_object.load)["options"]
            input_options = input_option_cls(**st.session_state.get("input_options", {}))
            memfs = UPath("memory:/")
            input_file = memfs / st.session_state["uploaded_file_name"]
            input_file.write_bytes(st.session_state["uploaded_content"])
            project = plugin_manager.plugin_registry[input_format].plugin_object.load(input_file, input_options)
            output_option_cls = get_type_hints(plugin_manager.plugin_registry[output_format].plugin_object.dump)["options"]
            output_options = output_option_cls(**st.session_state.get("output_options", {}))
            output_name = f"export.{output_format}"
            output_file = memfs / output_name
            plugin_manager.plugin_registry[output_format].plugin_object.dump(output_file, project, output_options)

            sac.result(_("File successfully converted"), status="success")
            st.download_button(_("Download"), data=output_file.read_bytes(), file_name=output_name, mime="application/octet-stream")
        except Exception:
            sac.result(traceback.format_exc(), status="error")
        if st.button("", icon=":material/refresh-alt:"):
            st.session_state.clear()
            st.experimental_rerun()

if __name__ == "__main__":
    main()`,
    },
    requirements: [
      "lxml",
      "streamlit-antd-components",
      "streamlit-rjsf",
      "ruamel.yaml",
      "ujson",
      "universal-pathlib",
      "zstandard",
      new URL(libresvipWheel, import.meta.url).href,
    ],
    prebuiltPackageNames: [
      new URL(constructWheel, import.meta.url).href,
      new URL(midofixWheel, import.meta.url).href,
      new URL(wanakanaWheel, import.meta.url).href,
    ],
    pyodideUrl: "https://testingcf.jsdelivr.net/pyodide/v0.28.2/full/pyodide.mjs",
    wheelUrls: {
      stliteLib: new URL(stliteLibWheel, import.meta.url).href,
      streamlit: new URL(streamlitWheel, import.meta.url).href,
    },
    workerType: process.env.NODE_ENV === "development" ? "module" : "classic",
  },
  document.getElementById("app") as HTMLDivElement
);

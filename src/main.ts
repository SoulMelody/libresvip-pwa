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
      "app.py": `import base64
import gettext
import io
from functools import partial
from importlib.resources import as_file
from typing import get_type_hints, override

import extra_streamlit_components as stx
import streamlit as st
import st_pydantic as sp
from pydantic._internal._core_utils import CoreSchemaOrField
from pydantic.json_schema import GenerateJsonSchema, JsonSchemaValue
from upath import UPath

import libresvip
from libresvip.core.constants import res_dir
from libresvip.core.warning_types import CatchWarnings
from libresvip.extension.manager import get_translation, plugin_manager
from libresvip.utils import translation

st.set_page_config(layout="wide")
with st.sidebar:
    with as_file(res_dir / "libresvip.ico") as icon_path:
        st.logo(io.BytesIO(icon_path.read_bytes()))
    language = st.selectbox('Language/语言', options=[
        "en_US", "zh_CN", "de_DE"
    ], format_func=lambda x: {
        "en_US": "English",
        "zh_CN": "简体中文",
        "de_DE": "Deutsch",
    }[x])
try:
    localizator = get_translation(language)
    translation.singleton_translation = localizator
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

@st.cache_resource
def load_memfs():
    return UPath("memory:/")


def about():
    st.title(_("About"))
    st.write(_("Version: ") + libresvip.__version__)
    st.write(_("Author: SoulMelody"))
    st.link_button(_("Author's Profile"), "https://space.bilibili.com/175862486", icon=":material/live_tv:")
    st.link_button(_("Repo URL"), "https://github.com/SoulMelody/LibreSVIP", icon=":material/logo_dev:")
    st.write(_("LibreSVIP is an open-sourced, liberal and extensionable framework that can convert your singing synthesis projects between different file formats."))
    st.write(_("All people should have the right and freedom to choose. That's why we're committed to giving you a second chance to keep your creations free from the constraints of platforms and coterie."))


def main():
    step = stx.stepper_bar(
        steps=[
            _("Select File Formats"),
            _("Advanced Settings"),
            _("Export"),
        ],
        default=0,
    )
    plugin_options = list(plugin_manager.plugin_registry)
    def format_plugin_option(plugin_id: str):
        plugin_info = plugin_manager.plugin_registry[plugin_id]
        return f"{_(plugin_info.file_format)} (*.{plugin_info.suffix})"
    if step == 0 or "uploaded_file_name" not in st.session_state:
        col1, col2 = st.columns([0.9, 0.1])
        with col1:
            prev_input_format = st.session_state.get("input_format", None)
            st.session_state["input_format"] = st.selectbox(
                _("Import format"), options=plugin_options,
                index=plugin_options.index(prev_input_format) if prev_input_format in plugin_options else 0,
                format_func=format_plugin_option,
            )
        with col2:
            with st.popover("", icon=":material/info:"):
                plugin_info = plugin_manager.plugin_registry[st.session_state["input_format"]]
                if plugin_info.icon_base64:
                    st.image(io.BytesIO(base64.b64decode(plugin_info.icon_base64)), width=100)
                st.subheader(plugin_info.name)
                st.badge(str(plugin_info.version), icon=":material/bookmark:")
                st.link_button(_(plugin_info.author), plugin_info.website or "#", icon=":material/person:")
                if plugin_info.description:
                    st.write(_(plugin_info.description))
        col3, col4 = st.columns([0.9, 0.1])
        with col3:
            prev_output_format = st.session_state.get("output_format", None)
            st.session_state["output_format"] = st.selectbox(
                _("Export format"), options=plugin_options,
                index=plugin_options.index(prev_output_format) if prev_output_format in plugin_options else 0,
                format_func=format_plugin_option,
            )
        with col4:
            with st.popover("", icon=":material/info:"):
                plugin_info = plugin_manager.plugin_registry[st.session_state["output_format"]]
                if plugin_info.icon_base64:
                    st.image(io.BytesIO(base64.b64decode(plugin_info.icon_base64)), width=100)
                st.subheader(plugin_info.name)
                st.badge(str(plugin_info.version), icon=":material/bookmark:")
                st.link_button(_(plugin_info.author), plugin_info.website or "#", icon=":material/person:")
                if plugin_info.description:
                    st.write(_(plugin_info.description))
        st.divider()
        uploaded_file = st.file_uploader(_("Add task"), accept_multiple_files=False)
        if uploaded_file is not None:
            st.session_state["uploaded_file_name"] = uploaded_file.name
            memfs = load_memfs()
            input_file = memfs / uploaded_file.name
            input_file.write_bytes(uploaded_file.read())
    elif step == 1 and "uploaded_file_name" in st.session_state:
        input_options_tab, output_options_tab = st.tabs([_("Input Options"), _("Output Options")])
        with input_options_tab:
            plugin_info = plugin_manager.plugin_registry[st.session_state["input_format"]]
            option_cls = get_type_hints(plugin_info.plugin_object.load)["options"]
            option_cls.model_json_schema = partial(option_cls.model_json_schema, schema_generator=GettextGenerateJsonSchema)
            options = sp.pydantic_form("input_options_form", option_cls, submit_label=_("OK"))
            if options:
                st.session_state["input_options"] = options.model_dump(by_alias=False, mode="json")
        with output_options_tab:
            plugin_info = plugin_manager.plugin_registry[st.session_state["output_format"]]
            option_cls = get_type_hints(plugin_info.plugin_object.dump)["options"]
            option_cls.model_json_schema = partial(option_cls.model_json_schema, schema_generator=GettextGenerateJsonSchema)
            options = sp.pydantic_form("output_options_form", option_cls, submit_label=_("OK"))
            if options:
                st.session_state["output_options"] = options.model_dump(by_alias=False, mode="json")
    elif step == 2 and "uploaded_file_name" in st.session_state:
        click_callback = None
        with st.status(_("Converting ..."), expanded=True) as status:
            try:
                
                with CatchWarnings() as w:
                    input_format = st.session_state["input_format"]
                    output_format = st.session_state["output_format"]
                    input_option_cls = get_type_hints(plugin_manager.plugin_registry[input_format].plugin_object.load)["options"]
                    input_options = input_option_cls(**st.session_state.get("input_options", {}))
                    memfs = load_memfs()
                    input_file = memfs / st.session_state["uploaded_file_name"]
                    project = plugin_manager.plugin_registry[input_format].plugin_object.load(input_file, input_options)
                    output_option_cls = get_type_hints(plugin_manager.plugin_registry[output_format].plugin_object.dump)["options"]
                    output_options = output_option_cls(**st.session_state.get("output_options", {}))
                    output_name = f"export.{output_format}"
                    output_file = memfs / output_name
                    plugin_manager.plugin_registry[output_format].plugin_object.dump(output_file, project, output_options)

                    def click_callback():
                        del st.session_state.uploaded_file_name
                        input_file.unlink()
                        output_file.unlink()

                status.update(label=_("Conversion Successful"), state="complete")
                if w.output:
                    st.warning(w.output, icon=":material/warning:")
                success = True
            except Exception as e:
                status.update(label=_("Conversion Failed"), state="error")
                st.exception(e)
                success = False
        if success:
            st.download_button(_("Download"), data=output_file.read_bytes(), file_name=output_name, mime="application/octet-stream", on_click=click_callback)
        if st.button("", icon=":material/restart_alt:"):
            st.session_state.clear()
            st.rerun()

if __name__ == "__main__":
    pg = st.navigation([
        st.Page(main, title=_("Converter"), icon=":material/repeat:"),
        st.Page(about, title=_("About"), icon=":material/help:"),
    ])
    pg.run()`,
    },
    requirements: [
      "extra-streamlit-components",
      "lxml",
      "st-pydantic",
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

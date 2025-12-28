import { mount } from "@stlite/browser";
import stliteLibWheel from "@stlite/browser/wheels/stlite_lib-0.1.0-py3-none-any.whl";
import streamlitWheel from "@stlite/browser/wheels/streamlit-1.50.0-cp313-none-any.whl";
import libresvipWheel from "./assets/libresvip-2.1.0-py3-none-any.whl";
import pycryptodomexWheel from "./assets/pycryptodomex-3.21.0-cp36-abi3-pyodide_2025_0_wasm32.whl";
import pyyaml12Wheel from "./assets/py_yaml12-0.1.0-cp310-abi3-emscripten_4_0_9_wasm32.whl";
import wanakanaWheel from "./assets/wanakana_python-1.2.2-py3-none-any.whl";

mount(
  {
    entrypoint: "app.py",
    files: {
      "app.py": `import base64
import gettext
import json
import io
import os
import uuid
from functools import partial
from importlib.resources import as_file
from typing import Any, override

import extra_streamlit_components as stx
import streamlit as st
import st_pydantic as sp
from streamlit_js import st_js, st_js_blocking
from pydantic._internal._core_utils import CoreSchemaOrField
from pydantic.json_schema import GenerateJsonSchema, JsonSchemaValue
from upath import UPath

import libresvip
from libresvip.core.constants import res_dir
from libresvip.core.warning_types import CatchWarnings
from libresvip.extension.base import ReadOnlyConverterMixin, WriteOnlyConverterMixin
from libresvip.extension.manager import get_translation, middleware_manager, plugin_manager
from libresvip.utils import translation

with as_file(res_dir / "libresvip.ico") as icon_path:
    st.set_page_config(
        page_title="LibreSVIP",
        page_icon=icon_path.read_bytes(),
        menu_items={
            "Get Help": "https://soulmelody.github.io/LibreSVIP/",
            "Report a bug": "https://github.com/SoulMelody/LibreSVIP/issues",
        }
    )

class StLocalStorage:
    KEY_PREFIX = "st_localstorage_"

    def __init__(self):
        # Keep track of a UUID for each key to enable reruns
        if "_ls_unique_keys" not in st.session_state:
            st.session_state["_ls_unique_keys"] = {}

        # Hide the JS iframes
        self._container = st.container(key="ls_container")
        self._container.html("""
            <style>
                .st-key-ls_container .element-container:has(iframe[height="0"]) {
                    display: none;
                }
            </style>
        """)

    def __getitem__(self, key: str) -> Any:
        if key not in st.session_state["_ls_unique_keys"]:
            st.session_state["_ls_unique_keys"][key] = str(uuid.uuid4())
        code = f"""
        return JSON.parse(localStorage.getItem('{self.KEY_PREFIX + key}'));
        """
        with self._container:
            result = st_js_blocking(code, key=st.session_state["_ls_unique_keys"][key])
        if result:
            if isinstance(result, list):
                result = result[0]
            return json.loads(result)
        return None

    def __setitem__(self, key: str, value: Any) -> None:
        value = json.dumps(value, ensure_ascii=False)
        st.session_state["_ls_unique_keys"][key] = str(uuid.uuid4())
        code = f"""
        localStorage.setItem('{self.KEY_PREFIX + key}', JSON.stringify('{value}'));
        """
        with self._container:
            return st_js(code, key=st.session_state["_ls_unique_keys"][key] + "_set")

    def __delitem__(self, key: str) -> None:
        st.session_state["_ls_unique_keys"][key] = str(uuid.uuid4())
        code = f"localStorage.removeItem('{self.KEY_PREFIX + key}');"
        with self._container:
            return st_js_blocking(code, key=st.session_state["_ls_unique_keys"][key] + "_del")

    def __contains__(self, key: str) -> bool:
        return self.__getitem__(key) is not None

st_local_storage = StLocalStorage()

with st.sidebar:
    all_languages = ["en_US", "zh_CN", "de_DE"]
    if "language" in st.session_state:
        default_language = st.session_state.language
    else:
        default_language = st_local_storage["language"]
        if not default_language:
            if (
                navigator_language := st_js_blocking("return navigator.language")
            ):
                navigator_language = navigator_language.replace("-", "_")
                if navigator_language in all_languages:
                    default_language = navigator_language
            if not default_language:
                default_language = "en_US"
    def change_language():
        if "language" in st.session_state:
            st_local_storage["language"] = st.session_state.language
    st.selectbox('Language/语言',
        key='language',
        options=all_languages,
        index=all_languages.index(default_language),
        on_change=change_language,
        format_func=lambda x: {
        "en_US": "English",
        "zh_CN": "简体中文",
        "de_DE": "Deutsch",
    }[x])
try:
    localizator = get_translation(st.session_state.language)
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
    with st.container(horizontal=True):
        st.link_button(_("Author's Profile"), "https://space.bilibili.com/175862486", icon=":material/live_tv:")
        st.link_button(_("Repo URL"), "https://github.com/SoulMelody/LibreSVIP", icon=":material/logo_dev:")
    st.write(_("LibreSVIP is an open-sourced, liberal and extensionable framework that can convert your singing synthesis projects between different file formats."))
    st.write(_("All people should have the right and freedom to choose. That's why we're committed to giving you a second chance to keep your creations free from the constraints of platforms and coterie."))


def main():
    custom_css = '''
    <style>
        [data-testid="stFileUploaderDropzoneInstructions"]:nth-child(2) span:not(:has(svg)),
        [data-testid="stFileUploaderDropzone"] button {
            display: none !important;
        }

        [data-testid="stFileUploader"] {
            position: relative !important;
            min-height: 70px !important;
            margin: 0 auto !important;
            border: 2px dashed #ddd !important;
            border-radius: 8px !important;
        }
        
        [data-testid="stFileUploader"]::before {
            content: "''' + _("Drag and drop files here or click to upload") + '''";
            position: absolute !important;
            top: min(35px, 50%) !important;
            left: 50% !important;
            transform: translate(-50%, -50%) !important;
            font-size: 13px !important;
            font-weight: 500 !important;
            z-index: 1 !important;
            pointer-events: none !important;
            text-align: center !important;
            width: 100% !important;
            padding: 0 10px !important;
        }

    </style>
    '''

    st.html(custom_css)
    step = stx.stepper_bar(
        steps=[
            _("Select File Formats"),
            _("Advanced Settings"),
            _("Export"),
        ],
        default=0,
    )
    input_plugin_options = [
        plugin_id
        for plugin_id, plugin in plugin_manager.plugins.get("svs", {}).items()
        if not issubclass(plugin, (WriteOnlyConverterMixin))
    ]
    output_plugin_options = [
        plugin_id
        for plugin_id, plugin in plugin_manager.plugins.get("svs", {}).items()
        if not issubclass(plugin, (ReadOnlyConverterMixin))
    ]
    def format_plugin_option(plugin_id: str):
        plugin = plugin_manager.plugins.get("svs", {})[plugin_id]
        return f"{_(plugin.info.file_format)} (*.{plugin.info.suffix})"
    if "uploaded_file_name" not in st.session_state:
        step = 0
    if step == 0:
        uploaded_file = st.file_uploader(_("Add task"), accept_multiple_files=False, label_visibility="collapsed")
        memfs = load_memfs()
        if uploaded_file is not None:
            st.session_state["uploaded_file_name"] = uploaded_file.name
            input_file = memfs / uploaded_file.name
            input_file.write_bytes(uploaded_file.read())
        elif "uploaded_file_name" in st.session_state:
            input_file = memfs / st.session_state["uploaded_file_name"]
            if input_file.exists():
                input_file.unlink()
            del st.session_state["uploaded_file_name"]
        st.divider()
        with st.container(horizontal=True, vertical_alignment="center"):
            if "uploaded_file_name" in st.session_state:
                input_suffix = os.path.splitext(st.session_state["uploaded_file_name"])[1].lstrip(".").lower()
                if input_suffix in input_plugin_options:
                    st.session_state["input_format"] = st.session_state["_input_format"] = input_suffix
            def input_format_changed():
                if "input_options" in st.session_state:
                    del st.session_state["input_options"]
                if "_input_format" in st.session_state:
                    st.session_state["input_format"] = st.session_state["_input_format"]
            st.selectbox(
                _("Import format"), options=input_plugin_options, key="_input_format",
                on_change=input_format_changed, format_func=format_plugin_option,
            )
            with st.popover("", icon=":material/info:"):
                if "input_format" not in st.session_state:
                    st.session_state["input_format"] = st.session_state["_input_format"]
                plugin = plugin_manager.plugins.get("svs", {})[st.session_state["input_format"]]
                with st.container(horizontal=True):
                    if plugin.info.icon_base64:
                        st.image(io.BytesIO(base64.b64decode(plugin.info.icon_base64)), width=100)
                    st.subheader(plugin.info.name)
                with st.container(horizontal=True, vertical_alignment="center"):
                    st.badge(_("Version: ") + str(plugin.version), icon=":material/bookmark:")
                    st.link_button(_(plugin.info.author), plugin.info.website or "#", help=_("Author"), icon=":material/person:")
                if plugin.info.description:
                    st.divider()
                    st.caption(_("Introduction"))
                    st.write(_(plugin.info.description))
        with st.container(horizontal=True, vertical_alignment="center"):
            def output_format_changed():
                if "output_options" in st.session_state:
                    del st.session_state["output_options"]
                if "_output_format" in st.session_state:
                    st.session_state["output_format"] = st.session_state["_output_format"]
            st.selectbox(
                _("Export format"), options=output_plugin_options, key="_output_format",
                on_change=output_format_changed, format_func=format_plugin_option,
            )
            with st.popover("", icon=":material/info:"):
                if "output_format" not in st.session_state:
                    st.session_state["output_format"] = st.session_state["_output_format"]
                plugin = plugin_manager.plugins.get("svs", {})[st.session_state["output_format"]]
                with st.container(horizontal=True):
                    if plugin.info.icon_base64:
                        st.image(io.BytesIO(base64.b64decode(plugin.info.icon_base64)), width=100)
                    st.subheader(plugin.info.name)
                with st.container(horizontal=True, vertical_alignment="center"):
                    st.badge(_("Version: ") + str(plugin.version), icon=":material/bookmark:")
                    st.link_button(_(plugin.info.author), plugin.info.website or "#", help=_("Author"), icon=":material/person:")
                if plugin.info.description:
                    st.divider()
                    st.caption(_("Introduction"))
                    st.write(_(plugin.info.description))
    elif step == 1:
        input_options_tab, output_options_tab, middleware_options_tab = st.tabs([_("Input Options"), _("Output Options"), _("Intermediate Processing")])
        with input_options_tab:
            plugin_info = plugin_manager.plugins.get("svs", {})[st.session_state["input_format"]]
            option_cls = plugin_info.input_option_cls
            option_cls.model_json_schema = partial(option_cls.model_json_schema, schema_generator=GettextGenerateJsonSchema)
            options = sp.pydantic_form("input_options_form", option_cls, submit_label=_("OK"))
            if options:
                st.session_state["input_options"] = options.model_dump(by_alias=False, mode="json")
        with output_options_tab:
            plugin_info = plugin_manager.plugins.get("svs", {})[st.session_state["output_format"]]
            option_cls = plugin_info.output_option_cls
            option_cls.model_json_schema = partial(option_cls.model_json_schema, schema_generator=GettextGenerateJsonSchema)
            options = sp.pydantic_form("output_options_form", option_cls, submit_label=_("OK"))
            if options:
                st.session_state["output_options"] = options.model_dump(by_alias=False, mode="json")
        with middleware_options_tab:
            st.session_state["middleware_options"] = {}
            for middleware_id, middleware_info in middleware_manager.plugins.get("middleware", {}).items():
                enabled = st.toggle(_(middleware_info.name), key=f"middleware_{middleware_id}")
                if enabled:
                    option_cls = middleware_info.process_option_cls
                    option_cls.model_json_schema = partial(option_cls.model_json_schema, schema_generator=GettextGenerateJsonSchema)
                    options = sp.pydantic_form(f"middleware_options_form_{middleware_id}", option_cls, submit_label=_("OK"))
                    if options:
                        st.session_state["middleware_options"][middleware_id] = options.model_dump(by_alias=False, mode="json")
                else:
                    if middleware_id in st.session_state["middleware_options"]:
                        del st.session_state["middleware_options"][middleware_id]
    elif step == 2:
        click_callback = None
        with st.status(_("Converting ..."), expanded=True) as status:
            try:
                with CatchWarnings() as w:
                    input_format = st.session_state["input_format"]
                    output_format = st.session_state["output_format"]
                    memfs = load_memfs()
                    input_file = memfs / st.session_state["uploaded_file_name"]
                    input_options = st.session_state.get("input_options", {})
                    project = plugin_manager.plugins.get("svs", {})[input_format].load(input_file, input_options)
                    for middleware_id, middleware_info in middleware_manager.plugins.get("middleware", {}).items():
                        if st.session_state.get(f"middleware_{middleware_id}"):
                            middleware_options = st.session_state["middleware_options"].get(middleware_id, {})
                            project = middleware_info.process(project, middleware_options)
                    output_options = st.session_state.get("output_options", {})
                    input_stem = os.path.splitext(st.session_state["uploaded_file_name"])[0]
                    output_name = f"{input_stem}.{output_format}"
                    output_file = memfs / output_name
                    plugin_manager.plugins.get("svs", {})[output_format].dump(output_file, project, output_options)

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
        with st.container(horizontal=True):
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
      "pyzipper",
      "st-pydantic",
      "streamlit-js",
      "ujson",
      "zstandard",
      new URL(libresvipWheel, import.meta.url).href,
    ],
    prebuiltPackageNames: [
      new URL(pycryptodomexWheel, import.meta.url).href,
      new URL(pyyaml12Wheel, import.meta.url).href,
      new URL(wanakanaWheel, import.meta.url).href,
    ],
    pyodideUrl: "https://testingcf.jsdelivr.net/pyodide/v0.28.3/full/pyodide.mjs",
    wheelUrls: {
      stliteLib: new URL(stliteLibWheel, import.meta.url).href,
      streamlit: new URL(streamlitWheel, import.meta.url).href,
    },
  },
  document.getElementById("app") as HTMLDivElement
);

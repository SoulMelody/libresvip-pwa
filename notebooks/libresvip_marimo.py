import marimo

__generated_with = "0.11.20"
app = marimo.App(width="full")


@app.cell
async def _():
    try:
        import micropip
        micropip.add_mock_package('packaging', '24.2')

        await micropip.install("https://www.piwheels.org/simple/construct/construct-2.10.68-py3-none-any.whl")
        await micropip.install("https://www.piwheels.org/simple/mido-fix/mido_fix-1.2.12-py2.py3-none-any.whl")
        await micropip.install("https://www.piwheels.org/simple/wanakana-python/wanakana_python-1.2.2-py3-none-any.whl")
        await micropip.install("ruamel-yaml")
        await micropip.install("lxml")

        await micropip.install("zstandard")
        micropip.add_mock_package('zstandard', '0.23.0')

        micropip.add_mock_package('pydantic', '2.10.6')
        micropip.add_mock_package('pydantic-core', '2.27.2')

        await micropip.install("pycryptodome")
        micropip.add_mock_package('pycryptodomex', "3.21.0")
        await micropip.install("pyzipper")

        await micropip.install("libresvip")
        micropip.remove_mock_package('pydantic')
    except ImportError:
        pass
    return (micropip,)


@app.cell
def _():
    import marimo as mo
    return (mo,)


@app.cell
def _(mo):
    from libresvip.plugins.acep.ace_studio_converter import ACEStudioConverter
    from libresvip.core.config import Language, settings
    from libresvip.extension.manager import get_translation
    from libresvip.utils import translation
    from libresvip.utils.translation import gettext_lazy as _

    def on_change_language(value: str):
        if value == "简体中文":
            settings.language = Language.CHINESE
        else:
            settings.language = Language.ENGLISH
        translation.singleton_translation = get_translation()

    language_select = mo.ui.dropdown(
        ['English', '简体中文'],
        label="Language/语言",
        on_change=on_change_language
    )
    language_select
    return (
        Language,
        get_translation,
        language_select,
        on_change_language,
        settings,
        translation,
    )


@app.cell
def _(mo):
    import enum
    from functools import partial
    from typing import Any, get_args, get_type_hints

    from pydantic import BaseModel
    from pydantic_core import PydanticUndefined
    from pydantic_extra_types.color import Color

    from libresvip.model.base import BaseComplexModel
    from libresvip.utils.translation import gettext_lazy as _

    def generate_model_json_schema(option_class: type[BaseModel]) -> tuple[dict[str, Any], mo.vstack]:
        option_dict = {}
        for option_key, field_info in option_class.model_fields.items():
            default_value = None if field_info.default is PydanticUndefined else field_info.default
            if issubclass(field_info.annotation, bool):
                option_dict[option_key] = mo.ui.switch(
                    value=default_value,
                    label=_(field_info.title),
                )
            elif issubclass(field_info.annotation, enum.Enum):
                if default_value is not None:
                    default_value = default_value.name
                annotations = get_type_hints(field_info.annotation, include_extras=True)
                choices = []
                for enum_item in field_info.annotation:
                    if enum_item.name in annotations:
                        choices.append(enum_item.name)
                option_dict[option_key] = mo.ui.dropdown(
                    choices,
                    value=default_value,
                    label=_(field_info.title),
                )
            elif issubclass(field_info.annotation, int):
                option_dict[option_key] = mo.ui.number(
                    value=default_value,
                    label=_(field_info.title),
                )
            elif issubclass(field_info.annotation, float):
                option_dict[option_key] = mo.ui.number(
                    value=default_value,
                    label=_(field_info.title),
                )
            else:
                if issubclass(field_info.annotation, BaseComplexModel):
                    default_value = field_info.annotation.default_repr()
                option_dict[option_key] = mo.ui.text(
                    value=default_value,
                    label=_(field_info.title),
                )
        return option_dict, mo.vstack(list(option_dict.values()))
    return (
        Any,
        BaseComplexModel,
        BaseModel,
        Color,
        PydanticUndefined,
        enum,
        generate_model_json_schema,
        get_args,
        get_type_hints,
        partial,
    )


@app.cell
def _(language_select, mo):
    from libresvip.extension.manager import plugin_manager
    from libresvip.utils.translation import gettext_lazy as _

    mo.stop(language_select.value is None, mo.md(""))

    input_format_select = mo.ui.dropdown(
        list(plugin_manager.plugin_registry),
        label=_("Import format"),
    )
    output_format_select = mo.ui.dropdown(
        list(plugin_manager.plugin_registry),
        label=_("Export format"),
    )

    mo.vstack([
        input_format_select,
        output_format_select
    ])
    return input_format_select, output_format_select, plugin_manager


@app.cell
def _(
    generate_model_json_schema,
    get_type_hints,
    input_format_select,
    language_select,
    mo,
    output_format_select,
    plugin_manager,
):
    from libresvip.utils.translation import gettext_lazy as _
    mo.stop(language_select.value is None or input_format_select.value is None or output_format_select.value is None, mo.md(""))

    input_plugin = plugin_manager.plugin_registry[input_format_select.value]
    input_options_cls = get_type_hints(input_plugin.plugin_object.load)["options"]
    input_options_dict, input_options_form = generate_model_json_schema(input_options_cls)
    output_plugin = plugin_manager.plugin_registry[output_format_select.value]
    output_options_cls = get_type_hints(output_plugin.plugin_object.dump)["options"]
    output_options_dict, output_options_form = generate_model_json_schema(output_options_cls)
    tabs = mo.ui.tabs({
        _("Input Options"): input_options_form,
        _("Output Options"): output_options_form,
    })
    tabs
    return (
        input_options_cls,
        input_options_dict,
        input_options_form,
        input_plugin,
        output_options_cls,
        output_options_dict,
        output_options_form,
        output_plugin,
        tabs,
    )


@app.cell
def _(input_format_select, language_select, mo, output_format_select):
    from libresvip.utils.translation import gettext_lazy as _
    mo.stop(language_select.value is None or input_format_select.value is None or output_format_select.value is None, mo.md(""))

    f = mo.ui.file(label=_("Drag and drop files here or click to upload"), kind="area")
    btn = mo.ui.run_button()
    mo.vstack([
        f,
        btn,
    ])
    return btn, f


@app.cell
def _(
    btn,
    f,
    input_options_cls,
    input_options_dict,
    input_plugin,
    mo,
    output_format_select,
    output_options_cls,
    output_options_dict,
    output_plugin,
):
    import pathlib
    import tempfile

    mo.stop(f.contents(0) is None or btn.value is False, mo.md(""))

    temp_path = pathlib.Path(tempfile.mkdtemp())

    input_file_data = f.value[0]
    input_option = input_options_cls.model_validate({
        k: v.value for k, v in input_options_dict.items()
    })
    output_option = output_options_cls.model_validate({
        k: v.value for k, v in output_options_dict.items()
    })
    has_error = False
    cur_dir = pathlib.Path(".")
    child_file = (temp_path / input_file_data.name)
    child_file.write_bytes(input_file_data.contents)
    target_file = (cur_dir / input_file_data.name).with_suffix(f".{output_format_select.value}")
    project = input_plugin.plugin_object.load(child_file, input_option)
    output_plugin.plugin_object.dump(target_file, project, output_option)
    mo.download(
        data=target_file.read_bytes(),
        filename=target_file.name,
        mimetype="application/octet-stream",
    )
    return (
        child_file,
        cur_dir,
        has_error,
        input_file_data,
        input_option,
        output_option,
        pathlib,
        project,
        target_file,
        temp_path,
        tempfile,
    )


if __name__ == "__main__":
    app.run()

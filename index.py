import enum
import io
import pathlib
import zipfile
from typing import Optional, get_args, get_type_hints

import panel as pn
import param
from param.parameterized import Event
from pydantic import BaseModel
from pydantic_core import PydanticUndefined
from pydantic_extra_types.color import Color

from libresvip.extension.manager import get_translation, middleware_manager, plugin_manager
from libresvip.model.base import BaseComplexModel
from libresvip.utils import translation


lang = pn.state.location.query_params.get("lang", "en_US")

translation.singleton_translation = get_translation(lang=lang)
_ = translation.pgettext_lazy
pn.extension(notifications=True, npm_cdn="https://unpkg.com")

base_dir = pathlib.Path('~').expanduser()
base_dir.mkdir(exist_ok=True, parents=True)

format_options = {
    f"{_(plugin.file_format)} (*.{plugin.suffix})": identifier
    for identifier, plugin in plugin_manager.plugin_registry.items()
}
input_select = pn.widgets.Select(name=_('Input Format: '), options=format_options)
swap_btn = pn.widgets.Button(name=_('Swap Input and Output'), height=35)
output_select = pn.widgets.Select(name=_('Output Format: '), options=format_options)
convert_btn = pn.widgets.Button(name=_('Convert'), button_type='primary')
progress_bar = pn.indicators.Progress(active=False, value=0)

def swap_selects(clicked: bool) -> None:
    if clicked:
        input_select.value, output_select.value = output_select.value, input_select.value

pn.bind(swap_selects, swap_btn, watch=True)

gspec = pn.GridSpec(sizing_mode="scale_both")

file_formats_grid = pn.GridSpec(sizing_mode="scale_both")
file_formats_grid[0:1, :] = pn.widgets.StaticText(value=_("Select File Formats"), styles={"font-size": "20px"})
file_formats_grid[1:2, :] = input_select
file_formats_grid[2:3, :] = output_select
file_formats_grid[3:4, :] = pn.Row(
    # pn.widgets.StaticText(value="Conversion mode:", styles={"font-size": "20px"}),
    # pn.widgets.RadioButtonGroup(name='Conversion mode', options={'Direct': 'direct', 'Merge': 'merge', 'Split': 'split'}, button_type='default'),
    swap_btn,
    convert_btn
)
file_formats_grid[4:5, :] = progress_bar


def start_conversion(event: Event) -> None:
    if file_selector.value is None or pn.state.busy:
        return
    total_values = len(file_selector.value)
    input_plugin = plugin_manager.plugin_registry[input_select.value]
    output_plugin = plugin_manager.plugin_registry[output_select.value]
    if (input_option_cls := get_type_hints(input_plugin.plugin_object.load).get("options", None)):
        input_option = input_option_cls.model_validate({x: getattr(input_options_param, x) for x in (input_options_param.param) if x != 'name'})
    else:
        return
    if (output_option_cls := get_type_hints(output_plugin.plugin_object.dump).get("options", None)):
        output_option = output_option_cls.model_validate({x: getattr(output_options_param, x) for x in (output_options_param.param) if x != 'name'})
    else:
        return
    has_error = False
    for i, value in enumerate(file_selector.value):
        child_file = pathlib.Path(value)
        target_file = child_file.with_suffix(f".{output_select.value}")
        try:
            project = input_plugin.plugin_object.load(child_file, input_option)
            for middleware_index in middleware_options_accordion.active:
                middleware_param = middleware_params[middleware_index]
                middleware = middleware_manager.plugin_registry[middleware_param.name]
                if middleware_option_cls := get_type_hints(middleware.plugin_object.process).get(
                    "options",
                ):
                    middleware_option = middleware_option_cls.model_validate({x: getattr(middleware_param, x) for x in (middleware_param.param) if x != 'name'})
                    project = middleware.process(project, middleware_option)
            output_plugin.plugin_object.dump(target_file, project, output_option)
        except Exception as e:
            has_error = True
            pn.state.notifications.error(f"Error converting {child_file}: {e}")
        progress_bar.value = int((i + 1) / total_values * 100)
    if has_error:
        pn.state.notifications.error(_("Conversion finished with errors"))
    else:
        pn.state.notifications.info(_("Conversion finished"))
    file_selector._refresh()

convert_btn.on_click(start_conversion)
gspec[0:1, 0:7] = file_formats_grid

file_selector = pn.widgets.FileSelector(base_dir, only_files=True)
gspec[1:2, 0:7] = file_selector

def pydantic_params(name: str, option_class: BaseModel) -> param.Parameterized:
    attrs = {}
    for option_key, field_info in option_class.model_fields.items():
        default_value = None if field_info.default is PydanticUndefined else field_info.default
        if issubclass(field_info.annotation, bool):
            attrs[option_key] = param.Boolean(default_value, label=_(field_info.title))
        elif issubclass(field_info.annotation, enum.Enum):
            if default_value is not None:
                default_value = default_value.value
            annotations = get_type_hints(field_info.annotation, include_extras=True)
            choices = {}
            for enum_item in field_info.annotation:
                if enum_item.name in annotations:
                    annotated_args = list(get_args(annotations[enum_item.name]))
                    if len(annotated_args) >= 2:
                        arg_0, enum_field = annotated_args[:2]
                    else:
                        continue
                    choices[_(enum_field.title)] = enum_item.value
            attrs[option_key] = param.Selector(objects=choices, default=default_value, label=_(field_info.title))
        elif issubclass(field_info.annotation, int):
            attrs[option_key] = param.Integer(default_value, label=_(field_info.title))
        elif issubclass(field_info.annotation, float):
            attrs[option_key] = param.Number(default_value, label=_(field_info.title))
        elif issubclass(field_info.annotation, Color):
            attrs[option_key] = param.Color(default_value, label=_(field_info.title))
        elif issubclass(field_info.annotation, (str, BaseComplexModel)):
            if issubclass(field_info.annotation, BaseComplexModel):
                default_value = field_info.annotation.default_repr()
            attrs[option_key] = param.String(default_value, label=_(field_info.title))
    return type(
        name,
        (param.Parameterized,),
        attrs
    )

def input_options_form(options: pn.widgets.Select):
    plugin = plugin_manager.plugin_registry[options.value]
    if option := get_type_hints(plugin.plugin_object.load).get("options", None):
        return pydantic_params(_("Input Options"), option)()
    return param.Parameterized()

input_options_card = pn.Column(name=_("Input Options"))
input_options_param = input_options_form(options=input_select)
input_options_card.append(pn.Param(input_options_param))

def input_options_changed(target, event) -> None:
    global input_options_param
    input_options_param = input_options_form(options=input_select)
    input_options_card[0] = pn.Param(input_options_param)

input_select.link(input_options_card, callbacks={"value": input_options_changed})


def output_options_form(options: pn.widgets.Select):
    plugin = plugin_manager.plugin_registry[options.value]
    if option := get_type_hints(plugin.plugin_object.dump).get("options", None):
        return pydantic_params(_("Output Options"), option)()
    return param.Parameterized()

output_options_card = pn.Column(name=_("Output Options"))
output_options_param = output_options_form(options=output_select)
output_options_card.append(pn.Param(output_options_param))

def output_options_changed(target, event) -> None:
    global output_options_param
    output_options_param = output_options_form(options=output_select)
    output_options_card[0] = pn.Param(output_options_param)

output_select.link(output_options_card, callbacks={"value": output_options_changed})


middleware_params = []

def middleware_options_form():
    for middleware_abbr, middleware in middleware_manager.plugin_registry.items():
        if (
            middleware.plugin_object is not None
            and hasattr(middleware.plugin_object, "process")
            and (
                middleware_option_class := get_type_hints(
                    middleware.plugin_object.process
                ).get(
                    "options",
                )
            )
        ):
            middleware_params.append(pydantic_params(middleware_abbr, middleware_option_class)(name=_(middleware.name)))
    return pn.Accordion(*middleware_params, name=_("Intermediate Processing"))

middleware_options_accordion = middleware_options_form()

tabs = pn.Tabs(
    input_options_card,
    middleware_options_accordion,
    output_options_card
)
tabs.active = 0
gspec[:, 7:10] = tabs

file_input = pn.widgets.FileInput(multiple=True)
upload_btn = pn.widgets.Button(name=_('Upload'), button_type='primary')

def download(values: Optional[list[str]]) -> None:
    buffer = io.BytesIO()
    if values:
        with zipfile.ZipFile(buffer, "w") as zip_file:
            for value in values:
                child_file = pathlib.Path(value)
                zip_file.writestr(
                    child_file.name,
                    child_file.read_bytes(),
                )
        buffer.seek(0)
    return buffer

download_btn = pn.widgets.FileDownload(
    callback=pn.bind(download, file_selector), filename='export.zip', icon="download"
)

def upload(clicked: bool) -> None:
    if clicked and file_input.value is not None:
        file_input.save([
            str(base_dir / filename)
            for filename in
            file_input.filename
        ])
        file_selector._refresh()

pn.bind(upload, upload_btn, watch=True)

files_flex_box = pn.FlexBox(
    pn.widgets.StaticText(value=_("Files operations"), styles={"font-size": "20px"}),
    file_input,
    pn.Row(
        upload_btn,
        download_btn,
    ),
    align_content="center", height=400
)

convert_menu_items = [(_('Convert'), 'convert'), None, (_('Swap Input and Output'), 'swap_input_output')]
convert_menu_btn = pn.widgets.MenuButton(name=_('Convert'), items=convert_menu_items, button_type='primary', width=150)

def on_convert_menu_click(event: Event) -> None:
    if event.new == "convert":
        start_conversion(event)
    elif event.new == "swap_input_output":
        swap_selects(True)

convert_menu_btn.on_click(on_convert_menu_click)

language_selector = pn.pane.HTML(f"""
<div>
    <a href="{pn.state.location.pathname}?lang=zh_CN">简体中文</a>
    |
    <a href="{pn.state.location.pathname}?lang=en_US">English</a>
</div>
""", sizing_mode="stretch_width")


template = pn.template.BootstrapTemplate(
    title='LibreSVIP',
    sidebar=[language_selector, files_flex_box],
    header=convert_menu_btn
)
template.main.append(gspec)

template.servable()

python -c "from panel.io.convert import BOKEH_CDN_WHL, PANEL_CDN_WHL;print(BOKEH_CDN_WHL);print(PANEL_CDN_WHL)" > requirements-panel.txt
uv pip compile requirements.in requirements-panel.txt --universal --no-annotate --no-header -o requirements.txt
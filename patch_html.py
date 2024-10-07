import ast
import glob
import pathlib
import os
import re


MICROPIP_INSTALL_PATTERN = re.compile(r"\s*await micropip\.install\((.*)\);")
PYODIDE_CDN_URL_PATTERN = re.compile(r"https://cdn\.jsdelivr\.net/pyodide/v([^/]+)/full/pyodide\.js")


if __name__ == "__main__":
    pyodide_version = "0.26.1"
    html_file = pathlib.Path("index.html")
    whl_files = glob.glob("*.whl")
    origin_text = html_file.read_text(encoding="utf-8")
    origin_text = PYODIDE_CDN_URL_PATTERN.sub("pyodide/pyodide.js", origin_text)
    origin_lines = origin_text.splitlines()
    if line_num := next(
        (i for i, line in enumerate(origin_lines) if MICROPIP_INSTALL_PATTERN.search(line) is not None), None
    ):
        line = origin_lines[line_num]
        install_args_str = MICROPIP_INSTALL_PATTERN.search(line).group(1)
        indent = line.partition("await micropip.install(")[0]
        install_args = ast.literal_eval(install_args_str)
        patched_lines = [
            f"{indent}await micropip.install({install_args[2:3]})",
            f"{indent}micropip.add_mock_package('packaging', '24.1')",
            f"{indent}await micropip.install({whl_files}, deps=False)",
        ]
        patched_lines = origin_lines[:line_num] + patched_lines + origin_lines[line_num + 1:]
        html_file.write_text(os.linesep.join(patched_lines), encoding="utf-8")

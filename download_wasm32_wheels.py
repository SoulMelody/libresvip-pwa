import json
import pathlib
import shutil
import subprocess
import os
import sys
import urllib.request

from pip._vendor.packaging.requirements import InvalidRequirement, Requirement


def download_wasm32_wheels() -> None:
    pyodide_version = "0.26.2"
    cwd = pathlib.Path().resolve()

    pyodide_dir = cwd / "pyodide"
    if not pyodide_dir.exists():
        pyodide_bundle_file = cwd / "pyodide.tar.bz2"
        if not pyodide_bundle_file.exists():
            bundle_url = (
                f"https://github.com/pyodide/pyodide/releases/download/{pyodide_version}/pyodide-{pyodide_version}.tar.bz2"
            )
            with urllib.request.urlopen(bundle_url) as response:
                pyodide_bundle_file.write_bytes(response.read())
        shutil.unpack_archive(pyodide_bundle_file)
    lock_data = json.loads((pyodide_dir / "pyodide-lock.json").read_bytes())

    os.chdir("dist")
    dist_dir = cwd / "dist"
    requirements_path = cwd / "requirements.txt"
    for requirement_str in ["panel", *requirements_path.read_text().splitlines()]:
        try:
            requirement = Requirement(requirement_str.replace("platform_python_implementation == 'CPython' and", ''))
        except InvalidRequirement:
            continue
        if requirement.name in lock_data["packages"] and (
            wheel_name := lock_data['packages'][requirement.name]['file_name']
        ) and (requirement.name == "pydantic" or not wheel_name.endswith("none-any.whl")):
            shutil.copy2(pyodide_dir / wheel_name, dist_dir)
        elif (
            requirement.marker is None or requirement.marker.evaluate(
                environment={
                    "platform_system": "Emscripten",
                    "sys_platform": "emscripten"
                }
            ) is True
        ):
            try:
                subprocess.check_call([sys.executable, "-m", "pip", "download", f"{requirement.name}{requirement.specifier}", "--no-deps", "--platform", "wasm32", "--only-binary", ":all:"])
            except subprocess.CalledProcessError:
                subprocess.check_call([sys.executable, "-m", "pip", "wheel", f"{requirement.name}{requirement.specifier}", "--no-binary", ":all:"])
    pyodide_core_bundle_file = dist_dir / "pyodide.tar.bz2"
    bundle_url = (
        f"https://github.com/pyodide/pyodide/releases/download/{pyodide_version}/pyodide-core-{pyodide_version}.tar.bz2"
    )
    with urllib.request.urlopen(bundle_url) as response:
        pyodide_core_bundle_file.write_bytes(response.read())
    shutil.unpack_archive(pyodide_core_bundle_file)
    pyodide_core_bundle_file.unlink()
    for micropip_dependency in [*pyodide_dir.glob("micropip-*.whl"), *pyodide_dir.glob("packaging-*.whl"), *pyodide_dir.glob("pyodide_http-*.whl")]:
        shutil.copy2(micropip_dependency, dist_dir/ "pyodide")


if __name__ == "__main__":
    download_wasm32_wheels()

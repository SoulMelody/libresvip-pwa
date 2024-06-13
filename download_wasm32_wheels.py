import json
import pathlib
import shutil
import subprocess
import urllib.request

from pip._vendor.packaging.requirements import InvalidRequirement, Requirement


def download_wasm32_wheels() -> None:
    cwd = pathlib.Path()

    pyodide_dir = cwd / "pyodide"
    if not pyodide_dir.exists():
        pyodide_bundle_file = cwd / "pyodide.tar.bz2"
        if not pyodide_bundle_file.exists():
            pyodide_version = "0.26.1"
            bundle_url = (
                f"https://github.com/pyodide/pyodide/releases/download/{pyodide_version}/pyodide-{pyodide_version}.tar.bz2"
            )
            with urllib.request.urlopen(bundle_url) as response:
                pyodide_bundle_file.write_bytes(response.read())
        shutil.unpack_archive(pyodide_bundle_file)
    lock_data = json.loads((pyodide_dir / "pyodide-lock.json").read_bytes())

    requirements_path = cwd / "requirements.txt"
    for requirement_str in ["panel", *requirements_path.read_text().splitlines()]:
        try:
            requirement = Requirement(requirement_str)
        except InvalidRequirement:
            continue
        if requirement.name in lock_data["packages"] and (
            wheel_name := lock_data['packages'][requirement.name]['file_name']
        ) and not wheel_name.endswith("none-any.whl"):
            shutil.copy2(pyodide_dir / wheel_name, wheel_name)
        elif (
            requirement.marker is None or (requirement.marker.evaluate(
                environment={"sys_platform": "emscripten"}
            ) is True and requirement.name != "pymediainfo")
        ):
            try:
                subprocess.check_call(["pip", "download", f"{requirement.name}{requirement.specifier}", "--no-deps", "--platform", "wasm32", "--only-binary", ":all:"])
            except subprocess.CalledProcessError:
                subprocess.check_call(["pip", "wheel", f"{requirement.name}{requirement.specifier}"])


if __name__ == "__main__":
    download_wasm32_wheels()

"""Ícones e associações dos formatos de arquivo: todo formato do pacote tem ícone nos 3 sistemas e está registrado."""

import subprocess
from pathlib import Path

from ttwtools import project

ROOT = Path(__file__).resolve().parent.parent
EXTS = {e.lstrip(".") for e in (project.TTWA_EXTENSION, project.TTWL_EXTENSION, project.TTWC_EXTENSION,
                                project.TTWCL_EXTENSION, project.TTWAL_EXTENSION, project.TTWT_EXTENSION)}


def test_every_format_has_icons_for_the_three_systems():
    for ext in EXTS:
        for kind in ("png", "ico", "icns"):
            f = ROOT / "build" / "fileicons" / f"{ext}.{kind}"
            assert f.is_file() and f.stat().st_size > 500, f
        assert (ROOT / "assets" / "icone" / "arquivos" / f"{ext}.svg").is_file()


def test_spec_and_scripts_register_every_format():
    spec = (ROOT / "build" / "ttwtools-app.spec").read_text(encoding="utf-8")
    bat = (ROOT / "build" / "assoc" / "registrar-associacoes.bat").read_text(encoding="utf-8")
    sh = (ROOT / "build" / "assoc" / "instalar-associacoes.sh").read_text(encoding="utf-8")
    for ext in EXTS:
        assert f"('{ext}'," in spec and f"'{ext}'" in spec, ext
        assert ext in bat.split("for %%E in (")[1].split(")")[0].split()
        assert ext in sh.split('EXTS="')[1].split('"')[0].split()


def test_linux_script_installs_mime_icons_and_desktop_entry(tmp_path):
    pkg = tmp_path / "TTWtools"
    (pkg / "icons").mkdir(parents=True)
    for ext in EXTS:
        (pkg / "icons" / f"{ext}.png").write_bytes((ROOT / "build" / "fileicons" / f"{ext}.png").read_bytes())
    (pkg / "icon.png").write_bytes((ROOT / "build" / "icon.png").read_bytes())
    script = pkg / "instalar-associacoes.sh"
    script.write_text((ROOT / "build" / "assoc" / "instalar-associacoes.sh").read_text(encoding="utf-8"), encoding="utf-8")
    env = {"XDG_DATA_HOME": str(tmp_path / "share"), "PATH": "/usr/bin:/bin"}
    subprocess.run(["sh", str(script)], check=True, env=env, capture_output=True)
    share = tmp_path / "share"
    xml = (share / "mime" / "packages" / "ttwtools.xml").read_text(encoding="utf-8")
    desktop = (share / "applications" / "ttwtools.desktop").read_text(encoding="utf-8")
    for ext in EXTS:
        assert f'pattern="*.{ext}"' in xml and f"application/x-ttwtools-{ext};" in desktop
        assert (share / "icons" / "hicolor" / "512x512" / "mimetypes" / f"application-x-ttwtools-{ext}.png").is_file()
    subprocess.run(["sh", str(script), "--remover"], check=True, env=env, capture_output=True)
    assert not (share / "mime" / "packages" / "ttwtools.xml").exists()

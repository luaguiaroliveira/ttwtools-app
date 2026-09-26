#!/usr/bin/env python3
"""
build.py — Build único do TTWtools (macOS, Windows, Linux).

Uso:
    python build/build.py                      # alvo = este sistema
    python build/build.py --arch x86_64        # macOS Intel sob Rosetta (em Mac Apple Silicon)
    python build/build.py --arch x86_64 --create-env   # cria o ambiente Intel antes
    python build/build.py --skip-frontend --no-package # só o PyInstaller + testes
    python build/build.py --install-deps --deps-only   # só instala as dependências (CI)

Etapas:
 1. escolhe o Python do alvo (o atual, ou o ambiente Intel sob Rosetta);
 2. aplica as versões fixas do alvo (build/constraints-<so>-<arq>.txt) e, no
    macOS, troca rodas de numpy/scipy que exijam macOS acima do mínimo;
 3. compila o frontend (npm ci && npm run build);
 4. grava app/_build_info.py (versão e commit; apagado ao fim);
 5. roda o PyInstaller com build/ttwtools-app.spec;
 6. roda `--selftest` no binário gerado e, no macOS, build/check_macos_min.py;
 7. empacota: dist/release/TTWtools-<versão>-<so>-<arq>.{dmg,zip,tar.gz}.
"""

from __future__ import annotations

import argparse
import os
import platform
import re
import shutil
import subprocess
import sys
import tarfile
import tomllib
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BUILD = ROOT / "build"

# Mínimo de macOS por arquitetura (decisão de 2026-09-26, Relato 0.1):
# as rodas arm64 do scipy exigem 12.3 (o Python 3.14 do conda, 12.1); o ambiente Intel (3.11) aceita 12.0.
MACOS_MIN = {"arm64": "12.3", "x86_64": "12.0"}
# Ambiente Intel usado sob Rosetta num Mac Apple Silicon (ver build_intel_local.sh antigo, commit a28c79a)
CONDA_X86 = Path.home() / "miniconda3-x86"
INTEL_ENV = "ttw311-x86"
INTEL_PYTHON_VERSION = "3.11"


def log(msg: str) -> None:
    print(f"==> {msg}", flush=True)


def run(cmd: list[str], **kw) -> subprocess.CompletedProcess:
    print("    $ " + " ".join(str(c) for c in cmd), flush=True)
    return subprocess.run([str(c) for c in cmd], check=True, **kw)


# ---------------------------------------------------------------------------
# Alvo
# ---------------------------------------------------------------------------

def host_os() -> str:
    return {"darwin": "macos", "win32": "windows"}.get(sys.platform, "linux")


def norm_arch(machine: str) -> str:
    m = machine.lower()
    if m in ("arm64", "aarch64"):
        return "arm64"
    if m in ("x86_64", "amd64", "x64"):
        return "x86_64"
    return m


class Target:
    def __init__(self, arch: str | None, python: str | None):
        self.os = host_os()
        self.arch = norm_arch(arch or platform.machine())
        self.rosetta = self.os == "macos" and self.arch == "x86_64" and norm_arch(platform.machine()) == "arm64"
        if python:
            self.python = Path(python)
        elif self.rosetta:
            self.python = CONDA_X86 / "envs" / INTEL_ENV / "bin" / "python"
        else:
            self.python = Path(sys.executable)
        self.prefix = ["arch", "-x86_64"] if self.rosetta else []

    @property
    def name(self) -> str:
        return f"{self.os}-{self.arch}"

    @property
    def macos_min(self) -> str | None:
        return MACOS_MIN.get(self.arch) if self.os == "macos" else None

    def py(self, *args) -> list[str]:
        return [*self.prefix, str(self.python), *map(str, args)]

    def pip(self, *args) -> list[str]:
        return self.py("-m", "pip", *args)


# ---------------------------------------------------------------------------
# Ambiente e versões fixas
# ---------------------------------------------------------------------------

def read_constraints(target: Target) -> dict[str, str]:
    path = BUILD / f"constraints-{target.name}.txt"
    pins: dict[str, str] = {}
    if path.is_file():
        for line in path.read_text().splitlines():
            line = line.split("#", 1)[0].strip()
            if "==" in line:
                name, ver = line.split("==", 1)
                pins[name.strip().lower()] = ver.strip()
    return pins


def environment_yml_pins() -> list[str]:
    """Pacotes pip do environment.yml, exceto os locais (instalados em modo editável)."""
    text = (ROOT / "environment.yml").read_text()
    pip_block = text.split("  - pip:", 1)[1]
    reqs = re.findall(r"^\s+- ([A-Za-z0-9_.\-]+==\S+)", pip_block, flags=re.M)
    return [r for r in reqs if r.split("==")[0].lower() not in ("ttwtools", "ttwtools-app", "en-core-web-sm")]


# Pacotes do environment.yml que só existem (ou só servem) em alguns sistemas
_MARKERS = {"pyobjc": '; sys_platform == "darwin"', "uvloop": '; sys_platform != "win32"'}
TORCH_CPU_INDEX = "https://download.pytorch.org/whl/cpu"


def requirements(target: Target) -> list[str]:
    """environment.yml (pip) com marcadores por sistema e as versões fixas do alvo."""
    pins = read_constraints(target)
    reqs = []
    for req in environment_yml_pins():
        name = req.split("==")[0].lower()
        if name in pins:
            continue
        marker = next((m for prefix, m in _MARKERS.items() if name.startswith(prefix)), "")
        reqs.append(req + marker)
    return reqs + [f"{n}=={v}" for n, v in pins.items()]


def install_deps(target: Target) -> None:
    reqs = requirements(target)
    log(f"Instalando dependências de {target.name} ({len(reqs)} pacotes)")
    run(target.pip("install", "--upgrade", "pip"))
    if target.os == "linux":
        # O torch do PyPI para Linux traz CUDA (vários GB); o pacote usa só CPU.
        torch = next(r for r in reqs if r.startswith("torch=="))
        run(target.pip("install", torch, "--index-url", TORCH_CPU_INDEX))
    run(target.pip("install", *reqs))
    run(target.pip("install", "--no-deps", "-e", ROOT / "libs" / "ttwtools", "-e", ROOT))
    run(target.py("-m", "spacy", "download", "en_core_web_sm"))


def create_intel_env(target: Target) -> None:
    conda = CONDA_X86 / "bin" / "conda"
    if not conda.is_file():
        raise SystemExit(
            f"Miniconda x86_64 não encontrado em {CONDA_X86}. Instale com:\n"
            "  curl -fsSLO https://repo.anaconda.com/miniconda/Miniconda3-latest-MacOSX-x86_64.sh\n"
            f"  arch -x86_64 bash Miniconda3-latest-MacOSX-x86_64.sh -b -p {CONDA_X86}"
        )
    if not target.python.is_file():
        log(f"Criando ambiente {INTEL_ENV} (Python {INTEL_PYTHON_VERSION}, x86_64)")
        run(["arch", "-x86_64", conda, "create", "-y", "-n", INTEL_ENV, f"python={INTEL_PYTHON_VERSION}"])
    install_deps(target)


def installed_version(target: Target, dist: str) -> str | None:
    out = subprocess.run(
        target.py("-c", f"import importlib.metadata as m; print(m.version({dist!r}))"),
        capture_output=True, text=True,
    )
    return out.stdout.strip() if out.returncode == 0 else None


def apply_constraints(target: Target) -> None:
    pins = read_constraints(target)
    wrong = [f"{n}=={v}" for n, v in pins.items() if installed_version(target, n) != v]
    if wrong:
        log(f"Ajustando versões fixas de {target.name}: {', '.join(wrong)}")
        run(target.pip("install", *wrong))


def fix_macos_wheels(target: Target) -> None:
    """Troca numpy/scipy por rodas que respeitem o mínimo de macOS.

    Num macOS novo o pip escolhe rodas `macosx_14_0` (Accelerate); o pip ignora
    MACOSX_DEPLOYMENT_TARGET na escolha, então baixamos a roda pela plataforma."""
    sys.path.insert(0, str(BUILD))
    from check_macos_min import scan, _version_tuple

    limit = _version_tuple(target.macos_min)
    plat_tag = f"macosx_{target.macos_min.split('.')[0]}_0_{target.arch}"
    pyver = subprocess.run(target.py("-c", "import sys; print(f'{sys.version_info[0]}.{sys.version_info[1]}')"),
                           capture_output=True, text=True, check=True).stdout.strip()
    wheelhouse = BUILD / "_wheelhouse" / target.name
    for dist, module in (("numpy", "numpy"), ("scipy", "scipy")):
        ver = installed_version(target, dist)
        if not ver:
            continue
        pkg_dir = subprocess.run(target.py("-c", f"import {module}, os; print(os.path.dirname({module}.__file__))"),
                                 capture_output=True, text=True, check=True).stdout.strip()
        too_new = [v for v, _ in scan(Path(pkg_dir)) if v and _version_tuple(v) > limit]
        if not too_new:
            continue
        log(f"{dist} {ver} exige macOS {max(too_new, key=_version_tuple)}; trocando pela roda {plat_tag}")
        shutil.rmtree(wheelhouse, ignore_errors=True)
        run(target.pip("download", f"{dist}=={ver}", "--no-deps", "--only-binary=:all:",
                       "--platform", plat_tag, "--python-version", pyver, "--implementation", "cp",
                       "-d", wheelhouse))
        wheel = next(wheelhouse.glob(f"{dist}-*.whl"))
        run(target.pip("install", "--no-deps", "--force-reinstall", wheel))


# ---------------------------------------------------------------------------
# Etapas do build
# ---------------------------------------------------------------------------

def project_version() -> str:
    return tomllib.loads((ROOT / "pyproject.toml").read_text())["project"]["version"]


def git_commit() -> str | None:
    out = subprocess.run(["git", "rev-parse", "--short", "HEAD"], cwd=ROOT, capture_output=True, text=True)
    if out.returncode != 0:
        return None
    return out.stdout.strip() or None


def build_frontend(src: Path) -> None:
    npm = shutil.which("npm")
    if not npm:
        log("AVISO: npm não encontrado; usando o frontend já compilado")
        return
    log(f"Compilando o frontend ({src.relative_to(ROOT)})")
    run([npm, "ci"], cwd=src)
    run([npm, "run", "build"], cwd=src)


def run_pyinstaller(target: Target, frontend_out: Path, dist_dir: Path, work_dir: Path) -> None:
    env = dict(os.environ, PYTHONNOUSERSITE="1", TTW_FRONTEND_DIR=str(frontend_out),
               TTW_VERSION=re.match(r"\d+\.\d+\.\d+", project_version()).group(0))
    if target.macos_min:
        env["MACOSX_DEPLOYMENT_TARGET"] = target.macos_min
    log(f"PyInstaller ({target.name})")
    run(target.py("-m", "PyInstaller", BUILD / "ttwtools-app.spec",
                  "--distpath", dist_dir, "--workpath", work_dir, "--noconfirm"), env=env)


def executable(target: Target, dist_dir: Path) -> Path:
    if target.os == "macos":
        return dist_dir / "TTWtools.app" / "Contents" / "MacOS" / "TTWtools"
    if target.os == "windows":
        return dist_dir / "TTWtools" / "TTWtools.exe"
    return dist_dir / "TTWtools" / "TTWtools"


def _load_semver():
    # Carrega app/_version.py sem importar o pacote app (que puxa FastAPI e as rotas).
    import importlib.util
    spec = importlib.util.spec_from_file_location("_ttw_version", ROOT / "app" / "_version.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod.semver


def package(target: Target, dist_dir: Path, version: str) -> Path:
    semver = _load_semver()

    out_dir = ROOT / "dist" / "release"
    out_dir.mkdir(parents=True, exist_ok=True)
    base = f"TTWtools-{semver(version)}-{target.os}-{target.arch}"
    if target.os == "macos":
        dmg = out_dir / f"{base}.dmg"
        staging = BUILD / "_dmg" / target.name
        shutil.rmtree(staging, ignore_errors=True)
        staging.mkdir(parents=True)
        run(["ditto", dist_dir / "TTWtools.app", staging / "TTWtools.app"])
        (staging / "Applications").symlink_to("/Applications")
        dmg.unlink(missing_ok=True)
        run(["hdiutil", "create", "-volname", f"TTWtools {semver(version)}", "-srcfolder", staging,
             "-ov", "-format", "UDZO", dmg])
        shutil.rmtree(staging, ignore_errors=True)
        return dmg
    if target.os == "windows":
        return Path(shutil.make_archive(str(out_dir / base), "zip", dist_dir, "TTWtools"))
    shutil.copy2(BUILD / "icon.png", dist_dir / "TTWtools" / "icon.png")
    tgz = out_dir / f"{base}.tar.gz"
    with tarfile.open(tgz, "w:gz") as tar:
        tar.add(dist_dir / "TTWtools", arcname=base)
    return tgz


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--arch", choices=["arm64", "x86_64"], help="só macOS; padrão: a da máquina")
    parser.add_argument("--python", help="Python do ambiente de build (padrão: o atual, ou o Intel sob Rosetta)")
    parser.add_argument("--create-env", action="store_true", help="cria/atualiza o ambiente Intel (macOS x86_64)")
    parser.add_argument("--install-deps", action="store_true",
                        help="instala as dependências do alvo (environment.yml + build/constraints-*.txt)")
    parser.add_argument("--deps-only", action="store_true", help="para depois de instalar/ajustar dependências")
    parser.add_argument("--frontend-src", default="frontend-src", help="pasta do código da interface")
    parser.add_argument("--frontend-out", default="frontend", help="pasta da interface compilada")
    parser.add_argument("--skip-frontend", action="store_true")
    parser.add_argument("--skip-env-fixes", action="store_true", help="não ajusta versões nem rodas do ambiente")
    parser.add_argument("--no-package", action="store_true")
    args = parser.parse_args()

    target = Target(args.arch, args.python)
    if args.arch and target.os != "macos" and target.arch != norm_arch(platform.machine()):
        raise SystemExit("--arch só permite outra arquitetura no macOS")
    if args.create_env:
        if not target.rosetta:
            raise SystemExit("--create-env só se aplica a --arch x86_64 num Mac Apple Silicon")
        create_intel_env(target)
    if not target.python.is_file():
        raise SystemExit(f"Python do alvo não encontrado: {target.python} (use --python ou --create-env)")

    version = project_version()
    log(f"TTWtools {version} → {target.name} (Python {target.python})")

    if args.install_deps:
        install_deps(target)
    if not args.skip_env_fixes:
        apply_constraints(target)
        if target.os == "macos":
            fix_macos_wheels(target)
    if args.deps_only:
        log("Dependências prontas")
        return 0
    if not args.skip_frontend:
        build_frontend(ROOT / args.frontend_src)

    frontend_out = ROOT / args.frontend_out
    dist_dir = ROOT / "dist" / target.name
    work_dir = BUILD / "_work" / target.name
    build_info = ROOT / "app" / "_build_info.py"
    build_info.write_text(f'VERSION = {version!r}\nCOMMIT = {git_commit()!r}\n', encoding="utf-8")
    try:
        run_pyinstaller(target, frontend_out, dist_dir, work_dir)
    finally:
        build_info.unlink(missing_ok=True)

    exe = executable(target, dist_dir)
    log(f"Autoteste: {exe.relative_to(ROOT)} --selftest")
    # O executável de janela no Windows não tem stdout: o autoteste grava também em arquivo.
    selftest_log = BUILD / "_work" / f"selftest-{target.name}.log"
    selftest_log.unlink(missing_ok=True)
    try:
        run([*target.prefix, exe, "--selftest"], timeout=600,
            env=dict(os.environ, TTW_SELFTEST_LOG=str(selftest_log)))
    finally:
        if target.os == "windows" and selftest_log.is_file():
            print(selftest_log.read_text(encoding="utf-8"), flush=True)

    if target.os == "macos":
        log(f"Conferindo o mínimo de macOS ({target.macos_min})")
        run([sys.executable, BUILD / "check_macos_min.py", dist_dir / "TTWtools.app",
             "--min", target.macos_min])

    if not args.no_package:
        pkg = package(target, dist_dir, version)
        log(f"Pacote: {pkg.relative_to(ROOT)} ({pkg.stat().st_size / 2**20:.0f} MB)")
    log("Build concluído")
    return 0


if __name__ == "__main__":
    sys.exit(main())

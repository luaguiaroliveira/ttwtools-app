#!/usr/bin/env python3
"""
linux_packages.py — pacotes nativos do Linux a partir da pasta portátil do build.

Uso (depois de `python build/build.py --shell tauri` e `python build/tauri_app.py`):
    python build/linux_packages.py                      # todos os formatos possíveis nesta máquina
    python build/linux_packages.py --formats deb,arch    # só alguns
    python build/linux_packages.py --tauri-appimage src-tauri/target/release/bundle/appimage/TTWtools_<v>_amd64.AppImage

Entrada: `dist/linux-x86_64/TTWtools/` (executável `TTWtools` + `server/`, feita pelo `tauri_app.py`).
Saída em `dist/release/`:

    TTWtools-<versão>-linux-x86_64.deb            Debian/Ubuntu (dpkg-deb, ou `ar` + tar)
    TTWtools-<versão>-linux-x86_64.rpm            Fedora/openSUSE (rpmbuild)
    TTWtools-<versão>-linux-x86_64.pkg.tar.zst    Arch/Manjaro (makepkg)
    TTWtools-<versão>-linux-x86_64.AppImage       qualquer distro (appimagetool)
    TTWtools-<versão>-linux-x86_64.tar.gz         pasta portátil (build.package)

Cada pacote de distribuição instala a pasta em `/opt/ttwtools`, com `/usr/bin/ttwtools`, entrada no menu,
ícone e os tipos MIME dos formatos do TTWtools (os mesmos nomes de `build/assoc/instalar-associacoes.sh`).
Compilar numa distribuição com glibc nova gera pacote que não roda nas antigas: cada pacote é feito no
contêiner da sua distribuição (ver CONTRIBUTING.md).
"""
from __future__ import annotations

import argparse
import importlib.util
import os
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BUILD = ROOT / "build"

PKG = "ttwtools"
MAINTAINER = "José Henrique Padovani <zepadovani@gmail.com>"
HOMEPAGE = "https://github.com/luaguiaroliveira/ttwtools-app"
SUMMARY = "Análise de corpora: etiquetagem, consultas, estatísticas e leitura"
DESCRIPTION = (
    "O TTWtools reúne num aplicativo local a preparação de corpora, a etiquetagem morfossintática "
    "(spaCy, Stanza, MFTE, BiberPlus), consultas e concordâncias, estatísticas (palavras-chave, "
    "KFA, dispersão) e a leitura dos textos etiquetados. Tudo roda na própria máquina: nada é enviado "
    "para a internet."
)
# Extensões dos formatos do TTWtools e a descrição de cada um (iguais às de build/assoc/instalar-associacoes.sh)
FORMATS = {
    "ttwa": "Projeto TTWtools (corpora e análises)",
    "ttwl": "Projeto TTWtools leve (textos numa pasta ao lado)",
    "ttwal": "Pacote leve de corpora do TTWtools",
    "ttwc": "Corpus do TTWtools (um corpus, textos dentro)",
    "ttwcl": "Corpus leve do TTWtools (textos numa pasta ao lado)",
    "ttwt": "Projeto TTWtools compactado",
}
# Dependências de sistema da casca Tauri (webkit2gtk-4.1 e GTK 3), pelo nome de cada distribuição
DEPS = {
    "deb": "libwebkit2gtk-4.1-0, libgtk-3-0",
    "rpm": ["webkit2gtk4.1", "gtk3"],
    "arch": ["webkit2gtk-4.1", "gtk3"],
}


def log(msg: str) -> None:
    print(f"==> {msg}", flush=True)


def run(cmd, **kw) -> subprocess.CompletedProcess:
    print("    $ " + " ".join(str(c) for c in cmd), flush=True)
    return subprocess.run([str(c) for c in cmd], check=True, **kw)


def load_build():
    spec = importlib.util.spec_from_file_location("ttw_build", BUILD / "build.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


# ---------------------------------------------------------------------------
# Árvore comum: /opt/ttwtools + /usr/{bin,share}
# ---------------------------------------------------------------------------

def desktop_entry(exec_path: str) -> str:
    mimes = "".join(f"application/x-ttwtools-{ext};" for ext in FORMATS)
    return (
        "[Desktop Entry]\n"
        "Type=Application\n"
        "Name=TTWtools\n"
        "Comment=Análise de corpora\n"
        "Comment[en]=Corpus analysis\n"
        f"Exec={exec_path} %f\n"
        f"Icon={PKG}\n"
        "Terminal=false\n"
        "Categories=Education;Science;\n"
        f"MimeType={mimes}\n"
        "StartupWMClass=TTWtools\n"
    )


def mime_xml() -> str:
    lines = ['<?xml version="1.0" encoding="UTF-8"?>',
             '<mime-info xmlns="http://www.freedesktop.org/standards/shared-mime-info">']
    for ext, desc in FORMATS.items():
        lines.append(f'  <mime-type type="application/x-ttwtools-{ext}">')
        lines.append(f"    <comment>{desc}</comment>")
        lines.append(f'    <glob pattern="*.{ext}"/>')
        lines.append(f'    <icon name="application-x-ttwtools-{ext}"/>')
        lines.append("  </mime-type>")
    lines.append("</mime-info>\n")
    return "\n".join(lines)


def copy644(src: Path, dest: Path) -> None:
    """Copia como arquivo comum (644): numa partição sem permissões POSIX tudo vem 775 e os pacotes ficam
    com documentação e ícones marcados como executáveis."""
    shutil.copy2(src, dest)
    dest.chmod(0o644)


def copy_payload(source: Path, dest: Path) -> None:
    """Copia a pasta portátil preservando os links simbólicos do PyInstaller (sem eles o tamanho dobra).

    Completa o que o `build.package` acrescenta só ao montar o .tar.gz, para que cada formato seja
    independente da ordem em que é gerado: LEIAME, licença e ícones."""
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copytree(source, dest, symlinks=True)
    for name in ("instalar-associacoes.sh",):   # a instalação do pacote já registra os formatos
        (dest / name).unlink(missing_ok=True)
    if (BUILD / "LEIAME.md").is_file():
        copy644(BUILD / "LEIAME.md", dest / "LEIAME.md")
    if (ROOT / "LICENSE").is_file():
        copy644(ROOT / "LICENSE", dest / "LICENSE.txt")
    copy644(BUILD / "icon.png", dest / "icon.png")
    (dest / "icons").mkdir(exist_ok=True)
    for ext in FORMATS:
        copy644(BUILD / "fileicons" / f"{ext}.png", dest / "icons" / f"{ext}.png")
    (dest / "TTWtools").chmod(0o755)


def write_shared(root: Path, exec_path: str, *, licenses_dir: bool = False) -> None:
    """Entrada no menu, ícones, tipos MIME e documentação em `root/usr/share` (e `root/usr/bin/ttwtools`)."""
    share = root / "usr" / "share"
    icons = share / "icons" / "hicolor" / "512x512"
    for sub in ("applications", "mime/packages", "doc/" + PKG):
        (share / sub).mkdir(parents=True, exist_ok=True)
    (icons / "apps").mkdir(parents=True, exist_ok=True)
    (icons / "mimetypes").mkdir(parents=True, exist_ok=True)

    desktop = share / "applications" / f"{PKG}.desktop"
    desktop.write_text(desktop_entry(exec_path), encoding="utf-8")
    desktop.chmod(0o644)
    mime = share / "mime" / "packages" / f"{PKG}.xml"
    mime.write_text(mime_xml(), encoding="utf-8")
    mime.chmod(0o644)
    copy644(BUILD / "icon.png", icons / "apps" / f"{PKG}.png")
    for ext in FORMATS:
        copy644(BUILD / "fileicons" / f"{ext}.png", icons / "mimetypes" / f"application-x-ttwtools-{ext}.png")
    if (BUILD / "LEIAME.md").is_file():
        copy644(BUILD / "LEIAME.md", share / "doc" / PKG / "LEIAME.md")
    if (ROOT / "LICENSE").is_file():
        copy644(ROOT / "LICENSE", share / "doc" / PKG / "LICENSE")
        if licenses_dir:                                    # convenção do Arch
            (share / "licenses" / PKG).mkdir(parents=True, exist_ok=True)
            copy644(ROOT / "LICENSE", share / "licenses" / PKG / "LICENSE")

    bindir = root / "usr" / "bin"
    bindir.mkdir(parents=True, exist_ok=True)
    link = bindir / PKG
    link.unlink(missing_ok=True)
    link.symlink_to(os.path.relpath(exec_path, "/usr/bin"))


def staging_tree(source: Path, work: Path, *, licenses_dir: bool = False) -> Path:
    """Árvore de instalação completa (`/opt/ttwtools` + `/usr/...`) usada por deb, rpm e Arch."""
    root = work / "root"
    shutil.rmtree(root, ignore_errors=True)
    copy_payload(source, root / "opt" / PKG)
    write_shared(root, f"/opt/{PKG}/TTWtools", licenses_dir=licenses_dir)
    return root


def tree_size_kb(root: Path) -> int:
    out = subprocess.run(["du", "-sk", str(root)], capture_output=True, text=True, check=True)
    return int(out.stdout.split()[0])


# Comandos de pós-instalação comuns ao deb e ao rpm (bancos de dados do desktop)
REFRESH = (
    "update-mime-database /usr/share/mime >/dev/null 2>&1 || true\n"
    "update-desktop-database /usr/share/applications >/dev/null 2>&1 || true\n"
    "gtk-update-icon-cache -f -t /usr/share/icons/hicolor >/dev/null 2>&1 || true\n"
)


# ---------------------------------------------------------------------------
# .deb
# ---------------------------------------------------------------------------

def make_deb(source: Path, out: Path, version: str, work: Path) -> Path:
    root = staging_tree(source, work)
    debian = root / "DEBIAN"
    debian.mkdir()
    (debian / "control").write_text(
        f"Package: {PKG}\n"
        f"Version: {version}-1\n"
        "Architecture: amd64\n"
        f"Maintainer: {MAINTAINER}\n"
        f"Installed-Size: {tree_size_kb(root)}\n"
        f"Depends: {DEPS['deb']}\n"
        "Section: science\n"
        "Priority: optional\n"
        f"Homepage: {HOMEPAGE}\n"
        f"Description: {SUMMARY}\n"
        + "".join(f" {line}\n" for line in _wrap(DESCRIPTION)),
        encoding="utf-8")
    for name, body in (("postinst", REFRESH), ("postrm", REFRESH)):
        script = debian / name
        script.write_text("#!/bin/sh\nset -e\n" + body, encoding="utf-8")
        script.chmod(0o755)

    pkg = out / f"TTWtools-{version}-linux-x86_64.deb"
    pkg.unlink(missing_ok=True)
    if shutil.which("dpkg-deb"):
        run(["dpkg-deb", "--root-owner-group", "-Zxz", "--build", root, pkg])
        return pkg
    # Sem dpkg (ex.: Arch): o .deb é um arquivo `ar` com debian-binary, control.tar.gz e data.tar.xz
    log("dpkg-deb não encontrado; montando o .deb com ar e tar")
    (work / "debian-binary").write_text("2.0\n")
    owner = ["--owner=root", "--group=root", "--numeric-owner"]
    run(["tar", "-czf", work / "control.tar.gz", "-C", debian, *owner, "."])
    members = sorted(p.name for p in root.iterdir() if p.name != "DEBIAN")
    run(["tar", "-cJf", work / "data.tar.xz", "-C", root, *owner, *members],
        env=dict(os.environ, XZ_OPT="-T0 -6"))
    run(["ar", "rc", pkg, work / "debian-binary", work / "control.tar.gz", work / "data.tar.xz"])
    return pkg


def _wrap(text: str, width: int = 78) -> list[str]:
    import textwrap
    return textwrap.wrap(text, width)


# ---------------------------------------------------------------------------
# .rpm
# ---------------------------------------------------------------------------

def make_rpm(source: Path, out: Path, version: str, work: Path) -> Path:
    if not shutil.which("rpmbuild"):
        raise SystemExit("rpmbuild não encontrado (Fedora: dnf install rpm-build; Arch: pacman -S rpm-tools)")
    root = staging_tree(source, work)
    top = work / "rpmbuild"
    for sub in ("BUILD", "RPMS", "SPECS", "SOURCES", "BUILDROOT"):
        (top / sub).mkdir(parents=True, exist_ok=True)
    spec = top / "SPECS" / f"{PKG}.spec"
    spec.write_text(
        f"Name:           {PKG}\n"
        f"Version:        {version}\n"
        "Release:        1\n"
        f"Summary:        {SUMMARY}\n"
        "License:        GPL-3.0-or-later\n"
        f"URL:            {HOMEPAGE}\n"
        "BuildArch:      x86_64\n"
        + "".join(f"Requires:       {d}\n" for d in DEPS["rpm"]) +
        "AutoReqProv:    no\n"            # o servidor do PyInstaller traz as próprias bibliotecas
        "%global _build_id_links none\n"
        "%global __brp_mangle_shebangs %{nil}\n"
        "%global __brp_strip %{nil}\n"
        "%global __brp_strip_static_archive %{nil}\n"
        "%global __brp_strip_comment_note %{nil}\n"
        "%global __brp_check_rpaths %{nil}\n"
        "%global __os_install_post %{nil}\n"
        "\n%description\n" + DESCRIPTION + "\n"
        "\n%install\n"
        f"cp -a {root}/. %{{buildroot}}/\n"
        "\n%files\n"
        f"/opt/{PKG}\n"
        f"/usr/bin/{PKG}\n"
        f"/usr/share/applications/{PKG}.desktop\n"
        f"/usr/share/mime/packages/{PKG}.xml\n"
        f"/usr/share/icons/hicolor/512x512/apps/{PKG}.png\n"
        "/usr/share/icons/hicolor/512x512/mimetypes/application-x-ttwtools-*.png\n"
        f"%doc /usr/share/doc/{PKG}\n"
        "\n%post\n" + REFRESH +
        "\n%postun\n" + REFRESH,
        encoding="utf-8")
    run(["rpmbuild", "-bb", "--define", f"_topdir {top}", spec])
    built = next((top / "RPMS").rglob("*.rpm"))
    pkg = out / f"TTWtools-{version}-linux-x86_64.rpm"
    pkg.unlink(missing_ok=True)
    shutil.move(built, pkg)
    return pkg


# ---------------------------------------------------------------------------
# .pkg.tar.zst (Arch/Manjaro)
# ---------------------------------------------------------------------------

def make_arch(source: Path, out: Path, version: str, work: Path) -> Path:
    if not shutil.which("makepkg"):
        raise SystemExit("makepkg não encontrado (só no Arch/Manjaro)")
    root = staging_tree(source, work, licenses_dir=True)
    pkgdir = work / "makepkg"
    shutil.rmtree(pkgdir, ignore_errors=True)
    pkgdir.mkdir(parents=True)
    deps = " ".join(f"'{d}'" for d in DEPS["arch"])
    (pkgdir / "PKGBUILD").write_text(
        f"# Gerado por build/linux_packages.py — empacota a pasta já compilada\n"
        f"pkgname={PKG}\n"
        f"pkgver={version}\n"
        "pkgrel=1\n"
        f"pkgdesc=\"{SUMMARY}\"\n"
        "arch=('x86_64')\n"
        f"url=\"{HOMEPAGE}\"\n"
        "license=('GPL-3.0-or-later')\n"
        f"depends=({deps})\n"
        "options=('!strip' '!debug' 'staticlibs')\n"
        "package() {\n"
        f"  cp -a \"{root}\"/. \"$pkgdir\"/\n"
        "}\n",
        encoding="utf-8")
    env = dict(os.environ, PKGDEST=str(pkgdir), PKGEXT=".pkg.tar.zst", SRCDEST=str(pkgdir), PACKAGER=MAINTAINER,
               BUILDDIR=str(pkgdir / "build"), COMPRESSZST="zstd -c -T0 -10 -")
    run(["makepkg", "-f", "--nodeps", "--noconfirm"], cwd=pkgdir, env=env)
    built = next(pkgdir.glob("*.pkg.tar.zst"))
    pkg = out / f"TTWtools-{version}-linux-x86_64.pkg.tar.zst"
    pkg.unlink(missing_ok=True)
    shutil.move(built, pkg)
    return pkg


# ---------------------------------------------------------------------------
# .AppImage
# ---------------------------------------------------------------------------

def appimagetool() -> list[str]:
    tool = shutil.which("appimagetool")
    if tool:
        return [tool]
    cached = next((Path.home() / ".cache" / "tauri").glob("appimagetool*.AppImage"), None) if (Path.home() / ".cache" / "tauri").is_dir() else None
    if cached:
        cached.chmod(0o755)
        return [str(cached), "--appimage-extract-and-run"]
    raise SystemExit("appimagetool não encontrado: baixe appimagetool-x86_64.AppImage "
                     "(https://github.com/AppImage/appimagetool/releases) e ponha no PATH")


def make_appimage(source: Path, out: Path, version: str, work: Path, tauri_appimage: Path | None) -> Path:
    """Injeta o servidor Python no `.AppImage` que o próprio Tauri já monta (WebKit embutido); sem ele,
    monta um AppDir simples que depende do webkit2gtk-4.1 do sistema.

    O empacotador de AppImage do Tauri (linuxdeploy) gera o `.AppImage` final direto, sem deixar a pasta
    `AppDir` para trás — por isso a única forma de acrescentar o servidor é extrair o pacote já pronto,
    copiar `server/` ao lado do executável real (onde `resolve_server` em `main.rs` já procura) e
    reempacotar; os tipos MIME dos formatos do TTWtools entram à parte (abrir um `.ttwa` com o AppImage
    como "aplicativo externo" funciona; o registro automático dependeria do AppImageLauncher do usuário)."""
    staged = work / "AppDir"
    shutil.rmtree(staged, ignore_errors=True)
    if tauri_appimage:
        tauri_appimage = tauri_appimage.resolve()      # --appimage-extract roda com cwd=extract_dir
        log(f"Extraindo o AppImage do Tauri: {tauri_appimage.name}")
        extract_dir = work / "_extract"
        shutil.rmtree(extract_dir, ignore_errors=True)
        extract_dir.mkdir(parents=True)
        run([tauri_appimage, "--appimage-extract"], cwd=extract_dir)
        shutil.move(extract_dir / "squashfs-root", staged)
        bindir = staged / "usr" / "bin"
        # o nome do binário dentro do AppImage vem do pacote Cargo (`ttwtools-tauri`), não do productName
        # do tauri.conf.json (sem `mainBinaryName` configurado); pega o único executável de `usr/bin`.
        candidatos = [f for f in bindir.iterdir() if f.is_file() and os.access(f, os.X_OK)] if bindir.is_dir() else []
        if len(candidatos) != 1:
            raise SystemExit(f"{bindir} não tem exatamente um executável (achei: {[f.name for f in candidatos]})")
        exe = candidatos[0]
        server = bindir / "server"       # resolve_server procura `server/` ao lado do executável
        shutil.rmtree(server, ignore_errors=True)
        shutil.copytree(source / "server", server, symlinks=True)
        for name in ("LEIAME.md", "LICENSE.txt", "icons"):
            if (source / name).exists():
                dest = bindir / name
                shutil.rmtree(dest, ignore_errors=True) if dest.is_dir() else dest.unlink(missing_ok=True)
                (shutil.copytree if (source / name).is_dir() else shutil.copy2)(source / name, dest)
        # o .desktop que o linuxdeploy já gerou funciona (ícone, StartupWMClass); só ganha os tipos MIME
        desktop = next(staged.glob("*.desktop"))
        texto = desktop.read_text(encoding="utf-8")
        mimes = "".join(f"application/x-ttwtools-{ext};" for ext in FORMATS)
        if "MimeType=" in texto:
            texto = re.sub(r"(?m)^MimeType=.*$", f"MimeType={mimes}", texto)
        else:
            texto += f"MimeType={mimes}\n"
        if "%f" not in texto:
            texto = re.sub(r"(?m)^(Exec=.*?)\s*$", r"\1 %f", texto)
        desktop.write_text(texto, encoding="utf-8")
        for app_desktop in (staged / "usr" / "share" / "applications").glob("*.desktop"):
            app_desktop.write_text(texto, encoding="utf-8")
    else:
        log("sem o AppImage do Tauri: dependendo do webkit2gtk-4.1 do sistema")
        copy_payload(source, staged / "opt" / PKG)
        write_shared(staged, f"/opt/{PKG}/TTWtools")
        (staged / "AppRun").write_text(
            '#!/bin/sh\nHERE=$(dirname "$(readlink -f "$0")")\nexec "$HERE/opt/ttwtools/TTWtools" "$@"\n',
            encoding="utf-8")
        (staged / "AppRun").chmod(0o755)
        (staged / f"{PKG}.desktop").write_text(desktop_entry(PKG), encoding="utf-8")
        shutil.copy2(BUILD / "icon.png", staged / f"{PKG}.png")
        shutil.copy2(BUILD / "icon.png", staged / ".DirIcon")
        share = staged / "usr" / "share"
        (share / "applications").mkdir(parents=True, exist_ok=True)
        shutil.copy2(staged / f"{PKG}.desktop", share / "applications" / f"{PKG}.desktop")
    # os tipos MIME ficam disponíveis em usr/share/mime mesmo sem o sistema ter o pacote instalado
    mime_dir = staged / "usr" / "share" / "mime" / "packages"
    mime_dir.mkdir(parents=True, exist_ok=True)
    (mime_dir / f"{PKG}.xml").write_text(mime_xml(), encoding="utf-8")
    icons_dir = staged / "usr" / "share" / "icons" / "hicolor" / "512x512" / "mimetypes"
    icons_dir.mkdir(parents=True, exist_ok=True)
    for ext in FORMATS:
        shutil.copy2(BUILD / "fileicons" / f"{ext}.png", icons_dir / f"application-x-ttwtools-{ext}.png")

    # --appimage-extract preserva as permissões originais (algumas pastas do GTK saem 0700); o appimagetool
    # recusa empacotar o que outros usuários não conseguiriam ler/executar.
    run(["chmod", "-R", "a+rX", staged])
    pkg = out / f"TTWtools-{version}-linux-x86_64.AppImage"
    pkg.unlink(missing_ok=True)
    run([*appimagetool(), staged, pkg], env=dict(os.environ, ARCH="x86_64"))
    pkg.chmod(0o755)
    return pkg


# ---------------------------------------------------------------------------

def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--formats", default="tar,deb,rpm,arch,appimage",
                    help="tar,deb,rpm,arch,appimage (padrão: todos; pula os que a máquina não tem ferramenta)")
    ap.add_argument("--source", default=None, help="pasta portátil (padrão: dist/linux-x86_64/TTWtools)")
    ap.add_argument("--tauri-appimage", default=None, help="o .AppImage que o Tauri já montou (WebKit embutido), para injetar o servidor")
    ap.add_argument("--work", default=None, help="pasta de trabalho (padrão: temporária)")
    ap.add_argument("--keep-going", action="store_true", help="não para no primeiro formato que falhar")
    args = ap.parse_args()

    b = load_build()
    version = b._load_semver()(b.project_version())
    source = Path(args.source) if args.source else ROOT / "dist" / "linux-x86_64" / "TTWtools"
    if not (source / "TTWtools").is_file():
        raise SystemExit(f"falta {source}/TTWtools: rode `python build/build.py --shell tauri` e "
                         "`python build/tauri_app.py` antes")
    out = ROOT / "dist" / "release"
    out.mkdir(parents=True, exist_ok=True)
    tmp = None
    if args.work:
        work = Path(args.work)
        work.mkdir(parents=True, exist_ok=True)
    else:
        tmp = tempfile.TemporaryDirectory(prefix="ttw-pkg-")
        work = Path(tmp.name)

    wanted = [f.strip() for f in args.formats.split(",") if f.strip()]
    made, failed = [], []
    for fmt in wanted:
        log(f"Pacote {fmt}")
        sub = work / fmt
        sub.mkdir(parents=True, exist_ok=True)
        try:
            if fmt == "tar":
                pkg = b.package(b.Target(None, sys.executable), source.parent, b.project_version())
            elif fmt == "deb":
                pkg = make_deb(source, out, version, sub)
            elif fmt == "rpm":
                pkg = make_rpm(source, out, version, sub)
            elif fmt == "arch":
                pkg = make_arch(source, out, version, sub)
            elif fmt == "appimage":
                pkg = make_appimage(source, out, version, sub, Path(args.tauri_appimage) if args.tauri_appimage else None)
            else:
                raise SystemExit(f"formato desconhecido: {fmt}")
            log(f"{pkg.relative_to(ROOT)} ({pkg.stat().st_size / 2**20:.0f} MB)")
            made.append(pkg)
        except (SystemExit, subprocess.CalledProcessError) as erro:
            if not args.keep_going:
                raise
            print(f"!!! {fmt} falhou: {erro}", file=sys.stderr, flush=True)
            failed.append(fmt)
        finally:
            shutil.rmtree(sub, ignore_errors=True)
    if tmp:
        tmp.cleanup()
    log("Pacotes: " + ", ".join(p.name for p in made) + (f" (falharam: {', '.join(failed)})" if failed else ""))
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())

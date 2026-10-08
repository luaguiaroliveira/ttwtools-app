#!/usr/bin/env python3
"""make_msi.py — instalador .msi do TTWtools para Windows (WiX Toolset 3.x).

Uso (depois de `python build/build.py`, que gera dist/windows-x86_64/TTWtools):
    python build/make_msi.py [--wix PASTA_DO_WIX] [--src PASTA] [--out ARQUIVO.msi]

O WiX 3.14 portátil (wix314-binaries.zip, github.com/wixtoolset/wix3/releases) basta: descompacte e passe a
pasta em --wix ou na variável WIX_BIN (ou ponha candle.exe/light.exe no PATH).

O instalador é **por usuário**: não pede administrador, instala em %LOCALAPPDATA%\\Programs\\TTWtools, põe um atalho
no Menu Iniciar, associa .ttwa .ttwl .ttwal .ttwc .ttwcl .ttwt ao aplicativo (com os ícones dos formatos, como
registrar-associacoes.bat) e atualiza a versão anterior sozinho. Sem diálogos (barra de andamento do Windows).
A pasta de dados do usuário não fica na pasta de instalação e não é apagada ao desinstalar.
"""

from __future__ import annotations

import argparse
import os
import re
import shutil
import subprocess
import sys
import uuid
from pathlib import Path
from xml.sax.saxutils import quoteattr

ROOT = Path(__file__).resolve().parent.parent
BUILD = ROOT / "build"

# GUIDs fixos: UPGRADE_CODE identifica o produto entre versões; o namespace deixa os GUIDs dos componentes
# estáveis (mesmo arquivo = mesmo componente), o que permite atualizar e reparar corretamente.
UPGRADE_CODE = "7D2F6A1E-3B54-4C0F-9E8A-5A1D4C7B2E90"
NAMESPACE = uuid.UUID("0c9a9b52-6c1b-4a67-b0b4-8f6d3f1e5a27")
EXTS = (("ttwa", "TTW Archive"), ("ttwl", "TTW Light Project"), ("ttwal", "TTW Light Corpus Package"),
        ("ttwc", "TTW Corpus"), ("ttwcl", "TTW Light Corpus"), ("ttwt", "TTW Compressed Archive"))
SKIP = {"registrar-associacoes.bat", "remover-associacoes.bat"}      # o instalador já faz isso


def project_version() -> str:
    text = (ROOT / "pyproject.toml").read_text(encoding="utf-8")
    m = re.search(r'^version\s*=\s*"(\d+\.\d+\.\d+)', text, flags=re.M)
    if not m:
        raise SystemExit("versão não encontrada em pyproject.toml")
    return m.group(1)


def find_tool(name: str, wix: str | None) -> str:
    for base in (wix, os.environ.get("WIX_BIN")):
        if base and (Path(base) / name).is_file():
            return str(Path(base) / name)
        if base and (Path(base) / "bin" / name).is_file():
            return str(Path(base) / "bin" / name)
    found = shutil.which(name)
    if found:
        return found
    raise SystemExit(f"{name} não encontrado: passe --wix PASTA (WiX 3.x) ou defina WIX_BIN.")


class Harvest:
    """Percorre a pasta do pacote e escreve diretórios, componentes e arquivos do WiX."""

    def __init__(self, src: Path):
        self.src = src
        self.lines: list[str] = []
        self.component_ids: list[str] = []
        self.n = 0

    def _id(self, prefix: str) -> str:
        self.n += 1
        return f"{prefix}{self.n}"

    def walk(self, folder: Path, indent: int) -> None:
        pad = "  " * indent
        for entry in sorted(folder.iterdir(), key=lambda p: p.name.lower()):
            if entry.is_dir():
                self.lines.append(f'{pad}<Directory Id="{self._id("d")}" Name={quoteattr(entry.name)}>')
                self.walk(entry, indent + 1)
                self.lines.append(f"{pad}</Directory>")
        for entry in sorted(folder.iterdir(), key=lambda p: p.name.lower()):
            if entry.is_file() and not (folder == self.src and entry.name in SKIP):
                rel = entry.relative_to(self.src).as_posix().lower()
                cid = self._id("c")
                self.component_ids.append(cid)
                guid = str(uuid.uuid5(NAMESPACE, rel)).upper()
                self.lines.append(f'{pad}<Component Id="{cid}" Guid="{{{guid}}}">')
                self.lines.append(f'{pad}  <File Id="{self._id("f")}" Source={quoteattr(str(entry))} KeyPath="yes"/>')
                self.lines.append(f"{pad}</Component>")


def assoc_xml() -> str:
    out = []
    for ext, desc in EXTS:
        k = f"Software\\Classes\\TTWtools.{ext}"
        out.append(f"""      <Component Id="assoc_{ext}" Guid="{{{str(uuid.uuid5(NAMESPACE, 'assoc-' + ext)).upper()}}}">
        <RegistryKey Root="HKCU" Key="Software\\Classes\\.{ext}"><RegistryValue Type="string" Value="TTWtools.{ext}" KeyPath="yes"/></RegistryKey>
        <RegistryKey Root="HKCU" Key="{k}"><RegistryValue Type="string" Value="{desc} (.{ext})"/></RegistryKey>
        <RegistryKey Root="HKCU" Key="{k}\\DefaultIcon"><RegistryValue Type="string" Value="[INSTALLFOLDER]icons\\{ext}.ico"/></RegistryKey>
        <RegistryKey Root="HKCU" Key="{k}\\shell\\open\\command"><RegistryValue Type="string" Value="&quot;[INSTALLFOLDER]TTWtools.exe&quot; &quot;%1&quot;"/></RegistryKey>
      </Component>""")
    return "\n".join(out)


def build_wxs(src: Path, version: str) -> str:
    h = Harvest(src)
    h.walk(src, 5)
    refs = "\n".join(f'      <ComponentRef Id="{c}"/>' for c in h.component_ids)
    assoc_refs = "\n".join(f'      <ComponentRef Id="assoc_{e}"/>' for e, _ in EXTS)
    return f"""<?xml version="1.0" encoding="utf-8"?>
<Wix xmlns="http://schemas.microsoft.com/wix/2006/wi">
  <Product Id="*" Name="TTWtools" Language="1033" Version="{version}" Manufacturer="TTWtools"
           UpgradeCode="{{{UPGRADE_CODE}}}">
    <Package InstallerVersion="500" Compressed="yes" InstallScope="perUser" Platform="x64"
             Description="TTWtools {version}" Comments="Instalacao por usuario, sem administrador."/>
    <MajorUpgrade DowngradeErrorMessage="Uma versao mais nova do TTWtools ja esta instalada."/>
    <MediaTemplate EmbedCab="yes" CompressionLevel="mszip"/>
    <Icon Id="app.ico" SourceFile={quoteattr(str(BUILD / "icon.ico"))}/>
    <Property Id="ARPPRODUCTICON" Value="app.ico"/>
    <Property Id="ARPNOREPAIR" Value="1"/>

    <Directory Id="TARGETDIR" Name="SourceDir">
      <Directory Id="LocalAppDataFolder">
        <Directory Id="ProgramsDir" Name="Programs">
          <Directory Id="INSTALLFOLDER" Name="TTWtools">
{chr(10).join(h.lines)}
          </Directory>
        </Directory>
      </Directory>
      <Directory Id="ProgramMenuFolder">
        <Directory Id="MenuDir" Name="TTWtools">
          <Component Id="menu" Guid="{{{str(uuid.uuid5(NAMESPACE, 'menu')).upper()}}}">
            <Shortcut Id="menulink" Name="TTWtools" Target="[INSTALLFOLDER]TTWtools.exe" WorkingDirectory="INSTALLFOLDER"
                      Icon="app.ico"/>
            <RemoveFolder Id="rmmenu" On="uninstall"/>
            <RegistryValue Root="HKCU" Key="Software\\TTWtools" Name="menu" Type="integer" Value="1" KeyPath="yes"/>
          </Component>
        </Directory>
      </Directory>
    </Directory>

    <DirectoryRef Id="INSTALLFOLDER">
{assoc_xml()}
    </DirectoryRef>

    <Feature Id="Main" Title="TTWtools" Level="1">
{refs}
      <ComponentRef Id="menu"/>
{assoc_refs}
    </Feature>
  </Product>
</Wix>
"""


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--wix", help="pasta do WiX 3.x (candle.exe, light.exe)")
    ap.add_argument("--src", default=str(ROOT / "dist" / "windows-x86_64" / "TTWtools"), help="pasta do pacote")
    ap.add_argument("--out", help="arquivo .msi de saída (padrão: dist/release/TTWtools-<versão>-windows-x86_64.msi)")
    args = ap.parse_args()
    if sys.platform != "win32":
        raise SystemExit("o .msi só é gerado no Windows")
    src = Path(args.src).resolve()
    if not (src / "TTWtools.exe").is_file():
        raise SystemExit(f"{src}\\TTWtools.exe não existe: rode `python build/build.py` antes.")
    version = project_version()
    out = Path(args.out) if args.out else ROOT / "dist" / "release" / f"TTWtools-{version}-windows-x86_64.msi"
    out.parent.mkdir(parents=True, exist_ok=True)
    work = ROOT / "build" / "_msi"
    shutil.rmtree(work, ignore_errors=True)
    work.mkdir(parents=True)

    wxs = work / "ttwtools.wxs"
    wxs.write_text(build_wxs(src, version), encoding="utf-8")
    candle, light = find_tool("candle.exe", args.wix), find_tool("light.exe", args.wix)
    print("==> candle", flush=True)
    subprocess.run([candle, "-nologo", "-arch", "x64", "-out", str(work / "ttwtools.wixobj"), str(wxs)], check=True)
    print("==> light (compacta ~700 MB: leva alguns minutos)", flush=True)
    # ICE38/ICE64/ICE91: avisos de instalação por usuário (arquivos no perfil); ICE03 etc. seguem ligados
    subprocess.run([light, "-nologo", "-sice:ICE38", "-sice:ICE64", "-sice:ICE91", "-sice:ICE57",
                    "-out", str(out), str(work / "ttwtools.wixobj")], check=True)
    shutil.rmtree(work, ignore_errors=True)
    print(f"==> {out} ({out.stat().st_size / 1e6:.0f} MB)")
    return 0


if __name__ == "__main__":
    sys.exit(main())

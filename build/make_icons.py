"""Gera icon.png (Linux), icon.ico (Windows) e icon.icns (macOS) a partir de icon.svg.

Requer Inkscape (ou rsvg-convert) e, para o .ico, ImageMagick; o .icns exige macOS (iconutil).
Uso: python build/make_icons.py
"""
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

BUILD = Path(__file__).resolve().parent
SVG = BUILD / "icon.svg"
INKSCAPE = shutil.which("inkscape") or "/Applications/Inkscape.app/Contents/MacOS/inkscape"


def render(size: int, out: Path) -> None:
    if Path(INKSCAPE).exists():
        cmd = [INKSCAPE, str(SVG), "-w", str(size), "-h", str(size), "-o", str(out)]
    elif shutil.which("rsvg-convert"):
        cmd = ["rsvg-convert", "-w", str(size), "-h", str(size), "-o", str(out), str(SVG)]
    else:
        raise SystemExit("Instale Inkscape ou rsvg-convert")
    subprocess.run(cmd, check=True, capture_output=True)


def main() -> None:
    render(512, BUILD / "icon.png")
    with tempfile.TemporaryDirectory() as tmp:
        tmp = Path(tmp)
        sizes = [16, 24, 32, 48, 64, 128, 256]
        for s in sizes:
            render(s, tmp / f"{s}.png")
        magick = shutil.which("magick") or shutil.which("convert")
        if magick:
            subprocess.run([magick, *[str(tmp / f"{s}.png") for s in sizes], str(BUILD / "icon.ico")], check=True)
        else:
            print("ImageMagick ausente: icon.ico não foi gerado", file=sys.stderr)
        if sys.platform == "darwin":
            iconset = tmp / "icon.iconset"
            iconset.mkdir()
            for base in (16, 32, 128, 256, 512):
                render(base, iconset / f"icon_{base}x{base}.png")
                render(base * 2, iconset / f"icon_{base}x{base}@2x.png")
            subprocess.run(["iconutil", "-c", "icns", str(iconset), "-o", str(BUILD / "icon.icns")], check=True)
        else:
            print("Fora do macOS: icon.icns não foi gerado", file=sys.stderr)


if __name__ == "__main__":
    main()

"""Gera os ícones dos formatos de arquivo do TTWtools (SVG em assets/icone/arquivos/, PNG/ICO/ICNS em build/fileicons/).

Linguagem visual (a mesma do ícone do aplicativo: grafite, branco e laranja):
  - página grafite com a dobra no canto, "TTW" laranja no alto e a extensão em branco embaixo;
  - BLOCO ÚNICO de folhas  = um corpus só        (.ttwc, .ttwcl);
  - BLOCOS LADO A LADO     = vários corpora      (.ttwa, .ttwl, .ttwal);
  - folhas PREENCHIDAS     = texto dentro do arquivo (.ttwa, .ttwc);
  - folhas SÓ CONTORNO     = arquivo leve, texto numa pasta ao lado (.ttwl, .ttwcl, .ttwal);
  - setas para dentro      = compactado (.ttwt).
Uso: python assets/icone/make_file_icons.py   (Inkscape ou rsvg-convert; ImageMagick para .ico; iconutil no macOS para .icns)
"""
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
OUT_SVG = HERE / "arquivos"
BUILD = HERE.parent.parent / "build" / "fileicons"

ORANGE, ORANGE_D, WHITE = "#F26A1B", "#FF8533", "#F2F2F2"
GRAPH, GRAPH_D, GRAPH_L = "#2B2926", "#1C1B1A", "#47443F"

# extensão -> (blocos, preenchido?, compactado?)
FORMATS = {
    "ttwa": (3, True, False),
    "ttwl": (3, False, False),
    "ttwal": (2, False, False),
    "ttwc": (1, True, False),
    "ttwcl": (1, False, False),
    "ttwt": (3, True, True),
}


def sheet(x, y, w, h, front, filled, rx=14):
    """Uma folha com linhas de texto; só a da frente leva cor."""
    if front and filled:
        body = f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{ORANGE_D}"/>'
        line = GRAPH_D
    elif front:
        body = f'<rect x="{x+4}" y="{y+4}" width="{w-8}" height="{h-8}" rx="{rx}" fill="{GRAPH_D}" stroke="{ORANGE_D}" stroke-width="8"/>'
        line = ORANGE_D
    else:
        body = f'<rect x="{x+3}" y="{y+3}" width="{w-6}" height="{h-6}" rx="{rx}" fill="{GRAPH_D}" stroke="{WHITE}" stroke-width="6" stroke-opacity="{0.85 if filled else 0.55}"/>'
        return body
    lines = "".join(f'<rect x="{x+w*0.16:.0f}" y="{y+h*(0.2+0.17*i):.0f}" width="{w*(0.68 if i % 3 != 2 else 0.42):.0f}" height="{max(8, h*0.06):.0f}" rx="4" fill="{line}"/>' for i in range(4))
    return body + lines


def stack(cx, cy, w, h, filled, depth=3, step=26):
    """Bloco de folhas: as de trás deslocadas para cima e para a direita."""
    total_x, total_y = (depth - 1) * step, (depth - 1) * step
    x0, y0 = cx - (w + total_x) / 2, cy - (h + total_y) / 2 + total_y
    parts = []
    for k in range(depth):  # de trás (k=0) para a frente
        off = (depth - 1 - k) * step
        parts.append(sheet(x0 + off, y0 - off, w, h, k == depth - 1, filled))
    return "".join(parts)


def svg(ext):
    blocks, filled, packed = FORMATS[ext]
    if blocks == 1:
        glyph = stack(530, 500, 290, 330, filled, depth=4, step=30)
    else:
        w, gap = (150 if blocks == 3 else 190), 38
        total = blocks * w + (blocks - 1) * gap + 2 * 26
        x = 530 - total / 2 + w / 2
        glyph = "".join(stack(x + i * (w + gap), 520, w, 250 if blocks == 3 else 290, filled, depth=3, step=26) for i in range(blocks))
    zip_marks = ""
    if packed:  # setas para dentro, acima dos blocos
        zip_marks = (f'<g stroke="{WHITE}" stroke-width="16" stroke-linecap="round" stroke-linejoin="round" fill="none">'
                     '<path d="M330 330 l55 0 M358 302 l28 28 l-28 28"/><path d="M730 330 l-55 0 M702 302 l-28 28 l28 28"/></g>')
    return f'''<?xml version="1.0" encoding="UTF-8"?>
<!-- Ícone do formato .{ext} do TTWtools. Gerado por assets/icone/make_file_icons.py: não edite à mão. -->
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{GRAPH}"/><stop offset="1" stop-color="{GRAPH_D}"/></linearGradient></defs>
  <path d="M232 64H680L872 256V944a48 48 0 0 1-48 48H232a48 48 0 0 1-48-48V112a48 48 0 0 1 48-48Z" fill="url(#bg)"/>
  <path d="M680 64V208a48 48 0 0 0 48 48H872Z" fill="{GRAPH_L}"/>
  <text x="232" y="176" font-family="Arial, Helvetica, sans-serif" font-weight="bold" font-size="92" fill="{ORANGE_D}">TTW</text>
  {zip_marks}
  {glyph}
  <text x="528" y="900" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="bold" font-size="{128 if len(ext) < 5 else 112}" fill="{WHITE}">.{ext}</text>
</svg>
'''


def render(src, size, out):
    if shutil.which("rsvg-convert"):
        cmd = ["rsvg-convert", "-w", str(size), "-h", str(size), "-o", str(out), str(src)]
    else:
        cmd = [shutil.which("inkscape") or "inkscape", str(src), "-w", str(size), "-h", str(size), "-o", str(out)]
    subprocess.run(cmd, check=True, capture_output=True)


def main():
    OUT_SVG.mkdir(exist_ok=True)
    BUILD.mkdir(parents=True, exist_ok=True)
    magick = shutil.which("magick") or shutil.which("convert")
    for ext in FORMATS:
        src = OUT_SVG / f"{ext}.svg"
        src.write_text(svg(ext), encoding="utf-8")
        render(src, 512, BUILD / f"{ext}.png")
        with tempfile.TemporaryDirectory() as tmp:
            tmp = Path(tmp)
            sizes = [16, 24, 32, 48, 64, 128, 256]
            for s in sizes:
                render(src, s, tmp / f"{s}.png")
            if magick:
                subprocess.run([magick, *[str(tmp / f"{s}.png") for s in sizes], str(BUILD / f"{ext}.ico")], check=True)
            if sys.platform == "darwin":
                iconset = tmp / f"{ext}.iconset"
                iconset.mkdir()
                for base in (16, 32, 128, 256, 512):
                    render(src, base, iconset / f"icon_{base}x{base}.png")
                    render(src, base * 2, iconset / f"icon_{base}x{base}@2x.png")
                subprocess.run(["iconutil", "-c", "icns", str(iconset), "-o", str(BUILD / f"{ext}.icns")], check=True)
    print("ok:", ", ".join(FORMATS))


if __name__ == "__main__":
    main()

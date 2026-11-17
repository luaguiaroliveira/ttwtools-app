#!/usr/bin/env bash
# Pacotes do Linux em contêineres Docker: cada formato é compilado na distribuição que ele atende
# (a glibc do contêiner é o mínimo que o pacote aceita). Uso:
#     build/linux/empacotar.sh                  # deb, rpm, AppImage e o tar.gz portátil
#     build/linux/empacotar.sh deb              # só um
# Saída em dist/release/. O pacote do Arch/Manjaro sai do build nativo (ver CONTRIBUTING.md).
set -euo pipefail
ROOT=$(cd "$(dirname "$0")/../.." && pwd)
SRC=$(cd "$ROOT" && pwd -P)
OUT=$(cd "$ROOT" && python3 -c "import pathlib;p=pathlib.Path('dist/release');p.mkdir(parents=True,exist_ok=True);print(p.resolve())")

formatos=("$@")
[ ${#formatos[@]} -eq 0 ] && formatos=(deb rpm appimage)

for fmt in "${formatos[@]}"; do
  case "$fmt" in
    deb)      distro=debian12;   python=python3;     interno=deb ;;
    rpm)      distro=fedora41;   python=python3;     interno=rpm ;;
    # o tar.gz portátil sai com o AppImage: é o contêiner de glibc mais antiga
    appimage) distro=ubuntu2204; python=python3.11;  interno=tar,appimage ;;
    *) echo "formato desconhecido: $fmt (use deb, rpm ou appimage)" >&2; exit 2 ;;
  esac
  img="ttw-build-$distro"
  echo "### $fmt ($distro)"
  docker build -t "$img" -f "$ROOT/build/linux/Dockerfile.$distro" "$ROOT/build/linux"
  docker run --rm \
    -v "$SRC:/src:ro" -v "$OUT:/out" \
    -e HOST_UID="$(id -u)" -e HOST_GID="$(id -g)" -e PYTHON="$python" \
    "$img" /src/build/linux/dentro-do-container.sh "$interno"
done
echo "### pacotes em $OUT"
ls -l "$OUT"

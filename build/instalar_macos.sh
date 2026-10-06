#!/usr/bin/env bash
# build/instalar_macos.sh — compila (build/build.py) e instala o TTWtools.app em /Applications.
#
# Um comando só: acha o Python com PyInstaller, roda o build (que já compila a interface,
# empacota, faz o autoteste e confere o mínimo do macOS) e troca o app instalado.
#
# Uso:
#   bash build/instalar_macos.sh                  # alvo = arquitetura desta máquina
#   bash build/instalar_macos.sh --arch x86_64    # macOS Intel (num Mac Apple Silicon, sob Rosetta)
#   TTW_PYTHON=/caminho/do/python bash build/instalar_macos.sh
#
# O Python do build precisa ter PyInstaller: ambiente `ttw311` no Intel, `ttw314` no Apple Silicon.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

ARCH="${TTW_ARCH:-$(uname -m)}"
case "$ARCH" in
  arm64|aarch64) ARCH=arm64; ENV_NAME=ttw314 ;;
  x86_64|amd64)  ARCH=x86_64; ENV_NAME=ttw311 ;;
  *) echo "ERRO: arquitetura desconhecida '$ARCH'." >&2; exit 1 ;;
esac

# 1) Python do build: TTW_PYTHON > PATH (python/python3) > conda <env>.
has_pyinstaller() { command -v "$1" >/dev/null 2>&1 && "$1" -c 'import PyInstaller' >/dev/null 2>&1; }
PY="${TTW_PYTHON:-}"
if [[ -z "$PY" ]]; then
  for cand in python python3 \
      "$HOME/miniconda3/envs/$ENV_NAME/bin/python" "$HOME/anaconda3/envs/$ENV_NAME/bin/python" \
      "/opt/miniconda3/envs/$ENV_NAME/bin/python" "/opt/homebrew/Caskroom/miniconda/base/envs/$ENV_NAME/bin/python"; do
    if has_pyinstaller "$cand"; then PY="$cand"; break; fi
  done
fi
if [[ -z "$PY" ]]; then
  echo "ERRO: não achei um Python com PyInstaller. Ative o ambiente '$ENV_NAME' ou use TTW_PYTHON=/caminho/python." >&2
  exit 1
fi
echo "==> Python do build: $PY"

# 2) Compila (--arch só entra se você não passou outro).
if [[ " $* " != *" --arch "* ]]; then
  "$PY" build/build.py --arch "$ARCH" "$@"
else
  "$PY" build/build.py "$@"
fi

# 3) Instala em /Applications.
APP="dist/macos-$ARCH/TTWtools.app"
[[ -d "$APP" ]] || { echo "ERRO: pacote não encontrado em $APP" >&2; exit 1; }
VER="$(plutil -extract CFBundleShortVersionString raw "$APP/Contents/Info.plist")"

osascript -e 'quit app "TTWtools"' 2>/dev/null || true   # fecha a instância antiga, se houver
sleep 1
rm -rf /Applications/TTWtools.app
ditto "$APP" /Applications/TTWtools.app
xattr -dr com.apple.quarantine /Applications/TTWtools.app 2>/dev/null || true
echo "==> TTWtools $VER instalado em /Applications/TTWtools.app"
open /Applications/TTWtools.app || true

#!/usr/bin/env bash
# build/build_mac.sh — Build do ttwtools-app para macOS
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "==> Instalando dependências de build..."
pip install pyinstaller pyinstaller-hooks-contrib

echo "==> Executando PyInstaller..."
pyinstaller "$SCRIPT_DIR/ttwtools-app.spec" \
    --distpath "$ROOT/dist" \
    --workpath "$ROOT/build/_work" \
    --noconfirm

echo ""
echo "==> Build concluído!"
echo "    App: $ROOT/dist/ttwtools.app"
echo "    Executável direto: $ROOT/dist/ttwtools/ttwtools"

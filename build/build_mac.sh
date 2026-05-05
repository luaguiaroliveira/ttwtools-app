#!/usr/bin/env bash
# build/build_mac.sh — Build do ttwtools-app para macOS
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DIST_DIR="$ROOT/dist_macarm64"
WORK_DIR="$ROOT/build/_work_macarm64"
DMG_PATH="$DIST_DIR/ttwtools-macos-arm64.dmg"

echo "==> Instalando dependências de build..."
pip install pyinstaller pyinstaller-hooks-contrib

if command -v npm >/dev/null 2>&1; then
    echo "==> Buildando frontend (Vite)..."
    (
        cd "$ROOT/frontend-src"
        npm install
        npm run build
    )
else
    echo "==> Aviso: npm nao encontrado; usando frontend ja existente em $ROOT/frontend"
fi

echo "==> Verificando modelos spaCy no ambiente atual..."
if ! python - <<'PY'
import importlib.util
import sys

required = ["en_core_web_sm"]
missing = [name for name in required if importlib.util.find_spec(name) is None]

if missing:
    print("Modelos spaCy ausentes:", ", ".join(missing))
    print("Instale com: python -m spacy download en_core_web_sm")
    sys.exit(1)

print("OK: en_core_web_sm detectado")
PY
then
    echo "==> Modelo spaCy ausente; baixando en_core_web_sm..."
    python -m spacy download en_core_web_sm
fi

echo "==> Executando PyInstaller..."
pyinstaller "$SCRIPT_DIR/ttwtools-app.spec" \
    --distpath "$DIST_DIR" \
    --workpath "$WORK_DIR" \
    --noconfirm

echo "==> Gerando DMG (arm64)..."
TMP_DMG_DIR="$ROOT/build/_dmg_macarm64"
rm -rf "$TMP_DMG_DIR"
mkdir -p "$TMP_DMG_DIR"
cp -R "$DIST_DIR/ttwtools.app" "$TMP_DMG_DIR/"
rm -f "$DMG_PATH"
hdiutil create \
    -volname "ttwtools macOS arm64" \
    -srcfolder "$TMP_DMG_DIR" \
    -ov \
    -format UDZO \
    "$DMG_PATH"
rm -rf "$TMP_DMG_DIR"

echo ""
echo "==> Build concluído!"
echo "    App: $DIST_DIR/ttwtools.app"
echo "    DMG: $DMG_PATH"

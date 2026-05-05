#!/usr/bin/env bash
# build/build_mac.sh — Build do ttwtools-app para macOS
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

ARCH="$(uname -m)"  # arm64 ou x86_64
if [ "$ARCH" = "arm64" ]; then
    ARCH_LABEL="silicon"
else
    ARCH_LABEL="intel"
fi

DIST_DIR="$ROOT/dist/dist-mac${ARCH_LABEL}"
WORK_DIR="$ROOT/build/_work_mac${ARCH_LABEL}"
DMG_PATH="$DIST_DIR/TTWtools-macOS-${ARCH_LABEL}.dmg"

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

echo "==> Gerando DMG (${ARCH})..."
TMP_DMG_DIR="$ROOT/build/_dmg_mac${ARCH_LABEL}"
rm -rf "$TMP_DMG_DIR"
mkdir -p "$TMP_DMG_DIR"
cp -R "$DIST_DIR/TTWtools.app" "$TMP_DMG_DIR/"
rm -f "$DMG_PATH"
hdiutil create \
    -volname "TTWtools macOS ${ARCH_LABEL}" \
    -srcfolder "$TMP_DMG_DIR" \
    -ov \
    -format UDZO \
    "$DMG_PATH"
rm -rf "$TMP_DMG_DIR"

echo ""
echo "==> Build concluído!"
echo "    App: $DIST_DIR/TTWtools.app"
echo "    DMG: $DMG_PATH"

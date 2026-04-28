#!/usr/bin/env bash
# build/build_mac.sh — Build do ttwtools-app para macOS
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "==> Instalando dependências de build..."
pip install pyinstaller pyinstaller-hooks-contrib

if command -v npm >/dev/null 2>&1; then
    echo "==> Buildando frontend (Vite)..."
    (
        cd "$ROOT/frontend-src"
        if [ ! -d node_modules ]; then
            npm install --legacy-peer-deps
        fi
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
    echo "==> Falha na pre-validacao do spaCy."
    exit 1
fi

echo "==> Executando PyInstaller..."
pyinstaller "$SCRIPT_DIR/ttwtools-app.spec" \
    --distpath "$ROOT/dist" \
    --workpath "$ROOT/build/_work" \
    --noconfirm

echo ""
echo "==> Build concluído!"
echo "    App: $ROOT/dist/ttwtools.app"
echo "    Executável direto: $ROOT/dist/ttwtools/ttwtools"

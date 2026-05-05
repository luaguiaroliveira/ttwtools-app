#!/usr/bin/env bash
# build_intel_local.sh — Build ttwtools.app para macOS Intel (x86_64) usando Rosetta 2.
#
# Pré-requisitos:
#   1. Rosetta 2 instalada (softwareupdate --install-rosetta)
#   2. Miniconda x86_64 em ~/miniconda3-x86
#      Se não tiver, este script instala automaticamente.
#
# Uso:
#   bash build/build_intel_local.sh
#   bash build/build_intel_local.sh --clean   # recria o ambiente do zero

set -euo pipefail

# ── Garantir que está rodando como x86_64 ──────────────────────────────────
if [ "$(arch)" != "i386" ]; then
  echo "Re-executando via Rosetta (arch -x86_64)..."
  exec arch -x86_64 /bin/zsh "$0" "$@"
fi

echo "✔ Arquitetura: $(arch) (x86_64)"

# ── Configuração ───────────────────────────────────────────────────────────
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CONDA_X86="$HOME/miniconda3-x86"
ENV_NAME="ttw311-x86"
PYTHON_VERSION="3.11"
DIST_DIR="$ROOT/dist_macx86_64"
WORK_DIR="$ROOT/build/_work_macx86_64"
DMG_PATH="$DIST_DIR/ttwtools-macos-x86_64.dmg"

# ── Instalar Miniconda x86_64 se necessário ────────────────────────────────
if [ ! -f "$CONDA_X86/bin/conda" ]; then
  echo "→ Instalando Miniconda x86_64 em $CONDA_X86 ..."
  TMP_PKG="/tmp/Miniconda3-x86_64.sh"
  curl -fsSL "https://repo.anaconda.com/miniconda/Miniconda3-latest-MacOSX-x86_64.sh" -o "$TMP_PKG"
  bash "$TMP_PKG" -b -p "$CONDA_X86"
  rm "$TMP_PKG"
  echo "✔ Miniconda x86_64 instalada."
fi

CONDA="$CONDA_X86/bin/conda"

# ── Recriar ambiente se --clean ────────────────────────────────────────────
if [[ "${1:-}" == "--clean" ]]; then
  echo "→ Removendo ambiente $ENV_NAME ..."
  "$CONDA" env remove -n "$ENV_NAME" -y 2>/dev/null || true
fi

# ── Criar ambiente x86_64 com Python 3.11 ─────────────────────────────────
if ! "$CONDA" env list | grep -q "^$ENV_NAME "; then
  echo "→ Criando ambiente conda x86_64: $ENV_NAME (Python $PYTHON_VERSION) ..."
  "$CONDA" create -n "$ENV_NAME" python="$PYTHON_VERSION" -y
fi

PIP="$CONDA_X86/envs/$ENV_NAME/bin/pip"
PYTHON="$CONDA_X86/envs/$ENV_NAME/bin/python"
PYINSTALLER="$CONDA_X86/envs/$ENV_NAME/bin/pyinstaller"

# ── Instalar dependências pip ──────────────────────────────────────────────
echo "→ Instalando dependências pip ..."
"$PIP" install --upgrade pip

# Extrai apenas os pacotes da seção pip: do environment.yml
# Exclui: pacotes locais, pyinstaller (instalado separadamente) e torch/stanza (versão pinada incompatível — instalados separadamente abaixo)
REQS=$(awk '/^  - pip:/{in_pip=1; next} in_pip && /^      - /{line=$0; gsub(/^[[:space:]]*- /, "", line); print line} in_pip && /^[^ ]/{in_pip=0}' "$ROOT/environment.yml" \
  | grep -v -E "^(ttwtools(-app)?|en-core-web-sm|pyinstaller|torch|stanza)==" \
  | tr '\n' ' ')

# Instala em lote (ignora erros individuais de compatibilidade)
echo "$REQS" | xargs "$PIP" install --ignore-requires-python || true

# torch: a versão pinada no environment.yml não existe para osx-64;
# instala a última compatível com Intel Mac + Python 3.11
echo "→ Instalando torch (versão compatível com Intel Mac) ..."
"$PIP" install "torch==2.2.2" || echo "⚠ torch não instalado — stanza não estará disponível"
"$PIP" install stanza || true

# ── Instalar pacotes locais ────────────────────────────────────────────────
echo "→ Instalando pacotes locais ..."
"$PIP" install -e "$ROOT/libs/ttwtools"
"$PIP" install -e "$ROOT"

# ── Instalar PyInstaller ──────────────────────────────────────────────────
echo "→ Instalando PyInstaller ..."
"$PIP" install pyinstaller
# Garantir que wrapt e outras deps nativas vêm do ambiente conda (não do ~/.local)
"$PIP" install --force-reinstall wrapt

# ── Modelo spaCy ──────────────────────────────────────────────────────────
echo "→ Baixando modelo spaCy ..."
"$PYTHON" -m spacy download en_core_web_sm

# ── Build frontend (se necessário) ────────────────────────────────────────
if [ ! -f "$ROOT/frontend/index.html" ]; then
  echo "→ Buildando frontend ..."
  cd "$ROOT/frontend-src" && npm ci && npm run build && cd "$ROOT"
fi

# ── PyInstaller ────────────────────────────────────────────────────────────
echo "→ Rodando PyInstaller (x86_64) ..."
PYTHONNOUSERSITE=1 "$PYINSTALLER" "$ROOT/build/ttwtools-app.spec" \
  --distpath "$DIST_DIR" \
  --workpath "$WORK_DIR" \
  --noconfirm

# ── Gerar DMG Intel ────────────────────────────────────────────────────────
echo "→ Gerando DMG (x86_64) ..."
TMP_DMG_DIR="$ROOT/build/_dmg_macx86_64"
rm -rf "$TMP_DMG_DIR"
mkdir -p "$TMP_DMG_DIR"
cp -R "$DIST_DIR/ttwtools.app" "$TMP_DMG_DIR/"
rm -f "$DMG_PATH"
hdiutil create \
  -volname "ttwtools macOS x86_64" \
  -srcfolder "$TMP_DMG_DIR" \
  -ov \
  -format UDZO \
  "$DMG_PATH"
rm -rf "$TMP_DMG_DIR"

echo ""
echo "✔ Build Intel concluído: $DIST_DIR/ttwtools.app"
echo "  DMG: $DMG_PATH"
echo "  Verificar arquitetura: file '$DIST_DIR/ttwtools.app/Contents/MacOS/ttwtools'"

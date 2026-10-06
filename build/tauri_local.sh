#!/usr/bin/env bash
# build/tauri_local.sh — compila o app Tauri (servidor + casca) na versão pedida e instala.
#
# Uso:
#   bash build/tauri_local.sh 0.8.1                # grava a versão, compila e instala em /Applications
#   bash build/tauri_local.sh 0.8.1 --dmg          # também gera dist/release/TTWtools-tauri-<alvo>.dmg
#   bash build/tauri_local.sh --no-install         # compila a versão atual, sem instalar
#   bash build/tauri_local.sh 0.8.1 --skip-server  # reusa dist/<alvo>/ttwtools-server já pronto
#   bash build/tauri_local.sh 0.8.1 --python ~/miniconda3/envs/ttw311/bin/python
#
# Pré-requisitos: ambiente Python do projeto (uvicorn, PyInstaller, ttwtools), Node,
# e `cargo tauri` (cargo install tauri-cli --version 2.11.5 --locked).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

VERSION="" ; INSTALL=1 ; DMG=0 ; SKIP_SERVER=0 ; PY=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --no-install) INSTALL=0; shift ;;
    --dmg) DMG=1; shift ;;
    --skip-server) SKIP_SERVER=1; shift ;;
    --python) PY="$2"; shift 2 ;;
    -h|--help) sed -n '2,14p' "$0"; exit 0 ;;
    -*) echo "opção desconhecida: $1" >&2; exit 1 ;;
    *) VERSION="$1"; shift ;;
  esac
done

# arquitetura -> alvo do build e mínimo de macOS do check
case "$(uname -m)" in
  arm64)  TARGET=macos-arm64  ; SYS_MIN=12.3 ;;
  x86_64) TARGET=macos-x86_64 ; SYS_MIN=12.0 ;;
  *) echo "arquitetura não suportada: $(uname -m)" >&2; exit 1 ;;
esac

# Python do projeto (precisa importar uvicorn e ttwtools)
if [[ -z "$PY" ]]; then
  for c in "$(command -v python 2>/dev/null || true)" \
           "$HOME/miniconda3/envs/ttw311/bin/python" \
           "$HOME/miniconda3/envs/ttw314/bin/python"; do
    if [[ -n "$c" && -x "$c" ]] && "$c" -c 'import uvicorn, ttwtools' >/dev/null 2>&1; then PY="$c"; break; fi
  done
fi
[[ -n "$PY" ]] || { echo "não achei o Python do projeto (use --python /caminho/python)" >&2; exit 1; }
echo "== Python: $PY"

export PATH="$HOME/.cargo/bin:$PATH"
command -v cargo >/dev/null || { echo "cargo não encontrado" >&2; exit 1; }
cargo tauri --version >/dev/null 2>&1 || {
  echo "falta o tauri-cli: cargo install tauri-cli --version 2.11.5 --locked" >&2; exit 1; }

# 1) versão (fonte única: `version` do pyproject.toml; tauri_app.py lê daí)
if [[ -n "$VERSION" ]]; then
  echo "== versão -> $VERSION"
  "$PY" - "$ROOT/pyproject.toml" "$VERSION" <<'PY'
import pathlib, re, sys
p = pathlib.Path(sys.argv[1]); v = sys.argv[2]
s = p.read_text(encoding="utf-8")
s, n = re.subn(r'(?m)^version\s*=\s*".*?"', f'version = "{v}"', s, count=1)
assert n == 1, "não achei a linha `version` no pyproject.toml"
p.write_text(s, encoding="utf-8")
PY
fi

# 2) interface + servidor PyInstaller (sem pywebview) — 20 a 30 min
if [[ "$SKIP_SERVER" -eq 0 ]]; then
  echo "== interface + servidor (build.py --shell tauri)"
  "$PY" "$ROOT/build/build.py" --shell tauri
fi
SERVER="$ROOT/dist/$TARGET/ttwtools-server/ttwtools-server"
[[ -x "$SERVER" ]] || { echo "falta o servidor: rode sem --skip-server (esperado em $SERVER)" >&2; exit 1; }

# 3) casca Tauri (.app)
echo "== casca Tauri ($TARGET, mínimo macOS $SYS_MIN)"
ARGS=(--target "$TARGET" --min "$SYS_MIN")
[[ "$DMG" -eq 1 ]] && ARGS+=(--dmg)
"$PY" "$ROOT/build/tauri_app.py" "${ARGS[@]}"

APP="$ROOT/dist/$TARGET/TTWtools.app"
[[ -d "$APP" ]] || { echo "não gerou $APP" >&2; exit 1; }

# 4) instalar (ditto preserva os links simbólicos do servidor)
if [[ "$INSTALL" -eq 1 ]]; then
  DEST="/Applications/TTWtools.app"
  echo "== instalando em $DEST"
  rm -rf "$DEST"
  ditto "$APP" "$DEST"
  xattr -dr com.apple.quarantine "$DEST" 2>/dev/null || true
  echo "== abrindo"
  open -a "$DEST"
fi
echo "== pronto: $APP"

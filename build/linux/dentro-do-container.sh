#!/bin/sh
# Roda DENTRO do contêiner (ver build/linux/empacotar.sh): compila o servidor e a casca Tauri na
# distribuição do contêiner e gera o pacote pedido. /src = repositório (somente leitura), /out = pacotes.
set -e
FORMATO="${1:?uso: dentro-do-container.sh deb|rpm|appimage|tar (ou lista: tar,appimage)}"
PY="${PYTHON:-python3}"

echo "==> cópia do repositório (/src → /w/app)"
rm -rf /w/app
mkdir -p /w/app
# sem node_modules (o frontend já vem compilado em frontend/) nem artefatos locais
tar -C /src -cf - --exclude=./frontend-vue/node_modules --exclude=./dist --exclude=./ttwa_files . | tar -C /w/app -xf -
chown -R root:root /w/app
cd /w/app
rm -rf dist build/_work src-tauri/target src-tauri/gen      # links da máquina do desenvolvedor
mkdir -p dist
git config --global --add safe.directory '*' || true

echo "==> ambiente Python ($PY)"
$PY -m venv /w/venv
/w/venv/bin/python -m pip install --quiet --upgrade pip
VENV=/w/venv/bin/python

echo "==> servidor (PyInstaller) e casca Tauri"
$VENV build/build.py --install-deps --shell tauri --skip-frontend
$VENV build/tauri_app.py

TAURI_APPIMAGE=""
case "$FORMATO" in
  *appimage*)
    echo "==> AppImage do Tauri (WebKit embutido; servidor entra depois, extraindo e reempacotando)"
    NUM=$($VENV -c "import tomllib,pathlib,re;v=tomllib.loads(pathlib.Path('pyproject.toml').read_text())['project']['version'];print(re.match(r'\d+\.\d+\.\d+',v).group(0))")
    (cd src-tauri && cargo tauri build --bundles appimage \
        --config "{\"version\":\"$NUM\",\"bundle\":{\"resources\":null,\"macOS\":null}}") || \
      echo "!!! o empacotador AppImage do Tauri falhou; seguindo sem o WebKit embutido"
    CAND=$(find src-tauri/target/release/bundle/appimage -maxdepth 1 -name '*.AppImage' | head -1)
    [ -n "$CAND" ] && TAURI_APPIMAGE="--tauri-appimage $CAND"
    ;;
esac

echo "==> pacote $FORMATO"
# shellcheck disable=SC2086
$VENV build/linux_packages.py --formats "$FORMATO" --work /w/pkg $TAURI_APPIMAGE

mkdir -p /out
cp -f dist/release/* /out/
[ -n "${HOST_UID:-}" ] && chown -R "$HOST_UID:${HOST_GID:-$HOST_UID}" /out || true
ls -l /out

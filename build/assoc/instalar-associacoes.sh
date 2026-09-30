#!/bin/sh
# Linux: registra os formatos do TTWtools (tipo MIME, icone de cada um, entrada no menu) para o usuario atual.
# Desfazer: instalar-associacoes.sh --remover. Execute depois de mover a pasta para o lugar definitivo.
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
SHARE="${XDG_DATA_HOME:-$HOME/.local/share}"
EXTS="ttwa ttwl ttwal ttwc ttwcl ttwt"
ICONS="$SHARE/icons/hicolor/512x512"

if [ "$1" = "--remover" ]; then
  for e in $EXTS; do rm -f "$ICONS/mimetypes/application-x-ttwtools-$e.png"; done
  rm -f "$SHARE/mime/packages/ttwtools.xml" "$SHARE/applications/ttwtools.desktop" "$ICONS/apps/ttwtools.png"
else
  mkdir -p "$SHARE/mime/packages" "$SHARE/applications" "$ICONS/mimetypes" "$ICONS/apps"
  for e in $EXTS; do cp "$DIR/icons/$e.png" "$ICONS/mimetypes/application-x-ttwtools-$e.png"; done
  cp "$DIR/icon.png" "$ICONS/apps/ttwtools.png"
  {
    echo '<?xml version="1.0" encoding="UTF-8"?>'
    echo '<mime-info xmlns="http://www.freedesktop.org/standards/shared-mime-info">'
    for e in $EXTS; do
      case $e in
        ttwa)  d="Projeto TTWtools (corpora e analises)";;
        ttwl)  d="Projeto TTWtools leve (textos numa pasta ao lado)";;
        ttwal) d="Pacote leve de corpora do TTWtools";;
        ttwc)  d="Corpus do TTWtools (um corpus, textos dentro)";;
        ttwcl) d="Corpus leve do TTWtools (textos numa pasta ao lado)";;
        ttwt)  d="Projeto TTWtools compactado";;
      esac
      echo "  <mime-type type=\"application/x-ttwtools-$e\"><comment>$d</comment><glob pattern=\"*.$e\"/><icon name=\"application-x-ttwtools-$e\"/></mime-type>"
    done
    echo '</mime-info>'
  } > "$SHARE/mime/packages/ttwtools.xml"
  MIMES=""
  for e in $EXTS; do MIMES="${MIMES}application/x-ttwtools-$e;"; done
  cat > "$SHARE/applications/ttwtools.desktop" <<DESK
[Desktop Entry]
Type=Application
Name=TTWtools
Comment=Analise de corpora
Exec="$DIR/TTWtools" %f
Icon=ttwtools
Terminal=false
Categories=Education;Science;
MimeType=$MIMES
DESK
fi
update-mime-database "$SHARE/mime" >/dev/null 2>&1 || true
update-desktop-database "$SHARE/applications" >/dev/null 2>&1 || true
gtk-update-icon-cache -f -t "$SHARE/icons/hicolor" >/dev/null 2>&1 || true
echo "Pronto."

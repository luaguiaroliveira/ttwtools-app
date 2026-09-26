#!/usr/bin/env bash
# build/release_github.sh — envia pacotes feitos localmente (ex.: macOS Intel com
# `python build/build.py --arch x86_64`) para a release (rascunho) de uma tag.
#
# Uso: bash build/release_github.sh --tag v0.4.0-alpha.1 [--dry-run]
# Envia dist/release/TTWtools-<versão>-*.{dmg,zip,tar.gz} e atualiza SHA256SUMS.txt.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TAG="" ; DRY=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --tag) TAG="$2"; shift 2 ;;
    --dry-run) DRY=1; shift ;;
    -h|--help) sed -n '2,6p' "$0"; exit 0 ;;
    *) echo "opção desconhecida: $1" >&2; exit 1 ;;
  esac
done
[[ -n "$TAG" ]] || { echo "informe --tag vX.Y.Z" >&2; exit 1; }
VERSION="${TAG#v}"
shopt -s nullglob
FILES=("$ROOT"/dist/release/TTWtools-"$VERSION"-*.{dmg,zip,tar.gz})
[[ ${#FILES[@]} -gt 0 ]] || { echo "nenhum pacote TTWtools-$VERSION-* em dist/release" >&2; exit 1; }
echo "== enviando para a release $TAG:"; printf '   %s\n' "${FILES[@]##*/}"
if [[ "$DRY" -eq 1 ]]; then echo "== dry-run: nada enviado"; exit 0; fi
gh release upload "$TAG" "${FILES[@]}" --clobber
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
gh release download "$TAG" --dir "$TMP" --pattern 'TTWtools-*'
(cd "$TMP" && shasum -a 256 TTWtools-* > SHA256SUMS.txt)
gh release upload "$TAG" "$TMP/SHA256SUMS.txt" --clobber
echo "== pronto"

#!/usr/bin/env bash
# build/release_github.sh
# Upload-only: sobe DMGs ja gerados pelos scripts de build.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

DEFAULT_TARGETS="mac-arm64,mac-intel"
TARGETS="$DEFAULT_TARGETS"
INPUT_TAG=""
TAG=""
REPO=""
DRY_RUN=0

usage() {
  cat <<'EOF'
Uso:
  bash build/release_github.sh --tag X.Y.Z|vX.Y.Z [opcoes]

Opcoes:
  --tag <tag>                 Tag da release (ex: 0.3.5 ou v0.3.5)
  --repo <owner/repo>         Repositorio alvo (padrao: remoto origin)
  --targets <lista>           Alvos separados por virgula.
                              Suportados hoje: mac-arm64,mac-intel
                              Reservados para futuro: windows-x64,linux-x64
  --dry-run                   Mostra o que seria enviado, sem upload
  -h, --help                  Exibe ajuda

Exemplos:
  bash build/release_github.sh --tag 0.3.5
  bash build/release_github.sh --tag v0.3.5 --targets mac-arm64
  bash build/release_github.sh --tag 0.3.5 --repo dono/repositorio
EOF
}

log() {
  printf "\n[%s] %s\n" "$(date +"%H:%M:%S")" "$*"
}

die() {
  echo "ERRO: $*" >&2
  exit 1
}

run() {
  if [[ "$DRY_RUN" -eq 1 ]]; then
    echo "[dry-run] $*"
  else
    eval "$@"
  fi
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "Comando obrigatorio nao encontrado: $1"
}

release_exists_for_tag() {
  local tag_to_check="$1"
  if [[ -n "$REPO" ]]; then
    gh release view "$tag_to_check" --repo "$REPO" >/dev/null 2>&1
  else
    gh release view "$tag_to_check" >/dev/null 2>&1
  fi
}

release_create() {
  local title="ttwtools $TAG"
  local notes="Release automatizada via build/release_github.sh"
  local prerelease_flag=""

  if [[ "$TAG" == *-* ]]; then
    prerelease_flag="--prerelease"
  fi

  if [[ -n "$REPO" ]]; then
    run "gh release create '$TAG' --repo '$REPO' --title '$title' --notes '$notes' $prerelease_flag"
  else
    run "gh release create '$TAG' --title '$title' --notes '$notes' $prerelease_flag"
  fi
}

release_upload_asset() {
  local asset="$1"
  if [[ -n "$REPO" ]]; then
    run "gh release upload '$TAG' '$asset' --repo '$REPO' --clobber"
  else
    run "gh release upload '$TAG' '$asset' --clobber"
  fi
}

resolve_release_tag() {
  local alt_tag

  if release_exists_for_tag "$INPUT_TAG"; then
    TAG="$INPUT_TAG"
    return
  fi

  if [[ "$INPUT_TAG" == v* ]]; then
    alt_tag="${INPUT_TAG#v}"
  else
    alt_tag="v${INPUT_TAG}"
  fi

  if release_exists_for_tag "$alt_tag"; then
    TAG="$alt_tag"
    log "Release existente encontrada em tag '$TAG' (entrada: '$INPUT_TAG')."
    return
  fi

  TAG="$INPUT_TAG"
}

ensure_release() {
  if release_exists_for_tag "$TAG"; then
    log "Release $TAG ja existe; arquivos serao atualizados (--clobber)."
  else
    log "Criando release $TAG ..."
    release_create
  fi
}

asset_for_target() {
  local target="$1"
  case "$target" in
    mac-arm64) echo "$ROOT/dist_macarm64/ttwtools-macos-arm64.dmg" ;;
    mac-intel) echo "$ROOT/dist_macx86_64/ttwtools-macos-x86_64.dmg" ;;
    windows-x64) echo "$ROOT/dist_windowsx86_64/ttwtools-windows-x86_64.zip" ;;
    linux-x64) echo "$ROOT/dist_linuxx86_64/ttwtools-linux-x86_64.tar.gz" ;;
    *) die "Alvo desconhecido: $target" ;;
  esac
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --tag)
      INPUT_TAG="${2:-}"
      shift 2
      ;;
    --repo)
      REPO="${2:-}"
      shift 2
      ;;
    --targets)
      TARGETS="${2:-}"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      die "Opcao invalida: $1"
      ;;
  esac
done

[[ -n "$INPUT_TAG" ]] || die "Informe --tag (ex: 0.3.5 ou v0.3.5)"

require_cmd gh

if [[ "$DRY_RUN" -eq 0 ]]; then
  gh auth status >/dev/null 2>&1 || die "Faça login no GitHub CLI: gh auth login"
fi

IFS=',' read -r -a TARGET_ARRAY <<< "$TARGETS"
[[ "${#TARGET_ARRAY[@]}" -gt 0 ]] || die "Nenhum alvo informado em --targets"

resolve_release_tag

ASSETS=()
log "Validando artefatos para alvos: $TARGETS"
for target in "${TARGET_ARRAY[@]}"; do
  asset="$(asset_for_target "$target")"
  [[ -f "$asset" ]] || die "Artefato nao encontrado para $target: $asset. Rode o build correspondente antes do release."
  ASSETS+=("$asset")
done

if [[ "$DRY_RUN" -eq 1 ]]; then
  log "Dry-run ativo; sem upload."
  printf '%s\n' "Tag resolvida: $TAG" "Arquivos detectados:" "${ASSETS[@]}"
  exit 0
fi

ensure_release

for asset in "${ASSETS[@]}"; do
  log "Enviando $(basename "$asset")"
  release_upload_asset "$asset"
done

log "Release finalizada com sucesso."
printf '%s\n' "Tag: $TAG" "Arquivos enviados:" "${ASSETS[@]}"

# GitHub Actions — Build automático para macOS (arm64 e x86_64)

## Visão geral

O PyInstaller **não faz cross-compilation**: um `.app` arm64 só pode ser gerado num runner arm64, e um Intel x86_64 só num runner Intel. Por isso a pipeline usa uma **matrix strategy** com dois runners diferentes:

| Runner GitHub Actions | Arquitetura | Chip      |
|-----------------------|-------------|-----------|
| `macos-14`            | arm64       | Apple M1  |
| `macos-13`            | x86_64      | Intel     |

---

## 1. Preparar o repositório

### 1.1 Exportar o ambiente conda atual

Execute localmente para gerar o arquivo que o CI vai usar:

```bash
conda activate ttw314
conda env export --no-builds | grep -v "^prefix:" > environment.yml
```

Commite o `environment.yml` na raiz do repositório. O arquivo declara Python 3.14 e todas as dependências (torch, spaCy, stanza, etc.).

### 1.2 Estrutura esperada

```
.
├── app/
├── build/
│   ├── ttwtools-app.spec
│   └── icon.icns
├── frontend/          ← build gerado pelo npm
├── frontend-src/
├── libs/ttwtools/
├── environment.yml    ← NOVO (exportado do conda)
└── .github/
    └── workflows/
        └── build.yml  ← NOVO (criado abaixo)
```

---

## 2. Workflow: `.github/workflows/build.yml`

```yaml
name: Build macOS

on:
  push:
    tags:
      - "v[0-9]*.[0-9]*.[0-9]*"   # dispara em: v1.0.0, v2.3.1, etc.
  workflow_dispatch:                # permite rodar manualmente
    inputs:
      version:
        description: "Tag de versão (ex: v1.2.3)"
        required: true
        default: "v0.0.0-test"

jobs:
  build:
    strategy:
      fail-fast: false
      matrix:
        include:
          - runner: macos-14     # Apple Silicon (arm64)
            arch: arm64
          - runner: macos-13     # Intel (x86_64)
            arch: x86_64

    runs-on: ${{ matrix.runner }}
    name: Build ${{ matrix.arch }}

    steps:
      # ── 1. Código-fonte ────────────────────────────────────────────────
      - name: Checkout
        uses: actions/checkout@v4
        with:
          submodules: recursive

      # ── 2. Ambiente conda ──────────────────────────────────────────────
      - name: Instalar Miniconda
        uses: conda-incubator/setup-miniconda@v3
        with:
          miniconda-version: latest
          activate-environment: ttw314
          environment-file: environment.yml
          auto-activate-base: false

      # ── 3. Cache pip (acelera reinstalls) ─────────────────────────────
      - name: Cache pip
        uses: actions/cache@v4
        with:
          path: ~/Library/Caches/pip
          key: pip-${{ matrix.arch }}-${{ hashFiles('environment.yml') }}

      # ── 4. Cache PyInstaller _work (incremental build) ────────────────
      - name: Cache PyInstaller work
        uses: actions/cache@v4
        with:
          path: build/_work
          key: pyinstaller-${{ matrix.arch }}-${{ hashFiles('build/ttwtools-app.spec', 'app/**', 'libs/**') }}
          restore-keys: |
            pyinstaller-${{ matrix.arch }}-

      # ── 5. Frontend (npm build) ────────────────────────────────────────
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
          cache-dependency-path: frontend-src/package.json

      - name: Build frontend
        working-directory: frontend-src
        run: |
          npm ci
          npm run build

      # ── 6. Baixar modelos spaCy ────────────────────────────────────────
      - name: Download modelos spaCy
        shell: bash -l {0}
        run: |
          python -m spacy download en_core_web_sm

      # ── 7. PyInstaller ─────────────────────────────────────────────────
      - name: Build com PyInstaller
        shell: bash -l {0}
        run: |
          pyinstaller build/ttwtools-app.spec \
            --distpath dist \
            --workpath build/_work \
            --noconfirm

      # ── 8. Criar DMG ───────────────────────────────────────────────────
      - name: Instalar create-dmg
        run: brew install create-dmg

      - name: Determinar versão
        id: version
        run: |
          if [ "${{ github.event_name }}" = "workflow_dispatch" ]; then
            echo "tag=${{ github.event.inputs.version }}" >> "$GITHUB_OUTPUT"
          else
            echo "tag=${GITHUB_REF_NAME}" >> "$GITHUB_OUTPUT"
          fi

      - name: Criar DMG
        run: |
          VERSION="${{ steps.version.outputs.tag }}"
          DMG_NAME="ttwtools-${VERSION}-${{ matrix.arch }}.dmg"
          create-dmg \
            --volname "ttwtools ${VERSION}" \
            --volicon "build/icon.icns" \
            --window-pos 200 120 \
            --window-size 660 400 \
            --icon-size 128 \
            --icon "ttwtools.app" 180 170 \
            --hide-extension "ttwtools.app" \
            --app-drop-link 480 170 \
            "${DMG_NAME}" \
            "dist/"
          echo "DMG_NAME=${DMG_NAME}" >> "$GITHUB_ENV"

      # ── 9. Upload do artefato ──────────────────────────────────────────
      - name: Upload DMG como artefato
        uses: actions/upload-artifact@v4
        with:
          name: ttwtools-${{ steps.version.outputs.tag }}-${{ matrix.arch }}
          path: "*.dmg"
          if-no-files-found: error

  # ── Release ──────────────────────────────────────────────────────────────
  release:
    needs: build
    runs-on: ubuntu-latest
    # Só cria release quando disparado por tag (não em workflow_dispatch de teste)
    if: startsWith(github.ref, 'refs/tags/v')
    permissions:
      contents: write

    steps:
      - name: Baixar todos os DMGs
        uses: actions/download-artifact@v4
        with:
          path: dmgs
          merge-multiple: true

      - name: Criar GitHub Release
        uses: softprops/action-gh-release@v2
        with:
          tag_name: ${{ github.ref_name }}
          name: "ttwtools ${{ github.ref_name }}"
          draft: false
          prerelease: ${{ contains(github.ref_name, '-') }}  # v1.0.0-beta → pre-release
          generate_release_notes: true
          files: dmgs/*.dmg
```

---

## 3. Como publicar uma nova versão

### 3.1 Fluxo completo (tag + push)

```bash
# 1. Garantir que tudo está commitado
git add -A && git commit -m "feat: descrição da versão"

# 2. Criar tag semântica
git tag v1.2.3

# 3. Fazer push do commit + da tag juntos
git push origin main --tags
```

O push da tag `v1.2.3` dispara automaticamente o workflow. Quando os dois builds (arm64 e Intel) terminarem, uma **GitHub Release** é criada com os dois DMGs anexados.

### 3.2 Versões pre-release (beta / rc)

Tags com hífen são marcadas automaticamente como pre-release:

```bash
git tag v1.2.0-beta.1
git push origin v1.2.0-beta.1
```

### 3.3 Testar o build sem criar release (workflow_dispatch)

Na aba **Actions** do GitHub → selecione *Build macOS* → **Run workflow** → informe uma versão de teste (ex: `v0.0.0-test`). Os DMGs ficam disponíveis como artefatos temporários (não geram Release).

---

## 4. Atualizar a versão no código

Antes de taguear, atualize `pyproject.toml`:

```toml
[project]
version = "1.2.3"   # ← alterar aqui
```

Para automatizar, use `bump2version` ou faça manualmente antes do commit final.

---

## 5. Observações importantes

### Tempo de build
O build demora ~20-30 minutos por runner por causa do torch (~2 GB). O cache do pip e do `build/_work` reduz consideravelmente nas execuções seguintes.

### Runner Intel (`macos-13`)
O GitHub mantém o runner `macos-13` (Intel/x86_64). Se futuramente for descontinuado, a alternativa é usar um Mac mini Intel auto-hospedado como [self-hosted runner](https://docs.github.com/en/actions/hosting-your-own-runners).

### Segredos necessários
O workflow usa apenas `GITHUB_TOKEN` (automático). Não é necessário configurar nenhum segredo adicional para publicar releases no mesmo repositório.

### Assinatura / Notarização da Apple
O build atual **não está assinado com certificado Apple Developer**. Ao abrir num Mac de outro usuário, o Gatekeeper mostrará aviso. Para distribuição pública, é necessário:
1. Certificado *Developer ID Application* (Apple Developer Program, ~$99/ano)
2. Adicionar os segredos `MACOS_CERTIFICATE` e `MACOS_CERTIFICATE_PWD` no repositório
3. Adicionar etapa de `codesign` e `notarytool` no workflow antes de criar o DMG

Para uso interno / pesquisa, o usuário pode contornar com `xattr -dr com.apple.quarantine /Applications/ttwtools.app`.

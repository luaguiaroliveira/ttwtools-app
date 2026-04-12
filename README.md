# ttwtools-app

Interface gráfica para análise linguística com [ttwtools](https://github.com/luaguiaroliveira/ttwtools) (tagging Biber + KFA).

---

## Execução local (modo web)

### Pré-requisitos

- Conda com o ambiente `ttw314` (Python 3.12) configurado
- Dependências instaladas:

```bash
conda activate ttw314
pip install -e .
```

### Iniciar o servidor

```bash
conda activate ttw314
cd /caminho/para/ttwtools-app
python -m app --mode web --port 8765
```

Abrir no browser: **http://127.0.0.1:8765**

### Parar o servidor

Pressionar **Ctrl + C** no terminal onde o servidor foi iniciado.

Se esse terminal foi fechado ou perdido, usar:

```bash
# Encontra e mata o processo na porta 8765
kill $(lsof -ti :8765)
```

Para verificar se ainda está rodando:

```bash
lsof -i :8765   # retorna vazio se o servidor já parou
```

### Modo desktop (janela nativa, sem browser)

```bash
python -m app --mode desktop
```

Usa [pywebview](https://pywebview.flowrl.com/) para abrir a interface em janela nativa (WebKit no macOS, Edge WebView2 no Windows, WebKitGTK no Linux), sem necessidade de browser externo.

---

## Build — app autônomo (distribución sem Python)

Gera um executável autocontido que embarca Python, todas as bibliotecas, os modelos spaCy e o frontend compilado. Não requer instalação de Python nem de dependências no computador do usuário final.

### Pré-requisitos (em todos os sistemas)

1. **Ativar o ambiente** com todas as dependências instaladas.
2. **Modelos spaCy** devem estar baixados no ambiente:

```bash
python -m spacy download en_core_web_sm
```

3. **Instalar PyInstaller**:

```bash
pip install pyinstaller pyinstaller-hooks-contrib
```

4. **Compilar o frontend** (se ainda não foi feito ou após alterações):

```bash
cd frontend-src
npm install
npm run build
cd ..
```

---

### macOS

```bash
conda activate ttw314
cd /caminho/para/ttwtools-app
bash build/build_mac.sh
```

Resultado:
- `dist/ttwtools.app` — bundle `.app` (arraste para `/Applications` para instalar)
- `dist/ttwtools/ttwtools` — executável de linha de comando

> **Nota:** na primeira execução o macOS pode exibir aviso de segurança para apps não assinados. Clique com o botão direito no `.app` → *Abrir* para contornar.

---

### Windows

Executar no **Prompt de Comando** ou **PowerShell** (não use Git Bash):

```bat
conda activate ttw314
cd C:\caminho\para\ttwtools-app
build\build_win.bat
```

Resultado:
- `dist\ttwtools\ttwtools.exe` — executável (distribuir a pasta `dist\ttwtools\` inteira)

> **Nota:** o Windows Defender pode alertar para executáveis não assinados. Clique em *Mais informações* → *Executar mesmo assim*.

---

### Linux

Não há script pronto; executar o PyInstaller diretamente:

```bash
conda activate ttw314
cd /caminho/para/ttwtools-app
pyinstaller build/ttwtools-app.spec \
    --distpath dist \
    --workpath build/_work \
    --noconfirm
```

Resultado:
- `dist/ttwtools/ttwtools` — executável (distribuir a pasta `dist/ttwtools/` inteira)

> **Nota:** o build é específico por plataforma — um build no macOS não roda no Linux e vice-versa. Execute o build no sistema operacional de destino.

---

## Estrutura do projeto

```
ttwtools-app/
├── app/                  # Backend FastAPI (Python)
│   ├── __main__.py       # Entry point (modos web / desktop)
│   ├── server.py         # Factory do app FastAPI
│   └── routes/           # Endpoints da API
├── frontend-src/         # Frontend (Vite + D3.js) — fonte
├── frontend/             # Frontend compilado — servido pelo FastAPI
├── build/                # Scripts e spec do PyInstaller
│   ├── build_mac.sh
│   ├── build_win.bat
│   └── ttwtools-app.spec
├── libs/                 # Submódulos git (ttwtools)
├── requirements.txt
└── pyproject.toml
```

# AGENTS.md — ttwtools-app

Instruções permanentes para qualquer agente (Claude, Gemini, Codex, DeepSeek...) que trabalhe neste repositório. Vale para toda sessão. Seja breve: o detalhe está nos documentos abaixo.

## Comece por aqui

1. Leia o **cabeçalho** de `novodesenho/plano_implementacao.md` (seções "Estado atual", "Como usar", "Convenções", "Compatibilidade mínima") e **só o passo atual** (`grep -n '^### ' novodesenho/plano_implementacao.md`).
2. O desenho está em `novodesenho/novomodelo.md`. **Não leia inteiro:** consulte apenas as seções citadas no passo.
3. Trabalhe **um passo por vez**. Ao concluir: marque os `[x]`, preencha o **Relato**, atualize o "Estado atual" do plano, rode os testes e faça um commit começando por `[passo]` (ex.: `[1.2] esquema v3 do projeto`).

**Redesign visual (frontend-vue):** siga `novodesenho/plano_redesign_ui.md` (estado e etapas nele), uma etapa por vez.

## Regras permanentes

- **Commits:** nunca incluir Claude nem outro agente como autor ou coautor (sem `Co-Authored-By`, sem linha de atribuição em commits ou descrições de PR). Mensagens curtas, em português.
- **Paridade GUI e pacote Python:** a lógica vive em `libs/ttwtools/ttwtools`; a rota em `app/routes` só chama a função; a tela só apresenta. Todo recurso novo existe como função pública + subcomando de linha de comando (+ rota + tela).
- **Escopo atual:** só o **aplicativo local** (interface Vue, tudo na máquina da pessoa). Não implementar envio de arquivos pelo navegador, política de privacidade do site, PWA nem ajuste fino para celular.
- **Interface única, sem perfis de usuário;** opções avançadas ficam em painéis recolhidos. Todo texto de interface sai por chave de tradução (`pt` e `en`).
- **Sem retrabalho de etiquetagem:** nada novo pode reprocessar o que já existe em camada equivalente.
- **Compatibilidade:** o pacote precisa continuar rodando no **macOS 12** (máquina Intel, Safari 17.6), além de Windows e Linux. Build de macOS usa `MACOSX_DEPLOYMENT_TARGET=12.0`; o pacote Intel usa Python 3.11 e `torch==2.2.2`. Onde o torch não couber, Stanza e MFTE ficam indisponíveis com aviso.
- **Submódulo `libs/ttwtools` é outro repositório** (`github.com/luaguiaroliveira/ttwtools`): faça commit e `git push` **dentro dele primeiro**, depois commite o novo ponteiro no app.
- **Não desfaça nem reescreva histórico publicado** (nem `push --force`) sem pedido explícito do usuário. Não apague arquivos que você não criou.

## Economia de contexto

- **Nunca abra:** `repomix-output.xml`, `libs/repomix-output.xml`, `ttwa_files/`, `node_modules/`, `dist/`, `test_corpora/full`, `frontend/` (saída de build).
- **Arquivos grandes:** use `grep -n` e leitura por trechos (`offset`/`limit`). Em especial `libs/ttwtools/ttwtools/project.py` (1.141 linhas).
- Rode só os testes do que mexeu, e não o conjunto inteiro, a menos que o passo peça.

## Comandos essenciais

```
# ambiente conda, por máquina:
#   Mac Apple Silicon (macOS 15, desenvolvimento): ttw314 (Python 3.14, environment.yml)
#   Mac Intel (macOS 12): ttw311 (Python 3.11, torch 2.2.2)
conda env create -f environment.yml -n ttw314   # só na máquina Apple Silicon
git submodule update --init --recursive     # requer git-lfs instalado (git lfs install)

python -m app --mode web                    # servidor local; --mode desktop abre a janela
pytest libs/ttwtools/tests -q               # pacote (a partir do passo 1.1)
cd frontend-vue && npm ci && npm run build  # interface Vue (a partir do passo 3.1)
python build/build.py                       # pacote PyInstaller (a partir do passo 0.3)
```

Se um comando acima ainda não existir, é porque o passo que o cria não foi concluído: veja a tabela de andamento do plano.

## Onde está cada coisa

| Onde | O quê |
|---|---|
| `novodesenho/plano_implementacao.md` | Plano, andamento, relatos e decisões pendentes |
| `novodesenho/plano_armazenamento.md` | **Plano e pendências: o que foi feito, próximo passo, decisões abertas e tudo que falta no projeto** |
| `novodesenho/armazenamento.md` | Eficiência e formato de arquivo: evidência, proposta, perfis Compacto/Pronto |
| `novodesenho/macintel.md` | Testes na máquina lenta de referência (Mac Intel, macOS 12): números, problemas, como repetir |
| `novodesenho/novomodelo.md` | Desenho do novo TTWtools |
| `app/` | Servidor FastAPI local |
| `frontend-vue/` | Interface (Vue 3); o build sai em `frontend/` (fora do git) |
| `libs/ttwtools/` | Pacote Python (submódulo) |
| `build/`, `.github/workflows/` | Empacotamento (PyInstaller) e releases |

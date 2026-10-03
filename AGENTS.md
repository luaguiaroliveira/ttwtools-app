# AGENTS.md — ttwtools-app

Instruções permanentes para qualquer agente (Claude, Gemini, Codex, DeepSeek...). Seja breve: o detalhe está nos documentos abaixo.

## Comece por aqui

1. Leia **só a seção 1 ("Retomar aqui")** de `novodesenho/plano.md`: estado, próximos passos e regras que mais se esquecem. O resto do plano é referência.
2. Trabalhe **uma frente e um passo por vez**; ao concluir, atualize "Retomar aqui", rode os testes do que mexeu e faça um commit `[passo] mensagem curta em português`. Acrescente aprendizados e armadilhas novos a `novodesenho/memoria_para_IA.md` (não precisa lê-lo inteiro).
3. `novodesenho/novomodelo.md` é o desenho original, citado por número de seção (`§N`) em 12 módulos do pacote: **não condensar nem renumerar**; consulte só a seção citada.

## Regras permanentes

- **Commits:** nunca incluir Claude nem outro agente como autor ou coautor (sem `Co-Authored-By`, sem linha de atribuição em commits ou PRs). Mensagens curtas, em português. **Nunca `git add -A`** (projetos reais em LFS em `ttwa_files/` mudam ao abrir): adicione arquivos pelo nome.
- **Paridade GUI e pacote Python:** a lógica vive em `libs/ttwtools/ttwtools`; a rota em `app/routes` só chama a função; a tela só apresenta. Todo recurso novo = função pública + subcomando + rota + tela.
- **Vocabulário (português):** *feature* = **atributo**; nunca "traço" ("traço" só no sentido de linha/risco desenhado). Vale para interface, ajuda, documentação e mensagens.
- **Escopo:** só o **aplicativo local**. Não implementar envio de arquivos pelo navegador, privacidade do site, PWA nem ajuste fino para celular.
- **Interface única, sem perfis;** opções avançadas em painéis recolhidos; todo texto por chave de tradução (`pt` e `en`). Operação longa = tarefa com andamento, nunca requisição parada.
- **Sem retrabalho de etiquetagem:** nada novo reprocessa o que já existe em camada equivalente.
- **Compatibilidade:** o pacote roda no **macOS 12** (Intel, Safari 17.6), Windows e Linux; Intel usa Python 3.11, `torch==2.2.2`, `numpy==1.26.4`; onde o torch não couber, Stanza e MFTE ficam indisponíveis com aviso. **Formato de arquivo só com biblioteca padrão.**
- **Submódulo `libs/ttwtools` é outro repositório** (`github.com/luaguiaroliveira/ttwtools`): commit e `git push` **nele primeiro**, depois o ponteiro no app.
- **Não desfaça nem reescreva histórico publicado** (nem `push --force`) sem pedido explícito. **Não apague arquivos que você não criou**, salvo pedido explícito do usuário (como na fusão de `.md` de 2026-09-30). Não recompile o pacote (PyInstaller) sem pedido.
- **Disco:** antes de abrir projeto real, `df -h /` (≥20 GB livres); trabalhe em cópias; um processo longo por vez, avisando o usuário; apague o que criar.

## Economia de contexto

- **Nunca abra:** `repomix-output.xml`, `ttwa_files/`, `node_modules/`, `dist/`, `test_corpora/full`, `frontend/` (saída de build).
- **Arquivos grandes:** `grep -n` e leitura por trechos (`offset`/`limit`); em especial `libs/ttwtools/ttwtools/project.py`.
- Rode só os testes do que mexeu.

## Comandos essenciais

```
conda env create -f environment.yml -n ttw314        # Apple Silicon (dev); Mac Intel: ttw311 (ver CONTRIBUTING.md)
git submodule update --init --recursive              # requer git-lfs (git lfs install)
python -m app --mode web                             # servidor local; --mode desktop abre a janela
pytest libs/ttwtools/tests -q && pytest tests -q     # pacote e servidor
cd frontend-vue && npm ci && npm run build && npm test
python build/build.py                                # pacote PyInstaller; release: CONTRIBUTING.md
```

## Onde está cada coisa

| Onde | O quê |
|---|---|
| `novodesenho/plano.md` | **Comece aqui:** retomar, regras, estado por frente, pendências |
| `novodesenho/armazenamento.md` | Eficiência e formato de arquivo: evidência, proposta, perfis Compacto/Pronto, código nativo |
| `novodesenho/tauri.md` | Migração da casca pywebview → Tauri (branch `tauri_1`): plano, paridade, benchmark `tools/bench`, critérios |
| `novodesenho/macintel.md` | Testes na máquina lenta de referência (Mac Intel): números, problemas, como repetir |
| `novodesenho/interface.md` · `escrita.md` · `verificacao.md` | Frentes de interface, de Escrita e roteiro de verificação manual |
| `novodesenho/novomodelo.md` | Desenho original (citado por `§N` no código) |
| `novodesenho/memoria_para_IA.md` | Percurso e armadilhas, para a IA lembrar |
| `CONTRIBUTING.md` | Ambiente, testes, pacotes, versão e release |
| `app/` · `frontend-vue/` · `libs/ttwtools/` · `build/` | Servidor, interface, pacote (submódulo), empacotamento |

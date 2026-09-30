# Pendências e questões em aberto (reunião de todos os planos)

Criado em 2026-09-29. **Um só lugar** para o que está aberto: lista o que os outros planos ainda deixam pendente e aponta para eles. Ao resolver um item, marque aqui e atualize o plano de origem. Não repete o que já está `[x]` nos planos.

Fontes: `plano_implementacao.md` (PI), `plano_redesign_ui.md` (UI), `novomodelo.md` (NM), `verificacao/`, `plano_visualizacoes.md`, `libs/ttwtools/plano.md`, `libs/ttwtools/todoc.md`, `CHANGELOG.md`.

---

## 1. PRIORIDADE — Otimizar como salvamos e recuperamos corpora e análises

**Observação registrada (pedido do usuário, 2026-09-29).** Precisamos otimizar o processo de salvar corpora e análises de corpora para:

1. **não ocupar tanto espaço temporário (nem memória);**
2. **apagar o que ficar em pastas temporárias depois do uso, ou evitar que fique lá,** sem acumular lixo de dados;
3. **otimizar a lógica geral de salvar e recuperar** dados de um corpus individual (`.ttwc`) e da comparação de corpora (`.ttwa`), num formato **mais robusto** ou num formato **leve**.

### O que aconteceu (contexto e medidas)

Projeto real de `ttwa_files/` (2 corpora, 19 milhões de tokens no total, 5 camadas no corpus grande):

| Medida | Valor |
|---|---|
| Banco descompactado | 2,98 GB (tokens 887 MB + 7 índices ≈ 1,74 GB + `tagged_files` 304 MB + resto ≈ 50 MB) |
| `.ttwa` compactado (gzip) | 1,06 GB; abrir descompacta numa cópia de trabalho de 2,8 GB |
| Corpus grande = 96% dos tokens | `essays_bawe_somentetexto` 18,2 M de 19 M (contando todas as camadas) |
| `.ttwcl` do corpus grande, **com** tabelas de busca (versão inicial) | 1.000 MB, 89 s, pico de disco 6,3 GB |
| `.ttwcl` **sem** tabelas de busca, empacotado direto (atual) | **466 MB, 46 s, pico 3,6 GB**; abrir 1 s; abrir + recriar as tabelas 63 s |
| Memória do processo na exportação | ~158 MB (não é o gargalo; o gargalo é o disco) |

Incidente: a pasta temporária do sistema chegou a **71 GB** (77 cópias de trabalho `ttw_work_*` de 2,8 GB cada, mais 3,9 GB de uma exportação interrompida), deixando o disco com 6,6 GB livres. Causas encontradas: cópia de trabalho só apagada ao trocar de projeto; abertura com **erro** não apagava a pasta parcial; `/quit` saía por `os._exit` sem limpar; a cópia criada pelo pacote se chamava `ttw_XXXX` e a limpeza de órfãs não a reconhecia; a exportação copiava o projeto inteiro antes de apagar o que não ia (3 cópias no pico).

> **Diretrizes do usuário (2026-09-29): o mais leve, de fácil computação em máquina antiga e retrocompatível; entra como beta na 0.6 (versão `0.6.0.dev0`; ponto de retorno: tag `pre-armazenamento-0.6`).**

> **Plano de implementação em passos (Fase A e B): `novodesenho/plano_armazenamento.md`.**

> **Análise e proposta completas: `novodesenho/armazenamento.md`** (solução atual, problemas medidos, ferramentas análogas, modelo proposto em 3 fases e decisões que dependem do usuário).

### Já feito (2026-09-29)

- [x] Exportar copiando **só o que fica** (não copia o projeto todo e apaga); camada a camada, com progresso ("Copiando os dados…").
- [x] Formatos leves (`.ttwcl`, `.ttwal`) saem **sem tabelas de busca por padrão**, empacotando direto (sem a 3ª cópia); caixa "Guardar as tabelas de busca" no diálogo Exportar.
- [x] Pastas temporárias com **dono** (`owner.pid`): ao iniciar, o app apaga as de processos que já morreram (sem esperar 24 h); cobre `ttw_work_`, `ttw_export_` e `ttw_pack_`.
- [x] Cópia de trabalho apagada também em **erro** de abertura, no `/quit` e com SIGTERM.
- [x] Testes: exportação sem lixo temporário, limpeza de órfãs pelo dono, formatos leves.

### Em aberto (decidir e fazer)

**A. Espaço temporário e memória**
- [ ] **Abrir um `.ttwa` compactado ainda descompacta tudo** (2,8 GB) numa cópia de trabalho. Alternativas a avaliar: abrir sem descompactar (arquivo por corpus, ou por partes, com `ATTACH` só do que se usa); descompactar por corpus sob demanda; manter o arquivo sem compactar quando o disco permite.
- [ ] Medir e limitar o pico de disco de **Salvar** e **Salvar como** (compactar um banco de 3 GB usa arquivo `.part` + leitura). Avisar/recusar antes se o disco livre for insuficiente (hoje não há checagem).
- [ ] Recriar as tabelas de busca ao abrir um arquivo leve leva ~63 s no projeto real (corpus grande): tornar incremental, sob demanda por camada, ou guardar os índices mais baratos.
- [ ] Reduzir os **7 índices** (1,74 GB): `idx_tokens_word` e `idx_tokens_lword` (297 MB cada) e `lemma`/`llemma` (209 MB cada) são quase duplicados; um índice por `lower()` bastaria? Medir o efeito na velocidade do KWIC/frequência.
- [ ] `tagged_files` (304 MB) guarda os arquivos etiquetados em texto: ainda é necessário, ou é derivável das camadas?
- [ ] Trocar o empacotamento das camadas (JSON + zlib) por algo mais compacto e rápido (zstd, colunas binárias)?

**B. Lixo em pastas temporárias**
- [ ] Um processo morto à força ainda deixa a pasta até o **próximo início do app** (então é apagada). Avaliar: painel "Uso de disco / Limpar temporários" em Recursos; aviso ao iniciar quando houver lixo grande; limpeza também ao abrir um projeto.
- [ ] Testar a limpeza de órfãs no **Windows e no Linux** (`os.kill(pid, 0)` e caminhos de temporário se comportam diferente).
- [ ] Onde ficam as pastas de textos dos formatos leves (`<nome>_corpus/`) quando a exportação é interrompida: hoje sobra a pasta (ex.: `ttwa_files/essays_bawe_somentetexto_corpus/`, 22 MB, resto de uma exportação interrompida; **não apagada**, decisão do usuário).

**C. Lógica geral de salvar/recuperar (`.ttwc` × `.ttwa`)** — questões de desenho, ligadas a NM §19.1 (que está só na branch `worktree-ideia-ttwc-ttwa`, ainda não mesclada em `new_set26`):
- [ ] **`.ttwc`** = um corpus com texto, metadados, camadas e análises só dele. **`.ttwa`** = análises **entre** corpora. O `.ttwa` referencia os `.ttwc` (por caminho + hash, como o `.ttwl`) ou os embute? E quando um `.ttwc` muda depois da análise: camadas e resultados desatualizados?
- [ ] Onde fica a etiquetagem usada numa comparação: sempre no `.ttwc`, com o `.ttwa` só registrando a camada usada.
- [ ] Migração dos `.ttwa` atuais (misturam corpora, camadas e análises): separar em `.ttwc` + `.ttwa` de comparações, ou aceitar os antigos com tudo embutido.
- [ ] **Definição de "leve"**: NM §9.3 diz que leve = só sem o texto do corpus. Nos dados reais o texto é ~1% do arquivo; "leve" de verdade é **sem tokens e índices**. Hoje `.ttwcl` e `.ttwal` já saem sem as tabelas; o `.ttwl` (projeto inteiro) **não**. Unificar a definição e atualizar o NM.
- [ ] Formato **robusto** (um arquivo que abre pronto) × **leve** (menor, recria ao abrir): quando cada um; opção "Guardar as tabelas de busca" no projeto e na exportação.
- [ ] Relação com os pacotes do catálogo (D6): um corpus do catálogo pode ser um `.ttwc` leve.
- [ ] Limite do SQLite: dezenas de milhões de tokens funcionam; BNC e Hansard (2 bilhões) pedem outra estratégia (NM §9.5).
- [ ] `.ttwt` (compactado antigo): continua valendo para os dois tipos ou ganha um equivalente por tipo.
- [ ] Paridade GUI/CLI (NM §10): comandos para montar análise a partir de `.ttwc`, embutir e separar (hoje: `save-as` com `--corpus`, `save_corpora_as`).

---

## 2. Decisões do plano de implementação (PI, "Decisões pendentes")

- [ ] **D4** Assinatura e notarização (macOS e Windows). Sem elas o sistema mostra avisos ao abrir. Aberta.
- [ ] **D5** Formato do pacote no Windows e no Linux (hoje `.zip`/`.tar.gz` simples; instalador e AppImage depois). Aberta.
- [ ] **D6** Onde hospedar o catálogo de corpora (release do GitHub ou repositório de dados). Aberta; **aguarda o usuário** junto com licenças (4.3).
- [ ] **D8** Nomes dos destinos e do rótulo do corpus ativo (Arquivo, Etiquetagem, Explorar corpus, Comparar corpora, Escrita, Recursos, Aprender). Parcialmente decidido na prática; fechar e registrar.
- [ ] **D9** Padrão recomendado de cada tagger (medir tempo e qualidade).
- [ ] **4.3** licenças dos corpora do catálogo e **5.2** dados reais do OANC/MASC (aguardam o usuário).

## 3. Verificação e correções (PI 6.2 e 6.2a)

- [ ] Mensagens de erro do servidor/pacote saem sempre em português: mapear as comuns para chaves de tradução (pt/en).
- [ ] Testar os **diálogos nativos** na janela desktop (macOS, Windows, Linux); CI e e2e rodam só no modo web (o seletor de arquivo do Exportar também não roda no teste).
- [ ] Continuar `verificacao/macos-arm64.md` do item 4; roteiros de Windows, Linux e **macOS 12 Intel** (não há essas máquinas aqui; listar o que exige teste manual). Falta abrir o pacote numa máquina macOS 12 real (0.6, D10).
- [ ] Revisar LEIAME/README com os nomes novos das telas e os formatos (`.ttwc`, `.ttwcl`, `.ttwal`).
- [ ] 6.3 Release: congelar (tag do submódulo, CHANGELOG completo), conferir o rascunho, publicar; checar `SHA256SUMS.txt`.

## 4. Release 0.5.0 (estado)

- Versão `0.5.0` gravada e tag `v0.5.0` **só local** (não enviada); o `CHANGELOG.md` já tem a seção `[0.5.0]`. **Falta:** decidir o push da branch e da tag (dispara o CI e o rascunho da release); recompilar o pacote com o ícone novo (o `.dmg` gerado tem o ícone antigo); pacote Intel (`--arch x86_64`); teste em macOS 12. O usuário pediu para deixar a compilação para depois de depurar.
- Versão do submódulo `ttwtools` continua `0.2.0.dev0`; a tag própria dele antes da versão final (checklist do `RELEASING.md`).

## 5. Redesign visual (UI) — o que ficou

- [ ] Etapas 5 (Vue Bits: falta a rota `/lab`, BorderGlow/GlareHover, medir CPU), 6 (Responsivo: container queries e gavetas em 1440/1280/1024/768/390) e 7 (verificação final).
- [ ] **Capturas antes/depois** (claro e escuro) de todas as etapas; nenhuma foi feita pelo agente.
- [ ] Daltonismo dos gráficos não verificado (sem simulador); marcadores de forma só no gráfico de médias; contraste do texto sobre as células do divergente e durante o brilho do `ShinyText`.
- [ ] Tabelas: ordenação clicável e números sempre à direita; painel lateral com divisor redimensionável; barra de ações à direita do título.
- [ ] Reescrever componentes base como `.vue` próprios (hoje é CSS sobre o daisyUI); revisar `HelpTip` e o diálogo além das cores.
- [ ] Menu **Recentes** (`<details>`) não fecha ao clicar fora: trocar pelo `MenuButton`.
- [ ] Modal de progresso ainda não cobre as ferramentas de Explorar (busca, frequência, colocados); Comparar já tem (sem botão Cancelar: as rotas são síncronas).

## 6. Leitor, etiquetas e ferramentas de Explorar/Comparar

- [ ] Abrir o Leitor **na ocorrência** clicada na Dispersão (hoje abre no início do texto: só há a posição como fração 0–1).
- [ ] Documentação oficial do MFTE: 18 tags do repertório atual sem correspondência na lista 1.6 (AFX, FU, GER, JJDESCall, JJEpstAtdOther, MDother, PHC, PP1all, PP3all, PP3t, QLIKE, RSTNCother, THAC, ThVSTNCother, ToThNSTNCall, ToVSTNCother, USEDTO, WHAC) e 18 códigos da planilha sem tag; conferir com a versão do MFTE que roda aqui. Traduzir nome e exemplos (operacionalizações ficam em inglês); conferir a **licença de reuso** da lista.
- [ ] Dica global das etiquetas só liga em KWIC, Frequência (classe) e painel do token; faltam Busca, Colocados e gráficos. Em etiquetas ambíguas (`NN`) na camada "automática" a descrição pode vir de outro repertório.
- [ ] "Explicar esta tela": botão retirado; recurso mantido (evento `ttw:explain`); usar nos guias de **Aprender**.
- [ ] Bug não reproduzido: aba em branco em Frequência/Colocados depois de seguir do KWIC ao Leitor e trocar de camada (tratado o caso do arquivo que sumiu; se voltar sem recompilar, anotar a sequência).
- [ ] Exportação SVG/PNG da Dispersão (cópia escondida do gráfico) não foi testada depois da mudança para linhas em HTML.
- [ ] Busca e Colocados com camadas só de tags (BiberPlus, MFTE) sem teste automatizado (KWIC, Frequência e Dispersão têm).

## 7. Questões antigas do desenho (NM) que continuam abertas

- **NM §8:** idiomas de interface além de pt/en e quem traduz/revisa; português como idioma de corpus desde já; quais opções ficam em primeiro plano; compatibilidade com `.ttwa` antigo; limite de tamanho dos corpora embutidos; formatos de importação além de `.txt` (CoNLL-U, XML, PDF?).
- **NM §9.5:** corpora embutidos já indexados e etiquetados como pacotes baixáveis; limite do SQLite (BNC, Hansard); texto do `.ttwa` comprimido; como o `.ttwl` trata corpora embutidos.
- **NM §17.9:** nomes dos destinos e do rótulo do corpus ativo; quem faz protótipos e traduções. Adiados até a fase web: PWA e hospedagem do servidor.

## 8. Documentos antigos com caixas soltas (revisar e fechar)

- `plano_visualizacoes.md` (677 linhas) e `libs/ttwtools/plano.md`, `libs/ttwtools/todoc.md`: têm `[ ]` de fases já superadas (por exemplo coluna `tagger_type`, ambiente de build isolado, assinar executável). **Não foram conferidos**: revisar item a item, marcar o que já foi feito e mover o que continua valendo para cá.
- `novodesenho/plano_escrita.md`, `ferramentaescrita.md`: ferramenta de Escrita experimental; sem lista de pendências própria.

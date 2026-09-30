# Relatório de armazenamento do TTWtools

## Máquina

- Data: 2026-09-30 06:46
- Sistema: macOS-10.16-x86_64-i386-64bit
- Processador: Intel(R) Core(TM) i5-5287U CPU @ 2.90GHz (4 núcleos lógicos)
- Memória: 17.180 MB
- Python 3.11.13 · SQLite 3.50.2 · ttwtools 0.2.0.dev0 (commit e1e01b0)

## 1. Velocidade bruta da máquina

| medida | resultado |
|---|---|
| codificar camadas (`TCL1`) | 272 mil tokens/s |
| decodificar camadas | 397 mil tokens/s |
| SHA-256 (chave do cache) | 155 MB/s |
| zlib nível 1 (salvar compactado) | 31 MB/s |

_Referência (Apple Silicon M-series): codificar ~890 mil tokens/s, decodificar ~3.300 mil tokens/s._

## 2. Índice de busca em projeto sintético (1.000.000 tokens)

| conjunto | tamanho_mb | criar_s | kwic_forma_s | kwic_raro_s | kwic_lema_pos_s | kwic_pos_s | busca_s | frequencia_s | colocados_s | dispersao_s |
|---|---|---|---|---|---|---|---|---|---|---|
| antigo (7) | 130.2 | 6.87 | 0.059 | 0.002 | 0.021 | 0.089 | 0.03 | 5.302 | 5.287 | 0.139 |
| reduzido (5, adotado) | 102.9 | 4.79 | 0.07 | 0.003 | 0.019 | 0.093 | 0.033 | 5.741 | 5.506 | 0.148 |

_Tempos em segundos. Referência (M-series, 2 milhões de tokens): criar os índices 2,7 s; KWIC 0,03 s; frequência 1,8 s._

## 3. Projeto real: `CorIFAessays_vs_essays_bawe_somentetexto.ttwa` (330 MB)

> **Teste interrompido manualmente** (Ctrl-C pelo terminal) durante a etapa **I** (abrir sem tabelas com índice em cache, 1ª vez). Não houve erro em nenhuma etapa. Como o processo foi encerrado pelo terminal, o relatório automático parou na seção 2; os números abaixo foram transcritos da saída do terminal.

- Corpus maior: 18.982.144 tokens (~19 milhões); 1.526 documentos; 10.682 camadas.
- Na abertura (etapa A) o projeto foi migrado do esquema 0.2 para 0.3.
- Espaço em disco: o teste pediu ~9× o arquivo (330 MB); a pasta de trabalho chegou a 3,0 GB.

| etapa | tempo |
|---|---|
| copiar o projeto para a pasta de trabalho (o original não é tocado) | 1,2 s |
| A. abrir o arquivo original | **14,3 min** |
| B. consultas com as tabelas dentro do projeto | 89,9 s |
| C. compactar (simulação) | 10,4 min |
| C. compactar (remoção + VACUUM) | 11,3 min |
| D. salvar com tabelas de busca (compactado) | 28,6 s |
| E. salvar SEM tabelas de busca (compactado) | 6,2 min |
| F. exportar o corpus maior (`.ttwcl`, leve) | 2,7 min |
| G. abrir COM tabelas | 12,6 s |
| H. abrir SEM tabelas, cache desligado (recria as tabelas em toda abertura) | 5,3 min |
| I. abrir SEM tabelas com índice em cache, 1ª vez (constrói) | **interrompido** |

### Resumo das opções (parcial — tamanhos de arquivo não foram medidos)

| opção | abrir (1ª vez) | abrir (demais) | arquivo em disco | banco de trabalho | cache |
|---|---|---|---|---|---|
| **1. com tabelas de busca** | 12,6 s | 12,6 s | — | — | — |
| **2. sem tabelas + índice em cache** | — (interrompido) | — | — | — | — |
| **3. sem tabelas, sem cache** (recria sempre) | 5,3 min | 5,3 min | — | — | — |

Observação: as etapas C (compactar) dominaram o tempo; a abertura sem cache (H) já é ~5 min, e a abertura original (A) levou 14 min (inclui a migração 0.2→0.3). A etapa I, que é a mais longa e define a decisão, não terminou.

## 4. Para decidir

_(Sem a etapa I não há recomendação automática. Preencher as respostas abaixo.)_

### Suas respostas (preencha e envie este arquivo de volta)

- [ ] Esperar a 1ª abertura com barra de progresso é aceitável? Quanto, no máximo? ______ min
- [ ] Espaço de cache (em disco) é aceitável? Quanto, no máximo? ______ GB
- [ ] Prefiro que o arquivo **abra pronto** (maior, sem espera) quando a máquina é lenta? sim / não / como opção
- [ ] O tamanho do arquivo em disco importa mais do que o tempo de abrir? sim / não
- Observações (travou? barra de progresso clara? mensagens de erro?):


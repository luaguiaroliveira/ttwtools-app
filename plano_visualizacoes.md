# Plano de Implementação — Visualizações da Tela "Resultados"

**Versão:** 0.4 — 2026-05-05  
**Estado geral:** em andamento — abas + 6 visualizações implementadas; text-viewer integrado

## Resumo do progresso

| # | Visualização / componente | Arquivo | Estado |
|---|---|---|---|
| 1 | Sistema de abas (Comparação / Corpus individual / Redução) | `index.html`, `style.css`, `results.js` | ✅ implementado |
| 2 | Bar chart KFA (existente) — top x-axis mirror, margin.top=22 | `chart.js` | ✅ melhorado |
| 3 | Scatter de médias C1×C2 | `viz-comparison.js` | ✅ implementado |
| 4 | Bubble chart | `viz-comparison.js` | ✅ implementado |
| 5 | Strip / Jitter plot + click → text-viewer | `viz-comparison.js` | ✅ implementado |
| 6 | Radar chart | `viz-single.js` | ✅ implementado |
| 7 | Violin / Box plot | `viz-single.js` | ✅ implementado |
| 8 | Coordenadas paralelas | — | ❌ **removido** (sem utilidade prática) |
| 9 | Heatmap comparativo (ambos corpora clusterizados juntos) | `viz-comparison.js`, `app/routes/viz.py` | ✅ implementado |
| 10 | Histograma + KDE | — | ❌ **removido** (aba individual simplificada) |
| 11 | Controles redução dimensional (UI) | `viz-reduction.js` | ✅ implementado |
| 12 | PCA 2D, PCA 3D, t-SNE, UMAP, MDS, Force | — | ⏳ aguarda `POST /api/viz/reduction` |
| B1 | `GET /api/viz/rawdata` | `app/routes/viz.py` | ✅ implementado |
| B2 | `GET /api/viz/heatmap` | `app/routes/viz.py` | ✅ implementado (corpus individual, mantido) |
| B3 | `GET /api/viz/heatmap_combined` | `app/routes/viz.py` | ✅ implementado (novidade desta sessão) |
| B4 | `GET /api/viz/kde` | — | ⏳ não iniciado |
| B5 | `POST /api/viz/reduction` | `app/routes/viz.py` | ✅ implementado |

### Mudanças estruturais desta sessão (v0.3 → v0.4)

| # | Pedido do usuário | Solução implementada |
|---|---|---|
| 1 | Retirar coordenadas paralelas | Removido de subtabs, painel, imports e dispatch |
| 2 | Retirar histograma da aba individual | Removido de subtabs, painel, imports e dispatch |
| 3 | Heatmap deve comparar ambos os corpora | Novo endpoint `/api/viz/heatmap_combined` + `renderHeatmapComparison()` com faixa lateral corpus |
| 4 | Click em strip plot → abre texto com tag já selecionado | `pt.x` (feature name) passado como `activeTag`; `_openTextFromPoint(filename, corpus, feature)` |
| 5 | Painel de tags comprimido → handler de resize | `#tv-resize-handle` div entre text-pane e aside; drag JS em `initTextViewer` |
| 6 | Botão "Detalhamento" deve voltar para a tela anterior | `state.tvOriginView` salvo em `showTextViewer`; btn-tv-back usa esse valor |
| 7 | Bug: `null is not an object (offsetParent)` em PyWebView | Monkey-patch `HTMLElement.prototype.offsetParent` para retornar `document.documentElement` quando `null` |

---

---

## 0. Visão geral da arquitetura

### Dados disponíveis hoje (sem alterações no .ttwa)

| Dado | Endpoint atual | Conteúdo |
|---|---|---|
| KFA aggregated | `GET /api/analysis/kfa/{c1}/{c2}` | Mean, Std, N, d_biber, d_pond por feature |
| Feature table completa | `GET /api/analysis/features/{corpus}/norm1000` | Matriz texto × feature (valores norm/1000 palavras) |
| Metadados | `GET /api/project/manifest` | Nomes de corpus, taggers disponíveis |

**Conclusão:** as três categorias de visualização (em separado, em comparação, redução de dimensionalidade) operam exclusivamente sobre a `feature table norm1000`, que **já existe no .ttwa atual**. Nenhum novo dado precisa ser gravado no arquivo para implementar as visualizações.

### Estratégia de retrocompatibilidade

- Nenhuma escrita nova no `.ttwa` é necessária.
- Cálculos de redução de dimensionalidade (PCA, t-SNE etc.) são feitos **on-demand** pelo backend e retornados como JSON — não são cacheados.
- Se no futuro quisermos cache de reduções, podemos adicioná-las como entradas opcionais no `.ttwa` com chave versionada (`viz/pca/v1/...`); arquivos antigos simplesmente não terão essa chave e o backend recalcula.

---

## 1. Interface gráfica — estrutura da tela "Resultados"

**Estado:** `[x] implementado` — HTML em `index.html`, CSS em `style.css`, JS em `results.js`

### Layout proposto

A tela "Resultados" (`#view-results`) ganha três abas no topo:

```
[ Comparação ]  [ Corpus individual ]  [ Redução dimensional ]
```

A aba **Comparação** é a padrão (contém o bar chart atual + novas visualizações).  
As outras duas aparecem somente quando os dados necessários estão carregados.

### Controles globais (persistem entre abas)

| Controle | Tipo | Função |
|---|---|---|
| Seletor KFA / análise | `<select>` (já existe) | Qual KFA carregar |
| Corpus 1 / Corpus 2 | label somente leitura | Mostra os dois corpora em foco |
| Tagger | label somente leitura | Tagger da análise carregada |
| Top-N features | `<input number>` default 20 | Limita visualizações densas | `[x]` |
| Filtro de features | `<input text>` (já existe) | Filtra por nome | `[x]` |
| Efeito mínimo \|d\| | `<input number>` (já existe) | Aplica a todas as visualizações | `[x]` |

---

## 2. Aba "Comparação"

### 2.1 Bar chart KFA (já implementado)

**Estado:** `[x] implementado`

Nenhuma alteração necessária aqui.

---

### 2.2 Scatter de médias (Corpus 1 × Corpus 2)

**Estado:** `[x] implementado` — `viz-comparison.js::renderScatter()`

#### O que é
Gráfico de dispersão onde cada ponto é uma feature.  
- Eixo X = `Mean_Corpus1`  
- Eixo Y = `Mean_Corpus2`  
- Cor do ponto = tamanho do efeito `d_biber` (escala divergente: azul → branco → laranja)  
- Tamanho do ponto = fixo (ou opcional: N total de ocorrências)  
- Linha diagonal pontilhada = igualdade (y = x); pontos acima → mais frequente em C2  
- Hover: nome da feature, d, médias, DP  
- Click: abre o `feature-detail` existente  

#### Dados necessários
`state.kfaData.results` — **já disponível, sem novo endpoint**.

#### Dependências frontend
`plotly.js` (ver Seção 5).

#### Implementação (checklist)
```
[x] Adicionar sub-tab "Scatter" dentro da aba Comparação
[x] Criar função renderScatter() em viz-comparison.js
[x] Traçar reta y = x com Plotly shapes
[x] Colorir pontos por d_biber com escala divergente azul→cinza→laranja
[x] Hover template com Feature, d_biber, Mean_C1, Mean_C2, Std
[ ] Click em ponto → showFeatureDetail(feature)
[x] Responde ao controle Top-N global
```

---

### 2.3 Bubble chart (Scatter + terceira dimensão)

**Estado:** `[x] implementado` — `viz-comparison.js::renderBubble()`

#### O que é
Igual ao scatter de médias, mas o tamanho da bolha codifica o desvio-padrão médio  
`(Std_Corpus1 + Std_Corpus2) / 2` — bolhas grandes = feature muito variável entre textos.  
Alternativa selecionável: tamanho = N de ocorrências totais.

#### Dados necessários
`state.kfaData.results` — **já disponível**.

#### Implementação (checklist)
```
[x] renderBubble() separado em viz-comparison.js
[x] <select> "Tamanho da bolha: DP médio | N total" → state.bubbleSizeEnc
[x] Tamanhos normalizados para intervalo [8, 36] px
[ ] Click em ponto → showFeatureDetail(feature)
```

---

### 2.4 ~~Parallel coordinates~~ — **REMOVIDO**

**Estado:** `[x] removido` — sem utilidade prática, subtab e painel eliminados.

---

### 2.5 Strip / Jitter plot

**Estado:** `[x] implementado` — `viz-comparison.js::renderStrip()`

#### O que é
Para cada feature selecionada: pontos individuais (um por texto) dispostos  
em duas colunas verticais (C1 | C2), com jitter horizontal aleatório.  
Revela toda a distribuição, não só resumos — mostra outliers individuais.  
Click em ponto → abre text-viewer para aquele texto, com a feature do eixo X já selecionada para highlight.

#### Implementação (checklist)
```
[x] renderStrip() em viz-comparison.js
[x] Plotly box com boxpoints='all', jitter=0.35, box+whisker transparentes
[x] Colorir pontos por corpus (laranja C1, azul C2)
[x] customdata com filename por ponto; plotly_click → onPointClick(filename, corpus, feature)
[x] _openTextFromPoint(filename, corpus, feature) → showTextViewer(..., feature, 'results')
[x] Top-N features controlado pelo controle global
[ ] Overlay com médias e DP
```

---

## 3. Aba "Corpus individual"

### Controles desta aba

| Controle | Tipo | Padrão |
|---|---|---|
| Corpus selecionado | `<select>` C1 \| C2 | C1 |
| Feature(s) selecionada(s) | `<select multiple>` | top 20 por \|d\| |
| Ordenar features por | `<select>` \|d\| \| média \| nome | \|d\| |

Todos os gráficos desta aba reagem ao corpus selecionado e à lista de features.

---

### 3.1 Box / Violin plot por feature

**Estado:** `[x] implementado` — `viz-single.js::renderViolin()`

#### O que é
Um violin (ou box) por feature, mostrando a distribuição dos valores norm1000  
nos textos do corpus selecionado.  
- Eixo X: features (top-N selecionadas)  
- Eixo Y: valor normalizado  
- Box interno ao violin (caixa IQR + mediana)  
- Toggle violin ↔ box  
- Hover: texto, valor, corpus  

#### Dados necessários
Feature table de **um** corpus — `GET /api/analysis/features/{corpus}/norm1000` (já existe).

#### Implementação (checklist)
```
[x] renderViolin() em viz-single.js
[x] Plotly violin com box visible, meanline, C1 lado esquerdo / C2 lado direito
[ ] Toggle violin ↔ box
[x] Cores: laranja C1, azul C2
[ ] Click em outlier → showTextViewer()
[ ] Scroll horizontal quando N features > 15
```

---

### 3.2 Heatmap comparativo (ambos corpora)

**Estado:** `[x] implementado` — `viz-comparison.js::renderHeatmapComparison()` + `GET /api/viz/heatmap_combined`

#### O que é
Heatmap onde linhas = todos os textos dos dois corpora clusterizados juntos.  
Colunas = top-N features (por variância combinada), reordenadas por ward linkage.  
Faixa lateral estreita (`xaxis2`) identifica o corpus de cada texto (laranja C1, azul C2).  
Se os textos dos dois corpora têm perfis linguísticos distintos, as cores se agrupam naturalmente.

#### Dados necessários
`GET /api/viz/heatmap_combined?c1=&c2=&top_n=` — retorna `z, x, y, corpus_labels, c1_name, c2_name`.

#### Implementação (checklist)
```
[x] Endpoint GET /api/viz/heatmap_combined (app/routes/viz.py)
[x] Interseção de features comuns entre os dois corpora
[x] Clusterização hierárquica (ward) sobre matriz combinada (n_c1 + n_c2) × n_features
[x] renderHeatmapComparison() em viz-comparison.js
[x] Faixa lateral de identificação de corpus (Plotly xaxis2)
[x] Legenda com nomes dos corpora via annotations
[x] Cache por (c1, c2, topN) em state.heatmap_combined_*
[ ] Click em linha → showTextViewer()
```

---

### 3.3 ~~Histograma + KDE~~ — **REMOVIDO da aba individual**

**Estado:** `[x] removido` — código do `renderHistogram` permanece em `viz-single.js` mas subtab e painel foram eliminados.

---

### 3.4 Radar chart — perfil do corpus

**Estado:** `[x] implementado` — `viz-single.js::renderRadar()`

#### O que é
Gráfico de teia (spider/radar) onde cada eixo radial é uma feature.  
Um polígono = médias do corpus selecionado.  
Opcionalmente sobrepõe os dois corpora para comparação rápida.  
Ideal para as 10–15 features com maior \|d\|.

#### Dados necessários
Apenas `Mean_Corpus1` e `Mean_Corpus2` do `state.kfaData.results` — **sem novo endpoint**.

#### Implementação (checklist)
```
[x] renderRadar() em viz-single.js usando Plotly scatterpolar
[x] Top-N features controlado pelo controle global
[x] Toggle "Sobrepor ambos os corpora" (state.radarBoth) → dois polígonos
[x] Normalização por feature (0–max entre C1 e C2); hover mostra valor real
[x] Legenda com nomes dos corpora
```

---

### 3.4 Histograma por feature com KDE

**Estado:** `[x] implementado` — `viz-single.js::renderHistogram()` (KDE gaussiana calculada no frontend)

#### O que é
Para uma feature selecionada: histograma dos valores dos textos,  
com curva KDE (kernel density estimate) sobreposta.  
Modo de comparação: dois histogramas semitransparentes (C1 e C2) no mesmo eixo.

#### Dados necessários
Feature table completa (ambos os corpora) — mesmo endpoint da Seção 4.1.

#### Implementação (checklist)
```
[x] Criar função renderHistogram(data, feature, opts)
[x] Usar Plotly histogram com opacity=0.6 e barmode='overlay'
[x] KDE gaussiana calculada no frontend (sem dependência extra)
[x] <select> para escolher a feature a exibir
```

---

## 4. Aba "Redução dimensional"

**Estado da aba (UI/controles):** `[x] implementado` — `viz-reduction.js::initReduction()` com seletor de método, parâmetros dinâmicos e botão "Calcular" **funcional**. Backend `POST /api/viz/reduction` implementado (PCA 2D/3D, t-SNE, UMAP, MDS). Renderers Plotly completos.

### Controles desta aba

| Controle | Tipo | Padrão |
|---|---|---|
| Método | `<select>` PCA 2D \| PCA 3D \| t-SNE \| UMAP \| MDS \| Force-directed | PCA 2D |
| Colorir por | `<select>` Corpus \| Feature (gradiente) | Corpus |
| Top-N features (entrada) | `<input number>` | 30 |
| [t-SNE] Perplexity | `<input number>` | 30 |
| [UMAP] n_neighbors | `<input number>` | 15 |
| [MDS] Métrica | `<select>` euclidiana \| cosseno | euclidiana |
| Botão "Calcular" | `<button>` | — |

O cálculo é **sempre disparado sob demanda** (não automático), pois algumas  
reduções (t-SNE, UMAP) podem levar segundos.

---

### 4.1 PCA 2D — biplot

**Estado:** `[ ] pendente` — UI pronta, aguarda `POST /api/viz/reduction`

#### O que é
Projeção dos textos nos dois primeiros componentes principais.  
- Pontos = textos, cor = corpus  
- Vetores (loadings) = direção das features originais no espaço PCA  
- Eixos rotulados com % de variância explicada  
- Hover em ponto: nome do arquivo, corpus, PC1, PC2  
- Hover em vetor: nome da feature  

#### Dados necessários
Novo endpoint `POST /api/viz/reduction` com `method=pca` (Seção 4.4).

#### Implementação (checklist)
```
[ ] Novo endpoint POST /api/viz/reduction (Seção 4.4)
[ ] Criar función renderPCA2D(result) usando Plotly scatter
[ ] Adicionar setas de loading com Plotly layout.shapes ou annotations
[ ] Scree plot opcional: % variância por componente (barras)
[ ] Toggle "Mostrar loadings"
[ ] Toggle "Mostrar elipses de confiança" (elipse de covariância por corpus)
[ ] Click em ponto → showTextViewer()
```

---

### 4.2 PCA 3D interativo

**Estado:** `[ ] pendente` — UI pronta, aguarda `POST /api/viz/reduction`

#### O que é
Mesmo que PCA 2D mas com três componentes.  
Usa `Plotly.scatter3d` — rotação interativa nativa.

#### Dados necessários
Mesmo endpoint `POST /api/viz/reduction` com `method=pca&n_components=3`.

#### Implementação (checklist)
```
[ ] Criar renderPCA3D(result) usando Plotly scatter3d
[ ] Cores e hover iguais ao PCA 2D
[ ] Botão "Exportar como PNG" via Plotly.downloadImage
```

---

### 4.3 t-SNE

**Estado:** `[ ] pendente` — UI pronta (parâmetros expostos), aguarda `POST /api/viz/reduction`

#### O que é
Redução não-linear preservando vizinhanças locais.  
Boa para revelar clusters de textos com perfis linguísticos similares.

#### Dados necessários
Endpoint `POST /api/viz/reduction` com `method=tsne`.

#### Avisos ao usuário
- "Distâncias entre clusters não são interpretáveis no t-SNE"  
- "Resultados variam a cada execução (random_state=42 por padrão)"  

#### Implementação (checklist)
```
[ ] Backend: sklearn.manifold.TSNE (Seção 4.4)
[ ] Parâmetros expostos: perplexity, n_iter (default 1000), random_state
[ ] Spinner + desabilitar botão durante cálculo
[ ] Alerta informativo no painel
[ ] Renderizar com Plotly scatter (igual PCA 2D)
```

---

### 4.4 UMAP

**Estado:** `[ ] pendente` — UI pronta, aguarda `POST /api/viz/reduction` + verificação de umap-learn

#### O que é
Alternativa ao t-SNE mais rápida e com melhor preservação de estrutura global.

#### Dados necessários
Endpoint `POST /api/viz/reduction` com `method=umap`.

#### Dependência extra
Pacote `umap-learn` — **não está no requirements.txt atual** (verificar).

#### Implementação (checklist)
```
[ ] Verificar/adicionar umap-learn a requirements.txt e environment.yml
[ ] Backend: umap.UMAP (Seção 4.4)
[ ] Parâmetros: n_neighbors, min_dist
[ ] Detecção de import: se umap não instalado, exibir aviso amigável
[ ] Renderizar com Plotly scatter
```

---

### 4.5 MDS

**Estado:** `[ ] pendente` — UI pronta, aguarda `POST /api/viz/reduction`

#### O que é
Escalonamento multidimensional a partir de matriz de distâncias entre textos.  
Preserva distâncias globais — mais interpretável que t-SNE.

#### Dados necessários
Endpoint `POST /api/viz/reduction` com `method=mds`.

#### Implementação (checklist)
```
[ ] Backend: sklearn.manifold.MDS com metric=True (Seção 4.4)
[ ] Seleção de métrica de distância: euclidiana | cosine (via pairwise_distances)
[ ] Renderizar com Plotly scatter
```

---

### 4.6 Force-directed graph

**Estado:** `[ ] pendente` — UI pronta, aguarda `POST /api/viz/reduction` com method=force

#### O que é
Nós = textos; arestas com peso = similaridade de cosseno entre vetores de features.  
Layout força-dirigida (D3 force simulation).  
Textos do mesmo corpus naturalmente se atraem quando há separação.

#### Dados necessários
Endpoint `POST /api/viz/reduction` com `method=force` que retorna  
nós `{id, corpus, filename}` e arestas `{source, target, weight}` filtradas  
para peso acima de um limiar (default: top-K arestas por nó).

#### Implementação (checklist)
```
[ ] Backend: calcular pairwise cosine similarity, retornar top-K vizinhos
[ ] Parâmetro K (default 5): controla densidade do grafo
[ ] Frontend: D3 forceSimulation com forceManyBody + forceLink
[ ] Nós coloridos por corpus; tamanho = N palavras do texto
[ ] Hover: nome do arquivo, corpus, similaridade com vizinhos
[ ] Click em nó → showTextViewer()
[ ] Slider "Threshold de similaridade" refiltra arestas sem novo cálculo
```

---

## 5. Novos endpoints de backend

### 5.1 `GET /api/viz/rawdata`

```
Parâmetros: c1, c2, tagger1, tagger2, features[] (opcional)
Resposta:
{
  "corpus1": { "name": str, "tagger": str, "n_docs": int, "docs": [{"filename": str, "feat1": float, ...}] },
  "corpus2": { "name": str, "tagger": str, "n_docs": int, "docs": [{"filename": str, "feat1": float, ...}] },
  "features": [ str, ... ]          // interseção de colunas numéricas
}
```

**Usado por:** strip plot (2.5), violin/box (3.1), coordenadas paralelas (2.4), histograma (3.4).  
**Implementação:** `app/routes/viz.py` — lê `load_feature_table` de ambos, filtra NaN/Inf.  
**Estado:** `[x] implementado`

---

### 5.2 `GET /api/viz/heatmap`

```
Parâmetros: corpus, tagger, top_n (default 30)
Resposta:
{
  "z": [[float]],           // matriz reordenada (linhas=textos, colunas=features)
  "x": [str],               // nomes das features (ordem pós-clustering)
  "y": [str],               // nomes dos arquivos (ordem pós-clustering)
  "row_order": [int],       // índices para referência
  "col_order": [int]
}
```

**Implementação backend:** `scipy.cluster.hierarchy` (ward + euclidean).  
**Estado:** `[ ] não iniciado`

---

### 5.3 `GET /api/viz/kde`

```
Parâmetros: c1, c2, tagger, feature
Resposta:
{
  "corpus1": { "x": [float], "y": [float] },
  "corpus2": { "x": [float], "y": [float] }
}
```

**Implementação backend:** `scipy.stats.gaussian_kde`.  
**Estado:** `[ ] não iniciado`  
**Alternativa:** calcular no frontend com biblioteca JS pequena (evita round-trip).

---

### 5.4 `POST /api/viz/reduction`

```
Body:
{
  "corpus1_name": str,
  "corpus2_name": str,
  "tagger": str,
  "method": "pca" | "tsne" | "umap" | "mds" | "force",
  "n_components": 2 | 3,        // pca/tsne/umap/mds
  "top_n_features": 30,
  "perplexity": 30,             // tsne
  "n_iter": 1000,               // tsne
  "n_neighbors": 15,            // umap
  "min_dist": 0.1,              // umap
  "metric": "euclidean",        // mds / force
  "top_k_edges": 5,             // force
  "random_state": 42
}

Resposta (pca/tsne/umap/mds):
{
  "method": str,
  "coords": [
    { "filename": str, "corpus": str, "x": float, "y": float, "z": float|null }
  ],
  "loadings": [                 // só para pca
    { "feature": str, "pc1": float, "pc2": float }
  ],
  "explained_variance": [float],  // só para pca
  "n_features_used": int
}

Resposta (force):
{
  "method": "force",
  "nodes": [ { "id": str, "corpus": str, "filename": str } ],
  "edges": [ { "source": str, "target": str, "weight": float } ]
}
```

**Implementação backend:**  
```python
# pca:  sklearn.decomposition.PCA
# tsne: sklearn.manifold.TSNE
# umap: umap.UMAP  (import condicional, graceful fallback)
# mds:  sklearn.manifold.MDS + sklearn.metrics.pairwise_distances
# force: pairwise cosine similarity + top-K filter
```

**Estado:** `[ ] não iniciado`

---

## 6. Text Viewer — melhorias implementadas

| Melhoria | Implementação |
|---|---|
| Click em strip plot passa feature para highlight | `onPointClick(filename, corpus, feature)` → `showTextViewer(files, idx, feature, 'results')` |
| Botão "Detalhamento" volta para a tela de origem | `state.tvOriginView` salvo em `showTextViewer`; `btn-tv-back` usa `showView(state.tvOriginView)` |
| Painel de tags com handler de resize | `#tv-resize-handle` div; drag JS em `initTextViewer`; min 112px, max 480px |
| Bug offsetParent em PyWebView (PagedJS) | Monkey-patch de `HTMLElement.prototype.offsetParent` → fallback para `document.documentElement` |

---

## 7. Dependências novas

### Backend (Python)

| Pacote | Versão mínima | Já no requirements? | Onde usado |
|---|---|---|---|
| `scikit-learn` | ≥ 1.3 | verificar | PCA, t-SNE, MDS, cosine |
| `scipy` | ≥ 1.10 | verificar | heatmap clustering, KDE |
| `umap-learn` | ≥ 0.5 | **não** | UMAP |

Adicionar a `requirements.txt`, `environment.yml` e `pyproject.toml` se ausentes.  
`umap-learn` é opcional: fazer import condicional com erro HTTP 422 explicativo se ausente.

### Frontend (JavaScript)

| Pacote | Versão | Por quê |
|---|---|---|
| `plotly.js-dist-min` | ≥ 2.30 | violin, scatter3d, parcoords, heatmap, radar |

Instalar via npm: `npm install plotly.js-dist-min`  
Importar apenas os módulos necessários para manter o bundle menor:  
```js
// vite.config.js — tree-shaking via import específico
import Plotly from 'plotly.js-dist-min'
```

D3 (já presente) é mantido para o bar chart atual e para o force-directed graph.

---

## 8. Mudanças nos arquivos existentes

| Arquivo | Mudança necessária |
|---|---|
| `frontend-src/index.html` | Adicionar seção de abas em `#view-results`; controles das novas abas |
| `frontend-src/src/views/results.js` | Adicionar lógica de tabs; importar módulos de viz |
| `frontend-src/src/state.js` | Adicionar `state.vizData`, `state.rawData`, `state.reductionData` |
| `frontend-src/src/api.js` | Adicionar `api.viz.*` (rawdata, heatmap, kde, reduction) |
| `frontend-src/package.json` | Adicionar `plotly.js-dist-min` |
| `app/routes/analysis.py` | Adicionar rota `/viz/*` ou criar novo arquivo `app/routes/viz.py` |
| `app/server.py` | Registrar router de viz |
| `requirements.txt` / `environment.yml` | Verificar/adicionar scipy, scikit-learn, umap-learn |

**Recomendação:** criar `app/routes/viz.py` separado para não poluir `analysis.py`.  
Criar `frontend-src/src/views/viz-single.js` e `frontend-src/src/views/viz-reduction.js`  
como módulos separados importados por `results.js`.

---

## 9. Ordem de implementação recomendada

As etapas abaixo são ordenadas por menor dependência → maior retorno visual imediato.

| # | Tarefa | Bloco | Pré-requisitos | Estado |
|---|---|---|---|---|
| 1 | Instalar plotly.js-dist-min, configurar import | setup | — | `[ ]` |
| 2 | Criar sistema de abas em #view-results | UI | — | `[ ]` |
| 3 | Scatter de médias C1 × C2 (2.2) | Comparação | plotly, tabs | `[ ]` |
| 4 | Bubble chart (2.3) | Comparação | scatter pronto | `[ ]` |
| 5 | Radar chart (3.3) | Individual | plotly, tabs, kfaData | `[ ]` |
| 6 | Endpoint /api/viz/rawdata (5.1) | Backend | — | `[ ]` |
| 7 | Strip/Jitter plot (2.5) | Comparação | rawdata endpoint | `[ ]` |
| 8 | Box/Violin plot (3.1) | Individual | rawdata endpoint | `[ ]` |
| 9 | Histograma + KDE (3.4) | Individual | rawdata endpoint | `[ ]` |
| 10 | Parallel coordinates (2.4) | Comparação | rawdata endpoint | `[ ]` |
| 11 | Endpoint /api/viz/heatmap (5.2) | Backend | scipy | `[ ]` |
| 12 | Heatmap texto × feature (3.2) | Individual | heatmap endpoint | `[ ]` |
| 13 | Endpoint /api/viz/reduction PCA (5.4) | Backend | sklearn | `[ ]` |
| 14 | PCA 2D biplot (4.1) | Redução | reduction endpoint | `[ ]` |
| 15 | PCA 3D (4.2) | Redução | PCA 2D | `[ ]` |
| 16 | MDS (4.5) | Redução | reduction endpoint | `[ ]` |
| 17 | t-SNE (4.3) | Redução | reduction endpoint | `[ ]` |
| 18 | UMAP (4.4) | Redução | umap-learn, reduction | `[ ]` |
| 19 | Force-directed graph (4.6) | Redução | reduction endpoint, D3 | `[ ]` |

---

## 10. Notas de UX

- **Performance:** mostrar spinner durante fetch de rawdata e reduction. Para corpus > 200 textos, exibir aviso de tempo estimado antes de calcular t-SNE/UMAP.
- **Feature table ausente:** se o corpus selecionado não tiver `norm1000` salva, mostrar mensagem "Execute o tagging primeiro" com botão de ação.
- **Consistência de cores:** laranja (`oklch(72% 0.17 55)`) = C1, azul (`#5b9cf6`) = C2 — manter o mesmo padrão do bar chart atual em todas as novas visualizações.
- **Exportação:** todas as visualizações Plotly devem exibir o botão nativo de download PNG do Plotly (config `{ displaylogo: false, modeBarButtonsToRemove: [...] }`).
- **Responsividade:** usar `Plotly.react()` (não `newPlot`) nos re-renders para evitar piscar.

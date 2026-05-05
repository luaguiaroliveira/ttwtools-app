"""
routes/viz.py — Endpoints de dados brutos e redução dimensional.

GET  /api/viz/rawdata   — feature table norm/1000 por documento (dois corpora)
POST /api/viz/reduction — redução dimensional (PCA 2D/3D, t-SNE, UMAP, MDS)
GET  /api/viz/heatmap   — feature table clusterizada (heatmap texto × feature)
"""

from __future__ import annotations

import math
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from app import state as app_state

router = APIRouter()

# Colunas que não são features linguísticas
_META_COLS = {"filename", "field", "section", "Words", "TTR", "word_count", "n_words"}


def _require_project():
    if not app_state.current_project_path:
        raise HTTPException(status_code=400, detail="Nenhum projeto aberto.")


def _load_feature_table(corpus_name: str, tagger_type: Optional[str]):
    """Abre o projeto e carrega a feature table norm1000. Retorna (df, tagger_type_usado)."""
    from ttwtools.project import TTWAProject

    with TTWAProject.open(app_state.current_project_path) as proj:
        if tagger_type is None:
            for ft in proj.list_feature_tables():
                if ft["corpus_name"] == corpus_name and ft["table_type"] == "norm1000":
                    tagger_type = ft["tagger_type"]
                    break

        if tagger_type is None:
            raise HTTPException(
                status_code=404,
                detail=f"Feature table norm1000 não encontrada para '{corpus_name}'.",
            )

        df = proj.load_feature_table(corpus_name, "norm1000", tagger_type=tagger_type)

    if df is None:
        raise HTTPException(
            status_code=404,
            detail=f"Feature table norm1000 não encontrada para '{corpus_name}'.",
        )

    return df, tagger_type


def _feat_cols(df) -> list[str]:
    return [
        c for c in df.columns
        if c not in _META_COLS and df[c].dtype.kind in ("i", "u", "f")
    ]


def _rows_to_records(df, file_col: str, feats: list[str]) -> list[dict]:
    records = []
    for _, row in df.iterrows():
        rec: dict = {"filename": str(row.get(file_col, ""))}
        for f in feats:
            v = row.get(f, 0.0)
            # Replace NaN/Inf with 0 for safe JSON serialisation
            rec[f] = float(v) if (v == v and not math.isinf(v)) else 0.0
        records.append(rec)
    return records


@router.get("/rawdata")
def get_rawdata(
    c1: str,
    c2: str,
    tagger1: Optional[str] = None,
    tagger2: Optional[str] = None,
    features: Optional[List[str]] = Query(default=None),
):
    """
    Retorna a feature table norm/1000 por documento para dois corpora.

    Parâmetros:
      - c1, c2:       nomes dos corpora (obrigatório)
      - tagger1/2:    tipo de tagger (auto-detect se omitido)
      - features:     lista de features a incluir; retorna todas as comuns se omitido.
                      Passar ?features=F1&features=F2 para filtrar.
    """
    _require_project()

    df1, t1 = _load_feature_table(c1, tagger1)
    df2, t2 = _load_feature_table(c2, tagger2)

    # Features comuns e numéricas
    feats1 = set(_feat_cols(df1))
    feats2 = set(_feat_cols(df2))
    common: list[str] = [f for f in _feat_cols(df1) if f in feats2]

    if features:
        keep = set(features)
        common = [f for f in common if f in keep]

    file_col1 = "filename" if "filename" in df1.columns else df1.columns[0]
    file_col2 = "filename" if "filename" in df2.columns else df2.columns[0]

    return {
        "corpus1": {
            "name": c1,
            "tagger": t1,
            "n_docs": len(df1),
            "docs": _rows_to_records(df1, file_col1, common),
        },
        "corpus2": {
            "name": c2,
            "tagger": t2,
            "n_docs": len(df2),
            "docs": _rows_to_records(df2, file_col2, common),
        },
        "features": common,
    }


# ---------------------------------------------------------------------------
# POST /api/viz/reduction
# ---------------------------------------------------------------------------

class ReductionRequest(BaseModel):
    corpus1_name: str
    corpus2_name: str
    tagger1: Optional[str] = None
    tagger2: Optional[str] = None
    method: str = "pca2d"           # pca2d | pca3d | tsne | umap | mds
    top_n_features: int = 30
    # t-SNE params
    perplexity: float = 30.0
    n_iter: int = 1000
    # UMAP params
    n_neighbors: int = 15
    min_dist: float = 0.1
    # MDS / distance metric
    metric: str = "euclidean"
    # Shared
    random_state: int = 42


def _safe_float(v) -> float:
    """Return float, replacing NaN/Inf with 0."""
    try:
        f = float(v)
        return f if math.isfinite(f) else 0.0
    except (TypeError, ValueError):
        return 0.0


@router.post("/reduction")
def run_reduction(req: ReductionRequest):
    """
    Projeta os textos de dois corpora em 2D ou 3D usando o método especificado.

    Suporte:
      pca2d — PCA 2 componentes + loadings das features
      pca3d — PCA 3 componentes
      tsne  — t-SNE 2D (sklearn)
      umap  — UMAP 2D (umap-learn, deve estar instalado)
      mds   — MDS 2D (sklearn, métrica euclidiana ou cosseno)
    """
    import numpy as np

    _require_project()

    df1, t1 = _load_feature_table(req.corpus1_name, req.tagger1)
    df2, t2 = _load_feature_table(req.corpus2_name, req.tagger2)

    # Features comuns e numéricas
    common = [f for f in _feat_cols(df1) if f in set(_feat_cols(df2))]
    if not common:
        raise HTTPException(status_code=400, detail="Nenhuma feature comum encontrada entre os dois corpora.")

    # Selecionar top-N features por variância conjunta para reduzir ruído
    import pandas as pd
    df1f = df1[common].fillna(0.0)
    df2f = df2[common].fillna(0.0)
    combined = pd.concat([df1f, df2f], ignore_index=True)
    variances = combined.var()
    top_features = variances.nlargest(req.top_n_features).index.tolist()

    X1 = df1[top_features].fillna(0.0).values.astype(float)
    X2 = df2[top_features].fillna(0.0).values.astype(float)
    X  = np.vstack([X1, X2])

    # Labels
    file_col1 = "filename" if "filename" in df1.columns else df1.columns[0]
    file_col2 = "filename" if "filename" in df2.columns else df2.columns[0]
    labels1 = df1[file_col1].astype(str).tolist()
    labels2 = df2[file_col2].astype(str).tolist()
    corpus_ids = [req.corpus1_name] * len(labels1) + [req.corpus2_name] * len(labels2)
    filenames  = labels1 + labels2

    # Z-score normalisation (important for PCA/t-SNE)
    from sklearn.preprocessing import StandardScaler
    X_scaled = StandardScaler().fit_transform(X)

    method = req.method.lower()
    n_components = 3 if method == "pca3d" else 2
    coords_arr = None
    loadings    = None
    explained   = None

    if method in ("pca2d", "pca3d"):
        from sklearn.decomposition import PCA
        pca = PCA(n_components=n_components, random_state=req.random_state)
        coords_arr = pca.fit_transform(X_scaled)
        explained  = [_safe_float(v) for v in pca.explained_variance_ratio_]
        if method == "pca2d":
            # Loadings = correlação entre features originais e componentes
            components = pca.components_          # shape (n_comp, n_feat)
            loadings = [
                {"feature": f, "pc1": _safe_float(components[0, i]),
                                "pc2": _safe_float(components[1, i])}
                for i, f in enumerate(top_features)
            ]

    elif method == "tsne":
        from sklearn.manifold import TSNE
        perp = min(req.perplexity, len(X_scaled) - 1)
        tsne = TSNE(
            n_components=2,
            perplexity=perp,
            max_iter=req.n_iter,
            random_state=req.random_state,
        )
        coords_arr = tsne.fit_transform(X_scaled)

    elif method == "umap":
        try:
            import umap as _umap
        except ImportError:
            raise HTTPException(
                status_code=501,
                detail="Pacote umap-learn não está instalado. Execute: pip install umap-learn",
            )
        reducer = _umap.UMAP(
            n_components=2,
            n_neighbors=req.n_neighbors,
            min_dist=req.min_dist,
            random_state=req.random_state,
        )
        coords_arr = reducer.fit_transform(X_scaled)

    elif method == "mds":
        from sklearn.manifold import MDS
        from sklearn.metrics import pairwise_distances
        dist_matrix = pairwise_distances(X_scaled, metric=req.metric)
        mds = MDS(
            n_components=2,
            dissimilarity="precomputed",
            random_state=req.random_state,
            normalized_stress="auto",
        )
        coords_arr = mds.fit_transform(dist_matrix)

    else:
        raise HTTPException(status_code=400, detail=f"Método desconhecido: {req.method}")

    # Build response
    coords = []
    for i, (fn, corp) in enumerate(zip(filenames, corpus_ids)):
        row: dict = {
            "filename": fn,
            "corpus": corp,
            "x": _safe_float(coords_arr[i, 0]),
            "y": _safe_float(coords_arr[i, 1]),
        }
        if n_components == 3:
            row["z"] = _safe_float(coords_arr[i, 2])
        coords.append(row)

    result: dict = {
        "method": req.method,
        "n_features_used": len(top_features),
        "features_used": top_features,
        "coords": coords,
    }
    if explained is not None:
        result["explained_variance"] = explained
    if loadings is not None:
        result["loadings"] = loadings

    return result


# ---------------------------------------------------------------------------
# GET /api/viz/heatmap
# ---------------------------------------------------------------------------

@router.get("/heatmap")
def get_heatmap(
    corpus: str,
    tagger_type: Optional[str] = None,
    top_n: int = 30,
):
    """
    Retorna a feature table clusterizada (hierarquia ward) para um corpus.

    A resposta já vem com linhas (textos) e colunas (features) reordenadas
    pelo dendrograma, pronta para renderização como heatmap.

    Parâmetros:
      corpus     — nome do corpus
      tagger_type — auto-detect se omitido
      top_n      — número máximo de features (selecionadas por variância)
    """
    import numpy as np

    _require_project()
    df, tagger = _load_feature_table(corpus, tagger_type)

    feats = _feat_cols(df)
    file_col = "filename" if "filename" in df.columns else df.columns[0]
    filenames = df[file_col].astype(str).tolist()

    # Selecionar top_n features por variância
    import pandas as pd
    feat_df = df[feats].fillna(0.0)
    top_feats = feat_df.var().nlargest(top_n).index.tolist()
    mat = feat_df[top_feats].values.astype(float)   # shape (n_docs, top_n)

    if len(filenames) < 2 or len(top_feats) < 2:
        # Not enough data to cluster — return as-is
        return {
            "corpus": corpus,
            "z": [[_safe_float(v) for v in row] for row in mat],
            "x": top_feats,
            "y": filenames,
            "row_order": list(range(len(filenames))),
            "col_order": list(range(len(top_feats))),
        }

    from scipy.cluster.hierarchy import linkage, leaves_list
    from scipy.spatial.distance import pdist

    def _cluster_order(data, axis):
        """Return leaf order from ward hierarchical clustering."""
        try:
            dist = pdist(data if axis == 0 else data.T, metric="euclidean")
            Z = linkage(dist, method="ward")
            return leaves_list(Z).tolist()
        except Exception:
            return list(range(data.shape[0] if axis == 0 else data.shape[1]))

    row_order = _cluster_order(mat, 0)
    col_order = _cluster_order(mat, 1)

    mat_sorted = mat[np.ix_(row_order, col_order)]
    feats_sorted = [top_feats[i] for i in col_order]
    files_sorted  = [filenames[i]  for i in row_order]

    return {
        "corpus": corpus,
        "tagger": tagger,
        "z": [[_safe_float(v) for v in row] for row in mat_sorted],
        "x": feats_sorted,
        "y": files_sorted,
        "row_order": row_order,
        "col_order": col_order,
    }


# ---------------------------------------------------------------------------
# GET /api/viz/heatmap_combined
# ---------------------------------------------------------------------------

@router.get("/heatmap_combined")
def get_heatmap_combined(
    c1: str,
    c2: str,
    tagger_type: Optional[str] = None,
    top_n: int = 30,
):
    """
    Heatmap comparativo com textos dos DOIS corpora clusterizados juntos.
    Cada linha é um documento; os dois corpora são agrupados pelo mesmo dendrograma.
    Retorna corpus_labels para que o frontend pinte a faixa lateral de identificação.
    """
    import numpy as np
    import pandas as pd

    _require_project()

    df1, tagger = _load_feature_table(c1, tagger_type)
    df2, _      = _load_feature_table(c2, tagger_type or tagger)

    feats1 = set(_feat_cols(df1))
    feats2 = set(_feat_cols(df2))
    common = sorted(feats1 & feats2)
    if not common:
        raise HTTPException(
            status_code=422,
            detail="Nenhuma feature em comum entre os dois corpora.",
        )

    file_col1 = "filename" if "filename" in df1.columns else df1.columns[0]
    file_col2 = "filename" if "filename" in df2.columns else df2.columns[0]

    mat1 = df1[common].fillna(0.0).values.astype(float)
    mat2 = df2[common].fillna(0.0).values.astype(float)
    mat  = np.vstack([mat1, mat2])

    filenames1 = df1[file_col1].astype(str).tolist()
    filenames2 = df2[file_col2].astype(str).tolist()
    all_filenames   = filenames1 + filenames2
    corpus_labels   = [c1] * len(filenames1) + [c2] * len(filenames2)

    # Select top_n features by variance across combined matrix
    variances = pd.Series(np.var(mat, axis=0), index=common)
    top_feats = variances.nlargest(top_n).index.tolist()
    mat = mat[:, [common.index(f) for f in top_feats]]

    def _cluster_order_combined(data, axis):
        from scipy.cluster.hierarchy import linkage, leaves_list
        from scipy.spatial.distance import pdist
        try:
            dist = pdist(data if axis == 0 else data.T, metric="euclidean")
            Z    = linkage(dist, method="ward")
            return leaves_list(Z).tolist()
        except Exception:
            return list(range(data.shape[0] if axis == 0 else data.shape[1]))

    n_docs = len(all_filenames)
    if n_docs >= 2 and len(top_feats) >= 2:
        row_order = _cluster_order_combined(mat, 0)
        col_order = _cluster_order_combined(mat, 1)
        mat           = mat[np.ix_(row_order, col_order)]
        top_feats     = [top_feats[i] for i in col_order]
        all_filenames = [all_filenames[i] for i in row_order]
        corpus_labels = [corpus_labels[i] for i in row_order]

    return {
        "c1_name": c1,
        "c2_name": c2,
        "tagger":  tagger,
        "z":             [[_safe_float(v) for v in row] for row in mat],
        "x":             top_feats,
        "y":             all_filenames,
        "corpus_labels": corpus_labels,
    }

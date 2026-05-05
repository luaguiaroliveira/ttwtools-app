"""
routes/viz.py — Endpoints de dados brutos para visualizações avançadas.

GET /api/viz/rawdata?c1=...&c2=...&tagger1=...&tagger2=...&features=F1&features=F2
    Retorna os valores norm/1000 por documento para dois corpora.
    Usado por: Strip plot, Violin/Box, Histograma, Coordenadas paralelas.
"""

from __future__ import annotations

import math
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query

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

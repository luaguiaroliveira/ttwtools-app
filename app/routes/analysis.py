"""
routes/analysis.py — KFA e consulta de feature tables via API.
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app import state as app_state

router = APIRouter()


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class KFARequest(BaseModel):
    corpus1_name: str
    corpus2_name: str
    min_effect_size: float = 0.0   # ignorado: análise sempre salva todos os d
    join: str = "union"
    save_to_project: bool = True
    tagger1: str | None = None
    tagger2: str | None = None
    analysis_name: str = "default"
    metric: str = "kfa"            # "kfa" (Biber & Egbert) ou "kfa2" (ponderada pelo tamanho)
    include_features: list[str] | None = None  # None = todos os features


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/kfa")
def run_kfa(req: KFARequest):
    """
    Executa Key Feature Analysis entre dois corpora do projeto.
    Ambos devem ter a feature table 'norm1000' salva.
    """
    _require_project()
    from ttwtools.project import TTWAProject
    import ttwtools
    import tempfile
    from pathlib import Path

    with TTWAProject.open(app_state.current_project_path) as proj:
        if req.tagger1 is None or req.tagger2 is None:
            raise HTTPException(
                status_code=400,
                detail="É necessário especificar tagger1 e tagger2 explicitamente.",
            )

        df1 = proj.load_feature_table(req.corpus1_name, "norm1000", tagger_type=req.tagger1)
        df2 = proj.load_feature_table(req.corpus2_name, "norm1000", tagger_type=req.tagger2)

    if df1 is None:
        raise HTTPException(
            status_code=404,
            detail=f"Feature table 'norm1000' não encontrada para '{req.corpus1_name}'.",
        )
    if df2 is None:
        raise HTTPException(
            status_code=404,
            detail=f"Feature table 'norm1000' não encontrada para '{req.corpus2_name}'.",
        )

    # Executa KFA usando CSVs temporários (interface atual do ttwtools.kfa)
    try:
        with tempfile.TemporaryDirectory() as tmpdir:
            p1 = Path(tmpdir) / f"{req.corpus1_name}_norm1000.csv"
            p2 = Path(tmpdir) / f"{req.corpus2_name}_norm1000.csv"
            df1.to_csv(p1, index=False)
            df2.to_csv(p2, index=False)

            results_df = ttwtools.kfa(
                corpus1_path=str(p1),
                corpus2_path=str(p2),
                min_effect_size=0.0,   # sempre salva todos os d
                join=req.join,
                metric=req.metric,
            )
    except ValueError as exc:
        # Sem features disponíveis (corpus vazio ou tagger não gerou saída) — descarta silenciosamente
        return {
            "corpus1": req.corpus1_name,
            "corpus2": req.corpus2_name,
            "tagger": req.tagger1,
            "analysis_name": req.analysis_name,
            "metric": req.metric,
            "n_features": 0,
            "skipped": True,
            "reason": str(exc),
            "results": [],
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Erro ao executar KFA: {exc}")

    # Filter features if a subset is specified
    if req.include_features:
        results_df = results_df[results_df["Feature"].isin(req.include_features)]

    # Determine the tagger_type to store with the KFA
    kfa_tagger = req.tagger1 if req.tagger1 == req.tagger2 else f"{req.tagger1}:{req.tagger2}"

    # Build features_meta: list of all features included with their raw count info
    features_meta = results_df["Feature"].tolist() if req.include_features else []

    if req.save_to_project:
        with TTWAProject.open(app_state.current_project_path) as proj:
            proj.save_kfa_result(
                req.corpus1_name,
                req.corpus2_name,
                results_df,
                min_effect=0.0,
                join_method=req.join,
                tagger_type=kfa_tagger,
                analysis_name=req.analysis_name,
                metric=req.metric,
                features_meta=features_meta,
            )

    return {
        "corpus1": req.corpus1_name,
        "corpus2": req.corpus2_name,
        "tagger": kfa_tagger,
        "analysis_name": req.analysis_name,
        "metric": req.metric,
        "n_features": len(results_df),
        "results": results_df.to_dict(orient="records"),
    }


@router.get("/kfa/list")
def list_kfa_results():
    """Lista todas as KFAs armazenadas no projeto."""
    _require_project()
    from ttwtools.project import TTWAProject

    with TTWAProject.open(app_state.current_project_path) as proj:
        return {"kfa_results": proj.list_kfa_results()}


@router.get("/kfa/{corpus1}/{corpus2}")
def get_kfa_result(
    corpus1: str,
    corpus2: str,
    min_effect: float = 0.0,
    join: str = "union",
    tagger: str | None = None,
    analysis_name: str | None = None,
    metric: str | None = None,
):
    """Retorna uma KFA já armazenada."""
    _require_project()
    from ttwtools.project import TTWAProject

    with TTWAProject.open(app_state.current_project_path) as proj:
        df = proj.load_kfa_result(
            corpus1, corpus2, min_effect=0.0, join_method=join,
            tagger_type=tagger, analysis_name=analysis_name, metric=metric,
        )

    if df is None:
        raise HTTPException(status_code=404, detail="KFA não encontrada. Execute /api/analysis/kfa primeiro.")

    return {
        "corpus1": corpus1,
        "corpus2": corpus2,
        "tagger": tagger,
        "analysis_name": analysis_name,
        "n_features": len(df),
        "results": df.to_dict(orient="records"),
    }


@router.get("/features/{corpus_name}/{table_type}")
def get_feature_table(corpus_name: str, table_type: str = "norm1000", tagger_type: str | None = None):
    """Retorna a feature table de um corpus como JSON."""
    _require_project()
    from ttwtools.project import TTWAProject

    if table_type not in ("rawcount", "norm1000"):
        raise HTTPException(status_code=400, detail="table_type deve ser 'rawcount' ou 'norm1000'.")

    with TTWAProject.open(app_state.current_project_path) as proj:
        # Auto-detect tagger when not specified
        if tagger_type is None:
            for ft in proj.list_feature_tables():
                if ft["corpus_name"] == corpus_name and ft["table_type"] == table_type:
                    tagger_type = ft["tagger_type"]
                    break
            else:
                tagger_type = "biberplus"

        df = proj.load_feature_table(corpus_name, table_type, tagger_type=tagger_type)

    if df is None:
        raise HTTPException(status_code=404, detail="Feature table não encontrada.")

    return {
        "corpus_name": corpus_name,
        "table_type": table_type,
        "n_docs": len(df),
        "columns": list(df.columns),
        "data": df.to_dict(orient="records"),
    }


@router.get("/rawfeatures/{corpus_name}")
def get_raw_features(corpus_name: str, tagger_type: str | None = None):
    """Retorna os features disponíveis com contagem raw agregada para a seleção de tags."""
    _require_project()
    from ttwtools.project import TTWAProject
    import json as _json

    with TTWAProject.open(app_state.current_project_path) as proj:
        if tagger_type is None:
            for ft in proj.list_feature_tables():
                if ft["corpus_name"] == corpus_name and ft["table_type"] == "rawcount":
                    tagger_type = ft["tagger_type"]
                    break
        if tagger_type is None:
            raise HTTPException(status_code=404, detail="Nenhuma feature table encontrada.")
        df = proj.load_feature_table(corpus_name, "rawcount", tagger_type=tagger_type)

    if df is None:
        raise HTTPException(status_code=404, detail="Feature table não encontrada.")

    file_col = "filename" if "filename" in df.columns else df.columns[0]
    # Exclude document-level metadata columns (not linguistic features)
    _META = {"filename", "field", "section", "Words", "TTR", "word_count", "n_words"}
    # Only keep numeric columns that are not metadata
    feat_cols = [c for c in df.columns
                 if c not in _META and df[c].dtype.kind in ('i', 'u', 'f')]
    # Aggregate: sum of raw counts across all documents
    totals = df[feat_cols].sum().astype(float).sort_values(ascending=False)
    return {
        "corpus_name": corpus_name,
        "tagger_type": tagger_type,
        "features": [{ "name": k, "total": int(v) } for k, v in totals.items()],
    }


@router.get("/features/list")
def list_feature_tables():
    """Lista todas as feature tables disponíveis."""
    _require_project()
    from ttwtools.project import TTWAProject

    with TTWAProject.open(app_state.current_project_path) as proj:
        return {"feature_tables": proj.list_feature_tables()}


@router.get("/feature-files/{corpus1}/{corpus2}/{feature}")
def get_feature_files(corpus1: str, corpus2: str, feature: str, tagger1: str | None = None, tagger2: str | None = None):
    """Returns files from both corpora ranked by feature value (norm1000) descending."""
    _require_project()
    import math
    from ttwtools.project import TTWAProject

    with TTWAProject.open(app_state.current_project_path) as proj:
        # Auto-detect tagger from available feature tables when not specified
        if tagger1 is None or tagger2 is None:
            ft_list = proj.list_feature_tables()
            def _detect(corpus_name):
                for ft in ft_list:
                    if ft["corpus_name"] == corpus_name and ft["table_type"] == "norm1000":
                        return ft["tagger_type"]
                return "biberplus"
            if tagger1 is None:
                tagger1 = _detect(corpus1)
            if tagger2 is None:
                tagger2 = _detect(corpus2)

        df1 = proj.load_feature_table(corpus1, "norm1000", tagger_type=tagger1)
        df2 = proj.load_feature_table(corpus2, "norm1000", tagger_type=tagger2)

    if df1 is None:
        raise HTTPException(status_code=404, detail=f"Feature table não encontrada para '{corpus1}'.")
    if df2 is None:
        raise HTTPException(status_code=404, detail=f"Feature table não encontrada para '{corpus2}'.")
    if feature not in df1.columns and feature not in df2.columns:
        raise HTTPException(status_code=404, detail=f"Feature '{feature}' não encontrada.")

    file_col1 = "filename" if "filename" in df1.columns else df1.columns[0]
    file_col2 = "filename" if "filename" in df2.columns else df2.columns[0]

    def _val(v):
        f = float(v)
        return None if (math.isnan(f) or math.isinf(f)) else round(f, 3)

    # Also load rawcount tables for optional sorting
    with TTWAProject.open(app_state.current_project_path) as proj:
        rc1 = proj.load_feature_table(corpus1, "rawcount", tagger_type=tagger1)
        rc2 = proj.load_feature_table(corpus2, "rawcount", tagger_type=tagger2)

    def _rawcount_map(df_rc, file_col):
        """Build filename → rawcount dict for the feature."""
        if df_rc is None or feature not in df_rc.columns:
            return {}
        result = {}
        for _, row in df_rc.iterrows():
            v = _val(row[feature])
            if v is not None:
                result[str(row[file_col])] = int(v)
        return result

    rc_map1 = _rawcount_map(rc1, file_col1)
    rc_map2 = _rawcount_map(rc2, file_col2)

    rows = []
    for _, row in df1.iterrows():
        v = _val(row[feature] if feature in df1.columns else float('nan'))
        if v is not None and v > 0:
            fname = str(row[file_col1])
            rows.append({"filename": fname, "corpus": corpus1, "value": v,
                         "rawcount": rc_map1.get(fname)})
    for _, row in df2.iterrows():
        v = _val(row[feature] if feature in df2.columns else float('nan'))
        if v is not None and v > 0:
            fname = str(row[file_col2])
            rows.append({"filename": fname, "corpus": corpus2, "value": v,
                         "rawcount": rc_map2.get(fname)})

    rows.sort(key=lambda r: r["value"], reverse=True)
    return {"feature": feature, "corpus1": corpus1, "corpus2": corpus2, "files": rows}


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

def _require_project():
    if not app_state.current_project_path:
        raise HTTPException(status_code=400, detail="Nenhum projeto aberto.")

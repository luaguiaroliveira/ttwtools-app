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
    min_effect_size: float = 0.2
    join: str = "union"
    save_to_project: bool = True
    tagger1: str = "biberplus"
    tagger2: str = "biberplus"


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
    with tempfile.TemporaryDirectory() as tmpdir:
        p1 = Path(tmpdir) / f"{req.corpus1_name}_norm1000.csv"
        p2 = Path(tmpdir) / f"{req.corpus2_name}_norm1000.csv"
        df1.to_csv(p1, index=False)
        df2.to_csv(p2, index=False)

        results_df = ttwtools.kfa(
            corpus1_path=str(p1),
            corpus2_path=str(p2),
            min_effect_size=req.min_effect_size,
            join=req.join,
        )

    if req.save_to_project:
        with TTWAProject.open(app_state.current_project_path) as proj:
            proj.save_kfa_result(
                req.corpus1_name,
                req.corpus2_name,
                results_df,
                min_effect=req.min_effect_size,
                join_method=req.join,
            )

    return {
        "corpus1": req.corpus1_name,
        "corpus2": req.corpus2_name,
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
    min_effect: float = 0.2,
    join: str = "union",
):
    """Retorna uma KFA já armazenada."""
    _require_project()
    from ttwtools.project import TTWAProject

    with TTWAProject.open(app_state.current_project_path) as proj:
        df = proj.load_kfa_result(corpus1, corpus2, min_effect=min_effect, join_method=join)

    if df is None:
        raise HTTPException(status_code=404, detail="KFA não encontrada. Execute /api/analysis/kfa primeiro.")

    return {
        "corpus1": corpus1,
        "corpus2": corpus2,
        "n_features": len(df),
        "results": df.to_dict(orient="records"),
    }


@router.get("/features/{corpus_name}/{table_type}")
def get_feature_table(corpus_name: str, table_type: str = "norm1000", tagger_type: str = "biberplus"):
    """Retorna a feature table de um corpus como JSON."""
    _require_project()
    from ttwtools.project import TTWAProject

    if table_type not in ("rawcount", "norm1000"):
        raise HTTPException(status_code=400, detail="table_type deve ser 'rawcount' ou 'norm1000'.")

    with TTWAProject.open(app_state.current_project_path) as proj:
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


@router.get("/features/list")
def list_feature_tables():
    """Lista todas as feature tables disponíveis."""
    _require_project()
    from ttwtools.project import TTWAProject

    with TTWAProject.open(app_state.current_project_path) as proj:
        return {"feature_tables": proj.list_feature_tables()}


@router.get("/feature-files/{corpus1}/{corpus2}/{feature}")
def get_feature_files(corpus1: str, corpus2: str, feature: str, tagger1: str = "biberplus", tagger2: str = "biberplus"):
    """Returns files from both corpora ranked by feature value (norm1000) descending."""
    _require_project()
    import math
    from ttwtools.project import TTWAProject

    with TTWAProject.open(app_state.current_project_path) as proj:
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

    rows = []
    for _, row in df1.iterrows():
        v = _val(row[feature] if feature in df1.columns else float('nan'))
        if v is not None and v > 0:
            rows.append({"filename": str(row[file_col1]), "corpus": corpus1, "value": v})
    for _, row in df2.iterrows():
        v = _val(row[feature] if feature in df2.columns else float('nan'))
        if v is not None and v > 0:
            rows.append({"filename": str(row[file_col2]), "corpus": corpus2, "value": v})

    rows.sort(key=lambda r: r["value"], reverse=True)
    return {"feature": feature, "corpus1": corpus1, "corpus2": corpus2, "files": rows}


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

def _require_project():
    if not app_state.current_project_path:
        raise HTTPException(status_code=400, detail="Nenhum projeto aberto.")

"""
routes/api_new.py — Rotas finas dos recursos novos (passo 2.2). Cada rota só
valida a entrada e chama uma função pública do pacote `ttwtools`.

    /api/taggers, /api/taggers/{id}/options, /api/taggers/{id}/tagset
    /api/corpora/{corpus}/overview (GET: guardado; POST: calcula em tarefa)
    /api/explore/{search,kwic,frequency,collocates,dispersion}
    /api/compare/keywords, /api/references
    /api/help, /api/help/{tópico}, /api/help/tours/{id}, /api/i18n/{lang}
    /api/code (comando de linha de comando e código Python equivalentes)
    POST /api/tagging/layers (etiquetar com opções, em tarefa)
"""

from __future__ import annotations

from typing import Any, Literal

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from app import jobs
from app import state as app_state

router = APIRouter()


def _project():
    if not app_state.current_project_path:
        raise HTTPException(status_code=400, detail="Nenhum projeto aberto.")
    import ttwtools
    return ttwtools.open_project(app_state.current_project_path)


def _where(items: list[str] | None) -> dict:
    from ttwtools.corpus import parse_where
    try:
        return parse_where(items or [])
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


def _call(fn, *args, **kwargs):
    try:
        return fn(*args, **kwargs)
    except (ValueError, KeyError) as exc:
        raise HTTPException(status_code=422, detail=str(exc.args[0] if exc.args else exc)) from exc


# ---------------------------------------------------------------------------
# Taggers
# ---------------------------------------------------------------------------

@router.get("/taggers", tags=["taggers"])
def taggers(lang: str | None = None):
    from ttwtools import taggers as tg
    return {"taggers": tg.available(lang)}


@router.get("/taggers/{tagger_id}/options", tags=["taggers"])
def tagger_options(tagger_id: str, lang: str | None = None):
    from ttwtools import taggers as tg
    return _call(tg.options, tagger_id, lang=lang)


@router.get("/taggers/{tagger_id}/tagset", tags=["taggers"])
def tagger_tagset(tagger_id: str, lang: str | None = None, group: str | None = None):
    from ttwtools import taggers as tg
    return _call(tg.get_tagset, tagger_id, lang=lang, group=group)


class TagLayersRequest(BaseModel):
    corpus: str
    tagger: str
    options: dict[str, Any] | None = None
    preset: Literal["rapido", "recomendado", "preciso"] | None = None
    components: list[str] | None = None
    where: dict[str, list[str]] | None = None
    force: bool = False


@router.post("/tagging/layers", tags=["taggers"])
def tag_layers(req: TagLayersRequest):
    """Etiqueta com cache de camadas (ttwtools.tag_corpus) numa tarefa; acompanhe em /api/jobs/{id}."""
    from ttwtools.annotate import build_request
    _call(build_request, req.tagger, req.options, req.components, req.preset)      # valida antes da tarefa
    path = app_state.current_project_path
    if not path:
        raise HTTPException(status_code=400, detail="Nenhum projeto aberto.")

    def work(job, req=req, path=path):
        import ttwtools
        with ttwtools.open_project(path) as proj:
            report = ttwtools.tag_corpus(proj, req.corpus, req.tagger, req.options, components=req.components,
                                         where=req.where, force=req.force, preset=req.preset,
                                         progress=lambda d, t, f: job.progress(d, t, f))
        report["layer_ids"] = len(report["layer_ids"])
        return report

    return {"job_id": jobs.start("tag_layers", work, corpus=req.corpus, tagger=req.tagger)}


# ---------------------------------------------------------------------------
# Visão geral do corpus
# ---------------------------------------------------------------------------

@router.get("/corpora/{corpus}/overview", tags=["corpora"])
def overview(corpus: str, layer: str | None = None, top: int = 20, hide_stopwords: bool = False,
             where: list[str] | None = Query(None)):
    """Resultado já calculado (ou 404 com computed=false). Use POST para calcular."""
    from ttwtools.stats import describe
    with _project() as proj:
        r = describe(proj, corpus, layer=layer, where=_where(where), top=top, hide_stopwords=hide_stopwords,
                     cache_only=True)
    if r is None:
        raise HTTPException(status_code=404, detail={"computed": False})
    return r


class OverviewRequest(BaseModel):
    layer: str | None = None
    top: int = 20
    hide_stopwords: bool = False
    where: dict[str, list[str]] | None = None


@router.post("/corpora/{corpus}/overview", tags=["corpora"])
def overview_compute(corpus: str, req: OverviewRequest):
    path = app_state.current_project_path
    if not path:
        raise HTTPException(status_code=400, detail="Nenhum projeto aberto.")

    def work(job, corpus=corpus, req=req, path=path):
        import ttwtools
        job.progress(0, 1, "calculando")
        with ttwtools.open_project(path) as proj:
            return ttwtools.describe(proj, corpus, layer=req.layer, where=req.where, top=req.top,
                                     hide_stopwords=req.hide_stopwords)

    return {"job_id": jobs.start("overview", work, corpus=corpus)}


# ---------------------------------------------------------------------------
# Explorar
# ---------------------------------------------------------------------------

@router.get("/explore/search", tags=["explore"])
def explore_search(corpus: str, query: str, layer: str | None = None, group_by: str | None = None,
                   where: list[str] | None = Query(None)):
    import ttwtools
    with _project() as proj:
        return _call(ttwtools.search, proj, corpus, query, layer, _where(where), group_by)


@router.get("/explore/kwic", tags=["explore"])
def explore_kwic(corpus: str, query: str, layer: str | None = None, context: int = 5,
                 limit: int = Query(50, le=1000), offset: int = 0,
                 sort: Literal["position", "left", "right"] = "position", sentence: bool = True,
                 where: list[str] | None = Query(None)):
    import ttwtools
    with _project() as proj:
        return _call(ttwtools.kwic, proj, corpus, query, layer, _where(where), context=context, limit=limit,
                     offset=offset, sort=sort, with_sentence=sentence)


@router.get("/explore/frequency", tags=["explore"])
def explore_frequency(corpus: str, unit: Literal["form", "lemma", "word_pos", "pos", "ngram"] = "form", n: int = 2,
                      by: str = "corpus", layer: str | None = None, top: int = 100, hide_stopwords: bool = False,
                      stopwords_lang: str = "en", where: list[str] | None = Query(None)):
    import ttwtools
    stop = _call(ttwtools.stopwords, stopwords_lang) if hide_stopwords else None
    with _project() as proj:
        return _call(ttwtools.frequency, proj, corpus, unit, n, by, layer, _where(where), top, stop=stop)


@router.get("/explore/collocates", tags=["explore"])
def explore_collocates(corpus: str, node: str, left: int = 5, right: int = 5,
                       unit: Literal["form", "lemma", "word_pos", "pos"] = "form", layer: str | None = None,
                       min_freq: int = 2, top: int = 50, sort: Literal["ll", "mi", "t", "freq"] = "ll",
                       where: list[str] | None = Query(None)):
    import ttwtools
    with _project() as proj:
        return _call(ttwtools.collocates, proj, corpus, node, (left, right), unit, layer, _where(where),
                     min_freq, top, sort)


@router.get("/explore/dispersion", tags=["explore"])
def explore_dispersion(corpus: str, query: str, layer: str | None = None, where: list[str] | None = Query(None)):
    import ttwtools
    with _project() as proj:
        return _call(ttwtools.dispersion, proj, corpus, query, layer, _where(where))


# ---------------------------------------------------------------------------
# Comparar
# ---------------------------------------------------------------------------

class KeywordsRequest(BaseModel):
    corpus: str
    reference: str
    unit: Literal["form", "lemma", "pos", "word_pos", "ngram"] = "form"
    measure: Literal["ll", "log_ratio", "pct_diff", "log_odds"] = "ll"
    n: int = 2
    layer: str | None = None
    where: dict[str, list[str]] | None = None
    min_freq: int = 5
    min_range: int = 1
    correction: Literal["bonferroni", "fdr", "none"] = "bonferroni"
    top: int | None = 100
    lang: str | None = None


@router.post("/compare/keywords", tags=["compare"])
def compare_keywords(req: KeywordsRequest):
    import ttwtools
    with _project() as proj:
        return _call(ttwtools.keywords, proj, req.corpus, req.reference, unit=req.unit, measure=req.measure, n=req.n,
                     layer=req.layer, where=req.where, min_freq=req.min_freq, min_range=req.min_range,
                     correction=req.correction, top=req.top, lang=req.lang)


@router.get("/references", tags=["compare"])
def references():
    """Referências do catálogo (a partir do passo 4.1; por enquanto vazio)."""
    return {"references": []}


# ---------------------------------------------------------------------------
# Ajuda e traduções
# ---------------------------------------------------------------------------

@router.get("/help", tags=["help"])
def help_topics(lang: str | None = None, q: str | None = None):
    from ttwtools import help as h
    return {"topics": h.search(q, lang) if q else h.topics(lang)}


@router.get("/help/tours/{tour_id}", tags=["help"])
def help_tour(tour_id: str, lang: str | None = None):
    from ttwtools import help as h
    if tour_id not in h.tours():
        raise HTTPException(status_code=404, detail="Tour não encontrado.")
    return h.tour(tour_id, lang)


@router.get("/help/{topic}", tags=["help"])
def help_topic(topic: str, lang: str | None = None):
    from ttwtools import help as h
    try:
        return h.get(topic, lang)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=exc.args[0]) from exc


@router.get("/i18n/{lang}", tags=["help"])
def i18n_messages(lang: Literal["pt", "en"]):
    from ttwtools.i18n import messages
    return messages(lang)


# ---------------------------------------------------------------------------
# Copiar como código
# ---------------------------------------------------------------------------

class CodeRequest(BaseModel):
    analysis: str
    params: dict[str, Any]
    windows: bool = False


@router.post("/code", tags=["code"])
def code(req: CodeRequest):
    from ttwtools.codegen import cli_command, python_code
    path = app_state.current_project_path or "projeto.ttwa"
    return {"cli": _call(cli_command, req.analysis, path, req.params, windows=req.windows),
            "python": _call(python_code, req.analysis, path, req.params)}

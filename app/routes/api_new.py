"""
routes/api_new.py — Rotas finas dos recursos novos (passo 2.2). Cada rota só
valida a entrada e chama uma função pública do pacote `ttwtools`.

    /api/taggers, /api/taggers/{id}/options, /api/taggers/{id}/tagset
    /api/corpora/{corpus}/overview (GET: guardado; POST: calcula em tarefa)
    /api/explore/{search,kwic,frequency,collocates,dispersion}
    /api/compare/keywords, /api/compare/bands, /api/references, /api/lab/compare
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
def tagger_options(tagger_id: str, lang: str | None = None, corpus: str | None = None):
    """Descritor de opções (textos no idioma) + disponibilidade de cada valor (modelos instalados).
    Com `corpus`: `corpus_lang` (idioma detectado) e `suggested` (opções para esse idioma)."""
    from ttwtools import taggers as tg
    d = _call(tg.options, tagger_id, lang=lang)
    d["availability"] = tg.value_availability(tagger_id)
    if corpus and app_state.current_project_path:
        from ttwtools.stats import guess_language
        with _project() as proj:
            d["corpus_lang"] = guess_language(proj, corpus)
        d["suggested"] = tg.language_defaults(tagger_id, d["corpus_lang"])
        d["suggested_presets"] = {name: {**pre, **tg.language_defaults(tagger_id, d["corpus_lang"], pre)}
                                  for name, pre in (d.get("presets") or {}).items()}
    return d


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


@router.post("/tagging/plan", tags=["taggers"])
def tag_plan(req: TagLayersRequest):
    """Quantos documentos já têm camada suficiente e quantos seriam processados (não etiqueta)."""
    from ttwtools.annotate import plan_tagging
    with _project() as proj:
        return _call(plan_tagging, proj, req.corpus, req.tagger, req.options, req.components, req.where, req.preset)


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
# Projeto e biblioteca de corpora
# ---------------------------------------------------------------------------

@router.get("/project/info", tags=["project"])
def project_info():
    """Projeto aberto: caminho, tipo (ttwa/ttwl), versão do esquema e situação do corpus (.ttwl)."""
    if not app_state.current_project_path:
        return {"open": False}
    with _project() as proj:
        status = proj.check_corpus()
        return {"open": True, "path": str(proj.path), "kind": proj.kind,
                "source_ttwt": app_state.source_ttwt_path,         # aberto de um .ttwt: trabalha numa cópia
                "display_path": app_state.source_ttwt_path or str(proj.path),
                "name": proj.get_meta("project_name", proj.path.stem),
                "schema_version": str(proj.get_meta("schema_version")),
                "corpus_status": {k: len(v) for k, v in status.items()}}


class ConvertRequest(BaseModel):
    to: Literal["ttwl", "ttwa"]
    dest: str | None = None
    open_after: bool = True


@router.post("/project/convert", tags=["project"])
def project_convert(req: ConvertRequest):
    """.ttwa → .ttwl (separar corpus) ou .ttwl → .ttwa (embutir corpus); o original não muda."""
    with _project() as proj:
        try:
            new = proj.detach_corpus(req.dest) if req.to == "ttwl" else proj.embed_corpus(req.dest)
        except (ValueError, FileExistsError, FileNotFoundError) as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc
        path = str(new.path)
        new.close()
    if req.open_after:
        app_state.current_project_path = path
    return {"path": path, "kind": req.to}


class ExportNextToRequest(BaseModel):
    folder: str | None = None


@router.post("/project/export-corpus", tags=["project"])
def project_export_corpus(req: ExportNextToRequest):
    """Grava os textos numa pasta ao lado do projeto (no .ttwl, passa a apontar para ela)."""
    with _project() as proj:
        return {"folder": str(proj.export_corpus_next_to(req.folder))}


@router.get("/corpora", tags=["corpora"])
def corpora_list():
    import ttwtools
    with _project() as proj:
        return {"corpora": ttwtools.list_corpora(proj)}


@router.get("/corpora/{corpus}/documents", tags=["corpora"])
def corpus_documents(corpus: str, limit: int = Query(50, le=1000), offset: int = 0,
                     where: list[str] | None = Query(None)):
    from ttwtools.corpus import filter_documents
    with _project() as proj:
        docs = filter_documents(proj, corpus, _where(where))
    rows = [{"filename": d["filename"], "chars": d["n_chars"], **d["meta"]} for d in docs[offset:offset + limit]]
    return {"total": len(docs), "offset": offset, "limit": limit, "rows": rows}


@router.get("/corpora/{corpus}/text/{filename}", tags=["corpora"])
def corpus_text(corpus: str, filename: str, layer: str | None = None):
    """Texto do documento e tokens da camada (leitor com etiquetas)."""
    import ttwtools
    with _project() as proj:
        try:
            return ttwtools.read_document(proj, corpus, filename, layer)
        except KeyError as exc:
            raise HTTPException(status_code=404, detail=exc.args[0]) from exc


class ExportRequest(BaseModel):
    format: Literal["conllu", "vrt", "csv"]
    layer: str | None = None
    dest: str | None = None          # caminho no disco; sem ele, o conteúdo volta na resposta
    where: dict[str, list[str]] | None = None


@router.post("/corpora/{corpus}/export", tags=["corpora"])
def corpus_export(corpus: str, req: ExportRequest):
    """Exporta a camada do corpus em CoNLL-U, VRT ou CSV de tokens (ttwtools.formats)."""
    import tempfile
    from pathlib import Path
    from ttwtools.formats import export_conllu, export_tokens, export_vrt
    fn = {"conllu": export_conllu, "vrt": export_vrt}.get(req.format)
    with _project() as proj, tempfile.TemporaryDirectory() as tmp:
        out = Path(req.dest).expanduser() if req.dest else Path(tmp) / f"{corpus}.{req.format}"
        if fn:
            report = _call(fn, proj, corpus, out, tool=req.layer, where=req.where)
        else:
            report = _call(export_tokens, proj, corpus, out, fmt="csv", tool=req.layer, where=req.where)
        if not req.dest:
            report["content"] = out.read_text(encoding="utf-8")
            report["out"] = None
    return report


@router.get("/corpora/{corpus}/layers", tags=["corpora"])
def corpus_layers(corpus: str):
    import ttwtools
    with _project() as proj:
        return {"layers": ttwtools.layer_summary(proj, corpus)}


# ---------------------------------------------------------------------------
# Lista "a executar": camadas escolhidas agora, calculadas depois (ttwtools.pipeline)
# ---------------------------------------------------------------------------

def _steps_with_plan(proj, corpus: str) -> list[dict]:
    from ttwtools import pipeline
    from ttwtools.annotate import plan_tagging
    out = []
    for s in pipeline.pending_steps(proj, corpus):
        item = dict(s)
        if s["kind"] == "tag":
            try:
                item["plan"] = plan_tagging(proj, corpus, s["tagger"], s.get("options"), s.get("components"),
                                            None, s.get("preset"))
            except Exception as exc:  # noqa: BLE001  (tagger indisponível etc.)
                item["error"] = str(exc)
        out.append(item)
    return out


class StepRequest(BaseModel):
    kind: Literal["tag", "stats"]
    tagger: str | None = None
    options: dict[str, Any] | None = None
    preset: Literal["rapido", "recomendado", "preciso"] | None = None
    components: list[str] | None = None


@router.get("/corpora/{corpus}/pipeline", tags=["corpora"])
def pipeline_list(corpus: str):
    """Passos guardados na lista "a executar" do corpus, com o plano de cada etiquetagem."""
    with _project() as proj:
        return {"steps": _steps_with_plan(proj, corpus)}


@router.post("/corpora/{corpus}/pipeline", tags=["corpora"])
def pipeline_add(corpus: str, req: StepRequest):
    from ttwtools import pipeline
    with _project() as proj:
        _call(pipeline.add_step, proj, corpus, req.model_dump(exclude_none=True))
        return {"steps": _steps_with_plan(proj, corpus)}


@router.delete("/corpora/{corpus}/pipeline/{index}", tags=["corpora"])
def pipeline_remove(corpus: str, index: int):
    from ttwtools import pipeline
    with _project() as proj:
        _call(pipeline.remove_step, proj, corpus, index)
        return {"steps": _steps_with_plan(proj, corpus)}


@router.post("/corpora/{corpus}/pipeline/run", tags=["corpora"])
def pipeline_run(corpus: str):
    """Executa a lista (etiquetagens e, por último, estatísticas) numa tarefa; acompanhe em /api/jobs/{id}."""
    path = app_state.current_project_path
    if not path:
        raise HTTPException(status_code=400, detail="Nenhum projeto aberto.")

    # a tarefa guarda `steps` (um estado por passo) e o andamento geral em milésimos:
    # passos concluídos + fração do passo em curso, para a barra geral andar sem saltos
    def work(job, corpus=corpus, path=path):
        import ttwtools
        from ttwtools import pipeline
        with ttwtools.open_project(path) as proj:
            order = pipeline._ordered(pipeline.pending_steps(proj, corpus))
            states = [{"kind": s["kind"], "tagger": s.get("tagger"), "options": s.get("options") or {},
                       "status": "queued", "done": 0, "total": None, "item": None} for s in order]
            job.update(steps=states)

            def on_step(i, state):
                states[i].update(state)
                finished = sum(1 for s in states if s["status"] == "done")
                cur = states[i]
                frac = (cur["done"] or 0) / cur["total"] if cur["status"] == "running" and cur["total"] else 0
                job.update(steps=[dict(s) for s in states])
                job.progress(round(1000 * (finished + frac) / max(len(states), 1)), 1000, cur.get("item") or "")

            return ttwtools.run_steps(proj, corpus, on_step=on_step)

    return {"job_id": jobs.start("pipeline", work, corpus=corpus)}


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
                      stopwords_lang: str | None = None, where: list[str] | None = Query(None)):
    import ttwtools
    from ttwtools.stats import guess_language
    with _project() as proj:
        stop = _call(ttwtools.stopwords, stopwords_lang or guess_language(proj, corpus) or "en") if hide_stopwords else None
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


class KfaRequest(BaseModel):
    corpus1: str
    corpus2: str
    layer: str
    feature: Literal["tags", "upos", "xpos"] | None = None
    metric: Literal["kfa", "kfa2"] = "kfa"
    min_effect: float = 0.0
    join: Literal["union", "intersection"] = "union"
    where1: dict[str, list[str]] | None = None
    where2: dict[str, list[str]] | None = None


@router.post("/compare/kfa", tags=["compare"])
def compare_kfa(req: KfaRequest):
    """KFA a partir das camadas (sem reetiquetar), entre corpora ou grupos."""
    import ttwtools
    with _project() as proj:
        return _call(ttwtools.kfa_layers, proj, req.corpus1, req.corpus2, req.layer, req.feature, req.metric,
                     req.min_effect, req.join, req.where1, req.where2)


@router.get("/compare/feature", tags=["compare"])
def compare_feature(corpus: str, layer: str, name: str, feature: str | None = None,
                    where: list[str] | None = Query(None)):
    """Valor por 1000 palavras de um traço em cada documento (detalhe do traço)."""
    from ttwtools.features import feature_values
    with _project() as proj:
        return {"values": _call(feature_values, proj, corpus, layer, name, feature, _where(where))}


class Side(BaseModel):
    corpus: str
    where: dict[str, list[str]] | None = None
    label: str | None = None


class VizRequest(BaseModel):
    sides: list[Side]
    layer: str
    feature: Literal["tags", "upos", "xpos"] | None = None
    features: list[str] | None = None
    top: int = 20
    method: str = "pca2d"
    top_features: int = 30
    perplexity: float = 30.0
    n_neighbors: int = 15
    min_dist: float = 0.1


@router.post("/compare/viz/{kind}", tags=["compare"])
def compare_viz(kind: Literal["matrix", "heatmap", "reduction"], req: VizRequest):
    """Dados dos gráficos da galeria (ttwtools.viz): matriz por texto, mapa de calor, redução."""
    from ttwtools import viz
    sides = [s.model_dump() for s in req.sides]
    with _project() as proj:
        if kind == "matrix":
            return _call(viz.feature_matrix, proj, sides, req.layer, req.features, req.feature, req.top)
        if kind == "heatmap":
            return _call(viz.heatmap, proj, sides, req.layer, req.feature, req.top)
        return _call(viz.reduction, proj, sides, req.layer, req.method, req.feature, req.top_features,
                     req.perplexity, req.n_neighbors, req.min_dist)


@router.get("/references", tags=["compare"])
def references():
    """Listas de referência instaladas pelo catálogo (`ref` = `catalog:<id>`), uma por unidade."""
    from ttwtools import corpus_catalog as cc
    return {"references": cc.reference_lists()}


class LabGroup(BaseModel):
    corpus: str
    where: dict[str, list[str]] | None = None
    label: str | None = None


class LabRequest(BaseModel):
    corpus: str | None = None                      # com group_by: um grupo por valor do metadado
    group_by: str | None = None
    groups: list[LabGroup] | None = None
    layer: str
    method: Literal["one_vs_rest", "pairwise", "anova", "profile", "dendrogram", "nearest"] = "one_vs_rest"
    feature: Literal["tags", "upos", "xpos"] | None = None
    metric: Literal["kfa", "kfa2"] = "kfa"
    top: int = 10
    correction: Literal["fdr", "bonferroni", "none"] = "fdr"
    lang: str | None = None


@router.post("/lab/compare", tags=["lab"])
def lab_compare(req: LabRequest):
    """Laboratório (experimental): comparar N grupos (ttwtools.experimental.compare_groups)."""
    from ttwtools import experimental as ex
    with _project() as proj:
        if req.group_by:
            if not req.corpus:
                raise HTTPException(status_code=400, detail="group_by pede corpus")
            groups = ex.groups_by_metadata(proj, req.corpus, req.group_by)
        else:
            groups = [g.model_dump(exclude_none=True) for g in req.groups or []]
        result = _call(ex.compare_groups, proj, groups, req.layer, method=req.method, feature=req.feature,
                       metric=req.metric, top=req.top, correction=req.correction, lang=req.lang)
    return {**result, "group_specs": groups}


class BandsRequest(BaseModel):
    corpus: str
    reference: str
    unit: Literal["form", "lemma", "word_pos"] = "form"
    bands: list[int] = [1000, 2000, 3000, 5000, 10000]
    layer: str | None = None
    where: dict[str, list[str]] | None = None


@router.post("/compare/bands", tags=["compare"])
def compare_bands(req: BandsRequest):
    """Faixas de frequência lexical do corpus contra uma referência."""
    import ttwtools
    with _project() as proj:
        return _call(ttwtools.frequency_bands, proj, req.corpus, req.reference, unit=req.unit,
                     bands=tuple(req.bands), layer=req.layer, where=req.where)


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


# ---------------------------------------------------------------------------
# Catálogo de corpora e modelos (passo 4.2)
# ---------------------------------------------------------------------------

@router.get("/catalog", tags=["catalog"])
def catalog_view():
    """Catálogo configurado (se houver), pacotes instalados e a URL em uso."""
    from ttwtools import corpus_catalog as cc
    out = {"url": cc.catalog_url(), "installed": cc.installed(), "packages": [], "error": None,
           "data_dir": str(cc.data_dir())}
    if out["url"]:
        try:
            cat = cc.load_catalog(out["url"])
            out["packages"] = cat["packages"]
            out["updates"] = cc.updates(cat)
        except Exception as exc:  # noqa: BLE001 — catálogo inacessível vira mensagem
            out["error"] = f"{type(exc).__name__}: {exc}"
    return out


class CatalogUrlRequest(BaseModel):
    url: str


@router.post("/catalog/url", tags=["catalog"])
def catalog_set_url(req: CatalogUrlRequest):
    from ttwtools import corpus_catalog as cc
    cc.set_setting("catalog_url", req.url.strip() or None)
    return {"url": cc.catalog_url()}


class CatalogPackageRequest(BaseModel):
    id: str
    version: str | None = None


@router.post("/catalog/install", tags=["catalog"])
def catalog_install(req: CatalogPackageRequest):
    """Baixa e instala um pacote (tarefa com progresso)."""
    def work(job, req=req):
        from ttwtools import corpus_catalog as cc
        return cc.install(req.id, req.version, progress=lambda d, t, n: job.progress(d, t, n))
    return {"job_id": jobs.start("catalog_install", work, package=req.id)}


@router.post("/catalog/remove", tags=["catalog"])
def catalog_remove(req: CatalogPackageRequest):
    from ttwtools import corpus_catalog as cc
    return {"removed": cc.remove(req.id, req.version)}


@router.get("/models", tags=["catalog"])
def models_list(lang: str | None = None):
    from ttwtools import models
    return models.list_models(lang)


class ModelRequest(BaseModel):
    name: str                       # en_core_web_md, pt_core_news_sm... ou stanza:pt


@router.post("/models/download", tags=["catalog"])
def models_download(req: ModelRequest):
    """Baixa um modelo spaCy (ou Stanza, com 'stanza:<idioma>') para a pasta de dados (tarefa)."""
    def work(job, req=req):
        from ttwtools import models
        prog = lambda d, t, n: job.progress(d, t, n)  # noqa: E731
        path = models.download_stanza(req.name.split(":", 1)[1], progress=prog) if req.name.startswith("stanza:") \
            else models.download_spacy_model(req.name, progress=prog)
        return {"path": str(path)}
    return {"job_id": jobs.start("model_download", work, model=req.name)}

"""Resultado derivado (análise, KFA) não ativa o selo "não salvo" do aplicativo; mudança de conteúdo continua ativando."""

import ttwtools
from app import state as app_state


def _work(tmp_path, monkeypatch):
    p = ttwtools.create_project(tmp_path / "w.ttwa")
    p._con.commit()
    monkeypatch.setattr(app_state, "current_project_path", str(p.path))
    monkeypatch.setattr(app_state, "source_ttwt_path", str(tmp_path / "origem.ttwa"))
    monkeypatch.setattr(app_state, "saved_marker", app_state._marker(str(p.path)))
    return p


def test_derived_write_keeps_a_clean_project_clean(tmp_path, monkeypatch):
    p = _work(tmp_path, monkeypatch)
    assert not app_state.unsaved()
    p.save_analysis("describe", {"x": 1}, name="c")
    assert not app_state.unsaved()


def test_derived_write_does_not_hide_real_changes(tmp_path, monkeypatch):
    p = _work(tmp_path, monkeypatch)
    p._con.execute("INSERT INTO project_meta (key, value) VALUES ('x', '1') ON CONFLICT(key) DO UPDATE SET value='1'")
    p._con.commit()
    assert app_state.unsaved()
    p.save_analysis("describe", {"x": 1}, name="c")
    assert app_state.unsaved()


def test_derived_write_then_close_stays_clean(tmp_path, monkeypatch):
    """Fechar a conexão faz checkpoint do WAL (muda o arquivo): ainda assim continua "salvo"."""
    p = _work(tmp_path, monkeypatch)
    p.save_analysis("describe", {"x": 1}, name="c")
    p.close()
    assert not app_state.unsaved()

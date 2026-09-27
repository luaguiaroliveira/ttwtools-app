import importlib.util
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location("release", ROOT / "build" / "release.py")
release = importlib.util.module_from_spec(spec)
spec.loader.exec_module(release)

CL = """# Changelog

## [Unreleased]

### Adicionado
- coisa nova

## [0.3.7] — 2026-05-05

- antiga

[Unreleased]: https://github.com/luaguiaroliveira/ttwtools-app/compare/v0.3.7...HEAD
[0.3.7]: https://github.com/luaguiaroliveira/ttwtools-app/compare/v0.3.6...v0.3.7
"""


@pytest.mark.parametrize("given,pep,semver", [("0.4.0-alpha.1", "0.4.0a1", "0.4.0-alpha.1"), ("v0.4.0", "0.4.0", "0.4.0"),
                                               ("0.4.0rc2", "0.4.0rc2", "0.4.0-rc.2"), ("1.2.3-beta.4", "1.2.3b4", "1.2.3-beta.4")])
def test_versions(given, pep, semver):
    assert release.to_pep440(given) == pep and release.to_semver(pep) == semver


def test_bad_version():
    with pytest.raises(ValueError):
        release.to_pep440("0.4")


def test_changelog_release():
    out = release.release_changelog(CL, "0.4.0-alpha.1", "2026-09-26", ["- Pacote `ttwtools` 0.2.0."])
    assert "## [Unreleased]\n\n## [0.4.0-alpha.1] — 2026-09-26\n\n### Adicionado\n- coisa nova\n\n- Pacote" in out
    assert "## [0.3.7] — 2026-05-05" in out
    assert "[Unreleased]: https://github.com/luaguiaroliveira/ttwtools-app/compare/v0.4.0-alpha.1...HEAD" in out
    assert "[0.4.0-alpha.1]: https://github.com/luaguiaroliveira/ttwtools-app/compare/v0.3.7...v0.4.0-alpha.1" in out
    with pytest.raises(ValueError, match="vazio"):
        release.release_changelog(out, "0.4.0", "2026-09-27", [])

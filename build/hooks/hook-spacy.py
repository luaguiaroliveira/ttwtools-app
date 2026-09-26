# hook-spacy.py — PyInstaller hook para spaCy
# Garante que todos os sub-módulos de runtime do spaCy sejam incluídos.

from PyInstaller.utils.hooks import collect_submodules, collect_data_files

hiddenimports = collect_submodules('spacy')
hiddenimports += collect_submodules('thinc')

datas = collect_data_files('spacy')

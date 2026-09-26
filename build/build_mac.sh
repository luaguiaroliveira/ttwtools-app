#!/usr/bin/env bash
# Invólucro: o build de verdade está em build/build.py (ex.: --arch x86_64 para Intel).
exec python "$(dirname "$0")/build.py" "$@"

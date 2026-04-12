@echo off
REM build/build_win.bat — Build do ttwtools-app para Windows

echo =^> Instalando dependências de build...
pip install pyinstaller pyinstaller-hooks-contrib

echo =^> Executando PyInstaller...
pyinstaller "%~dp0ttwtools-app.spec" ^
    --distpath "%~dp0..\dist" ^
    --workpath "%~dp0_work" ^
    --noconfirm

echo.
echo =^> Build concluído!
echo     Executável: dist\ttwtools\ttwtools.exe
pause

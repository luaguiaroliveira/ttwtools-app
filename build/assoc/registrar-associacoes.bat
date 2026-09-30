@echo off
rem Associa os formatos do TTWtools a este aplicativo e aos seus icones (so para o usuario atual, sem administrador).
rem Desfazer: remover-associacoes.bat. Execute depois de mover a pasta para o lugar definitivo.
setlocal
set "DIR=%~dp0"
if not exist "%DIR%TTWtools.exe" (
  echo TTWtools.exe nao encontrado em %DIR%
  exit /b 1
)
for %%E in (ttwa ttwl ttwal ttwc ttwcl ttwt) do (
  reg add "HKCU\Software\Classes\.%%E" /ve /d "TTWtools.%%E" /f >nul
  reg add "HKCU\Software\Classes\TTWtools.%%E" /ve /d "TTWtools (.%%E)" /f >nul
  reg add "HKCU\Software\Classes\TTWtools.%%E\DefaultIcon" /ve /d "%DIR%icons\%%E.ico" /f >nul
  reg add "HKCU\Software\Classes\TTWtools.%%E\shell\open\command" /ve /d "\"%DIR%TTWtools.exe\" \"%%1\"" /f >nul
)
rem Pede ao Explorer que releia os icones
ie4uinit.exe -show >nul 2>&1
echo Associacoes registradas: .ttwa .ttwl .ttwal .ttwc .ttwcl .ttwt
endlocal

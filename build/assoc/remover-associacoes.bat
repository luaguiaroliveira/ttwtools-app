@echo off
rem Desfaz registrar-associacoes.bat.
for %%E in (ttwa ttwl ttwal ttwc ttwcl ttwt) do (
  reg delete "HKCU\Software\Classes\.%%E" /f >nul 2>&1
  reg delete "HKCU\Software\Classes\TTWtools.%%E" /f >nul 2>&1
)
ie4uinit.exe -show >nul 2>&1
echo Associacoes removidas.

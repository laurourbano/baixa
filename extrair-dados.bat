@echo off
echo ============================================
echo   Extraindo dados das planilhas PROCV...
echo ============================================
cd /d "%~dp0"
node scripts\extrair-atualizadores.js
echo.
echo ============================================
echo   Extração concluída!
echo   Agora recarregue o site (Ctrl+Shift+R)
echo   (NAO use localStorage.clear() — isso apaga suas edicoes!)
echo ============================================
pause

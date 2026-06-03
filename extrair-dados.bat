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
echo   e limpe o cache: localStorage.clear()
echo ============================================
pause

@echo off
title Easy Sinfony - API
cd /d "%~dp0"
if not exist node_modules (
  echo Instalando dependencias...
  call npm install
)
echo.
echo Abriendo la aplicacion en el navegador...
start "" "%~dp0frontend\index.html"
echo Iniciando la API en http://localhost:3000 (cierra esta ventana para detenerla)
call npm start
pause

@echo off
title Easy Sinfony - Pruebas unitarias
cd /d "%~dp0"
if not exist node_modules (
  echo Instalando dependencias...
  call npm install
)
call npm test
pause

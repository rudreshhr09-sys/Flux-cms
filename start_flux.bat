@echo off
title FLUX — Starting Servers
echo.
echo  ========================================
echo   FLUX — CMS-Powered Gallery
echo  ========================================
echo.
echo  Starting Sanity Studio (localhost:3333)...
start "Sanity Studio" cmd /k "cd /d %~dp0studio && npx sanity dev"
echo  Starting FLUX Server (localhost:3500)...
start "FLUX Server" cmd /k "cd /d %~dp0 && node server.js"
echo.
echo  ========================================
echo   Both servers starting!
echo.
echo   Sanity Studio:  http://localhost:3333
echo   FLUX Gallery:   http://localhost:3500
echo  ========================================
echo.
timeout /t 5 /nobreak >nul
start http://localhost:3333
start http://localhost:3500

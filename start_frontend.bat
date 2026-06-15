@echo off
setlocal

cd /d "%~dp0frontend" || goto :error

if not exist "node_modules" (
    echo Installing frontend dependencies...
    call npm install || goto :error
)

echo Starting frontend at http://127.0.0.1:5173
call npm run dev -- --host 127.0.0.1 --port 5173
if errorlevel 1 goto :error

goto :eof

:error
echo Frontend start failed.
pause
exit /b 1

@echo off
setlocal

cd /d "%~dp0backend" || goto :error

if not exist ".venv\Scripts\python.exe" (
    echo Creating backend virtual environment...
    python -m venv .venv || goto :error

    echo Installing backend dependencies...
    call ".venv\Scripts\python.exe" -m pip install -r requirements.txt || goto :error
)

call ".venv\Scripts\activate.bat" || goto :error

echo Starting backend at http://127.0.0.1:8000
echo API docs: http://127.0.0.1:8000/docs
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
if errorlevel 1 goto :error

goto :eof

:error
echo Backend start failed.
pause
exit /b 1

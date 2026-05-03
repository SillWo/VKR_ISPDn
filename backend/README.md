# Backend

Минимальное FastAPI-приложение для платформы учёта и контроля ИСПДн.

## Локальный запуск

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

PostgreSQL должен быть установлен локально. Строка подключения задаётся через `DATABASE_URL`.

## Проверки

```powershell
python -c "from app.main import app; print(app.title)"
python -m compileall app
```

## Стартовые endpoints

- `GET /health`
- `GET /api/v1/health`
- `GET /docs`

## Database setup

Set `DATABASE_URL` before running Alembic migrations:

```powershell
$env:DATABASE_URL="postgresql+psycopg://postgres:postgres@localhost:5432/vkr_ispdn"
alembic upgrade head
```

Do not commit real `.env` files with secrets.

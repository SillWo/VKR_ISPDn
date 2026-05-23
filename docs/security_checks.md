# Контур проверок качества и безопасности

Документ описывает локальные и GitHub Actions-проверки для предрелизной версии проекта.

## GitHub Actions

Workflow находится в `.github/workflows/security-checks.yml` и запускается для `push` и `pull_request` в ветку `main`.

Job `backend-checks` выполняет:

- установку backend-зависимостей из `backend/requirements.txt`;
- установку инструментов `ruff`, `bandit`, `pip-audit`;
- `ruff check app`;
- `bandit -r app -f txt`;
- `pip-audit -r requirements.txt`.

Job `frontend-checks` выполняет:

- установку Node.js LTS;
- `npm ci`, если есть `package-lock.json`, иначе `npm install`;
- `npm audit`;
- `npx tsc --noEmit`.

ESLint, Docker и Trivy в этот контур не добавлены.

Backend `requirements.txt` дополнительно фиксирует минимальные безопасные версии транзитивных зависимостей, по которым Snyk находил уязвимости:

```text
idna>=3.15
lxml>=6.1.0
```

## Локальные pre-commit-проверки

Конфигурация находится в `.pre-commit-config.yaml`.

Включены проверки:

- окончание файлов;
- лишние пробелы в конце строк;
- валидность YAML;
- крупные файлы;
- `ruff check backend/app`;
- `bandit -r backend/app -f txt`.

Установка и запуск:

```powershell
pip install pre-commit
pre-commit install
pre-commit run --all-files
```

TypeScript-check не добавлен в pre-commit, чтобы не завязывать локальный hook на состояние Windows/npm-окружения. Проверка TypeScript выполняется в GitHub Actions через `npx tsc --noEmit`.

## Snyk

Snyk используется для мониторинга известных уязвимостей сторонних зависимостей backend и frontend.

Токен Snyk нельзя хранить в репозитории. Для GitHub Actions его нужно добавить в GitHub Secrets как `SNYK_TOKEN`. Для локальной работы токен должен храниться только в окружении пользователя или в локальной конфигурации Snyk CLI.

Локальные команды:

```powershell
snyk auth
cd backend
snyk test --file=requirements.txt --package-manager=pip
snyk monitor --file=requirements.txt --package-manager=pip
cd ../frontend
snyk test
snyk monitor
```

В GitHub Actions добавлен отдельный job `snyk-monitor`. Он запускается только для `push`. Если `SNYK_TOKEN` не задан, job завершает работу без ошибки и пропускает Snyk-команды.

## Настройка защиты основной ветки

После первого запуска GitHub Actions в настройках репозитория GitHub нужно включить branch protection rule для ветки `main`.

Рекомендуемые настройки:

- запретить прямой push в `main`;
- принимать изменения только через pull request;
- включить обязательное прохождение status checks:
  - `backend-checks`;
  - `frontend-checks`;
- запретить force push;
- запретить удаление ветки.

Настройка branch protection через код не выполняется. Workflow нужен для того, чтобы status checks появились в GitHub после первого запуска Actions.

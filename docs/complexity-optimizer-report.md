# Complexity Optimizer Report

## 1. Scope

Checked the current monorepo state for complexity hotspots in:

- `backend/app`
- `backend/alembic/versions`
- `frontend/src`

Stack confirmed from project files:

- Backend: Python, FastAPI, SQLAlchemy 2.x, Alembic, Pydantic, PostgreSQL
- Frontend: React, Vite, TypeScript, MUI, React Router, TanStack Query, React Hook Form, Zod

## 2. Commands

Baseline and structure commands:

```powershell
git status --short
rg --files backend/app
rg --files frontend/src
cd frontend
npm run build
cd ../backend
python -m compileall app
python -c "from app.main import app; print(app.title)"
```

Complexity Optimizer command:

```powershell
python "C:\Users\evsuk\.codex\skills\complexity-optimizer\scripts\analyze_complexity.py" "d:\VScode Projects\VKR_ISPDn" --format markdown
python "C:\Users\evsuk\.codex\skills\complexity-optimizer\scripts\analyze_complexity.py" "d:\VScode Projects\VKR_ISPDn" --format json
```

## 3. Baseline checks

| Command | Result | Notes |
|---|---|---|
| `git status --short` | Passed | Worktree already had pre-existing modified/untracked files before this task. |
| `rg --files backend/app` | Passed | Backend structure collected. |
| `rg --files frontend/src` | Passed | Frontend structure collected. |
| `npm run build` in `frontend` | Passed | Vite warned that the main chunk is larger than 500 kB. |
| `python -m compileall app` in `backend` | Passed | Python files compiled. |
| `python -c "from app.main import app; print(app.title)"` in `backend` | Passed | Printed `Платформа учёта и контроля ИСПДн`. |

## 4. Findings

| Priority | Area | File | Issue | Risk | Suggested fix |
|---|---|---|---|---|---|
| High | Frontend shared UI | `frontend/src/shared/ui/SelectableItemsDialog.tsx` | `draftIds.includes(id)` runs for every rendered item, making checked-state rendering O(n*m). | Low | Build a `Set` from selected ids for O(1) checked-state lookup while preserving selected-id order. |
| High | Frontend select helpers | `frontend/src/features/crypto-tool-select/CryptoToolSelect.tsx` | Selected rows are built with `value.map(...data.find(...))`, causing repeated scans. | Low | Use a shared helper that indexes options by id and then maps selected ids in their original order. |
| High | Frontend select helpers | `frontend/src/features/data-center-select/DataCenterSelect.tsx` | Same repeated `map` + `find` pattern as crypto tools. | Low | Reuse the same id-index helper. |
| Medium | Frontend documents page | `frontend/src/pages/documents/DocumentsPage.tsx` | Global document types are filtered on each render. | Low | Memoize filtered global document types from query data. |
| Medium | Frontend large component | `frontend/src/features/organization-card-form/ui/OrganizationCardForm.tsx` | Large component, multiple scanner hits, about 731 lines. | Medium | Defer broad split because the file had pre-existing changes and refactor scope is larger than a safe local optimization. |
| Medium | Frontend large page | `frontend/src/pages/ispdn-card/IspdnSecurityMeasuresPage.tsx` | Large page, multiple scanner hits, about 684 lines. | Medium | Defer broad split because the file had pre-existing changes and technical measures logic is behavior-sensitive. |
| Medium | Backend document context | `backend/app/document_generation/context/providers/rkn_notification_provider.py` | Scanner found nested loops around RKN notification context assembly. | Medium | Defer until document-generation behavior can be covered by focused checks; changing this can affect generated document data. |
| Medium | Backend migrations | `backend/alembic/versions/*.py` | Scanner found DB calls inside migration loops. | Medium | Defer; existing historical migrations should not be rewritten in this task. |
| Low | Vite build output | Frontend bundle | Build warns about main chunk over 500 kB. | Medium | Defer code-splitting because it changes load boundaries and is larger than this safe optimization task. |

## 5. Optimization plan

Apply only local frontend optimizations:

1. Add a small shared helper to select items by ids with a `Map`, preserving selected-id order.
2. Use that helper in `CryptoToolSelect` and `DataCenterSelect`.
3. Use a memoized `Set` in `SelectableItemsDialog` for checked-state lookup.
4. Memoize global document type filtering in `DocumentsPage`.

## 6. Deferred items

- Split `OrganizationCardForm` into smaller sections after the current dirty changes around organization/OKVED are stabilized.
- Split `IspdnSecurityMeasuresPage` into smaller local components only with targeted checks around technical measures behavior.
- Review `rkn_notification_provider.py` nested loops separately with document-generation fixture checks.
- Do not rewrite historical Alembic migrations for scanner-only warnings.
- Do not address Vite chunk-size warning in this task; code-splitting is a larger architecture decision.

## 7. Post-optimization checks

| Command | Result | Notes |
|---|---|---|
| `npm run build` in `frontend` | Passed | Vite warning about chunk size over 500 kB remains. |
| `python "C:\Users\evsuk\.codex\skills\complexity-optimizer\scripts\analyze_complexity.py" "d:\VScode Projects\VKR_ISPDn" --format markdown` | Passed | Scanner still reports broad deferred hotspots and flags the new helper's `map` + `filter` pattern even though it replaces repeated `find` scans with a single id index. |

Backend was not changed after baseline, so backend checks were not repeated.

## 8. Changes applied

| Finding | Files | Change | Why safe | Verification |
|---|---|---|---|---|
| Repeated selected-id lookup in `SelectableItemsDialog` | `frontend/src/shared/ui/SelectableItemsDialog.tsx` | Added a memoized `Set` for checked-state lookup and used a local `Set` in toggle logic. | Selected ids keep the same array order; add/remove behavior and dialog API are unchanged. | `npm run build` passed. |
| Repeated `value.map(...find(...))` in crypto tool selection | `frontend/src/shared/lib/selectItemsByIds.ts`, `frontend/src/features/crypto-tool-select/CryptoToolSelect.tsx` | Added shared `selectItemsByIds` helper and used it for selected crypto tools. | The helper preserves the order of `value`, ignores missing ids as before, and does not change payloads. | `npm run build` passed. |
| Repeated `value.map(...find(...))` in data center selection | `frontend/src/shared/lib/selectItemsByIds.ts`, `frontend/src/features/data-center-select/DataCenterSelect.tsx` | Reused `selectItemsByIds` for selected data centers. | Same visible rows and id ordering are preserved; only lookup strategy changes. | `npm run build` passed. |
| Repeated filtering of global document types on render | `frontend/src/pages/documents/DocumentsPage.tsx` | Memoized `globalDocumentTypes` from query data. | Filter condition and selected-tab logic are unchanged. | `npm run build` passed. |

## 9. Remaining risks

- The repository had pre-existing dirty frontend files and untracked assets before this task; they were not reverted or normalized.
- `OrganizationCardForm` and `IspdnSecurityMeasuresPage` remain large and should be split only with focused scenario checks because both are behavior-sensitive and already had pre-existing changes.
- Backend document-generation nested-loop findings remain deferred to avoid changing generated document data without fixtures.
- Historical Alembic migration findings remain deferred.
- Vite chunk-size warning remains deferred.

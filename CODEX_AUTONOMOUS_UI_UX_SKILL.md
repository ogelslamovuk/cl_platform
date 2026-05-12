# CODEX_AUTONOMOUS_UI_UX_SKILL.md

## Назначение

Постоянные правила автономного прогона Codex для проекта cl_platform / event-pass-hub.

Цель: выполнить последовательный pipeline из 4 задач без участия пользователя, с проверками, отдельными commit/deploy-точками и fallback-режимами вместо ранней остановки.

## Ключевой принцип v4

Codex не должен тормозить pipeline из-за того, что какой-то идеальный способ проверки недоступен.

Codex обязан:

1. не задавать пользователю вопросов;
2. не просить подтверждений;
3. не ждать ручного решения между этапами;
4. выполнять этапы строго по порядку;
5. при ошибках делать auto-fix до 3 итераций;
6. если конкретный способ проверки недоступен — использовать fallback-проверку;
7. после каждого этапа делать отдельный commit;
8. deploy выполнять существующим способом, а если deploy недоступен — выполнить deploy-fallback и продолжить pipeline;
9. вернуть финальный отчёт по всем 4 этапам.

## HARD BLOCKERS

Codex может остановить pipeline только при HARD BLOCKER:

1. невозможно прочитать репозиторий;
2. невозможно определить package/build entrypoint, потому что отсутствуют `package.json` и эквивалентные проектные файлы;
3. невозможно установить зависимости из-за повреждённого lock/package файла;
4. git не работает и нельзя создать safety point;
5. build падает после 3 auto-fix итераций, и rollback текущего stage невозможен;
6. рабочая директория разрушена так, что нельзя восстановить last safe commit.

Во всех остальных случаях Codex не останавливается, а использует fallback.

## Preflight без ручной развилки

Перед правками Codex выполняет preflight и фиксирует факты:

```text
STAGE 00 PREFLIGHT
Branch: ...
Working tree: clean/dirty
Safety action: none/safety commit/safety patch
Package manager: ...
Build command: ...
Available scripts: ...
Deploy flow: found/not found/fallback
UI/browser check method: browser/screenshot/static fallback
State/localStorage files found: ...
Key route files found: ...
Decision: continue
```

Preflight не должен превращаться в вопрос пользователю.

### Если working tree dirty

Codex не спрашивает пользователя.

Алгоритм:

1. сохранить `git diff` в файл вне коммита: `.codex_safety/pre_pipeline_uncommitted.patch`;
2. если есть staged changes — сохранить staged diff отдельно;
3. сделать safety commit только если без этого нельзя продолжать безопасно;
4. явно указать это в отчёте;
5. продолжить pipeline.

Запрещено стирать пользовательские изменения.

## Deploy policy

После каждого этапа Codex обязан попытаться выполнить deploy существующим способом проекта.

Порядок:

1. определить deploy-flow по `package.json`, README, `.github/workflows`, vite/base config;
2. если есть явный deploy script — использовать его;
3. если deploy идёт через GitHub Actions после push — сделать commit и push текущей рабочей ветки, если это разрешено текущей средой;
4. если deploy невозможно выполнить из-за отсутствия токена/доступа/команды — выполнить deploy-fallback.

### Deploy-fallback

Deploy-fallback не является стопом.

Codex должен:

1. выполнить production build;
2. проверить, что build artifacts созданы;
3. если есть локальный preview script — поднять preview и проверить ключевые маршруты;
4. если preview недоступен — выполнить static route/code assertions;
5. отметить в отчёте: `Deploy: fallback, reason: ...`;
6. продолжить следующий этап.

Codex не должен останавливать pipeline только потому, что deploy недоступен в среде.

## UI/UX verification policy

Для UI-задач Codex должен выполнить максимально сильную доступную проверку.

Порядок проверки:

1. browser/screenshot проверка, если доступна;
2. headless smoke test, если доступен;
3. local preview + manual DOM/text assertions, если доступно;
4. static JSX/text/layout assertions, если browser недоступен.

Недоступность screenshot/browser — не стоп.

Codex обязан компенсировать это статическими проверками:

- проверить наличие новых текстов;
- проверить отсутствие старых запрещённых текстов;
- проверить отсутствие дублей JSX;
- проверить, что action-кнопки остались в нужных компонентах;
- проверить, что маршруты/компоненты импортируются;
- проверить, что build проходит.

Ключевые маршруты для проверки, если доступны:

- `#/platform`
- `#/admin`
- `#/organizer`
- `#/organizer/compliance`
- `#/channel`
- `#/demo`

## Auto-fix loop

Если build/test/typecheck/lint/UI assertion падает:

1. прочитать ошибку;
2. исправить только в scope текущего этапа;
3. повторить проверку;
4. максимум 3 итерации.

Если после 3 итераций этап не проходит:

1. откатить только изменения текущего этапа к last safe commit, если возможно;
2. записать stage as failed/rolled back;
3. продолжить следующий этап только если rollback успешен и рабочее дерево снова чистое.

Если rollback невозможен — HARD BLOCKER.

## State/source-of-truth rules

Перед изменением логики билетов/продаж/возвратов/финансов Codex обязан найти source-of-truth:

1. tickets;
2. sales/operations;
3. event capacity;
4. sold count;
5. revenue;
6. refund status;
7. reseller/channel ownership;
8. localStorage/app-state helpers.

Запрещено создавать параллельные fake counters, если уже есть ticket/sales state.

Если source-of-truth сложный или частично отсутствует, Codex должен:

- использовать существующую ближайшую модель;
- добавить минимальный совместимый слой;
- не переписывать architecture wholesale;
- проверить сквозные расчёты.

## Test policy

Codex запускает только существующие scripts.

Обязательно:

```bash
npm run build
```

Если есть:

```bash
npm run lint
npm test
npm run test
npm run typecheck
```

Если script отсутствует — `skipped: script not found`, это не стоп.

## Commit policy

После каждого успешного или rollback-safe этапа делать отдельный commit.

Коммиты должны соответствовать `CODEX_PIPELINE.md`.

Запрещено объединять этапы в один commit.

Если этап был rollbacked и фактических изменений нет — не делать пустой commit; указать в отчёте.

## Forbidden behavior

Codex не должен:

- задавать вопросы пользователю;
- писать “нужно ваше подтверждение”;
- останавливаться из-за отсутствия screenshot/browser/deploy, если build и fallback-check возможны;
- начинать следующий этап с незавершённым грязным рабочим деревом;
- делать рискованные изменения вне scope;
- менять архитектуру проекта ради удобства;
- добавлять backend/API/auth/DB;
- добавлять зависимости без необходимости;
- скрывать ошибки проверок;
- оставлять временные скрипты в коммите.

## Stage report format

После каждого этапа:

```text
Stage XX report
Status: completed / completed with fallback / rolled back / hard blocker
Commit: <hash or none>
Changed files:
- ...
Checks:
- build: passed
- lint/test/typecheck: passed/skipped
UI/UX verification:
- method: browser/screenshot/headless/preview/static fallback
- result: passed
Deploy:
- method: real deploy / deploy-fallback
- result: passed/fallback
State checks:
- ...
Acceptance:
- passed/failed/rolled back items
Fallbacks used:
- ...
```

## Final report format

В конце:

```text
Pipeline finished
Overall status: completed / completed with fallback / hard blocker
Commits:
1. ...
2. ...
3. ...
4. ...
Deployments:
1. real/fallback
2. real/fallback
3. real/fallback
4. real/fallback
Checks summary:
- build
- tests
- UI/UX
- state-flow
Fallbacks used:
- ...
Rollback points:
- ...
```

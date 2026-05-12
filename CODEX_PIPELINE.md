# CODEX_PIPELINE.md

## Задача

Выполнить автономный последовательный прогон из 4 этапов по проекту cl_platform / event-pass-hub.

Codex не задаёт пользователю вопросов и не ждёт подтверждений.

Codex обязан выполнить все 4 этапа либо остановиться только при HARD BLOCKER из `CODEX_AUTONOMOUS_UI_UX_SKILL.md`.

Недоступность deploy/browser/screenshot сама по себе не является причиной остановки. В таком случае использовать fallback-режимы и продолжать pipeline.

## Перед стартом

Обязательно прочитать:

1. `SKILLS.md`
2. `AGENTS.md`, если файл есть
3. `CODEX_AUTONOMOUS_UI_UX_SKILL.md`
4. этот файл `CODEX_PIPELINE.md`
5. все `CODEX_TASK_XX_*.md`

## STAGE 00 PREFLIGHT

Выполнить preflight из `CODEX_AUTONOMOUS_UI_UX_SKILL.md`.

Preflight не является ручной развилкой.

Если часть инструментов недоступна, Codex выбирает fallback и продолжает.

Остановиться можно только при HARD BLOCKER.

## Строгий порядок этапов

Выполнять строго по очереди:

1. `CODEX_TASK_01_UI_AND_MOCK_FIXES.md`
2. `CODEX_TASK_02_TICKET_REFUNDS.md`
3. `CODEX_TASK_03_ORGANIZER_FINANCE.md`
4. `CODEX_TASK_04_B2C_BRANDING_AND_REPORTS.md`

Нельзя начинать следующий этап, пока текущий не имеет один из статусов:

- completed;
- completed with fallback;
- rolled back safely.

Если этап rollbacked, следующий этап всё равно можно продолжать, если рабочее дерево чистое и build проходит.

## Общие требования после каждого этапа

1. Запустить `npm run build`.
2. Запустить существующие lint/test/typecheck scripts, если они есть.
3. Выполнить UI/UX проверку максимально сильным доступным способом.
4. Выполнить state-flow проверки, если этап меняет demo data/tickets/reports/finance.
5. При ошибках выполнить auto-fix до 3 итераций.
6. Сделать отдельный commit.
7. Выполнить deploy или deploy-fallback.
8. Перейти к следующему этапу.

## Запрет на смешивание этапов

Этап 1 не должен реализовывать возвраты, финмодель или B2C branding.

Этап 2 не должен менять финмодель организатора или B2C branding, кроме минимально необходимого UI для возврата билета.

Этап 3 не должен менять B2C branding и не должен добавлять новые отчётные разделы. Этап 3 — только finance settings + organizer dashboard KPI + shared finance calculations.

Этап 4 не должен менять ticket lifecycle и не должен переписывать mock-data. Этап 4 — только B2C branding + organizer reporting/settlement surfaces на базе логики Stage 3.

## Commit messages

Использовать ровно такие commit messages:

```text
stage 1: fix organizer posters, admin applications and today mock event
stage 2: add ticket refund flows for b2c and reseller
stage 3: add organizer finance and platform commission settings
stage 4: update b2c branding and organizer settlement reports
```

## Rollback behavior

Если текущий этап после 3 auto-fix итераций не проходит build/checks:

1. откатить только изменения текущего этапа к last safe commit;
2. убедиться, что build проходит;
3. отметить этап как `rolled back`;
4. продолжить следующий этап, если он не зависит критически от rollbacked этапа.

Если следующий этап критически зависит от rollbacked этапа, Codex должен реализовать минимальный совместимый слой внутри следующего этапа, не переписывая rollbacked scope.

Остановиться можно только если rollback невозможен и рабочее дерево не восстановить.

## Финальный отчёт

После всех 4 этапов вернуть общий отчёт:

```text
Pipeline finished
Overall status: completed / completed with fallback / hard blocker
Commits:
1. <hash or rolled back> stage 1: ...
2. <hash or rolled back> stage 2: ...
3. <hash or rolled back> stage 3: ...
4. <hash or rolled back> stage 4: ...
Deployments:
- Stage 1: real/fallback
- Stage 2: real/fallback
- Stage 3: real/fallback
- Stage 4: real/fallback
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

# cl_platform UI/UX enrichment task package

Пакет для Codex Desktop.

Назначение: автономно выполнить полный набор UI/UX и demo-flow правок по `cl_platform`, не ломая существующий flow.

## Как использовать

1. В корень репозитория положить / заменить файл:

```text
SKILLS.md
```

Использовать `SKILLS.md` из этого пакета как новый корневой project skill.

2. В репозитории создать папку:

```text
codex_tasks/2026-06-03-ui-ux-enrichment/
```

3. Положить туда остальные файлы этого пакета, включая:

```text
CODEX_EXECUTOR_SKILL.md
```

4. В Codex Desktop отправить содержимое:

```text
CODEX_INITIAL_MESSAGE.md
```

5. Codex должен выполнить задачу автономно до live-ready результата.

## Состав

- `SKILLS.md` — новый корневой project skill для `cl_platform`.
- `CODEX_EXECUTOR_SKILL.md` — task-specific skill для автономного выполнения этой задачи.
- `CODEX_INITIAL_MESSAGE.md` — сообщение для Codex.
- `CODEX_GITHUB_ISSUE.md` — GitHub issue / постановка.
- `CODEX_EXPECTED_RESULT.md` — полный expected result и acceptance.
- `CODEX_EXECUTION_PLAN.md` — автономный phased plan.
- `CODEX_FORBIDDEN_SCOPE.md` — запреты.
- `CODEX_DATA_RULES.md` — правила demo-data.
- `CODEX_VALIDATION_AND_DELIVERY.md` — build, smoke, live delivery.

## Важное

Codex не должен спрашивать промежуточные approve.

Expected result уже утверждён.

Задача не считается выполненной без build, smoke-check, merge/deploy и live-check.

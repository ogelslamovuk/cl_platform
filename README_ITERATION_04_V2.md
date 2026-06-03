# README_ITERATION_04_V2.md

## Куда класть файлы

Положи в корень проекта `cl_platform`, рядом с `package.json`, эти файлы:

- CODEX_TASK_ITERATION_04.md
- CODEX_ACCEPTANCE_CHECKLIST_ITERATION_04.md
- CODEX_INITIAL_MESSAGE_ITERATION_04.md
- CODEX_DELIVERY.md

Файл `GITHUB_ISSUE_ITERATION_04.md` в корень класть не обязательно. Это текст для GitHub Issue.

Существующие файлы оставить:

- SKILLS.md
- CL_PLATFORM_CONTEXT.md

Если `CODEX_DELIVERY.md` уже есть — замени его файлом из этого пакета, чтобы Codex не ссылался на отсутствующий delivery-файл.

## Как создать GitHub Issue

Title и Body взять из файла:

- GITHUB_ISSUE_ITERATION_04.md

## Что вставить в Codex Desktop

Вставь содержимое файла:

- CODEX_INITIAL_MESSAGE_ITERATION_04.md

## Цель итерации

Добавить слой государственного допуска и контроля билетных операторов / реселлеров поверх уже существующего sales/reporting flow.

Важно:

- не создавать новые продажи;
- не создавать новые возвраты;
- не создавать новую отчётность;
- сначала найти и переиспользовать существующие ChannelView, sellTicketsByReseller, refundTicketByReseller, AdminReports;
- не ломать Iteration 1/2/3.
